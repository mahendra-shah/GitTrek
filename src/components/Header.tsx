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

  const authSection = sessionQuery.data ? (
    <div className="gt-header-auth" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
      className="gt-header-auth"
      onClick={() => { window.location.href = "/api/auth/login"; }}
      style={{
        background: "var(--gt-primary)", color: "#fff", border: "none",
        borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
        cursor: "pointer", flexShrink: 0,
      }}
    >
      Sign in
    </button>
  ) : null;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "var(--gt-header-bg)",
      borderBottom: "1px solid var(--gt-header-border)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px" }}>
        <div className="gt-header-inner">

          {/* Logo — row 1 left on mobile */}
          <div className="gt-header-logo" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <picture>
              <source srcSet="/logo-light.svg" media="(prefers-color-scheme: dark)" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="" role="presentation" style={{ height: 38, width: 38, borderRadius: 10 }} />
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
              It helps developers find beginner-friendly GitHub issues, track their GitHub achievement badges,
              and check for competing pull requests before starting work on an issue.
            </p>
          </section>

          {/* Nav tabs — row 2 centered on mobile */}
          <div className="gt-header-nav" style={{ alignItems: "center" }}>
            <NavTabs />
          </div>

          {/* Spacer — collapses on mobile */}
          <div className="gt-header-spacer" style={{ flex: 1 }} />

          {/* Rate limit — hidden on mobile */}
          <div className="gt-header-rl" style={{ alignItems: "center" }}>
            <RateLimitDisplay />
          </div>

          {/* Auth — row 1 right on mobile (via margin-left: auto) */}
          {authSection}
        </div>
      </div>
    </header>
  );
}
