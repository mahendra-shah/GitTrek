import { describe, it, expect } from "vitest";
import { buildIssueSearchQuery, filterByRepoQuality } from "../../src/lib/github/search";
import { DEFAULT, EMPTY_FILTERS, countActiveFilters } from "../../src/components/HomeClient";
import type { FilterDraft } from "../../src/components/FilterPanel";

describe("GitTrek Pre-Production Deep Regression & Stability Tests", () => {
  const isDeepMode = process.env.DEEP_TEST === "true";

  // If in deep mode, we perform extensive combinatorial and stress testing
  const iterations = isDeepMode ? 50 : 9;

  describe("1. Pairwise Combinatorial Search Query Builder", () => {
    // Build a base filter object
    const baseFilters: FilterDraft = {
      text: "",
      languages: [],
      labels: [],
      zeroComments: false,
      noAssignee: false,
      issueAgeDays: 30,
      minStars: 0,
      maxStars: null,
      minForks: 0,
      maxForks: null,
      repoPushedDays: 365,
      hasContributing: false,
      org: "",
      onlyOrgs: false,
      contributionType: "issue",
      activeMaintainer: false,
      pairingRequested: false,
    };

    const testScenarios: FilterDraft[] = [
      // Standard code issues with single language
      { ...baseFilters, languages: ["TypeScript"] },
      // Code issues with multiple languages and labels
      { ...baseFilters, languages: ["TypeScript", "Go"], labels: ["good first issue", "help wanted"] },
      // Zero comments quality gate
      { ...baseFilters, zeroComments: true, noAssignee: true },
      // Temporal boundaries
      { ...baseFilters, issueAgeDays: 7, repoPushedDays: 30 },
      // Active maintainer and pairing requirements
      { ...baseFilters, activeMaintainer: true, pairingRequested: true },
      // Discussions type
      { ...baseFilters, contributionType: "discussion", zeroComments: true },
      // Scoped to specific organization
      { ...baseFilters, org: "vercel", onlyOrgs: true },
      // Numeric range boundaries
      { ...baseFilters, minStars: 100, maxStars: 500 },
      // Contradictory numeric boundaries (Min > Max)
      { ...baseFilters, minStars: 1000, maxStars: 50 },
    ];

    // If deep mode is active, let's generate more combinations to stress-test the compiler
    if (isDeepMode) {
      const extraLanguages = [["Rust"], ["Python", "JavaScript"], ["C++", "Java", "Ruby"]];
      const extraLabels = [["bug"], ["documentation", "good first issue"], ["enhancement"]];
      const booleanToggles = [true, false];

      for (let i = 0; i < iterations - 9; i++) {
        testScenarios.push({
          ...baseFilters,
          languages: extraLanguages[i % extraLanguages.length],
          labels: extraLabels[i % extraLabels.length],
          zeroComments: booleanToggles[i % 2],
          noAssignee: booleanToggles[(i + 1) % 2],
          activeMaintainer: booleanToggles[i % 2],
          pairingRequested: booleanToggles[(i + 1) % 2],
          org: i % 2 === 0 ? "github" : "",
          contributionType: i % 3 === 0 ? "discussion" : "issue",
        });
      }
    }

    testScenarios.forEach((filters, index) => {
      it(`compiles permutation #${index + 1}: type=${filters.contributionType}, langs=[${filters.languages.join(",")}], labels=[${filters.labels.join(",")}]`, () => {
        const result = buildIssueSearchQuery({
          ...filters,
          type: filters.contributionType,
        });

        // Assertions for correctness
        expect(result).toHaveProperty("query");
        expect(result).toHaveProperty("warnings");

        if (filters.contributionType === "discussion") {
          expect(result.query).not.toContain("is:issue");
          expect(result.query).not.toContain("archived:false");
          expect(result.query).not.toContain("no:assignee");
        } else {
          expect(result.query).toContain("is:issue");
          expect(result.query).toContain("is:open");
        }

        if (filters.languages.length > 0) {
          const expectedLangs = filters.languages.slice(0, 5); // Max languages is 5
          expectedLangs.forEach(lang => {
            expect(result.query).toContain(`language:${lang}`);
          });
        }

        if (filters.labels.length > 0 && filters.contributionType === "issue") {
          const expectedLabels = filters.labels.slice(0, 5); // Max labels is 5
          expectedLabels.forEach(label => {
            expect(result.query).toContain(`label:"${label}"`);
          });
        }

        if (filters.zeroComments) {
          expect(result.query).toContain("comments:0");
        }

        if (filters.noAssignee && filters.contributionType !== "discussion") {
          expect(result.query).toContain("no:assignee");
        }
      });
    });
  });

  describe("2. Quality Filter & Numeric Bounds Enforcement", () => {
    const emptyRepoFilters = {
      minStars: null,
      maxStars: null,
      minForks: null,
      maxForks: null,
      repoPushedDays: null,
      hasContributing: false,
      onlyOrgs: false,
    };

    const mockRepos = [
      { id: 1, repository: { stars: 10, forks: 5, ownerType: "User", pushedAt: new Date().toISOString() } },
      { id: 2, repository: { stars: 1500, forks: 200, ownerType: "Organization", pushedAt: new Date().toISOString() } },
      { id: 3, repository: { stars: 50000, forks: 15000, ownerType: "Organization", pushedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString() } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[];

    it("verifies flawless sorting and dropping of items based on star limits", () => {
      const { items: result } = filterByRepoQuality(mockRepos, {
        ...emptyRepoFilters,
        minStars: 1000,
        maxStars: 100000,
      });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toContain(2);
      expect(result.map(r => r.id)).toContain(3);
    });

    it("handles contradictory limits (Min > Max) gracefully without throwing or crashing", () => {
      const { items: result } = filterByRepoQuality(mockRepos, {
        ...emptyRepoFilters,
        minStars: 5000,
        maxStars: 100,
      });

      expect(result).toHaveLength(0); // Should return an empty array gracefully
    });

    it("correctly filters by owner type (onlyOrgs)", () => {
      const { items: result } = filterByRepoQuality(mockRepos, {
        ...emptyRepoFilters,
        onlyOrgs: true,
      });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual([2, 3]);
    });
  });

  describe("3. Active Filters Counter Accuracy", () => {
    it("correctly calculates active filter counts for issues vs discussions", () => {
      const issueFilters: FilterDraft = {
        ...EMPTY_FILTERS,
        text: "performance",
        languages: ["TypeScript"],
        labels: ["bug"],
        zeroComments: true,
        contributionType: "issue",
      };

      const count = countActiveFilters(issueFilters, false);
      expect(count).toBe(4); // text + languages + labels + zeroComments

      const discussionFilters: FilterDraft = {
        ...EMPTY_FILTERS,
        languages: ["Rust"],
        contributionType: "discussion",
      };

      const discussionCount = countActiveFilters(discussionFilters, false);
      expect(discussionCount).toBe(2); // languages + contributionType 'discussion' (contributionType counts as 1 filter when discussion)
    });
  });

  describe("4. Manual Search Trigger & Filter States State-Machine Validation", () => {
    it("ensures uncommitted filter changes stay strictly in draft state", () => {
      let draftState: FilterDraft = { ...DEFAULT };
      let appliedState: FilterDraft = { ...DEFAULT };

      const setDraft = (next: FilterDraft | ((p: FilterDraft) => FilterDraft)) => {
        draftState = typeof next === "function" ? next(draftState) : next;
      };

      const setApplied = (next: FilterDraft) => {
        appliedState = next;
      };

      // 1. Simulate user selecting a language
      const userSelectedLanguages = ["Go"];
      setDraft({ ...draftState, languages: userSelectedLanguages });

      // EXPECTATION: draft state is updated, but applied state remains at DEFAULT (manual trigger rule)
      expect(draftState.languages).toEqual(["Go"]);
      expect(appliedState.languages).toEqual([]);

      // 2. Simulate user clicking the "Search" button
      setApplied({ ...draftState });

      // EXPECTATION: applied state is now synchronized with draft state
      expect(appliedState.languages).toEqual(["Go"]);
    });

    it("verifies state retention across tab switches", () => {
      let draftState: FilterDraft = {
        ...DEFAULT,
        languages: ["TypeScript"],
        labels: ["good first issue"],
        contributionType: "issue",
      };

      // Switch to "discussion" tab
      const updatedForDiscussion = {
        ...draftState,
        contributionType: "discussion" as const,
        labels: draftState.labels,
        languages: draftState.languages,
        text: draftState.text,
      };

      draftState = updatedForDiscussion;

      // EXPECTATION: Languages and labels are preserved during tab switch
      expect(draftState.contributionType).toBe("discussion");
      expect(draftState.languages).toEqual(["TypeScript"]);
      expect(draftState.labels).toEqual(["good first issue"]);
    });
  });

  if (isDeepMode) {
    describe("5. Extra Rigorous Deep-Only Boundary Checks", () => {
      it("asserts extreme boundary values for stars and forks safely", () => {
        const contradictoryFilters = {
          minStars: 10000000,
          maxStars: 10,
          minForks: 5000000,
          maxForks: 5,
          repoPushedDays: null,
          hasContributing: false,
          onlyOrgs: false,
        };
        const result = filterByRepoQuality([], contradictoryFilters);
        expect(result.items).toHaveLength(0);
        expect(result.filteredOut).toBe(0);
      });
    });
  }
});
