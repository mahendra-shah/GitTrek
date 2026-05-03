/**
 * Auth Adapter — token retrieval boundary for GitHub API calls.
 *
 * Token signing strategy:
 *   The raw GitHub access token is never stored directly in the cookie.
 *   Instead, we store:  base64url(token) + "." + base64url(HMAC-SHA256(base64url(token), COOKIE_SECRET))
 *
 *   On read, the signature is verified before the token is returned. If the
 *   cookie has been tampered with, getToken() returns null (treated as signed-out).
 *
 * Migration path to GitHub App (v2):
 *   - Replace the body of `getToken()` to call your GitHub App
 *     installation-token endpoint instead.
 *   - All proxy routes (`/api/github/*`) import only `getToken()` from
 *     this file — zero changes needed there.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

const TOKEN_COOKIE = "gh_token";

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", env.COOKIE_SECRET);
  hmac.update(payload);
  return toBase64Url(hmac.digest());
}

/**
 * Serializes a GitHub access token into a signed cookie value.
 * Format: `<base64url(token)>.<base64url(HMAC)>`
 */
export function signToken(token: string): string {
  const encoded = toBase64Url(Buffer.from(token));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verifies and deserializes a signed cookie value back to the raw token.
 * Returns null if the signature is invalid or the cookie is malformed.
 */
function verifyToken(cookieValue: string): string | null {
  const dotIndex = cookieValue.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = cookieValue.slice(0, dotIndex);
  const receivedSig = cookieValue.slice(dotIndex + 1);
  const expectedSig = sign(encoded);

  // Constant-time comparison to prevent timing attacks
  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))
  ) {
    return null;
  }

  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Returns the GitHub access token for the current request, or `null` if the
 * user is not authenticated or the cookie has been tampered with.
 *
 * Called server-side only (Route Handlers). Never exposed to the client.
 */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!raw) return null;
  return verifyToken(raw);
}
