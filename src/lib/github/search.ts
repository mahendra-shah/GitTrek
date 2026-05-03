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
  const tokens: string[] = ["is:issue", "is:open", "archived:false"];
  const warnings: string[] = [];
  const state = { orCount: 0, warnings };

  if (filters.noAssignee) {
    tokens.push("no:assignee");
  }

  if (filters.org) {
    tokens.push(`org:${filters.org}`);
  }

  // Zero comments toggle
  if (filters.zeroComments) {
    tokens.push("comments:0");
  }

  if (filters.issueAgeDays) {
    tokens.push(`created:>=${dateDaysAgo(filters.issueAgeDays)}`);
  }

  const labels = normalizeList(filters.labels);
  if (labels.length === 1) {
    tokens.push(`label:"${labels[0]}"`);
  } else if (labels.length > 1) {
    const parts = labels.map((label) => `label:"${label}"`);
    pushOrGroup(tokens, parts, "label", state);
  }

  const languages = normalizeList(filters.languages);
  if (languages.length === 1) {
    tokens.push(`language:${languages[0]}`);
  } else if (languages.length > 1) {
    const parts = languages.map((lang) => `language:${lang}`);
    pushOrGroup(tokens, parts, "language", state);
  }

  const text = filters.text?.trim();
  if (text) {
    tokens.push(text);
  }

  let query = tokens.join(" ");
  if (query.length > MAX_QUERY_LEN) {
    warnings.push("Search query trimmed to fit API limits.");
    query = query.slice(0, MAX_QUERY_LEN);
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
