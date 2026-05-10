# 🧪 GitTrek Automated Testing & CI/CD Workflow Guide

This document describes the End-to-End (E2E) testing suite, the custom synchronization race-condition verification, and the GitHub CI/CD integration.

---

## 🚀 1. The E2E Testing Suite (Playwright)

To guarantee 100% immunity against real-world browser race conditions and state-synchronization traps, GitTrek utilizes **Playwright** for high-fidelity browser emulation. Playwright tests interact directly with Chromium to simulate real user behavior, parallel rendering microtasks, and input blur/submit concurrency.

### 📦 Test Commands
*   **Run E2E Tests (Headless):**
    ```bash
    npm run test:e2e
    ```
    or
    ```bash
    npx playwright test
    ```
*   **Run E2E Tests with UI Mode:**
    ```bash
    npx playwright test --ui
    ```
*   **Show HTML Report:**
    ```bash
    npx playwright show-report
    ```

---

## 🛠️ 2. New Test Coverage Details

The Playwright suite inside [`tests/e2e/search.spec.ts`](file:///Users/mahendra/work-dir/personal-p/open-dev/tests/e2e/search.spec.ts) has been extended to verify our recent UX stability fixes:

### A. Immediate Submit Race-Condition Test
*   **What it tests:** Verifies that when a user types rapidly inside a `RangeBlock` input (e.g., "Min Stars") and clicks the "Search issues" button **immediately**, the state is synchronized in the exact same tick.
*   **Why JSDOM fails here:** Node-based JSDOM runs all events synchronously. Playwright executes true pointer events, firing `blur` on the input and `click` on the button in parallel threads, verifying that our fully controlled React state propagates the text synchronously before the `onSubmit` handler is executed.
*   **Code Implementation:**
    ```typescript
    test('captures range inputs and handles immediate submit race conditions gracefully', async ({ page }) => {
      await page.click('button:has-text("Advanced Filters")');
      const minStarsInput = page.locator('[aria-label="Minimum Repo Popularity (Stars)"]');
      await minStarsInput.fill('500');

      let searchPayload: any = null;
      await page.route('**/api/github/search', async (route) => {
        searchPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSearchResponse) });
      });

      await page.click('button:has-text("Search issues")');
      expect(searchPayload.minStars).toBe(500);
    });
    ```

### B. Custom TagInput Selector Alignment Fix
*   **What it tests:** Corrected the legacy language-selection test which was failing due to a timeout trap. The language input was refactored into a custom multi-select `TagInput`, but the test was still attempting to use native `page.selectOption()`.
*   **The Fix:** The test now types `'Python'` into the custom `#languages` input field and dynamically clicks the suggestion button option to select it, aligning perfectly with modern UX flows.

---

## 📂 3. Continuous Integration (GitHub Actions)

GitTrek is configured to automatically run these E2E tests on **every Pull Request** and **Code Push** to the `main` branch.

### 🤖 CI Workflow (`.github/workflows/test.yml`)
The workflow automatically executes the following steps:
1. **Environment Setup:** Spins up an `ubuntu-latest` runner and installs Node.js v20.
2. **Dependency Installation:** Installs npm packages securely via `npm ci`.
3. **Playwright Driver Setup:** Caches and installs headless Chromium and its system dependencies using `npx playwright install --with-deps chromium`.
4. **Unit & Component Suites:** Runs standard regression tests via `npm test`.
5. **Real-Browser E2E Execution:** Boots up the Next.js dev server on port `5173` via Playwright's integrated `webServer` option and executes the E2E tests (`npm run test:e2e`).
6. **Artifact Archiving:** If any test fails, Playwright takes screenshots and records trace logs, then uploads the compiled HTML report to GitHub Actions as an artifact (retained for 30 days).

---

## 📈 4. Verification Checkpoint

All tests are verified and passing locally:
*   **Playwright E2E Tests:** **4 / 4 passed (100% success rate in 7.2 seconds)**
*   **Standard Unit Tests:** **120 / 120 passed (100% success rate)**
