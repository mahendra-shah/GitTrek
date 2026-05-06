"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { BadgeKey, TierLabel } from "@/lib/github/badges";

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
    emoji?: string;
    image?: string;
  };
  username: string;
};

const TIER_META = {
  0: { primary: "#888", secondary: "#333", glow: "rgba(136,136,136,0.2)", bg: "rgba(136,136,136,0.06)", label: "NOT EARNED" },
  1: { primary: "#CD7F32", secondary: "#7A4310", glow: "rgba(205,127,50,0.3)", bg: "rgba(205,127,50,0.07)", label: "BRONZE" },
  2: { primary: "#C0C0C0", secondary: "#606060", glow: "rgba(192,192,192,0.3)", bg: "rgba(192,192,192,0.07)", label: "SILVER" },
  3: { primary: "#FFD700", secondary: "#7A6000", glow: "rgba(255,215,0,0.4)", bg: "rgba(255,215,0,0.07)", label: "GOLD" },
  4: { primary: "#E8E6E1", secondary: "#7A7770", glow: "rgba(232,230,225,0.35)", bg: "rgba(232,230,225,0.07)", label: "PLATINUM" },
} as const;

function MiniCardPreview({
  badge,
  username,
  tier,
}: {
  badge: Props["badge"];
  username: string;
  tier: 0 | 1 | 2 | 3 | 4;
}) {
  const m = TIER_META[tier];
  const hasEarned = tier > 0;
  const statsText = hasEarned
    ? `${badge.current.toLocaleString()} ${badge.key === "starstruck" ? "stars" : badge.key === "pullShark" ? "merged PRs" : badge.key === "galaxyBrain" ? "answers" : "contributions"}`
    : "Not yet earned";

  return (
    <div
      style={{
        display: "flex",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${m.primary}33`,
        background: "#06080C",
        height: 110,
      }}
    >
      <div
        style={{
          width: 100,
          flexShrink: 0,
          background: hasEarned ? `linear-gradient(160deg, ${m.secondary} 0%, #000 80%)` : "#111",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          position: "relative",
        }}
      >
        {badge.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.image}
            alt=""
            width={50}
            height={50}
            style={{ objectFit: "contain", filter: hasEarned ? "none" : "grayscale(1) opacity(0.4)" }}
          />
        ) : (
          <span style={{ fontSize: 38 }}>{badge.emoji ?? "🏅"}</span>
        )}
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 1.5,
            color: hasEarned ? (tier >= 3 ? "#000" : "#fff") : "#888",
            background: hasEarned ? m.primary : "#333",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {m.label}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "12px 16px",
          gap: 4,
          borderLeft: `3px solid ${hasEarned ? m.primary : "#222"}`,
        }}
      >
        {hasEarned && (
          <div style={{ fontSize: 9, letterSpacing: 2, color: m.primary, fontWeight: 800, textTransform: "uppercase" }}>
            🏆 Achievement Unlocked
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
          {badge.label}
        </div>
        <div style={{ fontSize: 11, color: m.primary, fontWeight: 600 }}>
          {statsText}
        </div>
        <div style={{ fontSize: 10, color: "#484f58" }}>
          @{username} · gittrek.vercel.app
        </div>
      </div>
    </div>
  );
}

