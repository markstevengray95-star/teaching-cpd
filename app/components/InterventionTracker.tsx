"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import "./InterventionTracker.css";

type InterventionStatus = "Active" | "Review" | "Complete";
type InterventionType = "targeted_support" | "pastoral" | "attendance" | "behaviour" | "regulation" | "send" | "eal" | "academic" | "mentoring" | "other";
type Review = {
  id: string; intervention_id: string; reviewed_on: string; progress_rating: number | null;
  effectiveness: string; evidence: string; barriers: string; adaptations: string;
  next_steps: string; next_review_date: string | null; status_after: InterventionStatus;
};
type Intervention = {
  id: string; organization_id: string | null; student_id: string | null; student_ref: string;
  intervention_type: InterventionType; focus: string; zone: string | null; strategy: string;
  baseline_summary: string; goal: string; success_criteria: string; start_date: string;
  frequency: string; review_date: string | null; status: InterventionStatus; notes: string;
  outcome: string; last_reviewed_at: string | null; created_at: string;
};
type Student = { id: string; display_name: string; year_group: string | null; class_group: string | null };

const typeLabels: Record<InterventionType, string> = {
  targeted_support: "Targeted support", pastoral: "Pastoral", attendance: "Attendance", behaviour: "Behaviour",
  regulation: "Regulation", send: "SEND", eal: "EAL", academic: "Academic", mentoring: "Mentoring", other: "Other",
};
const types = Object.keys(typeLabels) as InterventionType[];

