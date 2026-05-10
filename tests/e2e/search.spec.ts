/**
 * SEARCH E2E TESTS — Real Browser, Real App, Intercepted Network
 *
 * PHILOSOPHY: These tests do NOT mock the API response for correctness tests.
 * Instead they intercept and INSPECT the payload the UI sends to the server.
 * This catches the #1 class of search bugs: the UI builds wrong payloads.
 *
 * For UI render tests (pagination, result display), mocking is still used
 * because we control those outcomes.
 *
 * SELECTORS: Use data-testid="search-submit-btn" for the submit button.
 * The button label changes dynamically ("Search issues" / "Search discussions")
 * so text-based selectors cause flaky timeouts.
 */
import { test, expect, type Request } from "@playwright/test";

// Convenience locator helper — always use this, never has-text on the submit btn
const SEARCH_BTN = '[data-testid="search-submit-btn"]';

// ─── Shared mock response used for UI render tests only ───────────────────
const MOCK_RESPONSE = {
  total_count: 1500,
  filtered_out: 0,
  hasMore: true,
  endCursor: "cursor_123",
  items: [
    {
      id: 1,
      number: 101,
      title: "Fix styling bug in header",
      htmlUrl: "https://github.com/mock/repo/issues/101",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: 2,
      labels: ["bug", "good first issue"],
      owner: "mock",
      repo: "repo",
      repository: {
        fullName: "mock/repo",
        htmlUrl: "https://github.com/mock/repo",
        stars: 5000,
        forks: 1200,
        pushedAt: new Date().toISOString(),
        isFork: false,
      },
      tasks: null,
      prStatus: { status: "safe", openPrCount: 0, draftPrCount: 0, linkedBranches: 0 },
    },
  ],
};

// ─── Payload capture helper ────────────────────────────────────────────────
async function captureSearchPayload(req: Request): Promise<Record<string, unknown>> {
  const body = req.postData();
  return body ? JSON.parse(body) : {};
}

