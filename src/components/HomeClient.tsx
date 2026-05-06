"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { IssueCard, IssueItem } from "@/components/IssueCard";
import { FilterPanel, FilterDraft } from "@/components/FilterPanel";
import { Pagination } from "@/components/Pagination";
import {
  SITE_SUBLINE,
  SITE_AI_CONTEXT,
  SITE_CAREER_HOOK,
} from "@/lib/site-copy";

type SearchResponse = {
  total_count: number;
  filtered_out: number;
  items: IssueItem[];
  hasMore: boolean;
  endCursor: string | null;
  warnings: string[];
  rate_limit: { limit: number | null; remaining: number | null; reset: number | null } | null;
  __resultType?: "issue" | "discussion";
};

type SessionUser = { login: string; name: string | null; avatarUrl: string; htmlUrl: string };

const DEFAULT: FilterDraft = {
  text: "",
  languages: [],
  labels: ["good first issue", "help wanted"],
  zeroComments: false,
  issueAgeDays: 30,
  minStars: 100,
  maxStars: null,
  minForks: 50,
  maxForks: null,
  repoPushedDays: 90,
  noAssignee: true,
  hasContributing: false,
  org: "",
  onlyOrgs: false,
  contributionType: "issue",
  activeMaintainer: false,
  pairingRequested: false,
};

const EMPTY_FILTERS: FilterDraft = {
  text: "",
  languages: [],
  labels: [],
  zeroComments: false,
  issueAgeDays: 30,
  minStars: 0,
  maxStars: null,
  minForks: 0,
  maxForks: null,
  repoPushedDays: 365,
  noAssignee: false,
  hasContributing: false,
  org: "",
  onlyOrgs: false,
  contributionType: "issue",
  activeMaintainer: false,
  pairingRequested: false,
};

function countActiveFilters(draft: FilterDraft, hideLinkedPRs: boolean): number {
  let count = 0;
  if (draft.text.trim()) count++;
  if (draft.languages.length) count++;
  if (draft.labels.length) count++;
  if (draft.zeroComments) count++;
  if (draft.issueAgeDays !== EMPTY_FILTERS.issueAgeDays) count++;
  if (draft.minStars !== EMPTY_FILTERS.minStars || draft.maxStars !== EMPTY_FILTERS.maxStars) count++;
  if (draft.minForks !== EMPTY_FILTERS.minForks || draft.maxForks !== EMPTY_FILTERS.maxForks) count++;
  if (draft.repoPushedDays !== EMPTY_FILTERS.repoPushedDays) count++;
  if (draft.noAssignee) count++;
  if (draft.hasContributing) count++;
  if (draft.org?.trim()) count++;
  if (draft.onlyOrgs) count++;
  if (draft.activeMaintainer && draft.contributionType === "issue") count++;
  if (draft.pairingRequested && draft.contributionType === "issue") count++;
  if (hideLinkedPRs) count++;
  if (draft.contributionType === "discussion") count++;
  return count;
}

