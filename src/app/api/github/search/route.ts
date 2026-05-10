/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { z } from "zod";

import { getToken } from "@/lib/auth/adapter";
import {
  buildIssueSearchQuery,
  filterByRepoQuality,
} from "@/lib/github/search";
import type {
  ViewerEngagementReason,
  ViewerSummary,
} from "@/lib/viewer-summary";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { botTokenPool } from "@/lib/github/token-pool";

// Guest users: 10 searches per minute. Auth users are not rate limited here.
const guestSearchLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export const dynamic = "force-dynamic";

const API_VERSION = "2022-11-28";
const API_BASE = "https://api.github.com";

// In-memory LRU-ish cache per filter hash (no page/cursor). 5m TTL, max 200. Per-instance only on serverless.
type CacheEntry = { data: unknown; expiresAt: number };
const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 200;

function makeCacheKey(filters: Filters, options: { global: boolean }): string {
  // Exclude pagination fields — cache is per unique query, not per page
  const { page: _p, cursor: _c, perPage: _pp, viewerLogin, ...queryFilters } = filters;
  
  // For global cache, we completely ignore viewerLogin.
  // For personalized cache, we MUST include it to prevent cross-contamination.
  const baseFilters = options.global 
    ? queryFilters 
    : { ...queryFilters, viewerLogin: viewerLogin || "guest" };

  // Sort keys so identical filters in different order produce the same key
  const sorted = Object.fromEntries(
    Object.entries(baseFilters).sort(([a], [b]) => a.localeCompare(b))
  );
  // Do NOT slice — truncation to 64 chars causes collisions between different filter combos
  return Buffer.from(JSON.stringify(sorted)).toString("base64");
}