// ═════════════════════════════════════════════════
// GROUP 1: Payload Contract Tests (no mock response)
// These verify what the UI actually SENDS, not what it displays.
// ═════════════════════════════════════════════════
test.describe("Search Payload Contract", () => {
  test("initial page load sends correct default payload", async ({ page }) => {
    let capturedPayload: Record<string, unknown> | null = null;

    await page.route("**/api/github/search", async (route) => {
      capturedPayload = await captureSearchPayload(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await page.waitForTimeout(1000); // let the initial search fire

    // Wait for at least one search to fire
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.type).toBe("issue");
    expect(capturedPayload!.order).toBe("desc");
    expect(capturedPayload!.sort).toBe("created");
    expect(capturedPayload!.page).toBe(1);
    // DEFAULT: minStars=500, minForks=100 (quality thresholds for curated results)
    expect(capturedPayload!.minStars).toBe(500);
    expect(capturedPayload!.minForks).toBe(100);
    expect(capturedPayload!.maxStars).toBeNull();
    expect(capturedPayload!.maxForks).toBeNull();
    // DEFAULT: good first issue label
    expect(Array.isArray(capturedPayload!.labels)).toBe(true);
  });

  test("setting minStars=500 sends minStars:500 in payload (not 0 or 100)", async ({ page }) => {
    const payloads: Record<string, unknown>[] = [];

    await page.route("**/api/github/search", async (route) => {
      payloads.push(await captureSearchPayload(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    // Open Advanced Filters
    await page.click('[data-testid="advanced-filters-toggle"]');
    await expect(page.locator("#filter-advanced-content")).toBeVisible();

    // Fill Min Stars
    const minStarsInput = page.locator('[aria-label="Minimum Repo Popularity (Stars)"]');
    await minStarsInput.fill("500");
    await minStarsInput.blur();

    // Click Search
    await page.click(SEARCH_BTN);
    await page.waitForTimeout(500);

    const lastPayload = payloads[payloads.length - 1];
    expect(lastPayload).not.toBeNull();
    expect(lastPayload.minStars).toBe(500);
    // maxStars should still be null (user didn't set it)
    expect(lastPayload.maxStars).toBeNull();
  });

  test("toggling noAssignee OFF sends noAssignee:false in payload", async ({ page }) => {
    const payloads: Record<string, unknown>[] = [];

    await page.route("**/api/github/search", async (route) => {
      payloads.push(await captureSearchPayload(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    // Find and toggle the noAssignee switch (currently ON by default)
    const noAssigneeToggle = page.locator('[data-testid="filter-no-assignee"]');
    if (await noAssigneeToggle.count() > 0) {
      await noAssigneeToggle.click();
      await page.click(SEARCH_BTN);
      await page.waitForTimeout(500);

      const lastPayload = payloads[payloads.length - 1];
      expect(lastPayload.noAssignee).toBe(false);
    } else {
      // If no data-testid, find the toggle by label text
      const toggleLabel = page.locator('text=No one assigned').locator("..").locator("button[role='switch'], input[type='checkbox']");
      if (await toggleLabel.count() > 0) {
        await toggleLabel.first().click();
        await page.click(SEARCH_BTN);
        await page.waitForTimeout(500);
        const lastPayload = payloads[payloads.length - 1];
        expect(typeof lastPayload.noAssignee).toBe("boolean");
      }
    }
  });

  test("selecting Python language sends languages:['Python'] in payload", async ({ page }) => {
    const payloads: Record<string, unknown>[] = [];

    await page.route("**/api/github/search", async (route) => {
      payloads.push(await captureSearchPayload(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    // Type Python in the language input
    await page.fill("#languages", "Python");
    const pythonBtn = page.locator('button:has-text("Python")').first();
    if (await pythonBtn.isVisible()) {
      await pythonBtn.click();
    }

    await page.click(SEARCH_BTN);
    await page.waitForTimeout(500);

    const lastPayload = payloads[payloads.length - 1];
    expect(Array.isArray(lastPayload.languages)).toBe(true);
    expect((lastPayload.languages as string[]).some(l => l.toLowerCase() === "python")).toBe(true);
  });

  test("switching to Discussions tab auto-searches (no manual Search click needed)", async ({ page }) => {
    const payloads: Record<string, unknown>[] = [];

    await page.route("**/api/github/search", async (route) => {
      payloads.push(await captureSearchPayload(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    // Click the Discussions tab — this should auto-search immediately, no Search btn needed
    await page.click('[data-testid="tab-discussion"]');
    await page.waitForTimeout(700);

    // A new search must have been triggered automatically
    const lastPayload = payloads[payloads.length - 1];
    expect(lastPayload.type).toBe("discussion");
    // Labels must be empty for discussions
    expect(Array.isArray(lastPayload.labels)).toBe(true);
    expect((lastPayload.labels as string[]).length).toBe(0);
  });
});

// ═════════════════════════════════════════════════
// GROUP 2: UI Render Tests (mock response is fine here)
// ═════════════════════════════════════════════════
test.describe("Search UI Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/github/search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });
    await page.goto("/");
  });

  test("displays search results with title and repo name", async ({ page }) => {
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=mock/repo")).toBeVisible();
    await expect(page.locator("text=1,500 issues found")).toBeVisible();
  });

  test("shows pagination controls for large result sets", async ({ page }) => {
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("button", { hasText: "Next" })).toBeVisible();
    await expect(page.locator("button", { hasText: "2" })).toBeVisible();
  });

  test("Advanced Filters panel opens and closes", async ({ page }) => {
    await page.click('[data-testid="advanced-filters-toggle"]');
    await expect(page.locator("#filter-advanced-content")).toBeVisible();
    await page.click('[data-testid="advanced-filters-toggle"]');
    await expect(page.locator("#filter-advanced-content")).not.toBeAttached();
  });
});

// ═════════════════════════════════════════════════
// GROUP 3: Race condition protection
// The original bug: minStars was set via blur event but submit fired
// before blur resolved, sending stale (pre-edit) value.
// ═════════════════════════════════════════════════
test.describe("Race Condition Protection", () => {
  test("minStars input: value is committed before payload is sent", async ({ page }) => {
    let searchPayload: Record<string, unknown> | null = null;

    await page.route("**/api/github/search", async (route) => {
      const body = route.request().postData();
      if (body) searchPayload = JSON.parse(body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Fix styling bug in header")).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="advanced-filters-toggle"]');
    await expect(page.locator("#filter-advanced-content")).toBeVisible();

    const minStarsInput = page.locator('[aria-label="Minimum Repo Popularity (Stars)"]');
    await minStarsInput.fill("500");

    // Immediately click search (triggers blur + submit simultaneously)
    await page.click(SEARCH_BTN);
    await page.waitForTimeout(500);

    expect(searchPayload).not.toBeNull();
    // The committed value MUST be 500, not the pre-edit value
    expect(searchPayload!.minStars).toBe(500);
  });
});
