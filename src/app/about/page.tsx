import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About GitTrek — The Open Source Discovery Engine",
  description:
    "Learn how GitTrek finds available GitHub issues, detects competing PRs in real-time, and tracks your GitHub achievement badge progress.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  // Only the FAQPage schema — SoftwareApplication is already in layout.tsx globally
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is GitTrek?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GitTrek is a live search engine for open source contributors. It detects competing pull requests on GitHub issues in real-time using the GraphQL API, so you never waste hours on an issue someone else is already solving.",
        },
      },
      {
        "@type": "Question",
        name: "How does GitTrek detect competing PRs on GitHub issues?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GitTrek uses the GitHub GraphQL API to scan the timelineItems of each issue in real-time. It looks for CrossReferencedEvent and ConnectedEvent entries. When a developer opens a PR that references an issue, GitHub creates a cross-reference — GitTrek surfaces these links so you know if an active PR already exists before you start coding.",
        },
      },
      {
        "@type": "Question",
        name: "What GitHub badges can GitTrek track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GitTrek tracks Pull Shark (merged PRs), Starstruck (stars on your best repo), Galaxy Brain (accepted discussion answers), YOLO (PRs merged without review), Public Sponsor (active GitHub sponsorships), and Quickdraw. Each badge shows your current tier, progress percentage, and how many more contributions you need to reach the next level.",
        },
      },
      {
        "@type": "Question",
        name: "Is GitTrek free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. GitTrek is completely free to use. Guest users can browse issues using basic search. Signing in with GitHub unlocks real-time PR competition detection, advanced repository quality filters, and personal badge progress tracking.",
        },
      },
      {
        "@type": "Question",
        name: "How is GitTrek different from goodfirstissue.dev or up-for-grabs.net?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "goodfirstissue.dev and up-for-grabs.net show static curated lists — they don't check whether someone is already working on an issue. GitTrek is a live search engine that checks for active PRs, draft PRs, and linked branches on every result in real-time. It also lets you filter by repository freshness, task completion status, and badge-specific contribution goals.",
        },
      },
    ],
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", lineHeight: 1.6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: "var(--gt-text)" }}>
        About GitTrek
      </h1>

      {/* Freshness signal — visible to users and crawlers */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
        fontSize: 13, color: "var(--gt-text-subtle)",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 20,
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
          color: "var(--gt-primary)", fontWeight: 600, fontSize: 12,
        }}>
          ● Actively maintained
        </span>
        <span>Last updated: May 2025</span>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          What is GitTrek?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek is an advanced open source discovery engine built for developers who want to
          contribute effectively. Unlike standard GitHub search, GitTrek provides real-time insights
          into issue competition, repository quality, and your personal growth as a contributor.
        </p>
        <p style={{ color: "var(--gt-text-muted)", marginTop: 12 }}>
          The core problem GitTrek solves: developers spend hours setting up a codebase and starting
          work on an issue, only to discover someone else has already opened a pull request. GitTrek
          checks for this <em>before</em> you start — by scanning issue timelines for active PRs,
          draft PRs, and linked branches in real-time.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          How does GitTrek detect competing PRs on GitHub issues?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek uses the GitHub GraphQL API to scan the <code>timelineItems</code> of every issue
          in real-time. Specifically, we look for <code>CrossReferencedEvent</code> and{" "}
          <code>ConnectedEvent</code> entries. When a developer mentions an issue in a Pull Request,
          GitHub creates a cross-reference. GitTrek identifies these links to warn you if an active
          PR already exists — saving you from hours of wasted work.
        </p>
        <p style={{ color: "var(--gt-text-muted)", marginTop: 12 }}>
          The check uses a nested GraphQL query that fetches timeline data for up to 20 issues in a
          single API call, making it highly efficient with GitHub&apos;s rate limits.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          What GitHub badges can GitTrek track?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek currently tracks several major GitHub Achievement badges with live tier
          calculations based on your public activity:
        </p>
        <ul style={{ color: "var(--gt-text-muted)", paddingLeft: 20, marginTop: 12, lineHeight: 2 }}>
          <li><strong>Pull Shark</strong> — Merged public pull requests. Tiers: 2 / 16 / 128 / 1,024</li>
          <li><strong>Starstruck</strong> — Stars on your highest-starred repo. Tiers: 16 / 128 / 512 / 4,096</li>
          <li><strong>Galaxy Brain</strong> — Accepted answers in GitHub Discussions. Tiers: 1 / 8 / 16 / 32</li>
          <li><strong>YOLO</strong> — Pull requests merged without a review event.</li>
          <li><strong>Public Sponsor</strong> — Active GitHub Sponsorships you are sending.</li>
          <li><strong>Quickdraw</strong> — Cannot be tracked via the API (noted honestly in the UI).</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          Is GitTrek free?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          Yes. GitTrek is free to use. Guest users can browse issues using basic REST search.
          Signing in via GitHub OAuth unlocks:
        </p>
        <ul style={{ color: "var(--gt-text-muted)", paddingLeft: 20, marginTop: 12, lineHeight: 2 }}>
          <li>Real-time PR competition detection on every issue result</li>
          <li>Advanced repository quality filters (stars, forks, maintainer activity)</li>
          <li>Personal GitHub badge progress tracking with tier calculations</li>
          <li>Cursor-based pagination — 20 results per page (vs 10 for guests)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          How is GitTrek different from goodfirstissue.dev?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          While <em>goodfirstissue.dev</em> is a great static list of curated issues, GitTrek is a{" "}
          <strong>live search engine</strong>. We don&apos;t just show you &quot;good first issues&quot;;
          we show you <em>currently available</em> ones. GitTrek&apos;s unique advantage is
          real-time PR competition detection and the ability to filter by repository freshness,
          task completion status, and personal badge goals.
        </p>
      </section>

      <section style={{ marginBottom: 40 }} id="faq">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "var(--gt-text)" }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              Does GitTrek store my GitHub data?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              No. GitTrek does not store your GitHub data on any server. Your OAuth token is stored
              in an HMAC-signed, httpOnly cookie on your browser only. Badge data is cached locally
              in your browser&apos;s localStorage for up to 1 hour. No database is involved.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              Why do badge counts show lower numbers than my actual GitHub profile?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              GitTrek can only access your <strong>public</strong> activity via the GitHub API.
              Contributions to private repositories are not counted. Your actual badge tier on
              GitHub may be higher than what GitTrek shows — this is noted in the UI on every badge.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              How accurate is the PR competition detection?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              GitTrek checks the last 5 timeline items on each issue (
              <code>CrossReferencedEvent</code> and <code>ConnectedEvent</code>) and also checks for
              linked branches. This catches the vast majority of active PR work. It will not catch
              developers who have a local branch but haven&apos;t pushed or opened a PR yet.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog / freshness section */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--gt-text)" }}>
          Recent Updates
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {([
            { date: "May 2025", note: "Unified badge API — all 5 badge types now fetched in 2 concurrent GraphQL calls, reducing dashboard load time by ~80%." },
            { date: "May 2025", note: "Added per-IP rate limiting for guest users to protect API quota and ensure fair access." },
            { date: "May 2025", note: "Discussion search — find unanswered GitHub Discussions to earn the Galaxy Brain badge." },
            { date: "Apr 2025", note: "Quick Missions — 1-click presets for badge-hunting (Pull Shark, Galaxy Brain, Pair Extraordinaire)." },
            { date: "Apr 2025", note: "Public badge tracker — look up any GitHub username to view their badge progress." },
          ] as const).map(({ date, note }, i) => (
            <div key={i} style={{
              display: "flex", gap: 16, padding: "12px 16px",
              background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10,
            }}>
              <span style={{ color: "var(--gt-primary)", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
                {date}
              </span>
              <span style={{ color: "var(--gt-text-muted)", fontSize: 14 }}>{note}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
