# PRD: GitHub Dev Dashboard — Badge Tracker + Issue Finder
**Version:** 2.0  
**Status:** Draft  
**Author:** For: Mahendra Shah  
**Last Updated:** May 2026  
**Changelog from v1.0:** Added full Issue Finder module (Section 14–19), PR-against-issue detection (Section 15.4), updated architecture for dual-tool product, updated edge cases and risks.

---

## 1. Problem Statement

### Problem A: Badge Tracking
GitHub Achievement badges have zero native progress tracking. No progress bar, no "X more until next tier," no dashboard. Developers who care about their profile have no way to know where they stand without manually counting PRs or guessing.

### Problem B: Issue Discovery (NEW — the stronger problem)
Finding beginner-friendly open source issues is genuinely painful. Every existing tool (goodfirstissue.dev, up-for-grabs.net, goodfirstissues.com, codetriage) is either manually curated with stale data, has no repo quality filters, or has no way to detect whether an issue is already being worked on silently. Developers waste time setting up a repo only to find someone already has an open PR against the issue they picked.

**The gap no tool fills:** Combining repo quality signals (stars, forks, activity) + issue competition signals (comments, assignee, linked open PRs) in a single real-time query powered by GitHub's live API.

---

## 2. Product Overview

Two modules. One web app. Shared GitHub OAuth login.

| Module | What It Does |
|---|---|
| **Badge Tracker** | Calculates progress toward GitHub achievements for any username |
| **Issue Finder** | Finds beginner-friendly open issues in healthy repos with low competition |

Build order: Issue Finder first (stronger problem, better differentiation), Badge Tracker second. Both exposed as MCP tools in v2.

---

## 3. Competitive Analysis — Issue Finder

| Tool | Data Source | Real-time? | Star/Fork Filter | PR-Conflict Detection | Verdict |
|---|---|---|---|---|---|
| goodfirstissue.dev | Manually curated repo list | ❌ No | ❌ No | ❌ No | Dead data |
| goodfirstissues.com | GitHub API | ✅ Yes | ❌ No | ❌ No | No quality filters |
| up-for-grabs.net | Manually curated | ❌ No | ❌ No | ❌ No | Stale |
| codetriage.com | GitHub API | ✅ Yes | ❌ No | ❌ No | Email-only, no search |
| GitHub native search | GitHub API | ✅ Yes | ✅ Yes | ❌ No | Terrible UX, no combined filters |
| **This tool** | GitHub API | ✅ Yes | ✅ Yes | ✅ Yes | **The gap** |

---

## 4. What the GitHub API Can and Cannot Do

### 4.1 Badge Tracker — API Coverage

| Achievement | Data Needed | API | Reliability |
|---|---|---|---|
| Pull Shark | Total merged PRs by user | REST Search `total_count` | ✅ High |
| Starstruck | Highest star count on any repo | GraphQL `stargazerCount` | ✅ High |
| Galaxy Brain | Accepted Discussion answers | GraphQL `isAnswer` | ✅ High |
| Public Sponsor | Has sponsored anyone | GraphQL `sponsoring.totalCount` | ✅ High |
| YOLO | Merged PR without review | GraphQL `reviewDecision == null` + merged | ⚠️ Medium |
| Pair Extraordinaire | Co-authored merged PRs | GraphQL commit body parsing | ⚠️ Medium |
| Quickdraw | Issue/PR closed within 5 min | REST timestamp diff across all PRs | ❌ Impractical |

### 4.2 Issue Finder — API Coverage

| Filter | API Support | Notes |
|---|---|---|
| `is:open is:issue` | ✅ REST Search | Native |
| `no:assignee` | ✅ REST Search | Native qualifier |
| `comments:0` | ✅ REST Search | Native qualifier |
| `stars:>500` | ✅ REST Search | Applies to parent repo |
| `forks:>200` | ✅ REST Search | Applies to parent repo |
| `label:"good first issue"` | ✅ REST Search | Native |
| `pushed:>DATE` | ✅ REST Search | Repo last push date |
| Has CONTRIBUTING.md | ⚠️ GraphQL | Separate query per repo; expensive at scale |
| Linked open PR exists | ✅ GraphQL `timelineItems` | CROSS_REFERENCED_EVENT + CONNECTED_EVENT |
| Issue has linked branch | ✅ GraphQL `linkedBranches` | Secondary competition signal |

### 4.3 API Cost

| Auth Level | Rate Limit | When to Use |
|---|---|---|
| No auth | 60 req/hour | Never — insufficient for Issue Finder |
| OAuth token | 5,000 req/hour | Required for all features |

