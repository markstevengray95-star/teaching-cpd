"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./AppraisalHub.css";

type Profile = { id: string; full_name: string; role: string; department: string; organisation_id: string | null };
type Objective = { id: string; organisation_id: string; user_id: string; title: string; description: string; success_criteria: string; objective_area: string; progress_summary: string; next_step: string; progress_percent: number; linked_course_ids: string[]; review_date: string | null; status: string; shared_with_leadership: boolean; created_at: string };
type Evidence = { id: string; objective_id: string; user_id: string; evidence_type: string; evidence_reference: string | null; note: string; shared_with_leadership: boolean; created_at: string };
type Review = { id: string; organisation_id: string; user_id: string; reviewer_id: string | null; cycle_label: string; review_type: string; scheduled_on: string | null; status: string; employee_reflection: string; reviewer_summary: string; meeting_notes: string; support_needed: string; completion_summary: string; agreed_actions: unknown[]; next_review_date: string | null; shared_with_leadership: boolean; created_at: string };
type Progress = { course_id: string; completed_at: string | null };

const objectiveAreas = ["Teaching & learning", "Curriculum", "Pastoral", "SEND / EAL", "Leadership", "Professional practice", "School improvement", "Other"];
const leadershipRoles: StaffRole[] = ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AppraisalHub() {
  const [userId, setUserId] = useState("");
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole>("teacher");
  const [me, setMe] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openObjective, setOpenObjective] = useState<string | null>(null);
  const [openReview, setOpenReview] = useState<string | null>(null);

  const canReviewOthers = leadershipRoles.includes(role);

  async function load() {
    const client = getSupabaseBrowserClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { window.location.href = "/auth?next=/appraisal"; return; }
    setUserId(auth.user.id);
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);

    const { data: legacy } = await client.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("id", auth.user.id).maybeSingle();
    const profile = (legacy || null) as Profile | null;
    const org = access.organizationId || profile?.organisation_id || null;
    setMe(profile);
    setOrganisationId(org);

    const [o, e, r, p, s] = await Promise.all([
      client.from("appraisal_objectives").select("*").order("updated_at", { ascending: false }),
      client.from("appraisal_evidence").select("*").order("created_at", { ascending: false }),
      client.from("appraisal_reviews").select("*").order("scheduled_on", { ascending: false }),
      client.from("staff_development_course_progress").select("course_id,completed_at").eq("user_id", auth.user.id),
      org && leadershipRoles.includes(access.role) ? client.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("organisation_id", org).order("full_name") : Promise.resolve({ data: [], error: null }),
    ]);
    setObjectives((o.data || []) as Objective[]);
    setEvidence((e.data || []) as Evidence[]);
    setReviews((r.data || []) as Review[]);
    setProgress((p.data || []) as Progress[]);
    setStaff((s.data || []) as Profile[]);
    setMessage([o.error?.message, e.error?.message, r.error?.message, p.error?.message, s.error?.message].filter(Boolean).join(" · "));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const ownObjectives = objectives.filter(item => item.user_id === userId);
  const sharedObjectives = objectives.filter(item => item.user_id !== userId);
  const ownReviews = reviews.filter(item => item.user_id === userId || item.reviewer_id === userId);
  const sharedReviews = reviews.filter(item => item.user_id !== userId && item.reviewer_id !== userId);
  const evidenceByObjective = useMemo(() => new Map(objectives.map(item => [item.id, evidence.filter(row => row.objective_id === item.id)])), [objectives, evidence]);
  const completedCourses = new Set(progress.filter(item => item.completed_at).map(item => item.course_id));
  const currentCycle = "2026/27";
  const cycleStages = ["initial", "mid_year", "final"];
  const currentStageIndex = Math.max(0, cycleStages.findIndex(stage => ownReviews.some(review => review.review_type === stage && review.status !== "completed")));
  const reviewsDue = ownObjectives.filter(item => item.status === "active" && item.review_date && new Date(item.review_date).getTime() <= Date.now()).length;

  async function createObjective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organisationId || !userId) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const success = String(form.get("success_criteria") || "").trim();
    if (!title || !success) { setMessage("Add an objective title and success criteria."); return; }
    const course = String(form.get("course_id") || "");
    const { error } = await getSupabaseBrowserClient().from("appraisal_objectives").insert({
      organisation_id: organisationId,
      user_id: userId,
      title,
      description: String(form.get("description") || "").trim(),
      success_criteria: success,
      objective_area: String(form.get("objective_area") || "Professional practice"),
      standard_codes: [],
      linked_course_ids: course ? [course] : [],
      review_date: String(form.get("review_date") || "") || null,
      status: "active",
      shared_with_leadership: form.get("shared") === "on",
      created_by: userId,
    });
    if (error) { setMessage(error.message); return; }
    event.currentTarget.reset();
    setMessage("Appraisal objective created.");
    await load();
  }

  async function updateObjective(objective: Objective, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await getSupabaseBrowserClient().from("appraisal_objectives").update({
      progress_percent: Number(form.get("progress_percent") || 0),
      progress_summary: String(form.get("progress_summary") || "").trim(),
      next_step: String(form.get("next_step") || "").trim(),
      status: String(form.get("status") || objective.status),
      review_date: String(form.get("review_date") || "") || null,
      updated_at: new Date().toISOString(),
    }).eq("id", objective.id);
    if (error) { setMessage(error.message); return; }
    setMessage("Objective progress updated.");
    await load();
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>, objective: Objective) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") || "").trim();
    if (!note) { setMessage("Add a short evidence note."); return; }
    const { error } = await getSupabaseBrowserClient().from("appraisal_evidence").insert({
      objective_id: objective.id,
      user_id: userId,
      evidence_type: String(form.get("evidence_type") || "Reflection"),
      evidence_reference: String(form.get("evidence_reference") || "").trim() || null,
      note,
      shared_with_leadership: objective.shared_with_leadership,
    });
    if (error) { setMessage(error.message); return; }
    event.currentTarget.reset();
    setMessage("Evidence added.");
    await load();
  }

  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organisationId || !userId) return;
    const form = new FormData(event.currentTarget);
    const targetUser = canReviewOthers ? String(form.get("user_id") || userId) : userId;
    const scheduled = String(form.get("scheduled_on") || "") || null;
    const { error } = await getSupabaseBrowserClient().from("appraisal_reviews").insert({
      organisation_id: organisationId,
      user_id: targetUser,
      reviewer_id: targetUser === userId ? null : userId,
      cycle_label: String(form.get("cycle_label") || currentCycle).trim() || currentCycle,
      review_type: String(form.get("review_type") || "mid_year"),
      scheduled_on: scheduled,
      status: scheduled ? "scheduled" : "draft",
      employee_reflection: targetUser === userId ? String(form.get("employee_reflection") || "").trim() : "",
      reviewer_summary: "",
      agreed_actions: [],
      next_review_date: null,
      shared_with_leadership: true,
      created_by: userId,
    });
    if (error) { setMessage(error.message); return; }
    event.currentTarget.reset();
    setMessage("Professional review created.");
    await load();
  }

  async function updateReview(review: Review, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const actions = String(form.get("agreed_actions") || "").split("\n").map(item => item.trim()).filter(Boolean);
    const { error } = await getSupabaseBrowserClient().from("appraisal_reviews").update({
      employee_reflection: String(form.get("employee_reflection") || "").trim(),
      reviewer_summary: String(form.get("reviewer_summary") || "").trim(),
      meeting_notes: String(form.get("meeting_notes") || "").trim(),
      support_needed: String(form.get("support_needed") || "").trim(),
      completion_summary: String(form.get("completion_summary") || "").trim(),
      agreed_actions: actions,
      next_review_date: String(form.get("next_review_date") || "") || null,
      status: String(form.get("status") || review.status),
      updated_at: new Date().toISOString(),
    }).eq("id", review.id);
    if (error) { setMessage(error.message); return; }
    setMessage("Review record updated.");
    await load();
  }

  if (loading) return <main className="appraisalPage"><div className="appraisalLoading">Loading appraisal…</div></main>;

  return <main className="appraisalPage">
    <header className="appraisalTopbar"><Link href="/develop">← Develop</Link><div><span>PHASE 42</span><strong>Appraisal & Professional Review</strong></div><button onClick={() => window.print()}>Print / Save PDF</button></header>

    <section className="appraisalHero"><div><span className="appraisalEyebrow">DEVELOPMENT, NOT RANKING</span><h1>One appraisal cycle connected to professional learning.</h1><p>Set meaningful objectives, collect evidence, review progress and agree the support or learning needed next. Portfolio, coaching and CPD stay connected to the same development story.</p><div className="appraisalLinks"><Link href="/portfolio">Portfolio</Link><Link href="/coaching">Coaching</Link><Link href="/professional-learning">Professional Learning</Link></div></div><div className="appraisalStats"><span><strong>{ownObjectives.filter(o => o.status === "active").length}</strong><small>active objectives</small></span><span><strong>{reviewsDue}</strong><small>reviews due</small></span><span><strong>{evidence.filter(e => ownObjectives.some(o => o.id === e.objective_id)).length}</strong><small>evidence items</small></span></div></section>

    {message && <div className="appraisalMessage">{message}</div>}

    <section className="appraisalCycle"><div><span className="appraisalEyebrow">{currentCycle} CYCLE</span><h2>Annual review journey</h2></div><div className="appraisalStages">{[{ id: "initial", label: "Initial review", helper: "Agree objectives & support" }, { id: "mid_year", label: "Mid-year", helper: "Review evidence & adapt" }, { id: "final", label: "Final review", helper: "Evaluate impact & next steps" }].map((stage, index) => <div key={stage.id} className={index <= currentStageIndex ? "active" : ""}><span>{index + 1}</span><strong>{stage.label}</strong><small>{stage.helper}</small></div>)}</div></section>

    <section className="appraisalGrid"><article className="appraisalPanel appraisalWide"><div className="appraisalPanelHead"><div><span className="appraisalEyebrow">OBJECTIVES</span><h2>My professional priorities</h2></div><small>{ownObjectives.length} total</small></div><div className="appraisalList">{ownObjectives.map(objective => { const items = evidenceByObjective.get(objective.id) || []; const courseNames = objective.linked_course_ids.map(id => courses.find(c => c.id === id)?.title || id); return <div className="objectiveCard" key={objective.id}><button className="objectiveHead" onClick={() => setOpenObjective(openObjective === objective.id ? null : objective.id)}><div><span>{objective.objective_area}</span><h3>{objective.title}</h3><p>{objective.description || objective.success_criteria}</p></div><div className="objectiveProgress"><strong>{objective.progress_percent}%</strong><small>{items.length} evidence</small></div></button><div className="progressTrack"><span style={{ width: `${objective.progress_percent}%` }} /></div><div className="objectiveMeta"><span>{objective.status}</span>{objective.review_date && <span>Review {formatDate(objective.review_date)}</span>}{courseNames.map((name, i) => <span key={`${objective.id}-${i}`}>{completedCourses.has(objective.linked_course_ids[i]) ? "✓ " : ""}{name}</span>)}</div>{openObjective === objective.id && <div className="objectiveBody"><div className="objectiveEvidence"><strong>Success criteria</strong><p>{objective.success_criteria}</p>{objective.progress_summary && <><strong>Progress so far</strong><p>{objective.progress_summary}</p></>}{objective.next_step && <><strong>Next step</strong><p>{objective.next_step}</p></>}<strong>Evidence</strong>{items.map(item => <div className="evidenceItem" key={item.id}><span>{item.evidence_type}</span><p>{item.note}</p>{item.evidence_reference && <a href={item.evidence_reference} target="_blank" rel="noreferrer">Open reference ↗</a>}</div>)}{!items.length && <p>No evidence added yet.</p>}</div><div className="objectiveForms"><form onSubmit={event => updateObjective(objective, event)}><h4>Update progress</h4><label>Progress %<input type="number" min="0" max="100" name="progress_percent" defaultValue={objective.progress_percent} /></label><label>Progress summary<textarea name="progress_summary" rows={3} defaultValue={objective.progress_summary} /></label><label>Next step<textarea name="next_step" rows={2} defaultValue={objective.next_step} /></label><label>Status<select name="status" defaultValue={objective.status}><option value="active">Active</option><option value="review_due">Review due</option><option value="completed">Completed</option><option value="paused">Paused</option></select></label><label>Review date<input type="date" name="review_date" defaultValue={objective.review_date || ""} /></label><button>Save progress</button></form><form onSubmit={event => addEvidence(event, objective)}><h4>Add evidence</h4><label>Type<select name="evidence_type"><option>Reflection</option><option>CPD implementation</option><option>Pupil work</option><option>Coaching/observation</option><option>Learning walk</option><option>Planning/resource</option><option>Other</option></select></label><label>Evidence/reference<input name="evidence_reference" placeholder="Optional link or reference" /></label><label>What does it show?<textarea name="note" rows={3} /></label><button>Add evidence</button></form></div></div>}</div>; })}{!ownObjectives.length && <div className="appraisalEmpty">No appraisal objectives yet.</div>}</div></article>

      <aside className="appraisalPanel"><span className="appraisalEyebrow">NEW OBJECTIVE</span><h2>Create a development objective</h2><form className="appraisalForm" onSubmit={createObjective}><label>Area<select name="objective_area">{objectiveAreas.map(item => <option key={item}>{item}</option>)}</select></label><label>Objective<input name="title" required /></label><label>What will change?<textarea name="description" rows={3} /></label><label>Success criteria<textarea name="success_criteria" rows={3} required /></label><label>Linked CPD<select name="course_id"><option value="">None</option>{courses.map(course => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label><label>Review date<input type="date" name="review_date" /></label><label className="appraisalCheck"><input type="checkbox" name="shared" defaultChecked /> Share with leadership/reviewer</label><button className="primary">Create objective</button></form></aside>
    </section>

    <section className="appraisalGrid"><article className="appraisalPanel appraisalWide"><div className="appraisalPanelHead"><div><span className="appraisalEyebrow">REVIEW RECORD</span><h2>Professional review history</h2></div></div><div className="appraisalList">{ownReviews.map(review => <div className="reviewCard" key={review.id}><button className="reviewHead" onClick={() => setOpenReview(openReview === review.id ? null : review.id)}><div><strong>{review.cycle_label} · {review.review_type.replace("_", " ")}</strong><span>{formatDate(review.scheduled_on)} · {review.status}</span></div><span>{openReview === review.id ? "−" : "+"}</span></button>{openReview === review.id && <form className="reviewForm" onSubmit={event => updateReview(review, event)}><label>Employee reflection<textarea name="employee_reflection" rows={3} defaultValue={review.employee_reflection} /></label><label>Reviewer summary<textarea name="reviewer_summary" rows={3} defaultValue={review.reviewer_summary} /></label><label>Meeting notes<textarea name="meeting_notes" rows={3} defaultValue={review.meeting_notes} /></label><label>Support / development needed<textarea name="support_needed" rows={2} defaultValue={review.support_needed} /></label><label>Agreed actions, one per line<textarea name="agreed_actions" rows={3} defaultValue={Array.isArray(review.agreed_actions) ? review.agreed_actions.map(String).join("\n") : ""} /></label><label>Completion / impact summary<textarea name="completion_summary" rows={3} defaultValue={review.completion_summary} /></label><label>Next review<input type="date" name="next_review_date" defaultValue={review.next_review_date || ""} /></label><label>Status<select name="status" defaultValue={review.status}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="agreed">Agreed</option><option value="completed">Completed</option></select></label><button>Save review</button></form>}</div>)}{!ownReviews.length && <div className="appraisalEmpty">No review records yet.</div>}</div></article>

      <aside className="appraisalPanel"><span className="appraisalEyebrow">NEW REVIEW</span><h2>{canReviewOthers ? "Create or schedule a review" : "Prepare a review"}</h2><form className="appraisalForm" onSubmit={createReview}>{canReviewOthers && <label>Staff member<select name="user_id" defaultValue={userId}><option value={userId}>Me</option>{staff.filter(person => person.id !== userId).map(person => <option key={person.id} value={person.id}>{person.full_name} · {person.department}</option>)}</select></label>}<label>Cycle<input name="cycle_label" defaultValue={currentCycle} /></label><label>Review type<select name="review_type"><option value="initial">Initial review</option><option value="mid_year">Mid-year review</option><option value="final">Final review</option></select></label><label>Meeting date<input type="date" name="scheduled_on" /></label><label>Pre-review reflection<textarea name="employee_reflection" rows={4} placeholder="What has changed? What evidence matters? What support would help next?" /></label><button className="primary">Create review</button></form></aside>
    </section>

    {canReviewOthers && (sharedObjectives.length > 0 || sharedReviews.length > 0) && <section className="appraisalPanel leadershipPanel"><span className="appraisalEyebrow">LEADERSHIP VIEW</span><h2>Shared development information</h2><p>Only appraisal information available through the existing school permissions is shown. This is for professional development and review, not staff ranking.</p><div className="leadershipGrid">{sharedObjectives.slice(0, 12).map(item => <div key={item.id}><strong>{staff.find(person => person.id === item.user_id)?.full_name || "Staff member"}</strong><span>{item.title}</span><small>{item.progress_percent}% progress · {evidenceByObjective.get(item.id)?.length || 0} evidence items</small></div>)}{sharedReviews.slice(0, 8).map(item => <div key={item.id}><strong>{staff.find(person => person.id === item.user_id)?.full_name || "Staff member"}</strong><span>{item.review_type.replace("_", " ")} · {item.status}</span><small>{formatDate(item.scheduled_on)}</small></div>)}</div></section>}
  </main>;
}
