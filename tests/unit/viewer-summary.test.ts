import { describe, it, expect } from "vitest";
import { formatViewerReasons } from "@/lib/viewer-summary";

describe("formatViewerReasons", () => {
  it("maps reasons to readable phrases", () => {
    expect(formatViewerReasons(["authored", "commented"])).toBe(
      "you authored this, you commented"
    );
  });

  it("returns empty string for empty reasons", () => {
    expect(formatViewerReasons([])).toBe("");
  });
});
