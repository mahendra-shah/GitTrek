"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxAllowedPage?: number;
};

export function Pagination({ currentPage, totalPages, onPageChange, maxAllowedPage = totalPages }: Props) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pages = getPages();
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 36, minWidth: 36, padding: "0 10px",
    background: "var(--gt-card)",
    border: "1px solid var(--gt-border)", borderRadius: 8,
    cursor: "pointer", color: "var(--gt-text)",
    fontSize: 14, fontWeight: 600,
  };

  return (
    <nav aria-label="Pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0", gap: 8 }}>
      {currentPage > 3 && (
        <button
          onClick={() => onPageChange(1)}
          className="gt-btn-ghost"
          style={{ ...btnBase, marginRight: 8 }}
          aria-label="Go to first page"
        >
          First
        </button>
      )}

      <button
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={canPrev ? "gt-btn-ghost" : ""}
        style={{
          ...btnBase,
          opacity: canPrev ? 1 : 0.5,
          cursor: canPrev ? "pointer" : "not-allowed",
        }}
        aria-label="Previous page"
      >
        Prev
      </button>

      {pages.map(page => {
        const isActive = page === currentPage;
        const isDisabled = page > maxAllowedPage;
        return (
          <button
            key={page}
            disabled={isDisabled}
            onClick={() => onPageChange(page)}
            className={!isActive && !isDisabled ? "gt-btn-ghost" : ""}
            style={{
              ...btnBase,
              background: isActive ? "var(--gt-primary)" : "var(--gt-card)",
              color: isActive ? "#fff" : "var(--gt-text)",
              borderColor: isActive ? "var(--gt-primary)" : "var(--gt-border)",
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
            aria-current={isActive ? "page" : undefined}
            aria-label={`Page ${page}${isDisabled ? " (unlock by fetching previous pages first)" : ""}`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext || (currentPage + 1 > maxAllowedPage)}
        className={canNext ? "gt-btn-ghost" : ""}
        style={{
          ...btnBase,
          opacity: canNext ? 1 : 0.5,
          cursor: canNext ? "pointer" : "not-allowed",
        }}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
