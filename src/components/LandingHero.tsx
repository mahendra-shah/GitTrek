import {
  CANONICAL_DESCRIPTION,
  SITE_AI_CONTEXT,
  SITE_CAREER_HOOK,
  SITE_BADGE_MISSIONS_CALLOUT,
} from "@/lib/site-copy";

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
      <p>{CANONICAL_DESCRIPTION}</p>
      <p>{SITE_AI_CONTEXT}</p>
      <p>{SITE_CAREER_HOOK}</p>
      <p>{SITE_BADGE_MISSIONS_CALLOUT}</p>
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
