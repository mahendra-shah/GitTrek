"use client";

import { useQuery } from "@tanstack/react-query";

export function RateLimitDisplay() {
  const { data, isLoading } = useQuery({
    queryKey: ["rateLimit"],
    queryFn: async () => {
      const res = await fetch("/api/github/rate-limit");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const rl = data?.resources?.core;

  if (isLoading && !rl) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
        borderRadius: 20, padding: "4px 12px", height: 26, width: 140,
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}>
        <div style={{ width: 40, height: 12, background: "var(--gt-border)", borderRadius: 4 }}></div>
        <div style={{ width: 50, height: 12, background: "var(--gt-border)", borderRadius: 4 }}></div>
      </div>
    );
  }

  if (!rl) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
      borderRadius: 20, padding: "4px 12px", fontSize: 12,
    }}>
      <span style={{ color: "var(--gt-primary)", fontWeight: 700 }}>
        {rl.remaining}/{rl.limit}
      </span>
      <span style={{ color: "var(--gt-header-rl-text)" }} title="Core API Requests Remaining">requests</span>
    </div>
  );
}
