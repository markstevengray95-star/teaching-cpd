"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; full_name: string; role: string; department: string };
type Assignment = { id: string; target_type: "catalogue" | "custom" | "pathway"; target_id: string; title_snapshot: string; due_date: string | null; mandatory: boolean; status: "assigned" | "in_progress" | "completed" | "waived"; assignment_note: string; completed_at: string | null };
type Requirement = { id: string; title: string; description: string; target_type: "catalogue" | "custom"; target_id: string; frequency_months: number | null; mandatory: boolean; audience_type: "all" | "role" | "department"; audience_value: string | null; active: boolean };
type TrainingRecord = { requirement_id: string; completed_at: string; expires_at: string | null; source_course_id: string | null };
type CalendarEvent = { id: string; title: string; description: string; starts_at: string; ends_at: string | null; location: string; audience: string; event_type: string };
type SchoolCourse = { id: string; slug: string; title: string; category: string; summary: string; duration_minutes: number; level: string; current_version_number: number };

export default function TrainingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schoolCourses, setSchoolCourses] = useState<SchoolCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/training"; return; }
      const { data: p, error: profileError } = await supabase.from("staff_profiles").select("id,full_name,role,department").eq("id", auth.user.id).single();
      if (profileError || !p) { if (active) { setMessage(profileError?.message || "Unable to load staff profile."); setLoading(false); } return; }
      const [a, r, tr, ev, cc] = await Promise.all([
        supabase.from("cpd_assignments").select("id,target_type,target_id,title_snapshot,due_date,mandatory,status,assignment_note,completed_at").eq("assigned_to", auth.user.id).order("due_date", { ascending: true, nullsFirst: false }),
        supabase.from("training_requirements").select("id,title,description,target_type,target_id,frequency_months,mandatory,audience_type,audience_value,active").eq("active", true),
        supabase.from("training_records").select("requirement_id,completed_at,expires_at,source_course_id").eq("user_id", auth.user.id),
        supabase.from("cpd_calendar_events").select("id,title,description,starts_at,ends_at,location,audience,event_type").gte("starts_at", new Date(Date.now() - 86400000).toISOString()).order("starts_at", { ascending: true }).limit(12),
        supabase.from("custom_courses").select("id,slug,title,category,summary,duration_minutes,level,current_version_number").eq("status", "published").order("title"),
      ]);
      if (!active) return;
      setProfile(p as Profile);
      if (a.error || r.error || tr.error || ev.error || cc.error) setMessage([a.error?.message, r.error?.message, tr.error?.message, ev.error?.message, cc.error?.message].filter(Boolean).join(" · "));
      setAssignments((a.data || []) as Assignment[]);
      setRequirements((r.data || []) as Requirement[]);
      setRecords((tr.data || []) as TrainingRecord[]);
      setEvents((ev.data || []) as CalendarEvent[]);
      setSchoolCourses((cc.data || []) as SchoolCourse[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const applicable = useMemo(() => profile ? requirements.filter(r => applies(r, profile)) : [], [requirements, profile]);
  const recordMap = useMemo(() => new Map(records.map(r => [r.requirement_id, r])), [records]);
  const now = Date.now();
  const outstandingMandatory = applicable.filter(r => r.mandatory && complianceState(recordMap.get(r.id), now) !== "current").length;
  const overdueAssignments = assignments.filter(a => assignmentState(a, now) === "overdue").length;
  const expiringSoon = applicable.filter(r => complianceState(recordMap.get(r.id), now) === "expiring").length;

  if (loading) return <main className="stagePage"><div className="stageCard">Loading your training record…</div></main>;
  if (!profile) return <main className="stagePage"><div className="stageCard"><h1>Training record unavailable</h1><p>{message || "Sign in to continue."}</p></div></main>;

  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">MY TRAINING</span>
      <h1>Assignments, compliance and school CPD.</h1>
      <p>Your required learning, expiry dates and upcoming professional development are brought together here. Completing a linked course updates your record automatically.</p>
      <div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/">Course library</a><a className="secondary phaseLinkButton" href="/pathways">My pathways</a></div>
    </section>
    {message && <div className="noticeWarn">{message}</div>}
    <section className="stageStatGrid">
      <div className="stageStat"><strong>{assignments.filter(a => !["completed","waived"].includes(a.status)).length}</strong><span>active assignments</span></div>
      <div className="stageStat"><strong>{overdueAssignments}</strong><span>overdue assignments</span></div>
      <div className="stageStat"><strong>{outstandingMandatory}</strong><span>mandatory items needing attention</span></div>
      <div className="stageStat"><strong>{expiringSoon}</strong><span>records expiring within 60 days</span></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan7">
        <span className="eyebrow">ASSIGNED CPD</span><h2>Your current assignments</h2>
        <div className="stageList">{assignments.length ? assignments.map(a => {
          const state = assignmentState(a, now); const href = assignmentHref(a, schoolCourses);
          return <div className="stageRow" key={a.id}><div className="stageRowMain"><strong>{a.title_snapshot}</strong><span>{a.mandatory ? "Mandatory" : "Development"}{a.due_date ? ` · due ${formatDate(a.due_date)}` : " · no deadline"}</span>{a.assignment_note && <small>{a.assignment_note}</small>}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className={`stageBadge ${state === "completed" ? "good" : state === "overdue" ? "bad" : state === "in_progress" ? "info" : "warn"}`}>{state.replaceAll("_"," ")}</span>{href && <a className="textButton" href={href}>Open →</a>}</div></div>;
        }) : <div className="emptyCompact">You have no assigned CPD yet.</div>}</div>
      </div>

      <div className="stageCard stageSpan5">
        <span className="eyebrow">MANDATORY TRAINING</span><h2>Your compliance status</h2>
        <div className="stageList">{applicable.length ? applicable.map(r => {
          const record = recordMap.get(r.id); const state = complianceState(record, now);
          return <div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.title}</strong><span>{r.frequency_months ? `Renews every ${r.frequency_months} months` : "No recurring expiry"}</span>{record?.expires_at && <small>Expires {new Date(record.expires_at).toLocaleDateString("en-GB")}</small>}</div><span className={`stageBadge ${state === "current" ? "good" : state === "expired" ? "bad" : state === "expiring" ? "warn" : "info"}`}>{state}</span></div>;
        }) : <div className="emptyCompact">No active training requirements apply to your profile.</div>}</div>
      </div>

      <div className="stageCard stageSpan12">
        <span className="eyebrow">SCHOOL-CREATED CPD</span><h2>Courses created by your CPD team</h2>
        {schoolCourses.length ? <div className="courseShelf">{schoolCourses.map(c => <a key={c.id} href={`/custom/${c.slug}`} className="schoolCourseCard"><span className="stageBadge info">{c.category}</span><h3>{c.title}</h3><p>{c.summary || "School-created professional development course."}</p><div className="schoolCourseMeta"><span>{c.duration_minutes} min</span><span>{c.level}</span><span>Version {c.current_version_number}</span></div></a>)}</div> : <div className="emptyCompact">No school-created courses have been published yet.</div>}
      </div>

      <div className="stageCard stageSpan12">
        <span className="eyebrow">CPD CALENDAR</span><h2>Upcoming dates</h2>
        <div className="stageList">{events.length ? events.map(e => <div className="stageRow" key={e.id}><div className="stageRowMain"><strong>{e.title}</strong><span>{new Date(e.starts_at).toLocaleString("en-GB")} · {e.location || "Location TBC"}</span>{e.description && <small>{e.description}</small>}</div><span className="stageBadge info">{e.event_type}</span></div>) : <div className="emptyCompact">No upcoming CPD dates have been added.</div>}</div>
      </div>
    </section>
  </main>;
}

function applies(r: Requirement, p: Profile) {
  return r.audience_type === "all" || (r.audience_type === "role" && r.audience_value === p.role) || (r.audience_type === "department" && r.audience_value === p.department);
}

function complianceState(record: TrainingRecord | undefined, now: number): "current" | "expiring" | "expired" | "missing" {
  if (!record) return "missing";
  if (!record.expires_at) return "current";
  const expiry = new Date(record.expires_at).getTime();
  if (expiry < now) return "expired";
  if (expiry - now <= 60 * 86400000) return "expiring";
  return "current";
}

function assignmentState(a: Assignment, now: number) {
  if (a.status === "completed" || a.status === "waived") return a.status;
  if (a.due_date && new Date(`${a.due_date}T23:59:59`).getTime() < now) return "overdue";
  return a.status;
}

function assignmentHref(a: Assignment, schoolCourses: SchoolCourse[]) {
  if (a.target_type === "pathway") return "/pathways";
  if (a.target_type === "catalogue") return "/";
  const id = a.target_id.replace(/^custom:/, "");
  const course = schoolCourses.find(c => c.id === id);
  return course ? `/custom/${course.slug}` : "/training";
}

function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB"); }