function dateInput(days = 28) {
  const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10);
}
function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InterventionTracker() {
  const [userId, setUserId] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InterventionStatus>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [reviewing, setReviewing] = useState<Intervention | null>(null);

  const [studentId, setStudentId] = useState("");
  const [studentRef, setStudentRef] = useState("");
  const [interventionType, setInterventionType] = useState<InterventionType>("targeted_support");
  const [focus, setFocus] = useState("");
  const [baseline, setBaseline] = useState("");
  const [goal, setGoal] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [strategy, setStrategy] = useState("");
  const [frequency, setFrequency] = useState("");
  const [reviewDate, setReviewDate] = useState(dateInput(28));
  const [notes, setNotes] = useState("");
  const [zone, setZone] = useState("");

  const [rating, setRating] = useState("3");
  const [effectiveness, setEffectiveness] = useState("some");
  const [evidence, setEvidence] = useState("");
  const [barriers, setBarriers] = useState("");
  const [adaptations, setAdaptations] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState(dateInput(28));
  const [statusAfter, setStatusAfter] = useState<InterventionStatus>("Active");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.assign("/auth?next=/interventions"); return; }
      const access = await resolveStaffAccess(client, auth.user);
      if (!mounted) return;
      setUserId(auth.user.id); setOrganizationId(access.organizationId);
      await load(access.organizationId);
      if (mounted) setLoading(false);
    })().catch((error) => {
      console.error(error); if (mounted) { setMessage("Intervention tracking could not be loaded yet."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  async function load(org: string | null) {
    const client = getSupabaseBrowserClient();
    let interventionQuery = client.from("staff_development_interventions").select("id,organization_id,student_id,student_ref,intervention_type,focus,zone,strategy,baseline_summary,goal,success_criteria,start_date,frequency,review_date,status,notes,outcome,last_reviewed_at,created_at").order("created_at", { ascending: false });
    if (org) interventionQuery = interventionQuery.eq("organization_id", org);
    const [interventionResult, studentResult] = await Promise.all([
      interventionQuery,
      org ? client.from("staff_development_students").select("id,display_name,year_group,class_group").eq("organization_id", org).eq("active", true).order("display_name") : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (interventionResult.error) setMessage(interventionResult.error.message);
    const rows = (interventionResult.data || []) as Intervention[];
    setInterventions(rows);
    setStudents((studentResult.data || []) as Student[]);
    if (rows.length) {
      const result = await client.from("staff_development_intervention_reviews").select("id,intervention_id,reviewed_on,progress_rating,effectiveness,evidence,barriers,adaptations,next_steps,next_review_date,status_after").in("intervention_id", rows.map((row) => row.id)).order("reviewed_on", { ascending: false });
      const grouped: Record<string, Review[]> = {};
      for (const review of (result.data || []) as Review[]) (grouped[review.intervention_id] ||= []).push(review);
      setReviews(grouped);
    } else setReviews({});
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeCount = interventions.filter((item) => item.status === "Active").length;
  const dueCount = interventions.filter((item) => item.status !== "Complete" && item.review_date && item.review_date <= today).length;
  const completeCount = interventions.filter((item) => item.status === "Complete").length;
  const ratings = Object.values(reviews).flat().map((item) => item.progress_rating).filter((value): value is number => typeof value === "number");
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";

  const visible = useMemo(() => interventions.filter((item) => {
    const statusOk = statusFilter === "All" || item.status === statusFilter;
    const q = search.trim().toLowerCase();
    const searchOk = !q || `${item.student_ref} ${item.focus} ${item.goal} ${item.strategy} ${typeLabels[item.intervention_type]}`.toLowerCase().includes(q);
    return statusOk && searchOk;
  }), [interventions, search, statusFilter]);

  async function createIntervention() {
    if (!userId || !focus.trim() || !(studentRef.trim() || studentId)) { setMessage("Add a student reference and intervention focus."); return; }
    const selected = students.find((student) => student.id === studentId);
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("staff_development_interventions").insert({
      organization_id: organizationId, created_by: userId, owner_user_id: userId,
      student_id: studentId || null, student_ref: selected?.display_name || studentRef.trim(), intervention_type: interventionType,
      focus: focus.trim(), zone: zone || null, strategy: strategy.trim(), baseline_summary: baseline.trim(), goal: goal.trim(),
      success_criteria: successCriteria.trim(), start_date: new Date().toISOString().slice(0, 10), frequency: frequency.trim(),
      review_date: reviewDate || null, review_interval_days: 28, status: "Active", notes: notes.trim(),
    });
    if (error) { setMessage(error.message); return; }
    setMessage("Intervention created and added to the review cycle.");
    setStudentId(""); setStudentRef(""); setFocus(""); setBaseline(""); setGoal(""); setSuccessCriteria(""); setStrategy(""); setFrequency(""); setNotes(""); setZone(""); setReviewDate(dateInput(28)); setShowCreate(false);
    await load(organizationId);
  }

  async function saveReview() {
    if (!reviewing || !userId) return;
    const client = getSupabaseBrowserClient();
    const reviewedOn = new Date().toISOString().slice(0, 10);
    const { error } = await client.from("staff_development_intervention_reviews").insert({
      intervention_id: reviewing.id, organization_id: reviewing.organization_id, created_by: userId, reviewed_on: reviewedOn,
      progress_rating: Number(rating), effectiveness, evidence: evidence.trim(), barriers: barriers.trim(), adaptations: adaptations.trim(),
      next_steps: nextSteps.trim(), next_review_date: statusAfter === "Complete" ? null : nextReviewDate || null, status_after: statusAfter,
    });
    if (error) { setMessage(error.message); return; }
    const update: Record<string, unknown> = { status: statusAfter, review_date: statusAfter === "Complete" ? null : nextReviewDate || null, last_reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (statusAfter === "Complete") { update.closed_at = new Date().toISOString(); update.outcome = nextSteps.trim() || evidence.trim(); }
    const result = await client.from("staff_development_interventions").update(update).eq("id", reviewing.id);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage("Review saved and the intervention cycle updated.");
    setReviewing(null); setEvidence(""); setBarriers(""); setAdaptations(""); setNextSteps(""); setRating("3"); setEffectiveness("some"); setStatusAfter("Active"); setNextReviewDate(dateInput(28));
    await load(organizationId);
  }

  if (loading) return <main className="itPage"><div className="itLoading">Loading intervention tracker…</div></main>;

  return <main className="itPage">
    <header className="itTopbar"><Link href="/students">← Students</Link><div><span>PHASE 38</span><strong>Intervention Tracking</strong></div><Link href="/send-eal">SEND & EAL →</Link></header>
    <section className="itHero"><div><span className="itEyebrow">PLAN · REVIEW · ADAPT</span><h1>Track whether support is actually helping.</h1><p>Set a baseline and goal, record the strategy being used, schedule reviews and build a clear history of evidence, adaptations and outcomes.</p></div><button onClick={() => setShowCreate(true)}>+ New intervention</button></section>
    <section className="itPrivacy"><strong>Student information</strong><p>Only record information needed for educational support and follow your school’s data-protection and safeguarding procedures. Safeguarding disclosures belong in the approved safeguarding system, not here.</p></section>
    <section className="itStats"><div><strong>{activeCount}</strong><span>active</span></div><div className={dueCount ? "attention" : ""}><strong>{dueCount}</strong><span>reviews due</span></div><div><strong>{completeCount}</strong><span>completed</span></div><div><strong>{avgRating}</strong><span>average review rating / 5</span></div></section>
    <section className="itToolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, focus, goal or strategy…"/><div>{(["All","Active","Review","Complete"] as const).map((item) => <button className={statusFilter === item ? "active" : ""} key={item} onClick={() => setStatusFilter(item)}>{item}</button>)}</div></section>
    <section className="itGrid">{visible.map((item) => {
      const itemReviews = reviews[item.id] || []; const latest = itemReviews[0]; const due = item.status !== "Complete" && item.review_date && item.review_date <= today;
      return <article className={`itCard ${due ? "due" : ""}`} key={item.id}>
        <div className="itCardMeta"><span>{typeLabels[item.intervention_type]}</span><span className={`status ${item.status.toLowerCase()}`}>{due ? "Review due" : item.status}</span></div>
        <h2>{item.student_ref}</h2><h3>{item.focus}</h3>
        <div className="itGoal"><small>GOAL</small><p>{item.goal || "No goal recorded yet."}</p></div>
        <dl><div><dt>Strategy</dt><dd>{item.strategy || "Not recorded"}</dd></div><div><dt>Frequency</dt><dd>{item.frequency || "Not set"}</dd></div><div><dt>Next review</dt><dd>{formatDate(item.review_date)}</dd></div><div><dt>Reviews</dt><dd>{itemReviews.length}</dd></div></dl>
        {latest && <div className="itLatest"><strong>Latest review · {formatDate(latest.reviewed_on)}</strong><span>{latest.progress_rating ? `${latest.progress_rating}/5` : "—"} · {latest.effectiveness.replaceAll("_", " ")}</span><p>{latest.next_steps || latest.evidence || "Review recorded."}</p></div>}
        <button className="primary" onClick={() => { setReviewing(item); setStatusAfter(item.status === "Review" ? "Active" : item.status); setNextReviewDate(item.review_date || dateInput(28)); }}>Add review</button>
      </article>;
    })}{!visible.length && <div className="itEmpty"><strong>No interventions match this view.</strong><p>Create a new intervention or change the filters.</p></div>}</section>

    {showCreate && <div className="itModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}><section><header><div><span className="itEyebrow">NEW INTERVENTION</span><h2>Start with a measurable support plan</h2></div><button onClick={() => setShowCreate(false)}>×</button></header><div className="itForm">
      {students.length > 0 && <label><span>Student from school list</span><select value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Use manual reference instead</option>{students.map((student) => <option key={student.id} value={student.id}>{student.display_name}{student.year_group ? ` · ${student.year_group}` : ""}</option>)}</select></label>}
      {!studentId && <label><span>Student reference</span><input value={studentRef} onChange={(e) => setStudentRef(e.target.value)} placeholder="Name or approved school reference"/></label>}
      <label><span>Intervention type</span><select value={interventionType} onChange={(e) => setInterventionType(e.target.value as InterventionType)}>{types.map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label>
      <label className="wide"><span>Focus</span><input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="What barrier or need is this support addressing?"/></label>
      <label className="wide"><span>Baseline</span><textarea value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="What is happening now? Use observable, relevant evidence."/></label>
      <label className="wide"><span>Goal</span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What meaningful improvement are you aiming for?"/></label>
      <label className="wide"><span>Success criteria</span><textarea value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} placeholder="How will staff know the intervention is helping?"/></label>
      <label className="wide"><span>Strategy / support</span><textarea value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="What will staff actually do?"/></label>
      <label><span>Frequency</span><input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. 15 min, 3× weekly"/></label><label><span>First review</span><input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}/></label>
      <label><span>Regulation zone <small>optional</small></span><select value={zone} onChange={(e) => setZone(e.target.value)}><option value="">Not applicable</option><option value="blue">Blue</option><option value="green">Green</option><option value="yellow">Yellow</option><option value="red">Red</option></select></label>
      <label className="wide"><span>Notes <small>optional</small></span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only include information necessary for the intervention."/></label>
    </div><footer><button onClick={() => setShowCreate(false)}>Cancel</button><button className="primary" onClick={createIntervention}>Create intervention</button></footer></section></div>}

    {reviewing && <div className="itModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setReviewing(null); }}><section><header><div><span className="itEyebrow">INTERVENTION REVIEW</span><h2>{reviewing.student_ref} · {reviewing.focus}</h2></div><button onClick={() => setReviewing(null)}>×</button></header><div className="itForm">
      <label><span>Progress rating</span><select value={rating} onChange={(e) => setRating(e.target.value)}>{[1,2,3,4,5].map((n) => <option value={n} key={n}>{n} / 5</option>)}</select></label>
      <label><span>Effectiveness</span><select value={effectiveness} onChange={(e) => setEffectiveness(e.target.value)}><option value="not_yet">Not enough evidence yet</option><option value="limited">Limited impact</option><option value="some">Some impact</option><option value="strong">Strong impact</option><option value="sustained">Sustained impact</option></select></label>
      <label className="wide"><span>Evidence</span><textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="What changed? Use relevant observable evidence."/></label>
      <label className="wide"><span>Barriers still present</span><textarea value={barriers} onChange={(e) => setBarriers(e.target.value)} placeholder="What is still getting in the way?"/></label>
      <label className="wide"><span>Adaptations made</span><textarea value={adaptations} onChange={(e) => setAdaptations(e.target.value)} placeholder="What will be changed or continued?"/></label>
      <label className="wide"><span>Next steps / outcome</span><textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="What happens next?"/></label>
      <label><span>Status after review</span><select value={statusAfter} onChange={(e) => setStatusAfter(e.target.value as InterventionStatus)}><option>Active</option><option>Review</option><option>Complete</option></select></label>
      {statusAfter !== "Complete" && <label><span>Next review</span><input type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)}/></label>}
    </div><footer><button onClick={() => setReviewing(null)}>Cancel</button><button className="primary" onClick={saveReview}>Save review</button></footer></section></div>}
    {message && <div className="itToast">{message}</div>}
  </main>;
}
