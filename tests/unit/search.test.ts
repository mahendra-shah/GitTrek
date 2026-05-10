import { describe, it, expect } from "vitest";
import {
  buildIssueSearchQuery,
  filterByRepoQuality,
  type IssueSearchItem,
} from "../../src/lib/github/search";

describe('buildIssueSearchQuery', () => {
  const defaultFilters = {
    text: '',
    languages: [],
    labels: [],
    zeroComments: false,
    noAssignee: false,
    issueAgeDays: 30,
    minStars: null,
    maxStars: null,
    minForks: null,
    maxForks: null,
    repoPushedDays: null,
    hasContributing: false,
    org: '',
    onlyOrgs: false,
  };

  it('builds a basic query with default age', () => {
    const result = buildIssueSearchQuery(defaultFilters);
    expect(result.query).toContain('is:issue is:open archived:false');
    expect(result.query).toContain('created:>='); // dynamically generated based on current date
    // REGRESSION: fork:false breaks GitHub search (returns 0). Forks are excluded by default.
    expect(result.query).not.toContain('fork:false');
    // REGRESSION: sort:X-Y is invalid in GraphQL query string. Sort uses URL/GQL params.
    expect(result.query).not.toContain('sort:');
    expect(result.warnings).toHaveLength(0);
  });

  it('includes text search if provided', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, text: 'react performance' });
    expect(result.query).toContain('react performance');
  });

  it('adds zero comments flag', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, zeroComments: true });
    expect(result.query).toContain('comments:0');
  });

  it('adds no assignee flag', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, noAssignee: true });
    expect(result.query).toContain('no:assignee');
  });

  it('adds language filters properly', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, languages: ['TypeScript', 'Python'] });
    expect(result.query).toContain('(language:TypeScript OR language:Python)');
  });

  it('adds label filters properly with quotes', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, labels: ['good first issue', 'bug'] });
    expect(result.query).toContain('(label:"good first issue" OR label:"bug")');
  });

  it('adds organization filter', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, org: 'vercel' });
    expect(result.query).toContain('org:vercel');
  });

  it('warns if too many languages are selected and limits them', () => {
    const result = buildIssueSearchQuery({ 
      ...defaultFilters, 
      languages: ['1', '2', '3', '4', '5', '6', '7'] 
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Limited language filters');
    expect(result.query).toContain('language:1');
    expect(result.query).not.toContain('language:7');
  });

  it('warns if too many labels are selected and limits them', () => {
    const result = buildIssueSearchQuery({ 
      ...defaultFilters, 
      labels: ['1', '2', '3', '4', '5', '6', '7'] 
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Limited label filters');
    expect(result.query).toContain('label:"1"');
    expect(result.query).not.toContain('label:"7"');
  });

  it("activeMaintainer=true: query does NOT contain pushed:>= (GitHub issue search ignores it and returns 0)", () => {
    // IMPORTANT: pushed: in GitHub issue search combined with other qualifiers returns near-zero results.
    // activeMaintainer is enforced via the quality gate (repoPushedDays) NOT in the query string.
    const result = buildIssueSearchQuery({ ...defaultFilters, activeMaintainer: true });
    expect(result.query).not.toContain("pushed:>=");
  });

  it("adds pairing keyword filter", () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, pairingRequested: true });
    expect(result.query).toContain("pair with me");
    expect(result.query).toContain("in:comments");
  });

  it("REGRESSION #1: fork:false must never appear — it is an invalid qualifier returning 0 results", () => {
    const result = buildIssueSearchQuery(defaultFilters);
    expect(result.query).not.toContain('fork:false');
  });

  it("REGRESSION #2: sort:X-Y must never appear in query string (invalid in GraphQL search)", () => {
    const withSort = buildIssueSearchQuery({ ...defaultFilters, sort: 'created' as const, order: 'desc' as const });
    const withSort2 = buildIssueSearchQuery({ ...defaultFilters, sort: 'updated' as const, order: 'asc' as const });
    expect(withSort.query).not.toContain('sort:');
    expect(withSort2.query).not.toContain('sort:');
  });
});

