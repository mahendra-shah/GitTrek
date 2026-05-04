"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "🔍 Find Issues" },
    { href: "/badges", label: "🏅 My Badges" },
  ];

  const isFindActive = pathname === "/";

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: "flex",
        gap: 4,
        padding: "4px",
        background: "var(--gt-card)",
        border: "1px solid var(--gt-border)",
        borderRadius: 12,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
        position: "relative",
        width: 260,
      }}
    >
      {/* Sliding background highlight with elastic spring overshoot */}
      <div style={{
        position: "absolute",
        top: 4,
        bottom: 4,
        left: isFindActive ? 4 : "calc(50% + 2px)",
        width: "calc(50% - 6px)",
        background: "var(--gt-card-hover)",
        border: "1px solid var(--gt-border)",
        borderRadius: 9,
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        transition: "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 0,
      }} />

      {tabs.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--gt-text)" : "var(--gt-text-muted)",
              background: "transparent",
              boxShadow: "none",
              textDecoration: "none",
              transition: "color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s ease",
              whiteSpace: "nowrap",
              zIndex: 1,
              textAlign: "center",
              position: "relative",
            }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
