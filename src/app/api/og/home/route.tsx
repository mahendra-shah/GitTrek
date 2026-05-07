import { ImageResponse } from "@vercel/og";
import { HomeOgImage } from "@/lib/og/home-og-image";

export const runtime = "edge";

/** Legacy URL — prefer /opengraph-image (not under /api/, so robots.txt cannot block crawlers). */
export async function GET() {
  return new ImageResponse(<HomeOgImage />, { width: 1200, height: 630 });
}
