"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; organisation_id: string | null };

export default function SchoolTrialPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent("/school-trial")}`);
        return;
      }
      if (!active) return;
      setEmail(auth.user.email || "");
      const { data: profile, error } = await client
        .from("staff_profiles")
        .select("id,organisation_id")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setMessage(error.message);
      if ((profile as Profile | null)?.organisation_id) {
        window.location.replace("/school-access");
        return;
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  async function startTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
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
    window.location.replace("/school-access");
  }

  if (!ready) return <main className="stagePage"><div className="stageCard">Preparing your school trial…</div></main>;

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
          <div><span>2</span><strong>Explore everything</strong><p>Your account receives School Admin access immediately.</p></div>
          <div><span>3</span><strong>Add school domain</strong><p>Request domain verification when you want colleagues to join automatically.</p></div>
        </div>
      </div>
    </section>
  </main>;
}
