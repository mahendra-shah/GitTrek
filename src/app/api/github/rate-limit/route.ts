import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionToken = await getToken();
  const token = sessionToken || process.env.GITHUB_BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "No token available" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitTrek",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Rate limit fetch failed" }, { status: res.status });
    }

    const data = await res.json();
    
    // Unify the active limit for the UI
    // If the user has a session, /search uses GraphQL (graphql limit).
    // If no session, /search uses unauthenticated REST (search limit, mapped to the server IP or bot token).
    // Since /search now uses GITHUB_BOT_TOKEN if available, we check if token is present.
    // Wait, let's just make RateLimitDisplay look at activeSearchLimit.
    data.activeSearchLimit = sessionToken ? data.resources.graphql : (data.resources.search || data.resources.graphql);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
