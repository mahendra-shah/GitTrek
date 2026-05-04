"use client";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { TagInput } from "./TagInput";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState, useEffect } from "react";

export type FilterDraft = {
  text: string;
  languages: string[];
  labels: string[];
  zeroComments: boolean;
  issueAgeDays: number;
  minStars: number;
  maxStars: number | null;
  minForks: number;
  maxForks: number | null;
  repoPushedDays: number;
  noAssignee: boolean;
  hasContributing: boolean;
  org?: string;
  onlyOrgs?: boolean;
  // New fields
  contributionType: "issue" | "discussion";
  activeMaintainer: boolean;
  pairingRequested: boolean;
};

type FilterPanelProps = {
  draft: FilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<FilterDraft>>;
  hideLinkedPRs: boolean;
  setHideLinkedPRs: (val: boolean) => void;
  isGuest: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
};

const COMMON_LABELS = [
  "good first issue","help wanted","bug","enhancement","documentation",
  "beginner friendly","easy","first-timers-only","up-for-grabs","hacktoberfest","feature request",
];
const COMMON_LANGUAGES = [
  "JavaScript","TypeScript","Python","Go","Rust","Java","C++","C",
  "Ruby","PHP","Kotlin","Swift","C#","Shell","HTML","CSS","Vue","Dart",
  "Objective-C","Scala","Haskell","Lua","Perl","Elixir","Clojure"
];

const STARS_MAX = 100_000;
const FORKS_MAX = 50_000;

/* ── Shared styles ── */
const labelSt: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase",
  color: "var(--gt-text-subtle)", marginBottom: 8,
};

const inputSt: React.CSSProperties = {
  width: "100%",
  background: "var(--gt-input-bg)",
  color: "var(--gt-input-text)",
  border: "1px solid var(--gt-input-border)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 15,
  fontWeight: 600,
  outline: "none",
  transition: "border-color 0.15s",
};

function SL({ children }: { children: React.ReactNode }) {
  return <span style={labelSt}>{children}</span>;
}

/** Inline info tooltip */
function Tip({ text }: { text: string }) {
  return (
    <span title={text} style={{ cursor: "help", display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }}>
      <Info size={12} style={{ color: "var(--gt-text-subtle)" }} />
    </span>
  );
}

function DarkInput({ value, onChange, placeholder, type = "text" }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={inputSt}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--gt-primary)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--gt-input-border)"; }}
    />
  );
}

function DarkSelect({ value, onChange, children }: {
  value: string | number; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputSt, cursor: "pointer", paddingRight: 36,
          appearance: "none" as any,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--gt-primary)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--gt-input-border)"; }}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)", pointerEvents: "none",
          color: "var(--gt-text-subtle)",
        }}
      />
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", flexShrink: 0,
        background: checked ? "var(--gt-primary)" : "rgba(120,120,140,0.25)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: 9, background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </button>
  );
}

