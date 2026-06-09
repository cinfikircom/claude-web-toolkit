// ABOUT — intentional failures (see /INJECTED-ISSUES.md):
// DUPLICATE title (same string as home), missing description, multiple <h1>,
// no AboutPage/Organization schema, orphan page (not in nav).

export const metadata = {
  title: "Acme Inc - Home", // FAILURE: duplicate title (identical to homepage)
  // description: omitted
};

export default function AboutPage() {
  return (
    <>
      <h1>About</h1>
      {/* FAILURE: heading level jump h1 -> h4 (skips h2/h3) */}
      <h4>Our story</h4>
      <p>
        We were founded some years ago. We have grown a lot. We help customers. We are passionate
        about what we do and we care about results.
      </p>

      {/* FAILURE: a second H1 used for visual emphasis */}
      <h1>Meet the team</h1>
      <p>Our team is great. There are many of us. We work hard.</p>

      {/* FAILURE: no Organization/AboutPage JSON-LD, no NAP, no contact info, no author/E-E-A-T signals */}
    </>
  );
}
