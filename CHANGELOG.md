# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-10

### Added
- Smart issue search with GitHub GraphQL API query builder
- Server-side quality gates (configurable min stars, forks, recency filters)
- Live PR competition detection via GraphQL timelineItems
- GitHub badge tracker: Pull Shark, Pair Extraordinaire, YOLO, Quickdraw
- Secure GitHub OAuth 2.0 with HttpOnly session cookie
- Exhaustion-aware bot token rotation pool for guest searches
- Two-layer caching: TanStack Query client cache + in-memory server cache
- Dark and light mode via prefers-color-scheme
- Playwright E2E test suite
- Vitest unit test suite
- GitHub Actions CI pipeline
