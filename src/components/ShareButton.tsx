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
      const node = cardRef.current;
      const imgs = Array.from(node.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? img.decode().catch(() => null)
            : new Promise<void>((resolve) => {
                const done = () => {
                  img.removeEventListener("load", done);
                  img.removeEventListener("error", done);
                  resolve();
                };
                img.addEventListener("load", done);
                img.addEventListener("error", done);
              })
        )
      );

      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(node, {
        backgroundColor: "#06080C",
        scale: 2,
        useCORS: true,
        allowTaint: false,
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
      {/* Off-screen rendered card for html2canvas capture.
          NOTE: must NOT use visibility:hidden / display:none — html2canvas skips those. */}
      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
          opacity: 1,
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
