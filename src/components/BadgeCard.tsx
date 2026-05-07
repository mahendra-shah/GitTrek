"use client";

import { type BadgeResult, type ShareableCardData, TIER_LABELS } from "@/lib/github/badges";
import { useState, useRef, useEffect } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { ShareBadgeModal } from "./ShareBadgeModal";

type Props = {
  badge: BadgeResult;
  loopUrl?: string | null;
  username: string;
  isHighlighted?: boolean;
  index?: number;
  shareCardData: ShareableCardData;
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

export function BadgeCard({ badge, loopUrl, username, isHighlighted, index = 0, shareCardData }: Props) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const { config, tierResult } = badge;
  const { tier, tierLabel, current, nextThreshold, needed, percentToNext, isMaxed } = tierResult;
  const colors = TIER_COLORS[tier];
  const isNotTrackable = config.trackable === "none";
  const { ref: countRef, value: countDisplay } = useCountUp(isNotTrackable ? 0 : current, 900);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500); // Wait for initial render
    }
  }, [isHighlighted]);

  const cardStyle: React.CSSProperties = {
    background: "var(--gt-card)",
    border: isHighlighted ? `2px solid ${colors.bar}` : `1px solid ${isMaxed ? colors.bar : "var(--gt-border)"}`,
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: isHighlighted ? `0 0 40px ${colors.glow}` : (isMaxed
      ? `0 0 0 1px ${colors.glow}, var(--gt-shadow)`
      : "var(--gt-shadow)"),
    opacity: isNotTrackable ? 0.55 : 1,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    breakInside: "avoid",
    marginBottom: 14,
    ["--highlight-glow" as string]: colors.glow,
    ["--highlight-bar" as string]: colors.bar,
    animation: isHighlighted ? "gt-celebration-ring 1.5s ease-out 2" : undefined,
    transition: "box-shadow 0.3s, border-color 0.3s",
    animationDelay: `${index * 0.08}s`,
  };

  return (
    <article
      ref={cardRef}
      id={badge.key}
      className={`gt-badge-card-animated${isNotTrackable ? "" : " gt-card-interactive"}`}
      style={cardStyle}
      aria-label={`${config.label} badge — ${tierLabel}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: colors.pill.bg,
              border: tier > 0 ? "none" : `1px solid ${colors.glow}`,
              position: "relative",
              overflow: "visible",
            }}
          >
            {tier > 0 && <span className="gt-badge-shimmer-ring" aria-hidden />}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.pill.bg,
                border: `1px solid ${colors.glow}`,
                position: "relative",
                zIndex: 1,
              }}
            >
              {config.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.image}
                  alt=""
                  width={40}
                  height={40}
                  style={{ objectFit: "contain", filter: tier === 0 ? "grayscale(100%) opacity(50%)" : "none" }}
                />
              ) : (
                <span style={{ fontSize: 26, opacity: tier === 0 ? 0.5 : 1 }}>{config.emoji}</span>
              )}
            </div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--gt-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {config.label}
          </h3>
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            padding: "4px 10px",
            borderRadius: 999,
            background: colors.pill.bg,
            color: colors.pill.text,
            textTransform: "uppercase",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {tier > 0 ? tierLabel : "NOT EARNED"}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: "var(--gt-text-muted)", lineHeight: 1.5 }}>
        {config.description}
      </p>

      {!isNotTrackable && (
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              height: 8,
              background: "var(--gt-card-hover)",
              borderRadius: 99,
              overflow: "hidden",
            }}
            role="progressbar"
            aria-valuenow={percentToNext}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: "100%",
                width: `${percentToNext}%`,
                background: `linear-gradient(90deg, ${colors.bar}88, ${colors.bar})`,
                borderRadius: 99,
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
            <span style={{ color: "var(--gt-text)" }}>
              <span ref={countRef} style={{ fontWeight: 600 }}>
                {fmtNum(countDisplay)}
              </span>
              <span style={{ color: "var(--gt-text-muted)" }}>
                {nextThreshold !== null ? ` / ${fmtNum(nextThreshold)}` : ""} {config.contributionNoun}
              </span>
            </span>
            {isMaxed ? (
              <span style={{ color: colors.bar, fontWeight: 600, fontSize: 12 }}>Maximum tier reached ✓</span>
            ) : needed !== null ? (
              <span style={{ color: "var(--gt-text-subtle)", fontSize: 12 }}>
                <strong style={{ color: "var(--gt-text)" }}>{fmtNum(needed)}</strong> more to {(TIER_LABELS as readonly string[])[tier + 1]}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {isNotTrackable && (
        <div style={{ marginTop: 4, fontSize: 12, color: "var(--gt-text-subtle)", fontStyle: "italic" }}>
          Not trackable via public API.
        </div>
      )}

      {loopUrl && !isMaxed && !isNotTrackable && (
        <a
          href={loopUrl}
          className="gt-loop-cta"
          style={{
            display: "block",
            background: "var(--gt-primary-glow)",
            border: "1px solid rgba(249,115,22,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--gt-primary)",
            textDecoration: "none",
            textAlign: "left",
          }}
        >
          {loopUrl.includes("discussions") 
            ? "🧠 Find Discussions to answer →" 
            : badge.key === "starstruck"
            ? "🌟 Find popular projects to join →"
            : "🔍 Find issues to merge →"}
        </a>
      )}

      {tier > 0 && (
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="gt-share-btn"
          aria-label={`Share ${config.label} badge`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            border: "2px solid var(--gt-primary)",
            cursor: "pointer",
            color: "var(--gt-primary)",
            fontSize: 14,
            fontWeight: 700,
            padding: "10px 14px",
            borderRadius: 10,
            marginTop: 2,
          }}
        >
          Share Achievement →
        </button>
      )}

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

      {tier > 0 && (
        <ShareBadgeModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          badge={{
            key: badge.key,
            label: config.label,
            tierLabel,
            tier,
            percent: percentToNext,
            current,
            next: nextThreshold,
            needed,
            emoji: config.emoji,
            image: config.image,
          }}
          username={username}
          shareCardData={shareCardData}
        />
      )}
    </article>
  );
}

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
