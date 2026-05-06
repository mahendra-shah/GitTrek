/** Viewer engagement on a search result (issues / discussions). Server-populated when logged in. */

export type ViewerEngagementReason = "authored" | "assigned" | "openedPR" | "upvoted" | "commented";

export type ViewerSummary = {
  engaged: boolean;
  reasons: ViewerEngagementReason[];
};

export function formatViewerReasons(reasons: ViewerEngagementReason[]): string {
  const labels: Record<ViewerEngagementReason, string> = {
    authored: "you authored this",
    assigned: "you are assigned",
    openedPR: "your PR is linked",
    upvoted: "you upvoted",
    commented: "you commented",
  };
  return reasons.map((r) => labels[r]).join(", ");
}
