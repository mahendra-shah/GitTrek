# 🏁 GitTrek Pre-Push Verification Checklist

To guarantee a 100% green pass on GitHub Pull Requests and prevent any broken production builds, execute this verification flow locally before pushing your code.

---

## 📋 The 5-Step Checklist

### 🔍 Step 1: Code Quality & Linting
Checks your codebase for syntax errors, style deviations, unused imports, or formatting warnings.
```bash
npm run lint
```

### 🛡️ Step 2: TypeScript Compilation Check
Ensures there are no strict typing errors or implicit `any` assignments across the entire project. Next.js will block production builds on any TypeScript compile errors.
```bash
npx tsc --noEmit
```

### 🧪 Step 3: Run Unit & Integration Tests (Tier 2: Live Data Pipeline)
Runs the complete Vitest/Jest suite covering component renders, bounds clamping, and deep combinatorial search logic. This includes the `search-pipeline.test.ts` which hammers the real GitHub API to prove backend filters work.
```bash
npm test
```

### 🌐 Step 4: Run End-to-End Browser Tests (Tier 1 & Tier 3: Payload + Smoke)
Runs Playwright E2E tests in a real headless browser. This handles:
- **Tier 1 (Payload Contract):** Mocked tests to instantly verify UI buttons send the correct payload parameters.
- **Tier 3 (Live Smoke Test):** A completely unmocked browser test that clicks "Search", hits the real GitHub API, and ensures a real repository card appears on the screen.
```bash
npm run test:e2e
```

### 📦 Step 5: Test Production Compile (Next.js Build)
Performs a full production build of the Next.js application to catch any hydration anomalies or bundling failures.
```bash
npm run build
```

---

## ⚡ Chained One-Liner (For Daily Use)

To run all checks in a single stroke, execute this chained command in your terminal. It stops instantly at the first failure, letting you debug before committing or pushing:

```bash
npm run lint && npx tsc --noEmit && npm test && npm run test:e2e && npm run build
```
*(If this command completes successfully with exit code 0, you are 100% safe to push to GitHub!)*
