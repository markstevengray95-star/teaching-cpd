"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Enrolment = { pathway_id: string; selected_courses: string[]; status: "active" | "completed" | "paused"; started_at: string; completed_at: string | null };
type ProgressRow = { course_id: string; completed_at: string | null };

export default function PathwaysPage() {
  const [userId, setUserId] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [enrolments, setEnrolments] = useState<Record<string, Enrolment>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/pathways"; return; }
      setUserId(auth.user.id);
      const [{ data: progress, error: progressError }, { data: enrolled, error: enrolError }] = await Promise.all([
        supabase.from("course_progress").select("course_id,completed_at").eq("user_id", auth.user.id).not("completed_at", "is", null),
        supabase.from("pathway_enrolments").select("pathway_id,selected_courses,status,started_at,completed_at").eq("user_id", auth.user.id),
      ]);
      if (progressError) setMessage(progressError.message);
      if (enrolError) setMessage(enrolError.message);
      setCompleted(new Set(((progress || []) as ProgressRow[]).filter(r => r.completed_at).map(r => r.course_id)));
      const next: Record<string, Enrolment> = {};
      for (const row of (enrolled || []) as Enrolment[]) next[row.pathway_id] = row;
      setEnrolments(next);
      setLoading(false);
    })();
  }, []);

  async function start(pathwayId: string, courseIds: string[]) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    const { data, error } = await supabase.from("pathway_enrolments").upsert({ user_id: userId, pathway_id: pathwayId, selected_courses: courseIds, status: "active", completed_at: null }, { onConflict: "user_id,pathway_id" }).select("pathway_id,selected_courses,status,started_at,completed_at").single();
    if (error) { setMessage(error.message); return; }
    setEnrolments(prev => ({ ...prev, [pathwayId]: data as Enrolment }));
    setMessage("Pathway added to your professional development plan.");
  }

  async function setStatus(pathwayId: string, status: "active" | "paused" | "completed") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    const patch = { status, completed_at: status === "completed" ? new Date().toISOString() : null };
    const { data, error } = await supabase.from("pathway_enrolments").update(patch).eq("user_id", userId).eq("pathway_id", pathwayId).select("pathway_id,selected_courses,status,started_at,completed_at").single();
    if (error) { setMessage(error.message); return; }
    setEnrolments(prev => ({ ...prev, [pathwayId]: data as Enrolment }));
    setMessage(status === "completed" ? "Pathway marked complete." : status === "paused" ? "Pathway paused." : "Pathway resumed.");
  }

  if (loading) return <main className="phasePage"><div className="phaseCard">Loading your pathways…</div></main>;

  return <main className="phasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">PERSONAL DEVELOPMENT PATHWAYS</span>
      <h1>Turn individual courses into a coherent development journey.</h1>
      <p>Choose a pathway, complete its linked courses at your own pace and use your action plans to transfer the learning into practice.</p>
    </section>

    {message && <div className="phaseNotice">{message}</div>}
    <div className="privacyNote">Your pathway choices are saved to your own staff account. This phase does not automatically expose your personal reflective record to managers.</div>

    <section className="developmentGrid" style={{ marginTop: 18 }}>
      {pathways.map(pathway => {
        const done = pathway.courseIds.filter(id => completed.has(id)).length;
        const pct = Math.round((done / pathway.courseIds.length) * 100);
        const enrolment = enrolments[pathway.id];
        const allDone = done === pathway.courseIds.length;
        return <article className="developmentCard" key={pathway.id}>
          <span className="eyebrow">{enrolment ? enrolment.status.toUpperCase() : "AVAILABLE PATHWAY"}</span>
          <h2>{pathway.title}</h2>
          <p>{pathway.summary}</p>
          <div className="metaLine"><span>{pathway.audience}</span><span>{pathway.courseIds.length} courses</span><span>{done} complete</span></div>
          <div className="progressLine"><span style={{ width: `${pct}%` }} /></div>
          <p><strong>{pct}% complete.</strong> {pathway.outcome}</p>
          <div className="pathwayCourses">
            {pathway.courseIds.map(id => {
              const course = courseMap.get(id);
              return <div key={id} className={`pathwayCourse ${completed.has(id) ? "done" : ""}`}><span>{completed.has(id) ? "✓" : "○"} {course?.title || id}</span><small>{course?.duration || 0} min</small></div>;
            })}
          </div>
          {!enrolment && <button className="primary full" onClick={() => start(pathway.id, pathway.courseIds)}>Start pathway</button>}
          {enrolment?.status === "active" && <div className="phaseActions"><button className="secondary" onClick={() => setStatus(pathway.id, "paused")}>Pause</button>{allDone && <button className="primary" onClick={() => setStatus(pathway.id, "completed")}>Complete pathway</button>}<a className="secondary phaseLinkButton" href="/">Open course library</a></div>}
          {enrolment?.status === "paused" && <button className="primary full" onClick={() => setStatus(pathway.id, "active")}>Resume pathway</button>}
          {enrolment?.status === "completed" && <div className="savedResponse">✓ Pathway completed</div>}
        </article>;
      })}
    </section>
  </main>;
}
