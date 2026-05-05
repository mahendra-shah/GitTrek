"use client";

import { useEffect, useState, useCallback } from "react";
import {
  calculateTier,
  findFocusBadge,
  BADGE_CONFIG,
  type BadgeResult,
  type BadgeKey,
  LOOP_URLS,
} from "@/lib/github/badges";
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

// ── Client Component ───────────────────────────────────────────────────────────
export function BadgeDashboard({ username, isOwnProfile }: Props) {
  const cacheKey = `gittrek-badges-v2-${username}`;

  const [results, setResults] = useState<BadgeResult[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      setIsRefreshing(true);

      // Check cache first (skip on force refresh)
      if (!forceRefresh) {
        const cached = readCache(cacheKey);
        if (cached) {
          setResults(cached);
          setIsRefreshing(false);
          return;
        }
      }

      // Fetch all badge data from the unified endpoint.
      // If the user doesn't exist, the endpoint returns 404 — no preflight check needed.
      const res = await fetch(`/api/github/badges?username=${encodeURIComponent(username)}`);

      if (res.status === 404) {
        setNotFound(true);
        setIsRefreshing(false);
        return;
      }

      if (!res.ok) {
        console.warn("[BadgeDashboard] Badge fetch failed:", res.status);
        setIsRefreshing(false);
        return;
      }

      const json = await res.json();

      const newResults: BadgeResult[] = [
        {
          key: "pullShark" as BadgeKey,
          config: BADGE_CONFIG.pullShark,
          tierResult: calculateTier(json.pullShark?.count ?? 0, BADGE_CONFIG.pullShark.tiers),
        },
        {
          key: "starstruck" as BadgeKey,
          config: BADGE_CONFIG.starstruck,
          tierResult: calculateTier(json.starstruck?.maxStars ?? 0, BADGE_CONFIG.starstruck.tiers),
        },
        {
          key: "galaxyBrain" as BadgeKey,
          config: BADGE_CONFIG.galaxyBrain,
          tierResult: calculateTier(json.galaxyBrain?.answerCount ?? 0, BADGE_CONFIG.galaxyBrain.tiers),
        },
        {
          key: "yolo" as BadgeKey,
          config: BADGE_CONFIG.yolo,
          tierResult: calculateTier(json.yolo?.count ?? 0, BADGE_CONFIG.yolo.tiers),
        },
        {
          key: "publicSponsor" as BadgeKey,
          config: BADGE_CONFIG.publicSponsor,
          tierResult: calculateTier(json.publicSponsor?.sponsoringCount ?? 0, BADGE_CONFIG.publicSponsor.tiers),
        },
        {
          key: "quickdraw" as BadgeKey,
          config: BADGE_CONFIG.quickdraw,
          tierResult: calculateTier(0, BADGE_CONFIG.quickdraw.tiers),
        },
      ];

      setResults(newResults);

      // 4. Cache for own profile only
      if (isOwnProfile) {
        writeCache(cacheKey, newResults);
      }

      setIsRefreshing(false);
    },
    [username, isOwnProfile, cacheKey]
  );

  // Reset on username change and kick off fresh fetch
  useEffect(() => {
    setNotFound(false);
    setResults(null);
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

  if (!results) {
    return (
      <div style={{ columnWidth: 340, columnGap: 14 }} aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <BadgeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const focus = findFocusBadge(results);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── User header ── */}
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

        {/* ── Refresh button ── */}
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

      <style>{`
        @keyframes gt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Focus coaching card ── */}
      {focus && <FocusBadge focusBadge={focus} username={username} />}

      {/* ── Badge grid ── */}
      <div style={{ columnWidth: 340, columnGap: 14 }}>
        {results.map((badge) => (
          <BadgeCard
            key={badge.key}
            badge={badge}
            loopUrl={LOOP_URLS[badge.key] ?? null}
          />
        ))}
      </div>

      {/* ── Data disclaimer ── */}
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
