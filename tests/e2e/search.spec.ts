import { test, expect } from '@playwright/test';

const mockSearchResponse = {
  total_count: 1500,
  filtered_out: 0,
  hasMore: true,
  endCursor: 'cursor_123',
  items: [
    {
      id: 1,
      number: 101,
      title: 'Fix styling bug in header',
      htmlUrl: 'https://github.com/mock/repo/issues/101',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: 2,
      labels: ['bug', 'good first issue'],
      owner: 'mock',
      repo: 'repo',
      repository: {
        fullName: 'mock/repo',
        htmlUrl: 'https://github.com/mock/repo',
        stars: 5000,
        forks: 1200,
        pushedAt: new Date().toISOString(),
        isFork: false,
      },
      tasks: null,
      prStatus: {
        status: 'safe',
        openPrCount: 0,
        draftPrCount: 0,
        linkedBranches: 0,
      },
    },
  ],
};

test.describe('Search Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response
    await page.route('**/api/github/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResponse),
      });
    });

    // Go to the home page
    await page.goto('/');
  });

  test('displays search results on initial load', async ({ page }) => {
    // Wait for the mock item to render
    await expect(page.locator('text=Fix styling bug in header')).toBeVisible();
    await expect(page.locator('text=mock/repo')).toBeVisible();
    await expect(page.locator('text=1,500 issues found')).toBeVisible();
  });

  test('filters update the search results', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('text=Fix styling bug in header')).toBeVisible();

    // Change a mock to return a different issue to simulate filter update
    await page.route('**/api/github/search', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      if (payload.languages?.includes('Python')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockSearchResponse,
            total_count: 50,
            items: [
              {
                ...mockSearchResponse.items[0],
                title: 'Python specific issue',
                number: 202,
              },
            ],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSearchResponse),
        });
      }
    });

    // Select the Python language from the dropdown
    await page.selectOption('select', 'Python');
    
    // Click the search button to apply filters
    await page.click('button:has-text("Search issues")');
    
    // Wait for the UI to update
    await expect(page.locator('text=Python specific issue')).toBeVisible();
    await expect(page.locator('text=50 issues found')).toBeVisible();
  });

  test('shows pagination when there are many results', async ({ page }) => {
    // The mock returns 1500 total_count, and perPage is default 20. 
    // Pagination should be visible.
    await expect(page.locator('button', { hasText: 'Next' })).toBeVisible();
    await expect(page.locator('button', { hasText: '2' })).toBeVisible();
  });
});
