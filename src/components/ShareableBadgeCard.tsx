"use client";

import {
  BADGE_CONFIG,
  type BadgeKey,
  type ShareableCardData,
  TIER_LABELS,
} from "@/lib/github/badges";
import { rarityLabel } from "@/lib/github/badge-rarity";

type Props = {
  data: ShareableCardData;
  cardRef: React.RefObject<HTMLDivElement | null>;
};

const TIER_ACCENTS: Record<
  string,
  { glow: string; glowSoft: string; bar: string; pillBg: string; pillText: string; text: string }
> = {
  Bronze: {
    glow: "rgba(205,127,50,0.55)",
    glowSoft: "rgba(205,127,50,0.18)",
    bar: "#CD7F32",
    pillBg: "rgba(205,127,50,0.20)",
    pillText: "#E8B179",
    text: "#E8B179",
  },
  Silver: {
    glow: "rgba(220,222,228,0.50)",
    glowSoft: "rgba(220,222,228,0.16)",
    bar: "#DCDEE4",
    pillBg: "rgba(220,222,228,0.20)",
    pillText: "#E8EAEE",
    text: "#E8EAEE",
  },
  Gold: {
    glow: "rgba(255,215,0,0.60)",
    glowSoft: "rgba(255,215,0,0.20)",
    bar: "#FFD700",
    pillBg: "rgba(255,215,0,0.22)",
    pillText: "#FFE769",
    text: "#FFE769",
  },
  Platinum: {
    glow: "rgba(229,228,226,0.55)",
    glowSoft: "rgba(229,228,226,0.18)",
    bar: "#E5E4E2",
    pillBg: "rgba(229,228,226,0.20)",
    pillText: "#F2F1EF",
    text: "#F2F1EF",
  },
  "Not earned": {
    glow: "rgba(136,136,136,0.30)",
    glowSoft: "rgba(136,136,136,0.10)",
    bar: "#888",
    pillBg: "rgba(136,136,136,0.15)",
    pillText: "#A0A6AE",
    text: "#A0A6AE",
  },
};

function tierAccent(tierLabel: string) {
  return TIER_ACCENTS[tierLabel] ?? TIER_ACCENTS["Not earned"];
}

/** ISO 8601 week number — inline to avoid date-fns dep. */
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function nounForBadge(key: BadgeKey): string {
  return BADGE_CONFIG[key]?.contributionNoun ?? "contributions";
}

const FONT_STACK = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export function ShareableBadgeCard({ data, cardRef }: Props) {
  const { username, avatarUrl, earnedBadges, featuredBadge } = data;
  const hero = featuredBadge;
  const heroTier = (hero?.tier ?? 0) as 0 | 1 | 2 | 3 | 4;
  const accent = hero ? tierAccent(hero.tierLabel) : TIER_ACCENTS["Not earned"];
  const heroImage = hero ? BADGE_CONFIG[hero.key]?.image : undefined;
  const heroEmoji = hero ? BADGE_CONFIG[hero.key]?.emoji : "🏅";
  const wordmark = hero ? hero.tierLabel.toUpperCase() : "EXPLORER";

  const { week, year } = getISOWeek(new Date());

  const nextTierLabel =
    hero && hero.tier > 0 && hero.tier < 4
      ? (TIER_LABELS[hero.tier + 1] as string)
      : null;

  const otherEarnedBadges = hero
    ? earnedBadges.filter((b) => b.key !== hero.key)
    : earnedBadges;

  const rarity = hero ? rarityLabel(hero.key, heroTier) : "";

  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      style={{
        width: 1080,
        height: 1350,
        background: "#06080C",
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        color: "#E6EDF3",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 20%, ${accent.glow} 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 80% 85%, ${accent.glowSoft} 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            color: "rgba(230,237,243,0.50)",
            textTransform: "uppercase",
          }}
        >
          Week {week} · {year}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1,
            color: "rgba(249,115,22,0.95)",
          }}
        >
          gittrek.vercel.app
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          marginTop: 24,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 280,
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -40,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent.glow} 0%, transparent 60%)`,
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent.glowSoft} 0%, transparent 65%)`,
              filter: "blur(24px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              boxShadow: `0 0 60px 20px ${accent.glowSoft}, inset 0 0 40px ${accent.glowSoft}`,
            }}
          />
          {heroImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={heroImage}
              alt=""
              width={260}
              height={260}
              crossOrigin="anonymous"
              style={{
                position: "relative",
                objectFit: "contain",
                filter: heroTier > 0
                  ? `drop-shadow(0 16px 40px ${accent.glow})`
                  : "grayscale(1) opacity(0.4)",
              }}
            />
          ) : (
            <span style={{ fontSize: 220, lineHeight: 1, position: "relative" }}>
              {heroEmoji}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: 8,
            color: accent.text,
            lineHeight: 1,
            marginBottom: 8,
            textShadow: `0 4px 24px ${accent.glow}`,
          }}
        >
          {wordmark}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "rgba(230,237,243,0.85)",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          {hero ? BADGE_CONFIG[hero.key].label : "GitHub Achievements"}
        </div>

        {hero ? (
          <>
            <div
              style={{
                fontSize: 140,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: -4,
                lineHeight: 1,
                textShadow: `0 8px 40px ${accent.glow}`,
              }}
            >
              {hero.current.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "rgba(230,237,243,0.65)",
                marginTop: 8,
              }}
            >
              {nounForBadge(hero.key)}
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: accent.text,
                marginTop: 28,
                letterSpacing: 0.5,
              }}
            >
              {rarity}
            </div>

            {!hero.isMaxed && hero.nextThreshold !== null && nextTierLabel && (
              <div
                style={{
                  marginTop: 28,
                  width: 520,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    height: 6,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(2, hero.percentToNext)}%`,
                      background: `linear-gradient(90deg, ${accent.bar}77, ${accent.bar})`,
                      borderRadius: 99,
                      boxShadow: `0 0 16px ${accent.glow}`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "rgba(230,237,243,0.7)",
                    letterSpacing: 0.5,
                  }}
                >
                  {hero.percentToNext}% to {nextTierLabel} ·{" "}
                  {(hero.nextThreshold - hero.current).toLocaleString()} to go
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "rgba(230,237,243,0.7)",
              marginTop: 16,
            }}
          >
            Start contributing to unlock badges
          </div>
        )}
      </div>

      {otherEarnedBadges.length > 0 && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          {otherEarnedBadges.slice(0, 6).map((b) => {
            const chipAccent = tierAccent(b.tierLabel);
            return (
              <div
                key={b.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "rgba(230,237,243,0.92)",
                  letterSpacing: 0.3,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: chipAccent.bar,
                    boxShadow: `0 0 8px ${chipAccent.glow}`,
                  }}
                />
                <span>{b.label}</span>
                <span style={{ color: chipAccent.text, fontWeight: 800 }}>
                  {b.tierLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          width={56}
          height={56}
          crossOrigin="anonymous"
          style={{
            borderRadius: "50%",
            border: `2px solid ${accent.bar}`,
            boxShadow: `0 0 16px ${accent.glowSoft}`,
          }}
        />
        <div style={{ fontSize: 22, fontWeight: 800, color: "#E6EDF3", letterSpacing: -0.3 }}>
          @{username}
        </div>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "rgba(230,237,243,0.4)",
          }}
        />
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(249,115,22,0.95)",
            letterSpacing: 0.5,
          }}
        >
          gittrek.vercel.app
        </div>
      </div>
    </div>
  );
}
