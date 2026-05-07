/** Shared JSX for homepage OG / Twitter cards (Satori). */

export function HomeOgImage() {
  return (
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
          position: "absolute",
          left: -80,
          top: -60,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 65%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 56,
          paddingRight: 32,
          width: 560,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
            Git<span style={{ color: "#F97316" }}>Trek</span>
          </span>
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: "#F6F8FA",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          {"Don't get sniped on GitHub issues."}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "rgba(230,237,243,0.72)",
            lineHeight: 1.45,
            maxWidth: 480,
          }}
        >
          Find beginner-friendly issues with no active competing PRs — so you don&apos;t waste setup hours.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 15,
            fontWeight: 600,
            color: "rgba(249,115,22,0.95)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Smart filters · Badge tracking · Free, no setup
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
          flex: 1,
          paddingRight: 48,
          paddingLeft: 16,
        }}
      >
        {[
          { repo: "org/repo-name", title: "Fix login redirect loop", pill: "✅ Available", pillBg: "rgba(74,222,128,0.15)", pillBorder: "rgba(74,222,128,0.35)", pillColor: "#4ADE80" },
          { repo: "lib/framework", title: "Add dark mode toggle", pill: "⚠️ Being Claimed", pillBg: "rgba(248,113,113,0.12)", pillBorder: "rgba(248,113,113,0.35)", pillColor: "#F87171" },
          { repo: "app/dashboard", title: "Optimize bundle size", pill: "🔶 Work in Progress", pillBg: "rgba(251,191,36,0.12)", pillBorder: "rgba(251,191,36,0.35)", pillColor: "#FCD34D" },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: "rgba(230,237,243,0.45)", fontWeight: 600 }}>{card.repo}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#E6EDF3" }}>{card.title}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 10px",
                  borderRadius: 8,
                  background: card.pillBg,
                  border: `1px solid ${card.pillBorder}`,
                  color: card.pillColor,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {card.pill}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
