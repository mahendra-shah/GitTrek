import { z } from "zod";

const serverSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_REDIRECT_URI: z.string().url(),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),
  /** Read-only PAT for the "Any User Lookup" feature. Scopes: public_repo, read:user */
  GITHUB_BOT_TOKEN: z.string().min(1).optional(),
  NODE_ENV: z.string().optional(),
});

export const env = serverSchema.parse({
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  GITHUB_BOT_TOKEN: process.env.GITHUB_BOT_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
});

export const isProd = env.NODE_ENV === "production";
