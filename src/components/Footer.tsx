import Link from "next/link";
import { SITE_FOOTER_BLURB } from "@/lib/site-copy";

const PRODUCT_LINKS = [
  { label: "Find Issues", href: "/" },
  { label: "My Badges", href: "/badges" },
  { label: "Beginner's Guide", href: "/guide" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/about#faq" },
];

const DEV_LINKS = [
  { label: "Source Code", href: "https://github.com/mahendra-shah/GitTrek", external: true },
  { label: "Report a Bug", href: "https://github.com/mahendra-shah/GitTrek/issues", external: true },
  { label: "GitHub", href: "https://github.com/mahendra-shah", external: true },
  { label: "X / Twitter", href: "https://twitter.com/mahendra_xp", external: true },
];

export function Footer() {
  return (
    <footer className="gt-footer">

      <div style={{
        height: 1,
        background: "linear-gradient(90deg, transparent 0%, var(--gt-primary) 20%, var(--gt-primary-dark) 50%, var(--gt-primary) 80%, transparent 100%)",
        opacity: 0.5,
      }} />

      <div style={{
        background: "var(--gt-footer-bg, #0A0A12)",
        padding: "56px 24px 0",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          <div className="gt-footer-top">

            <div className="gt-footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <picture>
                  <source srcSet="/logo-light.svg" media="(prefers-color-scheme: dark)" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-dark.svg" alt="" role="presentation"
                    style={{ height: 36, width: 36, borderRadius: 9 }} />
                </picture>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
                  Git<span style={{ color: "var(--gt-primary)" }}>Trek</span>
                </span>
              </div>

              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, maxWidth: 300, margin: "0 0 20px" }}>
                {SITE_FOOTER_BLURB}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "GitHub", href: "https://github.com/mahendra-shah" },
                  { label: "X", href: "https://twitter.com/mahendra_xp" },
                ].map(s => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="gt-footer-social"
                    style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "5px 12px", borderRadius: 6,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 12, fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    }}>
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>

            <div className="gt-footer-links">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", margin: "0 0 16px" }}>
                  Product
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {PRODUCT_LINKS.map(l => (
                    <Link key={l.href} href={l.href} className="gt-footer-link"
                      style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, textDecoration: "none", transition: "color 0.12s" }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", margin: "0 0 16px" }}>
                  Developers
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {DEV_LINKS.map(l => (
                    <Link key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                      className="gt-footer-link"
                      style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, textDecoration: "none", transition: "color 0.12s" }}>
                      {l.label} <span style={{ opacity: 0.4, fontSize: 11 }}>↗</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            margin: "48px 0 0",
            padding: "28px 32px",
            borderRadius: "12px 12px 0 0",
            background: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(234,88,12,0.06) 100%)",
            border: "1px solid rgba(249,115,22,0.18)",
            borderBottom: "none",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                Your next open source contribution is waiting.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                Find available issues before someone else claims them.
              </p>
            </div>
            <Link
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--gt-primary)", color: "#fff",
                borderRadius: 8, padding: "10px 20px",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 2px 12px rgba(249,115,22,0.35)",
                flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              Start exploring →
            </Link>
          </div>

          <div style={{
            padding: "18px 32px",
            background: "rgba(255,255,255,0.03)",
            borderLeft: "1px solid rgba(249,115,22,0.18)",
            borderRight: "1px solid rgba(249,115,22,0.18)",
            borderBottom: "1px solid rgba(249,115,22,0.18)",
            borderRadius: "0 0 12px 12px",
            marginBottom: 32,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 12 }}>
                © {new Date().getFullYear()} Mahendra Shah
              </span>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 12 }}>
                Built with GraphQL &amp; ☕
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[
                { label: "Open Source", color: "rgba(249,115,22,0.9)", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.22)" },
                { label: "Free to Use", color: "rgba(74,222,128,0.85)", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.22)" },
              ].map(b => (
                <span key={b.label} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                  background: b.bg, color: b.color, border: `1px solid ${b.border}`,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
