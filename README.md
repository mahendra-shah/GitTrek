<div align="center">

<img src="public/logo-light.svg" alt="GitTrek" width="90" height="90" />

# GitTrek

### FIND ISSUES · TRACK BADGES · CONTRIBUTE

**The smartest way to find beginner-friendly open source issues.**  
Powered by GitHub's GraphQL API. Built for contributors who are serious about leveling up.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)
[![GitHub GraphQL API](https://img.shields.io/badge/GitHub-GraphQL%20API-6e40c9?logo=github)](https://docs.github.com/en/graphql)

</div>

---

## What is GitTrek?

GitTrek is a high-performance issue discovery platform built for open source contributors. Instead of scrolling endlessly through GitHub search results, GitTrek lets you compose precise multi-dimensional filters — stars, forks, language, label, organization, issue age, PR competition — and surfaces only the issues worth your time.

It's opinionated by default and configurable by power users. Every filter you set is translated into a precise GitHub GraphQL query, fetched in batches, and refined server-side against quality thresholds that GitHub's own search API can't express.

---

## Key Features

| Feature | Details |
|---|---|
| 🔍 **Smart Search** | Debounced keyword search + GraphQL query builder with OR-group expansion |
| 🏷️ **Label & Language Filtering** | Multi-select with intelligent label highlighting on issue cards |
| ⭐ **Repository Quality Gates** | Min/max stars, min/max forks, last-pushed cutoff — filters run server-side |
| 🏢 **Organization Filtering** | Scope search to a specific org or toggle to only see org-owned repos |
| 📡 **Live PR Competition** | Detects open PRs, draft PRs, and linked branches per issue via GraphQL `timelineItems` |
| 🗂️ **Task Completion Parsing** | Parses markdown task lists from issue bodies, shows `4 / 22 tasks` directly on cards |
| 📄 **Cursor-Safe Pagination** | GraphQL cursor chain is preserved; forward jumps are safely restricted |
| 🔒 **Secure GitHub OAuth** | Access token stored in an `HttpOnly` cookie — never exposed to client-side JS |
| 🛡️ **Rate Limit Aware** | Real-time progress bar shows API quota consumption; warns on partial results |
| 🦴 **Skeleton Loading** | Animated skeletons replace empty states during fetch, eliminating layout shift |
| 🎨 **Design Token System** | Entire UI driven by CSS variables in a single `theme.css` file |
| 🌗 **Dark / Light Mode** | Follows OS preference automatically via `prefers-color-scheme` |

---

## Tech Stack

```
Framework     Next.js 16 (App Router)       React Server Components + Route Handlers
Language      TypeScript 5                  Strict mode throughout
State         TanStack Query v5             Stale-while-revalidate, keepPreviousData
Styling       Vanilla CSS + Tailwind v4     Design tokens centralized in theme.css
API Layer     GitHub GraphQL v4 API         Authenticated via OAuth token in cookie
Auth          Custom OAuth 2.0 flow         HttpOnly session cookie, no JWT
Validation    Zod v4                        Schema-validated at API route boundary
UI Libraries  Lucide React, RC Slider       Icons + dual-handle range sliders
Fonts         Space Grotesk + Geist Mono    Google Fonts, loaded via Next.js
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A GitHub account
- A registered GitHub OAuth App (takes 2 minutes — see below)

### 1 — Register a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps**
   👉 https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the fields:

   | Field | Value |
   |---|---|
   | Application name | GitTrek (or any name) |
   | Homepage URL | `http://localhost:5173` |
   | Authorization callback URL | `http://localhost:5173/api/auth/callback` |

4. Click **Register application**
5. Copy the **Client ID** shown immediately
6. Click **"Generate a new client secret"** — copy it (shown only once!)

### 2 — Configure environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5173/api/auth/callback
COOKIE_SECRET=your_32_char_random_secret_here
```

Generate a cookie secret with:
```bash
openssl rand -hex 32
```

### 3 — Install and run

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
open-dev/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts       # Initiates GitHub OAuth redirect
│   │   │   │   ├── callback/route.ts    # Exchanges code for token, sets cookie
│   │   │   │   ├── logout/route.ts      # Clears session cookie
│   │   │   │   └── me/route.ts          # Returns current session user
│   │   │   └── github/
│   │   │       └── search/route.ts      # Core search engine (GraphQL + REST fallback)
│   │   ├── page.tsx                     # Main SPA — tabs, state, query orchestration
│   │   ├── layout.tsx                   # Root layout, font loading, metadata
│   │   └── providers.tsx                # TanStack Query provider
│   ├── components/
│   │   ├── FilterPanel.tsx              # Sidebar filter UI, all filter state types
│   │   ├── IssueCard.tsx                # Issue card with PR status, tasks, labels
│   │   ├── Pagination.tsx               # Cursor-safe paginator with First/Prev/Next
│   │   └── TagInput.tsx                 # Multi-tag input (labels, languages)
│   └── lib/
│       ├── auth/adapter.ts              # Token extraction from HttpOnly cookie
│       ├── github/search.ts             # Query builder + quality filter functions
│       ├── env.ts                       # Type-safe environment variable validation
│       └── theme.css                    # 🎨 Single source of truth for all design tokens
├── public/
│   ├── logo-light.svg                   # Brand logo (used in both modes)
│   └── favicon.ico
└── docs/
    ├── ARCHITECTURE.md                  # Component-level architecture deep dive
    └── SYSTEM_DESIGN.md                 # Data flow, API design, rate limiting strategy
```

---

## How the Search Engine Works

The core search pipeline has three stages:

**1. Query Building** (`src/lib/github/search.ts`)  
User filters are compiled into a GitHub Search Query Language string. Labels and languages are OR-grouped. Boolean operator count is capped at 5 to stay within GitHub API limits. The query is validated and trimmed to 240 characters max.

**2. GraphQL Batch Fetch** (`src/app/api/github/search/route.ts`)  
The compiled query is sent to GitHub's GraphQL API, fetching up to 100 issues per request. The server loops up to 3 times to accumulate enough valid items after local filtering. Each issue includes repository metadata, `timelineItems` (for PR detection), and `linkedBranches`.

**3. Server-Side Quality Filtering** (`filterByRepoQuality`)  
GitHub's search API doesn't support complex numeric range filters. After fetching, each issue is tested against: min/max stars, min/max forks, push recency, fork status, owner type (User vs Organization), and CONTRIBUTING.md presence.

For unauthenticated users, a REST fallback provides limited results (10 per page) without PR status or quality filtering.

---

## Docs

- [Architecture Deep Dive](docs/ARCHITECTURE.md)
- [System Design](docs/SYSTEM_DESIGN.md)

---

## Roadmap

- [ ] **Badge Tracker** — Track GitHub achievements (Pull Shark, YOLO, Galaxy Brain) by connecting to your own activity
- [ ] **Waitlist** — Join to get early access notifications → [join the waitlist](https://gittrek.dev)
- [ ] **Saved Searches** — Persist filter presets across sessions
- [ ] **Issue Bookmarks** — Star issues to revisit later
- [ ] **Contribution History** — Track PRs you've opened from discovered issues

---

## Contributing

Contributions are welcome! This project was built to help developers like you find great open source issues — contributing to it is meta in the best way.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and test locally
4. Open a pull request with a clear description

Please check [ARCHITECTURE.md](docs/ARCHITECTURE.md) before making structural changes.

---

## License

MIT © [Mahendra](https://github.com/mahendra)

---

<div align="center">
<sub>Built with ☕ and a passion for open source. If this helped you land a PR, give it a ⭐</sub>
</div>
