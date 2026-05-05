import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { BADGE_CONFIG, TIER_LABELS, type BadgeKey } from "@/lib/github/badges";

export const runtime = "edge";

// Satori note: width/height on <img> must be numbers in the style prop, not HTML attrs.
// z-index is NOT supported. position: absolute is supported but needs a positioned parent.

const TIER_PALETTE = {
  0: { primary: "#888888", secondary: "#444444", glow: "rgba(136,136,136,0.3)", label: "NOT EARNED" },
  1: { primary: "#CD7F32", secondary: "#8B4513", glow: "rgba(205,127,50,0.45)", label: "BRONZE" },
  2: { primary: "#C0C0C0", secondary: "#808080", glow: "rgba(192,192,192,0.45)", label: "SILVER" },
  3: { primary: "#FFD700", secondary: "#B8860B", glow: "rgba(255,215,0,0.55)", label: "GOLD" },
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

    const tier = tierParam as 0 | 1 | 2 | 3 | 4;
    const badgeConfig = BADGE_CONFIG[badgeParam] ?? BADGE_CONFIG.pullShark;
    const palette = TIER_PALETTE[tier];
    const hasEarned = tier > 0;

    // Build share text line
    const statsLine = hasEarned
      ? `${currentParam} ${badgeConfig.contributionNoun}${nextParam ? ` · Next tier at ${nextParam}` : " · Max tier!"}`
      : `Start contributing to earn this badge`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: 1200,
            height: 630,
            // Jet-black base
            background: "#06080C",
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            position: "relative",
          }}
        >
          {/* ── Left Panel: Vivid colour block ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 420,
              height: 630,
              background: hasEarned
                ? `linear-gradient(160deg, ${palette.secondary} 0%, #000 60%)`
                : "linear-gradient(160deg, #1a1a1a 0%, #000 100%)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Radial glow behind the badge */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 340,
                height: 340,
                marginTop: -170,
                marginLeft: -170,
                borderRadius: "50%",
                background: hasEarned
                  ? `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`
                  : "transparent",
              }}
            />

            {/* Badge image – width/height MUST be in style not attrs for Satori */}
            {badgeConfig.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={badgeConfig.image}
                alt=""
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "contain",
                  filter: hasEarned ? "none" : "grayscale(100%) opacity(40%)",
                }}
              />
            ) : (
              <span style={{ fontSize: 160, lineHeight: 1 }}>{badgeConfig.emoji}</span>
            )}

            {/* Tier Badge pill below image */}
            <div
              style={{
                display: "flex",
                marginTop: 28,
                background: hasEarned ? palette.primary : "#333",
                color: tier === 3 || tier === 4 ? "#000" : "#fff",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 4,
                padding: "10px 32px",
                borderRadius: 999,
              }}
            >
              {palette.label}
            </div>
          </div>

          {/* ── Right Panel: Tier-colored border + content ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              padding: "56px 64px",
              borderLeft: `4px solid ${hasEarned ? palette.primary : "#222"}`,
            }}
          >
            {/* Top: ACHIEVEMENT UNLOCKED label */}
            {hasEarned && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: palette.primary,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                }}
              >
                <span>🏆</span>
                <span>Achievement Unlocked</span>
              </div>
            )}

            {/* Middle: Badge Name */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 76,
                  fontWeight: 900,
                  letterSpacing: -2,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                {badgeConfig.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  color: "#8B949E",
                  fontWeight: 400,
                }}
              >
                {badgeConfig.contributionNoun.charAt(0).toUpperCase() + badgeConfig.contributionNoun.slice(1)} · GitHub Achievement
              </div>
            </div>

            {/* Stats box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "24px 32px",
              }}
            >
              {/* User */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${user}.png?size=80`}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: `2px solid ${hasEarned ? palette.primary : "#444"}`,
                  }}
                />
                <span style={{ fontSize: 30, color: "#fff", fontWeight: 700 }}>@{user}</span>
              </div>

              {/* Stats line */}
              <div
                style={{
                  fontSize: 22,
                  color: hasEarned ? palette.primary : "#666",
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                {statsLine}
              </div>
            </div>

            {/* Bottom: GitTrek branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#484F58",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              <span>🚀</span>
              <span>gittrek.vercel.app</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error("[OG Badge]", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
