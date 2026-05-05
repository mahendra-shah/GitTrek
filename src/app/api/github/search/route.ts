import { NextResponse } from "next/server";
import { z } from "zod";

import { getToken } from "@/lib/auth/adapter";
import {
  buildIssueSearchQuery,
  filterByRepoQuality,
  IssueSearchItem,
} from "@/lib/github/search";

export const dynamic = "force-dynamic";

const API_VERSION = "2022-11-28";
const API_BASE = "https://api.github.com";

const FilterSchema = z.object({
  text: z.string().trim().max(120).optional().default(""),
  languages: z.array(z.string()).optional().default([]),
  labels: z.array(z.string()).optional(),
  zeroComments: z.boolean().optional().default(false),
  noAssignee: z.boolean().optional().default(true),
  issueAgeDays: z.number().int().min(1).max(3650).optional().default(30),
  minStars: z.number().int().min(0).optional().default(100),
  maxStars: z.number().int().min(0).optional().nullable().default(null),
  minForks: z.number().int().min(0).optional().default(50),
  maxForks: z.number().int().min(0).optional().nullable().default(null),
  repoPushedDays: z.number().int().min(1).max(3650).optional().default(90),
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
});

type Filters = z.infer<typeof FilterSchema>;

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
          comments { totalCount }
          labels(first: 10) { nodes { name } }
          assignees(first: 1) { nodes { login } }
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
              ... on CrossReferencedEvent { source { __typename ... on PullRequest { state isDraft } } }
              ... on ConnectedEvent { subject { __typename ... on PullRequest { state isDraft } } }
            }
          }
          linkedBranches(first: 5) { totalCount }
        }
      }
    }
    rateLimit { limit cost remaining resetAt }
  }
`;

// Separate query for GitHub Discussions (Galaxy Brain badge)
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
          comments { totalCount }
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

// Keep old name as alias for backwards-compat
const GRAPHQL_QUERY = GRAPHQL_ISSUE_QUERY;

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
    if (response.status === 403 || response.status === 429) throw new Error("rate limit");
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

    // Discussions don't have task lists or PR linkage
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
  // REST fallback doesn't use cursors, so use page
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
    // Basic REST item mapping
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
      prStatus: { status: "guest" as const, openPrCount: 0, draftPrCount: 0, linkedBranches: 0 }
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

    const filters = parsed.data;
    const token = (await getToken()) || process.env.GITHUB_BOT_TOKEN;
    
    // Guest mode uses REST and limits perPage to 10
    if (!token && filters.perPage > 10) {
      filters.perPage = 10;
    }

    // Apply default labels only when the client didn't send the field at all.
    // An explicit empty array [] (e.g. from the Galaxy Brain mission) means "no label filter".
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

    const isDiscussion = filters.type === "discussion";
    let validItems: any[] = [];
    let qualityFiltered = 0;
    let searchResult: any;

    try {
      if (token) {
        // We loop up to 3 times to accumulate enough valid items after local filtering
        let loops = 0;
        let currentCursor = filters.cursor;
        let hasMore = true;
        
        while (validItems.length < filters.perPage && loops < 3 && hasMore) {
          loops++;
          searchResult = await searchGraphQL(token, q, { ...filters, cursor: currentCursor, perPage: 100 });
          
          let fetchedItems = searchResult.items;
          if (!isDiscussion && filters.noAssignee) {
            fetchedItems = fetchedItems.filter((i: any) => i.assignees.length === 0);
          }
          
          // Skip quality filter for discussions — the Discussion search API already scopes
          // results well, and applying fork/stars/pushedAt post-filters would silently drop valid discussions.
          const qualityResult = isDiscussion
            ? { items: fetchedItems, filteredOut: 0 }
            : filterByRepoQuality(fetchedItems as any, filters);
          qualityFiltered += qualityResult.filteredOut;
          
          validItems.push(...qualityResult.items);
          hasMore = searchResult.hasMore;
          currentCursor = searchResult.endCursor;
        }

        // If we gathered more than we need, we can truncate (though returning slightly more is also fine)
        if (validItems.length > filters.perPage) {
          validItems = validItems.slice(0, filters.perPage);
        }
        
        // Ensure final searchResult has the latest cursor and hasMore state
        if (searchResult) {
          searchResult.endCursor = currentCursor;
          searchResult.hasMore = hasMore;
        }
      } else {
        searchResult = await searchREST(q, filters);
        validItems = searchResult.items;
        if (filters.noAssignee) {
          validItems = validItems.filter((i: any) => i.assignees.length === 0);
        }
      }
    } catch (error: any) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      if (error.message.includes("unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      throw error;
    }

    return NextResponse.json({
      total_count: searchResult.total_count,
      incomplete_results: false,
      filtered_out: qualityFiltered,
      items: validItems.map((item: any) => {
        const { assignees, ...rest } = item;
        return rest;
      }),
      hasMore: searchResult.hasMore,
      endCursor: searchResult.endCursor,
      warnings: qWarnings,
      rate_limit: searchResult.rateLimit
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
