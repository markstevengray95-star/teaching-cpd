"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { courses } from "teaching-cpd/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import "./ProfessionalLearningHub.css";

type Progress = { course_id: string; completed_modules: string[]; completed_at: string | null; updated_at: string };
type Assignment = { id: string; target_type: string; target_id: string; title_snapshot: string; due_date: string | null; mandatory: boolean; status: string; assignment_note: string };
type ImpactReview = { id: string; source_id: string; source_title: string; review_stage: string; due_on: string; reviewed_at: string | null; implementation_status: string | null; confidence: number | null; next_step: string };
type Target = { id: string; title: string; description: string; success_criteria: string; linked_course_id: string | null; review_date: string | null; status: string };
type ExternalRecord = { id: string; title: string; provider: string; occurred_on: string; cpd_hours: number; category: string };

function fmt(value: string | null) {
  if (!value) return "No date";
  return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function addDays(value: string, days: number) {
  const date = new Date(value); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10);
}

export default function ProfessionalLearningHub() {
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("Staff member");
  const [progress, setProgress] = useState<Progress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<ImpactReview[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [external, setExternal] = useState<ExternalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showTarget, setShowTarget] = useState(false);
  const [targetTitle, setTargetTitle] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [targetSuccess, setTargetSuccess] = useState("");
  const [targetReview, setTargetReview] = useState(addDays(new Date().toISOString(), 42));

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.assign("/auth?next=/professional-learning"); return; }
      const [profileResult, progressResult, assignmentResult, reviewResult, targetResult, externalResult] = await Promise.all([
        client.from("staff_development_profiles").select("display_name").eq("user_id", auth.user.id).maybeSingle(),
        client.from("staff_development_course_progress").select("course_id,completed_modules,completed_at,updated_at").eq("user_id", auth.user.id),
        client.from("cpd_assignments").select("id,target_type,target_id,title_snapshot,due_date,mandatory,status,assignment_note").eq("assigned_to", auth.user.id).order("due_date", { ascending: true }),
        client.from("cpd_impact_reviews").select("id,source_id,source_title,review_stage,due_on,reviewed_at,implementation_status,confidence,next_step").eq("user_id", auth.user.id).order("due_on", { ascending: true }),
        client.from("development_targets").select("id,title,description,success_criteria,linked_course_id,review_date,status").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
        client.from("external_cpd_records").select("id,title,provider,occurred_on,cpd_hours,category").eq("user_id", auth.user.id).order("occurred_on", { ascending: false }).limit(50),
      ]);
      if (!mounted) return;
      setUserId(auth.user.id);
      setDisplayName(profileResult.data?.display_name?.trim() || auth.user.user_metadata?.full_name || auth.user.email?.split("@")[0] || "Staff member");
      setProgress((progressResult.data || []) as Progress[]);
      setAssignments((assignmentResult.data || []) as Assignment[]);
      setReviews((reviewResult.data || []) as ImpactReview[]);
      setTargets((targetResult.data || []) as Target[]);
      setExternal((externalResult.data || []) as ExternalRecord[]);
      setLoading(false);
    })().catch((error) => { console.error(error); if (mounted) { setMessage("Your professional-learning record could not be loaded yet."); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const progressMap = useMemo(() => new Map(progress.map((item) => [item.course_id, item])), [progress]);
  const completedCourses = useMemo(() => courses.filter((course) => progressMap.get(course.id)?.completed_at), [progressMap]);
  const activeCourses = useMemo(() => courses.filter((course) => { const p = progressMap.get(course.id); return p && !p.completed_at && p.completed_modules.length > 0; }), [progressMap]);
  const today = new Date().toISOString().slice(0, 10);
  const dueAssignments = assignments.filter((item) => item.status !== "completed" && item.status !== "waived" && item.due_date && item.due_date <= today);
  const dueReviews = reviews.filter((item) => !item.reviewed_at && item.due_on <= today);
  const activeTargets = targets.filter((item) => item.status === "active" || item.status === "review_due");
  const courseHours = completedCourses.reduce((sum, course) => sum + Number(course.duration || 0) / 60, 0);
  const externalHours = external.reduce((sum, item) => sum + Number(item.cpd_hours || 0), 0);

  const recommendations = useMemo(() => {
    const targetText = activeTargets.map((item) => `${item.title} ${item.description} ${item.success_criteria}`).join(" ").toLowerCase();
    const tokens = targetText.split(/[^a-z0-9]+/).filter((token) => token.length > 4);
    return courses
      .filter((course) => !progressMap.get(course.id)?.completed_at)
      .map((course) => {
        const haystack = `${course.title} ${course.summary} ${course.category} ${course.recommendedFor.join(" ")}`.toLowerCase();
        const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
        return { course, score };
      })
      .sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title))
      .slice(0, 4)
      .map((item) => item.course);
  }, [activeTargets, progressMap]);

  async function addTarget() {
    if (!userId || !targetTitle.trim()) { setMessage("Add a development focus first."); return; }
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.from("development_targets").insert({
      user_id: userId, title: targetTitle.trim(), description: targetDescription.trim(), success_criteria: targetSuccess.trim(),
      review_date: targetReview || null, status: "active",
    }).select("id,title,description,success_criteria,linked_course_id,review_date,status").single();
    if (error) { setMessage(error.message); return; }
    setTargets((current) => [data as Target, ...current]);
    setTargetTitle(""); setTargetDescription(""); setTargetSuccess(""); setShowTarget(false); setMessage("Development focus added to your professional-learning cycle.");
  }

  async function scheduleReview(courseId: string, title: string) {
    if (!userId || reviews.some((review) => review.source_id === courseId && !review.reviewed_at)) { setMessage("An impact review is already scheduled for this course."); return; }
    const completedAt = progressMap.get(courseId)?.completed_at || new Date().toISOString();
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.from("cpd_impact_reviews").insert({
      user_id: userId, source_type: "course", source_id: courseId, source_title: title, review_stage: "4_week",
      due_on: addDays(completedAt, 28), implementation_status: "trying", evidence_type: "none", impact_note: "", next_step: "", shared_with_leadership: false,
    }).select("id,source_id,source_title,review_stage,due_on,reviewed_at,implementation_status,confidence,next_step").single();
    if (error) { setMessage(error.message); return; }
    setReviews((current) => [...current, data as ImpactReview].sort((a,b) => a.due_on.localeCompare(b.due_on)));
    setMessage("A four-week impact review has been scheduled.");
  }

  if (loading) return <main className="plPage"><div className="plLoading">Loading professional learning…</div></main>;

  return <main className="plPage">
    <header className="plTopbar"><Link href="/develop">← Develop</Link><div><span>PHASE 39</span><strong>Professional Learning</strong></div><Link href="/cpd">CPD Academy →</Link></header>
    <section className="plHero"><div><span className="plEyebrow">LEARN · APPLY · REVIEW</span><h1>{displayName}, make CPD lead to change.</h1><p>Your courses, assigned learning, development goals, external CPD and impact reviews now form one continuous professional-learning cycle.</p></div><div className="plCycle"><span>1 Learn</span><span>2 Apply</span><span>3 Gather evidence</span><span>4 Review impact</span></div></section>
    <section className="plStats"><div><strong>{(courseHours + externalHours).toFixed(1)}</strong><span>recorded CPD hours</span></div><div><strong>{activeCourses.length}</strong><span>courses in progress</span></div><div className={dueAssignments.length ? "attention" : ""}><strong>{dueAssignments.length}</strong><span>assignments due</span></div><div className={dueReviews.length ? "attention" : ""}><strong>{dueReviews.length}</strong><span>impact reviews due</span></div></section>

    <section className="plTwoCol">
      <article className="plPanel"><div className="plPanelHead"><div><span>CONTINUE LEARNING</span><h2>Your active CPD</h2></div><Link href="/cpd">Browse academy</Link></div>{activeCourses.length ? <div className="plList">{activeCourses.slice(0,5).map((course) => { const p = progressMap.get(course.id)!; const percent = Math.round((p.completed_modules.length / course.modules.length) * 100); return <Link href="/cpd" key={course.id}><div><strong>{course.title}</strong><small>{course.category}</small></div><span>{percent}%</span></Link>; })}</div> : <div className="plEmpty">No courses are currently in progress. Open the academy to start one.</div>}</article>
      <article className="plPanel"><div className="plPanelHead"><div><span>ASSIGNED CPD</span><h2>What needs attention</h2></div></div>{assignments.filter((item) => item.status !== "completed" && item.status !== "waived").length ? <div className="plList">{assignments.filter((item) => item.status !== "completed" && item.status !== "waived").slice(0,6).map((item) => <Link href={item.target_type === "catalogue" ? "/cpd" : "/pathways/personal"} key={item.id} className={item.due_date && item.due_date <= today ? "due" : ""}><div><strong>{item.title_snapshot}</strong><small>{item.mandatory ? "Mandatory" : "Assigned"}{item.assignment_note ? ` · ${item.assignment_note}` : ""}</small></div><span>{item.due_date ? fmt(item.due_date) : "No deadline"}</span></Link>)}</div> : <div className="plEmpty">No outstanding assigned CPD.</div>}</article>
    </section>

    <section className="plPanel plWide"><div className="plPanelHead"><div><span>DEVELOPMENT FOCUS</span><h2>Work towards something specific</h2><p>Define the change you want to make, then use CPD and evidence to support it.</p></div><button onClick={() => setShowTarget(true)}>+ Add focus</button></div>{activeTargets.length ? <div className="plTargetGrid">{activeTargets.map((target) => <article key={target.id}><span>{target.status.replaceAll("_"," ")}</span><h3>{target.title}</h3><p>{target.description || "No description added."}</p><small><strong>Success:</strong> {target.success_criteria || "Add success criteria when you review this focus."}</small><footer>Review {fmt(target.review_date)}</footer></article>)}</div> : <div className="plEmpty">Add a development focus so recommendations and CPD choices connect to a clear goal.</div>}</section>

    <section className="plTwoCol">
      <article className="plPanel"><div className="plPanelHead"><div><span>IMPACT CYCLE</span><h2>Review what changed</h2></div><Link href="/impact">Open impact reviews</Link></div>{reviews.filter((item) => !item.reviewed_at).length ? <div className="plList">{reviews.filter((item) => !item.reviewed_at).slice(0,6).map((review) => <Link href="/impact" key={review.id} className={review.due_on <= today ? "due" : ""}><div><strong>{review.source_title}</strong><small>{review.review_stage.replace("_"," ")} review · {review.implementation_status?.replaceAll("_"," ") || "not reviewed"}</small></div><span>{fmt(review.due_on)}</span></Link>)}</div> : <div className="plEmpty">No impact reviews are waiting. Schedule one after completing CPD to check implementation.</div>}</article>
      <article className="plPanel"><div className="plPanelHead"><div><span>RECOMMENDED NEXT</span><h2>Linked to your focus</h2></div><Link href="/recommendations">More recommendations</Link></div><div className="plList">{recommendations.map((course) => <Link href="/cpd" key={course.id}><div><strong>{course.title}</strong><small>{course.category} · {course.duration} min</small></div><span>Open →</span></Link>)}</div></article>
    </section>

    <section className="plPanel plWide"><div className="plPanelHead"><div><span>COMPLETED LEARNING</span><h2>Move from completion to implementation</h2><p>A certificate records completion. An impact review records whether the learning changed practice.</p></div><Link href="/external-cpd">Add external CPD</Link></div>{completedCourses.length ? <div className="plCompletedGrid">{completedCourses.slice(0,8).map((course) => { const hasPending = reviews.some((review) => review.source_id === course.id && !review.reviewed_at); return <article key={course.id}><strong>{course.title}</strong><span>Completed {fmt(progressMap.get(course.id)?.completed_at || null)}</span>{hasPending ? <small>Impact review scheduled ✓</small> : <button onClick={() => scheduleReview(course.id, course.title)}>Schedule 4-week review</button>}</article>; })}</div> : <div className="plEmpty">Complete a course to start building your implementation and impact record.</div>}</section>

    <section className="plQuick"><Link href="/cpd"><strong>CPD Academy</strong><span>Courses and Course Lab →</span></Link><Link href="/pathways/personal"><strong>Personal pathway</strong><span>Structured development routes →</span></Link><Link href="/portfolio"><strong>Professional portfolio</strong><span>Evidence and achievements →</span></Link><Link href="/external-cpd"><strong>External CPD</strong><span>Record learning elsewhere →</span></Link></section>

    {showTarget && <div className="plModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTarget(false); }}><section><header><div><span className="plEyebrow">NEW DEVELOPMENT FOCUS</span><h2>What do you want to improve?</h2></div><button onClick={() => setShowTarget(false)}>×</button></header><div className="plForm"><label><span>Focus</span><input value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} placeholder="e.g. Improve checking for understanding"/></label><label><span>Why this matters</span><textarea value={targetDescription} onChange={(e) => setTargetDescription(e.target.value)} placeholder="Describe the practice or learner need you want to improve."/></label><label><span>Success criteria</span><textarea value={targetSuccess} onChange={(e) => setTargetSuccess(e.target.value)} placeholder="What evidence would show progress?"/></label><label><span>Review date</span><input type="date" value={targetReview} onChange={(e) => setTargetReview(e.target.value)}/></label></div><footer><button onClick={() => setShowTarget(false)}>Cancel</button><button className="primary" onClick={addTarget}>Add focus</button></footer></section></div>}
    {message && <div className="plToast">{message}</div>}
  </main>;
}
