"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; role: string; organisation_id: string | null };
type Organisation = { id: string; name: string; access_mode: "legacy" | "domain_subscription" };
type Subscription = {
  plan: string;
  status: string;
  provider: string;
  seat_limit: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_until: string | null;
};
type Domain = { id: string; domain: string; status: "pending" | "verified" | "disabled"; is_primary: boolean; verified_at: string | null; created_at: string };

export default function SchoolAccessPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const admin = Boolean(profile && ["CPD Lead", "Admin"].includes(profile.role));
  const schoolAdmin = profile?.role === "Admin";

  useEffect(() => {
    let alive = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/school-access"; return; }
      const { data: p, error: pError } = await client.from("staff_profiles").select("id,role,organisation_id").eq("id", auth.user.id).single();
      if (!alive) return;
      if (pError || !p) { setMessage(pError?.message || "Unable to load staff profile."); setLoading(false); return; }
      setProfile(p as Profile);
      if (!p.organisation_id) { setLoading(false); return; }
      const [orgResult, subResult, domainResult] = await Promise.all([
        client.from("organisations").select("id,name,access_mode").eq("id", p.organisation_id).single(),
        client.from("school_subscriptions").select("plan,status,provider,seat_limit,current_period_start,current_period_end,grace_until").eq("organisation_id", p.organisation_id).maybeSingle(),
        client.from("organisation_domains").select("id,domain,status,is_primary,verified_at,created_at").eq("organisation_id", p.organisation_id).order("is_primary", { ascending: false }).order("domain"),
      ]);
      if (!alive) return;
      if (orgResult.data) setOrganisation(orgResult.data as Organisation);
      if (subResult.data) setSubscription(subResult.data as Subscription);
      setDomains((domainResult.data || []) as Domain[]);
      const errors = [orgResult.error?.message, subResult.error?.message, domainResult.error?.message].filter(Boolean);
      if (errors.length) setMessage(errors.join(" · "));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  async function requestDomain(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile?.organisation_id || !admin) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = String(fd.get("domain") || "").trim().toLowerCase().replace(/^@/, "");
    if (!raw.includes(".") || raw.includes("@")) { setMessage("Enter the school email domain only, for example school.org.uk."); return; }
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.from("organisation_domains").insert({ organisation_id: profile.organisation_id, domain: raw, is_primary: domains.length === 0, created_by: profile.id }).select("id,domain,status,is_primary,verified_at,created_at").single();
    if (error) { setMessage(error.message); return; }
    setDomains(prev => [...prev, data as Domain].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.domain.localeCompare(b.domain)));
    form.reset();
    setMessage("Domain request saved. Automatic staff access starts only after platform verification.");
  }

  async function removeDomain(id: string) {
    if (!admin) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("organisation_domains").delete().eq("id", id);
    if (error) setMessage(error.message); else { setDomains(prev => prev.filter(d => d.id !== id)); setMessage("Pending domain removed."); }
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Loading school access settings…</div></main>;
  if (!profile?.organisation_id) return <main className="stagePage"><section className="stageHero"><span className="eyebrow">SCHOOL ACCESS</span><h1>Connect your account to an organisation first.</h1><p>School subscription and domain controls become available after the organisation has been created or joined.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/organisation">Open organisation setup</a></div></section></main>;

  const active = organisation?.access_mode === "legacy" || subscriptionAllowsAccess(subscription);
  return <main className="stagePage">
    <section className="stageHero schoolAccessHero"><span className="eyebrow">SCHOOL SUBSCRIPTION & LOGIN</span><h1>{organisation?.name || "School access"}</h1><p>Once the School plan is active and the email domain is verified, any staff member using that school email can create an account and join automatically. New accounts start as Staff; School Admins control higher access levels.</p><div className="stageHeroActions">{schoolAdmin&&<a className="primary phaseLinkButton" href="/staff-access">Manage staff access</a>}<a className="secondary phaseLinkButton" href="/auth">Open staff sign in</a></div></section>
    {message && <div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid">
      <div className="stageStat"><strong>{active ? "Active" : "Paused"}</strong><span>school access</span></div>
      <div className="stageStat"><strong>{domains.filter(d => d.status === "verified").length}</strong><span>verified domains</span></div>
      <div className="stageStat"><strong>{domains.filter(d => d.status === "pending").length}</strong><span>pending domains</span></div>
      <div className="stageStat"><strong>{subscription?.plan?.toLowerCase()==="school"?"All":subscription?.seat_limit ?? "∞"}</strong><span>{subscription?.plan?.toLowerCase()==="school"?"staff included":"staff limit"}</span></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan5"><span className="eyebrow">SUBSCRIPTION</span><h2>{organisation?.access_mode === "legacy" ? "Existing organisation access" : "School licence"}</h2>{organisation?.access_mode === "legacy" ? <p>This existing organisation is currently in compatibility mode so current staff are not disrupted. Commercial schools use subscription/domain enforcement.</p> : subscription ? <div className="subscriptionDetails"><div><span>Status</span><strong className={`subscriptionStatus ${subscription.status}`}>{subscription.status}</strong></div><div><span>Plan</span><strong>{subscription.plan}</strong></div><div><span>Staff access</span><strong>{subscription.plan.toLowerCase()==="school"?"Whole school":subscription.seat_limit??"Unlimited"}</strong></div><div><span>Provider</span><strong>{subscription.provider}</strong></div><div><span>Current period ends</span><strong>{formatDate(subscription.current_period_end)}</strong></div>{subscription.grace_until && <div><span>Grace access until</span><strong>{formatDate(subscription.grace_until)}</strong></div>}</div> : <p>No subscription record is attached. Commercial access will remain paused until the school is provisioned.</p>}</div>

      <div className="stageCard stageSpan7"><span className="eyebrow">EMAIL DOMAINS</span><h2>Automatic staff account access</h2><p>For example, verifying <strong>school.org.uk</strong> means a confirmed staff account ending in <strong>@school.org.uk</strong> can create/join this organisation automatically while the subscription is active.</p><div className="domainList">{domains.length ? domains.map(domain => <div className="domainRow" key={domain.id}><div><strong>@{domain.domain}</strong><span>{domain.is_primary ? "Primary domain · " : ""}{domain.verified_at ? `Verified ${formatDate(domain.verified_at)}` : "Awaiting verification"}</span></div><span className={`domainStatus ${domain.status}`}>{domain.status}</span>{admin && domain.status !== "verified" && <button className="textButton" onClick={() => removeDomain(domain.id)}>Remove</button>}</div>) : <div className="emptyState"><strong>No school domain added yet</strong><p>Add the staff email domain used by your school.</p></div>}</div>{admin && <form className="domainRequestForm" onSubmit={requestDomain}><label>Request a school domain<input name="domain" required placeholder="school.org.uk" autoCapitalize="none" autoCorrect="off" /></label><button className="primary">Request verification</button></form>}<div className="domainSecurityNote"><strong>Why verification is separate</strong><p>A school administrator can request a domain but cannot mark it verified. This prevents an organisation from claiming a domain it does not control and gaining access for unrelated staff accounts.</p></div></div>
    </section>

    <section className="stageCard"><span className="eyebrow">STAFF ONBOARDING</span><h2>What staff experience</h2><div className="schoolAccessSteps"><div><span>1</span><strong>Open Teaching CPD</strong><p>Staff choose Google or email and password.</p></div><div><span>2</span><strong>Create or sign into account</strong><p>The identity provider confirms the staff member's school email address.</p></div><div><span>3</span><strong>Domain is matched</strong><p>The verified email domain is mapped to this active school subscription.</p></div><div><span>4</span><strong>Staff access is created</strong><p>The account joins as Staff automatically; a School Admin can promote it to Department Lead, CPD Lead or Admin.</p></div></div></section>
  </main>;
}

function subscriptionAllowsAccess(subscription: Subscription | null) {
  if (!subscription) return false;
  const now = Date.now();
  if (["active", "trialing"].includes(subscription.status)) return !subscription.current_period_end || new Date(subscription.current_period_end).getTime() >= now;
  return subscription.status === "past_due" && Boolean(subscription.grace_until && new Date(subscription.grace_until).getTime() >= now);
}
function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString("en-GB") : "Not set"; }