function HomeContent() {
  const sessionQuery = useQuery<SessionUser | null>({
    queryKey: ["session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me");
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("session_error");
      return r.json();
    },
    staleTime: 1000 * 60 * 5,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isGuest = mounted && !sessionQuery.isLoading && sessionQuery.data === null;

  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<FilterDraft>(() => {
    if (!searchParams) return DEFAULT;
    const fromUrl: FilterDraft = { ...DEFAULT };
    if (searchParams.has("labels")) fromUrl.labels = searchParams.get("labels")!.split(",");
    if (searchParams.has("noAssignee")) fromUrl.noAssignee = searchParams.get("noAssignee") === "true";
    if (searchParams.has("zeroComments")) fromUrl.zeroComments = searchParams.get("zeroComments") === "true";
    if (searchParams.has("discussions")) fromUrl.contributionType = "discussion";
    if (searchParams.has("text")) fromUrl.text = searchParams.get("text")!;
    return fromUrl;
  });
  
  const [hideLinkedPRs, setHideLinkedPRs] = useState(() => searchParams?.get("hideLinkedPRs") === "true");

  const [filterOpen, setFilterOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const syncUrlFromDraft = useCallback((d: FilterDraft, hidePRs: boolean) => {
    const params = new URLSearchParams();
    if (d.text) params.set("text", d.text);
    if (d.labels.length) params.set("labels", d.labels.join(","));
    if (d.noAssignee) params.set("noAssignee", "true");
    if (d.zeroComments) params.set("zeroComments", "true");
    if (d.contributionType === "discussion") params.set("discussions", "true");
    if (hidePRs) params.set("hideLinkedPRs", "true");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }, []);



  const [sort, setSort] = useState<"created" | "updated" | "comments" | "stars">("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Sort/order are client-side only.
  const [applied, setApplied] = useState<FilterDraft>(draft);

  const [currentPage, setCurrentPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);

  const cursor = cursorHistory[currentPage - 1] ?? null;

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ["search", applied, currentPage, cursor, sessionQuery.data?.login ?? null],
    queryFn: async () => {
      const perPage = isGuest ? 10 : 20;
      const r = await fetch("/api/github/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...applied,
          type: applied.contributionType,
          activeMaintainer: applied.activeMaintainer,
          pairingRequested: applied.pairingRequested,
          labels: applied.contributionType === "discussion" ? [] : applied.labels,
          perPage,
          page: currentPage,
          cursor,
          viewerLogin: sessionQuery.data?.login,
        }),
      });
      if (!r.ok) throw new Error("search_failed");
      const data = (await r.json()) as Omit<SearchResponse, "__resultType">;
      return { ...data, __resultType: applied.contributionType };
    },
    enabled: !sessionQuery.isLoading,
    staleTime: 60_000,
    placeholderData: (prev) => {
      if (!prev) return undefined;
      const p = prev as SearchResponse;
      return p.__resultType === applied.contributionType ? prev : undefined;
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const rl = searchQuery.data?.rate_limit;
    if (rl && rl.limit) {
      queryClient.setQueryData(["rateLimit"], (old: any) => ({
        ...old,
        activeSearchLimit: rl,
      }));
    }
  }, [searchQuery.data?.rate_limit, queryClient]);

  useEffect(() => {
    if (draft.text === applied.text) return;
    const timer = setTimeout(() => {
      setApplied(p => ({ ...p, text: draft.text }));
      setCurrentPage(1);
      setCursorHistory([null]);
      syncUrlFromDraft({ ...draft }, hideLinkedPRs);
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.text, applied.text, draft, hideLinkedPRs, syncUrlFromDraft]);

  const resetPagination = () => {
    setCurrentPage(1);
    setCursorHistory([null]);
  };

  const applyFiltersImmediate = useCallback((next: FilterDraft) => {
    setDraft(next);
    setApplied(next);
    resetPagination();
    syncUrlFromDraft(next, hideLinkedPRs);
  }, [hideLinkedPRs, syncUrlFromDraft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ ...draft });
    resetPagination();
    syncUrlFromDraft(draft, hideLinkedPRs);
    setFilterOpen(false);
  };

  const handleResetFilters = useCallback(() => {
    const resetDraft: FilterDraft = { ...EMPTY_FILTERS };
    setDraft(resetDraft);
    setApplied(resetDraft);
    setHideLinkedPRs(false);
    resetPagination();
    syncUrlFromDraft(resetDraft, false);
  }, [syncUrlFromDraft]);

  const handlePageChange = (page: number) => {
    if (page > currentPage && searchQuery.data?.endCursor) {
      const h = [...cursorHistory];
      h[currentPage] = searchQuery.data.endCursor;
      setCursorHistory(h);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedIssues = (hideLinkedPRs && !isGuest
    ? (searchQuery.data?.items ?? []).filter(i => i.prStatus.status === "safe")
    : (searchQuery.data?.items ?? [])).sort((a, b) => {
      let valA, valB;
      if (sort === "created") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sort === "updated") {
        valA = new Date(a.updatedAt).getTime();
        valB = new Date(b.updatedAt).getTime();
      } else if (sort === "stars") {
        valA = a.repository.stars;
        valB = b.repository.stars;
      } else {
        valA = a.comments;
        valB = b.comments;
      }
      return order === "asc" ? valA - valB : valB - valA;
    });

  const perPage = isGuest ? 10 : 20;
  const totalPages = searchQuery.data
    ? Math.min(50, Math.ceil(searchQuery.data.total_count / perPage))
    : 1;

  const rl = searchQuery.data?.rate_limit;
  const activeFilterCount = countActiveFilters(draft, hideLinkedPRs);

  return (
    <>
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


        {/* ── Hero row: h1+subline left, Quick Missions right ── */}
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

          <div className="gt-hero-missions">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gt-text-subtle)", whiteSpace: "nowrap" }}>
              🎯 Missions
            </span>
            <div className="gt-missions-strip">
              {[
                {
                  id: "galaxy-brain", emoji: "🧠", label: "Galaxy Brain", badge: "15 pts",
                  desc: "Unanswered Q&A discussions — earn Galaxy Brain badge",
                  onClick: () => {
                    const m: FilterDraft = { ...DEFAULT, contributionType: "discussion", activeMaintainer: true, labels: [] };
                    setDraft(m); setApplied(m); resetPagination(); syncUrlFromDraft(m, hideLinkedPRs);
                  },
                },
                {
                  id: "pair-extraordinaire", emoji: "🤝", label: "Pair Extraordinaire", badge: "New",
                  desc: "Issues asking for co-authors — earn Pair Extraordinaire badge",
                  onClick: () => {
                    const m: FilterDraft = { ...DEFAULT, pairingRequested: true, activeMaintainer: true, zeroComments: false };
                    setDraft(m); setApplied(m); resetPagination(); syncUrlFromDraft(m, hideLinkedPRs);
                  },
                },
                {
                  id: "pull-shark", emoji: "🦈", label: "Pull Shark", badge: "Fast",
                  desc: "Zero-comment, fresh issues — earn Pull Shark badge",
                  onClick: () => {
                    const m: FilterDraft = { ...DEFAULT, zeroComments: true, activeMaintainer: true, noAssignee: true };
                    setDraft(m); setApplied(m); resetPagination(); syncUrlFromDraft(m, hideLinkedPRs);
                  },
                },
              ].map(mission => (
                <button
                  key={mission.id}
                  id={`mission-${mission.id}`}
                  type="button"
                  onClick={mission.onClick}
                  title={mission.desc}
                  aria-label={`${mission.label}: ${mission.desc}`}
                  className="gt-mission-chip"
                >
                  <span aria-hidden="true">{mission.emoji}</span>
                  <span>{mission.label}</span>
                  <span className="gt-mission-badge">{mission.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`gt-filter-overlay${filterOpen ? " open" : ""}`}
          onClick={() => setFilterOpen(false)}
          aria-hidden="true"
        />

        <div className="gt-layout-grid">
          <aside className={`gt-filter-aside${filterOpen ? " open" : ""}`}>
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
              <FilterPanel
                draft={draft}
                setDraft={setDraft}
                onApplyImmediate={applyFiltersImmediate}
                onReset={handleResetFilters}
                hideLinkedPRs={hideLinkedPRs}
                setHideLinkedPRs={(v) => {
                  setHideLinkedPRs(v);
                  syncUrlFromDraft(draft, v);
                }}
                isGuest={isGuest}
                onSubmit={handleSubmit}
                isSearching={searchQuery.isFetching}
              />
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

              <div
                className="gt-results-search-bar"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "stretch",
                  gap: 12,
                  marginBottom: 16,
                  position: "sticky",
                  top: 61,       // header height (60px) + 1px border
                  zIndex: 10,    // above page content, below header (zIndex 40)
                  paddingBottom: 8,
                  paddingTop: 8,
                  background: "var(--gt-bg)",
                }}
              >
                <div style={{
                  display: "flex", gap: 4, padding: 4, position: "relative",
                  flex: "1 1 280px", maxWidth: 400,
                  background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                  borderRadius: 12, boxShadow: "var(--gt-shadow)",
                }}>
                  <div style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: draft.contributionType === "issue" ? 4 : "calc(50% + 2px)",
                    width: "calc(50% - 6px)",
                    background: "var(--gt-card-hover)",
                    border: "1px solid var(--gt-border)",
                    borderRadius: 9,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                    transition: "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    zIndex: 0,
                  }} />

                  {([
                    { val: "issue" as const, label: "💻 Code Issues", desc: "Contribute code to open source" },
                    { val: "discussion" as const, label: "🧠 Discussions", desc: "Answer Q&A for Galaxy Brain" },
                  ]).map(({ val, label, desc }) => {
                    const isActive = draft.contributionType === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        title={desc}
                        onClick={() => {
                          const updated = {
                            ...draft,
                            contributionType: val,
                            labels: val === "discussion" ? [] : draft.labels,
                            noAssignee: val === "discussion" ? false : draft.noAssignee,
                            activeMaintainer: val === "discussion" ? false : draft.activeMaintainer,
                            pairingRequested: val === "discussion" ? false : draft.pairingRequested,
                          };
                          const nextHideLinkedPRs = val === "discussion" ? false : hideLinkedPRs;
                          setDraft(updated);
                          setApplied(updated);
                          setHideLinkedPRs(nextHideLinkedPRs);
                          resetPagination();
                          syncUrlFromDraft(updated, nextHideLinkedPRs);
                        }}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: 9, fontSize: 13, fontWeight: isActive ? 700 : 500,
                          color: isActive ? "var(--gt-text)" : "var(--gt-text-muted)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: "color 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.1s ease",
                          whiteSpace: "nowrap",
                          zIndex: 1,
                          textAlign: "center",
                          position: "relative",
                        }}
                        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
                        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    flex: "2 1 240px",
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                    borderRadius: 10, padding: "8px 14px",
                    boxShadow: "var(--gt-shadow)",
                  }}
                >
                  <Search size={15} style={{ color: "var(--gt-text-subtle)", flexShrink: 0 }} />
                  <input
                    id="issue-search-input"
                    type="text"
                    aria-label={draft.contributionType === "discussion" ? "Search GitHub discussions" : "Search GitHub issues"}
                    placeholder={draft.contributionType === "discussion" ? "Search discussions…" : "Search issues…"}
                    value={draft.text}
                    onChange={e => setDraft(p => ({ ...p, text: e.target.value }))}
                    style={{
                      flex: 1, background: "none", border: "none", outline: "none",
                      fontSize: 14, color: "var(--gt-text)",
                    }}
                  />
                </form>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {([
                    { val: "created", label: "Newest" },
                    { val: "comments", label: "Most comments" },
                    { val: "stars", label: "Most stars" },
                    { val: "updated", label: "Updated" },
                  ] as const).map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => { setSort(val); }}
                      style={{
                        padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                        border: "1px solid",
                        background: sort === val ? "var(--gt-primary)" : "transparent",
                        borderColor: sort === val ? "var(--gt-primary)" : "var(--gt-border)",
                        color: sort === val ? "#fff" : "var(--gt-text-muted)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { const o = order === "desc" ? "asc" : "desc"; setOrder(o); }}
                  style={{
                    padding: "5px 10px", borderRadius: 20, fontSize: 13,
                    border: "1px solid var(--gt-border)", background: "transparent",
                    color: "var(--gt-text-muted)", cursor: "pointer",
                  }}
                >
                  {order === "desc" ? "↓ Desc" : "↑ Asc"}
                </button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 13, color: "var(--gt-text-subtle)" }}>
                  {(!mounted || searchQuery.isFetching) ? (
                    <span style={{ color: "var(--gt-primary)", fontWeight: 600 }}>
                      🔍 Scanning GitHub {applied.contributionType === "discussion" ? "discussions" : "issues"}…
                    </span>
                  ) : searchQuery.data ? (
                    `${searchQuery.data.total_count.toLocaleString()} ${applied.contributionType === "discussion" ? "discussions" : "issues"} found`
                    + (searchQuery.data.filtered_out ? ` · ${searchQuery.data.filtered_out} filtered` : "")
                  ) : ""}
                </span>
                {/* PR status legend toggle */}
                <button
                  onClick={() => setLegendOpen(v => !v)}
                  aria-expanded={legendOpen}
                  title="What do the PR status badges mean?"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: legendOpen ? "var(--gt-primary-glow)" : "transparent",
                    border: "1px solid var(--gt-border)",
                    borderRadius: 20, padding: "4px 10px",
                    fontSize: 12, fontWeight: 600,
                    color: legendOpen ? "var(--gt-primary-text)" : "var(--gt-text-subtle)",
                    cursor: "pointer", transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  ✅ ? Legend
                </button>
              </div>

              {/* Inline PR legend — only when toggled */}
              {legendOpen && (
                <div style={{ marginBottom: 16 }}>
                  <section aria-label="PR competition status labels" className="gt-pr-legend">
                    <div className="gt-pr-legend-card">
                      <div className="gt-pr-legend-label" style={{ color: "var(--gt-safe-text)", background: "var(--gt-safe-bg)", borderColor: "var(--gt-safe-border)" }}>
                        ✅ Available
                      </div>
                      <p className="gt-pr-legend-desc">No linked open PR — safer to pick up before you spend deep focus time.</p>
                    </div>
                    <div className="gt-pr-legend-card">
                      <div className="gt-pr-legend-label" style={{ color: "var(--gt-danger-text)", background: "var(--gt-danger-bg)", border: "1px solid var(--gt-danger-border)" }}>
                        ⚠️ Being Claimed
                      </div>
                      <p className="gt-pr-legend-desc">An open PR already references this — competition likely.</p>
                    </div>
                    <div className="gt-pr-legend-card">
                      <div className="gt-pr-legend-label" style={{ color: "var(--gt-warn-text)", background: "var(--gt-warn-bg)", border: "1px solid var(--gt-warn-border)" }}>
                        🔶 Work in Progress
                      </div>
                      <p className="gt-pr-legend-desc">Draft PR or branch started — proceed with caution.</p>
                    </div>
                  </section>
                  <p style={{ fontSize: 12, color: "var(--gt-text-subtle)", margin: "10px 0 0", lineHeight: 1.5 }}>
                    {SITE_AI_CONTEXT} {SITE_CAREER_HOOK}
                  </p>
                </div>
              )}

              {mounted && searchQuery.isError && (
                <div style={{
                  background: "var(--gt-danger-bg)", border: "1px solid var(--gt-danger-border)",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                  color: "var(--gt-danger-text)", fontSize: 13,
                }}>
                  Search failed. This could be a network issue or a GitHub API rate limit — please wait a moment and try again.
                </div>
              )}

              {mounted && !searchQuery.isFetching && searchQuery.data && displayedIssues.length === 0 && (
                <div style={{
                  border: "2px dashed var(--gt-border)", borderRadius: 12,
                  padding: "64px 24px", textAlign: "center",
                  color: "var(--gt-text-subtle)", fontSize: 15,
                }}>
                  No {applied.contributionType === "discussion" ? "discussions" : "issues"} match these filters. Try relaxing the criteria.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(!mounted || searchQuery.isFetching) ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skel-${i}`} style={{
                      background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                      borderRadius: 12, padding: "20px 20px",
                      animation: "gt-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      animationDelay: `${i * 0.1}s`,
                      display: "flex", flexDirection: "column", gap: 12
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--gt-border)", flexShrink: 0 }} />
                        <div style={{ width: `${30 + (i % 3) * 12}%`, height: 11, borderRadius: 4, background: "var(--gt-border)" }} />
                      </div>
                      <div style={{ width: `${65 + (i % 2) * 15}%`, height: 16, borderRadius: 4, background: "var(--gt-border)" }} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ width: 72, height: 20, borderRadius: 10, background: "var(--gt-border)" }} />
                        <div style={{ width: 88, height: 20, borderRadius: 10, background: "var(--gt-border)" }} />
                        {i % 2 === 0 && <div style={{ width: 56, height: 20, borderRadius: 10, background: "var(--gt-border)" }} />}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                        <div style={{ width: 48, height: 11, borderRadius: 4, background: "var(--gt-border)" }} />
                        <div style={{ width: 60, height: 11, borderRadius: 4, background: "var(--gt-border)" }} />
                        <div style={{ width: 40, height: 11, borderRadius: 4, background: "var(--gt-border)" }} />
                      </div>
                    </div>
                  ))
                ) : displayedIssues.length > 0 ? (
                  displayedIssues.map((issue, idx) => (
                    <IssueCard
                      key={`${issue.id}-${issue.number}-${idx}`}
                      issue={issue}
                      isGuest={isGuest}
                      appliedLabels={applied.labels}
                      animationDelay={idx * 0.05}
                    />
                  ))
                ) : null}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxAllowedPage={isGuest ? totalPages : Math.max(cursorHistory.length, currentPage + (searchQuery.data?.endCursor ? 1 : 0))}
              />
            </section>
          </div>
      </main>
    </>
  );
}

export function HomeClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", background: "var(--gt-bg)" }} />}>
      <HomeContent />
    </Suspense>
  );
}
