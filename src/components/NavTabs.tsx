"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Find Issues", match: (p: string) => p === "/" },
  { href: "/badges", label: "My Badges", match: (p: string) => p.startsWith("/badges") },
] as const;

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {TABS.map(({ href, label, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="gt-nav-link"
            style={{
              position: "relative",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--gt-primary)" : "var(--gt-header-nav-inactive)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s, background 0.15s",
              background: isActive ? "rgba(249,115,22,0.08)" : "transparent",
            }}
          >
            {label}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 2,
                  borderRadius: 2,
                  background: "var(--gt-primary)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
