import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";

import Providers from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CANONICAL_DESCRIPTION } from "@/lib/site-copy";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const SITE_URL = "https://gittrek.vercel.app";
/** Root-level OG image — not under /api/ so social crawlers are not blocked by robots.txt */
const OG_HOME_IMAGE = `${SITE_URL}/opengraph-image`;

export const metadata: Metadata = {
  title: "GitTrek — Find Issues You Can Actually Win",
  description: CANONICAL_DESCRIPTION,
  keywords: ["github", "open source", "good first issue", "contribute to open source", "github issues", "developer tools", "pull request"],
  authors: [{ name: "Mahendra Shah", url: "https://github.com/mahendra-shah" }],
  creator: "Mahendra Shah",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "GitTrek — Find Issues You Can Actually Win",
    description: CANONICAL_DESCRIPTION,
    siteName: "GitTrek",
    images: [
      {
        url: OG_HOME_IMAGE,
        secureUrl: OG_HOME_IMAGE,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "GitTrek — PR competition detection on GitHub issues",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitTrek — Find Issues You Can Actually Win",
    description: CANONICAL_DESCRIPTION,
    images: [OG_HOME_IMAGE],
    creator: "@mahendra_xp",
    site: "@mahendra_xp",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitTrek",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "Open Source Contribution Tool",
  operatingSystem: "Web",
  url: "https://gittrek.vercel.app",
  description: CANONICAL_DESCRIPTION + " GitTrek detects competing pull requests on GitHub issues in real-time via the GraphQL API. Tracks GitHub achievement badge progress (Pull Shark, Galaxy Brain, Starstruck, YOLO, Public Sponsor).",
  featureList: [
    "Real-time PR competition detection on GitHub issues",
    "GitHub achievement badge progress tracking (Pull Shark, Galaxy Brain, Starstruck, YOLO, Public Sponsor)",
    "Advanced repository quality filters (stars, forks, maintainer activity, contributing guidelines)",
    "1-click Quick Missions for badge-hunting (Pull Shark, Galaxy Brain, Pair Extraordinaire)",
    "Public badge profile pages — look up any GitHub username",
    "GitHub Discussions search for Galaxy Brain badge",
    "Guest mode with no sign-in required for basic search",
  ],
  screenshot: OG_HOME_IMAGE,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Person",
    name: "Mahendra Shah",
    url: "https://github.com/mahendra-shah"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full">
        <a href="#main-content" className="gt-skip-link">Skip to main content</a>
        <Providers>
          <div style={{ minHeight: "100vh", background: "var(--gt-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: "1000px",
              height: "500px",
              background: "radial-gradient(ellipse at top, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0) 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }} />

            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
