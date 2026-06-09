// CONTACT — intentional failures (see /INJECTED-ISSUES.md):
// no ContactPage/LocalBusiness schema, no ContactPoint, NAP as plain non-linked text,
// missing description, multiple <h1>, tel not click-to-call (CRO failure), orphan page.

export const metadata = {
  title: "Contact - Acme",
  // description: omitted
};

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      {/* FAILURE: phone is plain text, not a tel: link (no click-to-call) */}
      <p>Phone: 555 123 4567</p>
      <p>Address: 123 Somewhere St</p>

      {/* FAILURE: a second H1 */}
      <h1>Get in touch</h1>

      {/* FAILURE: form with many required fields, no labels (a11y + CRO friction) */}
      <form>
        <input type="text" placeholder="Name" required />
        <input type="text" placeholder="Company" required />
        <input type="email" placeholder="Email" required />
        <input type="tel" placeholder="Phone" required />
        <input type="text" placeholder="Budget" required />
        <textarea placeholder="Message" required></textarea>
        <button type="submit">Send</button>
      </form>

      {/* FAILURE: no ContactPage/LocalBusiness JSON-LD, no NAP consistency w/ schema, no map */}
    </>
  );
}
