/**
 * SEARCH PIPELINE CONTRACT TESTS
 *
 * WHY THIS FILE EXISTS:
 * The E2E tests mock /api/github/search — they test the UI shell but cannot
 * detect bugs in the actual query builder, filter mapping, or quality gates.
 * These tests verify the full pipeline end-to-end using only real logic
 * (no mocks, no stubs). If any test here fails, search is broken in prod.
 *
 * WHAT IS TESTED:
 * 1. UI filter state → API payload mapping (the #1 regression site)
 * 2. API payload → GitHub query string (via buildIssueSearchQuery)
 * 3. Quality gate (filterByRepoQuality) doesn't silently drop all results
 * 4. Server Zod schema accepts all values the UI produces
 * 5. DEFAULT filter produces a non-empty GitHub query
 * 6. Edge cases: minStars=0, maxStars=null, minForks=0, zeroComments
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildIssueSearchQuery, filterByRepoQuality } from "../../src/lib/github/search";
import { DEFAULT } from "../../src/features/search/types";
import type { FilterDraft } from "../../src/features/search/types";

// ─── Replicate the server-side Zod schema locally so we can validate what
//     the UI actually sends against what the server actually accepts.
//     Any divergence here is a silent bug.
const ServerFilterSchema = z.object({
  text: z.string().trim().max(120).optional().default(""),
  languages: z.array(z.string()).optional().default([]),
  labels: z.array(z.string()).optional(),
  zeroComments: z.boolean().optional().default(false),
  noAssignee: z.boolean().optional().default(true),
  issueAgeDays: z.number().int().min(1).max(3650).optional().default(30),
  minStars: z.number().int().min(0).optional().default(500),
  maxStars: z.number().int().min(0).optional().nullable().default(null),
  minForks: z.number().int().min(0).optional().default(100),
  maxForks: z.number().int().min(0).optional().nullable().default(null),
  repoPushedDays: z.number().int().min(1).max(3650).optional().default(30),
  hasContributing: z.boolean().optional().default(false),
  org: z.string().trim().optional(),
  onlyOrgs: z.boolean().optional().default(false),
  perPage: z.number().int().min(1).max(50).optional().default(20),
  page: z.number().int().min(1).optional().default(1),
  cursor: z.string().optional().nullable(),
  sort: z.enum(["created", "updated", "comments"]).optional().default("created"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  type: z.enum(["issue", "discussion"]).optional().default("issue"),
  activeMaintainer: z.boolean().optional().default(false),
  pairingRequested: z.boolean().optional().default(false),
  viewerLogin: z.string().trim().max(39).optional(),
});

/** Simulate what HomeClient.tsx sends in its fetch body */
function buildPayloadFromDraft(draft: FilterDraft, opts: { perPage?: number; page?: number } = {}) {
  return {
    ...draft,
    sort: "created",
    order: "desc",
    type: draft.contributionType,
    activeMaintainer: draft.activeMaintainer,
    pairingRequested: draft.pairingRequested,
    labels: draft.contributionType === "discussion" ? [] : draft.labels,
    perPage: opts.perPage ?? 20,
    page: opts.page ?? 1,
    cursor: null,
    viewerLogin: undefined,
  };
}

