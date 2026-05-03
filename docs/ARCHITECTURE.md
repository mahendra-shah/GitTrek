# Architecture Deep Dive

> This document is intended for contributors and anyone wanting to understand how GitTrek is structured at the component and data-flow level.

---

## Overview

GitTrek is a **single-page application** built on Next.js 16's App Router. The UI is a client-rendered shell (`"use client"`) that orchestrates server-side API route handlers. There is no database — all state is ephemeral and session-scoped.

```
Browser (React SPA)
      │
      │  fetch POST /api/github/search
      ▼
Next.js Route Handler  ──────────────────►  GitHub GraphQL API
      │                                     (api.github.com/graphql)
      │  returns filtered IssueItem[]
      ▼
TanStack Query Cache
      │
      ▼
Component Tree (page.tsx → IssueCard)
```

---

## Component Hierarchy

```
app/layout.tsx
└── Providers (TanStack Query client)
    └── app/page.tsx  ← entire SPA lives here
        ├── Header (logo, nav tabs, session user, rate-limit bar)
        ├── Tab: "Find Issues"
        │   ├── aside > FilterPanel
        │   │   ├── TagInput (labels)
        │   │   ├── TagInput (languages)
        │   │   ├── rc-slider (stars range)
        │   │   ├── rc-slider (forks range)
        │   │   ├── rc-slider (issue age / repo pushed)
        │   │   └── FilterRow toggles (noAssignee, zeroComments, hasContributing, onlyOrgs)
        │   └── section > Results
        │       ├── Search form (debounced keyword input)
        │       ├── Sort pills + Asc/Desc toggle
        │       ├── Count bar (X issues found · Y filtered)
        │       ├── IssueCard[]
        │       └── Pagination
        └── Tab: "My Badges"
            └── Waitlist form (email capture)
```

---

## State Architecture

All state lives in `page.tsx`. There are two explicit layers:

### Draft State (local, uncommitted)
```typescript
const [draft, setDraft] = useState<FilterDraft>(DEFAULT);
```
This is what the user is _currently editing_. Changes here do not trigger API calls. It includes every filter field: labels, languages, stars, forks, issue age, org, toggles.

### Applied State (committed, triggers queries)
```typescript
const [applied, setApplied] = useState<FilterDraft>(DEFAULT);
```
This is the last-submitted version. The TanStack Query `queryKey` depends on `applied`, so any change here fires a new fetch.

**Why two layers?** This prevents firing an API request on every slider tick or keystroke (except for the debounced keyword search, which updates `applied.text` automatically after 500ms).

### Sorting State (client-only)
```typescript
const [sort, setSort] = useState<"created" | "updated" | "comments" | "stars">("created");
const [order, setOrder] = useState<"asc" | "desc">("desc");
```
Sorting does **not** trigger a re-fetch. It sorts the already-fetched `data.items` array in memory. This is an intentional decision — GitHub's issue search API doesn't support sorting by stars at all, so all sorting is client-side.

---

## Search Engine Internals (`src/app/api/github/search/route.ts`)

### Entry Point
`POST /api/github/search` accepts a JSON body validated against `FilterSchema` (Zod). Unknown fields are stripped. Invalid payloads return `400`.

### Authentication Branching
```
Token present?
├── YES → GraphQL path (rich data, PR detection, quality filtering)
└── NO  → REST fallback (limited, 10 results, no PR info, no quality filter)
```

### GraphQL Loop Architecture
The GraphQL path implements a **bounded fetch loop**:

```typescript
while (validItems.length < filters.perPage && loops < 3 && hasMore) {
  loops++;
  // Fetch 100 items from GitHub
  // Filter for quality (stars, forks, etc.)
  // Accumulate valid items
  // Advance cursor
}
```

This solves a fundamental problem: GitHub returns raw matches, but many will be filtered out by quality gates (too few stars, wrong owner type, repo is a fork). Without looping, a page of 20 filters might only yield 2 valid items. The loop ensures the user always gets a full page of quality-gated results.

