import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "@/lib/auth/adapter";
import { env } from "@/lib/env";

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

async function resolveToken() {
  return (await getToken()) ?? env.GITHUB_BOT_TOKEN ?? null;
}

const STARSTRUCK_QUERY = `
  query Starstruck($login: String!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        orderBy: { field: STARGAZERS, direction: DESC }
        after: $after
        ownerAffiliations: OWNER
      ) {
        nodes {
          name
          stargazerCount
          isFork
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  const parsed = Schema.safeParse({ username: req.nextUrl.searchParams.get("username") });
  if (!parsed.success) return NextResponse.json({ error: "username is required" }, { status: 400 });

  const { username } = parsed.data;
  const token = await resolveToken();
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    let maxStars = 0;
    let topRepoName = "";
    let after: string | null = null;

    // Paginate through all repos to find the highest-starred single repo
    do {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: graphqlHeaders(token),
        body: JSON.stringify({ query: STARSTRUCK_QUERY, variables: { login: username, after } }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return NextResponse.json({ error: body.message ?? "GitHub API error" }, { status: res.status });
      }

      type GQLResponse = {
        data?: { user?: { repositories?: { nodes: Array<{ name: string; stargazerCount: number; isFork: boolean }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } };
        errors?: Array<{ message: string }>;
      };

      const { data, errors } = (await res.json()) as GQLResponse;
      if (errors?.length) return NextResponse.json({ error: errors[0].message }, { status: 400 });

      const repos = data?.user?.repositories;
      if (!repos) break;

      // Since we order DESC by stars, we can short-circuit once stars < current max
      // but still need pagination since forks are excluded client-side
      for (const node of repos.nodes) {
        // Starstruck is awarded per repo you OWN, not forks
        if (!node.isFork && node.stargazerCount > maxStars) {
          maxStars = node.stargazerCount;
          topRepoName = node.name;
        }
      }

      // Short-circuit: if this page's first repo (highest stars due to DESC sort)
      // has fewer stars than current max from a non-fork, no point continuing
      const pageFirstStars = repos.nodes[0]?.stargazerCount ?? 0;
      if (pageFirstStars < maxStars && !repos.pageInfo.hasNextPage) break;

      after = repos.pageInfo.hasNextPage ? repos.pageInfo.endCursor : null;
    } while (after);

    return NextResponse.json({ maxStars, repoName: topRepoName });
  } catch (err) {
    console.error("[starstruck]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
