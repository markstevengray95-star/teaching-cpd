import Link from "next/link";

export const metadata = {
  title: "Privacy & Data Protection | Teaching CPD",
  description: "Plain-language privacy and data protection summary for Teaching CPD schools and staff.",
};

export default function PrivacyPage() {
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">PRIVACY & DATA PROTECTION</span><h1>How the platform separates and protects school information</h1><p>This page is a plain-language product summary. A subscribing school should also review the formal contract, DPA, DPIA and its own privacy notices before using real sensitive information.</p><div className="stageHeroActions"><Link className="secondary phaseLinkButton" href="/legal/terms">Platform terms</Link><Link className="primary phaseLinkButton" href="/legal/accept">Review and sign</Link></div></section>
    <section className="stageGrid">
      <article className="stageCard stageSpan6"><h2>Separate school workspaces</h2><p>School records are organisation-scoped. Database row-level security is used so an authenticated user does not gain access merely because they know a record identifier or API endpoint.</p></article>
      <article className="stageCard stageSpan6"><h2>Least-privilege access</h2><p>General staff roles do not automatically unlock sensitive records. Student support, interventions, pastoral/check-in data and staff progress reporting can be granted individually by a School Admin. SEND/EAL and safeguarding retain separate stricter access controls.</p></article>
      <article className="stageCard stageSpan6"><h2>Private files</h2><p>Evidence and school knowledge files are held in private storage buckets with access policies rather than public file URLs. Public demo pages use fictional data and do not connect to a school’s live records.</p></article>
      <article className="stageCard stageSpan6"><h2>Account security</h2><p>Users authenticate before accessing school data. Administrators should disable leavers promptly, review privileged roles regularly and use school-managed identity controls where available.</p></article>
      <article className="stageCard stageSpan6"><h2>Data minimisation</h2><p>Schools should only enter information needed for the intended educational or operational purpose. Sensitive narratives should be kept in the appropriate restricted area, not copied into general notes or public resources.</p></article>
      <article className="stageCard stageSpan6"><h2>Exports and integrations</h2><p>Exports, Google workflows and other integrations can move information outside the immediate page. Schools should configure them deliberately and ensure the destination is approved for the type of information being transferred.</p></article>
    </section>
    <section className="stageCard"><h2>Security is an ongoing process</h2><p>No online service can truthfully promise zero risk. Teaching CPD uses layered controls and audits, but schools should combine those controls with strong account management, staff training, device security, incident procedures and periodic permission reviews.</p></section>
  </main>;
}