**Loop cap of 3** = maximum 300 raw issues inspected per user request. This balances quality vs. API rate limit cost.

### Query Builder (`src/lib/github/search.ts`)
The `buildIssueSearchQuery` function assembles a [GitHub Search Query Language](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) string from structured filters:

```
Input: { labels: ["good first issue", "help wanted"], languages: ["TypeScript", "Rust"], zeroComments: true }

Output: 'is:issue is:open archived:false no:assignee comments:0
         (label:"good first issue" OR label:"help wanted")
         (language:TypeScript OR language:Rust)'
```

OR-groups are bounded by a `MAX_BOOLEAN_OPS = 5` limit (GitHub's search API restriction). Excess filters generate user-visible warnings.

### Quality Filter (`filterByRepoQuality`)
Runs server-side after fetch. Applies:
- `isFork: false` — forks almost never have independent issues
- `stars >= minStars` and `stars <= maxStars`
- `forks >= minForks` and `forks <= maxForks`
- `pushedAt >= cutoff` — repo must be recently active
- `ownerType === "Organization"` (if `onlyOrgs` is set)
- `hasContributingFile` (if `hasContributing` is set)

---

## Pagination & Cursor Management

GitHub's GraphQL API uses **opaque string cursors**, not numeric page offsets. This has important implications:

- You can only advance **one page forward** at a time (each next page requires the cursor from the previous page)
- You can freely jump **backward** to any already-visited page
- Jumping forward multiple pages is impossible without fetching intermediate pages

GitTrek stores cursor history:
```typescript
const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
// cursorHistory[0] = null (page 1 start)
// cursorHistory[1] = "cursor_after_page_1"
// cursorHistory[2] = "cursor_after_page_2"
// ...
```

`maxAllowedPage` is derived from `cursorHistory.length` and passed to `<Pagination>`, which grays out unreachable pages. The "First" button is always safe because it resets to `cursor = null`.

---

## Authentication Flow

```
User clicks "Sign In"
      │
      ▼
GET /api/auth/login
  → Redirects to github.com/login/oauth/authorize?client_id=...&state=...

GitHub redirects back to:
GET /api/auth/callback?code=...&state=...
  → Verifies state (CSRF protection)
  → Exchanges code for access_token via github.com/login/oauth/access_token
  → Sets HttpOnly cookie: session=<encrypted_token>
  → Redirects to /

GET /api/auth/me
  → Reads cookie, calls api.github.com/graphql (viewer query)
  → Returns { login, name, avatarUrl, htmlUrl }
  → Returns 401 if no valid session

GET /api/auth/logout
  → Clears session cookie
```

The access token is **never** sent to the browser JavaScript environment. It exists only in the `HttpOnly` cookie and is read by server-side route handlers.

---

## Design Token System (`src/lib/theme.css`)

All colors, shadows, and spacing values are expressed as CSS custom properties. The file defines a light mode baseline and overrides variables in `@media (prefers-color-scheme: dark)`.

This is the **single source of truth** for the entire UI. No hardcoded hex values should appear in component files. Instead:

```css
/* Correct */
color: var(--gt-text);
background: var(--gt-card);

/* Wrong */
color: #0D1117;
background: #161B22;
```

Adding a new color: define it in `theme.css` in both the `:root` (light) block and the `@media (prefers-color-scheme: dark)` block. Then use it via `var()` in components.

---

## Performance Decisions

| Decision | Reason |
|---|---|
| `timelineItems(first: 5)` instead of 25 | Was the #1 cause of slow queries. 5 is enough to detect open/draft PRs |
| Loop cap of 3 (not 5 or 10) | Prevents runaway rate limit consumption while still filling a page |
| Client-side sorting | Eliminates re-fetch on sort change; stars sort not possible via GitHub API |
| TanStack Query `keepPreviousData` | No empty flash between page changes — old data shown until new arrives |
| Skeleton loaders | Perceived performance — users don't notice 1–2s delay if UI is stable |
| 500ms debounce on keyword search | Prevents firing a query on every single keystroke |
