Badge Feature List — Priority Ordered

1. Live Progress Dashboard
The core. Nothing else ships without this.
One card per badge. Each card shows:

Current tier (Bronze/Silver/Gold/Platinum or "Not earned")
Exact count you have now vs. next threshold
Progress bar with percentage
Exact number needed: "81 more merged PRs to Silver"

The tiered badges are: Pull Shark (2/16/128/1024 PRs), Starstruck (16/128/512/4096 stars on one repo), Pair Extraordinaire (1/10/24/48 co-authored PRs), Galaxy Brain (2/8/16/32 accepted answers). Single-tier badges (YOLO, Quickdraw, Public Sponsor) show binary earned/not-earned with a how-to-earn tip. GitHub
Differentiation: Nobody calculates this live. Every competitor is a static list.

2. "Focus Badge" Recommendation
The smartest feature and the easiest to build.
After calculating all progress, surface one card at the top: "You're closest to earning Galaxy Brain — 1 accepted Discussion answer needed."
Logic: calculate (needed / threshold) × 100 for each badge → lowest percentage remaining = recommended focus.
This is a one-line calculation but it feels like the tool is actually coaching the user. No competitor does this.

3. The Loop — Badge → Issue Finder Integration
The killer feature. This is what makes GitTrek unique as a combined tool.
Under the Pull Shark progress bar, add a button: "Find issues to merge →" — clicking it opens the Issue Finder pre-filtered for beginner issues with no linked PR, in the user's primary language.
Under Galaxy Brain: "Find repos with Discussions enabled →"
This creates a closed loop that no standalone badge tracker can replicate because they don't have an issue finder. This is your moat.

4. Any User Lookup
Search any GitHub username, not just yourself.
Enter torvalds and see his calculated Pull Shark tier. Enter a friend's username to compare.
This is how the tool goes viral. Someone tweets "Look up your GitHub username on GitTrek" — people do it, see their progress, share their card. No auth needed for public profiles.
One important nuance from research: Starstruck is awarded per repository — when a repository on your account hits the star threshold, you receive the badge. So for any user lookup, Starstruck must check their highest-starred single repo, not total stars across repos. Github Achievements

5. Shareable Badge Card
The virality engine.
A generated image card showing:

User avatar + username
All earned badges with tiers
"Calculated by GitTrek" watermark with the URL

One "Share my progress" button → generates the card → user posts it on Twitter/X. Every share is a free ad with your URL embedded.
Implementation: render a canvas/SVG server-side or use html2canvas on the frontend.

6. "What Breaks This Badge" Honesty Layer
The trust builder no one else has.
Under each badge, a small collapsible section explaining the known limitations of the calculation:

Pull Shark: "Only counts public merged PRs. Private repo contributions not included."
Starstruck: "Checks your highest-starred public repo only."
YOLO: "Estimated — GitHub's exact criteria for 'no review' is not publicly documented."
Quickdraw: "Cannot be tracked via API — requires scanning all PR timestamps."

Developers are skeptical about badges' ability to reflect their attributes and skills — being honest about calculation limitations builds more trust than pretending the numbers are perfect. It also preempts support questions. KQL (Kusto Query Language)

7. Milestone Timeline
Shows the journey, not just the current state.
A small timeline per badge showing when each tier was unlocked — inferred from the PR that triggered it (for Pull Shark, which PR was the 2nd, 16th, 128th). For Starstruck, when the repo crossed each threshold.
This requires more API calls but turns the badge tab from a dashboard into a story. "You earned Pull Shark Bronze on March 3rd, 2024 when your PR #47 was merged."

8. Next 30 Days Pace Tracker
Answers "am I on track?"
Pull the user's merged PR count from the last 30 days → extrapolate: "At your current pace of 4 PRs/month, you'll reach Pull Shark Silver in approximately 20 months."
Or: "You're averaging 12 PRs/month — Silver in 7 months at this rate."
This changes the emotional experience from a static number to a moving target. Motivating for active contributors, honest for inactive ones.

Issue Finder Additions Worth Adding
Three things from this research session that should go into the Issue Finder:
Galaxy Brain Issues — a dedicated filter for repos with GitHub Discussions enabled + questions that have no accepted answer yet. Currently your Issue Finder only finds code contribution issues. This surfaces a whole category of contribution (answering discussions) that earns its own badge and is far less competitive than PRs. Label it "Discussions" as a tab or issue type toggle.
"Repo has active maintainer" signal — 86% of YOLO badge PRs were merged by the authors themselves into their own personal projects — meaning a lot of "merged PR" activity on GitHub is self-merging, not real collaboration. Your Issue Finder should surface repos where the maintainer is responsive — check for recent comments from repo owners on issues/PRs within the last 30 days. Issues in repos with ghost maintainers waste contributor time. KQL (Kusto Query Language)
Pair Extraordinaire filter — filter for issues where the repo owner or other contributors have explicitly asked for pair collaboration in the issue comments. Rare but findable. Enables a contribution type that earns a separate badge (Pair Extraordinaire) and teaches collaborative git workflow.

What This Might Be Missing
The Starstruck badge shows a strong association with the number of followers — it reflects popularity, not contribution quality. This means users with popular repos will look impressive in the badge tracker even if they haven't contributed a single line to another project. Consider adding a "contribution quality" indicator — ratio of PRs in other people's repos vs. own repos — as a separate metric alongside badges. No competitor has this and it's more meaningful to recruiters than badge tier alone. 