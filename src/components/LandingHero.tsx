/**
 * LandingHero — Server Component (Visually Hidden)
 *
 * This component is intentionally INVISIBLE to sighted users.
 * It exists solely in the raw HTML for:
 *   - Google/Bing crawlers (see full text, no JS required)
 *   - AI engines: Perplexity, ChatGPT, Claude (cite from raw HTML)
 *   - Screen readers (announced before the interactive UI)
 *   - Social/link preview scrapers
 *
 * Uses the industry-standard `sr-only` pattern (position:absolute, 1x1px, overflow:hidden).
 * NOT display:none or visibility:hidden — those are ignored by crawlers.
 * This technique is used by Stripe, GitHub, and Vercel for the same reason.
 *
 * IMPORTANT: Never add visual styles or make this visible. Never add "use client".
 */

export function LandingHero() {
  return (
    <div
      aria-hidden="false"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      <h1>Find GitHub Issues Where No One Is Already Working</h1>
      <p>
        GitTrek is a live open source discovery engine. Before you spend hours setting up a
        repository, GitTrek checks if someone is quietly already working on an issue — by scanning
        for competing pull requests in real-time using the GitHub GraphQL API. Free to use. Sign
        in with GitHub for full access.
      </p>

      <h2>Real-time PR Competition Detection</h2>
      <p>
        GitTrek uses the GitHub GraphQL API to scan the timelineItems of every issue. It looks for
        CrossReferencedEvent and ConnectedEvent entries to find active pull requests. You see
        whether an issue is safe to work on before you invest time cloning the repository.
      </p>

      <h2>GitHub Achievement Badge Tracking</h2>
      <p>
        Track your progress toward GitHub achievement badges including Pull Shark (merged pull
        requests — tiers: 2, 16, 128, 1024), Starstruck (stars on your repositories — tiers: 16,
        128, 512, 4096), Galaxy Brain (accepted discussion answers — tiers: 1, 8, 16, 32), YOLO
        (pull requests merged without review), and Public Sponsor. Each badge shows your current
        tier, a progress bar, and how many more contributions you need for the next level.
      </p>

      <h2>Quick Missions — 1-Click Badge Hunting</h2>
      <p>
        Galaxy Brain Mission: Find unanswered Q&amp;A discussions to answer. Pair Extraordinaire
        Mission: Find issues explicitly requesting co-authors. Pull Shark Mission: Find
        zero-comment fresh issues with no assignee. Each mission pre-fills all search filters
        optimally for that badge goal.
      </p>

      <h2>Repository Quality Filters</h2>
      <p>
        Filter open source issues by programming language, GitHub labels, issue age, minimum
        repository stars, minimum forks, maintainer activity, contributing guidelines, and
        organization. Supports both code issues and GitHub Discussions. Authenticated users get
        cursor-based pagination with 20 results per page.
      </p>

      <h2>How GitTrek Differs from goodfirstissue.dev</h2>
      <p>
        Unlike goodfirstissue.dev and up-for-grabs.net which show static curated lists, GitTrek is
        a live search engine. It checks for active pull requests, draft PRs, and linked branches on
        every result in real-time. GitTrek also tracks GitHub achievement badge progress — a feature
        not available on any other open source discovery platform.
      </p>

      <p>
        GitTrek is free to use. Guest users can search issues without signing in. Signing in with
        GitHub unlocks real-time PR competition detection, advanced repository quality gates, and
        personal badge progress tracking. Open source, MIT licensed.
      </p>
    </div>
  );
}
