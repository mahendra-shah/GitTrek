import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const token = (await getToken()) || process.env.GITHUB_BOT_TOKEN;
  
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GitTrek",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      // Minimal caching to avoid rate limits but stay fresh
      next: { revalidate: 3600 } 
    });

    if (res.status === 404) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "GitHub API error" }, { status: res.status });
    }

    const data = await res.json();
    
    // Check if it's actually an organization vs a user
    if (data.type !== "User") {
        return NextResponse.json({ exists: false, type: data.type }, { status: 404 });
    }

    return NextResponse.json({ 
      exists: true, 
      login: data.login,
      avatarUrl: data.avatar_url,
      name: data.name
    });
  } catch (err) {
    console.error("[user-lookup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
