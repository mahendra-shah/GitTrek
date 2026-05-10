"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { SITE_SUBLINE } from "../lib/site-copy";
import { SearchProvider, useSearch } from "../features/search/context/SearchContext";
import { useUrlSync } from "../features/search/hooks/useUrlSync";
import { FilterPanel } from "../features/search/components/FilterPanel";
import { SearchControls } from "../features/search/components/SearchControls";
import { ResultsFeed } from "../features/search/components/ResultsFeed";
import { countActiveFilters } from "../features/search/types";

// This layout orchestrator manages the mobile filter sidebar and basic page structure.
function SearchLayout() {
  const { draft, hideLinkedPRs } = useSearch();
  const [filterOpen, setFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me");
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("session_error");
      return r.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const isGuest = mounted && !sessionQuery.isLoading && sessionQuery.data === null;
  const activeFilterCount = countActiveFilters(draft, hideLinkedPRs);

  return (
    <main id="main-content" style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 24px" }}>
      {isGuest && (
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 10, padding: "12px 20px", marginBottom: 28, textAlign: "center",
          fontSize: 13, color: "var(--gt-warn-text)",
        }}>
          Guests get basic search. ·{" "}
          <button
            onClick={() => { window.location.href = "/api/auth/login"; }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--gt-primary)", fontWeight: 700, textDecoration: "underline", padding: 0
            }}
          >
            Sign in with GitHub
          </button>
          {" "}to unlock deep Repository Quality Gates (Stars, Forks, Activity).
          {" "}
          <Link href="/guide" style={{ color: "var(--gt-primary)", fontWeight: 700 }}>
            New to open source? Read the beginner&apos;s guide →
          </Link>
        </div>
      )}

      {/* Hero row */}
      <div className="gt-hero-row">
        <div className="gt-hero-text">
          <h1 style={{
            fontSize: "clamp(1.15rem, 2.6vw, 1.5rem)",
            fontWeight: 800,
            color: "var(--gt-text)",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
            lineHeight: 1.2,
          }}>
            Don&apos;t get sniped on GitHub issues.
          </h1>
          <p style={{ fontSize: 13, color: "var(--gt-text-muted)", margin: 0, lineHeight: 1.45 }}>
            {SITE_SUBLINE}
          </p>
        </div>
      </div>

      {/* Backdrop for mobile drawer dismissal */}
      {filterOpen && (
        <div 
          onClick={() => setFilterOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            zIndex: 1000, cursor: "pointer"
          }}
        />
      )}

      <div className="gt-layout-grid">
        <aside className={`gt-filter-aside${filterOpen ? " open" : ""}`} style={{ zIndex: 1001 }}>
          <div
            className="gt-filter-inner"
            style={{
              background: "var(--gt-sidebar)", border: "none",
              borderRadius: 14, padding: 20,
              boxShadow: "var(--gt-shadow)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="gt-mobile-filter-btn" style={{ justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={() => setFilterOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--gt-text-muted)", display: "flex", alignItems: "center",
                  gap: 6, fontSize: 13, fontWeight: 600, padding: "4px 8px",
                }}
                aria-label="Close filters"
              >
                <X size={16} /> Close
              </button>
            </div>
            {/* Decoupled Filter Panel */}
            <FilterPanel onClose={() => setFilterOpen(false)} />
          </div>
        </aside>

        <section>
          <div className="gt-mobile-filter-btn" style={{ marginBottom: 12 }}>
            <button
              onClick={() => setFilterOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                color: "var(--gt-text)", cursor: "pointer",
                boxShadow: "var(--gt-shadow)",
              }}
              aria-expanded={filterOpen}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal size={15} />
              Filters{activeFilterCount ? ` · ${activeFilterCount}` : ""}
            </button>
          </div>

          <SearchControls />
          <ResultsFeed />
        </section>
      </div>
    </main>
  );
}

function HomeClientContent() {
  const { getInitialState } = useUrlSync();
  const initialState = getInitialState();

  return (
    <SearchProvider initialState={initialState}>
      <SearchLayout />
    </SearchProvider>
  );
}

export function HomeClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", background: "var(--gt-bg)" }} />}>
      <HomeClientContent />
    </Suspense>
  );
}