**Decision: OAuth login required.** No anonymous mode for Issue Finder — the combined filters require 3–6 API calls per search, and anonymous rate limits will be exhausted immediately with any real usage.

---

## 5. Achievement Tiers Reference (community-verified, not officially documented)

### Pull Shark
| Tier | Merged PRs |
|---|---|
| x1 | 2 |
| x2 | 16 |
| x3 | 128 |
| x4 | 1,024 |

### Starstruck
| Tier | Stars (one repo) |
|---|---|
| x1 | 16 |
| x2 | 128 |
| x3 | 512 |
| x4 | 4,096 |

### Pair Extraordinaire
| Tier | Co-authored merged PRs |
|---|---|
| x1 | 1 |
| x2 | 10 |
| x3 | 24 |
| x4 | 48 |

### Galaxy Brain
| Tier | Accepted answers |
|---|---|
| x1 | 1 |
| x2 | 8 |
| x3 | 16 |
| x4 | 32 |

### YOLO, Quickdraw, Public Sponsor — single tier, binary (earned / not earned)

---

## 6. User Stories

### Badge Tracker
- **US-1:** As a developer, I enter my username and immediately see how many more merged PRs I need for the next Pull Shark tier.
- **US-2:** I want to see which of my repos is closest to the next Starstruck tier, so I know where to focus promotion.
- **US-3:** I want to clearly understand which achievements can't be tracked, so I don't think the tool is broken.
- **US-4:** My PR count is accurate even though I have 200+ merged PRs across many repos.

### Issue Finder
- **US-5:** As a beginner, I want to find real open issues in maintained repos where no one has already started working.
- **US-6:** I want to filter by programming language and minimum repo stars so I'm contributing to projects that matter.
- **US-7:** I want to see a clear warning if an issue already has an open PR against it, so I don't waste my setup time.
- **US-8:** I want issues sorted by "least competition" so the best opportunities surface first.
- **US-9:** I want to know the repo's last commit date so I don't contribute to abandoned projects.

---

## 7. Functional Requirements — Badge Tracker

### 7.1 Input
GitHub OAuth login (required). Username-only mode as fallback for read-only public data.

### 7.2 Achievement Cards
Each card shows:
- Achievement icon + name
- Current tier badge (x1/x2/x3/x4)
- Progress bar: `current / next_threshold`
- CTA: "16 more merged PRs to reach Silver"
- Data confidence label: "Live from GitHub API" or "Cannot track — see why"

### 7.3 Card States
1. **Maxed out:** Gold styling, "Maximum tier reached"
2. **Earned, progress to next:** Filled progress bar, exact count to next
3. **Not earned:** Empty progress bar, "0 / 2 to unlock"
4. **Not trackable:** Greyed out, tooltip explanation

### 7.4 Pagination
GitHub returns max 100 results per page. Paginate using `after` cursor (GraphQL) or `page` (REST) until `hasNextPage == false`. Non-negotiable — without pagination, counts cap at 100 and are wrong for active contributors.

---

## 8. Functional Requirements — Issue Finder (NEW)

### 8.1 Filter Panel

**Repo Quality Filters:**
| Filter | Type | Default | Notes |
|---|---|---|---|
| Min stars | Number input | 100 | Signals maintained, used project |
| Min forks | Number input | 50 | Secondary quality signal |
| Max stars | Number input | (none) | Let user target "mid-tier" repos to avoid huge backlogs |
| Last repo push | Dropdown | 90 days | Filters out abandoned repos |
| Language | Multi-select | (none) | Python, JS, TS, Go, Rust, Java, etc. |

**Issue Competition Filters:**
| Filter | Type | Default | Notes |
|---|---|---|---|
| Max comments | Number input | 3 | 0 = truly untouched |
| No assignee | Toggle | ON | Always default on |
| Has no linked open PR | Toggle | ON | The key differentiator — see Section 8.3 |
| Labels | Multi-select | "good first issue", "help wanted" | |
| Issue age | Dropdown | < 30 days | Fresh issues get claimed fast — old ones are often stale/blocked |
| Has no linked branch | Toggle | OFF | Optional extra signal |

### 8.2 Result Card — What to Show Per Issue

```
[Repo Name]                    ⭐ 1,204  🍴 342  Last commit: 3 days ago
Issue #847: Fix missing avatar in People table
Labels: good first issue  bug
Opened: 2 days ago  |  Comments: 0  |  Assignee: none
PR Status: ✅ No linked PRs (safe to claim)
[View Issue →]
```

