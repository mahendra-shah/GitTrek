import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIES = ["gh_token", "gh_state"];

export async function POST() {
  const response = NextResponse.json({ ok: true });
  COOKIES.forEach((name) => response.cookies.delete(name));
  return response;
}
