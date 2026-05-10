"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "../context/SearchContext";
import { IssueCard, IssueItem } from "../../../components/IssueCard";
import { Pagination } from "../../../components/Pagination";
import { SITE_AI_CONTEXT, SITE_CAREER_HOOK } from "../../../lib/site-copy";

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

export function ResultsFeed() {
  const { 
    applied, 
    currentPage, setCurrentPage,
    cursorHistory, setCursorHistory,
    sort, setSort,
    order, setOrder,
    hideLinkedPRs,
    setIsSearching
  } = useSearch();

  const [legendOpen, setLegendOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const isGuest = mounted && !sessionQuery.isLoading && sessionQuery.data === null;
  const cursor = cursorHistory[currentPage - 1] ?? null;

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ["search", applied, currentPage, cursor, sort, order, sessionQuery.data?.login ?? null],
    queryFn: async () => {
      const perPage = isGuest ? 10 : 20;
      const r = await fetch("/api/github/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...applied,
          sort,
          order,
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

  // Keep global context aware of searching state so buttons can be disabled
  useEffect(() => {
    setIsSearching(searchQuery.isFetching);
  }, [searchQuery.isFetching, setIsSearching]);


  const resetPagination = () => {
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

  return (
    <>
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
              onClick={() => { setSort(val); resetPagination(); }}
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

      {mounted && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          maxAllowedPage={isGuest ? totalPages : Math.max(cursorHistory.length, currentPage + (searchQuery.data?.endCursor ? 1 : 0))}
        />
      )}
    </>
  );
}