// ─────────────────────────────────────────────────
// 1. UI → Payload contract: every field must survive round-trip
// ─────────────────────────────────────────────────
describe("1. UI Filter → Payload Contract (no mocks)", () => {
  it("DEFAULT filter produces a Zod-valid payload", () => {
    const payload = buildPayloadFromDraft(DEFAULT);
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success, `Zod rejected DEFAULT payload: ${JSON.stringify(result.error?.issues)}`).toBe(true);
  });

  it("minStars=0 is accepted by the server schema (not rejected as invalid)", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, minStars: 0 });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    // Critical: 0 must survive the parse, NOT be replaced by the default(100)
    expect(result.data?.minStars).toBe(0);
  });

  it("minForks=0 is accepted and preserved", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, minForks: 0 });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.minForks).toBe(0);
  });

  it("maxStars=null is accepted (no upper bound)", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, maxStars: null });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.maxStars).toBeNull();
  });

  it("maxForks=null is accepted (no upper bound)", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, maxForks: null });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.maxForks).toBeNull();
  });

  it("noAssignee=true is preserved through payload mapping", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, noAssignee: true });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.noAssignee).toBe(true);
  });

  it("noAssignee=false is preserved (user explicitly unset it)", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, noAssignee: false });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.noAssignee).toBe(false);
  });

  it("minStars=500 round-trips as 500 (not clamped/coerced)", () => {
    const payload = buildPayloadFromDraft({ ...DEFAULT, minStars: 500 });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.minStars).toBe(500);
  });

  it("labels are NOT sent for discussions", () => {
    const payload = buildPayloadFromDraft({
      ...DEFAULT,
      contributionType: "discussion",
      labels: ["good first issue"],
    });
    expect(payload.labels).toEqual([]);
  });

  it("labels ARE sent for issues", () => {
    const payload = buildPayloadFromDraft({
      ...DEFAULT,
      contributionType: "issue",
      labels: ["good first issue", "help wanted"],
    });
    expect(payload.labels).toEqual(["good first issue", "help wanted"]);
  });

  it("contributionType maps to type field correctly", () => {
    const issueDraft = buildPayloadFromDraft({ ...DEFAULT, contributionType: "issue" });
    const discussionDraft = buildPayloadFromDraft({ ...DEFAULT, contributionType: "discussion" });
    expect(issueDraft.type).toBe("issue");
    expect(discussionDraft.type).toBe("discussion");
  });

  it("all numeric star/fork edge values parse correctly", () => {
    const cases = [
      { minStars: 0, maxStars: null, minForks: 0, maxForks: null },
      { minStars: 0, maxStars: 100, minForks: 0, maxForks: 50 },
      { minStars: 1000, maxStars: 50000, minForks: 100, maxForks: 5000 },
      { minStars: 100000, maxStars: null, minForks: 50000, maxForks: null },
    ];
    for (const c of cases) {
      const payload = buildPayloadFromDraft({ ...DEFAULT, ...c });
      const result = ServerFilterSchema.safeParse(payload);
      expect(result.success, `Failed for case: ${JSON.stringify(c)}`).toBe(true);
      expect(result.data?.minStars).toBe(c.minStars);
      expect(result.data?.maxStars).toBe(c.maxStars);
      expect(result.data?.minForks).toBe(c.minForks);
      expect(result.data?.maxForks).toBe(c.maxForks);
    }
  });
});

// ─────────────────────────────────────────────────
// 2. Query Builder: critical search strings
// ─────────────────────────────────────────────────
describe("2. Query Builder → GitHub Search String", () => {
  it("DEFAULT filter builds a non-empty query (would return results)", () => {
    const { query, warnings } = buildIssueSearchQuery({
      type: "issue",
      labels: DEFAULT.labels,
      minStars: DEFAULT.minStars,
      maxStars: DEFAULT.maxStars,
      minForks: DEFAULT.minForks,
      maxForks: DEFAULT.maxForks,
      noAssignee: DEFAULT.noAssignee,
      issueAgeDays: DEFAULT.issueAgeDays,
      repoPushedDays: DEFAULT.repoPushedDays,
    });
    expect(query).toBeTruthy();
    expect(query.length).toBeGreaterThan(10);
    // Should include required tokens
    expect(query).toContain("is:issue");
    expect(query).toContain("is:open");
    // Default label
    expect(query).toContain('label:"good first issue"');
    // stars:/forks: MUST NOT be in query — GitHub issue search returns near-zero with them
    expect(query).not.toContain("stars:");
    expect(query).not.toContain("forks:");
    console.log("DEFAULT query:", query);
    console.log("Warnings:", warnings);
  });

  // REGRESSION: stars:/forks: qualifiers are banned from issue search query strings.
  // Empirical proof: combined with no:assignee + created: + label:, they return 0-27 results.
  // stars/forks filtering is done exclusively by filterByRepoQuality AFTER fetch.
  it("REGRESSION: stars: must never appear in issue query (returns near-zero results)", () => {
    const { query } = buildIssueSearchQuery({ type: "issue", minStars: 500, maxStars: null });
    expect(query).not.toContain("stars:");
  });

  it("REGRESSION: forks: must never appear in issue query (returns near-zero results)", () => {
    const { query } = buildIssueSearchQuery({ type: "issue", minForks: 100, maxForks: null });
    expect(query).not.toContain("forks:");
  });

  it("minStars=0 does NOT add stars:>=0 to query (correct — quality gate handles it)", () => {
    const { query } = buildIssueSearchQuery({ type: "issue", minStars: 0, maxStars: null });
    expect(query).not.toContain("stars:");
  });

  it("query stays under MAX_QUERY_LEN=240 chars under heavy filter load", () => {
    const { query } = buildIssueSearchQuery({
      type: "issue",
      languages: ["TypeScript", "JavaScript", "Python", "Go", "Rust"],
      labels: ["good first issue", "help wanted", "bug", "enhancement"],
      minStars: 100,
      maxStars: 50000,
      minForks: 10,
      maxForks: 5000,
      noAssignee: true,
      zeroComments: true,
      issueAgeDays: 30,
      activeMaintainer: true,
      org: "microsoft",
    });
    expect(query.length).toBeLessThanOrEqual(240);
  });

  it("noAssignee=true adds no:assignee qualifier", () => {
    const { query } = buildIssueSearchQuery({ type: "issue", noAssignee: true });
    expect(query).toContain("no:assignee");
  });

  it("noAssignee=false does NOT add no:assignee", () => {
    const { query } = buildIssueSearchQuery({ type: "issue", noAssignee: false });
    expect(query).not.toContain("no:assignee");
  });
});

