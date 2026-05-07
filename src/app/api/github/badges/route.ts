import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "@/lib/auth/adapter";
import { env } from "@/lib/env";
import { fetchUnifiedBadgeData } from "@/lib/github/fetch-unified-badges";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 20 badge lookups per minute per IP (guest users burning bot token quota)
const badgeLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

export const dynamic = "force-dynamic";

const Schema = z.object({ username: z.string().min(1).max(100) });

async function resolveToken(): Promise<string | null> {
  return (await getToken()) ?? env.GITHUB_BOT_TOKEN ?? null;
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
    const payload = await fetchUnifiedBadgeData(token, username);

    return NextResponse.json({
      pullShark: { count: payload.pullShark.count },
      pairExtraordinaire: { count: payload.pairExtraordinaire.count },
      starstruck: { maxStars: payload.starstruck.maxStars, repoName: payload.starstruck.repoName },
      galaxyBrain: { answerCount: payload.galaxyBrain.answerCount },
      yolo: { count: payload.yolo.count, isEarned: payload.yolo.isEarned },
      publicSponsor: {
        isEarned: payload.publicSponsor.isEarned,
        sponsoringCount: payload.publicSponsor.sponsoringCount,
      },
      rateLimit: payload.rateLimit,
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
