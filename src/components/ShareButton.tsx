"use client";

import { useRef, useState } from "react";
import { Share2, Download } from "lucide-react";
import { type ShareableCardData } from "@/lib/github/badges";
import { ShareableBadgeCard } from "@/components/ShareableBadgeCard";

type Props = {
  data: ShareableCardData;
};

type State = "idle" | "generating" | "done" | "error";

export function ShareButton({ data }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<State>("idle");

  async function generateAndShare() {
    if (!cardRef.current) return;
    setState("generating");

    try {
      // Dynamically import html2canvas to avoid SSR issues
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0D0D14",
        scale: 2, // 2× for retina quality
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], `gittrek-${data.username}-badges.png`, { type: "image/png" });

      // Try Web Share API first (mobile + modern desktop)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${data.username}'s GitHub Badges`,
          text: `Track your GitHub badges on GitTrek! gittrek.vercel.app`,
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }

      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error("[ShareButton]", err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const label =
    state === "generating" ? "Generating…"
    : state === "done" ? "✓ Done!"
    : state === "error" ? "Error — try again"
    : "Share my badge card";

  return (
    <>
      {/* Off-screen rendered card for html2canvas capture */}
      <div
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          pointerEvents: "none",
          visibility: "hidden",
        }}
        aria-hidden="true"
      >
        <ShareableBadgeCard data={data} cardRef={cardRef} />
      </div>

      <button
        onClick={generateAndShare}
        disabled={state === "generating"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: state === "done"
            ? "rgba(74,222,128,0.15)"
            : state === "error"
            ? "rgba(248,113,113,0.15)"
            : "var(--gt-primary)",
          color: state === "done" ? "#4ADE80" : state === "error" ? "#F87171" : "#fff",
          border: "none",
          borderRadius: 10,
          padding: "11px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: state === "generating" ? "wait" : "pointer",
          opacity: state === "generating" ? 0.75 : 1,
          transition: "background 0.2s, color 0.2s, opacity 0.2s",
        }}
        aria-label="Share your GitHub badge progress card"
      >
        {state === "idle" || state === "generating" ? <Share2 size={15} /> : <Download size={15} />}
        {label}
      </button>
    </>
  );
}
