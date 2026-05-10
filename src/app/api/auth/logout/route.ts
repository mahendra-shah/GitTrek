import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIES = ["gh_token", "gh_state"];

export async function POST() {
  const response = NextResponse.json({ ok: true }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    }
  });
  
  const isProd = process.env.NODE_ENV === "production";
  
  COOKIES.forEach((name) => {
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
