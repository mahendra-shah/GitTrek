"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Props = {
  initialUsername?: string;
  /** The username of the currently signed-in user, if any. */
  signedInUser?: string | null;
};

export function UserLookup({ initialUsername = "", signedInUser }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialUsername);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim().replace(/^@+/, "");
    if (!trimmed) return;
    startTransition(() => {
      router.push(`/badges?user=${encodeURIComponent(trimmed)}`);
    });
  }

  function clearToMyBadges() {
    setValue("");
    startTransition(() => {
      router.push("/badges");
    });
  }

  const isLookingUpOtherUser = signedInUser && value.trim() && value.trim().toLowerCase() !== signedInUser.toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, alignItems: "center" }}
        role="search"
        aria-label="GitHub username lookup"
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              color: "var(--gt-text-subtle)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter any GitHub username…"
            aria-label="GitHub username"
            style={{
              width: "100%",
              background: "var(--gt-input-bg)",
              color: "var(--gt-input-text)",
              border: "1px solid var(--gt-input-border)",
              borderRadius: 10,
              padding: "10px 12px 10px 36px",
              fontSize: 15,
              fontWeight: 500,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gt-primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--gt-input-border)"; }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim() && !isPending) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); inputRef.current?.focus(); }}
              style={{
                position: "absolute",
                right: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--gt-text-subtle)",
                padding: 4,
                display: "flex",
              }}
              aria-label="Clear input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!value.trim() || isPending}
          style={{
            background: "var(--gt-text)",
            color: "var(--gt-card)",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: value.trim() && !isPending ? "pointer" : "not-allowed",
            opacity: value.trim() && !isPending ? 1 : 0.5,
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
          }}
        >
          {isPending ? "Loading…" : "Look up"}
        </button>
      </form>

      {/* Back to my badges link */}
      {isLookingUpOtherUser && (
        <button
          onClick={clearToMyBadges}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--gt-primary)",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            textAlign: "left",
          }}
        >
          ← View my badges (@{signedInUser})
        </button>
      )}
    </div>
  );
}
