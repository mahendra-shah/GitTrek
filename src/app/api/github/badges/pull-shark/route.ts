import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "@/lib/auth/adapter";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const Schema = z.object({
  username: z.string().min(1).max(100),
});

const API_VERSION = "2022-11-28";

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "GitTrek",
  };
}

async function resolveToken(): Promise<string | null> {
  // For a user looking up someone else (or any-user mode), use the bot token.
  const userToken = await getToken();
  if (userToken) return userToken;
  // Fallback: use the bot token for public lookups
  return env.GITHUB_BOT_TOKEN ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = Schema.safeParse({ username: searchParams.get("username") });

  if (!parsed.success) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const { username } = parsed.data;
  const token = await resolveToken();

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in or configure GITHUB_BOT_TOKEN." },
      { status: 401 }
    );
  }

  try {
    // Use REST search/issues — total_count gives the exact merged PR count without pagination
    const url = new URL("https://api.github.com/search/issues");
    url.searchParams.set("q", `is:pr is:merged author:${username}`);
    url.searchParams.set("per_page", "1");

    const res = await fetch(url.toString(), { headers: githubHeaders(token) });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body.message ?? "GitHub API error", status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ count: data.total_count ?? 0 });
  } catch (err) {
    console.error("[pull-shark]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
