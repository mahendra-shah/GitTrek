import { Star, GitFork, MessageSquare, Clock, CheckSquare } from "lucide-react";

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
    <span title="Sign in to unlock live PR competition checks" style={{ background: "var(--gt-card-hover)", color: "var(--gt-text-subtle)", borderColor: "var(--gt-border)" }} className={base}>
      Sign in for PR check
    </span>
  );
  if (s.status === "checking") return (
    <span style={{ background: "var(--gt-card-hover)", color: "var(--gt-text-subtle)", borderColor: "var(--gt-border)" }} className={`${base} animate-pulse`}>
      Checking...
    </span>
  );
  if (s.status === "safe") return (
    <span title="No linked branches or open PRs found. High chance this is available!" style={{ background: "var(--gt-safe-bg)", color: "var(--gt-safe-text)", borderColor: "var(--gt-safe-border)" }} className={base}>
      ✓ Safe to claim
    </span>
  );
  if (s.status === "open_pr") return (
    <span title="Someone has already opened a PR for this issue" style={{ background: "var(--gt-danger-bg)", color: "var(--gt-danger-text)", borderColor: "var(--gt-danger-border)" }} className={base}>
      Active PR exists
    </span>
  );
  if (s.status === "draft_pr") return (
    <span title="Someone is working on a Draft PR for this issue" style={{ background: "var(--gt-warn-bg)", color: "var(--gt-warn-text)", borderColor: "var(--gt-warn-border)" }} className={base}>
      Draft PR exists
    </span>
  );
  if (s.status === "linked_branch") return (
    <span title="A developer has linked a branch but hasn't opened a PR yet" style={{ background: "var(--gt-warn-bg)", color: "var(--gt-warn-text)", borderColor: "var(--gt-warn-border)" }} className={base}>
      Branch in progress
    </span>
  );
  return (
    <span title="Status currently unknown" style={{ background: "var(--gt-card-hover)", color: "var(--gt-text-subtle)", borderColor: "var(--gt-border)" }} className={base}>
      Unknown
    </span>
  );
}


export function IssueCard({ issue, isGuest, appliedLabels = [] }: { issue: IssueItem; isGuest?: boolean; appliedLabels?: string[] }) {
  const hasRepoData = issue.repository.stars > 0 || issue.repository.forks > 0;

  return (
    <article
      style={{
        background: "var(--gt-card)",
        border: "1px solid var(--gt-border)",
        boxShadow: "var(--gt-shadow)",
        borderRadius: 12,
        padding: "20px 24px",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--gt-shadow-hover)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-border-strong)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--gt-shadow)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--gt-border)";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Repo name */}
          <a
            href={issue.repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--gt-text-muted)", fontSize: 12, fontWeight: 500 }}
            className="hover:underline"
          >
            {issue.repository.fullName}
          </a>

          {/* Title */}
          <h4 style={{ margin: "6px 0 12px", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
          </h4>

          {/* Labels */}
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

          {/* Stats row */}
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

        {/* PR badge */}
        <div className="flex-shrink-0 pt-1">
          <PRBadge s={issue.prStatus} />
        </div>
      </div>
    </article>
  );
}
