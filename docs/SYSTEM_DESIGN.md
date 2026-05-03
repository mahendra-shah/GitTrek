# System Design

> This document describes the data flow, API design, rate limiting strategy, and key trade-offs in GitTrek's architecture.

---

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                           │
│                                                                     │
│  FilterPanel ──► draft state ──► [Submit / Debounce]               │
│                                       │                            │
│                              applied state changes                  │
│                                       │                            │
│                         TanStack Query detects key change           │
│                                       │                            │
│                         POST /api/github/search                     │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │
                              (JSON body: FilterDraft)
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Next.js Route Handler (Server)                   │
│                                                                     │
│  1. Zod validates + sanitizes input                                 │
│  2. Read token from HttpOnly session cookie                         │
│  3. Branch: token present? → GraphQL | absent → REST               │
│                                                                     │
│  GraphQL path:                                                      │
│  ┌─────────────────────────────────────────────┐                   │
│  │  buildIssueSearchQuery(filters)             │                   │
│  │    └── compile GitHub Search Query string   │                   │
│  │                                             │                   │
│  │  LOOP (max 3 iterations):                   │                   │
│  │    fetch 100 issues from GitHub GraphQL     │                   │
│  │    filterByRepoQuality(items, filters)      │                   │
│  │    accumulate valid items                   │                   │
│  │    advance cursor if hasNextPage            │                   │
│  │    break if enough items OR !hasNextPage    │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│  4. Return { items[], total_count, endCursor, rate_limit }          │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   TanStack Query Cache (Browser)                    │
│                                                                     │
│  Cache key: [applied, currentPage, cursor, sort, order]             │
│  staleTime: 15 minutes                                              │
│  keepPreviousData: true (no flash on page change)                   │
│                                                                     │
│  Client-side transforms:                                            │
│    sort/order applied to items[]                                    │
│    hideLinkedPRs filter applied                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Design

### `POST /api/github/search`

**Why POST instead of GET?**  
The filter payload can exceed GET URL length limits when multiple labels and languages are combined. POST also prevents filter state from leaking into browser history and server access logs.

**Request body (all fields optional with defaults):**

```typescript
{
  text?: string;           // Free-text keyword appended to query
  labels?: string[];       // Default: ["good first issue", "help wanted"]
  languages?: string[];    // Default: [] (all languages)
  zeroComments?: boolean;  // Default: false
  noAssignee?: boolean;    // Default: true
  issueAgeDays?: number;   // Default: 30 (days)
  minStars?: number;       // Default: 100
  maxStars?: number | null;// Default: null (no upper limit)
  minForks?: number;       // Default: 50
  maxForks?: number | null;// Default: null
  repoPushedDays?: number; // Default: 90 (repo must have pushed within 90 days)
  hasContributing?: boolean; // Default: false
  org?: string;            // Default: "" (all orgs)
  onlyOrgs?: boolean;      // Default: false
  perPage?: number;        // Default: 20 (10 for guests)
  cursor?: string | null;  // GraphQL pagination cursor
  sort?: string;           // "created" | "updated" | "comments"
  order?: string;          // "asc" | "desc"
}
```

**Response:**

```typescript
{
  items: IssueItem[];
  total_count: number;      // Raw count before local quality filtering
  filtered_out: number;     // How many items were removed by quality filter
  hasMore: boolean;
  endCursor: string | null;
  warnings: string[];       // Non-fatal issues (e.g. query truncated, filters capped)
  rate_limit: {
    limit: number | null;
    remaining: number | null;
    reset: number | null;
  } | null;
}
```

---

## GitHub API Integration

### Why GraphQL over REST?

| Concern | REST | GraphQL |
|---|---|---|
| Fields returned | Fixed, over-fetches | Precise, only what you declare |
| PR detection | Requires N+1 requests | Single query via `timelineItems` |
| Repository metadata | Separate endpoint | Inline via `... on Issue { repository { } }` |
| Rate limit cost | 1 per request | Weighted by complexity |

The key advantage is **co-located data**: a single GraphQL request returns the issue, its labels, its repository's star/fork count, its `CONTRIBUTING.md` presence, and its linked PR status — all in one network roundtrip.

### GraphQL Rate Limiting

GitHub's GraphQL API uses a **points-based** rate limit (5,000 points/hour for authenticated users). Each query costs points based on its complexity. GitTrek optimizes this by:

1. **Limiting `timelineItems` to `first: 5`** — was previously 25; each node costs rate limit points
2. **Fetching 100 issues per batch** — reduces total API calls for a given user session
3. **Reading `rateLimit.remaining` and `rateLimit.resetAt`** from every response
4. **Surfacing this to the user** via the header progress bar

