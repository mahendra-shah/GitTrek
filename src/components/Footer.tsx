import Link from "next/link";

export function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--gt-border)",
      background: "var(--gt-header-bg)",
      padding: "48px 24px 32px",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <picture>
                <source srcSet="/logo-light.svg" media="(prefers-color-scheme: dark)" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-dark.svg" alt="" role="presentation" style={{ height: 48, width: 48, borderRadius: 10 }} />
              </picture>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--gt-primary)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>GitTrek</span>
                <span style={{ color: "var(--gt-text-subtle)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginTop: 4 }}>CLAIM. TRACK. GROW.</span>
              </div>
            </div>
            <p style={{ color: "var(--gt-text-muted)", fontSize: 13, lineHeight: 1.5, maxWidth: 300 }}>
              The open source discovery engine. Find available issues, track your badge progress, and grow your developer profile.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ color: "var(--gt-text)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resources</span>
            <Link href="/about" style={{ color: "var(--gt-text-subtle)", fontSize: 14, textDecoration: "none" }}>About GitTrek</Link>
            <Link href="https://github.com/mahendra-shah/GitTrek" style={{ color: "var(--gt-text-subtle)", fontSize: 14, textDecoration: "none" }}>Source Code</Link>
            <Link href="/about#faq" style={{ color: "var(--gt-text-subtle)", fontSize: 14, textDecoration: "none" }}>FAQ</Link>
          </div>

          {/* Community */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ color: "var(--gt-text)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Community</span>
            <Link href="https://gittrek.dev" style={{ color: "var(--gt-text-subtle)", fontSize: 14, textDecoration: "none" }}>Waitlist</Link>
            <Link href="https://github.com/mahendra-shah/GitTrek/issues" style={{ color: "var(--gt-text-subtle)", fontSize: 14, textDecoration: "none" }}>Report a Bug</Link>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid var(--gt-border)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <span style={{ color: "var(--gt-text-subtle)", fontSize: 12 }}>
            &copy; {new Date().getFullYear()} Mahendra Shah. Built with GraphQL & Coffee.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="https://github.com/mahendra-shah" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gt-text-muted)", fontSize: 12, textDecoration: "none" }}>GitHub</Link>
            <Link href="https://twitter.com/mahendra_xp" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gt-text-muted)", fontSize: 12, textDecoration: "none" }}>X</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
