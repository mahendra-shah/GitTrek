import { NextResponse } from "next/server";

import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

const API_VERSION = "2022-11-28";

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "github_request_failed" },
      { status: response.status }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    }
  });
}
