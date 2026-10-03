"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CURRENT_LEGAL_TITLE, CURRENT_LEGAL_VERSION, hasCurrentLegalAcceptance, recordCurrentLegalAcceptance } from "@/lib/legal";
import { safeNextPath } from "@/lib/schoolAccess";

export default function LegalAcceptPage() {
  const params = useSearchParams();
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const next = safeNextPath(params.get("next"));

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      if (!data.user) {
        window.location.replace(`/auth?next=${encodeURIComponent(`/legal/accept?next=${encodeURIComponent(next)}`)}`);
        return;
      }
      if (!active) return;
      setSignedName(String(data.user.user_metadata?.full_name || data.user.user_metadata?.legal_pending_signed_name || ""));
      const current = await hasCurrentLegalAcceptance(client, data.user.id);
      if (active) setAccepted(current);
    })().catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Could not check the agreement status."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [next]);

  async function sign(event: FormEvent) {
    event.preventDefault();
    if (!agreed) { setMessage("Confirm that you have read and accept the agreement before signing."); return; }
    setBusy(true); setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw error || new Error("Sign in before accepting the agreement.");
      await recordCurrentLegalAcceptance(client, data.user.id, signedName);
      setAccepted(true);
      setMessage("Agreement signed and recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The agreement could not be recorded.");
    } finally { setBusy(false); }
  }

  function continueToSchool() {
    window.location.replace(`/auth?next=${encodeURIComponent(next)}`);
  }

  if (loading) return <main className="stagePage"><section className="stageCard">Checking agreement status…</section></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">ELECTRONIC ACCEPTANCE · {CURRENT_LEGAL_VERSION}</span><h1>Review and sign the school platform agreement</h1><p>All school users must accept the current agreement before entering a live school workspace. OAuth users are sent here on first sign-in too.</p><div className="stageHeroActions"><Link className="secondary phaseLinkButton" href="/legal/terms" target="_blank">Read full agreement</Link><Link className="secondary phaseLinkButton" href="/legal/privacy" target="_blank">Privacy summary</Link></div></section>

    {accepted ? <section className="stageCard"><span className="eyebrow">SIGNED</span><h2>Current agreement accepted</h2><p>Your account has an acceptance record for <strong>{CURRENT_LEGAL_TITLE}</strong>, version <strong>{CURRENT_LEGAL_VERSION}</strong>.</p>{message && <div className="phaseNotice">{message}</div>}<button className="primary" onClick={continueToSchool}>Continue to school access</button></section>
    : <form className="stageCard stageForm" onSubmit={sign}>
      <span className="eyebrow">YOUR SIGNATURE</span><h2>{CURRENT_LEGAL_TITLE}</h2>
      <p>By signing, you confirm that you have read the current agreement, will only access information you are authorised to see, will follow your school’s data-protection and safeguarding procedures, and will not share confidential school data outside authorised purposes.</p>
      <label>Full name / electronic signature<input required minLength={2} maxLength={200} value={signedName} onChange={event => setSignedName(event.target.value)} placeholder="Enter your full name" /></label>
      <label style={{display:"flex",flexDirection:"row",gap:10,alignItems:"flex-start"}}><input style={{width:"auto",marginTop:4}} type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} /><span>I have read and accept the <Link href="/legal/terms" target="_blank">Platform Terms & School Data Agreement</Link> and acknowledge the <Link href="/legal/privacy" target="_blank">privacy/data-protection summary</Link>.</span></label>
      <p><small>Your acceptance record stores the agreement version, document fingerprint, signed name and acceptance timestamp.</small></p>
      {message && <div className="phaseNotice">{message}</div>}
      <button className="primary" disabled={busy || !agreed}>{busy ? "Recording signature…" : "Sign and accept"}</button>
    </form>}
  </main>;
}
