"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DepartmentActivity = { department: string; staff: number; completed_courses: number; active_course_records: number };
type CourseCompletion = { course_id: string; completions: number };
type MonthlyCompletion = { month: string; completions: number };
type Summary = {
  staff_count: number;
  completed_courses: number;
  courses_in_progress: number;
  live_cpd_completions: number;
  active_pathways: number;
  completed_pathways: number;
  active_action_plans: number;
  impact_reviews: number;
  average_impact_rating: number | null;
  department_activity: DepartmentActivity[];
  course_completion_counts: CourseCompletion[];
  monthly_completions: MonthlyCompletion[];
};

type Profile = { full_name: string; role: string; department: string };

export default function LeadershipPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c.title])), []);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth?next=/leadership"; return; }
    const { data: p, error: profileError } = await supabase.from("staff_profiles").select("full_name,role,department").eq("id", auth.user.id).single();
    if (profileError) { setMessage(profileError.message); setLoading(false); return; }
    const nextProfile = p as Profile;
    setProfile(nextProfile);
    if (!["Department Lead", "CPD Lead", "Admin"].includes(nextProfile.role)) {
      setMessage("This dashboard is restricted to Department Lead, CPD Lead and Admin accounts.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("leadership_summary");
    if (error) setMessage(error.message);
    else setSummary(data as Summary);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function refresh() {
    setRefreshing(true);
    setMessage("");
    await load();
    setRefreshing(false);
  }

  if (loading) return <main className="phasePage"><div className="phaseCard">Loading leadership analytics…</div></main>;
  if (!profile || !["Department Lead", "CPD Lead", "Admin"].includes(profile.role)) return <main className="phasePage"><section className="phaseCard"><a className="phaseBack" href="/">← Teaching CPD</a><span className="eyebrow">LEADERSHIP ANALYTICS</span><h1>Leadership access required</h1><p>{message || "This page is restricted to leadership accounts."}</p></section></main>;

  const maxDepartment = Math.max(1, ...(summary?.department_activity || []).map(d => d.completed_courses));
  const maxCourse = Math.max(1, ...(summary?.course_completion_counts || []).map(c => c.completions));
  const maxMonth = Math.max(1, ...(summary?.monthly_completions || []).map(m => m.completions));

  return <main className="phasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">LEADERSHIP ANALYTICS</span>
      <h1>See participation and implementation without exposing private reflections.</h1>
      <p>These figures are aggregated across staff. Individual reflective notes, portfolio descriptions and action-plan text are not returned to this dashboard.</p>
      <div className="phaseActions"><button className="primary" onClick={refresh} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh data"}</button><a className="secondary phaseLinkButton" href="/live">Live CPD</a></div>
    </section>

    {message && <div className="phaseNotice">{message}</div>}
    {!summary ? <div className="emptyDevelopment">No aggregate data is available yet.</div> : <>
      <section className="developmentStats">
        <div className="developmentStat"><strong>{summary.staff_count}</strong><span>staff accounts</span></div>
        <div className="developmentStat"><strong>{summary.completed_courses}</strong><span>course completions</span></div>
        <div className="developmentStat"><strong>{summary.courses_in_progress}</strong><span>courses in progress</span></div>
        <div className="developmentStat"><strong>{summary.live_cpd_completions}</strong><span>live CPD completions</span></div>
        <div className="developmentStat"><strong>{summary.active_pathways}</strong><span>active pathways</span></div>
        <div className="developmentStat"><strong>{summary.completed_pathways}</strong><span>completed pathways</span></div>
        <div className="developmentStat"><strong>{summary.active_action_plans}</strong><span>active implementation plans</span></div>
        <div className="developmentStat"><strong>{summary.average_impact_rating ?? "–"}</strong><span>average impact review / 5</span></div>
      </section>

      <section className="developmentGrid">
        <article className="developmentCard">
          <span className="eyebrow">DEPARTMENTS</span><h2>Participation by department</h2><p>Course activity is shown as aggregate counts only.</p>
          <div className="entryList">{summary.department_activity.map(d => <div key={d.department}><div className="entryMeta"><strong>{d.department}</strong><span>{d.staff} staff</span><span>{d.completed_courses} completed</span><span>{d.active_course_records} active</span></div><div className="progressLine"><span style={{ width: `${Math.round((d.completed_courses / maxDepartment) * 100)}%` }} /></div></div>)}{!summary.department_activity.length && <div className="emptyDevelopment">No department activity yet.</div>}</div>
        </article>

        <article className="developmentCard">
          <span className="eyebrow">COURSE USE</span><h2>Most-completed courses</h2><p>This helps identify which CPD is being used, not which staff member completed it.</p>
          <div className="entryList">{summary.course_completion_counts.map(c => <div key={c.course_id}><div className="entryMeta"><strong>{courseMap.get(c.course_id) || c.course_id}</strong><span>{c.completions} completions</span></div><div className="progressLine"><span style={{ width: `${Math.round((c.completions / maxCourse) * 100)}%` }} /></div></div>)}{!summary.course_completion_counts.length && <div className="emptyDevelopment">No course completions yet.</div>}</div>
        </article>

        <article className="developmentCard">
          <span className="eyebrow">TREND</span><h2>Recent completions</h2><p>Course completions over the last six calendar months.</p>
          <div className="entryList">{summary.monthly_completions.map(m => <div key={m.month}><div className="entryMeta"><strong>{m.month}</strong><span>{m.completions} completions</span></div><div className="progressLine"><span style={{ width: `${Math.round((m.completions / maxMonth) * 100)}%` }} /></div></div>)}{!summary.monthly_completions.length && <div className="emptyDevelopment">No completion trend yet.</div>}</div>
        </article>
      </section>

      <section className="phaseCard" style={{ marginTop: 18 }}><span className="eyebrow">IMPLEMENTATION SIGNALS</span><h2>{summary.impact_reviews} impact reviews recorded</h2><p>Action-plan reviews are counted in aggregate. The dashboard deliberately does not return staff members' written outcomes, evidence summaries or next actions.</p></section>
    </>}
  </main>;
}
