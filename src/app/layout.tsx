import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { GeistMono } from "geist/font/mono";

import Providers from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitTrek — Find the Right Open Source Issue",
  description: "Find beginner-friendly GitHub issues where no one is already working. Checks for competing PRs live. Track your GitHub badge progress. Free, open source.",
  keywords: ["github", "open source", "good first issue", "contribute to open source", "github issues", "developer tools", "pull request"],
  authors: [{ name: "Mahendra Shah", url: "https://github.com/mahendra-shah" }],
  creator: "Mahendra Shah",
  metadataBase: new URL("https://gittrek.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gittrek.vercel.app",
    title: "GitTrek — Find the Right Open Source Issue",
    description: "Find beginner-friendly GitHub issues where no one is already working. Checks for competing PRs live. Free, open source.",
    siteName: "GitTrek",
    images: [
      {
        url: "https://gittrek.vercel.app/find-issue.png",
        width: 1200,
        height: 630,
        alt: "GitTrek — Find Available Open Source Issues",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitTrek — Find the Right Open Source Issue",
    description: "Find beginner-friendly GitHub issues where no one is already working. Checks for competing PRs live.",
    images: ["https://gittrek.vercel.app/find-issue.png"],
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// JSON-LD Structured Data for AEO (Answer Engine Optimization)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitTrek",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://gittrek.vercel.app",
  description: "GitTrek is a live search engine for open source contributors. It detects competing pull requests on GitHub issues in real-time, so you never waste hours on an issue someone else is already solving. Also tracks GitHub achievement badge progress.",
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
        <Providers>
          <div style={{ minHeight: "100vh", background: "var(--gt-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Ambient Background Glow (Foggy Glass Lighting) */}
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
      </body>
    </html>
  );
}
