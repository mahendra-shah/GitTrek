import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "@/lib/auth/adapter";
import { env } from "@/lib/env";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 20 badge lookups per minute per IP (guest users burning bot token quota)
const badgeLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

export const dynamic = "force-dynamic";

const Schema = z.object({ username: z.string().min(1).max(100) });
const API_VERSION = "2022-11-28";

function graphqlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "GitTrek",
  };
}

async function resolveToken(): Promise<string | null> {
  return (await getToken()) ?? env.GITHUB_BOT_TOKEN ?? null;
}

async function gqlFetch(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: graphqlHeaders(token),
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? "GitHub GraphQL error"), { status: res.status });
  }

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// Core badges in one round-trip (pull shark, galaxy brain, YOLO, sponsor counts).
const CORE_BADGES_QUERY = `
  query CoreBadges($login: String!, $pullSharkQuery: String!, $yoloQuery: String!) {
    pullShark: search(query: $pullSharkQuery, type: ISSUE, first: 1) {
      issueCount
    }
    yolo: search(query: $yoloQuery, type: ISSUE, first: 1) {
      issueCount
    }
    user(login: $login) {
      repositoryDiscussionComments(first: 1, onlyAnswers: true) {
        totalCount
      }
      sponsoring {
        totalCount
      }
    }
    rateLimit { limit remaining resetAt }
  }
`;

// Starstruck: paginate repos by stars to find best non-fork.
const STARSTRUCK_QUERY = `
  query Starstruck($login: String!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        orderBy: { field: STARGAZERS, direction: DESC }
        after: $after
        ownerAffiliations: OWNER
      ) {
        nodes { name stargazerCount isFork }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

async function fetchStarstruck(
  token: string,
  username: string
): Promise<{ maxStars: number; repoName: string }> {
  let maxStars = 0;
  let topRepoName = "";
  let after: string | null = null;

  do {
    const data = await gqlFetch(token, STARSTRUCK_QUERY, { login: username, after });
    const repos = data?.user?.repositories;
    if (!repos) break;

    for (const node of repos.nodes as Array<{ name: string; stargazerCount: number; isFork: boolean }>) {
      if (!node.isFork && node.stargazerCount > maxStars) {
        maxStars = node.stargazerCount;
        topRepoName = node.name;
      }
    }

    // Short-circuit: DESC sort means once the page head is lower than our max
    // and no forks remain that could be higher, we can stop.
    const pageFirstStars = (repos.nodes[0] as { stargazerCount: number } | undefined)?.stargazerCount ?? 0;
    if (pageFirstStars < maxStars) break;

    after = repos.pageInfo.hasNextPage ? repos.pageInfo.endCursor : null;
  } while (after);

  return { maxStars, repoName: topRepoName };
}

export async function GET(req: NextRequest) {
  const parsed = Schema.safeParse({ username: req.nextUrl.searchParams.get("username") });
  if (!parsed.success) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const { username } = parsed.data;
  const token = await resolveToken();

  // Only apply rate limiting to unauthenticated requests using the shared bot token
  if (!await getToken()) {
    const ip = getClientIp(req);
    const limit = badgeLimiter.check(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please sign in to remove this limit." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }
  }
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in or configure GITHUB_BOT_TOKEN." },
      { status: 401 }
    );
  }

  try {
    // Fire both requests concurrently — they are independent of each other.
    const [coreData, starstruck] = await Promise.all([
      gqlFetch(token, CORE_BADGES_QUERY, {
        login: username,
        pullSharkQuery: `is:pr is:merged author:${username}`,
        yoloQuery: `is:pr is:merged author:${username} review:none`,
      }),
      fetchStarstruck(token, username),
    ]);

    const pullSharkCount: number = coreData?.pullShark?.issueCount ?? 0;
    const yoloCount: number = coreData?.yolo?.issueCount ?? 0;
    const answerCount: number = coreData?.user?.repositoryDiscussionComments?.totalCount ?? 0;
    const sponsoringCount: number = coreData?.user?.sponsoring?.totalCount ?? 0;

    // Pass through rateLimit info for the UI
    const rl = coreData?.rateLimit;

    return NextResponse.json({
      pullShark: { count: pullSharkCount },
      starstruck: { maxStars: starstruck.maxStars, repoName: starstruck.repoName },
      galaxyBrain: { answerCount },
      yolo: { count: yoloCount, isEarned: yoloCount > 0 },
      publicSponsor: { isEarned: sponsoringCount > 0, sponsoringCount },
      rateLimit: rl
        ? { limit: rl.limit, remaining: rl.remaining, reset: new Date(rl.resetAt).getTime() / 1000 }
        : null,
    });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    console.error("[badges/unified]", error.message);

    if (error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.status === 403 || error.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    if (error.message.toLowerCase().includes("could not resolve")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
