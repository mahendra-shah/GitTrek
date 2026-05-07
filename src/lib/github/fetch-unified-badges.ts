import { env } from "@/lib/env";

const API_VERSION = "2022-11-28";

function graphqlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "GitTrek",
  };
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
    throw Object.assign(new Error((body as { message?: string }).message ?? "GitHub GraphQL error"), {
      status: res.status,
    });
  }

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

/** Single GraphQL round-trip for PR-based badges + user aggregates. */
const CORE_BADGES_QUERY = `
  query CoreBadges($login: String!, $pullSharkQuery: String!, $yoloQuery: String!, $pairQuery: String!) {
    pullShark: search(query: $pullSharkQuery, type: ISSUE, first: 1) {
      issueCount
    }
    pairExtraordinaire: search(query: $pairQuery, type: ISSUE, first: 1) {
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

    const pageFirstStars = (repos.nodes[0] as { stargazerCount: number } | undefined)?.stargazerCount ?? 0;
    if (pageFirstStars < maxStars) break;

    after = repos.pageInfo.hasNextPage ? repos.pageInfo.endCursor : null;
  } while (after);

  return { maxStars, repoName: topRepoName };
}

export type UnifiedBadgeApiJson = {
  pullShark: { count: number };
  pairExtraordinaire: { count: number };
  starstruck: { maxStars: number; repoName: string };
  galaxyBrain: { answerCount: number };
  yolo: { count: number; isEarned: boolean };
  publicSponsor: { isEarned: boolean; sponsoringCount: number };
  rateLimit: { limit: number; remaining: number; reset: number } | null;
};

/**
 * Fetches all unified badge counts for a GitHub username (same payload as GET /api/github/badges).
 * Caller must supply a valid PAT (user session or GITHUB_BOT_TOKEN).
 */
export async function fetchUnifiedBadgeData(token: string, username: string): Promise<UnifiedBadgeApiJson> {
  const [coreData, starstruck] = await Promise.all([
    gqlFetch(token, CORE_BADGES_QUERY, {
      login: username,
      pullSharkQuery: `is:pr is:merged author:${username}`,
      yoloQuery: `is:pr is:merged author:${username} review:none`,
      pairQuery: `is:pr is:merged co-authored-by:${username}`,
    }),
    fetchStarstruck(token, username),
  ]);

  const pullSharkCount: number = coreData?.pullShark?.issueCount ?? 0;
  const pairCount: number = coreData?.pairExtraordinaire?.issueCount ?? 0;
  const yoloCount: number = coreData?.yolo?.issueCount ?? 0;
  const answerCount: number = coreData?.user?.repositoryDiscussionComments?.totalCount ?? 0;
  const sponsoringCount: number = coreData?.user?.sponsoring?.totalCount ?? 0;

  const rl = coreData?.rateLimit;

  return {
    pullShark: { count: pullSharkCount },
    pairExtraordinaire: { count: pairCount },
    starstruck: { maxStars: starstruck.maxStars, repoName: starstruck.repoName },
    galaxyBrain: { answerCount },
    yolo: { count: yoloCount, isEarned: yoloCount > 0 },
    publicSponsor: { isEarned: sponsoringCount > 0, sponsoringCount },
    rateLimit: rl
      ? { limit: rl.limit, remaining: rl.remaining, reset: new Date(rl.resetAt).getTime() / 1000 }
      : null,
  };
}

/** Resolve token for server-only callers (e.g. OG metadata). Returns null if unavailable. */
export function resolveBotTokenForBadges(): string | null {
  return env.GITHUB_BOT_TOKEN ?? null;
}
