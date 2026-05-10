import { test, expect } from "@playwright/test";

test.describe("Search Live Smoke Test (Tier 3 Worry-Free Guarantee)", () => {
  test("performs a real unmocked search and renders actual GitHub data", async ({ page }) => {
    // We intentionally DO NOT mock the API route here.
    // This proves the entire stack (Browser -> Next.js -> GitHub API) works correctly.

    // 1. Visit the home page
    await page.goto("/");

    // 2. Wait for the real API to return the default search results
    // The fast-path global cache should make this almost instant, but we allow 15 seconds
    // just in case it's a cold start.
    const searchResponse = await page.waitForResponse("**/api/github/search", { timeout: 15000 });
    expect(searchResponse.status()).toBe(200);

    const data = await searchResponse.json();
    
    // We expect the backend to successfully hit GitHub and return some items.
    // If GitHub is down, rate-limited, or our GraphQL is broken, this fails.
    expect(data.items.length).toBeGreaterThan(0);

    // 3. Verify the UI actually rendered the real data
    await page.waitForSelector('[data-testid="issue-card-title"]', { timeout: 5000 });
    
    // Check that we have at least one card on the screen
    const issueCards = page.locator('[data-testid="issue-card-title"]');
    const count = await issueCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Check that the UI correctly mapped the real data
    const firstTitle = await issueCards.first().textContent();
    expect(firstTitle?.length).toBeGreaterThan(0);
  });
});
