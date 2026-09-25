"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ActionPlan = { id: string; title: string; action: string; context: string; intended_outcome: string; evidence_plan: string; course_id: string | null; session_id: string | null; start_date: string; review_date: string | null; status: "planned" | "in_progress" | "review_due" | "completed" | "abandoned"; created_at: string };
type Followup = { id: string; action_plan_id: string; outcome: string; evidence_summary: string; impact_rating: number | null; next_action: string; reviewed_at: string };

const statusLabels: Record<ActionPlan["status"], string> = {
  planned: "Planned",
  in_progress: "In progress",
  review_due: "Review due",
  completed: "Completed",
  abandoned: "Stopped",
};

export default function ActionsPage() {
  const [userId, setUserId] = useState("");
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rating, setRating] = useState(3);

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), []);
  const todayValue = today();
  const dueCount = plans.filter(p => p.review_date && p.review_date <= todayValue && !["completed", "abandoned"].includes(p.status)).length;
  const activeCount = plans.filter(p => ["planned", "in_progress", "review_due"].includes(p.status)).length;
  const completedCount = plans.filter(p => p.status === "completed").length;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/actions"; return; }
      setUserId(auth.user.id);
      const [{ data: actionRows, error: actionError }, { data: followRows, error: followError }] = await Promise.all([
        supabase.from("action_plans").select("id,title,action,context,intended_outcome,evidence_plan,course_id,session_id,start_date,review_date,status,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
        supabase.from("action_followups").select("id,action_plan_id,outcome,evidence_summary,impact_rating,next_action,reviewed_at").eq("user_id", auth.user.id).order("reviewed_at", { ascending: false }),
      ]);
      if (actionError) setMessage(actionError.message);
      if (followError) setMessage(followError.message);
      setPlans((actionRows || []) as ActionPlan[]);
      setFollowups((followRows || []) as Followup[]);
      setLoading(false);
    })();
  }, []);

  async function createPlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      user_id: userId,
      title: String(form.get("title") || "").trim(),
      action: String(form.get("action") || "").trim(),
      context: String(form.get("context") || "").trim(),
      intended_outcome: String(form.get("intended_outcome") || "").trim(),
      evidence_plan: String(form.get("evidence_plan") || "").trim(),
      course_id: String(form.get("course_id") || "") || null,
      start_date: String(form.get("start_date") || today()),
      review_date: String(form.get("review_date") || "") || null,
      status: "planned",
    };
    const { data, error } = await supabase.from("action_plans").insert(payload).select("id,title,action,context,intended_outcome,evidence_plan,course_id,session_id,start_date,review_date,status,created_at").single();
    if (error) { setMessage(error.message); return; }
    setPlans(prev => [data as ActionPlan, ...prev]);
    setShowCreate(false);
    setMessage("Action plan saved. Review it after you have had time to test the change.");
    e.currentTarget.reset();
  }

  async function updateStatus(plan: ActionPlan, status: ActionPlan["status"]) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.from("action_plans").update({ status }).eq("id", plan.id).eq("user_id", userId).select("id,title,action,context,intended_outcome,evidence_plan,course_id,session_id,start_date,review_date,status,created_at").single();
    if (error) { setMessage(error.message); return; }
    setPlans(prev => prev.map(p => p.id === plan.id ? data as ActionPlan : p));
    setMessage(`Action marked ${statusLabels[status].toLowerCase()}.`);
  }

  async function saveReview(e: FormEvent<HTMLFormElement>, plan: ActionPlan) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    const form = new FormData(e.currentTarget);
    const nextStatus = String(form.get("next_status") || "completed") as ActionPlan["status"];
    const payload = {
      action_plan_id: plan.id,
      user_id: userId,
      outcome: String(form.get("outcome") || "").trim(),
      evidence_summary: String(form.get("evidence_summary") || "").trim(),
      impact_rating: rating,
      next_action: String(form.get("next_action") || "").trim(),
    };
    const { data, error } = await supabase.from("action_followups").insert(payload).select("id,action_plan_id,outcome,evidence_summary,impact_rating,next_action,reviewed_at").single();
    if (error) { setMessage(error.message); return; }
    const { error: statusError } = await supabase.from("action_plans").update({ status: nextStatus }).eq("id", plan.id).eq("user_id", userId);
    if (statusError) { setMessage(statusError.message); return; }
    setFollowups(prev => [data as Followup, ...prev]);
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: nextStatus } : p));
    setReviewing(null);
    setMessage("Review saved to your implementation record.");
  }

  if (loading) return <main className="phasePage"><div className="phaseCard">Loading action plans…</div></main>;

  return <main className="phasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">IMPLEMENTATION & IMPACT</span>
      <h1>Turn professional learning into a change you can test.</h1>
      <p>Define a small action, decide what evidence would be useful, set a review point and record what happened. The aim is thoughtful implementation—not proving that every idea worked.</p>
      <div className="phaseActions"><button className="primary" onClick={() => setShowCreate(v => !v)}>{showCreate ? "Close form" : "Create action plan"}</button></div>
    </section>

    {message && <div className="phaseNotice">{message}</div>}
    <div className="privacyNote">Keep evidence proportionate and professional. Do not enter confidential pupil-identifiable information. A neutral or negative impact review is still useful evidence because it helps refine practice.</div>

    <section className="developmentStats">
      <div className="developmentStat"><strong>{activeCount}</strong><span>active plans</span></div>
      <div className="developmentStat"><strong>{dueCount}</strong><span>reviews due</span></div>
      <div className="developmentStat"><strong>{completedCount}</strong><span>completed cycles</span></div>
      <div className="developmentStat"><strong>{followups.length}</strong><span>impact reviews</span></div>
    </section>

    {showCreate && <section className="phaseCard" style={{ marginBottom: 18 }}>
      <div className="phaseCardHead"><div><span className="eyebrow">NEW IMPLEMENTATION CYCLE</span><h2>Plan one practical change</h2></div></div>
      <form className="phase4Form" onSubmit={createPlan}>
        <label>Plan title<input required name="title" placeholder="e.g. Improve whole-class checking" /></label>
        <label>Related CPD course<select name="course_id" defaultValue=""><option value="">No specific course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="span2">Action to test<textarea required name="action" rows={3} placeholder="What exactly will you do differently? Keep the change small enough to implement consistently." /></label>
        <label>Context<textarea name="context" rows={3} placeholder="Class, subject, routine or situation—without pupil-identifiable details." /></label>
        <label>Intended outcome<textarea name="intended_outcome" rows={3} placeholder="What would you hope to improve or understand?" /></label>
        <label className="span2">Evidence you will look for<textarea name="evidence_plan" rows={3} placeholder="e.g. response rates, quality of explanations, work samples, pupil independence, your own observation notes" /></label>
        <label>Start date<input type="date" name="start_date" defaultValue={today()} required /></label>
        <label>Review date<input type="date" name="review_date" defaultValue={daysFromNow(21)} /></label>
        <div className="span2"><button className="primary">Save action plan</button></div>
      </form>
    </section>}

    <section className="phaseCard">
      <div className="phaseCardHead"><div><span className="eyebrow">YOUR IMPLEMENTATION CYCLES</span><h2>{plans.length} action plans</h2></div></div>
      <div className="entryList">
        {plans.map(plan => {
          const reviews = followups.filter(f => f.action_plan_id === plan.id);
          const due = Boolean(plan.review_date && plan.review_date <= todayValue && !["completed", "abandoned"].includes(plan.status));
          const course = plan.course_id ? courseMap.get(plan.course_id) : null;
          return <article className="entryRow" key={plan.id}>
            <div>
              <h3>{plan.title}</h3>
              <p><strong>Action:</strong> {plan.action}</p>
              {plan.intended_outcome && <p><strong>Intended outcome:</strong> {plan.intended_outcome}</p>}
              {plan.evidence_plan && <p><strong>Evidence:</strong> {plan.evidence_plan}</p>}
              <div className="entryMeta"><span>{statusLabels[plan.status]}</span>{course && <span>{course.title}</span>}<span>Started {new Date(`${plan.start_date}T12:00:00`).toLocaleDateString("en-GB")}</span>{plan.review_date && <span className={due ? "actionDue" : "actionOk"}>{due ? "Review due " : "Review "}{new Date(`${plan.review_date}T12:00:00`).toLocaleDateString("en-GB")}</span>}<span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span></div>
              {reviews.map(review => <div className="phaseNotice" key={review.id}><strong>Impact review · {review.impact_rating || "–"}/5</strong><br />{review.outcome}{review.evidence_summary && <><br /><small>Evidence: {review.evidence_summary}</small></>}{review.next_action && <><br /><small>Next: {review.next_action}</small></>}</div>)}
              {reviewing === plan.id && <form className="phase4Form" onSubmit={e => saveReview(e, plan)} style={{ marginTop: 14 }}>
                <label className="span2">What happened?<textarea required name="outcome" rows={4} placeholder="What changed, stayed the same or surprised you?" /></label>
                <label className="span2">Evidence summary<textarea name="evidence_summary" rows={3} placeholder="Summarise the useful evidence without identifying pupils." /></label>
                <label className="span2">Impact rating<div className="impactButtons">{[1,2,3,4,5].map(n => <button type="button" key={n} className={rating === n ? "selected" : ""} onClick={() => setRating(n)}>{n}</button>)}</div></label>
                <label>Next status<select name="next_status" defaultValue="completed"><option value="completed">Complete this cycle</option><option value="in_progress">Continue testing</option><option value="planned">Revise and restart</option></select></label>
                <label>Next action<input name="next_action" placeholder="Keep, adapt, stop or test something else" /></label>
                <div className="span2 phaseActions"><button className="primary">Save review</button><button type="button" className="secondary" onClick={() => setReviewing(null)}>Cancel</button></div>
              </form>}
            </div>
            <div>
              <select className="statusSelect" value={plan.status} onChange={e => updateStatus(plan, e.target.value as ActionPlan["status"])}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="review_due">Review due</option><option value="completed">Completed</option><option value="abandoned">Stopped</option></select>
              <button className="textButton" style={{ display: "block", marginTop: 9 }} onClick={() => { setReviewing(plan.id); setRating(3); }}>Review impact</button>
            </div>
          </article>;
        })}
        {!plans.length && <div className="emptyDevelopment">Create one small action after CPD and set a realistic review point. Your implementation cycles will appear here.</div>}
      </div>
    </section>
  </main>;
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysFromNow(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
