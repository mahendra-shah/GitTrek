export type IssueSearchFilters = {
  text?: string;
  languages?: string[];
  labels?: string[];
  zeroComments?: boolean;
  noAssignee?: boolean;
  issueAgeDays?: number | null;
  minStars?: number | null;
  maxStars?: number | null;
  minForks?: number | null;
  maxForks?: number | null;
  repoPushedDays?: number | null;
  hasContributing?: boolean;
  org?: string;
  onlyOrgs?: boolean;
  perPage?: number;
  type?: "issue" | "discussion";
  activeMaintainer?: boolean;
  pairingRequested?: boolean;
  sort?: "created" | "updated" | "comments";
  order?: "asc" | "desc";
};

export type RepoQuality = {
  fullName: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  pushedAt: string;
  isFork: boolean;
  hasContributing?: boolean;
  ownerType?: "Organization" | "User" | string;
};

export type IssueSearchItem = {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  comments: number;
  labels: string[];
  owner: string;
  repo: string;
  repository: RepoQuality;
};

type QueryBuildResult = {
  query: string;
  warnings: string[];
};

const MAX_BOOLEAN_OPS = 5;
const MAX_QUERY_LEN = 240;

function normalizeList(values: string[] | undefined): string[] {
  if (!values) return [];
  return values.map((value) => value.trim()).filter(Boolean);
}

