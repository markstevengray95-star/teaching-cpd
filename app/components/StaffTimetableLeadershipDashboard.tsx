"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { hasStaffPermission, resolveStaffAccess, STAFF_ROLE_LABELS } from "@/lib/rolePermissions";
import "./StaffTimetableLeadershipDashboard.css";

type SummaryRow = {
  id: string;
  organization_id: string;
  user_id: string;
  class_name: string;
  subject: string;
  year_group: string;
  course_id: string;
  coverage_percent: number;
  completed_lessons: number;
  planned_lessons: number;
  sequence_length: number;
  current_unit: string;
  next_unit: string;
  next_assessment_title: string;
  next_assessment_date: string | null;
  gap_flags: string[];
  updated_at: string;
};

type MasterUnit = {
  id: string;
  department: string;
  subject: string;
  year_group: string;
  title: string;
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ageDays(value: string) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return 999;
  return Math.floor((Date.now() - then) / 86400000);
}

export default function StaffTimetableLeadershipDashboard() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [units, setUnits] = useState<MasterUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading curriculum summaries…");
  const [roleLabel, setRoleLabel] = useState("Leadership");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  async function load() {
    setLoading(true);
    const client = getSupabaseBrowserClient();
    const { data: userData } = await client.auth.getUser();
    if (!userData.user) {
      window.location.href = "/auth?next=/staff-timetable/leadership";
      return;
    }
    const access = await resolveStaffAccess(client, userData.user);
    setRoleLabel(STAFF_ROLE_LABELS[access.role]);
    if (!access.organizationId || !hasStaffPermission(access.role, "school:view")) {
      setRows([]);
      setUnits([]);
      setMessage("This summary-only curriculum view is available to school leadership roles.");
      setLoading(false);
      return;
    }
    const [summaryResult, unitResult] = await Promise.all([
      client.from("staff_timetable_curriculum_summaries").select("id,organization_id,user_id,class_name,subject,year_group,course_id,coverage_percent,completed_lessons,planned_lessons,sequence_length,current_unit,next_unit,next_assessment_title,next_assessment_date,gap_flags,updated_at").eq("organization_id", access.organizationId).order("subject").order("year_group").order("class_name"),
      client.from("school_curriculum_units").select("id,department,subject,year_group,title").eq("organization_id", access.organizationId).order("department").order("subject").order("year_group"),
    ]);
    if (summaryResult.error) {
      setMessage(summaryResult.error.message || "Curriculum summaries could not be loaded.");
      setLoading(false);
      return;
    }
    setRows((summaryResult.data || []) as SummaryRow[]);
    setUnits((unitResult.data || []) as MasterUnit[]);
    setMessage(summaryResult.data?.length ? "Summary data refreshed." : "No staff timetable summaries have been published yet. They appear automatically when staff use their timetable workspace while signed in.");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const subjects = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.subject).filter(Boolean))).sort()], [rows]);
  const years = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.year_group).filter(Boolean))).sort()], [rows]);
  const filtered = useMemo(() => rows.filter((row) => (subjectFilter === "All" || row.subject === subjectFilter) && (yearFilter === "All" || row.year_group === yearFilter)), [rows, subjectFilter, yearFilter]);
  const averageCoverage = filtered.length ? Math.round(filtered.reduce((sum, row) => sum + row.coverage_percent, 0) / filtered.length) : 0;
  const behind = filtered.filter((row) => row.gap_flags.includes("Coverage behind expected pace"));
  const stale = filtered.filter((row) => ageDays(row.updated_at) > 14);
  const gapRows = filtered.filter((row) => row.gap_flags.length > 0);
  const upcoming = filtered.filter((row) => row.next_assessment_date).slice().sort((a, b) => String(a.next_assessment_date).localeCompare(String(b.next_assessment_date))).slice(0, 10);
  const masterUnits = units.filter((unit) => (subjectFilter === "All" || unit.subject === subjectFilter) && (yearFilter === "All" || unit.year_group === yearFilter));
  const departments = Array.from(new Set(masterUnits.map((unit) => unit.department).filter(Boolean))).length;

  return <main className="ttLeadershipPage">
    <section className="ttLeadershipHero">
      <div><span>PHASE 14 · CURRICULUM LEADERSHIP</span><h1>Curriculum coverage dashboard</h1><p>Organisation-level planning signals for HoDs and SLT. This view deliberately shows curriculum summaries only—not individual lesson-plan text, SEND/EAL notes, pupil data or teacher reflections.</p></div>
      <div className="ttLeadershipActions"><Link className="ttButton" href="/staff-timetable">My timetable</Link><Link className="ttButton" href="/curriculum">Master curriculum</Link><button className="ttButton primary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
    </section>

    <section className="ttLeadershipContext"><strong>{roleLabel}</strong><span>{message}</span></section>

    <section className="ttLeadershipFilters">
      <label><span>Subject</span><select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
      <label><span>Year group</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
    </section>

    <section className="ttLeadershipKpis">
      <article><small>Classes reporting</small><strong>{filtered.length}</strong><span>summary-only timetable data</span></article>
      <article><small>Average curriculum coverage</small><strong>{averageCoverage}%</strong><span>planned/taught sequence signal</span></article>
      <article className={behind.length ? "warning" : ""}><small>Behind expected pace</small><strong>{behind.length}</strong><span>10+ percentage points behind year pace</span></article>
      <article className={gapRows.length ? "warning" : ""}><small>Planning gaps</small><strong>{gapRows.length}</strong><span>classes with at least one flag</span></article>
      <article><small>Shared master units</small><strong>{masterUnits.length}</strong><span>across {departments} department(s)</span></article>
    </section>

    <section className="ttLeadershipGrid">
      <article className="ttLeadershipPanel wide">
        <div className="ttLeadershipPanelHead"><div><span>COVERAGE VIEW</span><h2>Classes and current units</h2></div><small>{filtered.length} class(es)</small></div>
        <div className="ttCoverageTable">
          <div className="head"><span>Class</span><span>Current → next</span><span>Coverage</span><span>Forward plan</span><span>Updated</span></div>
          {filtered.map((row) => <div key={row.id} className={row.gap_flags.length ? "flagged" : ""}><span><strong>{row.class_name}</strong><small>{row.subject}{row.year_group ? ` · ${row.year_group}` : ""}</small></span><span><strong>{row.current_unit || "Not set"}</strong><small>{row.next_unit ? `Next: ${row.next_unit}` : "Next unit not set"}</small></span><span><b>{row.coverage_percent}%</b><i><em style={{ width: `${row.coverage_percent}%` }} /></i></span><span>{row.planned_lessons}/{row.sequence_length || "—"}<small>{row.completed_lessons} complete</small></span><span>{ageDays(row.updated_at) === 0 ? "Today" : `${ageDays(row.updated_at)}d ago`}</span></div>)}
          {!filtered.length && <div className="empty">No curriculum summary data matches these filters.</div>}
        </div>
      </article>

      <article className="ttLeadershipPanel">
        <div className="ttLeadershipPanelHead"><div><span>PACE</span><h2>Classes needing a check</h2></div></div>
        <div className="ttLeadershipList">{behind.map((row) => <div key={row.id}><strong>{row.class_name}</strong><span>{row.subject} · {row.coverage_percent}% coverage</span></div>)}{!behind.length && <div className="empty">No filtered classes are currently flagged as behind expected pace.</div>}</div>
      </article>

      <article className="ttLeadershipPanel">
        <div className="ttLeadershipPanelHead"><div><span>ASSESSMENTS</span><h2>Upcoming assessment points</h2></div></div>
        <div className="ttLeadershipList">{upcoming.map((row) => <div key={`${row.id}-assessment`}><strong>{row.next_assessment_title || "Assessment"}</strong><span>{row.class_name} · {formatDate(row.next_assessment_date)}</span></div>)}{!upcoming.length && <div className="empty">No upcoming assessments are currently reported for these classes.</div>}</div>
      </article>

      <article className="ttLeadershipPanel">
        <div className="ttLeadershipPanelHead"><div><span>GAPS</span><h2>Curriculum planning flags</h2></div></div>
        <div className="ttLeadershipList">{gapRows.slice(0, 12).map((row) => <div key={`${row.id}-gaps`}><strong>{row.class_name}</strong><span>{row.gap_flags.join(" · ")}</span></div>)}{!gapRows.length && <div className="empty">No planning gaps are currently flagged.</div>}</div>
      </article>

      <article className="ttLeadershipPanel">
        <div className="ttLeadershipPanelHead"><div><span>DATA HEALTH</span><h2>Stale summaries</h2></div></div>
        <div className="ttLeadershipList">{stale.map((row) => <div key={`${row.id}-stale`}><strong>{row.class_name}</strong><span>Last refreshed {ageDays(row.updated_at)} days ago</span></div>)}{!stale.length && <div className="empty">All filtered summaries were refreshed within the last 14 days.</div>}</div>
      </article>
    </section>

    <section className="ttLeadershipNote"><strong>Use as a planning conversation, not a performance score.</strong><span>Coverage percentage is a curriculum-planning signal derived from timetable sequencing. It is not pupil attainment, teacher effectiveness or a substitute for professional curriculum review.</span></section>
  </main>;
}