For unauthenticated users, the REST API is used with no token. This gets 60 requests/hour (per IP) and returns far less data.

---

## OAuth 2.0 Security Design

```
                    State param (CSRF token)
User Browser ──────────────────────────────────────► GitHub OAuth
     │                                                     │
     │          Authorization Code (one-time)              │
     │◄────────────────────────────────────────────────────┘
     │
     │  code + state sent to /api/auth/callback
     ▼
Route Handler ──────────────────────────────────────► GitHub Token Endpoint
     │          access_token (never leaves server)         │
     │◄────────────────────────────────────────────────────┘
     │
     │  Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax
     ▼
Browser stores cookie
```

**Security properties:**
- The `access_token` is stored in an `HttpOnly` cookie — JavaScript cannot read it, preventing XSS theft
- A random `state` parameter is generated per login attempt and verified on callback — prevents CSRF
- `SameSite=Lax` prevents cross-origin cookie submission
- `Secure` flag ensures cookie is only sent over HTTPS in production

---

## Pagination System Design

### The Cursor Problem

GitHub's GraphQL search API uses **opaque cursors** for pagination — think of them as bookmarks pointing to specific positions in the result set. You cannot derive the cursor for page 5 without fetching pages 1–4 first.

```
Page 1: cursor = null          → returns items 1-20, endCursor = "abc123"
Page 2: cursor = "abc123"      → returns items 21-40, endCursor = "def456"
Page 3: cursor = "def456"      → returns items 41-60, endCursor = "ghi789"
         ↑                                                     ↑
         stored in cursorHistory[1]                stored in cursorHistory[2]
```

### GitTrek's Solution

```typescript
const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
```

Every time the user successfully navigates to a new page, the `endCursor` from that response is stored at the next index. The pagination component calculates `maxAllowedPage = cursorHistory.length` and grays out any page beyond that boundary.

Going **backwards** is always safe — the cursor for any past page is already stored.  
Going **forward** requires fetching the current page first to obtain its `endCursor`.

### New Search = Cursor Reset

Every time `handleSubmit` fires (new filter applied), `cursorHistory` is strictly reset to `[null]`. This prevents the cursor from a previous search being accidentally applied to a different search's results, which would produce silent data corruption.

---

## Client-Side Sorting Design

Sorting is **not sent to the GitHub API** (except for `created`/`updated`/`comments` which the REST API supports for ordering). Instead, the entire result set returned from the server is sorted in memory on the client.

**Why?**
- GitHub's issue search API does not support `sort:stars`
- Sorting client-side is instant (no network roundtrip)
- It doesn't consume any API rate limit
- The user gets immediate visual feedback

**Trade-off:** Client-side sorting only applies to the current page's results. "Most stars across all 1,700 matching issues" is not possible — you're getting "most stars on this page." This is an acceptable trade-off given GitHub API limitations.

---

## Error Handling Strategy

| Error | Behavior |
|---|---|
| `401 Unauthorized` | Returns empty results; user appears as guest |
| `403 / 429 Rate Limited` | Returns `429` to client; UI shows rate limit warning |
| GraphQL errors array | Throws first error message; caught by TanStack Query |
| Zod validation failure | Returns `400` with error message |
| Empty query string | Short-circuits and returns `total_count: 0` |
| Query too long | Truncates to 240 chars, adds warning to response |

Errors from the API surface in two ways:
1. **TanStack Query `error` state** — for failed requests
2. **`warnings[]` in successful responses** — for non-fatal degradations (query truncated, filter capped)

---

## Scalability Considerations

GitTrek is a **personal dashboard tool** — it makes GitHub API calls on behalf of individual authenticated users. This shapes several design decisions:

**Rate limits are per-user**, not per-server. Each user's session token has its own 5,000 point GraphQL quota. There's no shared backend state to protect.

**No caching layer needed** at the server level. TanStack Query handles client-side caching with a 15-minute stale time. The same query (same filters, same page, same cursor) won't re-hit the GitHub API within that window.

**No database.** All filter state is ephemeral. Persisting saved searches or bookmarks would require adding a persistence layer (e.g., SQLite via Prisma, or a lightweight key-value store), but this is deferred to the Badge Tracker feature roadmap.

**Horizontal scale is trivial** if hosted on Vercel/edge — each request is stateless. The only shared resource is the GitHub API rate limit, which belongs to the user, not the server.
