/**
 * LandingHero — Server Component (SEO/AEO only)
 *
 * Visually hidden block that puts a crawlable h1 and semantic content
 * in the raw HTML for search engines and AI citation engines.
 * The visible h1 lives inline inside HomeClient above Quick Missions.
 */

export function LandingHero() {
  return (
    <div
      aria-hidden="true"
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
      <h1>Don&apos;t get sniped on GitHub issues — Find Issues Worth Your Time</h1>
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
        Track your progress toward GitHub achievement badges including Pull Shark, Starstruck,
        Galaxy Brain, YOLO, and Public Sponsor. Each badge shows your current tier, a progress
        bar, and how many more contributions you need for the next level.
      </p>
      <h2>Quick Missions — 1-Click Badge Hunting</h2>
      <p>
        Galaxy Brain Mission: Find unanswered Q&amp;A discussions to answer. Pair Extraordinaire
        Mission: Find issues explicitly requesting co-authors. Pull Shark Mission: Find
        zero-comment fresh issues with no assignee.
      </p>
      <h2>Repository Quality Filters</h2>
      <p>
        Filter open source issues by programming language, GitHub labels, issue age, minimum
        repository stars, minimum forks, maintainer activity, contributing guidelines, and
        organization. Supports both code issues and GitHub Discussions.
      </p>
    </div>
  );
}