const FOCUSABLE_SELECTORS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ShareBadgeModal({ isOpen, onClose, badge, username }: Props) {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setBaseUrl(window.location.origin); }, []);

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

  if (!isOpen || !baseUrl) return null;
  if (typeof document === "undefined") return null;

  const tier = Math.min(4, Math.max(0, badge.tier)) as 0 | 1 | 2 | 3 | 4;
  const m = TIER_META[tier];

  const profileUrl = `${baseUrl}/badges?user=${encodeURIComponent(username)}&highlight=${badge.key}`;

  const tweetText = encodeURIComponent(
    `Just unlocked the ${badge.tierLabel} ${badge.label} badge on GitHub 🏆\n\n${badge.current.toLocaleString()} ${badge.key === "starstruck" ? "stars" : "contributions"} and counting. Check your own badges 👇`
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(profileUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Just unlocked the ${badge.tierLabel} ${badge.label} badge on GitHub 🏆\nCheck your own GitHub achievements: ${profileUrl}`)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const titleId = `share-modal-title-${badge.key}`;

  return createPortal(
    <>
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "var(--gt-modal-overlay)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, pointerEvents: "none",
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{
            pointerEvents: "all",
            width: "100%",
            maxWidth: 460,
            maxHeight: "calc(100dvh - 40px)",
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--gt-modal-bg)",
            border: `1px solid ${m.primary}55`,
            borderRadius: 24,
            boxShadow: `0 0 0 1px ${m.primary}22, 0 32px 64px rgba(0,0,0,0.85), 0 0 100px ${m.glow}`,
            animation: "gt-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent 0%, ${m.primary} 40%, ${m.primary} 60%, transparent 100%)` }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 24px 0" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: m.primary, textTransform: "uppercase", marginBottom: 4 }}>
                🏆 Achievement Unlocked
              </div>
              <div id={titleId} style={{ fontSize: 21, fontWeight: 800, color: "var(--gt-modal-text)", letterSpacing: -0.5 }}>
                Share Your Badge
              </div>
            </div>
            <button
              onClick={close}
              data-autofocus
              aria-label="Close share dialog"
              style={{
                background: "var(--gt-modal-item-bg)", border: `1px solid ${m.primary}33`,
                borderRadius: 8, color: "var(--gt-modal-text-muted)", cursor: "pointer",
                width: 32, height: 32, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ margin: "18px 24px", background: m.bg, border: `1px solid ${m.primary}33`, borderRadius: 14, padding: "18px 16px", display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: 60, width: 100, height: 100, borderRadius: "50%", background: m.glow, filter: "blur(28px)", transform: "translateY(-50%)", animation: "gt-glow-pulse 2.5s ease-in-out infinite" }} />
            <div style={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {badge.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.image} alt={badge.label} width={72} height={72} style={{ objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 52 }}>{badge.emoji ?? "🏅"}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--gt-modal-text)" }}>{badge.label}</span>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, background: m.primary, color: tier >= 3 ? "#000" : "#fff", padding: "3px 9px", borderRadius: 999, textTransform: "uppercase", flexShrink: 0 }}>
                  {badge.tierLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--gt-modal-text-muted)", marginBottom: 8 }}>
                <span style={{ color: m.primary, fontWeight: 700 }}>{badge.current.toLocaleString()}</span>
                {" "}{badge.key === "starstruck" ? "stars on best repo" : badge.key === "pullShark" ? "merged PRs" : badge.key === "galaxyBrain" ? "accepted answers" : "contributions"}
                {badge.next && tier < 4 && <span style={{ color: "var(--gt-modal-text-dim)" }}> · {badge.next.toLocaleString()} for next tier</span>}
              </div>
              {tier < 4 && badge.percent > 0 && (
                <div style={{ height: 4, background: "var(--gt-modal-border)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${badge.percent}%`, background: `linear-gradient(90deg, ${m.primary}88, ${m.primary})`, borderRadius: 999 }} />
                </div>
              )}
            </div>
          </div>

          <div className="gt-share-modal-preview" style={{ padding: "0 24px" }}>
            <div style={{ fontSize: 10, color: "var(--gt-modal-text-dim)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
              Preview · How it looks when shared
            </div>
            <MiniCardPreview badge={badge} username={username} tier={tier} />
          </div>

          <div style={{ padding: "16px 24px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href={twitterUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "linear-gradient(135deg, #1d9bf0, #1a8cd8)", color: "#fff",
                textDecoration: "none", padding: "13px 20px", borderRadius: 12,
                fontWeight: 700, fontSize: 15, boxShadow: "0 4px 16px rgba(29,161,242,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(29,161,242,0.55)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(29,161,242,0.35)";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>
              Share on X / Twitter
            </a>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "var(--gt-modal-item-bg)", border: "1px solid var(--gt-modal-border)",
                  color: "var(--gt-modal-text-light)", textDecoration: "none",
                  padding: "11px 8px", borderRadius: 10, fontWeight: 600, fontSize: 13,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--gt-modal-item-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--gt-modal-item-bg)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a
                href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)",
                  color: "#25D366", textDecoration: "none",
                  padding: "11px 8px", borderRadius: 10, fontWeight: 600, fontSize: 13,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.08)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </a>
              <button
                onClick={copyLink}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: copied ? "rgba(35,134,54,0.15)" : "var(--gt-modal-item-bg)",
                  border: `1px solid ${copied ? "rgba(35,134,54,0.45)" : "var(--gt-modal-border)"}`,
                  color: copied ? "#3fb950" : "var(--gt-modal-text-light)",
                  padding: "11px 8px", borderRadius: 10, fontWeight: 600, fontSize: 13,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                aria-label={copied ? "Link copied!" : "Copy profile link"}
              >
                {copied
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
