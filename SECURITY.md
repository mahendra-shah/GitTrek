# Security Policy

**Do not open a public issue for security vulnerabilities.**

## Supported Versions

Only the latest commit on the `main` branch is actively maintained and supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability in GitTrek, please report it immediately:

- **Email:** `mahendra.workmail2@gmail.com`
- **Subject line:** `[GitTrek Security]`

**Please include the following in your report:**
- A detailed description of the issue.
- Step-by-step instructions to reproduce the vulnerability.
- A potential impact assessment (what can an attacker achieve?).

**Response Commitment:**
We will acknowledge receipt of your vulnerability report within 48 hours. A timeline for the fix will be communicated based on the severity of the issue.

## Scope

The following issues are considered within the scope of our security policy for GitTrek:
- GitHub OAuth token handling or exposure.
- HttpOnly session cookie bypass or leakage.
- Bot token pool exposure (e.g., leakage of the `GITHUB_BOT_TOKEN` environment variable).
- GraphQL query injection or manipulation.
- Rate limit bypass that could abuse GitHub's API on behalf of other users.
- Auth state manipulation.

## Out of Scope

Please do not report the following:
- Issues or vulnerabilities within GitHub's own API (these should be reported directly to GitHub).
- Rate limiting behaviors that only affect the reporter's own account.
