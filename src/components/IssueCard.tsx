import { Star, GitFork, MessageSquare, Clock, CheckSquare } from "lucide-react";
import { formatViewerReasons, type ViewerSummary } from "@/lib/viewer-summary";

export type PRStatus = {
  status: "safe" | "open_pr" | "draft_pr" | "linked_branch" | "checking" | "error" | "guest";
  openPrCount: number;
  draftPrCount: number;
  linkedBranches: number;
};

export type IssueItem = {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  comments: number;
  labels: string[];
  owner: string;
  repo: string;
  repository: {
    fullName: string;
    htmlUrl: string;
    stars: number;
    forks: number;
    pushedAt: string;
    isFork: boolean;
    ownerType?: string;
  };
  tasks: { completed: number; total: number } | null;
  prStatus: PRStatus;
  isDiscussion?: boolean;
  /** Present when signed in — whether you already engaged with this issue/discussion */
  viewer?: ViewerSummary | null;
};

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function PRBadge({ s }: { s: PRStatus }) {
  const base = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border";
  if (s.status === "guest") return (
    <button
      title="Sign in with GitHub to see if this issue is already being claimed"
      onClick={() => { window.location.href = "/api/auth/login"; }}
      style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
        background: "none", border: "none", padding: 0, cursor: "pointer",
      }}
    >
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "var(--gt-safe-bg)", color: "var(--gt-safe-text)",
          borderColor: "var(--gt-safe-border)",
          filter: "blur(4px) grayscale(0.5)",
          userSelect: "none", pointerEvents: "none",
        }}
        className={base}
      >
        ✅ Available
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, color: "var(--gt-primary)",
        letterSpacing: "0.02em", whiteSpace: "nowrap",
      }}>
        🔒 Sign in to unlock
      </span>
    </button>
  );
  if (s.status === "checking") return (
    <span style={{ background: "var(--gt-card-hover)", color: "var(--gt-text-subtle)", borderColor: "var(--gt-border)" }} className={`${base} animate-pulse`}>
      Checking…
    </span>
  );
  if (s.status === "safe") return (
    <span title="No one has opened a pull request for this issue yet — it's yours to claim!" style={{ background: "var(--gt-safe-bg)", color: "var(--gt-safe-text)", borderColor: "var(--gt-safe-border)" }} className={base}>
      ✅ Available
    </span>
  );
  if (s.status === "open_pr") return (
    <span title="Someone has already opened a pull request for this issue — you'd be competing." style={{ background: "var(--gt-danger-bg)", color: "var(--gt-danger-text)", borderColor: "var(--gt-danger-border)" }} className={base}>
      ⚠️ Being Claimed
    </span>
  );
  if (s.status === "draft_pr") return (
    <span title="Someone is working on a draft pull request — they may not finish it, but proceed with caution." style={{ background: "var(--gt-warn-bg)", color: "var(--gt-warn-text)", borderColor: "var(--gt-warn-border)" }} className={base}>
      🔶 Work in Progress
    </span>
  );
  if (s.status === "linked_branch") return (
    <span title="A developer has created a branch for this issue but hasn't opened a PR yet." style={{ background: "var(--gt-warn-bg)", color: "var(--gt-warn-text)", borderColor: "var(--gt-warn-border)" }} className={base}>
      🔀 Branch Started
    </span>
  );
  return (
    <span title="Status currently unknown" style={{ background: "var(--gt-card-hover)", color: "var(--gt-text-subtle)", borderColor: "var(--gt-border)" }} className={base}>
      Unknown
    </span>
  );
}


