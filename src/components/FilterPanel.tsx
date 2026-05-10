"use client";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { TagInput } from "./TagInput";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState, useEffect, useId } from "react";

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
  contributionType: "issue" | "discussion";
  activeMaintainer: boolean;
  pairingRequested: boolean;
};

type FilterPanelProps = {
  draft: FilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<FilterDraft>>;
  /** Apply boolean toggles immediately (syncs URL + search without scrolling to submit) */
  onApplyImmediate: (next: FilterDraft) => void;
  onReset: () => void;
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

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  if (htmlFor) {
    return <label htmlFor={htmlFor} style={labelSt}>{children}</label>;
  }
  return <span style={labelSt} aria-hidden="true">{children}</span>;
}

function Tip({ text }: { text: string }) {
  return (
    <span title={text} style={{ cursor: "help", display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }}>
      <Info size={12} style={{ color: "var(--gt-text-subtle)" }} />
    </span>
  );
}

function DarkInput({ value, onChange, placeholder, type = "text", id, "aria-label": ariaLabel, onBlur }: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  id?: string;
  "aria-label"?: string;
  onBlur?: () => void;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={e => onChange(e.target.value)}
      style={inputSt}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--gt-primary)"; }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "var(--gt-input-border)";
        onBlur?.();
      }}
    />
  );
}

