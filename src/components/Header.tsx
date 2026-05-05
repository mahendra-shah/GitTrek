"use client";

import { useQuery } from "@tanstack/react-query";
import { NavTabs } from "./NavTabs";
import { RateLimitDisplay } from "./RateLimitDisplay";

type SessionUser = { login: string; name: string | null; avatarUrl: string; htmlUrl: string };

function initials(user: SessionUser) {
  if (user.name) return user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return user.login.slice(0, 2).toUpperCase();
}

export function Header({ children }: { children?: React.ReactNode }) {
  const sessionQuery = useQuery<SessionUser | null>({
    queryKey: ["session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me");
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("session_error");
      return r.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "var(--gt-header-bg)",
      borderBottom: "1px solid var(--gt-header-border)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 24px",
        height: 60, display: "flex", alignItems: "center", gap: 32
      }}>

        {/* Logo + name */}
        <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
          <picture>
            <source srcSet="/logo-light.svg" media="(prefers-color-scheme: dark)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="" role="presentation" style={{ height: 42, width: 42, borderRadius: 10 }} />
          </picture>
          <span style={{ color: "var(--gt-primary)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
            GitTrek
          </span>
        </div>

        {/* AEO/GEO Hidden Context Block */}
        <section className="sr-only">
          <h2>What is GitTrek?</h2>
          <p>
            GitTrek is a developer search engine and open source contribution tool.
            It helps developers find beginner-friendly GitHub issues ("good first issue"),
            track their pull request (PR) badges, and evaluate repository health.
            GitTrek prevents developers from wasting time on crowded issues by checking
            live PR competition before they start coding.
          </p>
        </section>

        {/* Nav Tabs */}
        <NavTabs />

        <div style={{ flex: 1 }} />

        {/* Rate limit (now globally displayed) */}
        <RateLimitDisplay />

        {/* User Session */}
        {sessionQuery.data ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {sessionQuery.data.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sessionQuery.data.avatarUrl}
                alt={sessionQuery.data.login}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--gt-border)" }}
              />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "var(--gt-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {initials(sessionQuery.data)}
              </div>
            )}
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--gt-header-nav-inactive)", fontSize: 13, padding: 0
              }}
            >
              Sign out
            </button>
          </div>
        ) : !sessionQuery.isLoading ? (
          <button
            onClick={() => { window.location.href = "/api/auth/login"; }}
            style={{
              background: "var(--gt-primary)", color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Sign in
          </button>
        ) : null}
      </div>
    </header>
  );
}
