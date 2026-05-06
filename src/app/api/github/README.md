This folder contains Next.js route handlers that proxy GitHub API requests using the
OAuth access token stored in an HttpOnly cookie.

Key behavior in this layer:

- Unified search endpoint at `/api/github/search` for both issues and discussions.
- Server-side query building + quality filtering.
- Viewer-aware enrichment for signed-in users (e.g., already engaged with issue/discussion).
- Guest-safe fallbacks with rate limiting and cache controls.