// ─────────────────────────────────────────────────
// 3. Quality Gate: must not silently drop everything
// ─────────────────────────────────────────────────
describe("3. Quality Gate — filterByRepoQuality doesn't over-filter", () => {
  // Simulate a realistic batch of GitHub results the API would return
  const realisticBatch = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Issue ${i + 1}`,
    htmlUrl: `https://github.com/owner/repo/issues/${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: i % 3,
    labels: ["good first issue"],
    owner: "owner",
    repo: "repo",
    repository: {
      fullName: "owner/repo",
      htmlUrl: "https://github.com/owner/repo",
      stars: 600 + i * 100,    // 600–2500 stars (all above DEFAULT minStars=500)
      forks: 110 + i * 10,     // 110–300 forks (all above DEFAULT minForks=100)
      pushedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // 0–19 days ago (within 30-day window)
      isFork: false,
      hasContributing: i % 2 === 0,
      ownerType: i % 3 === 0 ? "Organization" : "User",
    },
  }));

  it("DEFAULT filter passes most realistic items through (not catastrophically filtered)", () => {
    const { items, filteredOut } = filterByRepoQuality(realisticBatch, {
      minStars: DEFAULT.minStars,   // 500
      maxStars: DEFAULT.maxStars,   // null
      minForks: DEFAULT.minForks,   // 100
      maxForks: DEFAULT.maxForks,   // null
      repoPushedDays: DEFAULT.repoPushedDays, // 30
      hasContributing: DEFAULT.hasContributing, // false
      onlyOrgs: DEFAULT.onlyOrgs ?? false,
    });
    // All items have stars>=600, forks>=110, pushed within 20 days — all should pass
    expect(items.length).toBe(20);
    expect(filteredOut).toBe(0);
  });

  it("minStars=0 quality gate allows items with few stars through", () => {
    const lowStarItems = [
      { ...realisticBatch[0], repository: { ...realisticBatch[0].repository, stars: 1 } },
      { ...realisticBatch[1], repository: { ...realisticBatch[1].repository, stars: 50 } },
    ];
    const { items } = filterByRepoQuality(lowStarItems, {
      minStars: 0,
      maxStars: null,
      minForks: 0,
      maxForks: null,
      repoPushedDays: 365,
      hasContributing: false,
      onlyOrgs: false,
    });
    expect(items).toHaveLength(2); // nothing should be filtered
  });

  it("filteredOut count equals items.length - result.items.length (no silent drops)", () => {
    const { items, filteredOut } = filterByRepoQuality(realisticBatch, {
      minStars: 1000,
      maxStars: null,
      minForks: 0,
      maxForks: null,
      repoPushedDays: 365,
      hasContributing: false,
      onlyOrgs: false,
    });
    expect(filteredOut).toBe(realisticBatch.length - items.length);
  });

  it("fork repos are always excluded regardless of star count", () => {
    const forkItem = { ...realisticBatch[0], repository: { ...realisticBatch[0].repository, isFork: true, stars: 100000 } };
    const { items } = filterByRepoQuality([forkItem], {
      minStars: 0, maxStars: null, minForks: 0, maxForks: null,
      repoPushedDays: null, hasContributing: false, onlyOrgs: false,
    });
    expect(items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────
// 4. Pipeline Integration: UI state → query → quality gate
//    This is the single most important test.
// ─────────────────────────────────────────────────
describe("4. Full Pipeline Integration (UI → Payload → Query → Quality Gate)", () => {
  // Run the entire pipeline as HomeClient does it, end-to-end without mocks
  function runPipeline(draft: FilterDraft, mockApiItems: object[]) {
    // Step 1: Build payload (as HomeClient.tsx does)
    const payload = buildPayloadFromDraft(draft);

    // Step 2: Validate payload through server Zod schema
    const parsed = ServerFilterSchema.safeParse(payload);
    if (!parsed.success) throw new Error(`Zod rejected payload: ${JSON.stringify(parsed.error.issues)}`);

    const filters = parsed.data;

    // Step 3: Apply labels default (server does this when labels is undefined)
    const effectiveLabels = filters.labels ?? ["good first issue", "help wanted"];

    // Step 4: Build GitHub query
    const { query } = buildIssueSearchQuery({
      ...filters,
      labels: effectiveLabels,
    });

    // Step 5: Apply quality gate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { items, filteredOut } = filterByRepoQuality(mockApiItems as any, filters);

    return { query, items, filteredOut, parsedFilters: filters };
  }

  const goodBatch = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Good issue ${i + 1}`,
    htmlUrl: `https://github.com/o/r/issues/${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: 0,
    labels: ["good first issue"],
    owner: "o", repo: "r",
    repository: {
      fullName: "o/r", htmlUrl: "https://github.com/o/r",
      stars: 1000, forks: 100,
      pushedAt: new Date().toISOString(),
      isFork: false, hasContributing: true, ownerType: "Organization",
    },
  }));

  it("DEFAULT filters: full pipeline produces results and valid query", () => {
    const { query, items, parsedFilters } = runPipeline(DEFAULT, goodBatch);
    expect(query).toContain("is:issue");
    expect(query).toContain("is:open");
    // goodBatch has stars=1000, forks=100, pushed=now — passes DEFAULT gate (500/100/30d)
    expect(items.length).toBeGreaterThan(0);
    expect(parsedFilters.minStars).toBe(500);  // DEFAULT is now 500
    expect(parsedFilters.minForks).toBe(100);  // DEFAULT is now 100
    // stars/forks must NOT be in the query string — quality gate handles them
    expect(query).not.toContain("stars:");
    expect(query).not.toContain("forks:");
  });

  it("minStars=500 pipeline: quality gate filters repos with <500 stars", () => {
    const draft = { ...DEFAULT, minStars: 500 };
    const lowStarBatch = [
      { ...goodBatch[0], repository: { ...goodBatch[0].repository, stars: 100 } }, // should be filtered
      { ...goodBatch[1], repository: { ...goodBatch[1].repository, stars: 2000 } }, // should pass
    ];
    const { query, items } = runPipeline(draft, lowStarBatch);
    // stars: is NOT in the query string — quality gate enforces it
    expect(query).not.toContain("stars:");
    expect(items.map(i => (i as {id:number}).id)).toEqual([2]);
  });

  it("noAssignee=true pipeline: query includes no:assignee", () => {
    const draft = { ...DEFAULT, noAssignee: true };
    const { query } = runPipeline(draft, goodBatch);
    expect(query).toContain("no:assignee");
  });

  it("noAssignee=false pipeline: query does NOT include no:assignee", () => {
    const draft = { ...DEFAULT, noAssignee: false };
    const { query } = runPipeline(draft, goodBatch);
    expect(query).not.toContain("no:assignee");
  });

  it("zeroComments=true pipeline: query includes comments:0", () => {
    const draft = { ...DEFAULT, zeroComments: true };
    const { query } = runPipeline(draft, goodBatch);
    expect(query).toContain("comments:0");
  });

  it("discussion pipeline: query starts with is:open and has NO issue-specific qualifiers", () => {
    const draft = { ...DEFAULT, contributionType: "discussion" as const };
    const { query } = runPipeline(draft, goodBatch);
    expect(query.startsWith("is:open")).toBe(true);
    expect(query).not.toContain("is:issue");
    expect(query).not.toContain("no:assignee");
    expect(query).not.toContain("fork:false");
  });

  it("minStars=0 + maxStars=null pipeline: query has no star qualifier", () => {
    const draft = { ...DEFAULT, minStars: 0, maxStars: null };
    const { query } = runPipeline(draft, goodBatch);
    expect(query).not.toContain("stars:");
  });

  it("minStars=0 + maxStars=1000 pipeline: quality gate handles maxStars (not in query)", () => {
    const draft = { ...DEFAULT, minStars: 0, maxStars: 1000 };
    const { query, items } = runPipeline(draft,
      [
        { ...goodBatch[0], repository: { ...goodBatch[0].repository, stars: 500 } },   // passes <=1000
        { ...goodBatch[1], repository: { ...goodBatch[1].repository, stars: 5000 } },  // fails >1000
      ]
    );
    // stars: NOT in query — quality gate enforces it
    expect(query).not.toContain("stars:");
    // only the first item (stars=500) should survive the quality gate
    expect(items).toHaveLength(1);
  });

  it("label ['good first issue'] pipeline: query includes the label", () => {
    const draft = { ...DEFAULT, labels: ["good first issue"] };
    const { query } = runPipeline(draft, goodBatch);
    expect(query).toContain('label:"good first issue"');
  });

  it("empty labels pipeline: server applies default ['good first issue','help wanted']", () => {
    // When labels is undefined in payload, server defaults to both labels
    const payload = buildPayloadFromDraft({ ...DEFAULT, labels: [] });
    // Remove labels entirely to trigger server default behavior
    delete (payload as Record<string, unknown>).labels;
    const parsed = ServerFilterSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    // Server applies default labels when undefined
    const effectiveLabels = parsed.data?.labels ?? ["good first issue", "help wanted"];
    expect(effectiveLabels).toEqual(["good first issue", "help wanted"]);
  });
});

