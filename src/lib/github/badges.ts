/**
 * Badge Calculation Engine — Pure, side-effect-free functions.
 *
 * All business logic for badge tiers lives here and nowhere else.
 * This makes it fully unit-testable without any React or API dependencies.
 */

// ── Tier Configuration ────────────────────────────────────────────────────────

export type Trackability = "high" | "medium" | "none";

export type BadgeKey =
  | "pullShark"
  | "starstruck"
  | "pairExtraordinaire"
  | "galaxyBrain"
  | "yolo"
  | "quickdraw"
  | "publicSponsor";

export type BadgeConfigEntry = {
  /** Sorted ascending list of thresholds per tier. */
  tiers: readonly number[];
  /** Confidence level of the calculation. */
  trackable: Trackability;
  /** Whether the count is an approximation. */
  estimated: boolean;
  /** Human-readable name. */
  label: string;
  /** Short emoji for the badge. */
  emoji: string;
  /** Actual GitHub badge image URL */
  image?: string;
  /** The specific action noun shown in the Focus coaching text, e.g. "merged PRs", "stars" */
  contributionNoun: string;
  /** Why this calculation might be inaccurate (shown in the "What breaks this?" section). */
  caveat: string;
};

export const BADGE_CONFIG: Record<BadgeKey, BadgeConfigEntry> = {
  pullShark: {
    tiers: [2, 16, 128, 1024],
    trackable: "high",
    estimated: false,
    label: "Pull Shark",
    emoji: "🦈",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/pull-shark-default.png",
    contributionNoun: "merged PRs",
    caveat: "Only counts public merged PRs. Private repository contributions are not visible to the API.",
  },
  starstruck: {
    tiers: [16, 128, 512, 4096],
    trackable: "high",
    estimated: false,
    label: "Starstruck",
    emoji: "🌟",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/starstruck-default.png",
    contributionNoun: "stars on your best repo",
    caveat: "Awarded per repository, not total stars. This tool checks your highest-starred public repo only. Private repo stars are not counted.",
  },
  pairExtraordinaire: {
    tiers: [1, 10, 24, 48],
    trackable: "medium",
    estimated: true,
    label: "Pair Extraordinaire",
    emoji: "👥",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/pair-extraordinaire-default.png",
    contributionNoun: "co-authored PRs",
    caveat: "Only counts PRs with 'Co-authored-by:' in the commit message. Alternative co-authoring formats may cause false negatives.",
  },
  galaxyBrain: {
    tiers: [1, 8, 16, 32],
    trackable: "high",
    estimated: false,
    label: "Galaxy Brain",
    emoji: "🧠",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/galaxy-brain-default.png",
    contributionNoun: "accepted answers",
    caveat: "Only counts accepted answers in public GitHub Discussions. Private repository discussions are not accessible.",
  },
  yolo: {
    tiers: [1],
    trackable: "medium",
    estimated: true,
    label: "YOLO",
    emoji: "🤞",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/yolo-default.png",
    contributionNoun: "no-review merges",
    caveat: "GitHub's exact criteria for 'merged without review' is not publicly documented. This is an estimate based on PRs with no review events.",
  },
  quickdraw: {
    tiers: [1],
    trackable: "none",
    estimated: false,
    label: "Quickdraw",
    emoji: "⚡",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/quickdraw-default.png",
    contributionNoun: "quick contributions",
    caveat: "Cannot be tracked via the GitHub API. Requires scanning timestamps of all PRs and issues, which exceeds practical API rate limits.",
  },
  publicSponsor: {
    tiers: [1],
    trackable: "high",
    estimated: false,
    label: "Public Sponsor",
    emoji: "💖",
    image: "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images/public-sponsor-default.png",
    contributionNoun: "public sponsorships",
    caveat: "Only detects public sponsorships. Private sponsorships are not visible.",
  },
} as const;

// Tier names by index (0 = not earned, 1-4 = tier levels)
export const TIER_LABELS = ["Not earned", "Bronze", "Silver", "Gold", "Platinum"] as const;
export type TierLabel = (typeof TIER_LABELS)[number];

