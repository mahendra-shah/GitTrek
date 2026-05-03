"use client";

import { type BadgeResult, TIER_LABELS } from "@/lib/github/badges";
import { useRouter } from "next/navigation";

type Props = {
  badge: BadgeResult;
  /** Issue Finder pre-fill URL for "The Loop" CTA. null = no CTA shown. */
  loopUrl?: string | null;
};

const TIER_COLORS = {
  0: { bar: "#484F58", glow: "transparent", pill: { bg: "var(--gt-card-hover)", text: "var(--gt-text-subtle)" } },
  1: { bar: "#CD7F32", glow: "rgba(205,127,50,0.25)", pill: { bg: "rgba(205,127,50,0.15)", text: "#CD7F32" } },
  2: { bar: "#A8A9AD", glow: "rgba(168,169,173,0.25)", pill: { bg: "rgba(168,169,173,0.15)", text: "#A8A9AD" } },
  3: { bar: "#FFD700", glow: "rgba(255,215,0,0.25)", pill: { bg: "rgba(255,215,0,0.15)", text: "#FFD700" } },
  4: { bar: "#E5E4E2", glow: "rgba(229,228,226,0.35)", pill: { bg: "rgba(229,228,226,0.15)", text: "#E5E4E2" } },
} as const;

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function BadgeCard({ badge, loopUrl }: Props) {
  const router = useRouter();
  const { config, tierResult } = badge;
  const { tier, tierLabel, current, nextThreshold, needed, percentToNext, isMaxed } = tierResult;
  const colors = TIER_COLORS[tier];
  const isNotTrackable = config.trackable === "none";

  const cardStyle: React.CSSProperties = {
    background: "var(--gt-card)",
    border: `1px solid ${isMaxed ? colors.bar : "var(--gt-border)"}`,
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: isMaxed
      ? `0 0 0 1px ${colors.glow}, var(--gt-shadow)`
      : "var(--gt-shadow)",
    opacity: isNotTrackable ? 0.55 : 1,
    transition: "box-shadow 0.2s, border-color 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    breakInside: "avoid",
    marginBottom: 14,
  };

  return (
    <article
      style={cardStyle}
      aria-label={`${config.label} badge — ${tierLabel}`}
      onMouseEnter={(e) => {
        if (!isNotTrackable) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${colors.glow}, var(--gt-shadow-hover)`;
          (e.currentTarget as HTMLElement).style.borderColor = isMaxed ? colors.bar : "var(--gt-border-strong)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isMaxed
          ? `0 0 0 1px ${colors.glow}, var(--gt-shadow)`
          : "var(--gt-shadow)";
        (e.currentTarget as HTMLElement).style.borderColor = isMaxed ? colors.bar : "var(--gt-border)";
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {config.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={config.image} alt={config.label} width={42} height={42} style={{ flexShrink: 0, filter: isNotTrackable ? "grayscale(100%)" : "none" }} />
          ) : (
            <span style={{ fontSize: 28 }} role="img" aria-label={config.label}>
              {config.emoji}
            </span>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gt-text)", lineHeight: 1.2 }}>
              {config.label}
            </div>
            {config.estimated && (
              <div style={{ fontSize: 11, color: "var(--gt-text-subtle)", marginTop: 2 }}>Estimated</div>
            )}
          </div>
        </div>

        {/* Tier pill */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            background: colors.pill.bg,
            color: colors.pill.text,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {isNotTrackable ? "Not trackable" : isMaxed ? "🏆 Max tier" : tierLabel === "Not earned" ? "Not earned" : `✦ ${tierLabel}`}
        </span>
      </div>

      {/* ── Progress section ── */}
      {!isNotTrackable && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Bar */}
          <div
            role="progressbar"
            aria-valuenow={percentToNext}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${config.label} progress: ${percentToNext}%`}
            style={{
              height: 6,
              borderRadius: 99,
              background: "var(--gt-card-hover)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${percentToNext}%`,
                borderRadius: 99,
                background: isMaxed
                  ? `linear-gradient(90deg, ${colors.bar}, white)`
                  : colors.bar,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: percentToNext > 0 ? `0 0 8px ${colors.glow}` : "none",
              }}
            />
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "var(--gt-text-muted)",
            }}
          >
            <span>
              <strong style={{ color: "var(--gt-text)", fontWeight: 700 }}>{fmtNum(current)}</strong>
              {nextThreshold ? ` / ${fmtNum(nextThreshold)}` : ""}
            </span>
            {isMaxed ? (
              <span style={{ color: colors.bar, fontWeight: 600 }}>Maximum tier reached ✓</span>
            ) : (
              <span>
                <strong style={{ color: "var(--gt-text)", fontWeight: 700 }}>{fmtNum(needed)}</strong> more to{" "}
                {TIER_LABELS[tier + 1]}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── The Loop CTA ── */}
      {loopUrl && !isMaxed && !isNotTrackable && (
        <button
          onClick={() => router.push(loopUrl)}
          style={{
            background: "var(--gt-primary-glow)",
            border: "1px solid rgba(249,115,22,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--gt-primary)",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s",
            width: "100%",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gt-primary-glow)"; }}
        >
          {loopUrl.includes("discussions") ? "🧠 Find Discussions to answer →" : "🔍 Find issues to merge →"}
        </button>
      )}

      {/* ── "What breaks this?" honesty layer ── */}
      <details style={{ marginTop: 4 }}>
        <summary
          style={{
            fontSize: 12,
            color: "var(--gt-text-subtle)",
            cursor: "pointer",
            userSelect: "none",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 10 }}>▶</span> What affects this calculation?
        </summary>
        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--gt-text-muted)",
            lineHeight: 1.6,
            paddingLeft: 14,
            borderLeft: "2px solid var(--gt-border)",
          }}
        >
          {config.caveat}
        </p>
      </details>
    </article>
  );
}

/** Pixel-perfect skeleton — matches BadgeCard dimensions to prevent layout shift. */
export function BadgeCardSkeleton() {
  const pulse: React.CSSProperties = {
    background: "var(--gt-card-hover)",
    borderRadius: 6,
    animation: "gt-pulse 1.5s ease-in-out infinite",
  };
  return (
    <div
      style={{
        background: "var(--gt-card)",
        border: "1px solid var(--gt-border)",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        breakInside: "avoid",
        marginBottom: 14,
      }}
      aria-hidden="true"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...pulse, width: 32, height: 32, borderRadius: 8 }} />
          <div style={{ ...pulse, width: 100, height: 16 }} />
        </div>
        <div style={{ ...pulse, width: 60, height: 22, borderRadius: 20 }} />
      </div>
      <div style={{ ...pulse, height: 6, borderRadius: 99 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ ...pulse, width: 60, height: 13 }} />
        <div style={{ ...pulse, width: 120, height: 13 }} />
      </div>
    </div>
  );
}
