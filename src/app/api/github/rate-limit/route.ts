import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth/adapter";
import { botTokenPool } from "@/lib/github/token-pool";

export const dynamic = "force-dynamic";

/**
 * GET /api/github/rate-limit
 *
 * Returns GitHub API rate limit info for the RateLimitDisplay widget.
 *
 * Token selection mirrors the search route:
 *   - Logged-in user  → use their personal token (shows their hourly GraphQL quota)
 *   - Guest           → use the bot pool (shows how much guest-search capacity remains)
 *
 * The response always includes:
 *   activeSearchLimit: { limit, remaining, reset, source }
 *     source = "user" | "bot"
 *
 * RateLimitDisplay reads `activeSearchLimit` as the single source of truth.
 * It is never overwritten by search responses (that was removed in ResultsFeed).
 */
export async function GET() {
  const userToken = await getToken();
  const guestToken = userToken ? null : botTokenPool.selectToken();
  const token = userToken || guestToken;

  if (!token) {
    return NextResponse.json({ error: "No token available" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitTrek",
        // Force GitHub not to serve a cached rate-limit response
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Rate limit fetch failed" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // For logged-in users we display their personal GraphQL quota (5000/hr).
    // For guests we display the bot-pool's search quota so they know when
    // the guest capacity is running low.
    const source: "user" | "bot" = userToken ? "user" : "bot";
    const activeSearchLimit = {
      ...(userToken ? data.resources.graphql : data.resources.search),
      source,
    };

    return NextResponse.json(
      { ...data, activeSearchLimit },
      {
        headers: {
          // Never let CDN or browser cache rate-limit data — it changes every second
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