describe("buildIssueSearchQuery (discussions)", () => {
  const discussionBase = {
    text: "",
    languages: [],
    labels: ["bug"],
    zeroComments: true,
    noAssignee: true,
    issueAgeDays: 30,
    minStars: null,
    maxStars: null,
    minForks: null,
    maxForks: null,
    repoPushedDays: null,
    hasContributing: false,
    org: "",
    onlyOrgs: false,
    type: "discussion" as const,
    activeMaintainer: true,
    pairingRequested: true,
  };

  it("uses discussion tokens and skips issue-only qualifiers", () => {
    const result = buildIssueSearchQuery(discussionBase);
    expect(result.query.startsWith("is:open")).toBe(true);
    expect(result.query).not.toContain("is:issue");
    expect(result.query).not.toContain("archived:false");
    expect(result.query).not.toContain("no:assignee");
    expect(result.query).not.toContain("created:>=");
    expect(result.query).not.toContain('label:"bug"');
    expect(result.query).not.toContain("pushed:>=");
    expect(result.query).not.toContain("pair with me");
    expect(result.query).toContain("comments:0");
  });
});

function item(
  opts: Omit<Partial<IssueSearchItem>, "repository"> & { repository?: Partial<IssueSearchItem["repository"]> }
): IssueSearchItem {
  const { repository: repoPartial, ...rest } = opts;
  const repository: IssueSearchItem["repository"] = {
    fullName: "o/r",
    htmlUrl: "https://github.com/o/r",
    stars: 100,
    forks: 50,
    pushedAt: new Date().toISOString(),
    isFork: false,
    ...repoPartial,
  };
  return {
    id: 1,
    number: 1,
    title: "t",
    htmlUrl: "https://github.com/o/r/issues/1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: 0,
    labels: [],
    owner: "o",
    repo: "r",
    ...rest,
    repository,
  };
}

describe("filterByRepoQuality", () => {
  const emptyFilters = {
    minStars: null,
    maxStars: null,
    minForks: null,
    maxForks: null,
    repoPushedDays: null,
    hasContributing: false,
    onlyOrgs: false,
  };

  it("drops forks", () => {
    const items = [item({ repository: { isFork: true } }), item({ id: 2 })];
    const { items: out, filteredOut } = filterByRepoQuality(items, emptyFilters);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(2);
    expect(filteredOut).toBe(1);
  });

  it("enforces star and fork bounds", () => {
    const items = [
      item({ id: 1, repository: { stars: 10, forks: 80 } }),
      item({ id: 2, repository: { stars: 100, forks: 80 } }),
      item({ id: 3, repository: { stars: 100, forks: 20 } }),
    ];
    const { items: out } = filterByRepoQuality(items, {
      ...emptyFilters,
      minStars: 50,
      maxStars: 150,
      minForks: 40,
      maxForks: 100,
    });
    expect(out.map((i) => i.id)).toEqual([2]);
  });

  it("requires CONTRIBUTING when hasContributing", () => {
    const items = [
      item({ id: 1, repository: { hasContributing: false } }),
      item({ id: 2, repository: { hasContributing: true } }),
    ];
    const { items: out } = filterByRepoQuality(items, {
      ...emptyFilters,
      hasContributing: true,
    });
    expect(out.map((i) => i.id)).toEqual([2]);
  });

  it("onlyOrgs keeps organization-owned repos", () => {
    const items = [
      item({ id: 1, repository: { ownerType: "User" } }),
      item({ id: 2, repository: { ownerType: "Organization" } }),
    ];
    const { items: out } = filterByRepoQuality(items, {
      ...emptyFilters,
      onlyOrgs: true,
    });
    expect(out.map((i) => i.id)).toEqual([2]);
  });

  it("repoPushedDays drops stale repos", () => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const items = [
      item({ id: 1, repository: { pushedAt: old } }),
      item({ id: 2 }),
    ];
    const { items: out } = filterByRepoQuality(items, {
      ...emptyFilters,
      repoPushedDays: 30,
    });
    expect(out.map((i) => i.id)).toEqual([2]);
  });
});