### 8.3 PR-Against-Issue Detection — How It Works

This is the most technically important feature of the Issue Finder. No existing tool does this.

**Two GraphQL event types must both be checked:**

**Type 1 — `CROSS_REFERENCED_EVENT`:** Fires when someone mentions `#issue-number` in a PR description or commit message. This is the most common way developers "silently claim" an issue.

**Type 2 — `CONNECTED_EVENT`:** Fires when a branch is explicitly linked to the issue via GitHub's "Create a branch for this issue" button. Often missed by other tools.

**The query:**
```graphql
issue(number: $issueNumber) {
  timelineItems(first: 25, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
    nodes {
      ... on CrossReferencedEvent {
        source {
          ... on PullRequest {
            number
            state      # OPEN | CLOSED | MERGED
            isDraft
            title
            createdAt
          }
        }
      }
      ... on ConnectedEvent {
        subject {
          ... on PullRequest {
            number
            state
            isDraft
            title
          }
        }
      }
    }
  }
  linkedBranches(first: 5) {
    totalCount
  }
}
```

**Classification logic:**
```
linked PRs where state == OPEN and isDraft == false  →  🔴 "Active PR exists — high competition"
linked PRs where state == OPEN and isDraft == true   →  🟡 "Draft PR exists — someone started"
linkedBranches.totalCount > 0, no PR yet             →  🟡 "Branch created — someone may be working"
no linked PRs, no branches                           →  ✅ "Safe to claim"
all linked PRs are CLOSED or MERGED                  →  ✅ "Safe — previous attempts closed"
```

**Cost:** This check requires one GraphQL query per issue. For a result set of 20 issues, that's 20 additional API calls. This is why OAuth (5,000 req/hr) is non-negotiable — unauthenticated (60/hr) would be destroyed by this in minutes.

**Optimization:** Run the base issue search first (1 API call), display results immediately, then run the PR-link checks in parallel for all results and update each card as they resolve. Never block the UI waiting for all checks.

### 8.4 Result Sorting Options
- Default: "Safest to claim" (no linked PR, 0 comments, most recent)
- Repo stars (high to low) — for prestige contributions
- Issue age (newest first) — for freshest opportunities
- Repo last commit (most recent) — for most active maintainers

### 8.5 "Why This Issue?" Score (optional v1 feature)
A simple computed score per issue:

```
score = 0
if comments == 0: score += 30
if no assignee: score += 20
if no linked PR: score += 30
if repo pushed < 30 days ago: score += 10
if has CONTRIBUTING.md: score += 10

Label: "🔥 High Opportunity" (70+) | "Good" (40–69) | "Risky" (<40)
```

---

## 9. Technical Architecture

### 9.1 Stack
- **Frontend:** React + TypeScript
- **No backend required for v1** — all GitHub API calls made client-side with user's OAuth token
- **Auth:** GitHub OAuth App (free, register at github.com/settings/developers)
- **Styling:** Tailwind CSS
- **State:** React Query for API caching and refetch management

### 9.2 Why No Backend for v1
Running API calls from the browser with the user's own token means:
- Each user consumes their own rate limit (5,000/hr), not yours
- No server costs
- No token storage risk on your server
- Trivially deploy to Vercel/Netlify free tier

**When you need a backend:** If you want to cache results server-side, offer saved searches, or build a shared leaderboard. That's v2.

### 9.3 Key API Calls — Badge Tracker

**Pull Shark (REST):**
```
GET /search/issues?q=is:pr+is:merged+author:{username}&per_page=1
→ total_count  (single call, no pagination needed for count)
```

