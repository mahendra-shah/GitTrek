"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates from 0 to `target` over `durationMs` when the element intersects the viewport.
 * Zero dependencies — uses rAF + IntersectionObserver.
 */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setValue(target);
      started.current = true;
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const easeOut = (t: number) => 1 - (1 - t) ** 3;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          setValue(Math.round(target * easeOut(t)));
          if (t < 1) requestAnimationFrame(tick);
          else setValue(target);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.12, rootMargin: "32px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}
