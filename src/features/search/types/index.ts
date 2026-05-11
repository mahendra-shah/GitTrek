export type FilterDraft = {
  text: string;
  languages: string[];
  labels: string[];
  zeroComments: boolean;
  issueAgeDays: number;
  minStars: number;
  maxStars: number | null;
  minForks: number;
  maxForks: number | null;
  repoPushedDays: number;
  noAssignee: boolean;
  hasContributing: boolean;
  org?: string;
  onlyOrgs?: boolean;
  contributionType: "issue" | "discussion";
  activeMaintainer: boolean;
  pairingRequested: boolean;
};

export const EMPTY_FILTERS: FilterDraft = {
  text: "",
  languages: [],
  labels: [],
  zeroComments: false,
  issueAgeDays: 30,
  minStars: 0,
  maxStars: null,
  minForks: 0,
  maxForks: null,
  repoPushedDays: 365,
  noAssignee: false,
  hasContributing: false,
  org: "",
  onlyOrgs: false,
  contributionType: "issue",
  activeMaintainer: false,
  pairingRequested: false,
};

export const DEFAULT: FilterDraft = {
  text: "",
  languages: [],
  labels: ["good first issue"],
  zeroComments: false,
  issueAgeDays: 30,
  minStars: 500,
  maxStars: null,
  minForks: 100,
  maxForks: null,
  repoPushedDays: 30,
  noAssignee: true,
  hasContributing: false,
  org: "",
  onlyOrgs: false,
  contributionType: "issue",
  activeMaintainer: false,
  pairingRequested: false,
};

export const COMMON_LABELS = [
  "good first issue","help wanted","bug","enhancement","documentation",
  "beginner friendly","easy","first-timers-only","up-for-grabs","hacktoberfest","feature request",
];
export const COMMON_LANGUAGES = [
  "JavaScript","TypeScript","Python","Go","Rust","Java","C++","C",
  "Ruby","PHP","Kotlin","Swift","C#","Shell","HTML","CSS","Vue","Dart",
  "Objective-C","Scala","Haskell","Lua","Perl","Elixir","Clojure"
];

export const STARS_MAX = 100_000;
export const FORKS_MAX = 50_000;

export function countActiveFilters(draft: FilterDraft, hideLinkedPRs: boolean): number {
  let count = 0;
  if (draft.text.trim()) count++;
  if (draft.languages.length) count++;
  if (draft.labels.length) count++;
  if (draft.zeroComments) count++;
  if (draft.issueAgeDays !== EMPTY_FILTERS.issueAgeDays) count++;
  if (draft.minStars !== EMPTY_FILTERS.minStars || draft.maxStars !== EMPTY_FILTERS.maxStars) count++;
  if (draft.minForks !== EMPTY_FILTERS.minForks || draft.maxForks !== EMPTY_FILTERS.maxForks) count++;
  if (draft.repoPushedDays !== EMPTY_FILTERS.repoPushedDays) count++;
  if (draft.noAssignee) count++;
  if (draft.hasContributing) count++;
  if (draft.org?.trim()) count++;
  if (draft.onlyOrgs) count++;
  if (draft.activeMaintainer && draft.contributionType === "issue") count++;
  if (draft.pairingRequested && draft.contributionType === "issue") count++;
  if (hideLinkedPRs) count++;
  if (draft.contributionType === "discussion") count++;
  return count;
}
