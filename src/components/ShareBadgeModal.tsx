"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { BadgeKey, ShareableCardData, TierLabel } from "@/lib/github/badges";
import { TIER_LABELS } from "@/lib/github/badges";
import { rarityLabel, rarityTweetSuffix } from "@/lib/github/badge-rarity";
import { Confetti } from "@/components/Confetti";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  badge: {
    key: BadgeKey;
    label: string;
    tierLabel: TierLabel;
    tier: number;
    percent: number;
    current: number;
    next: number | null;
    needed: number;
    emoji?: string;
    image?: string;
  };
  username: string;
  /** Kept for backward compatibility with BadgeCard; not used for visual rendering. */
  shareCardData?: ShareableCardData;
};

const TIER_META = {
  0: { primary: "#888", secondary: "#333", accent: "#aaa", glow: "rgba(136,136,136,0.25)", glowSoft: "rgba(136,136,136,0.10)", label: "NOT EARNED", text: "#aaa" },
  1: { primary: "#CD7F32", secondary: "#7A4310", accent: "#E8B179", glow: "rgba(205,127,50,0.45)", glowSoft: "rgba(205,127,50,0.15)", label: "BRONZE", text: "#F5C896" },
  2: { primary: "#C0C0C0", secondary: "#606060", accent: "#E8EAEE", glow: "rgba(220,222,228,0.45)", glowSoft: "rgba(220,222,228,0.15)", label: "SILVER", text: "#F0F2F6" },
  3: { primary: "#FFD700", secondary: "#7A6000", accent: "#FFE769", glow: "rgba(255,215,0,0.55)", glowSoft: "rgba(255,215,0,0.18)", label: "GOLD", text: "#FFE769" },
  4: { primary: "#E8E6E1", secondary: "#7A7770", accent: "#F2F1EF", glow: "rgba(232,230,225,0.50)", glowSoft: "rgba(232,230,225,0.18)", label: "PLATINUM", text: "#F2F1EF" },
} as const;

function buildTweetText(b: Props["badge"]): string {
  const tl = b.tierLabel;
  const tier = Math.min(4, Math.max(0, b.tier)) as 0 | 1 | 2 | 3 | 4;
  const suffix = rarityTweetSuffix(b.key, tier);
  const tail = suffix ? ` · ${suffix}` : "";
  switch (b.key) {
    case "pullShark":
      return `Just hit ${tl} Pull Shark — ${b.current.toLocaleString()} merged PRs 🦈${tail}`;
    case "galaxyBrain":
      return `${b.current.toLocaleString()} accepted answers on GitHub Discussions. Galaxy Brain ${tl} 🧠${tail}`;
    case "starstruck":
      return `One of my repos crossed ${b.current.toLocaleString()} stars. ${tl} Starstruck 🌟${tail}`;
    case "yolo":
      return "Merged a PR without code review. YOLO badge unlocked 🤞";
    case "publicSponsor":
      return `Publicly sponsoring open source. ${tl} sponsor 💖`;
    case "pairExtraordinaire":
      return `${b.current.toLocaleString()} co-authored PRs on GitHub. ${tl} Pair Extraordinaire 👥${tail}`;
    default:
      return `Just unlocked the ${tl} ${b.label} badge on GitHub 🏆${tail}`;
  }
}

function nounForBadge(key: BadgeKey): string {
  switch (key) {
    case "starstruck": return "stars";
    case "pullShark": return "merged PRs";
    case "galaxyBrain": return "accepted answers";
    case "pairExtraordinaire": return "co-authored PRs";
    case "publicSponsor": return "sponsorships";
    case "yolo": return "no-review merges";
    default: return "contributions";
  }
}

const FOCUSABLE_SELECTORS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** rAF count-up driven by a manual trigger (mount of this modal). */
function useModalCountUp(target: number, durationMs: number, startDelayMs: number, isActive: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isActive) { setValue(0); return; }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setValue(target); return; }
    let raf = 0;
    let cancelled = false;
    const startTimer = setTimeout(() => {
      const start = performance.now();
      const easeOut = (t: number) => 1 - (1 - t) ** 3;
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / durationMs);
        setValue(Math.round(target * easeOut(t)));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setValue(target);
      };
      raf = requestAnimationFrame(tick);
    }, startDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, startDelayMs, isActive]);
  return value;
}