function dateDaysAgo(days: number): string {
  const now = new Date();
  const target = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, "0");
  const day = String(target.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pushOrGroup(
  tokens: string[],
  parts: string[],
  label: string,
  state: { orCount: number; warnings: string[] }
) {
  if (parts.length === 0) return;
  if (parts.length === 1) {
    tokens.push(parts[0]);
    return;
  }

  const needed = parts.length - 1;
  if (state.orCount + needed > MAX_BOOLEAN_OPS) {
    const allowed = Math.max(1, MAX_BOOLEAN_OPS - state.orCount + 1);
    parts = parts.slice(0, allowed);
    state.warnings.push(`Limited ${label} filters to ${parts.length}.`);
  }

  if (parts.length === 1) {
    tokens.push(parts[0]);
    return;
  }

  tokens.push(`(${parts.join(" OR ")})`);
  state.orCount += parts.length - 1;
}

export function buildIssueSearchQuery(filters: IssueSearchFilters): QueryBuildResult {
  const isDiscussion = filters.type === "discussion";
  const warnings: string[] = [];
  const state = { orCount: 0, warnings };

  // Required type tokens (always kept, never dropped)
  const requiredTokens: string[] = isDiscussion
    ? ["is:open"]
    : ["is:issue", "is:open", "archived:false"];

  // Optional tokens in priority order (highest first — these are dropped last if query is too long)
  const optionalTokens: string[] = [];

  // org: works for both issues and discussions
  if (filters.org) {
    optionalTokens.push(`org:${filters.org}`);
  }

  // NOTE: stars: and forks: are NOT added to GitHub issue search query strings.
  // Empirical testing shows these qualifiers return near-zero results (3–27 total)
  // when combined with other issue search qualifiers (no:assignee, created:, label:).
  // GitHub designed stars:/forks: for repository search, not issue search.
  // Stars/forks filtering is applied correctly by filterByRepoQuality AFTER fetch.

  // language: works for both
  const languages = normalizeList(filters.languages);
  if (languages.length === 1) {
    optionalTokens.push(`language:${languages[0]}`);
  } else if (languages.length > 1) {
    const parts = languages.map((lang) => `language:${lang}`);
    // Build the OR group inline so we can measure it as a single token
    const needed = parts.length - 1;
    if (state.orCount + needed > MAX_BOOLEAN_OPS) {
      const allowed = Math.max(1, MAX_BOOLEAN_OPS - state.orCount + 1);
      const truncated = parts.slice(0, allowed);
      state.warnings.push(`Limited language filters to ${truncated.length}.`);
      optionalTokens.push(truncated.length === 1 ? truncated[0] : `(${truncated.join(" OR ")})`);
      state.orCount += truncated.length - 1;
    } else {
      optionalTokens.push(`(${parts.join(" OR ")})`);
      state.orCount += needed;
    }
  }

  // Free-text search works for both
  const text = filters.text?.trim();
  if (text) {
    optionalTokens.push(text);
  }

  // NOTE: sort is NOT added to the query string.
  // REST API uses ?sort=&order= URL params (done in searchREST).
  // GraphQL search API does not support sort: in the query string — it ignores or breaks it.

  // Zero replies/comments — supported on both issue and discussion GitHub search
  if (filters.zeroComments) {
    optionalTokens.push("comments:0");
  }

  // Discussion search rejects these qualifiers — keep them issue-only.
  if (!isDiscussion) {
    if (filters.noAssignee) {
      optionalTokens.push("no:assignee");
    }

    if (filters.issueAgeDays) {
      optionalTokens.push(`created:>=${dateDaysAgo(filters.issueAgeDays)}`);
    }

    // NOTE: pushed: qualifier is NOT added to the GitHub query string.
    // Empirical testing shows pushed: combined with other qualifiers (created:, no:assignee, label:)
    // returns near-zero results — GitHub's issue search barely supports it.
    // Stale-repo filtering is done correctly by filterByRepoQuality via repoPushedDays.

    if (filters.pairingRequested) {
      optionalTokens.push(`("pair with me" OR "pairing" OR "pair") in:comments`);
    }

    const labels = normalizeList(filters.labels);
    if (labels.length === 1) {
      optionalTokens.push(`label:"${labels[0]}"`);
    } else if (labels.length > 1) {
      const parts = labels.map((label) => `label:"${label}"`);
      const needed = parts.length - 1;
      if (state.orCount + needed > MAX_BOOLEAN_OPS) {
        const allowed = Math.max(1, MAX_BOOLEAN_OPS - state.orCount + 1);
        const truncated = parts.slice(0, allowed);
        state.warnings.push(`Limited label filters to ${truncated.length}.`);
        optionalTokens.push(truncated.length === 1 ? truncated[0] : `(${truncated.join(" OR ")})`);
        state.orCount += truncated.length - 1;
      } else {
        optionalTokens.push(parts.length === 1 ? parts[0] : `(${parts.join(" OR ")})`);
        state.orCount += needed;
      }
    }
  }

  // Build query by fitting tokens within MAX_QUERY_LEN.
  // Required tokens are always included; optional tokens are dropped from the END
  // (lowest priority) if the query would exceed the limit.
  // This prevents hard-slicing mid-qualifier which silently produces malformed queries.
  const baseQuery = requiredTokens.join(" ");
  let query = baseQuery;
  const droppedLabels: string[] = [];

  for (const token of optionalTokens) {
    const candidate = query ? `${query} ${token}` : token;
    if (candidate.length <= MAX_QUERY_LEN) {
      query = candidate;
    } else {
      droppedLabels.push(token);
    }
  }

  if (droppedLabels.length > 0) {
    warnings.push(`Some filters were dropped to fit the GitHub query limit: ${droppedLabels.length} qualifier(s) removed.`);
  }

  return { query, warnings };
}


export function filterByRepoQuality(
  items: IssueSearchItem[],
  filters: IssueSearchFilters
): { items: IssueSearchItem[]; filteredOut: number } {
  const minStars = filters.minStars ?? null;
  const maxStars = filters.maxStars ?? null;
  const minForks = filters.minForks ?? null;
  const maxForks = filters.maxForks ?? null;
  const repoPushedDays = filters.repoPushedDays ?? null;

  const now = Date.now();
  const pushedCutoff = repoPushedDays
    ? now - repoPushedDays * 24 * 60 * 60 * 1000
    : null;

  const filtered = items.filter((item) => {
    const repo = item.repository;
    if (repo.isFork) return false;
    if (minStars !== null && repo.stars < minStars) return false;
    if (maxStars !== null && repo.stars > maxStars) return false;
    if (minForks !== null && repo.forks < minForks) return false;
    if (maxForks !== null && repo.forks > maxForks) return false;
    if (filters.hasContributing && !repo.hasContributing) return false;
    if (filters.onlyOrgs && repo.ownerType !== "Organization") return false;
    if (pushedCutoff !== null) {
      const pushedAt = new Date(repo.pushedAt).getTime();
      if (Number.isFinite(pushedAt) && pushedAt < pushedCutoff) return false;
    }
    return true;
  });

  return { items: filtered, filteredOut: items.length - filtered.length };
}
