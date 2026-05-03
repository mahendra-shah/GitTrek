# GitTrek Testing Guide

Welcome to the GitTrek testing framework. This document outlines our testing philosophy, the tools we use, and the rules every developer must follow to keep the codebase stable and reliable.

## ── THE TESTING PHILOSOPHY ──

We follow a **Hybrid Testing Pyramid**:
1.  **Unit Tests (Fastest):** Test isolated logic and utilities.
2.  **Component Tests (Fast):** Test UI components in isolation (JSDOM).
3.  **E2E Tests (Reliable):** Test full user flows in a real browser (Mocked API).
4.  **Integration Tests (Live):** Periodically verify the real-world connection to GitHub.

---

## ── TOOLS & COMMANDS ──

### 1. Vitest (Unit & Components)
Used for everything inside `tests/unit` and `tests/components`.
*   **Run all:** `npm test`
*   **Watch mode:** `npm run test:watch`
*   **Specific file:** `npx vitest tests/unit/search.test.ts`

### 2. Playwright (End-to-End)
Used for browser-based testing inside `tests/e2e`.
*   **Run all (Headless):** `npm run test:e2e`
*   **UI Mode (Interactive):** `npx playwright test --ui`
*   **Debug Mode:** `npx playwright test --debug`

---

## ── DIRECTORY STRUCTURE ──

*   `tests/unit/`: Logic-only tests (e.g., query builders, crypto helpers).
*   `tests/components/`: React component tests using React Testing Library.
*   `tests/e2e/`: Playwright browser tests.
*   `tests/integration/`: Live API verification (hits real GitHub).
*   `scripts/debug/`: One-off manual test scripts (moved from root). **Do not add new scripts here; write a proper test instead.**

---

## ── CI/CD AUTOMATION ──

GitTrek uses GitHub Actions to enforce quality automatically:

### 1. Pull Request Checks (`test.yml`)
Runs **automatically** on every Push to `main` and every Pull Request.
*   Installs dependencies and Playwright browsers.
*   Runs all Unit, Component, and E2E (Mocked) tests.
*   **Rule:** You cannot merge a PR unless all tests pass.

### 2. Daily Health Checks (`integration.yml`)
Runs **automatically** every day at 00:00 UTC.
*   Triggers the `tests/integration/github-api.test.ts`.
*   Connects to the **Real GitHub API**.
*   **Purpose:** Alerts the team if GitHub makes a breaking change to their API schema before our users notice.

---

## ── DEVELOPER RULES ──

> [!IMPORTANT]
> Failure to follow these rules may result in your Pull Request being rejected.

1.  **No Logic Without Tests:** Any new utility function added to `src/lib` MUST have a corresponding unit test in `tests/unit`.
2.  **Mock by Default in E2E:** E2E tests in `tests/e2e` must ALWAYS mock API responses from GitHub. We do not want our PR checks to fail because of GitHub's rate limits.
3.  **Use Semantic Selectors:** When writing component or E2E tests, prefer `getByRole` or `getByText` over CSS classes or IDs. This ensures our app remains accessible.
4.  **Keep Tests Deterministic:** Avoid `setTimeout` or `delay` in tests. Use Playwright's `expect(...).toBeVisible()` which handles polling automatically.
5.  **Clean Up Root:** Never create `test-xxx.js` scripts in the project root. Use the `tests/` directory structure.

---

## ── ADDING NEW TESTS ──

### Adding a Unit Test
1. Create `tests/unit/my-feature.test.ts`.
2. Import `describe, it, expect` from `vitest`.
3. Use `vi.mock()` to isolate dependencies.

### Adding a Component Test
1. Create `tests/components/MyComponent.test.tsx`.
2. Import `render, screen` from `@testing-library/react`.
3. Use `fireEvent` to simulate user clicks.

### Adding an E2E Test
1. Create `tests/e2e/my-flow.spec.ts`.
2. Use `page.route()` to mock any external API calls.
3. Use `expect(page).toHaveURL()` or `expect(page.locator(...)).toBeVisible()`.
