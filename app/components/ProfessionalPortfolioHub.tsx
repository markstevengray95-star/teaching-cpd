"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import "./ProfessionalPortfolioHub.css";

type PortfolioEntry = {
  id: string;
  title: string;
  description: string;
  evidence_type: string;
  course_id: string | null;
  external_link: string | null;
  evidence_path: string | null;
  cpd_hours: number | string;
  occurred_on: string;
  impact_summary: string;
  next_step: string;
  standards: string[];
  related_target_id: string | null;
  related_coaching_cycle_id: string | null;
  created_at: string;
};
type CourseProgress = { course_id: string; completed_at: string | null };
type ExternalCpd = { id: string; title: string; provider: string; occurred_on: string; cpd_hours: number | string; category: string; notes: string; verification_status: string };
type Target = { id: string; title: string; description: string; success_criteria: string; review_date: string | null; status: string };
type ImpactReview = { id: string; source_title: string; review_stage: string; due_on: string; reviewed_at: string | null; implementation_status: string | null; confidence: number | null; evidence_type: string; impact_note: string; next_step: string };
type CoachingCycle = { id: string; title: string; focus: string; coach_name: string; start_date: string; review_date: string | null; status: string; completion_summary: string };
type Filter = "all" | "manual" | "courses" | "external" | "coaching" | "impact";

const evidenceLabels: Record<string, string> = {
  reflection: "Reflection",
  course: "Course evidence",
  live_cpd: "Live CPD",
  external_cpd: "External CPD",
  classroom_evidence: "Classroom evidence",
  coaching: "Coaching",
  observation: "Observation",
  pupil_work: "Pupil work",
  assessment: "Assessment evidence",
  other: "Other",
};

const standardOptions = [
  "Teaching & learning",
  "Subject knowledge",
  "Curriculum",
  "Assessment",
  "Behaviour & routines",
  "SEND & inclusion",
  "Pastoral",
  "Leadership",
  "Professional responsibilities",
];

