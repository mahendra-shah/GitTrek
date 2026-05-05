import type { Metadata } from "next";
import { BadgeDashboard } from "@/components/BadgeDashboard";
import { UserLookup } from "@/components/UserLookup";
import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ user?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const user = params.user;
  
  if (!user) {
    return {
      title: "My GitHub Badges — GitTrek",
      description: "Track your progress toward GitHub achievement badges. See exactly how many more PRs, stars, and discussion answers you need.",
      alternates: { canonical: "/badges" },
    };
  }

  // We use the OG endpoint to generate a generic preview for the user if we don't know their best badge yet
  const ogImageUrl = `https://gittrek.vercel.app/api/og/badge?user=${user}&badge=pullShark`;

  return {
    title: `${user}'s GitHub Badges`,
    description: `Check ${user}'s progress toward GitHub achievement badges on GitTrek. Track your own badges too!`,
    alternates: { canonical: `/badges?user=${user}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${user}'s GitHub Badges 🏅`,
      description: `Check ${user}'s progress toward GitHub achievement badges on GitTrek. Track your own badges too!`,
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user}'s GitHub Badges 🏅`,
      description: `Check ${user}'s progress toward GitHub achievement badges on GitTrek.`,
      images: [ogImageUrl],
    },
  };
}

async function getSignedInUser(): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitTrek",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.login ?? null;
  } catch {
    return null;
  }
}

export default async function BadgesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const signedInUser = await getSignedInUser();

  // Determine which username to show badges for
  const targetUsername = params.user ?? signedInUser ?? null;
  const isOwnProfile = targetUsername === signedInUser;

  return (
    <>
      <main
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "32px 16px 64px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* ── Page header ── */}
      <div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--gt-text)",
            margin: "0 0 6px",
          }}
        >
          {isOwnProfile ? "Your GitHub Badges" : targetUsername ? `${targetUsername}'s Badges` : "GitHub Badge Tracker"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--gt-text-muted)", margin: 0 }}>
          Live progress toward GitHub achievements — calculated from public data.
        </p>
      </div>

      {/* ── Any-user lookup bar ── */}
      <UserLookup
        initialUsername={targetUsername ?? ""}
        signedInUser={signedInUser}
      />

      {/* ── Sign-in CTA ── */}
      {!targetUsername && (
        <div
          style={{
            background: "var(--gt-card)",
            border: "1px solid var(--gt-border)",
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 48 }}>🏅</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gt-text)", marginBottom: 8 }}>
              Track your GitHub badges
            </div>
            <p style={{ fontSize: 14, color: "var(--gt-text-muted)", margin: 0, maxWidth: 380 }}>
              Sign in to see your personalized badge progress, or enter any GitHub username above to look up a public profile.
            </p>
          </div>
          <a
            href="/api/auth/login"
            style={{
              display: "inline-block",
              background: "#24292F",
              color: "#fff",
              borderRadius: 9,
              padding: "11px 24px",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Sign in with GitHub
          </a>
        </div>
      )}

      {targetUsername && (
        <BadgeDashboard username={targetUsername} isOwnProfile={isOwnProfile} />
      )}

      {/* ── Viral CTA Banner ── */}
      {!isOwnProfile && targetUsername && (
        <div style={{
          position: "sticky", bottom: 20, zIndex: 100,
          background: "var(--gt-card)", border: "1px solid var(--gt-border-strong)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", borderRadius: 16,
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 20, marginTop: 40
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gt-text)", marginBottom: 4 }}>
              What badges do YOU have?
            </div>
            <div style={{ fontSize: 14, color: "var(--gt-text-muted)" }}>
              Sign in to track your own GitHub achievements.
            </div>
          </div>
          <a
            href="/api/auth/login"
            style={{
              display: "inline-block", background: "var(--gt-primary)", color: "#fff",
              padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none",
              whiteSpace: "nowrap"
            }}
          >
            Check My Badges →
          </a>
        </div>
      )}
    </main>
    </>
  );
}