export function IssueCard({ issue, isGuest, appliedLabels = [], animationDelay = 0 }: { issue: IssueItem; isGuest?: boolean; appliedLabels?: string[]; animationDelay?: number }) {
  const hasRepoData = issue.repository.stars > 0 || issue.repository.forks > 0;
  const isDiscussion = !!issue.isDiscussion;

  // Unicorn Opportunity = zero comments + no assignee (implied by being in results) + active repo
  const repoAgeDays = issue.repository.pushedAt
    ? Math.floor((Date.now() - new Date(issue.repository.pushedAt).getTime()) / 86400000)
    : 999;
  const isUnicorn = issue.comments === 0 && repoAgeDays <= 14;

  // Days since repo was last pushed
  const repoLastActiveText = repoAgeDays === 0
    ? "active today"
    : repoAgeDays === 1
    ? "active yesterday"
    : repoAgeDays <= 30
    ? `active ${repoAgeDays}d ago`
    : null;
  const viewerHint = issue.viewer?.engaged ? formatViewerReasons(issue.viewer.reasons) : "";

  return (
    <article
      className="gt-card-interactive gt-result-card"
      style={{
        background: "var(--gt-card)",
        border: "1px solid var(--gt-border)",
        boxShadow: "var(--gt-shadow)",
        borderRadius: 12,
        padding: "20px 24px",
        animationDelay: `${animationDelay}s`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a
            href={issue.repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--gt-text-muted)", fontSize: 12, fontWeight: 500 }}
            className="hover:underline"
          >
            {issue.repository.fullName}
          </a>
          {issue.viewer?.engaged && (
            <span
              title={`You're involved: ${viewerHint}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginLeft: 8,
                gap: 4,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 5,
                background: "rgba(99,102,241,0.10)",
                color: "#6366f1",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              👋 You engaged
            </span>
          )}
          {repoLastActiveText && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700,
              marginLeft: 8, padding: "1px 7px", borderRadius: 5,
              background: repoAgeDays <= 7 ? "rgba(34,197,94,0.10)" : "rgba(99,102,241,0.08)",
              color: repoAgeDays <= 7 ? "#16a34a" : "#6366f1",
              border: `1px solid ${repoAgeDays <= 7 ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.2)"}`,
            }}>
              {repoAgeDays <= 7 ? "🟢" : "🔵"} {repoLastActiveText}
            </span>
          )}

          <h3 style={{ margin: "6px 0 12px", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontWeight: 700, fontSize: 16 }}>
            {isDiscussion && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5,
                background: "rgba(99,102,241,0.10)", color: "#6366f1",
                border: "1px solid rgba(99,102,241,0.25)", letterSpacing: "0.04em",
              }}>💬 DISCUSSION</span>
            )}
            {isUnicorn && (
              <span title={isDiscussion ? "Unicorn Opportunity: zero comments, fresh discussion — be the first to answer!" : "Unicorn Opportunity: zero comments, fresh repo — grab it fast!"} style={{
                fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5,
                background: "rgba(249,115,22,0.10)", color: "var(--gt-primary)",
                border: "1px solid rgba(249,115,22,0.3)", letterSpacing: "0.04em",
                animation: "gt-unicorn-pulse 2s ease-in-out infinite",
              }}>🦄 UNICORN</span>
            )}
            <a
              href={issue.htmlUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--gt-text)", fontSize: 16, fontWeight: 700, textDecoration: "none" }}
              className="hover:underline"
            >
              {issue.title}
            </a>
            <span style={{ color: "var(--gt-text-subtle)", fontSize: 15, fontWeight: 400 }}>
              #{issue.number}
            </span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {issue.labels.slice(0, 5).map((label, i) => {
              const isApplied = appliedLabels.length > 0 
                ? appliedLabels.some(al => al.toLowerCase() === label.toLowerCase())
                : ["good first issue", "help wanted"].includes(label.toLowerCase());

              return (
                <span
                  key={label}
                  style={isApplied ? {
                    background: "var(--gt-primary-glow)",
                    color: "var(--gt-primary)",
                    border: "1px solid rgba(249,115,22,0.25)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                  } : {
                    background: "transparent",
                    color: "var(--gt-text-muted)",
                    border: "1px solid var(--gt-border-strong)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4" style={{ fontSize: 13, color: "var(--gt-text-muted)" }}>
            {hasRepoData ? (
              <>
                <span className="flex items-center gap-1" title="Repository Stars">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  {fmt(issue.repository.stars)}
                </span>
                <span className="flex items-center gap-1" style={{ color: "var(--gt-text-subtle)" }}>·</span>
                <span className="flex items-center gap-1" title="Repository Forks">
                  <GitFork size={13} />
                  {fmt(issue.repository.forks)}
                </span>
                <span style={{ color: "var(--gt-text-subtle)" }}>·</span>
              </>
            ) : isGuest ? (
              <span style={{ color: "var(--gt-text-subtle)", fontSize: 12 }}>Sign in to see repo stats</span>
            ) : null}
            <span className="flex items-center gap-1" title="Comments on issue">
              <MessageSquare size={13} />
              {issue.comments} {issue.comments === 1 ? "comment" : "comments"}
            </span>
            <span style={{ color: "var(--gt-text-subtle)" }}>·</span>
            <span className="flex items-center gap-1" title="Issue created date">
              <Clock size={13} />
              {ago(issue.createdAt)}
            </span>
            {issue.tasks && issue.tasks.total > 0 && (
              <>
                <span style={{ color: "var(--gt-text-subtle)" }}>·</span>
                <span className="flex items-center gap-1" title="Markdown task list completion status" style={{
                  background: "var(--gt-card-hover)", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600
                }}>
                  <CheckSquare size={11} style={{ color: "var(--gt-safe-text)" }} />
                  {issue.tasks.completed} / {issue.tasks.total}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 pt-1">
          {!isDiscussion && <PRBadge s={issue.prStatus} />}
          {isDiscussion && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "rgba(99,102,241,0.08)", color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6,
              padding: "4px 10px", fontSize: 11, fontWeight: 700,
            }}>🧠 Answer it</span>
          )}
        </div>
      </div>
    </article>
  );
}
