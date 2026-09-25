"use client";

import { useEffect, useMemo, useState } from "react";
import { auditDomains, calculateAudit } from "@/lib/needsAudit";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SavedAudit = { id: string; domain_scores: Record<string, number>; priority_domains: string[]; recommended_courses: string[]; recommended_pathways: string[]; summary: string; submitted_at: string };

export default function NeedsAuditPage() {
  const [userId, setUserId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(auditDomains.map(d => [d.id, 3])));
  const [latest, setLatest] = useState<SavedAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/needs-audit"; return; }
      if (!alive) return;
      setUserId(auth.user.id);
      const { data, error } = await supabase.from("needs_audits").select("id,domain_scores,priority_domains,recommended_courses,recommended_pathways,summary,submitted_at").eq("user_id", auth.user.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
      if (error) setMessage(error.message);
      if (data) { const audit = data as SavedAudit; setLatest(audit); setScores(prev => ({ ...prev, ...(audit.domain_scores || {}) })); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const preview = useMemo(() => calculateAudit(scores), [scores]);

  async function saveAudit() {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient(); if (!supabase) return;
    setSaving(true); setMessage("");
    const payload = {
      user_id: userId,
      responses: { scale: "1 = highest development need, 5 = strongest confidence" },
      domain_scores: preview.scores,
      priority_domains: preview.priorities.map(p => p.id),
      recommended_courses: preview.courseIds,
      recommended_pathways: preview.pathwayIds,
      summary: preview.summary,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("needs_audits").insert(payload).select("id,domain_scores,priority_domains,recommended_courses,recommended_pathways,summary,submitted_at").single();
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setLatest(data as SavedAudit); setMessage("Needs audit saved to your private CPD record.");
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Loading your CPD needs audit…</div></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 7 · CPD NEEDS AUDIT</span><h1>Identify your strongest development priorities.</h1><p>Rate your current confidence in each area. Your individual answers are private to your account and are used to generate course and pathway suggestions.</p>{latest && <div className="stageHeroActions"><span className="stageBadge good">Last completed {new Date(latest.submitted_at).toLocaleDateString("en-GB")}</span><a className="secondary phaseLinkButton" href="/coach">Open CPD Coach</a></div>}</section>
    {message && <div className="phaseNotice">{message}</div>}
    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">SELF-ASSESSMENT</span><h2>How confident are you in each area?</h2><p className="muted">1 = priority development need · 5 = strong, consistent confidence</p><div className="auditList">{auditDomains.map(domain => <div className="auditRow" key={domain.id}><div><strong>{domain.title}</strong><p>{domain.description}</p></div><div className="auditScale" aria-label={`${domain.title} confidence`}>
        {[1,2,3,4,5].map(value => <button key={value} className={scores[domain.id] === value ? "active" : ""} onClick={() => setScores(prev => ({ ...prev, [domain.id]: value }))}>{value}</button>)}
      </div></div>)}</div><button className="primary" disabled={saving} onClick={saveAudit}>{saving ? "Saving…" : "Save audit & recommendations"}</button></div>
      <aside className="stageCard stageSpan5"><span className="eyebrow">LIVE RECOMMENDATION</span><h2>Your three priority areas</h2><div className="stageList">{preview.priorities.map((p, i) => <div className="stageRow" key={p.id}><span className="stageBadge">{i+1}</span><div className="stageRowMain"><strong>{p.title}</strong><span>Confidence {scores[p.id]}/5</span></div></div>)}</div><p>{preview.summary}</p></aside>
    </section>
    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">RECOMMENDED COURSES</span><h2>Useful next learning</h2><div className="stageList">{preview.courseIds.map(id => { const c = courses.find(x => x.id === id); return c ? <div className="stageRow" key={id}><div className="stageRowMain"><strong>{c.title}</strong><span>{c.category} · {c.duration} minutes</span></div><a className="textButton" href={`/?course=${encodeURIComponent(c.id)}`}>Open →</a></div> : null; })}</div></div>
      <div className="stageCard stageSpan5"><span className="eyebrow">PATHWAYS</span><h2>Structured development routes</h2><div className="stageList">{preview.pathwayIds.map(id => { const p = pathways.find(x => x.id === id); return p ? <div className="stageRow" key={id}><div className="stageRowMain"><strong>{p.title}</strong><span>{p.audience}</span></div><a className="textButton" href="/pathways">View →</a></div> : null; })}{!preview.pathwayIds.length && <div className="emptyCompact">Complete the audit to generate pathway recommendations.</div>}</div></div>
    </section>
  </main>;
}
