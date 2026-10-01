"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type Mode = "leadership" | "department";
type AnyRow = Record<string, any>;

function pretty(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

export default function LeadershipIntelligenceHub({ mode }: { mode: Mode }) {
  const client = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [directory, setDirectory] = useState<AnyRow[]>([]);
  const [improvement, setImprovement] = useState<AnyRow[]>([]);
  const [requests, setRequests] = useState<AnyRow[]>([]);
  const [content, setContent] = useState<AnyRow[]>([]);
  const [calendar, setCalendar] = useState<AnyRow[]>([]);
  const [notices, setNotices] = useState<AnyRow[]>([]);
  const [department, setDepartment] = useState("all");

  async function load() {
    setLoading(true); setMessage("");
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { setMessage("Sign in to view leadership information."); setLoading(false); return; }
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);
    if (!access.organizationId) { setMessage("Select a school organisation first."); setLoading(false); return; }
    const org = access.organizationId;
    const [d, i, r, c, cal, n] = await Promise.all([
      client.from("staff_directory_entries").select("*").eq("organization_id", org),
      client.from("school_improvement_items").select("*").eq("organization_id", org),
      client.from("school_requests").select("*").eq("organization_id", org),
      client.from("school_content_items").select("*").eq("organization_id", org),
      client.from("school_calendar_events").select("*").eq("organization_id", org).order("starts_at").limit(80),
      client.from("school_notices").select("*").eq("organisation_id", org).order("starts_at", { ascending:false }).limit(60),
    ]);
    setDirectory(d.data || []); setImprovement(i.data || []); setRequests(r.data || []); setContent(c.data || []); setCalendar(cal.data || []); setNotices(n.data || []);
    const firstError = [d.error,i.error,r.error,c.error,cal.error,n.error].find(Boolean);
    if (firstError) setMessage(firstError.message);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const departments = useMemo(() => Array.from(new Set([
    ...directory.map((row) => row.department), ...improvement.map((row) => row.department), ...content.map((row) => row.department),
  ].filter(Boolean))).sort() as string[], [directory, improvement, content]);

  const scopedDirectory = useMemo(() => department === "all" ? directory : directory.filter((row) => row.department === department), [directory, department]);
  const scopedImprovement = useMemo(() => department === "all" ? improvement : improvement.filter((row) => row.scope === "school" || row.department === department), [improvement, department]);
  const scopedContent = useMemo(() => department === "all" ? content : content.filter((row) => !row.department || row.department === department), [content, department]);
  const activePriorities = scopedImprovement.filter((row) => !["complete","paused"].includes(row.status));
  const atRisk = activePriorities.filter((row) => row.status === "at-risk" || (row.due_date && row.due_date < new Date().toISOString().slice(0,10)));
  const pending = requests.filter((row) => row.status === "submitted");
  const policiesDue = scopedContent.filter((row) => row.content_type === "policy" && row.review_date && new Date(row.review_date).getTime() <= Date.now() + 30*86_400_000 && row.status !== "archived");
  const nextEvents = calendar.filter((row) => new Date(row.starts_at).getTime() >= Date.now()).slice(0,6);
  const completionAverage = activePriorities.length ? Math.round(activePriorities.reduce((sum,row) => sum + Number(row.progress || 0),0) / activePriorities.length) : 100;

  return <main className="rpShell">
    <header className="rpTopbar">
      <Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link>
      <nav><Link href="/leadership-dashboard">Leadership</Link><Link href="/department-analytics">Departments</Link><Link href="/school-improvement">Improvement</Link></nav>
      <span className="rpRole">{STAFF_ROLE_LABELS[role]}</span>
    </header>

    <section className="rpHero"><div><span>PHASE {mode === "leadership" ? 56 : 57} · {mode === "leadership" ? "LEADERSHIP DASHBOARD" : "DEPARTMENT ANALYTICS"}</span><h1>{mode === "leadership" ? "Leadership Dashboard" : "Department Analytics"}</h1><p>{mode === "leadership" ? "See school improvement, approvals, policy review, communication and upcoming activity in one leadership view." : "Compare department capacity, improvement actions, shared resources and current delivery signals without ranking individual staff."}</p></div><button onClick={() => void load()}>Refresh data</button></section>

    {mode === "department" && <section className="rpToolbar"><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">Whole school</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><div /><button onClick={() => setDepartment("all")}>Reset</button></section>}
    {message && <div className="rpMessage">{message}</div>}
    {loading ? <section className="rpEmpty">Loading leadership data…</section> : <>
      <section className="rpStats">
        <article><strong>{scopedDirectory.length}</strong><span>{department === "all" ? "Directory staff" : "Staff in department"}</span></article>
        <article><strong>{activePriorities.length}</strong><span>Active improvement priorities</span></article>
        <article><strong>{completionAverage}%</strong><span>Average priority progress</span></article>
        <article><strong>{mode === "leadership" ? pending.length : scopedContent.length}</strong><span>{mode === "leadership" ? "Awaiting approval" : "Shared resources / policies"}</span></article>
      </section>

      <section className="rpCompactGrid">
        <article className="rpPanel"><h2>Needs attention</h2><div className="rpListRows">{atRisk.slice(0,6).map((row) => <Link className="rpRow" href={row.scope === "school" ? "/school-improvement" : "/department-plans"} key={row.id}><small>{row.scope === "school" ? "School plan" : row.department || "Department"}</small><strong>{row.title}</strong><small>{row.progress || 0}% · due {pretty(row.due_date)}</small></Link>)}{!atRisk.length && <p>No overdue or at-risk improvement actions in this view.</p>}</div></article>
        <article className="rpPanel"><h2>Upcoming school activity</h2><div className="rpListRows">{nextEvents.map((row) => <Link href="/calendar" className="rpRow" key={row.id}><small>{row.category || "Calendar"}</small><strong>{row.title}</strong><small>{pretty(row.starts_at)}{row.location ? ` · ${row.location}` : ""}</small></Link>)}{!nextEvents.length && <p>No upcoming calendar items visible.</p>}</div></article>
        <article className="rpPanel"><h2>{mode === "leadership" ? "Approvals & governance" : "Department evidence"}</h2><div className="rpListRows">{mode === "leadership" ? <>{pending.slice(0,4).map((row) => <Link href={row.request_type === "trip" ? "/trips" : "/forms"} className="rpRow" key={row.id}><small>{row.request_type}</small><strong>{row.title}</strong><small>Awaiting decision</small></Link>)}{policiesDue.slice(0,3).map((row) => <Link href="/policies" className="rpRow" key={row.id}><small>Policy review</small><strong>{row.title}</strong><small>Review {pretty(row.review_date)}</small></Link>)}</> : <>{scopedContent.slice(0,7).map((row) => <Link href={row.content_type === "policy" ? "/policies" : "/resource-library"} className="rpRow" key={row.id}><small>{row.content_type}</small><strong>{row.title}</strong><small>{row.category || row.department || "Whole school"}</small></Link>)}</>}</div></article>
      </section>

      {mode === "department" && <section className="rpCompactGrid">
        {departments.map((name) => {
          const staff = directory.filter((row) => row.department === name).length;
          const actions = improvement.filter((row) => row.department === name && !["complete","paused"].includes(row.status));
          const avg = actions.length ? Math.round(actions.reduce((sum,row) => sum + Number(row.progress || 0),0)/actions.length) : 100;
          const resources = content.filter((row) => row.department === name).length;
          return <article className="rpPanel" key={name}><div className="rpPills"><span>{staff} staff</span><span>{actions.length} actions</span><span>{resources} resources</span></div><h2>{name}</h2><p>Current improvement progress: <strong>{avg}%</strong></p><div className="rpProgress"><span style={{ width:`${avg}%` }} /></div></article>;
        })}
      </section>}

      {mode === "leadership" && <section className="rpCompactGrid"><article className="rpPanel" style={{ gridColumn:"1/-1" }}><h2>Leadership shortcuts</h2><div className="rpPills"><Link href="/school-improvement">School improvement</Link><Link href="/forms">Forms & approvals</Link><Link href="/trips">Trips</Link><Link href="/policies">Policies</Link><Link href="/staff-voice">Staff voice</Link><Link href="/compliance">Compliance</Link><Link href="/induction">Induction</Link></div></article></section>}
    </>}
  </main>;
}
