import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About GitTrek — The Open Source Discovery Engine",
  description: "Learn how GitTrek helps you find the best GitHub issues, avoid competing PRs, and track your achievement badges.",
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GitTrek",
    "operatingSystem": "Web",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An advanced open source discovery engine that detects real-time PR competition and tracks GitHub achievement badges.",
    "featureList": [
      "Real-time PR competition detection",
      "GitHub Achievement badge tracking",
      "Live GraphQL search",
      "Repository quality filtering"
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is GitTrek?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GitTrek is a live search engine for open source contributors that helps find available issues and track GitHub achievement progress."
        }
      },
      {
        "@type": "Question",
        "name": "How does GitTrek detect competing PRs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "It uses the GitHub GraphQL API to scan timeline events for CrossReferencedEvent and ConnectedEvent entries."
        }
      }
    ]
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", lineHeight: 1.6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, color: "var(--gt-text)" }}>
        About GitTrek
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          What is GitTrek?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek is an advanced open source discovery engine built for developers who want to contribute effectively. 
          Unlike standard GitHub search, GitTrek provides real-time insights into issue competition, repository quality, 
          and your own personal growth as a contributor.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          How does GitTrek detect competing PRs on GitHub issues?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek uses the GitHub GraphQL API to scan the <code>timelineItems</code> of every issue in real-time. 
          Specifically, we look for <code>CrossReferencedEvent</code> entries. When a developer mentions an issue 
          in a Pull Request, GitHub creates a cross-reference. GitTrek identifies these links to warn you if 
          an active PR already exists for an issue—saving you from hours of wasted work on a problem someone else 
          is already solving.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          What GitHub badges can GitTrek track?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          GitTrek currently tracks several major GitHub Achievement badges with live tier calculations:
        </p>
        <ul style={{ color: "var(--gt-text-muted)", paddingLeft: 20, marginTop: 12 }}>
          <li><strong>Pull Shark</strong>: Based on your merged public pull requests.</li>
          <li><strong>Starstruck</strong>: Based on the stars of your most popular repository.</li>
          <li><strong>Galaxy Brain</strong>: Based on your accepted answers in GitHub Discussions.</li>
          <li><strong>YOLO</strong>: Based on pull requests merged without review.</li>
          <li><strong>Public Sponsor</strong>: Based on your active GitHub Sponsorships.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          Is GitTrek free?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          Yes. GitTrek is free to use. You can browse issues as a guest, but logging in via GitHub OAuth 
          is required to see live PR competition checks and track your personal badge progress. This is 
          because the live checks consume GitHub API quota, which is significantly higher for authenticated users.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--gt-text)" }}>
          How is GitTrek different from goodfirstissue.dev?
        </h2>
        <p style={{ color: "var(--gt-text-muted)" }}>
          While <em>goodfirstissue.dev</em> is a great static list of curated issues, GitTrek is a <strong>live search engine</strong>. 
          We don't just show you "good first issues"; we show you <em>currently available</em> issues. GitTrek's 
          unique advantage is the real-time PR competition detection and the ability to filter by repository 
          freshness, task completion status, and personal badge goals.
        </p>
      </section>
    </main>
  );
}
