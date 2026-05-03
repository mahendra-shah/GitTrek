"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "🔍 Find Issues" },
    { href: "/badges", label: "🏅 My Badges" },
  ];

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: "flex",
        gap: 6,
        padding: "4px",
        background: "rgba(0, 0, 0, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {tabs.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--gt-text)" : "var(--gt-text-muted)",
              background: isActive ? "var(--gt-card)" : "transparent",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.1), 0 0 0 1px var(--gt-border)" : "none",
              textDecoration: "none",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              position: "relative",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
