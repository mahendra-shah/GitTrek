"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: number;
  source?: "user" | "bot";
};

type RateLimitResponse = {
  activeSearchLimit?: RateLimitInfo;
  resources?: {
    search?: RateLimitInfo;
    graphql?: RateLimitInfo;
  };
};

export function RateLimitDisplay() {
  const { data } = useQuery<RateLimitResponse | null>({
    queryKey: ["rateLimit"],
    queryFn: async () => {
      const res = await fetch("/api/github/rate-limit");
      if (!res.ok) return null;
      return res.json();
    },
    // Poll every 90 s — the only source of truth, no longer overwritten by search results
    staleTime: 90 * 1000,
    refetchInterval: 90 * 1000,
  });

  const rl: RateLimitInfo | undefined = data?.activeSearchLimit ?? data?.resources?.search;

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!rl?.reset) return;

    const tick = () => {
      const s = Math.max(0, Math.round(rl.reset - Date.now() / 1000));
      setTimeLeft(s);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rl?.reset]);

  const [isHovered, setIsHovered] = useState(false);

  if (!rl) return null;

  const isLow = rl.remaining < rl.limit * 0.2;
  const isUser = rl.source === "user";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
          borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "help",
          textDecoration: "underline dotted var(--gt-text-subtle)",
        }}
      >
        {/* Status dot */}
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isLow ? "var(--gt-primary)" : "var(--gt-safe-text)",
          display: "inline-block", flexShrink: 0,
          boxShadow: isLow ? "0 0 4px rgba(249,115,22,0.6)" : "0 0 4px rgba(34,197,94,0.5)",
        }} />
        <span style={{ color: "var(--gt-header-rl-text)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: isLow ? "var(--gt-primary)" : "var(--gt-text)" }}>
            {rl.remaining.toLocaleString()}
          </span>
          {isUser ? " / hr" : " searches left"}
          <span style={{ color: "var(--gt-text-subtle)", opacity: 0.6 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </span>
        </span>
        {timeLeft !== null && rl.remaining < rl.limit && timeLeft > 0 && (
          <span style={{ color: "var(--gt-text-subtle)", fontFamily: "monospace" }}>
            · {formatTime(timeLeft)}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 10,
          width: 290, padding: "14px 18px", background: "var(--gt-card)",
          border: "1px solid var(--gt-border-strong)", borderRadius: 12,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
          fontSize: 12, color: "var(--gt-text-muted)",
          zIndex: 9999, pointerEvents: "none", lineHeight: 1.5,
          animation: "gt-fade-in 0.15s ease-out"
        }}>
          <strong style={{ color: "var(--gt-text)", display: "block", marginBottom: 6, fontSize: 13 }}>
            {isUser ? "Your GitHub API Quota" : "Guest Search Quota"}
          </strong>
          {isUser ? (
            <>
              You have <strong>{rl.remaining.toLocaleString()}</strong> of {rl.limit.toLocaleString()} GraphQL requests left this hour.
              <div style={{ marginTop: 8, padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                Signed-in users get <strong>5,000 / hr</strong> — plenty for heavy usage.
              </div>
            </>
          ) : (
            <>
              <strong>{rl.remaining}</strong> of {rl.limit} guest searches remain.
              <div style={{ marginTop: 8, padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                • <strong>Sign in with GitHub</strong> for 5,000 / hr<br />
                • Guest users share a limited pool
              </div>
            </>
          )}
          {timeLeft !== null && timeLeft > 0 && (
            <div style={{ marginTop: 8 }}>
              Resets in <span style={{ color: "var(--gt-primary)", fontWeight: 600 }}>{formatTime(timeLeft)}</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