export function ShareBadgeModal({ isOpen, onClose, badge, username }: Props) {
  const [copied, setCopied] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const [baseUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    try {
      const probe = new File([new Blob([""], { type: "image/png" })], "x.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || badge.tier <= 0) return;
    const storageKey = `gt-confetti-fired-${badge.key}-${badge.tier}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch { /* ok */ }
    setConfettiKey(Date.now());
    const t = setTimeout(() => setConfettiKey(null), 1700);
    return () => clearTimeout(t);
  }, [isOpen, badge.key, badge.tier]);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        const closeBtn = modalRef.current?.querySelector("[data-autofocus]") as HTMLElement;
        closeBtn?.focus();
      });
    } else {
      prevFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      const focusable = [...(modalRef.current?.querySelectorAll(FOCUSABLE_SELECTORS) ?? [])] as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const tier = Math.min(4, Math.max(0, badge.tier)) as 0 | 1 | 2 | 3 | 4;
  const animatedCount = useModalCountUp(badge.current, 1100, 480, isOpen && tier > 0);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const m = TIER_META[tier];
  const hasEarned = tier > 0;

  const profileUrl = `${baseUrl}/badges?user=${encodeURIComponent(username)}&highlight=${badge.key}`;
  const nextTierLabel =
    tier > 0 && tier < 4 ? (TIER_LABELS as readonly string[])[tier + 1] : null;

  // Server-rendered shareable image — used by twitter/linkedin via meta tags AND
  // for the optional Download button (browser-native anchor download, never errors in JS).
  const ogParams = new URLSearchParams({
    user: username,
    badge: badge.key,
    tier: String(tier),
    current: String(badge.current),
    pct: String(badge.percent),
  });
  if (badge.next !== null) ogParams.set("next", String(badge.next));
  if (nextTierLabel) ogParams.set("nextTier", nextTierLabel);
  const ogImageUrl = `${baseUrl}/api/og/badge?${ogParams.toString()}`;

  const tweetText = encodeURIComponent(`${buildTweetText(badge)}\n\nCheck your badges 👇`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(profileUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${buildTweetText(badge)}\nCheck your GitHub badges: ${profileUrl}`)}`;

  const copyTweet = async () => {
    await navigator.clipboard.writeText(`${buildTweetText(badge)}\n\n${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const titleId = `share-modal-title-${badge.key}`;
  const tierLabelText = badge.tierLabel.toUpperCase();
  const rarityText = tier > 0 ? rarityLabel(badge.key, tier) : "";
  const noun = nounForBadge(badge.key);

  return createPortal(
    <>
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          animation: "gt-drop-backdrop 200ms ease-out both",
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, pointerEvents: "none",
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{
            pointerEvents: "all",
            position: "relative",
            width: "100%",
            maxWidth: 460,
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
            overflowX: "hidden",
            background: "#0A0C12",
            border: `1px solid ${m.primary}40`,
            borderRadius: 22,
            boxShadow: `0 0 0 1px ${m.primary}22, 0 24px 64px rgba(0,0,0,0.85), 0 0 120px ${m.glow}`,
            animation: "gt-drop-card 380ms cubic-bezier(0.34,1.56,0.64,1) 80ms both",
          }}
        >
          {confettiKey !== null && (
            <Confetti
              key={confettiKey}
              colors={[m.primary, "#ffffff", m.accent]}
            />
          )}

          {/* Close button */}
          <button
            onClick={close}
            data-autofocus
            aria-label="Close share dialog"
            style={{
              position: "absolute", top: 14, right: 14, zIndex: 5,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 10, color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 400,
            }}
          >
            ×
          </button>

          {/* HERO — the screenshot-worthy part */}
          <div
            style={{
              position: "relative",
              padding: "44px 32px 32px",
              overflow: "hidden",
              borderRadius: "22px 22px 0 0",
              background: hasEarned
                ? `linear-gradient(180deg, ${m.secondary}30 0%, transparent 60%), #0A0C12`
                : "#0A0C12",
            }}
          >
            {/* Tier-color radial halos */}
            <div style={{
              position: "absolute", top: -80, left: -60, width: 340, height: 340,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${m.glow} 0%, transparent 65%)`,
              pointerEvents: "none", filter: "blur(2px)",
            }} />
            <div style={{
              position: "absolute", bottom: -100, right: -80, width: 280, height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${m.glowSoft} 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />
            {/* Dot grid */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
              pointerEvents: "none",
              opacity: 0.6,
            }} />

            {/* "Achievement Unlocked" tag */}
            <div style={{
              position: "relative", zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 10, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase",
              color: m.primary,
              animation: "gt-drop-fade-up 300ms ease-out 140ms both",
            }}>
              <span style={{ width: 16, height: 1, background: m.primary, opacity: 0.5 }} />
              <span>🏆 Achievement Unlocked</span>
              <span style={{ width: 16, height: 1, background: m.primary, opacity: 0.5 }} />
            </div>

            {/* Floating badge with rotating halo */}
            <div style={{
              position: "relative", zIndex: 2,
              width: 180, height: 180,
              margin: "26px auto 8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "gt-drop-badge 600ms cubic-bezier(0.34,1.56,0.64,1) 220ms both, gt-badge-float 5s ease-in-out 820ms infinite",
            }}>
              {hasEarned && (
                <>
                  {/* Outer rotating conic halo */}
                  <div style={{
                    position: "absolute", inset: -8,
                    borderRadius: "50%",
                    background: `conic-gradient(from 0deg, transparent 0%, ${m.primary} 25%, transparent 50%, ${m.primary} 75%, transparent 100%)`,
                    opacity: 0.55, filter: "blur(2px)",
                    animation: "gt-shimmer-ring 6s linear infinite",
                  }} />
                  {/* Inner soft glow */}
                  <div style={{
                    position: "absolute", inset: 4,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)`,
                    filter: "blur(20px)",
                  }} />
                  {/* Solid disc to mask the conic edge */}
                  <div style={{
                    position: "absolute", inset: 6,
                    borderRadius: "50%",
                    background: "#0A0C12",
                  }} />
                </>
              )}
              {badge.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={badge.image}
                  alt={badge.label}
                  width={140}
                  height={140}
                  style={{
                    position: "relative", zIndex: 3,
                    objectFit: "contain",
                    filter: hasEarned
                      ? `drop-shadow(0 8px 24px ${m.glow})`
                      : "grayscale(1) opacity(0.4)",
                  }}
                />
              ) : (
                <span style={{ fontSize: 110, position: "relative", zIndex: 3 }}>
                  {badge.emoji ?? "🏅"}
                </span>
              )}
            </div>

            {/* Tier wordmark — letter-by-letter entry */}
            <div
              id={titleId}
              style={{
                position: "relative", zIndex: 2,
                textAlign: "center",
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: m.text,
                textShadow: hasEarned ? `0 4px 24px ${m.glow}` : "none",
                lineHeight: 1, marginBottom: 6,
                marginLeft: "0.18em", // visual centering for letter-spacing
                display: "flex", justifyContent: "center", flexWrap: "wrap",
              }}
            >
              {tierLabelText.split("").map((ch, i) => (
                <span
                  key={`${ch}-${i}`}
                  style={{
                    display: "inline-block",
                    animation: `gt-drop-letter 320ms ease-out ${380 + i * 35}ms both`,
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>

            {/* Badge label */}
            <div style={{
              position: "relative", zIndex: 2,
              textAlign: "center",
              fontSize: 17, fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: 1, textTransform: "uppercase",
              marginBottom: 26,
              animation: "gt-drop-fade-up 300ms ease-out 600ms both",
            }}>
              {badge.label}
            </div>

            {/* Big stat */}
            <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
              <div style={{
                fontSize: 64, fontWeight: 900,
                color: "#fff", letterSpacing: -2, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                textShadow: hasEarned ? `0 6px 32px ${m.glow}` : "none",
                animation: "gt-drop-fade-up 320ms ease-out 480ms both",
              }}>
                {animatedCount.toLocaleString()}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: "rgba(255,255,255,0.55)",
                marginTop: 6, letterSpacing: 0.5,
                animation: "gt-drop-fade-up 300ms ease-out 580ms both",
              }}>
                {noun}
              </div>
            </div>

            {/* Rarity FOMO line */}
            {rarityText && (
              <div style={{
                position: "relative", zIndex: 2,
                marginTop: 22,
                textAlign: "center",
                fontSize: 13, fontWeight: 700,
                color: m.text,
                letterSpacing: 0.6,
                animation: "gt-drop-fade-up 320ms ease-out 720ms both",
              }}>
                <span style={{ marginRight: 6 }}>✨</span>
                {rarityText}
              </div>
            )}

            {/* Progress bar */}
            {hasEarned && tier < 4 && badge.next !== null && (
              <div style={{
                position: "relative", zIndex: 2,
                marginTop: 22,
                animation: "gt-drop-fade-up 320ms ease-out 820ms both",
              }}>
                <div style={{
                  height: 6,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.max(2, badge.percent)}%`,
                    background: `linear-gradient(90deg, ${m.primary}88, ${m.primary})`,
                    borderRadius: 99,
                    boxShadow: `0 0 12px ${m.glow}`,
                    transition: "width 1.4s cubic-bezier(0.4,0,0.2,1) 0.4s",
                  }} />
                </div>
                <div style={{
                  marginTop: 8,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: 11, fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: 0.4,
                }}>
                  <span>
                    <span style={{ color: m.text }}>{badge.percent}%</span> to {nextTierLabel}
                  </span>
                  <span>{badge.needed.toLocaleString()} to go</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            padding: "20px 24px 22px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", gap: 8,
            animation: "gt-drop-fade-up 320ms ease-out 880ms both",
          }}>
            {/* Primary: Tweet */}
            <a
              href={twitterUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                background: "linear-gradient(135deg, #1d9bf0, #1577c4)", color: "#fff",
                textDecoration: "none", padding: "13px 20px", borderRadius: 12,
                fontWeight: 800, fontSize: 15,
                boxShadow: "0 4px 16px rgba(29,161,242,0.30)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(29,161,242,0.55)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(29,161,242,0.30)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/>
              </svg>
              Post on X
            </a>

            {/* Secondary actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              <a
                href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                title="Share on LinkedIn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)", textDecoration: "none",
                  padding: "10px 6px", borderRadius: 10, fontWeight: 600, fontSize: 12,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a
                href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                title="Share on WhatsApp"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.20)",
                  color: "#3FCB7A", textDecoration: "none",
                  padding: "10px 6px", borderRadius: 10, fontWeight: 600, fontSize: 12,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.08)"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </a>
              <a
                href={ogImageUrl}
                download={`gittrek-${username}-${badge.key}.png`}
                target={canShareFiles ? "_blank" : undefined}
                rel="noopener noreferrer"
                title="Download image"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)", textDecoration: "none",
                  padding: "10px 6px", borderRadius: 10, fontWeight: 600, fontSize: 12,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Image
              </a>
              <button
                type="button"
                onClick={() => void copyTweet()}
                title={copied ? "Copied!" : "Copy tweet text + link"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  background: copied ? "rgba(63,185,80,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(63,185,80,0.40)" : "rgba(255,255,255,0.08)"}`,
                  color: copied ? "#3fb950" : "rgba(255,255,255,0.85)",
                  padding: "10px 6px", borderRadius: 10, fontWeight: 600, fontSize: 12,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                aria-label={copied ? "Copied!" : "Copy tweet text and link"}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Footer attribution */}
            <div style={{
              marginTop: 8,
              fontSize: 11, color: "rgba(255,255,255,0.35)",
              textAlign: "center", letterSpacing: 0.4,
            }}>
              @{username} · gittrek.vercel.app
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
