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

const GALAXY_BRAIN_QUERY = `
  query GalaxyBrain($login: String!, $after: String) {
    user(login: $login) {
      repositoryDiscussionComments(first: 100, after: $after, onlyAnswers: true) {
        totalCount
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
    // The onlyAnswers: true filter does the heavy lifting server-side.
    // We still need the total count which is returned on the first page.
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: graphqlHeaders(token),
      body: JSON.stringify({ query: GALAXY_BRAIN_QUERY, variables: { login: username, after: null } }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.message ?? "GitHub API error" }, { status: res.status });
    }

    const { data, errors } = await res.json();
    if (errors?.length) return NextResponse.json({ error: errors[0].message }, { status: 400 });

    const answerCount = data?.user?.repositoryDiscussionComments?.totalCount ?? 0;
    return NextResponse.json({ answerCount });
  } catch (err) {
    console.error("[galaxy-brain]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
