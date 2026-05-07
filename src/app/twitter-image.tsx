import { ImageResponse } from "next/og";
import { HomeOgImage } from "@/lib/og/home-og-image";

export const runtime = "edge";
export const alt = "GitTrek — PR competition detection on GitHub issues";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<HomeOgImage />, { ...size });
}
