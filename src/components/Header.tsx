"use client";

import { useQuery } from "@tanstack/react-query";
import { NavTabs } from "./NavTabs";
import { RateLimitDisplay } from "./RateLimitDisplay";
import { SITE_HEADER_CONTEXT } from "@/lib/site-copy";

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

  const user = sessionQuery.data;

  const authSection = user ? (
    <div className="gt-header-auth" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.login}
            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gt-primary)", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gt-primary), var(--gt-primary-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initials(user)}
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gt-header-text)" }}>{user.login}</span>
      </div>
      <button
        onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}
        style={{
          background: "none",
          border: "1px solid var(--gt-border)",
          borderRadius: 7,
          cursor: "pointer",
          color: "var(--gt-header-nav-inactive)",
          fontSize: 12,
          fontWeight: 600,
          padding: "5px 11px",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-primary)";
          (e.currentTarget as HTMLElement).style.color = "var(--gt-primary)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-border)";
          (e.currentTarget as HTMLElement).style.color = "var(--gt-header-nav-inactive)";
        }}
      >
        Sign out
      </button>
    </div>
  ) : !sessionQuery.isLoading ? (
    <button
      className="gt-header-auth gt-signin-btn"
      onClick={() => { window.location.href = "/api/auth/login"; }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: "var(--gt-primary)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: "0 1px 8px rgba(249,115,22,0.30)",
        transition: "background 0.15s, box-shadow 0.15s, transform 0.1s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--gt-primary-dark)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(249,115,22,0.42)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--gt-primary)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 8px rgba(249,115,22,0.30)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      Sign in with GitHub
    </button>
  ) : null;

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "var(--gt-header-bg)",
      borderBottom: "1px solid var(--gt-header-border)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
        <div className="gt-header-inner">

          <div className="gt-header-logo" style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <picture>
              <source srcSet="/logo-light.svg" media="(prefers-color-scheme: dark)" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="" role="presentation" style={{ height: 34, width: 34, borderRadius: 9 }} />
            </picture>
            <span style={{ color: "var(--gt-primary)", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
              GitTrek
            </span>
          </div>

          <section className="sr-only">
            <h2>What is GitTrek?</h2>
            <p>{SITE_HEADER_CONTEXT}</p>
          </section>

          <div className="gt-header-nav" style={{ alignItems: "center" }}>
            <NavTabs />
          </div>

          <div className="gt-header-spacer" style={{ flex: 1 }} />

          <div className="gt-header-rl" style={{ alignItems: "center" }}>
            <RateLimitDisplay />
          </div>

          {authSection}

          {children}
        </div>
      </div>
    </header>
  );
}
