import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await getToken()) || process.env.GITHUB_BOT_TOKEN;
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
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
