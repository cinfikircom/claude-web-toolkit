// BLOG — intentional failures (see /INJECTED-ISSUES.md):
// Article JSON-LD missing author & publisher @id links, no dateModified, broken mainEntityOfPage,
// multiple <h1>, missing description, raw <img>, no citable summary / FAQ.

export const metadata = {
  title: "Blog - Acme",
  // description: omitted
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Some thoughts about industry things",
  // FAILURE: no @id, author is a bare string (not Person), publisher missing,
  //          mainEntityOfPage points to wrong/dangling id, no datePublished/dateModified
  author: "Admin",
  mainEntityOfPage: { "@id": "https://acme.example/blog/post-1#article" }, // dangling
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <h1>Blog</h1>
      <img src="/images/blog-cover-3500x2000.jpg" alt="" />

      {/* FAILURE: each post teaser uses H1 */}
      <h1>Some thoughts about industry things</h1>
      <p>
        Lorem ipsum style filler. This post does not answer a clear question, has no citable summary,
        no key facts, no FAQ, and no author bio. It is hard for an LLM to extract or attribute.
      </p>

      <h1>Another post</h1>
      <p>More filler. No structure. No entity. No dates.</p>

      {/* FAILURE: no <article>/<section> semantics; no published date in markup */}
    </>
  );
}
