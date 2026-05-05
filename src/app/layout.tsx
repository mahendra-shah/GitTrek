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
  title: {
    default: "GitTrek — Find Open Source Issues & Track Achievements",
    template: "%s | GitTrek",
  },
  description:
    "The smartest way to find available open source issues. Track your GitHub badges (Pull Shark, Starstruck, Galaxy Brain) with live GraphQL progress tracking.",
  keywords: ["github", "open source", "good first issue", "contribute to open source", "github issues", "developer tools", "pull request"],
  authors: [{ name: "Mahendra Shah", url: "https://github.com/mahendra-shah" }],
  creator: "Mahendra Shah",
  metadataBase: new URL("https://gittrek.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gittrek.vercel.app",
    title: "GitTrek — The Open Source Discovery Engine",
    description: "Detect real-time PR competition and track your GitHub achievement progress.",
    siteName: "GitTrek",
    images: [
      {
        url: "/banner.svg",
        width: 1200,
        height: 630,
        alt: "GitTrek Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitTrek — Find Available GitHub Issues",
    description: "Stop wasting time on issues that already have PRs. Track your badge progress live.",
    images: ["/banner.svg"],
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
