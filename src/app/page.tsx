"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
};

function initials(user: SessionUser) {
  if (user.name) return user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return user.login.slice(0, 2).toUpperCase();
}

export default function Home() {
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
  const isGuest = !sessionQuery.isLoading && sessionQuery.data === null;

  // Draft filters (local, not yet submitted)
  const [draft, setDraft] = useState<FilterDraft>(DEFAULT);
  const [hideLinkedPRs, setHideLinkedPRs] = useState(false);
  const [activeTab, setActiveTab] = useState<"issues" | "badges">("issues");

  const [sort, setSort] = useState<"created" | "updated" | "comments" | "stars">("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Applied = committed on submit, used in query key
  // Note: sort/order are NOT in the query key — sorting is client-side only
  const [applied, setApplied] = useState<FilterDraft>(DEFAULT);

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

  // Rate limit countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || waitlistLoading) return;

    setWaitlistLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setWaitlistSuccess(true);
      setWaitlistEmail("");
    } catch (err) {
      alert("Something went wrong. Please try again later.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    const resetTs = searchQuery.data?.rate_limit?.reset;
    if (!resetTs) return;
    const tick = () => {
      const s = Math.max(0, Math.round(resetTs - Date.now() / 1000));
      setCountdown(s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [searchQuery.data?.rate_limit?.reset]);
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ ...draft });
    setCurrentPage(1);
    setCursorHistory([null]);
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
    <div style={{ minHeight: "100vh", background: "var(--gt-bg)", display: "flex", flexDirection: "column" }}>
      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--gt-header-bg)",
        borderBottom: "1px solid var(--gt-header-border)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", gap: 32
        }}>

          {/* Logo + name */}
          <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            <img src="/logo-light.svg" alt="GitTrek" style={{ height: 42, width: 42, borderRadius: 10 }} />
            <h1 style={{ color: "var(--gt-primary)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", margin: 0 }}>
              GitTrek
            </h1>
          </div>

          {/* AEO/GEO Hidden Context Block */}
          <section className="sr-only">
            <h2>What is GitTrek?</h2>
            <p>
              GitTrek is a developer search engine and open source contribution tool.
              It helps developers find beginner-friendly GitHub issues ("good first issue"),
              track their pull request (PR) badges, and evaluate repository health.
              GitTrek prevents developers from wasting time on crowded issues by checking
              live PR competition before they start coding.
            </p>
          </section>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 4 }}>
            {([
              { key: "issues", label: "Find issues" },
              { key: "badges", label: "My badges" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "6px 16px",
                  fontSize: 14, fontWeight: 600,
                  color: activeTab === key ? "var(--gt-header-nav-active)" : "var(--gt-header-nav-inactive)",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: activeTab === key ? "2px solid var(--gt-primary)" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                  lineHeight: "28px",
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Rate limit */}
          {searchQuery.isLoading && !rl?.remaining ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
              borderRadius: 20, padding: "4px 12px", height: 26, width: 140,
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}>
              <div style={{ width: 40, height: 12, background: "var(--gt-border)", borderRadius: 4 }}></div>
              <div style={{ width: 50, height: 12, background: "var(--gt-border)", borderRadius: 4 }}></div>
            </div>
          ) : rl?.remaining != null ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--gt-header-rl-bg)", border: "1px solid var(--gt-header-rl-border)",
              borderRadius: 20, padding: "4px 12px", fontSize: 12,
            }}>
              <span style={{ color: "var(--gt-primary)", fontWeight: 700 }}>
                {rl.remaining}/{rl.limit}
              </span>
              <span style={{ color: "var(--gt-header-rl-text)" }}>searches</span>
              {countdown !== null && countdown > 0 && (
                <>
                  <span style={{ color: "var(--gt-text-subtle)" }}>·</span>
                  <span style={{ color: "var(--gt-header-rl-text)", fontFamily: "var(--font-mono)" }}>
                    {countdown}s
                  </span>
                </>
              )}
            </div>
          ) : null}

          {/* User */}
          {sessionQuery.data ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {sessionQuery.data.avatarUrl ? (
                <img
                  src={sessionQuery.data.avatarUrl}
                  alt={sessionQuery.data.login}
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--gt-border)" }}
                />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "var(--gt-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {initials(sessionQuery.data)}
                </div>
              )}
              <button
                onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--gt-header-nav-inactive)", fontSize: 13, padding: 0
                }}
              >
                Sign out
              </button>
            </div>
          ) : !sessionQuery.isLoading ? (
            <button
              onClick={() => { window.location.href = "/api/auth/login"; }}
              style={{
                background: "var(--gt-primary)", color: "#fff", border: "none",
                borderRadius: 20, padding: "7px 18px", fontSize: 14, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
          ) : null}
        </div>
      </header>

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

        {isGuest && activeTab === "issues" && (
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

        {/* ── MY BADGES TAB ── */}
        {activeTab === "badges" && (() => {
          const BADGES = [
            { icon: "🦈", name: "Pull Shark", desc: "Opened a pull request that has been merged", progress: 67, tier: "×2", color: "#3B82F6" },
            { icon: "⚡", name: "YOLO", desc: "Merged a pull request without a review", progress: 100, tier: "x1", color: "#8B5CF6" },
            { icon: "🌟", name: "Starstruck", desc: "Created a repository that has 16+ stars", progress: 45, tier: "Silver", color: "#F59E0B" },
            { icon: "🧠", name: "Galaxy Brain", desc: "Answered a discussion with a marked answer", progress: 20, tier: "Bronze", color: "#10B981" },
            { icon: "⚡", name: "Quickdraw", desc: "Closed an issue or PR within 5 minutes of opening", progress: 0, tier: "Locked", color: "#6B7280" },
            { icon: "👥", name: "Pair Extraordinaire", desc: "Co-authored commits on merged pull requests", progress: 0, tier: "Locked", color: "#6B7280" },
          ];
          return (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {/* Hero */}
              <div style={{ textAlign: "center", padding: "40px 24px 32px", marginBottom: 8 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "var(--gt-primary-glow)", border: "1px solid rgba(249,115,22,0.25)",
                  borderRadius: 20, padding: "5px 16px", marginBottom: 20,
                }}>
                  <span style={{ fontSize: 12, color: "var(--gt-primary)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    ✨ Coming Soon
                  </span>
                </div>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--gt-text)", margin: "0 0 12px", lineHeight: 1.2 }}>
                  Track Your GitHub Badges
                </h2>
                <p style={{ fontSize: 16, color: "var(--gt-text-muted)", margin: "0 auto", maxWidth: 480, lineHeight: 1.7 }}>
                  Connect your GitHub account to automatically track badge progress, see how many PRs until your next tier, and get notified when you level up.
                </p>
              </div>

              {/* Badge grid — partially revealed with blur on bottom two */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {BADGES.map((badge, i) => {
                    const isLocked = badge.tier === "Locked";
                    const blurred = i >= 4;
                    return (
                      <div
                        key={badge.name}
                        style={{
                          background: "var(--gt-card)",
                          border: `1px solid ${isLocked ? "var(--gt-border)" : badge.color + "40"}`,
                          borderRadius: 16,
                          padding: "20px",
                          filter: blurred ? "blur(4px)" : "none",
                          opacity: isLocked ? 0.6 : 1,
                          transition: "transform 0.2s, box-shadow 0.2s",
                          boxShadow: isLocked ? "none" : `0 4px 20px ${badge.color}18`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <span style={{ fontSize: 36, lineHeight: 1 }}>{badge.icon}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                            background: isLocked ? "var(--gt-card-hover)" : badge.color + "20",
                            color: isLocked ? "var(--gt-text-subtle)" : badge.color,
                            border: `1px solid ${isLocked ? "var(--gt-border)" : badge.color + "40"}`,
                          }}>
                            {isLocked ? "🔒 Locked" : badge.tier}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--gt-text)", margin: "0 0 6px" }}>{badge.name}</h3>
                        <p style={{ fontSize: 12, color: "var(--gt-text-subtle)", margin: "0 0 14px", lineHeight: 1.5 }}>{badge.desc}</p>
                        {!isLocked && (
                          <>
                            <div style={{
                              height: 5, background: "var(--gt-border)", borderRadius: 3, overflow: "hidden", marginBottom: 6,
                            }}>
                              <div style={{
                                height: "100%", borderRadius: 3,
                                background: badge.color,
                                width: `${badge.progress}%`,
                                transition: "width 1s ease",
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: "var(--gt-text-subtle)" }}>{badge.progress}% to next tier</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Gradient fade + CTA over bottom row */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
                  background: "linear-gradient(to bottom, transparent, var(--gt-bg) 80%)",
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  paddingBottom: 24,
                }}>
                  <div style={{
                    background: "var(--gt-card)", border: "1px solid var(--gt-border)",
                    borderRadius: 16, padding: "20px 32px", textAlign: "center",
                    boxShadow: "var(--gt-shadow-hover)",
                    backdropFilter: "blur(8px)",
                  }}>
                    {waitlistSuccess ? (
                      <div style={{ padding: "10px 0" }}>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--gt-primary)", fontWeight: 600 }}>
                          ✨ You're on the list!
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--gt-text-subtle)" }}>
                          We'll notify you as soon as we're ready.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--gt-text)" }}>
                          Get notified when we launch
                        </p>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--gt-text-muted)" }}>
                          Join <strong style={{ color: "var(--gt-primary)" }}>2,400+ developers</strong> on the waitlist.
                        </p>
                        <form
                          onSubmit={handleWaitlistSubmit}
                          style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}
                        >
                          <input
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={waitlistEmail}
                            onChange={e => setWaitlistEmail(e.target.value)}
                            disabled={waitlistLoading}
                            style={{
                              flex: "1 1 240px", padding: "10px 14px", borderRadius: 8,
                              border: "1px solid var(--gt-border)", background: "var(--gt-bg)",
                              color: "var(--gt-text)", fontSize: 14, outline: "none",
                              opacity: waitlistLoading ? 0.6 : 1,
                              minWidth: 0
                            }}
                          />
                          <button
                            type="submit"
                            disabled={waitlistLoading}
                            style={{
                              flex: "0 0 auto",
                              background: "var(--gt-primary)", color: "#fff", border: "none",
                              borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: waitlistLoading ? "default" : "pointer",
                              whiteSpace: "nowrap", opacity: waitlistLoading ? 0.6 : 1,
                              boxShadow: "0 2px 4px rgba(255, 122, 0, 0.2)"
                            }}
                          >
                            {waitlistLoading ? "Joining..." : "Get Early Access"}
                          </button>
                        </form>

                      </>
                    )}

                  </div>
                </div>
              </div>
            </div>
          );
        })()}


        {/* ── FIND ISSUES TAB ── */}
        {activeTab === "issues" && (
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
                    type="text"
                    placeholder="Search keywords..."
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
                  {searchQuery.isFetching ? (
                    <span style={{ color: "var(--gt-primary)" }}>Loading via GraphQL…</span>
                  ) : searchQuery.data ? (
                    `${searchQuery.data.total_count.toLocaleString()} issues found`
                    + (searchQuery.data.filtered_out ? ` · ${searchQuery.data.filtered_out} filtered` : "")
                  ) : "Run a search"}
                </span>
              </div>

              {/* Error */}
              {searchQuery.isError && (
                <div style={{
                  background: "var(--gt-danger-bg)", border: "1px solid var(--gt-danger-border)",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                  color: "var(--gt-danger-text)", fontSize: 13,
                }}>
                  Search failed. Rate limit may have been hit — wait a minute and try again.
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
                  displayedIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} isGuest={isGuest} appliedLabels={applied.labels} />
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
    </div>
  );
}
