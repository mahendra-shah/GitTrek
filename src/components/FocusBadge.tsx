"use client";

import { type BadgeResult, LOOP_URLS, TIER_LABELS } from "@/lib/github/badges";
import { useRouter } from "next/navigation";

type Props = {
  focusBadge: BadgeResult;
};

const R = 19;
const CIRC = 2 * Math.PI * R;

export function FocusBadge({ focusBadge }: Props) {
  const router = useRouter();
  const { config, tierResult } = focusBadge;
  const nextTierLabel =
    tierResult.tier < 4 ? ((TIER_LABELS as readonly string[])[tierResult.tier + 1] ?? "") : "";

  const { contributionNoun } = config;
  const loopUrl = LOOP_URLS[focusBadge.key] || "/";
  const pct = tierResult.tier === 0 ? 0 : tierResult.percentToNext;
  const dashOffset = CIRC * (1 - pct / 100);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.04) 100%)",
        border: "1px solid rgba(249,115,22,0.25)",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
      aria-label={`Focus suggestion: ${config.label}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            position: "relative",
          }}
          role="img"
          aria-label={`Progress ${pct}% toward next tier`}
        >
          <svg viewBox="0 0 44 44" width={44} height={44} style={{ display: "block" }}>
            <circle cx={22} cy={22} r={R} fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth={3} />
            <circle
              cx={22}
              cy={22}
              r={R}
              fill="none"
              stroke="#F97316"
              strokeWidth={3}
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {config.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={config.image} alt="" width={26} height={26} style={{ borderRadius: 5, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 20 }}>{config.emoji}</span>
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--gt-primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Focus — Closest to next tier
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--gt-text)",
              lineHeight: 1.3,
            }}
          >
            {config.label}
          </div>
          <div style={{ fontSize: 13, color: "var(--gt-text-muted)", marginTop: 3 }}>
            {tierResult.tier === 0
              ? `${tierResult.needed} ${contributionNoun} to earn ${nextTierLabel}`
              : `${tierResult.needed} more ${contributionNoun} to reach ${nextTierLabel} — ${tierResult.percentToNext}% there`}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(loopUrl)}
        className="gt-focus-cta"
        style={{
          background: "var(--gt-primary)",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {config.label === "Galaxy Brain"
          ? "Find Discussions →"
          : config.label === "Starstruck"
            ? "Find popular projects →"
            : "Find Issues →"}
      </button>
    </div>
  );
}

export function FocusBadgeSkeleton() {
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
        alignItems: "center",
        gap: 16,
      }}
      aria-hidden="true"
    >
      <div style={{ ...pulse, width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ ...pulse, width: 140, height: 12 }} />
        <div style={{ ...pulse, width: 200, height: 18 }} />
        <div style={{ ...pulse, width: 240, height: 13 }} />
      </div>
      <div style={{ ...pulse, width: 110, height: 40, borderRadius: 9, flexShrink: 0 }} />
    </div>
  );
}
