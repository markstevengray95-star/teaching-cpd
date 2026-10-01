"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SetupData = {
  schoolName: string;
  status: string;
  periodEnd: string | null;
  verifiedDomains: number;
  pendingDomains: number;
};

export default function SchoolTrialSetupPage() {
  const [data, setData] = useState<SetupData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent("/school-trial/setup")}`);
        return;
      }
      const { data: profile, error: profileError } = await client
        .from("staff_profiles")
        .select("organisation_id,role")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError || !profile?.organisation_id) {
        setMessage(profileError?.message || "Your school trial has not been linked to this account yet.");
        return;
      }
      const orgId = profile.organisation_id;
      const [org, subscription, domains] = await Promise.all([
        client.from("organisations").select("name").eq("id", orgId).single(),
        client.from("school_subscriptions").select("status,current_period_end").eq("organisation_id", orgId).maybeSingle(),
        client.from("organisation_domains").select("status").eq("organisation_id", orgId),
      ]);
      if (!active) return;
      const errors = [org.error?.message, subscription.error?.message, domains.error?.message].filter(Boolean);
      if (errors.length) setMessage(errors.join(" · "));
      setData({
        schoolName: org.data?.name || "Your school",
        status: subscription.data?.status || "trialing",
        periodEnd: subscription.data?.current_period_end || null,
        verifiedDomains: (domains.data || []).filter(d => d.status === "verified").length,
        pendingDomains: (domains.data || []).filter(d => d.status === "pending").length,
      });
    })();
    return () => { active = false; };
  }, []);

  return <main className="stagePage schoolTrialSetupPage">
    <section className="stageHero">
      <span className="eyebrow">SCHOOL TRIAL · GUIDED SETUP</span>
      <h1>{data?.schoolName || "Finish setting up your school"}</h1>
      <p>Follow these steps to turn the trial into a working whole-school CPD space. Your own School Admin access works immediately; domain verification is only needed before colleagues join automatically.</p>
      <div className="schoolAuthTrust"><span>✓ {data?.status === "trialing" ? "Trial active" : data?.status || "Checking trial"}</span><span>✓ Full School features</span><span>✓ School Admin access</span></div>
    </section>

    {message && <div className="phaseNotice" role="status">{message}</div>}

    <section className="stageStatGrid">
      <div className="stageStat"><strong>{data?.periodEnd ? new Date(data.periodEnd).toLocaleDateString("en-GB") : "14 days"}</strong><span>trial end</span></div>
      <div className="stageStat"><strong>{data?.verifiedDomains ?? 0}</strong><span>verified domains</span></div>
      <div className="stageStat"><strong>{data?.pendingDomains ?? 0}</strong><span>domains awaiting verification</span></div>
      <div className="stageStat"><strong>Admin</strong><span>your access</span></div>
    </section>

    <section className="stageGrid">
      <article className="stageCard stageSpan6">
        <span className="eyebrow">STEP 1</span><h2>Confirm school access</h2>
        <p>Open School Access to check the trial status and add the email domain your staff use.</p>
        <a className="primary phaseLinkButton" href="/school-access">Open School Access</a>
      </article>
      <article className="stageCard stageSpan6">
        <span className="eyebrow">STEP 2</span><h2>Get the school domain verified</h2>
        <p>Request the domain in School Access. The Platform Owner verifies it before staff are allowed to auto-join. Your own School Admin access does not wait for this.</p>
        <a className="secondary phaseLinkButton" href="/school-access">Manage domain</a>
      </article>
      <article className="stageCard stageSpan6">
        <span className="eyebrow">STEP 3</span><h2>Set up staff access</h2>
        <p>After the domain is verified, staff can use their school email to create an account. Use Staff Access to promote CPD Leads, Department Leads or additional Admins.</p>
        <a className="secondary phaseLinkButton" href="/staff-access">Open Staff Access</a>
      </article>
      <article className="stageCard stageSpan6">
        <span className="eyebrow">STEP 4</span><h2>Start using CPD</h2>
        <p>Browse the full course catalogue, assign CPD, use the compliance tools and explore the school development workflows included in the trial.</p>
        <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/">Browse courses</a><a className="secondary phaseLinkButton" href="/admin">CPD admin</a></div>
      </article>
    </section>

    <section className="stageCard">
      <span className="eyebrow">SHARE WITH STAFF</span><h2>What to tell colleagues once the domain is verified</h2>
      <p>Ask staff to open Teaching CPD, choose their school sign-in method or create an email/password account using their school address. The verified domain connects them to the correct school automatically.</p>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/auth">Open sign-in page</a><a className="secondary phaseLinkButton" href="/dashboard">Go to dashboard</a></div>
    </section>
  </main>;
}
