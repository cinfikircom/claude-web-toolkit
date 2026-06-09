// SERVICES — intentional failures (see /INJECTED-ISSUES.md):
// incomplete Service JSON-LD (no @id, provider NOT linked to Organization @id, no offers/areaServed),
// missing description, multiple <h1>, raw <img> list (no lazy), thin content.

export const metadata = {
  title: "Services - Acme", // (unique-ish, but still no description)
  // description: omitted
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Consulting",
  // FAILURE: no @id, no provider link to https://acme.example/#org, no areaServed, no offers
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <h1>Services</h1>
      <p>We offer services. Many services. The best services.</p>

      {/* FAILURE: each service uses an H1 (should be H2/H3 under one page H1) */}
      <h1>Consulting</h1>
      <img src="/images/service-consulting-3000x2000.jpg" alt="" />
      <p>We consult.</p>

      <h1>Implementation</h1>
      <img src="/images/service-impl-3000x2000.jpg" alt="" />
      <p>We implement.</p>

      <h1>Support</h1>
      <img src="/images/service-support-3000x2000.jpg" alt="" />
      <p>We support.</p>

      {/* FAILURE: no internal links to related blog/contact; no CTA; no Offer/pricing entity */}
    </>
  );
}
