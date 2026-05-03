import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!env.WAITLIST_RESPONSE_API) {
      console.error("WAITLIST_RESPONSE_API is not configured");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const response = await fetch(env.WAITLIST_RESPONSE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        source: "GitTrek Website",
        submittedAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || "Submission failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
