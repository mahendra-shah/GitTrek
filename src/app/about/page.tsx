import { Metadata } from "next";
import { CANONICAL_DESCRIPTION, SITE_AI_CONTEXT, SITE_CAREER_HOOK } from "@/lib/site-copy";

const SITE = "https://gittrek.vercel.app";
const OG_HOME = `${SITE}/api/og/home`;

const ABOUT_DESC = `${CANONICAL_DESCRIPTION} How GraphQL timeline scans work, badge tracking, and how GitTrek differs from static lists.`;

export const metadata: Metadata = {
  title: "About GitTrek — PR Competition Detection for Open Source Contributors",
  description: ABOUT_DESC,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: `${SITE}/about`,
    title: "About GitTrek — PR Competition Detection for Open Source Contributors",
    description: ABOUT_DESC,
    siteName: "GitTrek",
    images: [{ url: OG_HOME, width: 1200, height: 630, alt: "GitTrek — PR competition detection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About GitTrek — PR Competition Detection",
    description: ABOUT_DESC,
    images: [OG_HOME],
    creator: "@mahendra_xp",
    site: "@mahendra_xp",
  },
};

export default function AboutPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is GitTrek?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GitTrek is issue discovery with real-time PR competition detection. Before you write code, it shows which GitHub issues already have competing pull requests — something GitHub search and static good-first-issue lists do not surface. It uses the GraphQL API to scan issue timelines, plus smart filters and badge-focused Quick Missions.",
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
          text: "goodfirstissue.dev and up-for-grabs.net show static curated lists — they do not tell you if the issue is already being worked on. GitTrek checks active PRs, draft PRs, and linked branches in real-time, then adds repository quality filters and badge-focused missions so you can choose higher-probability opportunities.",
        },
      },
      {
        "@type": "Question",
        name: "How many pull requests do I need to earn the Pull Shark badge on GitHub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Pull Shark badge on GitHub has four tiers based on merged public pull requests: Bronze at 2 merged PRs, Silver at 16 merged PRs, Gold at 128 merged PRs, and Platinum at 1,024 merged PRs. GitTrek tracks your current tier and shows exactly how many more PRs you need for the next level.",
        },
      },
      {
        "@type": "Question",
        name: "What is the Galaxy Brain badge on GitHub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Galaxy Brain badge on GitHub is awarded for having answers accepted in GitHub Discussions. Tiers are: Bronze at 1 accepted answer, Silver at 8, Gold at 16, and Platinum at 32 accepted answers. You can earn it by finding unanswered questions in any public repository's Discussions tab and providing helpful answers.",
        },
      },
      {
        "@type": "Question",
        name: "Can I check what GitHub badges someone else has?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. GitTrek has a public badge tracker at gittrek.vercel.app/badges. You can type any GitHub username to view their badge progress — Pull Shark, Starstruck, Galaxy Brain, YOLO, Public Sponsor, and more. No sign-in required to look up another user's public badge progress.",
        },
      },
      {
        "@type": "Question",
        name: "Why did I get sniped on a GitHub issue?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Getting sniped on a GitHub issue means someone else opened a pull request for the same issue while you were working on it. This is extremely common in high-traffic open source repositories. GitTrek prevents this by checking for active, draft, and linked PRs on every issue before you start — surfacing a clear 'Available' or 'Being Claimed' status so you can pick uncontested issues.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find uncontested GitHub issues to contribute to?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GitTrek is built specifically to find uncontested GitHub issues. It filters for issues with no assignee, checks for competing pull requests in real-time, and lets you sort by freshness. Use the 'Pull Shark' Quick Mission for zero-comment issues with no activity, or filter by 'no assignee' combined with the availability status indicator to find issues that are genuinely open.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a beginner guide for open source contributors?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. GitTrek includes a dedicated beginner guide at /guide covering prerequisites, OSS workflow, first PR steps, etiquette, and common mistakes. It is designed for developers starting open source from scratch.",
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
        <span>Last updated: May 2026</span>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          What is GitTrek?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          {CANONICAL_DESCRIPTION} Smart filters, badge tracking, and free browsing keep contribution momentum high.
        </p>
        <p style={{ color: "var(--gt-text-muted)", marginTop: 12 }}>
          {SITE_AI_CONTEXT}
        </p>
        <p style={{ color: "var(--gt-text-muted)", marginTop: 12 }}>
          {SITE_CAREER_HOOK}
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
          The search pipeline uses a single GraphQL search fetch per request (with smart overfetch),
          then applies repository-quality filters server-side. This keeps results relevant while staying
          efficient with GitHub&apos;s rate limits.
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

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              How many pull requests do I need to earn the Pull Shark badge?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              The Pull Shark badge has four tiers: <strong>Bronze at 2 merged PRs</strong>, Silver at 16,
              Gold at 128, and Platinum at 1,024 merged public pull requests. GitTrek tracks your current
              count and shows exactly how many more you need for the next tier. Only public repository
              contributions count toward GitHub badges.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              What is the Galaxy Brain badge on GitHub?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              Galaxy Brain is earned by having answers accepted in GitHub Discussions. Tiers: 1 / 8 / 16 / 32
              accepted answers for Bronze through Platinum. GitTrek&apos;s &quot;Galaxy Brain Mission&quot; helps
              you find unanswered questions in active repositories — the fastest path to earning this badge.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              Can I check what GitHub badges someone else has?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              Yes. GitTrek has a public badge tracker — go to{" "}
              <a href="/badges" style={{ color: "var(--gt-primary)", textDecoration: "underline" }}>
                gittrek.vercel.app/badges
              </a>{" "}
              and enter any GitHub username. No sign-in required to view another user&apos;s
              public badge progress. You can share your badge profile URL with others too.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              Why did I get sniped on a GitHub issue, and how do I avoid it?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              Getting sniped means someone else opened a PR for the same issue while you were
              working on it — extremely common in popular repos like React, Next.js, or TypeScript.
              GitTrek solves this by showing a real-time <strong>✅ Available</strong> or{" "}
              <strong>⚠️ Being Claimed</strong> status on every issue before you start. Pick issues
              marked Available to avoid wasting your effort.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              How do I find uncontested GitHub issues to contribute to?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              GitTrek is built for exactly this. Use the{" "}
              <a href="/?labels=good+first+issue&noAssignee=true" style={{ color: "var(--gt-primary)", textDecoration: "underline" }}>
                Pull Shark Quick Mission
              </a>{" "}
              to instantly filter for zero-comment, unassigned issues with no competing PRs. You
              can also combine &quot;No assignee&quot; + &quot;Active maintainer&quot; filters to find fresh issues
              in repos where your PR is likely to get reviewed quickly.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--gt-text)" }}>
              Is there a dedicated beginner guide?
            </h3>
            <p style={{ color: "var(--gt-text-muted)", margin: 0 }}>
              Yes. Read the{" "}
              <a href="/guide" style={{ color: "var(--gt-primary)", textDecoration: "underline" }}>
                Beginner&apos;s Guide
              </a>{" "}
              for prerequisites, how OSS communities work, first PR steps, communication etiquette, and
              common mistakes to avoid.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--gt-text)" }}>
          Recent Updates
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {([
            { date: "May 2026", note: "Search and filter reliability update — fixed discussions/issues tab consistency and zero-replies filtering behavior." },
            { date: "May 2026", note: "Added one-click filter reset and improved filter UX with sticky action controls." },
            { date: "May 2026", note: "Shipped a dedicated beginner guide at /guide for first-time open source contributors." },
            { date: "May 2026", note: "Improved guest experience — blurred PR availability preview with sign-in prompt so the core value is visible immediately." },
            { date: "May 2026", note: "Header and modal responsive fixes — GitTrek is now fully usable on all screen sizes." },
            { date: "May 2026", note: "Unified badge API — all 5 badge types now fetched in 2 concurrent GraphQL calls, reducing dashboard load time by ~80%." },
            { date: "May 2026", note: "Added per-IP rate limiting for guest users to protect API quota and ensure fair access." },
            { date: "Apr 2026", note: "Discussion search — find unanswered GitHub Discussions to earn the Galaxy Brain badge." },
            { date: "Apr 2026", note: "Quick Missions — 1-click presets for badge-hunting (Pull Shark, Galaxy Brain, Pair Extraordinaire)." },
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
