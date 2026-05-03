import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { GeistMono } from "geist/font/mono";

import Providers from "./providers";
import { Header } from "@/components/Header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GitTrek — Find the Right Open Source Issue",
    template: "%s | GitTrek",
  },
  description:
    "GitTrek is an advanced open source discovery engine. Find beginner-friendly GitHub issues, track your PR badges, and avoid crowded PRs with real-time competition checks.",
  keywords: ["github", "open source", "good first issue", "contribute to open source", "github issues", "developer tools", "pull request"],
  authors: [{ name: "Mahendra Shah", url: "https://github.com/mahendra-shah" }],
  creator: "Mahendra Shah",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gittrek.vercel.app",
    title: "GitTrek — Find the Right Open Source Issue",
    description: "Find beginner-friendly GitHub issues and track your PR badges with real-time competition checks.",
    siteName: "GitTrek",
    images: [
      {
        url: "https://gittrek.vercel.app/banner.svg",
        width: 1200,
        height: 630,
        alt: "GitTrek Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitTrek — Find the Right Open Source Issue",
    description: "Find beginner-friendly GitHub issues and track your PR badges.",
    images: ["https://gittrek.vercel.app/banner.svg"],
  },
  metadataBase: new URL("https://gittrek.vercel.app"),
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
  },
};

// JSON-LD Structured Data for AEO (Answer Engine Optimization)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitTrek",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://gittrek.vercel.app",
  description: "GitTrek is a search engine for developers to find open-source GitHub issues to contribute to, featuring real-time PR competition checks and advanced quality filters.",
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
          <div style={{ minHeight: "100vh", background: "var(--gt-bg)", display: "flex", flexDirection: "column" }}>
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
