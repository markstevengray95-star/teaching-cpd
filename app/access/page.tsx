"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { accessReasonMessage, claimSchoolAccess, safeNextPath } from "@/lib/schoolAccess";

export default function AccessPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("access_check_failed");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReason(params.get("reason") || "access_check_failed");
    const client = getSupabaseBrowserClient();
    client.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.replace(`/auth?next=${encodeURIComponent(nextPath())}`);
        return;
      }
      setEmail(data.user.email || "");
    });
  }, []);

  async function retry() {
    const client = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      const result = await claimSchoolAccess(client);
      if (result.allowed) {
        window.location.replace(nextPath());
        return;
      }
      setReason(result.reason);
      setMessage(accessReasonMessage(result.reason));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check school access.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.replace("/auth");
  }

  const canStartTrial = reason === "school_not_licensed" || reason === "access_check_failed";

  return <main className="phasePage accessStatusPage">
    <section className="phaseCard accessStatusCard">
      <div className="accessStatusIcon" aria-hidden="true">🏫</div>
      <span className="eyebrow">SCHOOL SUBSCRIPTION ACCESS</span>
      <h1>We need to confirm your school access.</h1>
      <p className="accessLead">{message || accessReasonMessage(reason)}</p>
      {email && <div className="signedInIdentity"><span>Signed in as</span><strong>{email}</strong></div>}
      <div className="accessChecklist">
        <div><span>1</span><p><strong>School subscription</strong><small>Your school or trust needs an active Teaching CPD subscription or 14-day trial.</small></p></div>
        <div><span>2</span><p><strong>Verified email domain</strong><small>The first School Admin can use a new trial immediately. Domain verification is required before additional staff can auto-join.</small></p></div>
        <div><span>3</span><p><strong>Automatic staff membership</strong><small>Once the domain is verified, staff using the school domain join the correct organisation automatically.</small></p></div>
      </div>
      <div className="phaseActions accessActions">
        <button className="primary" disabled={busy} onClick={retry}>{busy ? "Checking…" : "Check again"}</button>
        {canStartTrial && <a className="secondary phaseLinkButton" href="/school-trial">Start 14-day School trial</a>}
        <button className="secondary" onClick={signOut}>Use a different account</button>
      </div>
      <p className="muted">If your school already has access, ask the school CPD lead to check its subscription and verified domain. If you are setting up a new school, you can start the full School trial above.</p>
    </section>
  </main>;
}

function nextPath() {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
