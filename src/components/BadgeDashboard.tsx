"use client";

import { useEffect, useState, useCallback } from "react";
import {
  findFocusBadge,
  badgeResultsFromUnifiedApi,
  buildShareableCardData,
  LOOP_URLS,
  type BadgeResult,
} from "@/lib/github/badges";
import type { UnifiedBadgeApiJson } from "@/lib/github/fetch-unified-badges";
import { BadgeCard, BadgeCardSkeleton } from "@/components/BadgeCard";
import { FocusBadge } from "@/components/FocusBadge";

type Props = {
  username: string;
  isOwnProfile: boolean;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCache(key: string): BadgeResult[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: BadgeResult[]; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: BadgeResult[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage may be full or disabled — fail silently
  }
}

export function BadgeDashboard({ username, isOwnProfile }: Props) {
  const cacheKey = `gittrek-badges-v2-${username}`;

  const [results, setResults] = useState<BadgeResult[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightKey] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("highlight");
    }
    return null;
  });
  const [fetchError, setFetchError] = useState(false);

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      setNotFound(false);
      setFetchError(false);
      setIsRefreshing(true);

      if (!forceRefresh) {
        const cached = readCache(cacheKey);
        if (cached) {
          setResults(cached);
          setIsRefreshing(false);
          return;
        }
      }

      setResults(null);
      const res = await fetch(`/api/github/badges?username=${encodeURIComponent(username)}`);

      if (res.status === 404) {
        setNotFound(true);
        setIsRefreshing(false);
        return;
      }

      if (!res.ok) {
        setFetchError(true);
        setIsRefreshing(false);
        return;
      }

      const json = (await res.json()) as UnifiedBadgeApiJson;

      const newResults = badgeResultsFromUnifiedApi(json);

      setResults(newResults);

      if (isOwnProfile) {
        writeCache(cacheKey, newResults);
      }

      setIsRefreshing(false);
    },
    [username, isOwnProfile, cacheKey]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll(false);
  }, [fetchAll]);

  if (notFound) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "64px 20px", background: "var(--gt-card)", border: "1px dashed var(--gt-border-strong)",
        borderRadius: 14, textAlign: "center", gap: 16
      }}>
        <div style={{ fontSize: 48, filter: "grayscale(100%) opacity(50%)" }}>👻</div>
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600, color: "var(--gt-text)" }}>User Not Found</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--gt-text-muted)", maxWidth: 340 }}>
            We couldn&apos;t find a GitHub user with the handle <strong>@{username}</strong>. They might have changed their username or deleted their account.
          </p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "64px 20px", background: "var(--gt-danger-bg)", border: "1px solid var(--gt-danger-border)",
        borderRadius: 14, textAlign: "center", gap: 16
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "var(--gt-danger-text)" }}>Failed to load badges</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--gt-text-muted)", maxWidth: 340 }}>
            GitHub&apos;s API returned an error. This may be a rate limit or temporary outage.
          </p>
          <button
            onClick={() => { setFetchError(false); fetchAll(true); }}
            style={{
              background: "var(--gt-primary)", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div style={{ columnWidth: 340, columnGap: 14 }} aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <BadgeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const focus = findFocusBadge(results);
  const avatarUrl = `https://github.com/${username}.png?size=128`;
  const shareCardData = buildShareableCardData(username, avatarUrl, results);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          background: "var(--gt-card)",
          border: "1px solid var(--gt-border)",
          borderRadius: 14,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://github.com/${username}.png?size=64`}
          alt={`${username}'s GitHub avatar`}
          width={48}
          height={48}
          style={{ borderRadius: "50%", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gt-text)" }}>
            @{username}
          </div>
          {!isOwnProfile && (
            <div style={{ fontSize: 12, color: "var(--gt-text-subtle)", marginTop: 2 }}>
              Viewing public profile
            </div>
          )}
        </div>

        <button
          id="badge-refresh-btn"
          onClick={() => fetchAll(true)}
          disabled={isRefreshing}
          title="Refresh badge progress"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: isRefreshing ? "var(--gt-text-muted)" : "var(--gt-primary)",
            background: "transparent",
            border: "1px solid var(--gt-border)",
            borderRadius: 8,
            cursor: isRefreshing ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "inline-block", animation: isRefreshing ? "gt-spin 1s linear infinite" : "none" }}>
            ⟳
          </span>
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {focus && <FocusBadge focusBadge={focus} />}

      <div style={{ columnWidth: 340, columnGap: 14 }}>
        {results.map((badge, idx) => (
          <BadgeCard
            key={badge.key}
            badge={badge}
            loopUrl={LOOP_URLS[badge.key] ?? null}
            username={username}
            isHighlighted={badge.key === highlightKey}
            index={idx}
            shareCardData={shareCardData}
          />
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--gt-text-subtle)", textAlign: "center", margin: "8px 0 0", lineHeight: 1.6 }}>
        All counts are based on <strong>public activity only</strong>. Tier thresholds are community-verified,
        not officially documented by GitHub. Data cached for 1 hour —{" "}
        <button
          onClick={() => fetchAll(true)}
          style={{ background: "none", border: "none", color: "var(--gt-primary)", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}
        >
          refresh now
        </button>
        .
      </p>
    </div>
  );
}