function cacheGet(key: string): unknown | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    resultCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: unknown): void {
  // Evict oldest entry when at capacity
  if (resultCache.size >= CACHE_MAX) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
  resultCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

const FilterSchema = z.object({
  text: z.string().trim().max(120).optional().default(""),
  languages: z.array(z.string()).optional().default([]),
  labels: z.array(z.string()).optional(),
  zeroComments: z.boolean().optional().default(false),
  noAssignee: z.boolean().optional().default(true),
  issueAgeDays: z.number().int().min(1).max(3650).optional().default(30),
  minStars: z.number().int().min(0).optional().default(500),
  maxStars: z.number().int().min(0).optional().nullable().default(null),
  minForks: z.number().int().min(0).optional().default(100),
  maxForks: z.number().int().min(0).optional().nullable().default(null),
  repoPushedDays: z.number().int().min(1).max(3650).optional().default(30),
  hasContributing: z.boolean().optional().default(false),
  org: z.string().trim().optional(),
  onlyOrgs: z.boolean().optional().default(false),
  perPage: z.number().int().min(1).max(50).optional().default(20),
  page: z.number().int().min(1).optional().default(1),
  cursor: z.string().optional().nullable(),
  sort: z.enum(["created", "updated", "comments"]).optional().default("created"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  type: z.enum(["issue", "discussion"]).optional().default("issue"),
  activeMaintainer: z.boolean().optional().default(false),
  pairingRequested: z.boolean().optional().default(false),
  /** Logged-in viewer login — used only to label PR/assignee engagement (must match token) */
  viewerLogin: z.string().trim().max(39).optional(),
});

type Filters = z.infer<typeof FilterSchema>;

function isDefaultSearch(f: Filters) {
  return (
    f.text === "" &&
    f.languages.length === 0 &&
    (f.labels?.length === 1 && f.labels[0] === "good first issue") &&
    f.zeroComments === false &&
    f.issueAgeDays === 30 &&
    f.minStars === 500 &&
    f.maxStars === null &&
    f.minForks === 100 &&
    f.maxForks === null &&
    f.repoPushedDays === 30 &&
    f.noAssignee === true &&
    f.hasContributing === false &&
    !f.org &&
    f.onlyOrgs === false &&
    f.type === "issue" &&
    f.activeMaintainer === false &&
    f.pairingRequested === false
  );
}

function buildViewerSummary(
  viewerLogin: string | undefined,
  node: any,
  isDiscussion: boolean
): ViewerSummary | null {
  if (!viewerLogin) return null;
  const lc = viewerLogin.toLowerCase();
  const reasons: ViewerEngagementReason[] = [];
  const commentNodes = node.comments?.nodes || [];
  const viewerCommented = commentNodes.some(
    (c: { author?: { login?: string } }) => c.author?.login?.toLowerCase() === lc
  );

  if (isDiscussion) {
    if (node.viewerDidAuthor) reasons.push("authored");
    if (node.viewerHasUpvoted) reasons.push("upvoted");
    if (viewerCommented) reasons.push("commented");
    return { engaged: reasons.length > 0, reasons };
  }

  if (node.viewerDidAuthor) reasons.push("authored");
  if (viewerCommented) reasons.push("commented");
  const assignees = node.assignees?.nodes || [];
  if (assignees.some((a: { login?: string }) => a.login?.toLowerCase() === lc)) {
    reasons.push("assigned");
  }
  const timelineNodes = node.timelineItems?.nodes || [];
  for (const n of timelineNodes) {
    let authorLogin: string | undefined;
    if (n.__typename === "CrossReferencedEvent" && n.source?.__typename === "PullRequest") {
      authorLogin = n.source?.author?.login;
    } else if (n.__typename === "ConnectedEvent" && n.subject?.__typename === "PullRequest") {
      authorLogin = n.subject?.author?.login;
    }
    if (authorLogin && authorLogin.toLowerCase() === lc) {
      reasons.push("openedPR");
      break;
    }
  }

  return { engaged: reasons.length > 0, reasons };
}

function getRateLimit(headers: Headers) {
  return {
    limit: Number(headers.get("x-ratelimit-limit")) || null,
    remaining: Number(headers.get("x-ratelimit-remaining")) || null,
    reset: Number(headers.get("x-ratelimit-reset")) || null,
  };
}

const GRAPHQL_ISSUE_QUERY = `
  query SearchIssues($query: String!, $first: Int!, $after: String) {
    search(query: $query, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Issue {
          databaseId
          number
          title
          url
          createdAt
          updatedAt
          body
          viewerDidAuthor
          comments(first: 10) {
            totalCount
            nodes { author { login } }
          }
          labels(first: 10) { nodes { name } }
          assignees(first: 10) { nodes { login } }
          repository {
            nameWithOwner
            stargazerCount
            forkCount
            pushedAt
            isFork
            url
            hasContributingFile: object(expression: "HEAD:CONTRIBUTING.md") { id }
            owner { __typename }
          }
          timelineItems(first: 5, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
            nodes {
              __typename
              ... on CrossReferencedEvent {
                source { __typename ... on PullRequest { state isDraft author { login } } }
              }
              ... on ConnectedEvent {
                subject { __typename ... on PullRequest { state isDraft author { login } } }
              }
            }
          }
          linkedBranches(first: 5) { totalCount }
        }
      }
    }
    rateLimit { limit cost remaining resetAt }
  }
`;

const GRAPHQL_DISCUSSION_QUERY = `
  query SearchDiscussions($query: String!, $first: Int!, $after: String) {
    search(query: $query, type: DISCUSSION, first: $first, after: $after) {
      discussionCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Discussion {
          databaseId
          number
          title
          url
          createdAt
          updatedAt
          viewerDidAuthor
          viewerHasUpvoted
          comments(first: 10) {
            totalCount
            nodes { author { login } }
          }
          labels(first: 10) { nodes { name } }
          repository {
            nameWithOwner
            stargazerCount
            forkCount
            pushedAt
            isFork
            url
            owner { __typename }
          }
        }
      }
    }
    rateLimit { limit cost remaining resetAt }
  }
`;

function determinePRStatus(issueNode: any) {
  let openPrCount = 0;
  let draftPrCount = 0;
  
  const timelineNodes = issueNode.timelineItems?.nodes || [];
  for (const node of timelineNodes) {
    let pr = null;
    if (node.__typename === "CrossReferencedEvent" && node.source?.__typename === "PullRequest") {
      pr = node.source;
    } else if (node.__typename === "ConnectedEvent" && node.subject?.__typename === "PullRequest") {
      pr = node.subject;
    }
    
    if (pr && pr.state === "OPEN") {
      if (pr.isDraft) draftPrCount++;
      else openPrCount++;
    }
  }
  
  const linkedBranches = issueNode.linkedBranches?.totalCount || 0;
  
  let status: "safe" | "open_pr" | "draft_pr" | "linked_branch" | "checking" | "error" = "safe";
  if (openPrCount > 0) status = "open_pr";
  else if (draftPrCount > 0) status = "draft_pr";
  else if (linkedBranches > 0) status = "linked_branch";
  
  return { status, openPrCount, draftPrCount, linkedBranches };
}

async function searchGraphQL(token: string, q: string, filters: Filters) {
  const isDiscussion = filters.type === "discussion";
  const gqlQuery = isDiscussion ? GRAPHQL_DISCUSSION_QUERY : GRAPHQL_ISSUE_QUERY;

  const variables = {
    query: q,
    first: filters.perPage,
    after: filters.cursor || null,
  };

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": API_VERSION,
    },
    body: JSON.stringify({ query: gqlQuery, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      // Carry the resetAt so the token pool can mark the correct cooldown window
      const resetAtSec = Number(response.headers.get("x-ratelimit-reset")) || null;
      const err = Object.assign(new Error("rate limit"), { resetAt: resetAtSec });
      throw err;
    }
    if (response.status === 401) throw new Error("unauthorized");
    throw new Error("github_graphql_failed");
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "github_graphql_error");
  }

  const data = result.data.search;
  const nodes = data.nodes || [];

  const rawItems = nodes.map((node: any) => {
    const ownerRepo = node.repository.nameWithOwner.split("/");

    let tasks = null;
    if (!isDiscussion && node.body) {
      const allTasks = [...node.body.matchAll(/-\s+\[([xX\s])\]/g)];
      if (allTasks.length > 0) {
        const completed = allTasks.filter(m => m[1] && m[1].toLowerCase() === 'x').length;
        tasks = { completed, total: allTasks.length };
      }
    }

    return {
      id: node.databaseId,
      number: node.number,
      title: node.title,
      htmlUrl: node.url,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      comments: node.comments?.totalCount || 0,
      labels: node.labels?.nodes?.map((l: any) => l.name) || [],
      tasks,
      isDiscussion,
      owner: ownerRepo[0],
      repo: ownerRepo[1],
      repository: {
        fullName: node.repository.nameWithOwner,
        htmlUrl: node.repository.url,
        stars: node.repository.stargazerCount,
        forks: node.repository.forkCount,
        pushedAt: node.repository.pushedAt,
        isFork: node.repository.isFork,
        hasContributing: !!node.repository.hasContributingFile,
        ownerType: node.repository.owner?.__typename,
      },
      assignees: isDiscussion ? [] : (node.assignees?.nodes || []),
      prStatus: isDiscussion
        ? { status: "safe" as const, openPrCount: 0, draftPrCount: 0, linkedBranches: 0 }
        : determinePRStatus(node),
      viewer: buildViewerSummary(filters.viewerLogin, node, isDiscussion),
    };
  });

  const rateLimitData = result.data.rateLimit;
  const totalCount = isDiscussion ? data.discussionCount : data.issueCount;

  return {
    items: rawItems,
    total_count: totalCount,
    hasMore: data.pageInfo.hasNextPage,
    endCursor: data.pageInfo.endCursor,
    rateLimit: rateLimitData ? {
      limit: rateLimitData.limit,
      remaining: rateLimitData.remaining,
      reset: new Date(rateLimitData.resetAt).getTime() / 1000,
    } : null,
  };
}