function DarkSelect({ value, onChange, children, id, "aria-label": ariaLabel }: {
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputSt, cursor: "pointer", paddingRight: 36,
          appearance: "none" as const,
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

function Toggle({ checked, onChange, disabled, "aria-label": ariaLabel }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  "aria-label": string; // required — not optional
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
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
  const [localMin, setLocalMin] = useState(String(minVal));
  const [localMax, setLocalMax] = useState(maxVal === null ? "" : String(maxVal));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalMin(String(minVal));
  }, [minVal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalMax(maxVal === null ? "" : String(maxVal));
  }, [maxVal]);

  const handleMinChange = (v: string) => {
    setLocalMin(v);
    if (v === "") {
      onMinChange(0);
    } else {
      const parsed = parseInt(v);
      onMinChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  const handleMaxChange = (v: string) => {
    setLocalMax(v);
    if (v === "") {
      onMaxChange(null);
    } else {
      const parsed = parseInt(v);
      onMaxChange(isNaN(parsed) ? null : parsed);
    }
  };

  const handleMinBlur = () => {
    if (localMin === "") {
      onMinChange(0);
      setLocalMin("0");
    } else {
      const parsed = parseInt(localMin);
      const clamped = Math.max(0, Math.min(isNaN(parsed) ? 0 : parsed, maxLimit));
      onMinChange(clamped);
      setLocalMin(String(clamped));
    }
  };

  const handleMaxBlur = () => {
    if (localMax === "") {
      onMaxChange(null);
      setLocalMax("");
    } else {
      const parsed = parseInt(localMax);
      const clamped = Math.max(0, Math.min(isNaN(parsed) ? 0 : parsed, maxLimit));
      onMaxChange(clamped);
      setLocalMax(String(clamped));
    }
  };

  const displayVal = `${minVal.toLocaleString()} - ${maxVal === null ? `${maxLimit.toLocaleString()}+` : maxVal.toLocaleString()}`;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <FieldLabel>{label}{tooltip && <Tip text={tooltip} />}</FieldLabel>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gt-primary)" }}>{displayVal}</span>
      </div>
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
          <FieldLabel>Min</FieldLabel>
          <DarkInput
            type="number"
            value={localMin}
            onChange={v => handleMinChange(v)}
            onBlur={handleMinBlur}
            placeholder="0"
            aria-label={`Minimum ${label}`}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Max</FieldLabel>
          <DarkInput
            type="number"
            value={localMax}
            onChange={v => handleMaxChange(v)}
            onBlur={handleMaxBlur}
            placeholder="Any"
            aria-label={`Maximum ${label}`}
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
      <Toggle checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

export function FilterPanel({ draft, setDraft, onApplyImmediate, onReset, hideLinkedPRs, setHideLinkedPRs, isGuest, onSubmit, isSearching }: FilterPanelProps) {
  const set = (k: Partial<FilterDraft>) => setDraft(p => ({ ...p, ...k }));
  const apply = (k: Partial<FilterDraft>) => {
    setDraft(prev => {
      const next = { ...prev, ...k };
      onApplyImmediate(next);
      return next;
    });
  };
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const effectiveSearching = mounted && isSearching;

  // Stable, unique IDs for label/input associations (React 18+)
  const ageId = useId();
  const pushedId = useId();

  const zeroSublabel = draft.zeroComments
    ? (draft.contributionType === "discussion"
      ? "Only discussions with no replies yet"
      : "Only issues nobody has commented on")
    : undefined;

  const submitLabel = effectiveSearching
    ? "Searching…"
    : draft.contributionType === "discussion"
      ? "Search discussions"
      : "Search issues";

  return (
    <form className="gt-filter-form" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ ...labelSt, marginBottom: 0 }}>Filters</span>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            color: "var(--gt-primary)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Clear all
        </button>
      </div>

      <div className="gt-filter-scroll" style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, overflowY: "auto", overflowX: "visible", minHeight: 0 }}>

      {/* Languages */}
      <div>
        <FieldLabel>Languages<Tip text="Primary coding languages for the project. You can select multiple." /></FieldLabel>
        <div style={{
          background: "var(--gt-input-bg)", borderRadius: 8,
          border: "1px solid var(--gt-input-border)", padding: "8px 10px", minHeight: 42,
        }}>
          <TagInput
            id="languages" value={draft.languages}
            onChange={langs => set({ languages: langs })}
            suggestions={COMMON_LANGUAGES} placeholder="e.g. TypeScript, Go"
          />
        </div>
      </div>

      {/* Labels */}
      <div>
        <FieldLabel>Issue Labels<Tip text="Labels assigned to the issue on GitHub. 'good first issue' is ideal for newcomers." /></FieldLabel>
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

      {/* Issue Age — proper label association */}
      <div>
        <FieldLabel htmlFor={ageId}>Issue Age<Tip text="How recently the issue was created. Newer issues have less competition." /></FieldLabel>
        <DarkSelect id={ageId} value={draft.issueAgeDays} onChange={v => set({ issueAgeDays: parseInt(v) })}>
          <option value={7}>Under 7 days</option>
          <option value={14}>Under 14 days</option>
          <option value={30}>Under 30 days</option>
          <option value={90}>Under 90 days</option>
          <option value={365}>Under 1 year</option>
        </DarkSelect>
      </div>

      {/* Quick Filters */}
      <div style={{ borderTop: "1px solid var(--gt-border)", paddingTop: 14 }}>
        <FieldLabel>Quick Filters</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {draft.contributionType === "issue" && (
            <FilterRow
              label="No one assigned"
              tooltip="Only show issues that haven't been assigned to anyone yet — so you know they're still up for grabs."
              checked={draft.noAssignee}
              onChange={v => apply({ noAssignee: v })}
            />
          )}
          <FilterRow
            label="No replies yet"
            tooltip={draft.contributionType === "discussion"
              ? "Only discussions with zero replies — first response could be yours."
              : "Only issues with zero comments. These are the most untouched opportunities — your message will be the first."}
            sublabel={zeroSublabel}
            checked={draft.zeroComments}
            onChange={v => apply({ zeroComments: v })}
          />
          {draft.contributionType === "issue" && (
            <FilterRow
              label="No PR in progress"
              sublabel={isGuest ? "Sign in to unlock" : undefined}
              tooltip="Hides issues that already have an open pull request — so you're not building something already being built."
              checked={!isGuest && hideLinkedPRs}
              onChange={isGuest ? () => {} : (v) => setHideLinkedPRs(v)}
              disabled={isGuest}
            />
          )}
        </div>
      </div>

      {/* Contribution Signals */}
      {draft.contributionType === "issue" && (
        <div style={{ borderTop: "1px solid var(--gt-border)", paddingTop: 14 }}>
          <FieldLabel>Contribution Signals</FieldLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FilterRow
              label="Active maintainer"
              tooltip="Only repos pushed to in the last 30 days. Avoids 'ghost' repos where your PR would be ignored."
              sublabel="Repo updated in the last 30 days"
              checked={draft.activeMaintainer}
              onChange={v => apply({ activeMaintainer: v })}
            />
            <FilterRow
              label="Looking for pairing"
              tooltip="Issues where someone in the comments has asked to pair program or co-author — helps earn Pair Extraordinaire badge."
              sublabel="Issues with pairing requests in comments"
              checked={draft.pairingRequested}
              onChange={v => apply({ pairingRequested: v })}
            />
          </div>
        </div>
      )}

      {/* Advanced Filters — proper aria-expanded/aria-controls disclosure pattern */}
      <div style={{ borderTop: "1px solid var(--gt-border)", paddingTop: 14 }}>
        <button
          type="button"
          data-testid="advanced-filters-toggle"
          onClick={() => setAdvancedOpen(p => !p)}
          aria-expanded={advancedOpen}
          aria-controls="filter-advanced-content"
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
          <div id="filter-advanced-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <RangeBlock
              label="Repo Popularity (Stars)"
              tooltip="Filter by how popular the repo is. More stars usually means an active community — but fewer stars means less competition."
              minVal={draft.minStars} maxVal={draft.maxStars}
              maxLimit={STARS_MAX}
              onMinChange={v => set({ minStars: v })}
              onMaxChange={v => set({ maxStars: v })}
            />

            <RangeBlock
              label="Repo Activity (Forks)"
              tooltip="Forks indicate how many developers are actively building on top of this project. Higher forks = more active development."
              minVal={draft.minForks} maxVal={draft.maxForks}
              maxLimit={FORKS_MAX}
              onMinChange={v => set({ minForks: v })}
              onMaxChange={v => set({ maxForks: v })}
            />

            {/* Last Code Push — proper label association */}
            <div>
              <FieldLabel htmlFor={pushedId}>Last Code Push<Tip text="When the repo last had code committed to it. Ensures you're not contributing to a dead project." /></FieldLabel>
              <DarkSelect id={pushedId} value={draft.repoPushedDays} onChange={v => set({ repoPushedDays: parseInt(v) })}>
                <option value={30}>Within last 30 days</option>
                <option value={90}>Within last 90 days</option>
                <option value={180}>Within last 6 months</option>
                <option value={365}>Within last year</option>
              </DarkSelect>
            </div>

            {/* Org filter — aria-label on input since no visible label element */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gt-text)" }}>
                Search in Org
                <Tip text="Limit results to a specific GitHub organization, e.g. 'vercel', 'microsoft'." />
              </span>
              <input
                type="text"
                id="filter-org"
                aria-label="Search in organization (e.g. vercel, microsoft)"
                placeholder="e.g. vercel, facebook"
                value={draft.org || ""}
                onChange={e => set({ org: e.target.value })}
                style={{ ...inputSt, fontSize: 13, padding: "8px 12px" }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--gt-primary)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--gt-input-border)"; }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FilterRow
                label="Has contribution guide"
                tooltip="Only repos that have a CONTRIBUTING.md file — these projects actively welcome new contributors."
                sublabel="Repo has CONTRIBUTING.md"
                checked={draft.hasContributing}
                onChange={v => apply({ hasContributing: v })}
              />
              <FilterRow
                label="Company-backed repos only"
                tooltip="Only show issues from organization-owned repos (e.g. Google, Microsoft). These tend to have more rigorous code review."
                sublabel="Exclude personal projects"
                checked={draft.onlyOrgs || false}
                onChange={v => apply({ onlyOrgs: v })}
              />
            </div>
          </div>
        )}
      </div>

      </div>

      {/* Submit row — lives outside the scroll div so it never scrolls away */}
      <div style={{
        flexShrink: 0,
        paddingTop: 12,
        paddingBottom: 4,
        borderTop: "1px solid var(--gt-border)",
        background: "var(--gt-sidebar)",
      }}>
        <button
          type="submit"
          data-testid="search-submit-btn"
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
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
