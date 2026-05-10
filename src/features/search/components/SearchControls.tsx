"use client";

import { Search } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { useUrlSync } from "../hooks/useUrlSync";

export function SearchControls() {
  const { 
    draft, setDraft, 
    setApplied, 
    setCurrentPage, 
    setCursorHistory, 
    hideLinkedPRs, setHideLinkedPRs 
  } = useSearch();
  const { syncUrlFromDraft } = useUrlSync();

  const resetPagination = () => {
    setCurrentPage(1);
    setCursorHistory([null]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = { ...draft };
    
    // Limits handled here for the text input submit as well just to be safe
    const minStars = Math.max(0, Math.min(draft.minStars, 100000));
    const maxStars = draft.maxStars === null ? null : Math.max(0, Math.min(draft.maxStars, 100000));
    if (maxStars !== null && minStars > maxStars) {
      sanitized.minStars = maxStars;
      sanitized.maxStars = minStars;
    } else {
      sanitized.minStars = minStars;
      sanitized.maxStars = maxStars;
    }
    
    const minForks = Math.max(0, Math.min(draft.minForks, 50000));
    const maxForks = draft.maxForks === null ? null : Math.max(0, Math.min(draft.maxForks, 50000));
    if (maxForks !== null && minForks > maxForks) {
      sanitized.minForks = maxForks;
      sanitized.maxForks = minForks;
    } else {
      sanitized.minForks = minForks;
      sanitized.maxForks = maxForks;
    }

    setDraft(sanitized);
    setApplied(sanitized);
    resetPagination();
    syncUrlFromDraft(sanitized, hideLinkedPRs);
  };

  return (
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
              data-testid={`tab-${val}`}
              onClick={() => {
                const updated = {
                  ...draft,
                  contributionType: val,
                  labels: val === "discussion" ? [] : draft.labels,
                  languages: draft.languages,
                  text: draft.text,
                  activeMaintainer: draft.activeMaintainer,
                  noAssignee: val === "discussion" ? false : draft.noAssignee,
                  pairingRequested: val === "discussion" ? false : draft.pairingRequested,
                };
                setDraft(updated);
                setApplied(updated);
                resetPagination();
                syncUrlFromDraft(updated, hideLinkedPRs);
                if (val === "discussion") setHideLinkedPRs(false);
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
  );
}