**Starstruck (GraphQL):**
```graphql
user(login: $username) {
  repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
    nodes { name stargazerCount }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Galaxy Brain (GraphQL):**
```graphql
user(login: $username) {
  repositoryDiscussionComments(first: 100) {
    nodes { isAnswer }
    pageInfo { hasNextPage endCursor }
  }
}
```
Paginate until `hasNextPage == false`, count `isAnswer == true` nodes.

**YOLO (GraphQL search):**
```graphql
search(query: "is:pr is:merged author:$username review:none", type: ISSUE, first: 1) {
  issueCount  # > 0 means earned
}
```

**Public Sponsor (GraphQL):**
```graphql
user(login: $username) {
  sponsoring { totalCount }
}
```

### 9.4 Key API Calls — Issue Finder

**Step 1 — Base Issue Search (REST):**
```
GET /search/issues
?q=is:issue+is:open+no:assignee+comments:0+label:"good+first+issue"+stars:>500+forks:>100+language:javascript+pushed:>2026-02-01
&sort=created&order=desc&per_page=20
```
This returns issues with repo metadata. Single call. Fast.

**Step 2 — PR-Link Check per issue (GraphQL, run in parallel):**
```graphql
query CheckLinkedPRs($owner: String!, $repo: String!, $issueNumber: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $issueNumber) {
      timelineItems(first: 25, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
        nodes {
          ... on CrossReferencedEvent {
            source {
              ... on PullRequest { number state isDraft }
            }
          }
          ... on ConnectedEvent {
            subject {
              ... on PullRequest { number state isDraft }
            }
          }
        }
      }
      linkedBranches(first: 3) { totalCount }
    }
  }
}
```
Run all 20 of these in parallel via `Promise.all()`. Each is one GraphQL call. 20 issues = 21 total API calls per search.

**Step 3 — CONTRIBUTING.md check (optional, v1.1):**
```
GET /repos/{owner}/{repo}/contents/CONTRIBUTING.md
→ 200 = exists, 404 = doesn't exist
```

### 9.5 OAuth Setup
1. Register OAuth App: github.com/settings/developers → "New OAuth App"
2. Callback URL: `https://your-domain.com/auth/callback`
3. Scopes needed: `public_repo`, `read:user`
4. Store token in React state (memory only) — never localStorage, never a cookie
5. Token expires with session — user re-authenticates on next visit

### 9.6 Caching Strategy
- Cache issue search results per filter combination: 15-minute TTL
- Cache PR-link checks per issue: 30-minute TTL
- Cache badge data per username: 30-minute TTL
- Use React Query's `staleTime` and `cacheTime` for this
- Show "Last updated X minutes ago" on all cached data

---

## 10. UI/UX Requirements

### 10.1 Navigation
Two tabs: **"My Badges"** | **"Find Issues"**

### 10.2 Badge Tracker UI
- Header with GitHub avatar, username, join date
- Grid of achievement cards (2-col desktop, 1-col mobile)
- Loading: skeleton cards per achievement
- Error states: per-card, not full-page crash

### 10.3 Issue Finder UI
- Left panel: filter controls (collapsible on mobile)
- Right panel: scrollable result list
- Each result card (see Section 8.2)
- PR status badge updates live as checks complete — don't wait for all
- "No results" state shows which filters to relax

### 10.4 PR Status Badge Colors
- 🟢 Green: "No linked PRs — safe to claim"
- 🟡 Yellow: "Draft PR or branch exists — check before starting"
- 🔴 Red: "Active open PR — high competition"
- ⚪ Grey: "Checking..." (while async check runs)

---

## 11. Edge Cases

### Badge Tracker Edge Cases
| Case | Handling |
|---|---|
| User doesn't exist | Show "User not found" — clear all state |
| 0 merged PRs | Show "0/2 — get your first PR merged!" with a link to Issue Finder |
| Private repos with stars | Note: private repo stars inaccessible without elevated scope |
| 1000+ merged PRs | REST `total_count` handles this — no pagination needed for count |
| Username has special characters | URL-encode before all API calls |
| API 403 (rate limit) | Show time until reset + cached data if available |
| API 422 (query abuse) | Scope query more tightly, show error message |
| YOLO: draft PRs | GitHub's own criteria unclear — mark as "estimated" |
| Tier thresholds change | Stored in a config file — update in one place |

### Issue Finder Edge Cases
| Case | Handling |
|---|---|
| Search returns 0 results | Show filter relaxation suggestions ("Try increasing max comments to 3") |
| PR check returns no timeline events | Default to ✅ "Safe" — absence of evidence is not evidence of a PR |
| `CrossReferencedEvent` from a closed repo | Filter out — source repo is gone, not a competition signal |
| Issue is in a fork, not the upstream | Show warning: "This issue is in a fork — PRs here won't count toward your GitHub achievements" |
| Issue labeled "in progress" by maintainer | Detect this label and surface as 🔴 even if no PR exists |
| Repo has 0 issues but search returns it | API inconsistency — skip and log |
| `linkedBranches` returns totalCount > 0 but no PR yet | Surface as 🟡 — someone has a branch, intent is unclear |
| Filter combination returns >1000 results | GitHub Search caps at 1,000 — show notice, suggest narrowing filters |
| GitHub Search `total_count` approximate for >1000 | Show disclaimer: "Counts may be approximate for large result sets" |
| Rate limit hit mid-search (21 calls) | Abort remaining PR checks, show partially-checked results with note |
| Issue PR check: CONNECTED_EVENT has null subject | Guard with optional chaining — `subject?.pullRequest` |
| User's token expires mid-session | Catch 401, prompt re-authentication without losing filter state |

