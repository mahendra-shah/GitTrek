import { describe, it, expect } from "vitest";
import {
  calculateTier,
  findFocusBadge,
  buildShareableCardData,
  BADGE_CONFIG,
  BadgeResult,
} from "../../src/lib/github/badges";

describe("calculateTier", () => {
  const thresholds = [2, 16, 128, 1024]; // Pull Shark

  it("returns tier 0 when count is below first threshold", () => {
    const result = calculateTier(0, thresholds);
    expect(result.tier).toBe(0);
    expect(result.tierLabel).toBe("Not earned");
    expect(result.isMaxed).toBe(false);
    expect(result.nextThreshold).toBe(2);
    expect(result.needed).toBe(2);
    expect(result.percentToNext).toBe(0);
  });

  it("returns tier 0 with partial progress when count is 1 (needs 2 for tier 1)", () => {
    const result = calculateTier(1, thresholds);
    expect(result.tier).toBe(0);
    expect(result.percentToNext).toBe(50);
    expect(result.needed).toBe(1);
  });

  it("returns tier 1 at exactly the first threshold", () => {
    const result = calculateTier(2, thresholds);
    expect(result.tier).toBe(1);
    expect(result.tierLabel).toBe("Bronze");
    expect(result.nextThreshold).toBe(16);
    expect(result.needed).toBe(14);
  });

  it("returns tier 2 at exactly the second threshold", () => {
    const result = calculateTier(16, thresholds);
    expect(result.tier).toBe(2);
    expect(result.tierLabel).toBe("Silver");
    expect(result.nextThreshold).toBe(128);
    expect(result.needed).toBe(112);
  });

  it("returns tier 3 at exactly the third threshold", () => {
    const result = calculateTier(128, thresholds);
    expect(result.tier).toBe(3);
    expect(result.tierLabel).toBe("Gold");
    expect(result.nextThreshold).toBe(1024);
    expect(result.needed).toBe(896);
  });

  it("returns tier 4 (maxed) at the final threshold", () => {
    const result = calculateTier(1024, thresholds);
    expect(result.tier).toBe(4);
    expect(result.tierLabel).toBe("Platinum");
    expect(result.isMaxed).toBe(true);
    expect(result.nextThreshold).toBe(null);
    expect(result.needed).toBe(0);
    expect(result.percentToNext).toBe(100);
  });

  it("still maxed when count greatly exceeds the last threshold", () => {
    const result = calculateTier(9999, thresholds);
    expect(result.tier).toBe(4);
    expect(result.isMaxed).toBe(true);
  });

  it("works correctly for single-tier badges (YOLO, Quickdraw)", () => {
    const single = [1];
    const notEarned = calculateTier(0, single);
    const earned = calculateTier(1, single);
    expect(notEarned.tier).toBe(0);
    expect(earned.tier).toBe(1);
    expect(earned.isMaxed).toBe(true);
  });
});

describe("findFocusBadge", () => {
  const makeBadgeResult = (
    key: BadgeResult["key"],
    count: number
  ): BadgeResult => ({
    key,
    config: BADGE_CONFIG[key],
    tierResult: calculateTier(count, BADGE_CONFIG[key].tiers),
  });

  it("returns null if all badges are maxed", () => {
    const results: BadgeResult[] = [
      makeBadgeResult("pullShark", 1024),
      makeBadgeResult("publicSponsor", 1),
    ];
    const focus = findFocusBadge(results);
    expect(focus).toBeNull();
  });

  it("returns null if all unfinished badges are non-trackable", () => {
    const results: BadgeResult[] = [makeBadgeResult("quickdraw", 0)];
    const focus = findFocusBadge(results);
    expect(focus).toBeNull();
  });

  it("returns the badge closest to next tier (highest percentToNext)", () => {
    const results: BadgeResult[] = [
      makeBadgeResult("pullShark", 1),       // 50% to tier 1 (need 2)
      makeBadgeResult("galaxyBrain", 0),     // 0% to tier 1
      makeBadgeResult("publicSponsor", 0),   // 0% to tier 1
    ];
    const focus = findFocusBadge(results);
    expect(focus?.key).toBe("pullShark");
  });

  it("ignores non-trackable badges when picking focus", () => {
    const results: BadgeResult[] = [
      makeBadgeResult("quickdraw", 0),  // non-trackable
      makeBadgeResult("galaxyBrain", 0), // trackable
    ];
    const focus = findFocusBadge(results);
    expect(focus?.key).toBe("galaxyBrain");
  });
});

describe("buildShareableCardData", () => {
  it("correctly identifies earned and unearned badges", () => {
    const results: BadgeResult[] = [
      { key: "pullShark", config: BADGE_CONFIG.pullShark, tierResult: calculateTier(16, BADGE_CONFIG.pullShark.tiers) },
      { key: "galaxyBrain", config: BADGE_CONFIG.galaxyBrain, tierResult: calculateTier(0, BADGE_CONFIG.galaxyBrain.tiers) },
    ];
    const card = buildShareableCardData("testuser", "https://example.com/avatar.png", results);
    expect(card.username).toBe("testuser");
    expect(card.earnedBadges).toHaveLength(1);
    expect(card.earnedBadges[0].key).toBe("pullShark");
    expect(card.earnedBadges[0].tierLabel).toBe("Silver");
  });

  it("focusBadge points to the closest unearned badge", () => {
    const results: BadgeResult[] = [
      { key: "pullShark", config: BADGE_CONFIG.pullShark, tierResult: calculateTier(1, BADGE_CONFIG.pullShark.tiers) },
      { key: "galaxyBrain", config: BADGE_CONFIG.galaxyBrain, tierResult: calculateTier(0, BADGE_CONFIG.galaxyBrain.tiers) },
    ];
    const card = buildShareableCardData("testuser", "", results);
    expect(card.focusBadge?.label).toBe("Pull Shark");
    expect(card.focusBadge?.needed).toBe(1);
  });

  it("focusBadge is null when all trackable badges are maxed", () => {
    const results: BadgeResult[] = [
      { key: "pullShark", config: BADGE_CONFIG.pullShark, tierResult: calculateTier(9999, BADGE_CONFIG.pullShark.tiers) },
    ];
    const card = buildShareableCardData("testuser", "", results);
    expect(card.focusBadge).toBeNull();
  });
});
