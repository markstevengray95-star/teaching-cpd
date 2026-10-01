"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; organisation_id: string | null };

export default function SchoolTrialPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent("/school-trial")}`);
        return;
      }
      if (!active) return;
      setEmail(auth.user.email || "");

      // A brand-new Auth user may not have a staff_profiles row yet. That is OK:
      // bootstrap_organisation creates it transactionally when the trial starts.
      const { data: profile, error } = await client
        .from("staff_profiles")
        .select("id,organisation_id")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setMessage(`Account check: ${error.message}`);
      if ((profile as Profile | null)?.organisation_id) {
        window.location.replace("/school-access");
        return;
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  async function sendSetupLink(targetEmail: string) {
    if (!targetEmail) return false;
    const client = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth?next=${encodeURIComponent("/school-trial/setup")}`;
    const { error } = await client.auth.signInWithOtp({
      email: targetEmail,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    if (error) {
      setMessage(`Your trial is active, but the setup email could not be sent: ${error.message}. You can continue setup on this screen.`);
      return false;
    }
    return true;
  }

  async function startTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const schoolName = String(fields.get("name") || "").trim();
    const siteName = String(fields.get("site_name") || "").trim();
    const academicYear = String(fields.get("academic_year") || "2026/27").trim();
    if (!schoolName) return;

    setBusy(true);
    setMessage("");
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.rpc("bootstrap_organisation", {
      p_name: schoolName,
      p_slug: "",
      p_academic_year: academicYear,
      p_site_name: siteName,
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    if (!data) {
      setMessage("The trial could not be created. Please try again.");
      setBusy(false);
      return;
    }

    const sent = await sendSetupLink(email);
    setEmailSent(sent);
    setStarted(true);
    if (sent) setMessage(`Your 14-day School trial is active. A secure setup link has been emailed to ${email}.`);
    setBusy(false);
  }

  if (!ready) return <main className="stagePage"><div className="stageCard">Preparing your school trial…</div></main>;

  if (started) return <main className="stagePage schoolTrialPage">
    <section className="stageHero">
      <span className="eyebrow">TRIAL ACTIVE</span>
      <h1>Your 14-day School trial is ready.</h1>
      <p>You now have full School Admin access. {emailSent ? `A secure setup link has also been sent to ${email}.` : "Use the guided setup below to finish configuring your school."}</p>
      <div className="schoolAuthTrust"><span>✓ Full School access</span><span>✓ School Admin enabled</span><span>✓ 14 days active</span></div>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/school-trial/setup">Open guided setup</a><a className="secondary phaseLinkButton" href="/dashboard">Open dashboard</a></div>
    </section>
    {message && <div className="phaseNotice" role="status">{message}</div>}
    <section className="stageCard">
      <span className="eyebrow">NEXT STEPS</span>
      <h2>Get the school ready for staff</h2>
      <div className="schoolAccessSteps">
        <div><span>1</span><strong>Check your school details</strong><p>Confirm the school name, academic year and main site.</p></div>
        <div><span>2</span><strong>Add the school email domain</strong><p>Open School Access and request the domain your staff use for their school accounts.</p></div>
        <div><span>3</span><strong>Verify the domain</strong><p>The Platform Owner verifies it before other staff can auto-join.</p></div>
        <div><span>4</span><strong>Invite staff to sign in</strong><p>Once verified, staff on that domain can create accounts and join automatically.</p></div>
      </div>
    </section>
  </main>;

  return <main className="stagePage schoolTrialPage">
    <section className="stageHero">
      <span className="eyebrow">14-DAY SCHOOL TRIAL</span>
      <h1>Try the complete Teaching CPD school platform.</h1>
      <p>The trial uses the full School entitlement for 14 days. You become the first School Admin, so you can explore the complete CPD catalogue, school workflows, staff tools, course creation, reporting and administration immediately.</p>
      <div className="schoolAuthTrust"><span>✓ Full School feature access</span><span>✓ 14 days from activation</span><span>✓ You become School Admin</span></div>
    </section>

    {message && <div className="phaseNotice" role="status">{message}</div>}

    <section className="stageGrid">
      <div className="stageCard stageSpan7">
        <span className="eyebrow">START TRIAL</span>
        <h2>Create your trial school</h2>
        <p>Your confirmed account becomes the first administrator. After setup, add the school email domain in School Access. Once the platform owner verifies that domain, additional staff can join automatically.</p>
        <form className="stageForm" onSubmit={startTrial}>
          <label>School / organisation name<input required name="name" placeholder="Example School" /></label>
          <label>Main site name<input name="site_name" placeholder="Main school" /></label>
          <label>Academic year<input required name="academic_year" defaultValue="2026/27" /></label>
          <button className="primary" disabled={busy}>{busy ? "Starting trial…" : "Start my 14-day School trial"}</button>
        </form>
      </div>

      <div className="stageCard stageSpan5">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h2>{email || "Signed-in school account"}</h2>
        <div className="schoolAccessSteps">
          <div><span>1</span><strong>Start trial</strong><p>The School plan is activated with trialing status and a 14-day end date.</p></div>
          <div><span>2</span><strong>Get setup link by email</strong><p>A secure email link takes you back to the guided School Admin setup.</p></div>
          <div><span>3</span><strong>Add school domain</strong><p>Request domain verification when you want colleagues to join automatically.</p></div>
        </div>
      </div>
    </section>
  </main>;
}
