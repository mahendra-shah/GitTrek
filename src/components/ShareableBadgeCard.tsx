"use client";

import { useRef } from "react";
import { type ShareableCardData, TIER_LABELS } from "@/lib/github/badges";

type Props = {
  data: ShareableCardData;
  /** Ref forwarded from the parent so ShareButton can trigger html2canvas on it. */
  cardRef: React.RefObject<HTMLDivElement | null>;
};

export function ShareableBadgeCard({ data, cardRef }: Props) {
  const { username, avatarUrl, earnedBadges, focusBadge } = data;

  const TIER_DOT_COLORS: Record<string, string> = {
    Bronze: "#CD7F32",
    Silver: "#A8A9AD",
    Gold: "#FFD700",
    Platinum: "#E5E4E2",
  };

  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      style={{
        width: 600,
        background: "#0D0D14",
        borderRadius: 20,
        padding: "36px 40px",
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Top-right accent glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── User header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={username}
          width={64}
          height={64}
          style={{ borderRadius: "50%", border: "3px solid rgba(249,115,22,0.5)" }}
          crossOrigin="anonymous"
        />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#E6EDF3", letterSpacing: "-0.02em" }}>
            @{username}
          </div>
          <div style={{ fontSize: 13, color: "rgba(230,237,243,0.45)", marginTop: 3 }}>
            GitHub Achievement Progress
          </div>
        </div>

        {/* GitTrek branding pill */}
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#F97316",
            letterSpacing: "0.04em",
          }}
        >
          GitTrek
        </div>
      </div>

      {/* ── Earned badges ── */}
      {earnedBadges.length > 0 ? (
        <div style={{ marginBottom: 24, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(230,237,243,0.4)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 12 }}>
            Earned Badges
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {earnedBadges.map((b) => (
              <div
                key={b.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 10,
                  padding: "8px 14px",
                }}
              >
                <span style={{ fontSize: 18 }}>{b.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3" }}>{b.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: TIER_DOT_COLORS[b.tierLabel] ?? "#A8A9AD",
                    marginLeft: 2,
                  }}
                >
                  {b.tierLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, color: "rgba(230,237,243,0.4)", fontSize: 14, fontStyle: "italic", position: "relative" }}>
          No badges earned yet — keep contributing!
        </div>
      )}

      {/* ── Focus next ── */}
      {focusBadge && (
        <div
          style={{
            background: "rgba(249,115,22,0.10)",
            border: "1px solid rgba(249,115,22,0.25)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            position: "relative",
          }}
        >
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <div style={{ fontSize: 12, color: "#F97316", fontWeight: 700, marginBottom: 2 }}>
              Working toward {focusBadge.nextTierLabel}
            </div>
            <div style={{ fontSize: 13, color: "rgba(230,237,243,0.7)" }}>
              {focusBadge.emoji} {focusBadge.label} — {focusBadge.needed} more to go
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(230,237,243,0.35)" }}>
          Calculated from public GitHub data
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(230,237,243,0.5)" }}>
          gittrek.vercel.app
        </div>
      </div>
    </div>
  );
}
