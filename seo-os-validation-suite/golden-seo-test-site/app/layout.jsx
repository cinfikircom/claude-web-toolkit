import SiteNav from "./components/SiteNav";

// FIXTURE NOTE (answer key in /INJECTED-ISSUES.md):
// - No `description` here and pages reuse the same title -> missing meta description + duplicate titles.
// - No metadataBase / canonical (alternates.canonical) anywhere -> missing canonical.
export const metadata = {
  title: "Acme Inc - Home", // reused verbatim on multiple pages (duplicate titles)
  // description: intentionally omitted
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Render-blocking 3rd-party script (no async/defer, no next/script strategy) */}
        <script src="https://cdn.example.com/heavy-analytics.js"></script>

        {/* Web font loaded render-blocking: no preconnect, no preload, display=block (FOIT) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=block"
        />

        <SiteNav />
        <main>{children}</main>

        <footer>
          <p>© Acme Inc. All rights reserved.</p>
          {/* Weak footer linking: no sitemap, no cross-links */}
        </footer>
      </body>
    </html>
  );
}
