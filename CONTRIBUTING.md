# Contributing to GitTrek

Welcome! GitTrek helps developers find beginner-friendly GitHub issues where no one is already competing. We deeply value your contributions to make this open source tool even better for the community.

## Prerequisites

- Node.js 18+
- A GitHub account (for OAuth app setup)
- A registered GitHub OAuth App (takes 2 minutes — see the [1 — Register a GitHub OAuth App](README.md#1--register-a-github-oauth-app) section in the README).

## Local Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure your environment:
```bash
cp .env.local.example .env.local
```

3. Open `.env.local` and fill in:
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5173/api/auth/callback
COOKIE_SECRET=your_32_char_random_secret_here
```

4. Install Playwright browsers (required for E2E tests):
```bash
npx playwright install --with-deps chromium
```

5. Start the development server:
```bash
npm run dev
```

## Running Tests

We have two testing tiers that must pass before merging.

### Unit Tests (Vitest)
```bash
npm test
```

### End-to-End Tests (Playwright)
*Note: You must have the development server running (`npm run dev`) before executing Playwright tests.*
```bash
npm run test:e2e
```

## Note on the Token Pool

If you are running GitTrek locally without providing a `GITHUB_BOT_TOKEN` in your environment, any guest searches will consume your personal IP rate limit. This is expected behavior and not a bug.

## Claiming an Issue

To claim an issue, simply comment "I'd like to work on this" on the issue thread before starting. Do not open a PR for an unclaimed issue, as it may be rejected to avoid duplicate work.

## Branch Naming

Please use the following conventions for your branch names:
- `feat/short-description` for new features
- `fix/short-description` for bug fixes
- `docs/short-description` for documentation
- `chore/short-description` for maintenance

## Before Opening a PR — Checklist

- [ ] Tests pass locally (`npm test` and `npm run test:e2e`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] If changing search engine or auth flow: confirm you read `docs/ARCHITECTURE.md`
- [ ] If changing UI: tested in both light and dark mode
- [ ] PR template is filled out completely
- [ ] Issue is linked in the PR

## PR Review Process

GitTrek is a solo-maintained project, so reviews typically happen within a few days. Feedback will be technical and direct—please do not take it personally. Be prepared to iterate and revise your code based on the feedback.
