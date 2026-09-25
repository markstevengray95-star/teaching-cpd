"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Staff = { id: string; full_name: string; role: string; department: string };
type Assignment = { id: string; assigned_to: string; target_type: "catalogue" | "custom" | "pathway"; target_id: string; title_snapshot: string; due_date: string | null; mandatory: boolean; status: string; assignment_note: string; assigned_at: string };
type Requirement = { id: string; title: string; description: string; target_type: "catalogue" | "custom"; target_id: string; frequency_months: number | null; mandatory: boolean; audience_type: "all" | "role" | "department"; audience_value: string | null; active: boolean };
type TrainingRecord = { user_id: string; requirement_id: string; completed_at: string; expires_at: string | null };
type CalendarEvent = { id: string; title: string; description: string; starts_at: string; ends_at: string | null; location: string; audience: string; event_type: string };
type SchoolCourse = { id: string; slug: string; title: string; status: string; current_version_number: number };
type Tab = "overview" | "assignments" | "requirements" | "calendar";

export default function AdminPage() {
  const [me, setMe] = useState<Staff | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schoolCourses, setSchoolCourses] = useState<SchoolCourse[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/admin"; return; }
      const { data: profile, error } = await supabase.from("staff_profiles").select("id,full_name,role,department").eq("id", auth.user.id).single();
      if (!active) return;
      if (error || !profile) { setMessage(error?.message || "Unable to load your profile."); setLoading(false); return; }
      const mine = profile as Staff;
      setMe(mine);
      if (!["CPD Lead", "Admin"].includes(mine.role)) { setLoading(false); return; }
      await loadAll();
    })();
    async function loadAll() {
      const client = getSupabaseBrowserClient(); if (!client) return;
      const [s, a, r, tr, e, cc] = await Promise.all([
        client.from("staff_profiles").select("id,full_name,role,department").order("full_name"),
        client.from("cpd_assignments").select("id,assigned_to,target_type,target_id,title_snapshot,due_date,mandatory,status,assignment_note,assigned_at").order("assigned_at", { ascending: false }),
        client.from("training_requirements").select("id,title,description,target_type,target_id,frequency_months,mandatory,audience_type,audience_value,active").order("title"),
        client.from("training_records").select("user_id,requirement_id,completed_at,expires_at"),
        client.from("cpd_calendar_events").select("id,title,description,starts_at,ends_at,location,audience,event_type").order("starts_at", { ascending: true }),
        client.from("custom_courses").select("id,slug,title,status,current_version_number").order("title"),
      ]);
      if (!active) return;
      const errors = [s.error,a.error,r.error,tr.error,e.error,cc.error].filter(Boolean);
      if (errors.length) setMessage(errors.map(x => x?.message).join(" · "));
      setStaff((s.data || []) as Staff[]); setAssignments((a.data || []) as Assignment[]); setRequirements((r.data || []) as Requirement[]); setRecords((tr.data || []) as TrainingRecord[]); setEvents((e.data || []) as CalendarEvent[]); setSchoolCourses((cc.data || []) as SchoolCourse[]); setLoading(false);
    }
    return () => { active = false; };
  }, []);

  const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s])), [staff]);
  const recordMap = useMemo(() => new Map(records.map(r => [`${r.user_id}:${r.requirement_id}`, r])), [records]);
  const activeRequirements = requirements.filter(r => r.active);
  const now = Date.now();

  async function createAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!me) return;
    const form = new FormData(e.currentTarget); const client = getSupabaseBrowserClient(); if (!client) return;
    const targetType = String(form.get("target_type")) as Assignment["target_type"];
    const targetId = String(form.get("target_id") || "");
    const title = targetTitle(targetType, targetId, schoolCourses);
    const { data, error } = await client.from("cpd_assignments").insert({ assigned_to: String(form.get("assigned_to")), assigned_by: me.id, target_type: targetType, target_id: targetId, title_snapshot: title, due_date: String(form.get("due_date") || "") || null, mandatory: Boolean(form.get("mandatory")), assignment_note: String(form.get("assignment_note") || "") }).select("id,assigned_to,target_type,target_id,title_snapshot,due_date,mandatory,status,assignment_note,assigned_at").single();
    if (error) { setMessage(error.message); return; }
    setAssignments(prev => [data as Assignment, ...prev]); setMessage("Assignment created."); e.currentTarget.reset();
  }

  async function createRequirement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!me) return;
    const form = new FormData(e.currentTarget); const client = getSupabaseBrowserClient(); if (!client) return;
    const type = String(form.get("target_type")) as "catalogue" | "custom"; const targetId = String(form.get("target_id") || "");
    const months = String(form.get("frequency_months") || "");
    const title = String(form.get("title") || "").trim() || targetTitle(type, targetId, schoolCourses);
    const { data, error } = await client.from("training_requirements").insert({ title, description: String(form.get("description") || ""), target_type: type, target_id: targetId, frequency_months: months ? Number(months) : null, mandatory: Boolean(form.get("mandatory")), audience_type: String(form.get("audience_type") || "all"), audience_value: String(form.get("audience_value") || "") || null, created_by: me.id }).select("id,title,description,target_type,target_id,frequency_months,mandatory,audience_type,audience_value,active").single();
    if (error) { setMessage(error.message); return; }
    setRequirements(prev => [...prev, data as Requirement]); setMessage("Training requirement added."); e.currentTarget.reset();
  }

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!me) return;
    const form = new FormData(e.currentTarget); const client = getSupabaseBrowserClient(); if (!client) return;
    const start = String(form.get("starts_at") || ""); const end = String(form.get("ends_at") || "");
    const { data, error } = await client.from("cpd_calendar_events").insert({ title: String(form.get("title") || ""), description: String(form.get("description") || ""), starts_at: new Date(start).toISOString(), ends_at: end ? new Date(end).toISOString() : null, location: String(form.get("location") || ""), audience: String(form.get("audience") || "All staff"), event_type: String(form.get("event_type") || "cpd"), created_by: me.id }).select("id,title,description,starts_at,ends_at,location,audience,event_type").single();
    if (error) { setMessage(error.message); return; }
    setEvents(prev => [...prev, data as CalendarEvent].sort((x,y) => x.starts_at.localeCompare(y.starts_at))); setMessage("Calendar event added."); e.currentTarget.reset();
  }

  async function waiveAssignment(id: string) {
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { error } = await client.from("cpd_assignments").update({ status: "waived", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setMessage(error.message); else setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: "waived" } : a));
  }

  async function toggleRequirement(item: Requirement) {
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { error } = await client.from("training_requirements").update({ active: !item.active, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) setMessage(error.message); else setRequirements(prev => prev.map(r => r.id === item.id ? { ...r, active: !r.active } : r));
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Loading CPD administration…</div></main>;
  if (!me || !["CPD Lead","Admin"].includes(me.role)) return <main className="stagePage"><section className="stageCard"><span className="eyebrow">CPD ADMIN</span><h1>CPD Lead or Admin access required</h1><p>The administration area contains staff training status and assignment controls, so it is restricted to authorised roles.</p><a className="secondary phaseLinkButton" href="/training">My training</a></section></main>;

  const openAssignments = assignments.filter(a => !["completed","waived"].includes(a.status)).length;
  const upcoming = events.filter(e => new Date(e.starts_at).getTime() >= now).length;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">CPD LEAD MANAGEMENT</span><h1>Plan, assign and monitor professional development.</h1><p>Manage staff assignments, mandatory training, recurring expiries and the school CPD calendar. Personal reflections and portfolio notes remain private and are not exposed here.</p><div className="stageHeroActions"><a href="/builder" className="primary phaseLinkButton">Open course creator</a><a href="/leadership" className="secondary phaseLinkButton">Leadership analytics</a></div></section>
    {message && <div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{staff.length}</strong><span>staff profiles</span></div><div className="stageStat"><strong>{openAssignments}</strong><span>open assignments</span></div><div className="stageStat"><strong>{activeRequirements.length}</strong><span>active requirements</span></div><div className="stageStat"><strong>{upcoming}</strong><span>upcoming calendar items</span></div></section>

    <div className="stageTabs"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "assignments" ? "active" : ""} onClick={() => setTab("assignments")}>Assignments</button><button className={tab === "requirements" ? "active" : ""} onClick={() => setTab("requirements")}>Training matrix</button><button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>Calendar</button></div>

    {tab === "overview" && <section className="stageGrid">
      <div className="stageCard stageSpan6"><span className="eyebrow">ATTENTION</span><h2>Overdue assignments</h2><div className="stageList">{assignments.filter(a => assignmentStatus(a, now) === "overdue").slice(0,8).map(a => <div className="stageRow" key={a.id}><div className="stageRowMain"><strong>{a.title_snapshot}</strong><span>{staffMap.get(a.assigned_to)?.full_name || "Staff member"} · due {a.due_date ? formatDate(a.due_date) : "—"}</span></div><span className="stageBadge bad">overdue</span></div>)}{!assignments.some(a => assignmentStatus(a, now) === "overdue") && <div className="emptyCompact">No overdue assignments.</div>}</div></div>
      <div className="stageCard stageSpan6"><span className="eyebrow">EXPIRIES</span><h2>Training needing renewal</h2><div className="stageList">{records.filter(r => r.expires_at && new Date(r.expires_at).getTime() <= now + 60*86400000).sort((a,b) => String(a.expires_at).localeCompare(String(b.expires_at))).slice(0,8).map(r => <div className="stageRow" key={`${r.user_id}:${r.requirement_id}`}><div className="stageRowMain"><strong>{requirements.find(x => x.id === r.requirement_id)?.title || "Training requirement"}</strong><span>{staffMap.get(r.user_id)?.full_name || "Staff member"} · {r.expires_at ? `expires ${new Date(r.expires_at).toLocaleDateString("en-GB")}` : ""}</span></div><span className={`stageBadge ${r.expires_at && new Date(r.expires_at).getTime() < now ? "bad" : "warn"}`}>{r.expires_at && new Date(r.expires_at).getTime() < now ? "expired" : "renew soon"}</span></div>)}{!records.some(r => r.expires_at && new Date(r.expires_at).getTime() <= now + 60*86400000) && <div className="emptyCompact">No training expiries within 60 days.</div>}</div></div>
    </section>}

    {tab === "assignments" && <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Assign CPD to a staff member</summary><form className="stageForm" onSubmit={createAssignment}><div className="stageFormGrid"><label>Staff member<select name="assigned_to" required>{staff.map(s => <option key={s.id} value={s.id}>{s.full_name} · {s.department || s.role}</option>)}</select></label><label>Type<select name="target_type" defaultValue="catalogue"><option value="catalogue">Core course</option><option value="custom">School-created course</option><option value="pathway">Development pathway</option></select></label><label className="full">Learning item<select name="target_id" required><optgroup label="Core courses">{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup><optgroup label="School-created courses">{schoolCourses.filter(c => c.status === "published").map(c => <option key={c.id} value={`custom:${c.id}`}>{c.title}</option>)}</optgroup><optgroup label="Pathways">{pathways.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</optgroup></select></label><label>Due date<input name="due_date" type="date" /></label><label style={{justifyContent:"end"}}><span>Requirement</span><span><input name="mandatory" type="checkbox" style={{width:"auto",marginRight:7}} />Mandatory</span></label><label className="full">Assignment note<textarea name="assignment_note" rows={3} placeholder="Optional context or expectation…" /></label></div><button className="primary">Create assignment</button></form></details></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">ASSIGNMENTS</span><h2>Recent assignments</h2><div className="stageList">{assignments.map(a => <div className="stageRow" key={a.id}><div className="stageRowMain"><strong>{a.title_snapshot}</strong><span>{staffMap.get(a.assigned_to)?.full_name || "Staff member"}{a.due_date ? ` · due ${formatDate(a.due_date)}` : ""}</span><small>{a.mandatory ? "Mandatory" : "Development"}</small></div><div style={{display:"flex",gap:7,alignItems:"center"}}><span className={`stageBadge ${assignmentStatus(a, now) === "completed" ? "good" : assignmentStatus(a, now) === "overdue" ? "bad" : "info"}`}>{assignmentStatus(a, now)}</span>{!["completed","waived"].includes(a.status) && <button className="textButton dangerText" onClick={() => waiveAssignment(a.id)}>Waive</button>}</div></div>)}{!assignments.length && <div className="emptyCompact">No assignments created yet.</div>}</div></div>
    </section>}

    {tab === "requirements" && <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Add mandatory/recurring training</summary><form className="stageForm" onSubmit={createRequirement}><div className="stageFormGrid"><label className="full">Requirement title<input name="title" placeholder="e.g. Annual Safeguarding Update" /></label><label>Course type<select name="target_type"><option value="catalogue">Core course</option><option value="custom">School-created course</option></select></label><label>Linked course<select name="target_id" required><optgroup label="Core courses">{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup><optgroup label="School-created courses">{schoolCourses.filter(c => c.status === "published").map(c => <option key={c.id} value={`custom:${c.id}`}>{c.title}</option>)}</optgroup></select></label><label>Renew every (months)<input name="frequency_months" type="number" min="1" max="120" placeholder="Leave blank for no expiry" /></label><label>Audience<select name="audience_type"><option value="all">All staff</option><option value="role">Role</option><option value="department">Department</option></select></label><label className="full">Audience value<input name="audience_value" placeholder="Only needed for role/department, e.g. Science" /></label><label className="full">Description<textarea name="description" rows={3} /></label><label className="full"><span><input name="mandatory" type="checkbox" defaultChecked style={{width:"auto",marginRight:7}} />Mandatory requirement</span></label></div><button className="primary">Add requirement</button></form></details><div className="stageCard"><h3>Requirements</h3><div className="stageList">{requirements.map(r => <div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.title}</strong><span>{r.audience_type === "all" ? "All staff" : `${r.audience_type}: ${r.audience_value || "not set"}`} · {r.frequency_months ? `${r.frequency_months} month renewal` : "no expiry"}</span></div><button className="textButton" onClick={() => toggleRequirement(r)}>{r.active ? "Deactivate" : "Activate"}</button></div>)}</div></div></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">STATUTORY / REQUIRED TRAINING</span><h2>Staff training matrix</h2><div className="matrixWrap"><table className="trainingMatrix"><thead><tr><th>Staff</th>{activeRequirements.map(r => <th key={r.id}>{r.title}</th>)}</tr></thead><tbody>{staff.map(s => <tr key={s.id}><td><strong>{s.full_name}</strong><br/><span>{s.department || s.role}</span></td>{activeRequirements.map(r => { const applicable = applies(r,s); const record = recordMap.get(`${s.id}:${r.id}`); const state = applicable ? recordState(record, now) : "na"; return <td key={r.id}><span className={`matrixCell ${state}`}>{state === "na" ? "N/A" : state}</span></td>; })}</tr>)}</tbody></table></div>{!activeRequirements.length && <div className="emptyCompact">Add a training requirement to populate the matrix.</div>}</div>
    </section>}

    {tab === "calendar" && <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Add CPD calendar item</summary><form className="stageForm" onSubmit={createEvent}><div className="stageFormGrid"><label className="full">Title<input required name="title" /></label><label>Starts<input required name="starts_at" type="datetime-local" /></label><label>Ends<input name="ends_at" type="datetime-local" /></label><label>Type<select name="event_type"><option value="cpd">CPD session</option><option value="training">Training</option><option value="deadline">Deadline</option><option value="review">Review</option></select></label><label>Audience<input name="audience" defaultValue="All staff" /></label><label className="full">Location<input name="location" /></label><label className="full">Description<textarea name="description" rows={3} /></label></div><button className="primary">Add to calendar</button></form></details></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">CALENDAR</span><h2>Scheduled CPD and deadlines</h2><div className="stageList">{events.map(e => <div className="stageRow" key={e.id}><div className="stageRowMain"><strong>{e.title}</strong><span>{new Date(e.starts_at).toLocaleString("en-GB")} · {e.location || "Location TBC"}</span><small>{e.audience}</small></div><span className="stageBadge info">{e.event_type}</span></div>)}{!events.length && <div className="emptyCompact">No calendar items yet.</div>}</div></div>
    </section>}
  </main>;
}

function targetTitle(type: "catalogue" | "custom" | "pathway", id: string, schoolCourses: SchoolCourse[]) {
  if (type === "catalogue") return courses.find(c => c.id === id)?.title || id;
  if (type === "pathway") return pathways.find(p => p.id === id)?.title || id;
  return schoolCourses.find(c => `custom:${c.id}` === id)?.title || "School-created CPD";
}
function assignmentStatus(a: Assignment, now: number) { if (["completed","waived"].includes(a.status)) return a.status; return a.due_date && new Date(`${a.due_date}T23:59:59`).getTime() < now ? "overdue" : a.status; }
function applies(r: Requirement, s: Staff) { return r.audience_type === "all" || (r.audience_type === "role" && r.audience_value === s.role) || (r.audience_type === "department" && r.audience_value === s.department); }
function recordState(record: TrainingRecord | undefined, now: number): "current" | "expired" | "missing" | "na" { if (!record) return "missing"; return record.expires_at && new Date(record.expires_at).getTime() < now ? "expired" : "current"; }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB"); }