---

## 12. Out of Scope for v1

- Saved searches / bookmarks
- Email or push notifications when issues matching saved filters appear
- Side-by-side repo comparison
- Historical progress charts for badges
- Quickdraw badge tracking (impractical)
- Pair Extraordinaire deep tracking (complex commit parsing)
- Private repo contributions (requires elevated OAuth scope)
- Organization-level stats
- MCP server (v2 — same API logic, different transport layer)
- Backend / server-side caching (v2)

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| GitHub adds native issue finder with quality filters | Medium | Tool still has PR-conflict detection as differentiator |
| GitHub adds native badge progress tracking | High | Shifts this to a learning project only — acceptable outcome |
| GitHub Search API caps `total_count` at ~1000 | Medium | Show disclaimer for large counts; not a critical issue for most users |
| `CrossReferencedEvent` visibility depends on token scope | Low | Using user OAuth token (not bot token) avoids this |
| Rate limits hit with 21 calls/search | Low | OAuth token gives 5,000/hr; 21 calls/search = ~238 searches/hr |
| GitHub changes `timelineItems` schema | Low | Write type-safe GraphQL queries; breaking changes will be caught at runtime |
| Tool goes viral and multiple users share same token | N/A | Each user uses their own token — this isn't a server-side concern |
| Tier thresholds are community-sourced, could change | Medium | Store in config, add "last verified" date in UI |

---

## 14. Build Sequence

Build in this exact order to ship something usable as fast as possible:

**Week 1:**
1. GitHub OAuth login flow (get this right first — everything depends on it)
2. Basic issue search with 3 filters (stars, no assignee, language)
3. Display raw results — no PR check yet

**Week 2:**
4. Add PR-link detection (CROSS_REFERENCED_EVENT + CONNECTED_EVENT)
5. Add PR status badge to each card
6. Polish result card UI

**Week 3:**
7. Add remaining issue filters (comments, age, forks, labels)
8. Add "Opportunity Score" sorting
9. Add CONTRIBUTING.md check

**Week 4:**
10. Badge Tracker tab
11. Progress bars for Pull Shark, Starstruck, Galaxy Brain
12. Rate limit handling and caching

**Deploy:** Vercel free tier. Zero cost.

---

## 15. Success Criteria for v1

- [ ] PR-link detection correctly identifies open PRs on a known issue (manually verifiable)
- [ ] Issue search results are live from GitHub (not cached static data)
- [ ] All filters work in combination without breaking the search query
- [ ] PR status badges update without blocking the initial result display
- [ ] OAuth login flow completes without errors
- [ ] Rate limit errors don't crash the app — show partial data with explanation
- [ ] Works on mobile (filter panel collapses, cards stack)
- [ ] Pull Shark count matches `github.com/search?q=is:pr+is:merged+author:USERNAME`
- [ ] "Fork issue" warning shown correctly for issues in forked repos

---

## 16. What This PRD Is Missing / How It Could Be Wrong

- **`CONNECTED_EVENT` vs `CROSS_REFERENCED_EVENT` completeness:** Research confirmed both events exist and are detectable via GraphQL, but edge cases exist — specifically, if a developer clones and works locally without ever pushing a branch or mentioning the issue in a commit, they're invisible to any API-based detection. You cannot solve this. Accept it and document it.
- **"comments:0" as a competition proxy is weak for popular repos:** A React or VS Code issue with 0 comments can still have 10 developers racing to it the moment it's posted. Comment count and PR-link detection are the best available signals, but they are not guarantees.
- **CONTRIBUTING.md check adds 20 extra API calls** (one per repo in results). That's 41 total calls per search if enabled. Still within rate limits but adds latency. Make this opt-in behind a "strict mode" toggle.
- **Issue age filter has a counter-intuitive optimal range:** Issues younger than 24 hours are often already claimed by the time a beginner finds them. Issues older than 30 days may be stale or blocked by maintainer. Sweet spot is likely 2–14 days — not captured in current filter defaults.
- **The Pair Extraordinaire badge:** GitHub requires `Co-authored-by:` in the commit message. Some developers use different formats or co-author via GitHub's UI. False negatives are likely. Mark this badge as "estimated."
- **Private contributions:** If a user enables "show private contributions" on GitHub, their actual badge progress may be higher than this tool shows. Always display: "This tool only counts public activity."