async function searchREST(q: string, filters: Filters) {
  const searchUrl = new URL(`${API_BASE}/search/issues`);
  searchUrl.searchParams.set("q", q);
  searchUrl.searchParams.set("sort", filters.sort);
  searchUrl.searchParams.set("order", filters.order);
  searchUrl.searchParams.set("per_page", String(filters.perPage));
  searchUrl.searchParams.set("page", String(filters.page));

  const response = await fetch(searchUrl.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new Error("rate limit");
    throw new Error("github_search_failed");
  }

  const data = await response.json();
  const rateLimit = getRateLimit(response.headers);
  const items = data.items || [];

  const processed = items.map((item: any) => {
    let owner = "", repo = "";
    const repoUrl = item.repository_url;
    if (repoUrl) {
      const parts = new URL(repoUrl).pathname.split("/").slice(2, 4);
      if (parts.length === 2) {
        owner = parts[0]; repo = parts[1];
      }
    }
    
    return {
      id: item.id,
      number: item.number,
      title: item.title,
      htmlUrl: item.html_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      comments: item.comments,
      labels: item.labels.map((l: any) => l.name),
      tasks: (() => {
        if (!item.body) return null;
        const allTasks = [...item.body.matchAll(/-\s+\[([xX\s])\]/g)];
        if (allTasks.length === 0) return null;
        return {
          completed: allTasks.filter(m => m[1] && m[1].toLowerCase() === 'x').length,
          total: allTasks.length
        };
      })(),
      assignees: item.assignees || [],
      owner,
      repo,
      repository: {
        fullName: `${owner}/${repo}`,
        htmlUrl: `https://github.com/${owner}/${repo}`,
        stars: 0, forks: 0, pushedAt: new Date(0).toISOString(), isFork: false,
        ownerType: item.owner?.type || "User"
      },
      prStatus: { status: "guest" as const, openPrCount: 0, draftPrCount: 0, linkedBranches: 0 },
      viewer: null,
    };
  });

  return {
    items: processed,
    total_count: data.total_count,
    hasMore: data.total_count > filters.page * filters.perPage,
    endCursor: null,
    rateLimit
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = FilterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    }

    const filters = { ...parsed.data }; // mutable copy — we adjust perPage/labels below

    // Signed-in: user token. Guest: bot pool (rotation on exhaustion).
    const userToken = await getToken();
    const guestToken = userToken ? null : botTokenPool.selectToken();
    const token = userToken ?? guestToken ?? undefined;

    // Rate-limit unauthenticated (guest) requests per-IP to protect the pool
    if (!userToken) {
      const ip = getClientIp(request);
      const limit = guestSearchLimiter.check(ip);
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Sign in for unlimited searches." },
          { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
        );
      }
    }

    // Guest mode: cap result set — REST fallback is already capped at 10 by schema
    if (!token && filters.perPage > 10) filters.perPage = 10;

    // Apply default labels only when the client didn't send the field at all.

    if (filters.labels === undefined) {
      filters.labels = ["good first issue", "help wanted"];
    }

    const { query: q, warnings: qWarnings } = buildIssueSearchQuery(filters);

    if (!q) {
      return NextResponse.json({
        total_count: 0, incomplete_results: false, filtered_out: 0,
        items: [], hasMore: false, endCursor: null, warnings: ["Query is empty"],
        rate_limit: { limit: null, remaining: null, reset: null }
      });
    }

    const isFirstPage = filters.page === 1 && !filters.cursor;
    const isDefault = isDefaultSearch(filters);
    
    let cacheKey: string | null = null;

    if (isFirstPage) {
      if (isDefault) {
        // Global Fast-Path: Force the cache key to ignore viewerLogin.
        // The fetch logic below will automatically use a bot token.
        cacheKey = makeCacheKey(filters, { global: true });
      } else {
        // Personalized Cache: Include viewerLogin in the cache key so it's private to them.
        cacheKey = makeCacheKey(filters, { global: false });
      }
    }

    if (cacheKey) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }


    const isDiscussion = filters.type === "discussion";
    let validItems: any[] = [];
    let qualityFiltered = 0;
    let searchResult: any;
    let finalHasMore = false;
    let finalEndCursor: string | null = null;

    try {
      if (token) {
        // One GraphQL fetch: larger buffer (4x) to ensure quality filters have a decent pool.
        // Cap at 100 (GitHub max per page).
        const fetchSize = Math.min(Math.ceil(filters.perPage * 4), 100);

        // Guests OR Global Fast-Path: try pool tokens in order; exhaust on 429 and continue.
        // Auth users (Personalized Cache): use their personal token.
        const isGlobalFastPath = isFirstPage && isDefault;
        const tokensToTry: string[] = (userToken && !isGlobalFastPath)
          ? [userToken]
          : botTokenPool.getAvailableTokens();

        if (tokensToTry.length === 0) {
          return NextResponse.json(
            { error: "Rate limit exceeded. All search tokens are temporarily exhausted. Sign in for unlimited searches." },
            { status: 429 }
          );
        }

        let lastRateLimitError: any = null;
        let activeToken = "";
        for (const candidateToken of tokensToTry) {
          try {
            searchResult = await searchGraphQL(candidateToken, q, {
              ...filters,
              cursor: filters.cursor || null,
              perPage: fetchSize,
            });
            activeToken = candidateToken;
            lastRateLimitError = null;
            break; // success — stop trying
          } catch (err: any) {
            if (err.message === "rate limit") {
              // Mark this specific token as exhausted and try the next one
              if (!userToken) botTokenPool.exhaustToken(candidateToken, err.resetAt);
              lastRateLimitError = err;
              continue;
            }
            throw err; // non-rate-limit errors bubble up immediately
          }
        }

        // If every token was exhausted, surface the rate limit error
        if (lastRateLimitError) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Sign in for unlimited searches." },
            { status: 429 }
          );
        }

        let fetchedItems = searchResult.items;

        if (!isDiscussion && filters.noAssignee) {
          fetchedItems = fetchedItems.filter((i: any) => !i.assignees || i.assignees.length === 0);
        }

        if (filters.zeroComments) {
          fetchedItems = fetchedItems.filter((i: any) => i.comments === 0);
        }

        const qualityResult = isDiscussion
          ? { items: fetchedItems, filteredOut: 0 }
          : filterByRepoQuality(fetchedItems as any, filters);

        qualityFiltered = qualityResult.filteredOut;
        validItems = qualityResult.items;

        finalHasMore = searchResult.hasMore;
        finalEndCursor = searchResult.endCursor;
        let currentCursor = searchResult.endCursor;
        let loopCount = 0;

        // Oversampling accumulation loop: if we have fewer valid items than requested perPage,
        // and there are more items available on GitHub, fetch the next batch recursively (max 3 times)
        // to fill the page size and avoid disappointing empty or near-empty pages.
        while (validItems.length < filters.perPage && finalHasMore && loopCount < 3) {
          loopCount++;
          const nextResult = await searchGraphQL(activeToken, q, {
            ...filters,
            cursor: currentCursor,
            perPage: fetchSize,
          });

          let nextItems = nextResult.items;

          if (!isDiscussion && filters.noAssignee) {
            nextItems = nextItems.filter((i: any) => !i.assignees || i.assignees.length === 0);
          }

          if (filters.zeroComments) {
            nextItems = nextItems.filter((i: any) => i.comments === 0);
          }

          const nextQuality = isDiscussion
            ? { items: nextItems, filteredOut: 0 }
            : filterByRepoQuality(nextItems as any, filters);

          qualityFiltered += nextQuality.filteredOut;
          validItems = [...validItems, ...nextQuality.items];
          
          finalHasMore = nextResult.hasMore;
          finalEndCursor = nextResult.endCursor;
          currentCursor = nextResult.endCursor;
          
          if (!finalHasMore) break;
        }

        // Trim to requested page size
        if (validItems.length > filters.perPage) {
          validItems = validItems.slice(0, filters.perPage);
        }
      } else {
        // No token at all — fall back to unauthenticated REST (60 req/hour)
        searchResult = await searchREST(q, filters);
        validItems = searchResult.items;
        if (filters.noAssignee) {
          validItems = validItems.filter((i: any) => !i.assignees || i.assignees.length === 0);
        }
        finalHasMore = searchResult.hasMore;
        finalEndCursor = searchResult.endCursor;
      }
    } catch (error: any) {
      if (error.message === "rate limit") {
        return NextResponse.json({ error: "Rate limit exceeded. Please sign in with GitHub for unlimited searches." }, { status: 429 });
      }
      if (error.message === "unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      throw error;
    }

    const responseData = {
      total_count: searchResult.total_count,
      incomplete_results: false,
      filtered_out: qualityFiltered,
      items: validItems.map((item: any) => {
        const { assignees, ...rest } = item;
        return rest;
      }),
      hasMore: finalHasMore,
      endCursor: finalEndCursor,
      warnings: qWarnings,
      rate_limit: searchResult.rateLimit
    };

    if (cacheKey) {
      cacheSet(cacheKey, responseData);
    }

    const response = NextResponse.json(responseData);

    // CDN: public only for guests; never cache signed-in results.
    if (!userToken) {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600"
      );
    } else {
      // Ensure private data (auth searches) is never cached by shared CDNs
      response.headers.set("Cache-Control", "no-store, max-age=0");
    }

    return response;

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
