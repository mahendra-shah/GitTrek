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
        gap: 4,
        padding: "4px",
        background: "var(--gt-header-rl-bg)",
        border: "1px solid var(--gt-header-rl-border)",
        borderRadius: 10,
      }}
    >
      {tabs.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--gt-header-text)" : "var(--gt-header-nav-inactive)",
              background: isActive ? "var(--gt-header-bg)" : "transparent",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              textDecoration: "none",
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
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