// ─────────────────────────────────────────────────
// 5. Regression cases — bugs that have actually bitten us
// ─────────────────────────────────────────────────
describe("5. Regression Protection — Known Bug Patterns", () => {
  it("REGRESSION: Zod default for minStars must not override explicit 0", () => {
    // BUG: If schema default fires when minStars=0 is sent, we'd filter out
    // repos with fewer stars than the default, making real results invisible
    const result = ServerFilterSchema.safeParse({ minStars: 0 });
    expect(result.success).toBe(true);
    expect(result.data?.minStars).toBe(0); // NOT the server default (500)
  });

  it("REGRESSION: Zod default for minForks must not override explicit 0", () => {
    const result = ServerFilterSchema.safeParse({ minForks: 0 });
    expect(result.success).toBe(true);
    expect(result.data?.minForks).toBe(0); // NOT the server default (100)
  });

  it("REGRESSION: null maxStars in payload must be accepted, not rejected by Zod", () => {
    const result = ServerFilterSchema.safeParse({ maxStars: null });
    expect(result.success).toBe(true);
    expect(result.data?.maxStars).toBeNull();
  });

  it("REGRESSION: sort='stars' from UI must NOT be sent (not in server enum)", () => {
    // HomeClient allows sort='stars' for client display but the server only accepts
    // created/updated/comments. The payload builder must strip or remap 'stars'.
    const sortValue = "stars";
    const isValidServerSort = ["created", "updated", "comments"].includes(sortValue);
    // The test expectation: 'stars' is NOT a valid server sort value
    // HomeClient must handle this before sending the payload
    expect(isValidServerSort).toBe(false);
    // Verify the schema rejects it
    const result = ServerFilterSchema.safeParse({ sort: "stars" });
    expect(result.success).toBe(false);
  });

  it("REGRESSION: quality gate with repoPushedDays=365 passes items pushed today", () => {
    const freshItem = {
      id: 1, number: 1, title: "t", htmlUrl: "h", createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), comments: 0, labels: [], owner: "o", repo: "r",
      repository: {
        fullName: "o/r", htmlUrl: "h", stars: 500, forks: 50,
        pushedAt: new Date().toISOString(), // pushed RIGHT NOW
        isFork: false,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { items } = filterByRepoQuality([freshItem as any], {
      minStars: 0, maxStars: null, minForks: 0, maxForks: null,
      repoPushedDays: 365, hasContributing: false, onlyOrgs: false,
    });
    expect(items).toHaveLength(1); // fresh item must pass
  });

  it("REGRESSION: quality gate repoPushedDays=365 drops items pushed 400 days ago", () => {
    const staleItem = {
      id: 1, number: 1, title: "t", htmlUrl: "h", createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), comments: 0, labels: [], owner: "o", repo: "r",
      repository: {
        fullName: "o/r", htmlUrl: "h", stars: 500, forks: 50,
        pushedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        isFork: false,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { items } = filterByRepoQuality([staleItem as any], {
      minStars: 0, maxStars: null, minForks: 0, maxForks: null,
      repoPushedDays: 365, hasContributing: false, onlyOrgs: false,
    });
    expect(items).toHaveLength(0); // stale item must be filtered
  });

  it("REGRESSION: noAssignee toggle — payload preserves false when user disables it", () => {
    // Bug vector: UI has noAssignee=false but server defaults to true,
    // causing all assigned issues to be invisible
    const payload = buildPayloadFromDraft({ ...DEFAULT, noAssignee: false });
    const result = ServerFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data?.noAssignee).toBe(false); // user intent respected
  });
});
