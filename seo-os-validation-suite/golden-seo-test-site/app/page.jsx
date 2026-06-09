// HOME — intentional failures (see /INJECTED-ISSUES.md):
// multiple <h1>, no per-page description, raw <img> (no width/height/lazy => LCP+CLS),
// Organization JSON-LD with BROKEN @id (publisher points to a non-existent node) and NO sameAs.

export const metadata = {
  title: "Acme Inc - Home", // duplicate (same as /about)
  // description: omitted
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  // FAILURE: no stable @id, no url, no logo, no sameAs[]
  name: "Acme Inc",
  publisher: { "@id": "https://acme.example/#org" }, // FAILURE: dangling @id, no such node anywhere
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <h1>Welcome to Acme Inc</h1>

      {/* FAILURE: large hero with no dimensions, no lazy/priority strategy => CLS + LCP */}
      <img src="/images/hero-4000x3000.jpg" alt="" />

      {/* FAILURE: second H1 on the same page */}
      <h1>We are the best in the business</h1>

      <p>
        Acme does many things for many people. We are a leading provider of solutions and services
        across many industries. Contact us to learn more about what we can do for you today.
      </p>

      {/* FAILURE: generic, non-citable marketing copy; no entity definition, no FAQ, no key facts */}
      <h3>Our values</h3>
      <p>Quality. Trust. Innovation. Excellence. Synergy.</p>
    </>
  );
}
