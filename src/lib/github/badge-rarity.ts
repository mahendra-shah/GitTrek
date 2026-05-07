import type { BadgeKey } from "@/lib/github/badges";

/**
 * Estimated % of active GitHub developers who have reached each tier of a given badge.
 * index 0 = not earned, 1..4 = Bronze..Platinum (% of devs at-or-above this tier).
 *
 * These are calibrated approximations from public data — treat as ballpark values.
 */
export const BADGE_RARITY: Record<BadgeKey, [number, number, number, number, number]> = {
  pullShark: [100, 60, 22, 4, 0.4],
  pairExtraordinaire: [100, 18, 5, 1.5, 0.3],
  starstruck: [100, 8, 1.2, 0.3, 0.04],
  galaxyBrain: [100, 12, 3, 1, 0.2],
  yolo: [100, 35, 35, 35, 35],
  quickdraw: [100, 100, 100, 100, 100],
  publicSponsor: [100, 6, 6, 6, 6],
};

export function rarityPct(key: BadgeKey, tier: 0 | 1 | 2 | 3 | 4): number {
  return BADGE_RARITY[key]?.[tier] ?? 100;
}

export function rarityLabel(key: BadgeKey, tier: 0 | 1 | 2 | 3 | 4): string {
  if (tier === 0) return "Not yet earned";
  const pct = rarityPct(key, tier);
  if (pct < 1) return `Top ${pct.toFixed(2)}% of devs`;
  if (pct < 10) return `Top ${Math.round(pct)}% of devs`;
  return `~${Math.round(pct)}% of devs reach this tier`;
}

/** Compact suffix for tweet copy — only when tier ≥ 2 and rarity is interesting. */
export function rarityTweetSuffix(key: BadgeKey, tier: 0 | 1 | 2 | 3 | 4): string {
  if (tier < 2) return "";
  const pct = rarityPct(key, tier);
  if (pct >= 50) return "";
  if (pct < 1) return `top ${pct.toFixed(2)}% of devs`;
  return `top ${Math.round(pct)}% of devs`;
}
