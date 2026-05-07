import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { BADGE_CONFIG, TIER_LABELS, type BadgeKey } from "@/lib/github/badges";

export const runtime = "edge";

const TIER_PALETTE = {
  0: { primary: "#888888", secondary: "#444444", glow: "rgba(136,136,136,0.35)", label: "NOT EARNED" },
  1: { primary: "#CD7F32", secondary: "#8B4513", glow: "rgba(205,127,50,0.5)", label: "BRONZE" },
  2: { primary: "#C0C0C0", secondary: "#808080", glow: "rgba(192,192,192,0.5)", label: "SILVER" },
  3: { primary: "#FFD700", secondary: "#B8860B", glow: "rgba(255,215,0,0.6)", label: "GOLD" },
  4: { primary: "#E5E4E2", secondary: "#9E9E9E", glow: "rgba(229,228,226,0.55)", label: "PLATINUM" },
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user") || "Anonymous";
    const badgeParam = searchParams.get("badge") as BadgeKey;
    const tierParam = Math.min(4, Math.max(0, Number(searchParams.get("tier")) || 0));
    const currentParam = searchParams.get("current") || "0";
    const nextParam = searchParams.get("next") || "";
    const pctParam = Math.min(100, Math.max(0, Number(searchParams.get("pct")) || 0));
    const nextTierName = searchParams.get("nextTier") || "";

    const tier = tierParam as 0 | 1 | 2 | 3 | 4;
    const badgeConfig = BADGE_CONFIG[badgeParam] ?? BADGE_CONFIG.pullShark;
    const palette = TIER_PALETTE[tier];
    const hasEarned = tier > 0;

    const nextTierDisplay = nextTierName || (tier < 4 ? (TIER_LABELS[tier + 1] ?? "") : "");

    const atMax = !nextParam || tier >= 4 || pctParam >= 100;
    const footerLine = hasEarned
      ? atMax
        ? `${currentParam} ${badgeConfig.contributionNoun} — ${TIER_LABELS[tier]}`
        : nextTierDisplay
          ? `${currentParam} / ${nextParam} ${badgeConfig.contributionNoun} — ${pctParam}% to ${nextTierDisplay}`
          : `${currentParam} ${badgeConfig.contributionNoun}`
      : `Start contributing to earn ${badgeConfig.label}`;

    const leftBg =
      hasEarned && tier === 3
        ? `linear-gradient(160deg, ${palette.secondary} 0%, #000 55%), radial-gradient(circle at 30% 20%, rgba(255,215,0,0.35) 0%, transparent 45%), radial-gradient(circle at 70% 80%, rgba(255,180,0,0.2) 0%, transparent 40%)`
        : hasEarned && tier === 4
          ? `linear-gradient(160deg, ${palette.secondary} 0%, #000 55%), radial-gradient(circle at 50% 40%, rgba(229,228,226,0.35) 0%, transparent 50%)`
          : hasEarned
            ? `linear-gradient(160deg, ${palette.secondary} 0%, #000 60%)`
            : "linear-gradient(160deg, #1a1a1a 0%, #000 100%)";

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: 1200,
            height: 630,
            background: "#06080C",
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 480,
              height: 630,
              background: leftBg,
              backgroundBlendMode: "normal",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 380,
                height: 380,
                marginTop: -190,
                marginLeft: -190,
                borderRadius: "50%",
                background: hasEarned ? `radial-gradient(circle, ${palette.glow} 0%, transparent 72%)` : "transparent",
              }}
            />

            {badgeConfig.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={badgeConfig.image}
                alt=""
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "contain",
                  filter: hasEarned ? "none" : "grayscale(100%) opacity(40%)",
                }}
              />
            ) : (
              <span style={{ fontSize: 160, lineHeight: 1 }}>{badgeConfig.emoji}</span>
            )}

            <div
              style={{
                display: "flex",
                marginTop: 28,
                background: hasEarned ? palette.primary : "#333",
                color: tier === 3 || tier === 4 ? "#000" : "#fff",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 5,
                padding: "10px 36px",
                borderRadius: 999,
              }}
            >
              <span>{palette.label}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              padding: "52px 56px 48px",
              borderLeft: `4px solid ${hasEarned ? palette.primary : "#222"}`,
            }}
          >
            {hasEarned && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: palette.primary,
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing: 20,
                  textTransform: "uppercase",
                }}
              >
                <span>🏆</span>
                <span>Achievement Unlocked</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  fontWeight: 900,
                  letterSpacing: -2,
                  color: "#FFFFFF",
                  lineHeight: 1.05,
                }}
              >
                {badgeConfig.label}
              </div>
              <div style={{ display: "flex", fontSize: 26, color: "#8B949E", fontWeight: 400 }}>
                {`${badgeConfig.contributionNoun.charAt(0).toUpperCase()}${badgeConfig.contributionNoun.slice(1)} · GitHub Achievement`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 18,
                padding: "22px 28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${user}.png?size=80`}
                  alt=""
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    border: `2px solid ${hasEarned ? palette.primary : "#444"}`,
                  }}
                />
                <span style={{ fontSize: 30, color: "#fff", fontWeight: 700 }}>@{user}</span>
              </div>

              <div style={{ display: "flex", fontSize: 21, color: hasEarned ? "#E6EDF3" : "#666", fontWeight: 600, lineHeight: 1.35 }}>
                {footerLine}
              </div>

              {hasEarned && !atMax && nextParam !== "" && (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: 10,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 99,
                    overflow: "hidden",
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      width: `${pctParam}%`,
                      background: `linear-gradient(90deg, ${palette.primary}aa, ${palette.primary})`,
                      borderRadius: 99,
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#484F58",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              <span>🚀</span>
              <span>gittrek.vercel.app</span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    console.error("[OG Badge]", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
