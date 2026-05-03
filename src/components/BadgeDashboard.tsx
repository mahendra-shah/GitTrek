"use client";

import { useEffect, useState } from "react";
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



// ── Client Component with Local Storage Caching ──────────────────────────────
export function BadgeDashboard({ username, isOwnProfile }: Props) {
  const cacheKey = `gittrek-badges-${username}`;

  const [results, setResults] = useState<BadgeResult[] | null>(null);

  useEffect(() => {
    // 1. Immediately try to load from local storage if it's the logged-in user
    if (isOwnProfile && !results) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setResults(JSON.parse(cached));
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [cacheKey, isOwnProfile]); // Run once to paint cache

  useEffect(() => {
    let active = true;

    async function fetchAll() {
      // 2. Fetch fresh data from APIs in the background
      const [pullShark, starstruck, galaxyBrain, yolo, sponsor] = await Promise.all([
        fetch(`/api/github/badges/pull-shark?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : { count: 0 }).catch(() => ({ count: 0 })),
        fetch(`/api/github/badges/starstruck?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : { maxStars: 0, repoName: "" }).catch(() => ({ maxStars: 0, repoName: "" })),
        fetch(`/api/github/badges/galaxy-brain?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : { answerCount: 0 }).catch(() => ({ answerCount: 0 })),
        fetch(`/api/github/badges/yolo?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : { count: 0, isEarned: false }).catch(() => ({ count: 0, isEarned: false })),
        fetch(`/api/github/badges/public-sponsor?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : { isEarned: false, sponsoringCount: 0 }).catch(() => ({ isEarned: false, sponsoringCount: 0 })),
      ]);

      if (!active) return;

      const newResults: BadgeResult[] = [
        {
          key: "pullShark",
          config: BADGE_CONFIG.pullShark,
          tierResult: calculateTier(pullShark.count, BADGE_CONFIG.pullShark.tiers),
        },
        {
          key: "starstruck",
          config: BADGE_CONFIG.starstruck,
          tierResult: calculateTier(starstruck.maxStars, BADGE_CONFIG.starstruck.tiers),
        },
        {
          key: "galaxyBrain",
          config: BADGE_CONFIG.galaxyBrain,
          tierResult: calculateTier(galaxyBrain.answerCount, BADGE_CONFIG.galaxyBrain.tiers),
        },
        {
          key: "yolo",
          config: BADGE_CONFIG.yolo,
          tierResult: calculateTier(yolo.count, BADGE_CONFIG.yolo.tiers),
        },
        {
          key: "publicSponsor",
          config: BADGE_CONFIG.publicSponsor,
          tierResult: calculateTier(sponsor.sponsoringCount, BADGE_CONFIG.publicSponsor.tiers),
        },
        {
          key: "quickdraw",
          config: BADGE_CONFIG.quickdraw,
          tierResult: calculateTier(0, BADGE_CONFIG.quickdraw.tiers),
        },
      ];

      setResults(newResults);

      // 3. Cache the fresh data for next time
      if (isOwnProfile) {
        localStorage.setItem(cacheKey, JSON.stringify(newResults));
      }
    }

    fetchAll();
    return () => { active = false; };
  }, [username, isOwnProfile, cacheKey]);

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
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gt-text)" }}>
            @{username}
          </div>
          {!isOwnProfile && (
            <div style={{ fontSize: 12, color: "var(--gt-text-subtle)", marginTop: 2 }}>
              Viewing public profile
            </div>
          )}
        </div>
      </div>

      {/* ── Focus coaching card ── */}
      {focus && <FocusBadge focusBadge={focus} username={username} />}

      {/* ── Badge grid ── */}
      <div
        style={{
          columnWidth: 340,
          columnGap: 14,
        }}
      >
        {results.map((badge) => (
          <BadgeCard
            key={badge.key}
            badge={badge}
            loopUrl={LOOP_URLS[badge.key] ?? null}
          />
        ))}
      </div>

      {/* ── Data disclaimer ── */}
      <p
        style={{
          fontSize: 12,
          color: "var(--gt-text-subtle)",
          textAlign: "center",
          margin: "8px 0 0",
          lineHeight: 1.6,
        }}
      >
        All counts are based on <strong>public activity only</strong>. Tier thresholds are community-verified,
        not officially documented by GitHub.
      </p>
    </div>
  );
}
