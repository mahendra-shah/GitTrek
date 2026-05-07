import type { ReactNode } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { CANONICAL_DESCRIPTION } from "@/lib/site-copy";

const SITE = "https://gittrek.vercel.app";
const OG_HOME = `${SITE}/opengraph-image`;

const GUIDE_DESC = `${CANONICAL_DESCRIPTION} Plus prerequisites, OSS norms, first PR steps, and mistakes to avoid — for developers starting open source today.`;

export const metadata: Metadata = {
  title: "Open Source Beginner's Guide — GitTrek",
  description: GUIDE_DESC,
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "article",
    url: `${SITE}/guide`,
    title: "Open Source Beginner's Guide — GitTrek",
    description: GUIDE_DESC,
    siteName: "GitTrek",
    images: [{ url: OG_HOME, width: 1200, height: 630, alt: "GitTrek — Beginner's guide to open source" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Source Beginner's Guide — GitTrek",
    description: GUIDE_DESC,
    images: [OG_HOME],
    creator: "@mahendra_xp",
    site: "@mahendra_xp",
  },
};

const cardSt: React.CSSProperties = {
  background: "var(--gt-card)",
  border: "1px solid var(--gt-border)",
  borderRadius: 12,
  padding: 14,
};

export default function GuidePage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Open Source for Beginners — The Honest Guide",
    url: `${SITE}/guide`,
    datePublished: "2026-05-06",
    dateModified: "2026-05-06",
    author: {
      "@type": "Person",
      name: "Mahendra Shah",
      url: "https://github.com/mahendra-shah",
    },
    publisher: {
      "@type": "Organization",
      name: "GitTrek",
      url: SITE,
    },
    description: GUIDE_DESC,
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Your first pull request on GitHub",
    description:
      "Fork a repository, create a branch, commit, push, open a PR, and respond to review feedback.",
    step: [
      {
        "@type": "HowToStep",
        name: "Fork and clone",
        text: "Fork the repository on GitHub, then clone your fork locally with git clone.",
      },
      {
        "@type": "HowToStep",
        name: "Create a branch",
        text: "Create a descriptive branch name, e.g. fix-login-validation or docs-readme-typo.",
      },
      {
        "@type": "HowToStep",
        name: "Make a small change",
        text: "Keep the first PR small — one logical change that matches the issue scope.",
      },
      {
        "@type": "HowToStep",
        name: "Commit and push",
        text: "Write clear commit messages. Push the branch to your fork.",
      },
      {
        "@type": "HowToStep",
        name: "Open the PR",
        text: "Open a pull request against the upstream default branch. Link the issue with Fixes #123 if applicable.",
      },
      {
        "@type": "HowToStep",
        name: "Respond to review",
        text: "Maintainers may request changes. Address feedback in new commits; avoid force-pushing unless asked.",
      },
    ],
  };

  const section = (id: string, title: string, children: ReactNode) => (
    <section id={id} style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "var(--gt-text)" }}>{title}</h2>
      <div style={{ color: "var(--gt-text-muted)", lineHeight: 1.75, fontSize: 15 }}>{children}</div>
    </section>
  );

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 64px", lineHeight: 1.65 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />

      <p style={{ fontSize: 13, color: "var(--gt-text-subtle)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>
          ← Back to GitTrek
        </Link>
      </p>

      <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, color: "var(--gt-text)", letterSpacing: "-0.02em" }}>
        Open source for beginners
      </h1>
      <p style={{ fontSize: 17, color: "var(--gt-text-muted)", marginBottom: 40, maxWidth: 640 }}>
        The guide we wish existed on day one: honest expectations, prerequisites, how communities actually work, and a concrete path to your first merged PR — plus how{" "}
        <Link href="/" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>
          GitTrek
        </Link>{" "}
        helps you avoid wasted effort on already-claimed issues.
      </p>

      <div
        style={{
          ...cardSt,
          marginBottom: 32,
          background: "linear-gradient(180deg, var(--gt-card) 0%, rgba(249,115,22,0.06) 100%)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--gt-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Quick Journey Map
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 10 }}>
          {["Pick issue", "Read rules", "Build + test", "Open PR", "Reply to review", "Merge"].map((step, idx) => (
            <div key={step} style={{ ...cardSt, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--gt-primary)", fontWeight: 700 }}>STEP {idx + 1}</div>
              <div style={{ fontSize: 13, color: "var(--gt-text)", fontWeight: 600 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {section(
        "why-oss",
        "1. Why open source — the honest version",
        <>
          <p style={{ marginBottom: 14 }}>
            You will learn real engineering skills: reading unfamiliar codebases, Git collaboration, code review, and communication across time zones. You can build a public portfolio of merged work that recruiters actually verify on GitHub.
          </p>
          <p style={{ marginBottom: 14 }}>
            What it is not: a guaranteed fast track to a job, instant fame, or “easy money.” Maintainers are volunteers or stretched thin; some PRs sit for weeks. That is normal.
          </p>
          <p>
            The win is <strong>consistent, respectful contributions</strong> over months — not a single heroic PR.
          </p>
        </>
      )}

      {section(
        "prerequisites",
        "2. Prerequisites",
        <ul style={{ paddingLeft: 22, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <li><strong>Git basics:</strong> clone, branch, commit, push, pull, resolving simple conflicts. You do not need to be an expert — you need to be able to follow a fork/PR workflow.</li>
          <li><strong>GitHub account</strong> with SSH or HTTPS set up so you can push to your fork.</li>
          <li><strong>A working dev environment</strong> for the stack you target (Node, Python, Rust, etc.). Clone the repo and run tests or the app locally before claiming an issue.</li>
          <li><strong>Reading English</strong> for issues, reviews, and CONTRIBUTING.md — most global OSS communication is in English.</li>
          <li><strong>Patience:</strong> review cycles are async; plan for multiple rounds of feedback.</li>
        </ul>
      )}

      {section(
        "how-communities-work",
        "3. How an open source community works",
        <>
          <p style={{ marginBottom: 14 }}>
            Typical flow: someone opens an issue → discussion narrows scope → a contributor opens a PR → maintainers / bots review → CI must pass → approval → merge.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {["Issue opened", "Scoped", "PR opened", "CI checks", "Review", "Merged"].map((phase) => (
              <div key={phase} style={{ ...cardSt, padding: "8px 10px", fontSize: 13, color: "var(--gt-text)", fontWeight: 600 }}>
                {phase}
              </div>
            ))}
          </div>
          <pre
            style={{
              background: "var(--gt-card)",
              border: "1px solid var(--gt-border)",
              borderRadius: 10,
              padding: 16,
              fontSize: 12,
              overflow: "auto",
              color: "var(--gt-text-muted)",
            }}
          >
{`Issue opened → triage → PR opened → CI + review → merge
     ↑________________feedback loops________________↓`}
          </pre>
          <p style={{ marginTop: 16, marginBottom: 14 }}>
            <strong>Maintainers</strong> decide what merges. <strong>CODEOWNERS</strong> or team rules may auto-request reviewers. <strong>CI</strong> (GitHub Actions) blocks merges when tests fail.
          </p>
          <p style={{ marginBottom: 14 }}>
            A <strong>Code of Conduct</strong> applies in issues and PRs — harassment or entitlement gets you blocked, regardless of skill.
          </p>
          <p>
            Why some PRs are ignored: wrong scope, duplicates existing work, breaks architecture, or the maintainer has no bandwidth. It is rarely personal — move on or ask politely after a reasonable wait.
          </p>
        </>
      )}

      {section(
        "good-issue",
        "4. Anatomy of a good first issue",
        <>
          <ul style={{ paddingLeft: 22, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <li><strong>Small scope:</strong> one bug, one doc section, one test — not a refactor of half the app.</li>
            <li><strong>Recent activity:</strong> repo pushed in the last months; stale projects may never merge.</li>
            <li><strong>Clear acceptance criteria</strong> in the issue or comments.</li>
            <li><strong>No competing PR</strong> — use GitTrek’s availability signal after{" "}
              <Link href="/api/auth/login" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>sign-in</Link>{" "}
              so you do not duplicate work.</li>
            <li>Labels like <code style={{ fontSize: 13 }}>good first issue</code> or <code style={{ fontSize: 13 }}>help wanted</code> are hints, not guarantees.</li>
          </ul>
        </>
      )}

      {section(
        "first-pr",
        "5. Your first PR — step by step",
        <>
          <ol style={{ paddingLeft: 22, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <li><strong>Fork</strong> the repo on GitHub (your copy under your account).</li>
            <li><strong>Clone your fork</strong> and add <code>upstream</code> remote pointing at the original repo.</li>
            <li><strong>Branch:</strong> <code>git checkout -b short-description</code>.</li>
            <li><strong>Change one thing</strong> that matches the issue; run formatters and tests locally.</li>
            <li><strong>Commit</strong> with a message like <code>fix: validate email in signup form</code> (many repos follow Conventional Commits).</li>
            <li><strong>Push</strong> to your fork and open a PR against the default branch of <em>upstream</em>.</li>
            <li>In the PR description, reference the issue: <code>Fixes #42</code> (auto-closes when merged).</li>
            <li><strong>Review:</strong> reply to comments; add commits; avoid force-push unless the maintainer asks.</li>
          </ol>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 18 }}>
            {[
              { n: "1", t: "Fork + Clone", d: "Create your own copy and run it locally first." },
              { n: "2", t: "Branch", d: "Use one branch per issue to keep changes clean." },
              { n: "3", t: "Small PR", d: "One focused change gets reviewed faster." },
              { n: "4", t: "Respond", d: "Treat review like collaboration, not rejection." },
            ].map((item) => (
              <div key={item.n} style={cardSt}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gt-primary)" }}>STEP {item.n}</div>
                <h3 style={{ margin: "4px 0 6px", fontSize: 15, color: "var(--gt-text)" }}>{item.t}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--gt-text-muted)" }}>{item.d}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            Mermaid overview (same flow many teams use):
          </p>
          <pre
            style={{
              background: "var(--gt-card)",
              border: "1px solid var(--gt-border)",
              borderRadius: 10,
              padding: 16,
              fontSize: 11,
              overflow: "auto",
            }}
          >
{`flowchart LR
  fork[Fork repo] --> clone[Clone]
  clone --> branch[Branch]
  branch --> change[Change + test]
  change --> push[Push]
  push --> pr[Open PR]
  pr --> review[Review]
  review --> merge[Merge]`}
          </pre>
        </>
      )}

      {section(
        "etiquette",
        "6. Communication etiquette",
        <>
          <ul style={{ paddingLeft: 22, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <li>Read <strong>CONTRIBUTING.md</strong> and issue templates before posting.</li>
            <li>Ask <strong>specific</strong> questions (“Should X go in utils or services?”) not “Can you help me?”</li>
            <li>Do not @-spam maintainers or DM strangers for free debugging.</li>
            <li>When review asks for changes, implement them or explain why you disagree — briefly and professionally.</li>
            <li>Thank reviewers; they are usually unpaid.</li>
          </ul>
        </>
      )}

      {section(
        "mistakes",
        "7. Common beginner mistakes",
        <>
          <ul style={{ paddingLeft: 22, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <li><strong>Force-pushing</strong> during review without agreement — rewrites history reviewers already looked at.</li>
            <li><strong>Scope creep</strong> — “I also refactored routing” in a typo fix PR.</li>
            <li><strong>Ignoring CI failures</strong> — fix tests before requesting another review.</li>
            <li><strong>Drive-by self-promotion</strong> — dropping links to your product in issues is spam.</li>
            <li><strong>Picking mega-issues</strong> as your first contribution — you will stall.</li>
          </ul>
        </>
      )}

      {section(
        "find-issues",
        "8. Where to find your first issues",
        <>
          <p style={{ marginBottom: 14 }}>
            Use GitTrek’s <Link href="/" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>home page</Link>: filter by language, labels, repo activity, and — when signed in — see whether an issue already has linked PR work before you invest hours.
          </p>
          <div style={{ ...cardSt, marginBottom: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--gt-text)" }}>Need</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--gt-text)" }}>GitHub Search</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--gt-text)" }}>GitTrek</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 6px" }}>First-timer labels</td>
                  <td style={{ padding: "8px 6px" }}>Manual query</td>
                  <td style={{ padding: "8px 6px" }}>One click filters</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 6px" }}>Avoid duplicate PR effort</td>
                  <td style={{ padding: "8px 6px" }}>Not visible directly</td>
                  <td style={{ padding: "8px 6px" }}>Built-in PR signal</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 6px" }}>Mission-based discovery</td>
                  <td style={{ padding: "8px 6px" }}>No</td>
                  <td style={{ padding: "8px 6px" }}>Quick Missions</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginBottom: 14 }}>
            Try <strong>Quick Missions</strong> for structured goals (e.g. discussions for Galaxy Brain, zero-comment issues for Pull Shark momentum).
          </p>
          <p>
            On GitHub directly, searches like <code>is:issue is:open label:&quot;good first issue&quot;</code> work — but they do not show PR competition; GitTrek exists to fill that gap.
          </p>
        </>
      )}

      {section(
        "badges",
        "9. The badge ladder (context)",
        <>
          <p style={{ marginBottom: 14 }}>
            GitHub achievement badges (Pull Shark, Galaxy Brain, Starstruck, …) reflect public activity. They are fun milestones — not proof of seniority.
          </p>
          <p>
            Track progress and share your public profile on{" "}
            <Link href="/badges" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>
              GitTrek Badges
            </Link>
            .
          </p>
        </>
      )}

      {section(
        "faq",
        "10. FAQ",
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              {
                q: "Do I need to be an expert?",
                a: "No. You need baseline Git, the ability to run the project locally, and willingness to read errors and docs.",
              },
              {
                q: "How long until my PR merges?",
                a: "Anywhere from hours to months depending on maintainers. Small, clean PRs merge faster.",
              },
              {
                q: "Can I work on an issue someone else claimed?",
                a: "If there is already an open PR, prefer another issue. GitTrek surfaces linked PRs to reduce wasted effort.",
              },
              {
                q: "What if my PR is rejected?",
                a: "Extract the feedback — wrong approach, wrong scope, or project direction. Apply it on the next attempt.",
              },
              {
                q: "Is documentation a valid first contribution?",
                a: "Yes. Fixes to README, examples, and typos are often welcomed and review faster.",
              },
              {
                q: "Should I ask to be assigned to an issue?",
                a: "Some repos want a comment like “I’d like to work on this”; others use assignment sparingly. Follow CONTRIBUTING.md.",
              },
              {
                q: "What about Hacktoberfest?",
                a: "Participating repos label issues; quality matters — spam PRs are discouraged and can get you banned from the event.",
              },
              {
                q: "Where can I learn Git deeper?",
                a: "Official Git docs, GitHub skills courses, and practice on your own forks before touching production OSS.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--gt-text)", marginBottom: 8 }}>{q}</h3>
                <p style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 48,
          padding: 24,
          background: "var(--gt-card)",
          border: "1px solid var(--gt-border)",
          borderRadius: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: "var(--gt-text-muted)" }}>
          Ready to search smarter?{" "}
          <Link href="/" style={{ color: "var(--gt-primary)", fontWeight: 700 }}>
            Open GitTrek
          </Link>
          {" · "}
          <Link href="/about" style={{ color: "var(--gt-primary)", fontWeight: 600 }}>
            Technical FAQ
          </Link>
        </p>
      </div>
    </main>
  );
}
