"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function RateLimitDisplay() {
  const { data, isLoading } = useQuery({
    queryKey: ["rateLimit"],
    queryFn: async () => {
      const res = await fetch("/api/github/rate-limit");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: Infinity, // Never poll; we update this cache manually when API calls return
  });

  const rl = data?.resources?.search;

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
      borderRadius: 20, padding: "4px 12px", fontSize: 12,
    }}>
      <span style={{ color: "var(--gt-primary)", fontWeight: 700 }}>
        {rl.remaining}/{rl.limit}
      </span>
      <span style={{ color: "var(--gt-header-rl-text)" }} title="Search API Requests Remaining">requests</span>
      {timeLeft !== null && rl.remaining < rl.limit && timeLeft > 0 && (
        <span style={{ color: "var(--gt-text-subtle)", fontFamily: "monospace", marginLeft: 2 }} title="Resets in">
          ({formatTime(timeLeft)})
        </span>
      )}
    </div>
  );
}
