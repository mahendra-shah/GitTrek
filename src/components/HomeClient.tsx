"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { IssueCard, IssueItem } from "@/components/IssueCard";
import { FilterPanel, FilterDraft } from "@/components/FilterPanel";
import { Pagination } from "@/components/Pagination";

type SearchResponse = {
  total_count: number;
  filtered_out: number;
  items: IssueItem[];
  hasMore: boolean;
  endCursor: string | null;
  warnings: string[];
  rate_limit: { limit: number | null; remaining: number | null; reset: number | null } | null;
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

function HomeContent() {
  // Session
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

  useEffect(() => {
    // Clear URL parameters immediately after initial hydration
    // so they don't stay in the browser URL bar (User request)
    if (searchParams && searchParams.toString().length > 0) {
      window.history.replaceState(null, "", "/");
    }
  }, [searchParams]);

  // Parse initial state from URL if present (supports "The Loop" CTAs)
  const [draft, setDraft] = useState<FilterDraft>(() => {
    if (!searchParams) return DEFAULT;
    const fromUrl: FilterDraft = { ...DEFAULT };
    if (searchParams.has("labels")) fromUrl.labels = searchParams.get("labels")!.split(",");
    if (searchParams.has("noAssignee")) fromUrl.noAssignee = searchParams.get("noAssignee") === "true";
    if (searchParams.has("zeroComments")) fromUrl.zeroComments = searchParams.get("zeroComments") === "true";
    if (searchParams.has("discussions")) fromUrl.text = "is:discussion"; // Galaxy brain map
    return fromUrl;
  });
  
  const [hideLinkedPRs, setHideLinkedPRs] = useState(() => searchParams?.get("hideLinkedPRs") === "true");



  const [sort, setSort] = useState<"created" | "updated" | "comments" | "stars">("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Applied = committed on submit, used in query key
  // Note: sort/order are NOT in the query key — sorting is client-side only
  const [applied, setApplied] = useState<FilterDraft>(draft);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);

  const cursor = cursorHistory[currentPage - 1] ?? null;

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ["search", applied, currentPage, cursor],
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
          // Discussions don't use labels the same way
          labels: applied.contributionType === "discussion" ? [] : applied.labels,
          perPage,
          page: currentPage,
          cursor,
        }),
      });
      if (!r.ok) throw new Error("search_failed");
      return r.json();
    },
    enabled: !sessionQuery.isLoading,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    // Sync the local search API rate limit up to the global cache for the Header to display
    const rl = searchQuery.data?.rate_limit;
    if (rl && rl.limit) {
      queryClient.setQueryData(["rateLimit"], (old: any) => ({
        ...old,
        activeSearchLimit: rl,
      }));
    }
  }, [searchQuery.data?.rate_limit, queryClient]);

  // Auto-submit search when keywords change (debounced)
  useEffect(() => {
    if (draft.text === applied.text) return;
    const timer = setTimeout(() => {
      setApplied(p => ({ ...p, text: draft.text }));
      setCurrentPage(1);
      setCursorHistory([null]);
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.text, applied.text]);
  const resetPagination = () => {
    setCurrentPage(1);
    setCursorHistory([null]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ ...draft });
    resetPagination();
  };

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

  return (
    <>
      {/* ── SUBHEADER SLOGAN ── */}
      <div style={{
        background: "var(--gt-card)", borderBottom: "1px solid var(--gt-border)",
        padding: "8px 24px", textAlign: "center", fontSize: 11, fontWeight: 700,
        color: "var(--gt-text-subtle)", letterSpacing: "0.1em", textTransform: "uppercase"
      }}>
        Find Issues <span style={{ color: "var(--gt-primary)", margin: "0 6px" }}>·</span> Track Badges <span style={{ color: "var(--gt-primary)", margin: "0 6px" }}>·</span> Contribute
      </div>

      {/* ── BODY ── */}
      <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 24px" }}>

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
          </div>
        )}


        {/* ── 🎯 MISSIONS BAR ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gt-text-subtle)", margin: 0 }}>
              🎯 Quick Missions
            </h2>
            <span style={{ fontSize: 11, color: "var(--gt-text-muted)" }}>— 1-click badge hunting mode</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                id: "galaxy-brain",
                emoji: "🧠", label: "Galaxy Brain", badge: "15 pts",
                desc: "Unanswered Q&A discussions",
                onClick: () => {
                  const m: FilterDraft = { ...DEFAULT, contributionType: "discussion", activeMaintainer: true, labels: [] };
                  setDraft(m); setApplied(m); resetPagination();
                },
              },
              {
                id: "pair-extraordinaire",
                emoji: "🤝", label: "Pair Extraordinaire", badge: "New",
                desc: "Issues asking for co-authors",
                onClick: () => {
                  const m: FilterDraft = { ...DEFAULT, pairingRequested: true, activeMaintainer: true, zeroComments: false };
                  setDraft(m); setApplied(m); resetPagination();
                },
              },
              {
                id: "pull-shark",
                emoji: "🦈", label: "Pull Shark", badge: "Fast",
                desc: "Zero-comment, fresh issues",
                onClick: () => {
                  const m: FilterDraft = { ...DEFAULT, zeroComments: true, activeMaintainer: true, noAssignee: true };
                  setDraft(m); setApplied(m); resetPagination();
                },
              },
            ].map(mission => (
              <button
                key={mission.id}
                id={`mission-${mission.id}`}
                type="button"
                onClick={mission.onClick}
                className="gt-mission-shimmer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 14px", borderRadius: 12,
                  border: "1px solid var(--gt-border)",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: "var(--gt-shadow)",
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-primary)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--gt-shadow-hover), 0 0 0 1px rgba(249,115,22,0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-border)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--gt-shadow)";
                }}
              >
                <span style={{ fontSize: 22 }}>{mission.emoji}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gt-text)" }}>{mission.label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                      background: "var(--gt-primary-glow)", color: "var(--gt-primary)",
                      border: "1px solid rgba(249,115,22,0.25)",
                    }}>{mission.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gt-text-muted)" }}>{mission.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FIND ISSUES TAB ── */}
        {(
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
            {/* Sidebar */}
            <aside>
              <div style={{
                position: "sticky", top: 80,
                background: "var(--gt-sidebar)", border: "1px solid var(--gt-border)",
                borderRadius: 16, padding: 24,
                boxShadow: "var(--gt-shadow)",
                maxHeight: "calc(100vh - 100px)", overflowY: "auto"
              }}>
                <FilterPanel
                  draft={draft}
                  setDraft={setDraft}
                  hideLinkedPRs={hideLinkedPRs}
                  setHideLinkedPRs={setHideLinkedPRs}
                  isGuest={isGuest}
                  onSubmit={handleSubmit}
                  isSearching={searchQuery.isFetching}
                />
              </div>
            </aside>

            {/* Results */}
            <section>
              {/* Results header */}
              {/* Contribution Type Toggle with Elastic Spring Effect */}
              <div style={{ display: "flex", marginBottom: 16 }}>
                <div style={{
                  display: "flex", gap: 4, padding: 4, position: "relative", width: 340,
                  background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                  borderRadius: 12, boxShadow: "var(--gt-shadow)",
                }}>
                  {/* Absolute positioned background highlight with elastic spring overshoot */}
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
                          const updated = { ...draft, contributionType: val, labels: val === "discussion" ? [] : draft.labels };
                          setDraft(updated);
                          setApplied(updated);
                          resetPagination();
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
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {/* Search within results */}
                <form
                  onSubmit={handleSubmit}
                  style={{
                    flex: 1, minWidth: 200,
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

              {/* Sort pills + count row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
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
                  {!mounted ? (
                    "Run a search"
                  ) : searchQuery.isFetching ? (
                    <span style={{ color: "var(--gt-primary)" }}>Loading via GraphQL…</span>
                  ) : searchQuery.data ? (
                    `${searchQuery.data.total_count.toLocaleString()} ${applied.contributionType === "discussion" ? "discussions" : "issues"} found`
                    + (searchQuery.data.filtered_out ? ` · ${searchQuery.data.filtered_out} filtered` : "")
                  ) : "Run a search"}
                </span>
              </div>

              {/* Error — distinguish between rate limit and other failures */}
              {searchQuery.isError && (
                <div style={{
                  background: "var(--gt-danger-bg)", border: "1px solid var(--gt-danger-border)",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                  color: "var(--gt-danger-text)", fontSize: 13,
                }}>
                  Search failed. This could be a network issue or a GitHub API rate limit — please wait a moment and try again.
                </div>
              )}

              {/* Empty state */}
              {!searchQuery.isFetching && searchQuery.data && displayedIssues.length === 0 && (
                <div style={{
                  border: "2px dashed var(--gt-border)", borderRadius: 12,
                  padding: "64px 24px", textAlign: "center",
                  color: "var(--gt-text-subtle)", fontSize: 15,
                }}>
                  No issues match these filters. Try relaxing the criteria.
                </div>
              )}

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {searchQuery.isFetching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skel-${i}`} style={{
                      background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                      borderRadius: 12, padding: "24px 20px", height: 140,
                      animation: "gt-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      display: "flex", flexDirection: "column", gap: 16
                    }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 8, background: "var(--gt-border)" }} />
                        <div style={{ width: "60%", height: 16, borderRadius: 4, background: "var(--gt-border)" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ width: 60, height: 20, borderRadius: 10, background: "var(--gt-border)" }} />
                        <div style={{ width: 80, height: 20, borderRadius: 10, background: "var(--gt-border)" }} />
                      </div>
                    </div>
                  ))
                ) : displayedIssues.length > 0 ? (
                  displayedIssues.map((issue, idx) => (
                    <IssueCard key={`${issue.id}-${issue.number}-${idx}`} issue={issue} isGuest={isGuest} appliedLabels={applied.labels} />
                  ))
                ) : null}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxAllowedPage={isGuest ? totalPages : Math.max(cursorHistory.length, currentPage + (searchQuery.data?.endCursor ? 1 : 0))}
              />
            </section>
          </div>
        )}
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
