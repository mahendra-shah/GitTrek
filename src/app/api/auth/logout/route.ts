import { NextResponse } from "next/server";

import { isProd } from "@/lib/env";

export const dynamic = "force-dynamic";

const COOKIES = ["gh_token", "gh_state"];

/**
 * GET /api/auth/logout
 *
 * Clears the session cookies and redirects to the home page.
 *
 * WHY GET instead of POST:
 *   Using a GET that returns a redirect is the most reliable logout pattern.
 *   The browser processes the Set-Cookie headers (which delete the auth cookie)
 *   and the Location redirect in a single atomic response — there is no
 *   client-side JavaScript timing window between "cookie is deleted" and
 *   "page reloads". A POST-then-client-reload can race in some browsers.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url.origin));

  COOKIES.forEach((name) => {
    // Attributes MUST match the Set-Cookie from the login callback exactly
    // (same path, secure, sameSite) so the browser finds and overwrites the
    // existing cookie. Max-Age=0 tells the browser to delete it immediately.
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  });

  return response;
}
