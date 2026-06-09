import Link from "next/link";

// FIXTURE: WEAK INTERNAL LINKING (answer key in /INJECTED-ISSUES.md)
// - Only links to Home and Services. about/blog/contact are orphaned from global nav.
// - No descriptive anchor text, no breadcrumb, no related links on pages.
export default function SiteNav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      {" | "}
      <Link href="/services">Services</Link>
      {/* Missing: /about, /blog, /contact (orphan pages) */}
    </nav>
  );
}