function RangeBlock({ label, tooltip, minVal, maxVal, maxLimit, onMinChange, onMaxChange }: {
  label: string; tooltip?: string; minVal: number; maxVal: number | null; maxLimit: number;
  onMinChange: (v: number) => void; onMaxChange: (v: number | null) => void;
}) {
  return (
    <div>
      <SL>{label}{tooltip && <Tip text={tooltip} />}</SL>
      <div style={{ padding: "0 4px", marginBottom: 14 }}>
        <Slider
          range min={0} max={maxLimit}
          step={maxLimit > 10000 ? 500 : 1}
          value={[minVal, maxVal ?? maxLimit]}
          onChange={vals => {
            if (Array.isArray(vals)) {
              onMinChange(vals[0]);
              onMaxChange(vals[1] >= maxLimit ? null : vals[1]);
            }
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <span style={{ ...labelSt, marginBottom: 4 }}>Min</span>
          <DarkInput type="number" value={minVal} onChange={v => onMinChange(parseInt(v) || 0)} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ ...labelSt, marginBottom: 4 }}>Max</span>
          <DarkInput
            type="number"
            value={maxVal === null ? "" : maxVal}
            onChange={v => onMaxChange(v === "" ? null : parseInt(v) || null)}
            placeholder="Any"
          />
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, sublabel, tooltip, checked, onChange, disabled }: {
  label: string; sublabel?: string; tooltip?: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 36 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14, color: "var(--gt-text)", fontWeight: 500 }}>{label}</span>
          {tooltip && <Tip text={tooltip} />}
        </div>
        {sublabel && <span style={{ fontSize: 11, color: "var(--gt-text-subtle)" }}>{sublabel}</span>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function FilterPanel({ draft, setDraft, hideLinkedPRs, setHideLinkedPRs, isGuest, onSubmit, isSearching }: FilterPanelProps) {
  const set = (k: Partial<FilterDraft>) => setDraft(p => ({ ...p, ...k }));
  // Advanced section: collapsed for guests, expanded for logged-in users
  const [advancedOpen, setAdvancedOpen] = useState(!isGuest);
  // Prevent hydration mismatch: isSearching is true on client immediately but false on SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const effectiveSearching = mounted && isSearching;

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Language */}
      <div>
        <SL>Language</SL>
        <DarkSelect value={draft.languages[0] || ""} onChange={v => set({ languages: v ? [v] : [] })}>
          <option value="">Any language</option>
          {COMMON_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </DarkSelect>
      </div>

      {/* Labels */}
      <div>
        <SL>Issue Labels<Tip text="Labels assigned to the issue on GitHub. 'good first issue' is ideal for newcomers." /></SL>
        <div style={{
          background: "var(--gt-input-bg)", borderRadius: 8,
          border: "1px solid var(--gt-input-border)", padding: "8px 10px", minHeight: 42,
        }}>
          <TagInput
            id="labels" value={draft.labels}
            onChange={tags => set({ labels: tags })}
            suggestions={COMMON_LABELS} placeholder="e.g. good first issue"
          />
        </div>
      </div>

      {/* Issue Age */}
      <div>
        <SL>Issue Age<Tip text="How recently the issue was created. Newer issues have less competition." /></SL>
        <DarkSelect value={draft.issueAgeDays} onChange={v => set({ issueAgeDays: parseInt(v) })}>
          <option value={7}>Under 7 days</option>
          <option value={14}>Under 14 days</option>
          <option value={30}>Under 30 days</option>
          <option value={90}>Under 90 days</option>
          <option value={365}>Under 1 year</option>
        </DarkSelect>
      </div>

      {/* Basic Toggles */}
      <div style={{ borderTop: "1px solid var(--gt-input-border)", paddingTop: 16 }}>
        <SL>Quick Filters</SL>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FilterRow
            label="No one assigned"
            tooltip="Only show issues that haven't been assigned to anyone yet — so you know they're still up for grabs."
            checked={draft.noAssignee}
            onChange={v => set({ noAssignee: v })}
          />
          <FilterRow
            label="No replies yet"
            tooltip="Only issues with zero comments. These are the most untouched opportunities — your message will be the first."
            sublabel={draft.zeroComments ? "Only issues nobody has commented on" : undefined}
            checked={draft.zeroComments}
            onChange={v => set({ zeroComments: v })}
          />
          <FilterRow
            label="No PR in progress"
            sublabel={isGuest ? "Sign in to unlock" : undefined}
            tooltip="Hides issues that already have an open pull request — so you're not building something already being built."
            checked={!isGuest && hideLinkedPRs}
            onChange={isGuest ? () => {} : setHideLinkedPRs}
            disabled={isGuest}
          />
        </div>
      </div>

      {/* Contribution Signals */}
      <div style={{ borderTop: "1px solid var(--gt-input-border)", paddingTop: 16 }}>
        <SL>Contribution Signals</SL>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FilterRow
            label="🔥 Active maintainer"
            tooltip="Only repos pushed to in the last 30 days. Avoids 'ghost' repos where your PR would be ignored."
            sublabel="Repo updated in the last 30 days"
            checked={draft.activeMaintainer}
            onChange={v => set({ activeMaintainer: v })}
          />
          <FilterRow
            label="🤝 Looking for pairing"
            tooltip="Issues where someone in the comments has asked to pair program or co-author — helps earn Pair Extraordinaire badge."
            sublabel="Issues with pairing requests in comments"
            checked={draft.pairingRequested}
            onChange={v => set({ pairingRequested: v })}
          />
        </div>
      </div>

      {/* ── Advanced Filters (collapsible) ── */}
      <div style={{ borderTop: "1px solid var(--gt-input-border)", paddingTop: 16 }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen(p => !p)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: 0, marginBottom: advancedOpen ? 16 : 0,
          }}
        >
          <span style={{ ...labelSt, marginBottom: 0 }}>Advanced Filters</span>
          {advancedOpen
            ? <ChevronUp size={14} style={{ color: "var(--gt-text-subtle)" }} />
            : <ChevronDown size={14} style={{ color: "var(--gt-text-subtle)" }} />}
        </button>

        {advancedOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Repo Popularity */}
            <RangeBlock
              label="Repo Popularity (Stars)"
              tooltip="Filter by how popular the repo is. More stars usually means an active community — but fewer stars means less competition."
              minVal={draft.minStars} maxVal={draft.maxStars}
              maxLimit={STARS_MAX}
              onMinChange={v => set({ minStars: v })}
              onMaxChange={v => set({ maxStars: v })}
            />

            {/* Forks */}
            <RangeBlock
              label="Repo Activity (Forks)"
              tooltip="Forks indicate how many developers are actively building on top of this project. Higher forks = more active development."
              minVal={draft.minForks} maxVal={draft.maxForks}
              maxLimit={FORKS_MAX}
              onMinChange={v => set({ minForks: v })}
              onMaxChange={v => set({ maxForks: v })}
            />

            {/* Repo Activity */}
            <div>
              <SL>Last Code Push<Tip text="When the repo last had code committed to it. Ensures you're not contributing to a dead project." /></SL>
              <DarkSelect value={draft.repoPushedDays} onChange={v => set({ repoPushedDays: parseInt(v) })}>
                <option value={30}>Within last 30 days</option>
                <option value={90}>Within last 90 days</option>
                <option value={180}>Within last 6 months</option>
                <option value={365}>Within last year</option>
              </DarkSelect>
            </div>

            {/* Org filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gt-text)" }}>
                Search in Org
                <Tip text="Limit results to a specific GitHub organization, e.g. 'vercel', 'microsoft'." />
              </span>
              <input
                type="text"
                placeholder="e.g. vercel, facebook"
                value={draft.org || ""}
                onChange={e => set({ org: e.target.value })}
                style={{ ...inputSt, fontSize: 13, padding: "8px 12px" }}
              />
            </div>

            {/* More toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FilterRow
                label="Has contribution guide"
                tooltip="Only repos that have a CONTRIBUTING.md file — these projects actively welcome new contributors."
                sublabel="Repo has CONTRIBUTING.md"
                checked={draft.hasContributing}
                onChange={v => set({ hasContributing: v })}
              />
              <FilterRow
                label="Company-backed repos only"
                tooltip="Only show issues from organization-owned repos (e.g. Google, Microsoft). These tend to have more rigorous code review."
                sublabel="Exclude personal projects"
                checked={draft.onlyOrgs || false}
                onChange={v => set({ onlyOrgs: v })}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={effectiveSearching || undefined}
        style={{
          width: "100%",
          background: "var(--gt-text)",
          color: "var(--gt-card)",
          border: "none", borderRadius: 10, padding: "13px 0",
          fontSize: 15, fontWeight: 700,
          cursor: effectiveSearching ? "wait" : "pointer",
          opacity: effectiveSearching ? 0.7 : 1,
          transition: "opacity 0.2s",
          marginTop: 4,
        }}
      >
        {effectiveSearching ? "Searching…" : "Search issues"}
      </button>
    </form>
  );
}
