import { Suspense } from "react";
import { LandingHero } from "@/components/LandingHero";
import { HomeClient } from "@/components/HomeClient";

export default function Home() {
  return (
    <>
      <LandingHero />
      <Suspense fallback={<div style={{ minHeight: "60vh", background: "var(--gt-bg)" }} />}>
        <HomeClient />
      </Suspense>
    </>
  );
}
