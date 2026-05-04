"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function RateLimitDisplay() {
  const { data } = useQuery({
    queryKey: ["rateLimit"],
    queryFn: async () => {
      const res = await fetch("/api/github/rate-limit");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const rl = data?.activeSearchLimit || data?.resources?.search;

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

  if (!rl) return null;

  const isLow = rl && rl.remaining < rl.limit * 0.2;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      title={`GitHub API Search Limit — You have ${rl?.remaining ?? 0} of ${rl?.limit ?? 0} searches left for this hour. For logged-in users, GitHub provides up to 5,000 searches per hour. Non-logged-in guest users get a maximum of 60 searches per hour. Reset in ${timeLeft !== null && timeLeft > 0 ? formatTime(timeLeft) : "0:00"}.`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
        borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "default",
      }}
    >
      {/* Mini progress arc */}
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: isLow ? "var(--gt-primary)" : "var(--gt-safe-text)",
        display: "inline-block", flexShrink: 0,
        boxShadow: isLow ? "0 0 4px rgba(249,115,22,0.6)" : "0 0 4px rgba(34,197,94,0.5)",
      }} />
      <span style={{ color: "var(--gt-header-rl-text)" }}>
        <span style={{ fontWeight: 700, color: isLow ? "var(--gt-primary)" : "var(--gt-text)" }}>
          {rl?.remaining ?? 0}
        </span>
        {" searches left"}
      </span>
      {timeLeft !== null && rl && rl.remaining < rl.limit && timeLeft > 0 && (
        <span style={{ color: "var(--gt-text-subtle)", fontFamily: "monospace" }}>
          · {formatTime(timeLeft)}
        </span>
      )}
    </div>
  );
}
