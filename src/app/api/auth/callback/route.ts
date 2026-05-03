import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env, isProd } from "@/lib/env";
import { signToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "gh_state";
const TOKEN_COOKIE = "gh_token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?auth=denied", url.origin));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/?auth=failed", url.origin));
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_REDIRECT_URI,
      }).toString(),
    }
  );

  const tokenJson = await tokenResponse.json().catch(() => ({}));
  const accessToken = tokenJson.access_token as string | undefined;

  if (!tokenResponse.ok || !accessToken) {
    return NextResponse.redirect(new URL("/?auth=failed", url.origin));
  }

  const response = NextResponse.redirect(new URL("/?auth=success", url.origin));
  response.cookies.set(TOKEN_COOKIE, signToken(accessToken), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.delete(STATE_COOKIE);

  return response;
}
