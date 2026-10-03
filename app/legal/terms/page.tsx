import Link from "next/link";
import { CURRENT_LEGAL_TITLE, CURRENT_LEGAL_VERSION } from "@/lib/legal";

export const metadata = {
  title: "Platform Terms & School Data Agreement | Teaching CPD",
  description: "Teaching CPD platform terms, school data responsibilities and acceptable-use agreement.",
};

export default function LegalTermsPage() {
  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">LEGAL · VERSION {CURRENT_LEGAL_VERSION}</span>
      <h1>{CURRENT_LEGAL_TITLE}</h1>
      <p>This agreement applies to school and staff use of Teaching CPD. It is written to make the platform rules and data responsibilities clear. Schools should still review their own contract, data protection impact assessment, privacy notices and data-processing arrangements with their DPO or legal adviser before live deployment.</p>
      <div className="stageHeroActions"><Link className="secondary phaseLinkButton" href="/legal/privacy">Privacy summary</Link><Link className="primary phaseLinkButton" href="/auth">Sign in / create account</Link></div>
    </section>

    <section className="stageGrid">
      <article className="stageCard stageSpan6"><span className="eyebrow">1 · AUTHORISED USE</span><h2>Who may use the platform</h2><p>Accounts are for authorised school staff and other users approved by the subscribing school. Users must provide accurate account information, keep sign-in credentials secure, and must not share accounts or deliberately attempt to access another school’s workspace or restricted records.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">2 · SCHOOL DATA</span><h2>The school controls its information</h2><p>The school remains responsible for deciding what school, staff and pupil information it is lawful and appropriate to place in the service. The school must provide appropriate privacy information, identify a lawful basis, keep records accurate, and configure access so staff only see information they need for their role.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">3 · SENSITIVE INFORMATION</span><h2>Need-to-know access</h2><p>Sensitive pupil, SEND/EAL, pastoral, safeguarding and staff-development information must only be viewed or entered by appropriately authorised users. School administrators are responsible for reviewing access assignments. Safeguarding and SEND/EAL areas may use additional restrictions beyond ordinary school roles.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">4 · PLATFORM SECURITY</span><h2>Protecting accounts and data</h2><p>Teaching CPD uses authenticated access, database row-level security, organisation scoping and private storage controls. Users must report suspected unauthorised access promptly and must not export, copy or disclose confidential information except for an authorised school purpose.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">5 · PROFESSIONAL JUDGEMENT</span><h2>Tools support rather than replace staff</h2><p>CPD, AI, planning, assessment, intervention and reporting tools are decision-support features. Schools and qualified staff remain responsible for professional judgement, safeguarding action, statutory duties, educational decisions and checking generated content before use.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">6 · ACCEPTABLE USE</span><h2>What is not permitted</h2><p>Users must not attempt to bypass permissions, probe other organisations, upload unlawful material, misuse personal data, introduce malicious code, interfere with availability, or use the service in a way that breaches applicable law, school policy or another person’s rights.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">7 · RECORDS & AVAILABILITY</span><h2>Operational use</h2><p>The service may create audit records, access records and configuration history needed to operate and secure the platform. Schools should maintain appropriate business-continuity arrangements for information they need during an outage and should follow their own retention requirements.</p></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">8 · ELECTRONIC ACCEPTANCE</span><h2>Your signature</h2><p>Creating a school account requires the user to review this version of the agreement, confirm acceptance and enter their full name as an electronic signature. Teaching CPD stores the accepted document version, document fingerprint, signed name and acceptance time as an immutable acceptance record.</p></article>
    </section>

    <section className="stageCard"><span className="eyebrow">IMPORTANT</span><h2>School contract and DPA</h2><p>This in-product agreement is the user acceptance layer for the platform. It is not a substitute for a school’s procurement contract, data processing agreement, DPIA, retention schedule or legal advice. Those documents should be reviewed before real sensitive school data is introduced.</p><div className="stageHeroActions"><Link className="primary phaseLinkButton" href="/legal/accept">Review and sign</Link><Link className="secondary phaseLinkButton" href="/demo">Return to public demo</Link></div></section>
  </main>;
}
