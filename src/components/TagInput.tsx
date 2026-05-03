"use client";

import { useRef, useState } from "react";

type TagInputProps = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
};

export function TagInput({ id, value, onChange, suggestions, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  const add = (tag: string) => {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInputValue("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (tag: string) => onChange(value.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) { e.preventDefault(); add(inputValue); }
    else if (e.key === "Backspace" && !inputValue && value.length) remove(value[value.length - 1]);
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, cursor: "text" }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "rgba(249,115,22,0.15)",
              color: "var(--gt-primary)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(tag); }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "var(--gt-primary)", fontSize: 12, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          style={{
            flex: 1, minWidth: 80, background: "transparent", border: "none",
            outline: "none", color: "var(--gt-input-text)", fontSize: 13,
          }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 30,
          background: "var(--gt-input-bg)", border: "1px solid var(--gt-border-strong)",
          borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}>
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 12px", background: "none", border: "none",
                color: "var(--gt-input-text)", fontSize: 13, cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
