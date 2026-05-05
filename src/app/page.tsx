/**
 * Home Page — Server Component
 *
 * This file intentionally has NO "use client" directive.
 * It is a server component that renders:
 *   1. <LandingHero> — static, always in raw HTML, crawlable by all bots and AI engines
 *   2. <HomeClient> — interactive search UI wrapped in <Suspense> (client-rendered)
 *
 * The <LandingHero> ensures the page has 500+ chars of meaningful text in the raw HTML
 * response, a proper <h1>, and factual feature descriptions visible to:
 *   - Google Search / Googlebot
 *   - Perplexity, ChatGPT, Claude (AI citation engines)
 *   - X.com / Twitter card scrapers
 *   - LinkedIn / Slack / Discord link previews
 *   - Screen readers (even before JS hydration)
 */

import { Suspense } from "react";
import { LandingHero } from "@/components/LandingHero";
import { HomeClient } from "@/components/HomeClient";

export default function Home() {
  return (
    <>
      {/* Server-rendered: always in raw HTML, no JS required */}
      <LandingHero />

      {/* Client-rendered: interactive search UI */}
      <Suspense fallback={<div style={{ minHeight: "60vh", background: "var(--gt-bg)" }} />}>
        <HomeClient />
      </Suspense>
    </>
  );
}
