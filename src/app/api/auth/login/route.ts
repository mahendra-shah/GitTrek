import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env, isProd } from "@/lib/env";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "gh_state";

export async function GET() {
  // Generate a random state token for CSRF protection
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", env.GITHUB_REDIRECT_URI);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl);
}