// ── Loop pre-fill URLs ───────────────────────────────────────────────────────
export const LOOP_URLS: Partial<Record<BadgeKey, string>> = {
  pullShark: "/?labels=good+first+issue&noAssignee=true&zeroComments=true&hideLinkedPRs=true",
  galaxyBrain: "/?discussions=true&zeroComments=true",
  yolo: "/?labels=bug&noAssignee=true&hideLinkedPRs=true",
  starstruck: "/?minStars=1000",
};

// ── Core Calculation ──────────────────────────────────────────────────────────

export type TierResult = {
  /** 0 = not earned, 1-4 = tier achieved */
  tier: 0 | 1 | 2 | 3 | 4;
  tierLabel: TierLabel;
  current: number;
  /** The threshold for the NEXT tier, or null if already maxed. */
  nextThreshold: number | null;
  /** How many more needed to reach next tier. 0 if maxed. */
  needed: number;
  /** 0–100 percentage progress toward next tier. 100 if maxed. */
  percentToNext: number;
  isMaxed: boolean;
};

export function calculateTier(count: number, thresholds: readonly number[]): TierResult {
  const sorted = [...thresholds].sort((a, b) => a - b);

  // Find the highest tier achieved
  let tier: 0 | 1 | 2 | 3 | 4 = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (count >= sorted[i]) {
      tier = (i + 1) as 1 | 2 | 3 | 4;
    }
  }

  const isMaxed = tier === sorted.length;

  if (isMaxed) {
    return {
      tier,
      tierLabel: TIER_LABELS[tier],
      current: count,
      nextThreshold: null,
      needed: 0,
      percentToNext: 100,
      isMaxed: true,
    };
  }

  const nextThreshold = sorted[tier]; // sorted[tier] is the NEXT tier's threshold
  const prevThreshold = tier === 0 ? 0 : sorted[tier - 1];
  const rangeSize = nextThreshold - prevThreshold;
  const progress = count - prevThreshold;
  const percentToNext = rangeSize > 0 ? Math.min(100, Math.round((progress / rangeSize) * 100)) : 0;

  return {
    tier,
    tierLabel: TIER_LABELS[tier],
    current: count,
    nextThreshold,
    needed: Math.max(0, nextThreshold - count),
    percentToNext,
    isMaxed: false,
  };
}

// ── Badge Result (combines config + API data + calculation) ───────────────────

export type BadgeResult = {
  key: BadgeKey;
  config: BadgeConfigEntry;
  tierResult: TierResult;
};

// ── Focus Badge (coaching feature) ───────────────────────────────────────────

/**
 * Returns the badge the user is closest to leveling up, 
 * ignoring non-trackable and already-maxed badges.
 */
export function findFocusBadge(results: BadgeResult[]): BadgeResult | null {
  const candidates = results.filter(
    (r) => r.config.trackable !== "none" && !r.tierResult.isMaxed
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((best, current) =>
    current.tierResult.percentToNext > best.tierResult.percentToNext ? current : best
  );
}

// ── Shareable Card Data ───────────────────────────────────────────────────────

export type ShareableCardData = {
  username: string;
  avatarUrl: string;
  earnedBadges: Array<{
    key: BadgeKey;
    label: string;
    emoji: string;
    image?: string;
    tierLabel: TierLabel;
  }>;
  focusBadge: {
    label: string;
    emoji: string;
    image?: string;
    needed: number;
    nextTierLabel: TierLabel;
  } | null;
};

export function buildShareableCardData(
  username: string,
  avatarUrl: string,
  results: BadgeResult[]
): ShareableCardData {
  const earnedBadges = results
    .filter((r) => r.tierResult.tier > 0)
    .map((r) => ({
      key: r.key,
      label: r.config.label,
      emoji: r.config.emoji,
      image: r.config.image,
      tierLabel: r.tierResult.tierLabel,
    }));

  const focus = findFocusBadge(results);
  const focusBadge = focus
    ? {
        label: focus.config.label,
        emoji: focus.config.emoji,
        image: focus.config.image,
        needed: focus.tierResult.needed,
        nextTierLabel: TIER_LABELS[focus.tierResult.tier + 1] as TierLabel,
      }
    : null;

  return { username, avatarUrl, earnedBadges, focusBadge };
}