export default function ProfessionalPortfolioHub() {
  const [userId, setUserId] = useState("");
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [external, setExternal] = useState<ExternalCpd[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [impact, setImpact] = useState<ImpactReview[]>([]);
  const [coaching, setCoaching] = useState<CoachingCycle[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), []);
  const completedCourses = useMemo(() => progress.filter((row) => row.completed_at), [progress]);
  const externalHours = external.reduce((sum, item) => sum + Number(item.cpd_hours || 0), 0);
  const manualHours = entries.reduce((sum, item) => sum + Number(item.cpd_hours || 0), 0);
  const courseHours = completedCourses.reduce((sum, row) => sum + ((courseMap.get(row.course_id)?.duration || 0) / 60), 0);
  const reviewsDue = impact.filter((item) => !item.reviewed_at && new Date(`${item.due_on}T23:59:59`).getTime() <= Date.now()).length;

  useEffect(() => {
    let alive = true;
    const client = getSupabaseBrowserClient();
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.replace("/auth?next=/portfolio"); return; }
      if (!alive) return;
      setUserId(auth.user.id);
      const [p, c, e, t, i, k] = await Promise.all([
        client.from("portfolio_entries").select("id,title,description,evidence_type,course_id,external_link,evidence_path,cpd_hours,occurred_on,impact_summary,next_step,standards,related_target_id,related_coaching_cycle_id,created_at").eq("user_id", auth.user.id).order("occurred_on", { ascending: false }),
        client.from("staff_development_course_progress").select("course_id,completed_at").eq("user_id", auth.user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        client.from("external_cpd_records").select("id,title,provider,occurred_on,cpd_hours,category,notes,verification_status").eq("user_id", auth.user.id).order("occurred_on", { ascending: false }),
        client.from("development_targets").select("id,title,description,success_criteria,review_date,status").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
        client.from("cpd_impact_reviews").select("id,source_title,review_stage,due_on,reviewed_at,implementation_status,confidence,evidence_type,impact_note,next_step").eq("user_id", auth.user.id).order("due_on", { ascending: false }),
        client.from("coaching_cycles").select("id,title,focus,coach_name,start_date,review_date,status,completion_summary").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
      ]);
      if (!alive) return;
      const errors = [p.error, c.error, e.error, t.error, i.error, k.error].filter(Boolean);
      if (errors.length) setMessage(errors.map((error) => error?.message).join(" · "));
      setEntries((p.data || []) as PortfolioEntry[]);
      setProgress((c.data || []) as CourseProgress[]);
      setExternal((e.data || []) as ExternalCpd[]);
      setTargets((t.data || []) as Target[]);
      setImpact((i.data || []) as ImpactReview[]);
      setCoaching((k.data || []) as CoachingCycle[]);
      setLoading(false);
    })().catch((error) => { console.error(error); if (alive) { setMessage("Your professional portfolio could not be loaded."); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const manualVisible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((item) => !needle || `${item.title} ${item.description} ${item.impact_summary} ${item.next_step} ${item.standards.join(" ")}`.toLowerCase().includes(needle));
  }, [entries, query]);

  const targetMap = useMemo(() => new Map(targets.map((item) => [item.id, item.title])), [targets]);
  const coachingMap = useMemo(() => new Map(coaching.map((item) => [item.id, item.title])), [coaching]);

  function startNew() {
    setEditingId(null);
    setShowForm(true);
  }

  function editEntry(entry: PortfolioEntry) {
    setEditingId(entry.id);
    setShowForm(true);
    window.setTimeout(() => document.getElementById("portfolio-evidence-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    const form = new FormData(event.currentTarget);
    const standards = standardOptions.filter((item) => form.getAll("standards").includes(item));
    const rawLink = String(form.get("external_link") || "").trim();
    let externalLink: string | null = null;
    if (rawLink) {
      try {
        const parsed = new URL(rawLink);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        externalLink = parsed.toString();
      } catch {
        setMessage("Use a valid http or https evidence link, or leave it blank.");
        return;
      }
    }
    const payload = {
      user_id: userId,
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      evidence_type: String(form.get("evidence_type") || "reflection"),
      course_id: String(form.get("course_id") || "") || null,
      external_link: externalLink,
      cpd_hours: Math.max(0, Number(form.get("cpd_hours") || 0)),
      occurred_on: String(form.get("occurred_on") || today()),
      impact_summary: String(form.get("impact_summary") || "").trim(),
      next_step: String(form.get("next_step") || "").trim(),
      standards,
      related_target_id: String(form.get("related_target_id") || "") || null,
      related_coaching_cycle_id: String(form.get("related_coaching_cycle_id") || "") || null,
      updated_at: new Date().toISOString(),
    };
    const client = getSupabaseBrowserClient();
    if (editingId) {
      const { data, error } = await client.from("portfolio_entries").update(payload).eq("id", editingId).eq("user_id", userId).select("id,title,description,evidence_type,course_id,external_link,evidence_path,cpd_hours,occurred_on,impact_summary,next_step,standards,related_target_id,related_coaching_cycle_id,created_at").single();
      if (error) { setMessage(error.message); return; }
      setEntries((previous) => previous.map((item) => item.id === editingId ? data as PortfolioEntry : item));
      setMessage("Portfolio evidence updated.");
    } else {
      const { data, error } = await client.from("portfolio_entries").insert(payload).select("id,title,description,evidence_type,course_id,external_link,evidence_path,cpd_hours,occurred_on,impact_summary,next_step,standards,related_target_id,related_coaching_cycle_id,created_at").single();
      if (error) { setMessage(error.message); return; }
      setEntries((previous) => [data as PortfolioEntry, ...previous]);
      setMessage("Evidence added to your professional portfolio.");
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function removeEntry(entry: PortfolioEntry) {
    if (!window.confirm(`Remove “${entry.title}” from your portfolio?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("portfolio_entries").delete().eq("id", entry.id).eq("user_id", userId);
    if (error) { setMessage(error.message); return; }
    if (entry.evidence_path) await client.storage.from("cpd-evidence").remove([entry.evidence_path]);
    setEntries((previous) => previous.filter((item) => item.id !== entry.id));
    setMessage("Portfolio evidence removed.");
  }

  async function openPrivateEvidence(entry: PortfolioEntry) {
    if (!entry.evidence_path) return;
    const { data, error } = await getSupabaseBrowserClient().storage.from("cpd-evidence").createSignedUrl(entry.evidence_path, 300);
    if (error || !data?.signedUrl) { setMessage(error?.message || "Unable to open the evidence file."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <main className="pfPage"><div className="pfLoading">Opening your professional portfolio…</div></main>;

  const editing = editingId ? entries.find((item) => item.id === editingId) : null;
  const showManual = filter === "all" || filter === "manual";
  const showCourses = filter === "all" || filter === "courses";
  const showExternal = filter === "all" || filter === "external";
  const showCoaching = filter === "all" || filter === "coaching";
  const showImpact = filter === "all" || filter === "impact";

  return <main className="pfPage">
    <header className="pfTopbar"><Link href="/develop">← Develop</Link><div><span>PHASE 40</span><strong>Professional Portfolio</strong></div><button onClick={() => window.print()}>Print / Save PDF</button></header>

    <section className="pfHero"><div><span className="pfEyebrow">YOUR PROFESSIONAL STORY</span><h1>Evidence of learning, implementation and impact.</h1><p>Bring CPD, external learning, coaching, development targets and impact evidence into one private professional record.</p><div className="pfHeroActions"><button className="primary" onClick={startNew}>+ Add evidence</button><Link href="/professional-learning">Professional learning</Link><Link href="/coaching">Coaching</Link></div></div><div className="pfHeroCard"><strong>{(courseHours + externalHours + manualHours).toFixed(1)}</strong><span>recorded CPD hours</span><small>Courses + external CPD + portfolio entries</small></div></section>

    {message && <div className="pfNotice" role="status">{message}</div>}
    <div className="pfPrivacy">Private professional record. Avoid adding confidential pupil-identifiable information to reflective evidence.</div>

    <section className="pfStats">
      <article><strong>{completedCourses.length}</strong><span>completed courses</span></article>
      <article><strong>{external.length}</strong><span>external CPD records</span></article>
      <article><strong>{entries.length}</strong><span>evidence entries</span></article>
      <article><strong>{targets.filter((item) => item.status !== "completed").length}</strong><span>active development focuses</span></article>
      <article className={reviewsDue ? "attention" : ""}><strong>{reviewsDue}</strong><span>impact reviews due</span></article>
    </section>

    {showForm && <section className="pfFormCard" id="portfolio-evidence-form"><div className="pfSectionHead"><div><span className="pfEyebrow">{editing ? "EDIT EVIDENCE" : "NEW EVIDENCE"}</span><h2>{editing ? editing.title : "Add to your portfolio"}</h2></div><button onClick={() => { setShowForm(false); setEditingId(null); }}>Close</button></div><form className="pfForm" onSubmit={saveEntry} key={editing?.id || "new"}>
      <label>Title<input name="title" required defaultValue={editing?.title || ""} placeholder="e.g. Applied retrieval routines across Year 9" /></label>
      <label>Evidence type<select name="evidence_type" defaultValue={editing?.evidence_type || "classroom_evidence"}>{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Date<input type="date" name="occurred_on" required defaultValue={editing?.occurred_on || today()} /></label>
      <label>CPD hours<input type="number" name="cpd_hours" min="0" max="999" step="0.25" defaultValue={Number(editing?.cpd_hours || 0)} /></label>
      <label>Related course<select name="course_id" defaultValue={editing?.course_id || ""}><option value="">None</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
      <label>Related development target<select name="related_target_id" defaultValue={editing?.related_target_id || ""}><option value="">None</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.title}</option>)}</select></label>
      <label>Related coaching cycle<select name="related_coaching_cycle_id" defaultValue={editing?.related_coaching_cycle_id || ""}><option value="">None</option>{coaching.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.title}</option>)}</select></label>
      <label>Evidence link<input type="url" name="external_link" defaultValue={editing?.external_link || ""} placeholder="https://…" /></label>
      <label className="wide">Reflection / evidence summary<textarea name="description" rows={4} defaultValue={editing?.description || ""} placeholder="What did you learn, try or observe?" /></label>
      <label className="wide">Impact on practice<textarea name="impact_summary" rows={3} defaultValue={editing?.impact_summary || ""} placeholder="What changed in your practice, confidence or outcomes?" /></label>
      <label className="wide">Next step<textarea name="next_step" rows={2} defaultValue={editing?.next_step || ""} placeholder="What will you refine, repeat or investigate next?" /></label>
      <fieldset className="wide"><legend>Professional areas</legend><div className="pfChecks">{standardOptions.map((standard) => <label key={standard}><input type="checkbox" name="standards" value={standard} defaultChecked={editing?.standards.includes(standard)} />{standard}</label>)}</div></fieldset>
      <div className="wide"><button className="primary">{editing ? "Update evidence" : "Save evidence"}</button></div>
    </form></section>}

    <section className="pfToolbar"><div>{(["all","manual","courses","external","coaching","impact"] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "active" : ""}>{item === "all" ? "All evidence" : item[0].toUpperCase() + item.slice(1)}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your portfolio…" /></section>

    <section className="pfGrid">
      {showManual && <article className="pfPanel"><div className="pfSectionHead"><div><span className="pfEyebrow">CURATED EVIDENCE</span><h2>Your evidence entries</h2></div><span>{manualVisible.length}</span></div><div className="pfList">{manualVisible.map((entry) => <div className="pfItem" key={entry.id}><div className="pfItemTop"><div><span>{evidenceLabels[entry.evidence_type] || entry.evidence_type}</span><h3>{entry.title}</h3></div><small>{formatDate(entry.occurred_on)}</small></div><p>{entry.description || "No reflection added."}</p>{entry.impact_summary && <div className="pfImpact"><strong>Impact</strong><span>{entry.impact_summary}</span></div>}{entry.next_step && <div className="pfImpact"><strong>Next</strong><span>{entry.next_step}</span></div>}<div className="pfTags">{entry.standards.map((standard) => <span key={standard}>{standard}</span>)}{entry.related_target_id && <span>Target: {targetMap.get(entry.related_target_id) || "Linked"}</span>}{entry.related_coaching_cycle_id && <span>Coaching: {coachingMap.get(entry.related_coaching_cycle_id) || "Linked"}</span>}</div><div className="pfActions"><button onClick={() => editEntry(entry)}>Edit</button>{entry.external_link && <a href={entry.external_link} target="_blank" rel="noreferrer">Open link ↗</a>}{entry.evidence_path && <button onClick={() => openPrivateEvidence(entry)}>Open file ↗</button>}<button className="danger" onClick={() => removeEntry(entry)}>Remove</button></div></div>)}{!manualVisible.length && <div className="pfEmpty">No portfolio entries match this view.</div>}</div></article>}

      {showCourses && <article className="pfPanel"><div className="pfSectionHead"><div><span className="pfEyebrow">AUTOMATIC</span><h2>Completed CPD</h2></div><span>{completedCourses.length}</span></div><div className="pfList">{completedCourses.map((row) => { const course = courseMap.get(row.course_id); return <div className="pfItem compact" key={row.course_id}><div><span>Course</span><h3>{course?.title || row.course_id}</h3><p>{course?.summary || "Completed professional learning."}</p></div><div className="pfTags"><span>{course ? `${course.duration} min` : "Completed"}</span><span>{formatDate(row.completed_at || "")}</span></div></div>; })}{!completedCourses.length && <div className="pfEmpty">Completed courses will appear automatically.</div>}</div></article>}

      {showExternal && <article className="pfPanel"><div className="pfSectionHead"><div><span className="pfEyebrow">EXTERNAL LEARNING</span><h2>External CPD</h2></div><span>{external.length}</span></div><div className="pfList">{external.map((item) => <div className="pfItem compact" key={item.id}><div><span>{item.category || "External CPD"}</span><h3>{item.title}</h3><p>{item.provider}{item.notes ? ` · ${item.notes}` : ""}</p></div><div className="pfTags"><span>{Number(item.cpd_hours || 0).toFixed(1)} h</span><span>{formatDate(item.occurred_on)}</span><span>{item.verification_status}</span></div></div>)}{!external.length && <div className="pfEmpty">External CPD records from Professional Learning will appear here.</div>}</div></article>}

      {showCoaching && <article className="pfPanel"><div className="pfSectionHead"><div><span className="pfEyebrow">COACHING</span><h2>Coaching cycles</h2></div><Link href="/coaching">Open coaching →</Link></div><div className="pfList">{coaching.map((cycle) => <div className="pfItem compact" key={cycle.id}><div><span>{cycle.status}</span><h3>{cycle.title}</h3><p>{cycle.focus || "No focus recorded."}</p>{cycle.completion_summary && <div className="pfImpact"><strong>Completion reflection</strong><span>{cycle.completion_summary}</span></div>}</div><div className="pfTags"><span>{cycle.coach_name || "Self/peer coaching"}</span><span>{formatDate(cycle.start_date)}</span></div></div>)}{!coaching.length && <div className="pfEmpty">Coaching cycles will appear here automatically.</div>}</div></article>}

      {showImpact && <article className="pfPanel"><div className="pfSectionHead"><div><span className="pfEyebrow">IMPACT</span><h2>Implementation reviews</h2></div><Link href="/professional-learning">Open learning hub →</Link></div><div className="pfList">{impact.map((item) => <div className={`pfItem compact ${!item.reviewed_at && new Date(`${item.due_on}T23:59:59`).getTime() <= Date.now() ? "due" : ""}`} key={item.id}><div><span>{item.review_stage.replace("_", " ")}</span><h3>{item.source_title}</h3><p>{item.reviewed_at ? item.impact_note || "Impact review completed." : `Review due ${formatDate(item.due_on)}.`}</p>{item.next_step && <div className="pfImpact"><strong>Next</strong><span>{item.next_step}</span></div>}</div><div className="pfTags">{item.implementation_status && <span>{item.implementation_status.replace("_", " ")}</span>}{item.confidence && <span>Confidence {item.confidence}/5</span>}</div></div>)}{!impact.length && <div className="pfEmpty">Impact reviews scheduled from Professional Learning will appear here.</div>}</div></article>}
    </section>
  </main>;
}

function today() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function formatDate(value: string) { if (!value) return ""; const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
