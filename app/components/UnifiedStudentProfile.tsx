"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import { demoCases, interventionSummary, strandMean, type CaseRow, type SenCase } from "@/lib/senWorkspace";
import "./UnifiedStudentProfile.css";

type DirectoryStudent = {
  id: string;
  organization_id: string;
  display_name: string;
  year_group: string | null;
  class_group: string | null;
  external_ref: string | null;
};

type TrackedIntervention = {
  id: string;
  organization_id: string | null;
  student_id: string | null;
  student_ref: string;
  intervention_type: string;
  focus: string;
  zone: string | null;
  strategy: string;
  baseline_summary: string;
  goal: string;
  success_criteria: string;
  start_date: string;
  frequency: string;
  review_date: string | null;
  status: "Active" | "Review" | "Complete";
  notes: string;
  outcome: string;
  last_reviewed_at: string | null;
  created_at: string;
};

type InterventionReview = {
  id: string;
  intervention_id: string;
  reviewed_on: string;
  progress_rating: number | null;
  effectiveness: string;
  evidence: string;
  barriers: string;
  adaptations: string;
  next_steps: string;
  next_review_date: string | null;
  status_after: string;
};

type RegulationCheckIn = {
  id: string;
  subject_ref: string;
  zone: string;
  note: string;
  created_at: string;
};

type EalTest = {
  id: string;
  pupil_case_id: string | null;
  title: string;
  status: string;
  scores: Record<string, unknown>;
  teacher_notes: string;
  submitted_at: string | null;
  created_at: string;
};

type ProfileStudent = {
  id: string;
  studentId: string | null;
  displayName: string;
  yearGroup: string;
  classGroup: string;
  externalRef: string;
  senCaseId: string | null;
};

type TimelineEvent = { id: string; date: string; title: string; detail: string; kind: string };

type Mode = "loading" | "live" | "demo" | "unavailable";

const zoneLabels: Record<string, string> = { blue: "Blue", green: "Green", yellow: "Yellow", red: "Red" };

function normalise(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function localDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const text = value.length >= 10 ? value.slice(0, 10) : value;
  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function readingAge(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${years}y ${rest}m`;
}

function latestByDate<T>(items: T[], getDate: (item: T) => string) {
  return [...items].sort((a, b) => getDate(b).localeCompare(getDate(a)))[0];
}

function matchesReference(profile: ProfileStudent, value: string | null | undefined) {
  const needle = normalise(value);
  if (!needle) return false;
  return [profile.displayName, profile.externalRef].some((candidate) => normalise(candidate) === needle);
}

function findSenCase(profile: ProfileStudent | null, cases: CaseRow[]) {
  if (!profile) return null;
  if (profile.senCaseId) return cases.find((row) => row.id === profile.senCaseId) || null;
  return cases.find((row) => {
    const byRef = profile.externalRef && normalise(row.body.reference) === normalise(profile.externalRef);
    const byName = normalise(row.body.name) === normalise(profile.displayName);
    return Boolean(byRef || byName);
  }) || null;
}

function profilesFrom(students: DirectoryStudent[], cases: CaseRow[]) {
  const profiles: ProfileStudent[] = students.map((student) => ({
    id: student.id,
    studentId: student.id,
    displayName: student.display_name,
    yearGroup: student.year_group || "",
    classGroup: student.class_group || "",
    externalRef: student.external_ref || "",
    senCaseId: null,
  }));

  cases.forEach((row) => {
    const match = profiles.find((profile) => {
      const byRef = profile.externalRef && normalise(profile.externalRef) === normalise(row.body.reference);
      const byName = normalise(profile.displayName) === normalise(row.body.name);
      return Boolean(byRef || byName);
    });
    if (match) {
      match.senCaseId = row.id;
      if (!match.externalRef) match.externalRef = row.body.reference;
      if (!match.yearGroup) match.yearGroup = row.body.year;
      if (!match.classGroup) match.classGroup = row.body.className;
    } else {
      profiles.push({
        id: `sen:${row.id}`,
        studentId: null,
        displayName: row.body.name,
        yearGroup: row.body.year,
        classGroup: row.body.className,
        externalRef: row.body.reference,
        senCaseId: row.id,
      });
    }
  });

  return profiles.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function buildTimeline(
  profile: ProfileStudent,
  sen: SenCase | null,
  tracked: TrackedIntervention[],
  reviews: Record<string, InterventionReview[]>,
  checkIns: RegulationCheckIn[],
  tests: EalTest[],
) {
  const events: TimelineEvent[] = [];
  sen?.interventions.forEach((item) => {
    events.push({ id: `sen-int-${item.id}`, date: item.startDate, title: `Intervention started · ${item.title}`, detail: item.goal || item.strategy, kind: "Intervention" });
    item.sessions.forEach((session) => events.push({ id: `sen-session-${session.id}`, date: session.date, title: `Intervention session · ${item.title}`, detail: session.evidence, kind: "Session" }));
  });
  sen?.reviews.forEach((item) => events.push({ id: `sen-review-${item.id}`, date: item.date, title: "Support review", detail: item.decision || item.actions || item.evidence, kind: "Review" }));
  sen?.assessments.forEach((item) => events.push({ id: `sen-eal-${item.id}`, date: item.date, title: `EAL assessment · Band ${item.band}`, detail: item.evidence, kind: "EAL" }));
  sen?.reading.forEach((item) => events.push({ id: `sen-reading-${item.id}`, date: item.date, title: `Reading assessment · ${item.tool}`, detail: `Recorded reading age ${readingAge(item.ageMonths)}${item.notes ? ` · ${item.notes}` : ""}`, kind: "Reading" }));
  sen?.checkIns.forEach((item) => events.push({ id: `sen-check-${item.id}`, date: item.date, title: "Regulation check-in", detail: `${item.strategy}${item.nextStep ? ` · ${item.nextStep}` : ""}`, kind: "Regulation" }));
  sen?.contacts.forEach((item) => events.push({ id: `sen-contact-${item.id}`, date: item.date, title: item.type || "Communication", detail: item.summary, kind: "Communication" }));
  tracked.forEach((item) => {
    events.push({ id: `tracked-${item.id}`, date: item.start_date, title: `Intervention tracker · ${item.focus}`, detail: item.goal || item.strategy, kind: item.intervention_type.replaceAll("_", " ") });
    (reviews[item.id] || []).forEach((review) => events.push({ id: `tracked-review-${review.id}`, date: review.reviewed_on, title: `Intervention review · ${item.focus}`, detail: review.next_steps || review.evidence || review.effectiveness, kind: "Review" }));
  });
  checkIns.forEach((item) => events.push({ id: `general-check-${item.id}`, date: item.created_at.slice(0, 10), title: `Regulation check-in · ${zoneLabels[item.zone] || item.zone}`, detail: item.note || "Check-in recorded", kind: "Regulation" }));
  tests.forEach((item) => events.push({ id: `test-${item.id}`, date: (item.submitted_at || item.created_at).slice(0, 10), title: `${item.title} · ${item.status}`, detail: item.teacher_notes || "EAL pupil test record", kind: "EAL test" }));
  return events.filter((event) => event.date).sort((a, b) => b.date.localeCompare(a.date));
}

export default function UnifiedStudentProfile() {
  const [mode, setMode] = useState<Mode>("loading");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [students, setStudents] = useState<DirectoryStudent[]>([]);
  const [senCases, setSenCases] = useState<CaseRow[]>([]);
  const [senAccess, setSenAccess] = useState(false);
  const [interventions, setInterventions] = useState<TrackedIntervention[]>([]);
  const [interventionReviews, setInterventionReviews] = useState<Record<string, InterventionReview[]>>({});
  const [checkIns, setCheckIns] = useState<RegulationCheckIn[]>([]);
  const [ealTests, setEalTests] = useState<EalTest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"overview" | "support" | "interventions" | "eal" | "regulation" | "timeline">("overview");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.assign("/auth?next=/students/profile"); return; }
      const access = await resolveStaffAccess(client, auth.user);
      if (!mounted) return;
      setRole(access.role);
      setOrganizationId(access.organizationId);
      if (!access.organizationId) { setMode("unavailable"); return; }

      const { data: allowed } = await client.rpc("sen_workspace_access", { org_id: access.organizationId });
      const canSeeSen = allowed === true;
      if (!mounted) return;
      setSenAccess(canSeeSen);

      const [studentResult, interventionResult, checkInResult, senResult, testResult] = await Promise.all([
        client.from("staff_development_students").select("id,organization_id,display_name,year_group,class_group,external_ref").eq("organization_id", access.organizationId).eq("active", true).order("display_name"),
        client.from("staff_development_interventions").select("id,organization_id,student_id,student_ref,intervention_type,focus,zone,strategy,baseline_summary,goal,success_criteria,start_date,frequency,review_date,status,notes,outcome,last_reviewed_at,created_at").eq("organization_id", access.organizationId).order("created_at", { ascending: false }).limit(1000),
        client.from("staff_development_checkins").select("id,subject_ref,zone,note,created_at").eq("organization_id", access.organizationId).order("created_at", { ascending: false }).limit(1000),
        canSeeSen ? client.from("sen_department_cases").select("id,organization_id,body,version,archived_at,updated_at").eq("organization_id", access.organizationId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1000) : Promise.resolve({ data: [], error: null } as any),
        canSeeSen ? client.from("eal_student_tests").select("id,pupil_case_id,title,status,scores,teacher_notes,submitted_at,created_at").eq("organization_id", access.organizationId).order("created_at", { ascending: false }).limit(1000) : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (!mounted) return;
      setStudents((studentResult.data || []) as DirectoryStudent[]);
      const loadedInterventions = (interventionResult.data || []) as TrackedIntervention[];
      setInterventions(loadedInterventions);
      setCheckIns((checkInResult.data || []) as RegulationCheckIn[]);
      setSenCases((senResult.data || []) as CaseRow[]);
      setEalTests((testResult.data || []) as EalTest[]);

      if (loadedInterventions.length) {
        const reviewResult = await client.from("staff_development_intervention_reviews").select("id,intervention_id,reviewed_on,progress_rating,effectiveness,evidence,barriers,adaptations,next_steps,next_review_date,status_after").in("intervention_id", loadedInterventions.map((item) => item.id)).order("reviewed_on", { ascending: false });
        if (mounted) {
          const grouped: Record<string, InterventionReview[]> = {};
          for (const review of (reviewResult.data || []) as InterventionReview[]) (grouped[review.intervention_id] ||= []).push(review);
          setInterventionReviews(grouped);
        }
      }
      const errors = [studentResult.error, interventionResult.error, checkInResult.error, senResult.error, testResult.error].filter(Boolean).map((error: any) => error.message);
      if (errors.length) setMessage("Some linked information could not be loaded. " + errors.join(" · "));
      setMode("live");
    })().catch((error) => {
      console.error("Unified student profile failed to load", error);
      if (mounted) { setMessage("The live student profile could not be loaded yet. You can still explore the fictional demo."); setMode("unavailable"); }
    });
    return () => { mounted = false; };
  }, []);

  const profiles = useMemo(() => profilesFrom(students, senCases), [students, senCases]);
  useEffect(() => {
    if (profiles.length && !profiles.some((profile) => profile.id === selectedId)) setSelectedId(profiles[0].id);
  }, [profiles, selectedId]);

  const visibleProfiles = useMemo(() => {
    const q = normalise(query);
    return profiles.filter((profile) => !q || `${profile.displayName} ${profile.externalRef} ${profile.yearGroup} ${profile.classGroup}`.toLowerCase().includes(q));
  }, [profiles, query]);

  const selected = profiles.find((profile) => profile.id === selectedId) || null;
  const senRow = findSenCase(selected, senCases);
  const sen = senRow?.body || null;
  const tracked = selected ? interventions.filter((item) => item.student_id === selected.studentId || matchesReference(selected, item.student_ref)) : [];
  const selectedCheckIns = selected ? checkIns.filter((item) => matchesReference(selected, item.subject_ref)) : [];
  const selectedTests = senRow ? ealTests.filter((test) => test.pupil_case_id === senRow.id) : [];
  const timeline = selected ? buildTimeline(selected, sen, tracked, interventionReviews, selectedCheckIns, selectedTests) : [];
  const openTracked = tracked.filter((item) => item.status !== "Complete");
  const openSen = sen?.interventions.filter((item) => item.status !== "Closed") || [];
  const latestReading = sen ? latestByDate(sen.reading, (item) => item.date) : undefined;
  const latestEal = sen ? latestByDate(sen.assessments, (item) => item.date) : undefined;
  const latestCheckIn = sen ? latestByDate(sen.checkIns, (item) => item.date) : undefined;
  const nextReviewDates = [sen?.plan.reviewDate || "", ...openSen.map((item) => item.reviewDate), ...openTracked.map((item) => item.review_date || "")].filter(Boolean).sort();
  const nextReview = nextReviewDates[0] || "";

  function startDemo() {
    const cases = demoCases();
    setMode("demo");
    setSenAccess(true);
    setOrganizationId(null);
    setSenCases(cases);
    setStudents(cases.map((row, index) => ({ id: `demo-student-${index + 1}`, organization_id: "demo", display_name: row.body.name, year_group: row.body.year, class_group: row.body.className, external_ref: row.body.reference })));
    setInterventions([
      { id: "demo-tracked", organization_id: "demo", student_id: "demo-student-1", student_ref: cases[0].body.name, intervention_type: "academic", focus: "Independent task start", zone: null, strategy: "Visible first step and private prompt", baseline_summary: "Starts independently in 2 of 5 opportunities.", goal: "Start in 4 of 5 opportunities with no more than one prompt.", success_criteria: "4 of 5 opportunities for two weeks", start_date: cases[0].body.interventions[0].startDate, frequency: "Across lessons", review_date: cases[0].body.interventions[0].reviewDate, status: "Active", notes: "Fictional demo record", outcome: "", last_reviewed_at: null, created_at: new Date().toISOString() },
    ]);
    setInterventionReviews({ "demo-tracked": [{ id: "demo-review", intervention_id: "demo-tracked", reviewed_on: new Date().toISOString().slice(0, 10), progress_rating: 4, effectiveness: "strong", evidence: "Fictional example: independent start improved when the first step was visible.", barriers: "Busy transitions", adaptations: "Preview the first task before entry", next_steps: "Continue and reduce prompts gradually.", next_review_date: cases[0].body.plan.reviewDate, status_after: "Active" }] });
    setCheckIns([{ id: "demo-checkin", subject_ref: cases[0].body.name, zone: "green", note: "Fictional regulation check-in: ready to learn after using a short transition routine.", created_at: new Date().toISOString() }]);
    setEalTests([]);
    setSelectedId("demo-student-1");
    setMessage("Fictional demonstration only. Nothing entered here is written to a pupil record.");
  }

  if (mode === "loading") return <main className="uspPage"><div className="uspLoading">Building the unified student profile…</div></main>;

  return <main className="uspPage">
    <header className="uspTopbar noPrint">
      <Link href="/students">← Students</Link>
      <div><span>PHASE 2</span><strong>Unified Student Profile</strong></div>
      <div className="uspTopActions"><Link href="/interventions">Interventions</Link><Link href="/sen">SEN Hub</Link></div>
    </header>

    <section className="uspHero">
      <div><span className="uspEyebrow">ONE STUDENT · ONE SUPPORT VIEW</span><h1>Bring support information together without duplicating it.</h1><p>See the school student record, interventions, regulation history and—when your existing restricted access allows it—SEN, EAL and reading information in one connected profile.</p><span className="uspRole">{STAFF_ROLE_LABELS[role]} view</span></div>
      <div className="uspHeroActions noPrint"><button onClick={startDemo}>Try fictional demo</button><button className="primary" disabled={!selected} onClick={() => window.print()}>Print support summary</button></div>
    </section>

    <section className={`uspAccess ${senAccess ? "allowed" : "limited"}`}>
      <strong>{senAccess ? "Restricted SEN/EAL detail available" : "Standard student-support view"}</strong>
      <p>{senAccess ? "Your existing SEN workspace access check has authorised the restricted sections below." : "SEN/EAL pupil records are deliberately hidden for this account. The profile only uses information already available through the standard student-support tools."}</p>
    </section>

    {message && <div className="uspMessage" role="status">{message}</div>}

    {mode === "unavailable" && !profiles.length ? <section className="uspEmptyState"><h2>No live school student list is available yet.</h2><p>You can still open the fictional demonstration to test the complete Phase 2 workflow without entering real pupil information.</p><button onClick={startDemo}>Open fictional demo</button></section> : <div className="uspLayout">
      <aside className="uspStudentList noPrint">
        <label>Find student<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, reference, year or class" /></label>
        <span className="uspCount">{visibleProfiles.length} student{visibleProfiles.length === 1 ? "" : "s"}</span>
        <div>{visibleProfiles.map((profile) => <button key={profile.id} className={selectedId === profile.id ? "active" : ""} onClick={() => { setSelectedId(profile.id); setTab("overview"); }}><strong>{profile.displayName}</strong><small>{[profile.externalRef, profile.yearGroup, profile.classGroup].filter(Boolean).join(" · ") || "Student record"}</small></button>)}{!visibleProfiles.length && <p className="uspEmpty">No students match this search.</p>}</div>
      </aside>

      <section className="uspProfile">
        {selected ? <>
          <header className="uspProfileHead">
            <div><span className="uspEyebrow">STUDENT PROFILE</span><h2>{selected.displayName}</h2><p>{[selected.externalRef, selected.yearGroup, selected.classGroup].filter(Boolean).join(" · ") || "School student record"}</p></div>
            <div className="uspProfileBadges"><span>{sen?.status || "Student support"}</span>{latestEal && <span>EAL {latestEal.band}</span>}{latestReading && <span>Reading {readingAge(latestReading.ageMonths)}</span>}</div>
          </header>

          <nav className="uspTabs noPrint" aria-label="Student profile sections">
            {([['overview','Overview'],['support','Support plan'],['interventions','Interventions'],['eal','EAL & reading'],['regulation','Pastoral & regulation'],['timeline','Timeline']] as const).map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
          </nav>

          {tab === "overview" && <div className="uspSection">
            <div className="uspStats"><div><strong>{openTracked.length + openSen.length}</strong><span>open interventions</span></div><div><strong>{latestEal?.band || "—"}</strong><span>latest EAL band</span></div><div><strong>{latestReading ? readingAge(latestReading.ageMonths) : "—"}</strong><span>latest recorded reading age</span></div><div><strong>{nextReview ? localDate(nextReview) : "—"}</strong><span>next review</span></div></div>
            <div className="uspGrid two"><article className="uspCard"><span className="uspEyebrow">STRENGTHS & WHAT WORKS</span><h3>Start with strengths</h3><p>{sen?.strengths || "No restricted SEN profile is linked to this student. Use the standard school record and intervention evidence available to your role."}</p></article><article className="uspCard"><span className="uspEyebrow">CLASSROOM SUPPORT</span><h3>Useful adjustments</h3><p>{sen?.plan.adjustments || tracked.find((item) => item.strategy)?.strategy || "No current classroom adjustment has been recorded in the connected support tools."}</p>{sen?.plan.provision && <p className="uspMuted"><strong>Provision:</strong> {sen.plan.provision}</p>}</article></div>
            <div className="uspGrid two"><article className="uspCard"><h3>Current outcome</h3><p>{sen?.plan.outcome || tracked.find((item) => item.goal)?.goal || "No current support outcome recorded."}</p><small>{sen?.plan.measure || tracked.find((item) => item.success_criteria)?.success_criteria || "Add a measurable success criterion in the linked support tool."}</small></article><article className="uspCard"><h3>Needs and support signals</h3>{sen?.needs.length ? <div className="uspTags">{sen.needs.map((need) => <span key={need}>{need}</span>)}</div> : <p>No restricted SEN areas of need are shown in this view.</p>}{latestCheckIn && <p className="uspMuted"><strong>Latest SEN regulation check-in:</strong> {latestCheckIn.strategy} · usefulness {latestCheckIn.usefulness}/4</p>}</article></div>
            <article className="uspCard printSummary"><span className="uspEyebrow">QUICK SUPPORT SUMMARY</span><h3>For staff working with {selected.displayName}</h3><div className="uspSummaryGrid"><div><strong>Strengths</strong><p>{sen?.strengths || "Use the student’s known strengths and interests from approved school records."}</p></div><div><strong>Adjustments</strong><p>{sen?.plan.adjustments || tracked.map((item) => item.strategy).filter(Boolean).slice(0,2).join(" · ") || "No connected adjustment recorded."}</p></div><div><strong>Outcome</strong><p>{sen?.plan.outcome || tracked[0]?.goal || "No connected outcome recorded."}</p></div><div><strong>Review</strong><p>{nextReview ? localDate(nextReview) : "No review date recorded."}</p></div></div></article>
          </div>}

          {tab === "support" && <div className="uspSection">
            {!senAccess || !sen ? <article className="uspCard"><h3>Restricted support plan not available</h3><p>This account has not been given access to the SEN/EAL pupil record, or this student does not have a linked SEN workspace record. The app does not reveal restricted information through the unified profile.</p></article> : <>
              <div className="uspGrid two"><article className="uspCard"><h3>Graduated support plan</h3><dl className="uspDetails"><div><dt>Baseline</dt><dd>{sen.plan.baseline || "Not recorded"}</dd></div><div><dt>Outcome</dt><dd>{sen.plan.outcome || "Not recorded"}</dd></div><div><dt>Measure</dt><dd>{sen.plan.measure || "Not recorded"}</dd></div><div><dt>Lead</dt><dd>{sen.plan.owner || "Not recorded"}</dd></div><div><dt>Review</dt><dd>{localDate(sen.plan.reviewDate)}</dd></div></dl></article><article className="uspCard"><h3>Classroom adjustments & provision</h3><p><strong>Adjustments:</strong> {sen.plan.adjustments || "Not recorded"}</p><p><strong>Provision:</strong> {sen.plan.provision || "Not recorded"}</p><p><strong>Transition:</strong> {sen.plan.transition || "Not recorded"}</p><p><strong>External advice:</strong> {sen.plan.externalAdvice || "Not recorded"}</p></article></div>
              <div className="uspGrid two"><article className="uspCard"><h3>Pupil voice</h3><p>{sen.plan.pupilVoice || "Not recorded"}</p></article><article className="uspCard"><h3>Family voice</h3><p>{sen.plan.familyVoice || "Not recorded"}</p></article></div>
            </>}
          </div>}

          {tab === "interventions" && <div className="uspSection">
            <div className="uspSectionTitle"><div><span className="uspEyebrow">CONNECTED PROVISION</span><h3>{openTracked.length + openSen.length} open interventions</h3></div><Link className="uspLink noPrint" href="/interventions">Open intervention tracker →</Link></div>
            <div className="uspCardList">
              {openSen.map((item) => { const summary = interventionSummary(item); return <article className="uspCard" key={`sen-${item.id}`}><div className="uspCardTop"><span className="uspBadge">SEN workspace</span><span>{item.status}</span></div><h3>{item.title}</h3><p>{item.goal}</p><dl className="uspDetails compact"><div><dt>Lead</dt><dd>{item.owner}</dd></div><div><dt>Strategy</dt><dd>{item.strategy}</dd></div><div><dt>Frequency</dt><dd>{item.frequency}</dd></div><div><dt>Review</dt><dd>{localDate(item.reviewDate)}</dd></div><div><dt>Sessions</dt><dd>{summary.count}</dd></div><div><dt>Weekly minutes</dt><dd>{summary.weeklyMinutes}</dd></div></dl></article>; })}
              {tracked.map((item) => { const latest = interventionReviews[item.id]?.[0]; return <article className="uspCard" key={`tracked-${item.id}`}><div className="uspCardTop"><span className="uspBadge">Intervention tracker</span><span>{item.status}</span></div><h3>{item.focus}</h3><p>{item.goal || item.strategy || "No goal recorded."}</p><dl className="uspDetails compact"><div><dt>Type</dt><dd>{item.intervention_type.replaceAll("_", " ")}</dd></div><div><dt>Strategy</dt><dd>{item.strategy || "Not recorded"}</dd></div><div><dt>Frequency</dt><dd>{item.frequency || "Not set"}</dd></div><div><dt>Review</dt><dd>{localDate(item.review_date)}</dd></div></dl>{latest && <div className="uspLatest"><strong>Latest review · {localDate(latest.reviewed_on)}</strong><p>{latest.progress_rating ? `${latest.progress_rating}/5 · ` : ""}{latest.next_steps || latest.evidence || latest.effectiveness}</p></div>}</article>; })}
              {!openSen.length && !tracked.length && <article className="uspCard"><h3>No linked interventions</h3><p>Create an intervention in the intervention tracker, or add provision in the restricted SEN workspace where appropriate.</p></article>}
            </div>
          </div>}

          {tab === "eal" && <div className="uspSection">
            {!senAccess || !sen ? <article className="uspCard"><h3>Restricted EAL and reading detail not available</h3><p>This section follows the existing SEN workspace access rule. It is not opened simply because someone can view the general student-support area.</p></article> : <>
              <div className="uspGrid two"><article className="uspCard"><h3>Latest EAL assessment</h3>{latestEal ? <><div className="uspBigMetric">Band {latestEal.band}</div><p>{latestEal.evidence}</p><small>{latestEal.confidence} · {localDate(latestEal.date)} · {latestEal.assessor}</small><div className="uspStrands">{Object.entries(latestEal.scores).map(([strand, scores]) => { const mean = strandMean(scores); return <span key={strand}><strong>{strand}</strong>{mean === null ? "—" : mean.toFixed(1)}</span>; })}</div></> : <p>No EAL assessment is recorded.</p>}</article><article className="uspCard"><h3>Reading assessments</h3>{sen.reading.length ? <div className="uspReadingList">{[...sen.reading].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <div key={item.id}><strong>{readingAge(item.ageMonths)}</strong><span>{item.tool}</span><small>{localDate(item.date)}{item.notes ? ` · ${item.notes}` : ""}</small></div>)}</div> : <p>No reading assessment is recorded.</p>}<p className="uspMuted">Reading ages are shown exactly as recorded against the named assessment tool. An internal EAL estimate should not be treated as a standardised age-equivalent score.</p></article></div>
              <article className="uspCard"><div className="uspSectionTitle"><div><h3>EAL pupil tests</h3><p>Linked test-code records from the EAL assessment centre.</p></div><Link className="uspLink noPrint" href="/sen/eal/full-tests">Open test centre →</Link></div>{selectedTests.length ? <div className="uspTestList">{selectedTests.map((test) => <div key={test.id}><strong>{test.title}</strong><span>{test.status}</span><small>{localDate(test.submitted_at || test.created_at)}</small></div>)}</div> : <p>No EAL pupil test is linked to this profile.</p>}</article>
            </>}
          </div>}

          {tab === "regulation" && <div className="uspSection">
            <div className="uspSectionTitle"><div><span className="uspEyebrow">PASTORAL & REGULATION</span><h3>Check-ins and support signals</h3></div><Link className="uspLink noPrint" href="/regulation-behaviour">Open regulation hub →</Link></div>
            <div className="uspGrid two"><article className="uspCard"><h3>General regulation check-ins</h3>{selectedCheckIns.length ? <div className="uspCheckList">{selectedCheckIns.slice(0,10).map((item) => <div key={item.id}><span className={`uspZone ${item.zone}`}>{zoneLabels[item.zone] || item.zone}</span><div><strong>{localDate(item.created_at)}</strong><p>{item.note || "Check-in recorded"}</p></div></div>)}</div> : <p>No general regulation check-ins are linked to this student reference.</p>}</article><article className="uspCard"><h3>Restricted SEN regulation support</h3>{senAccess && sen ? sen.checkIns.length ? <div className="uspCheckList">{[...sen.checkIns].sort((a,b) => b.date.localeCompare(a.date)).slice(0,10).map((item) => <div key={item.id}><span className="uspZone neutral">{item.usefulness}/4</span><div><strong>{localDate(item.date)} · {item.strategy}</strong><p>{item.nextStep}</p><small>{item.before && item.after ? `${item.before} → ${item.after}` : item.signals}</small></div></div>)}</div> : <p>No SEN regulation check-ins recorded.</p> : <p>Hidden in this role-based view.</p>}</article></div>
            {senAccess && sen && <article className="uspCard"><h3>Communication / review context</h3>{sen.contacts.length ? <div className="uspContactList">{[...sen.contacts].sort((a,b) => b.date.localeCompare(a.date)).slice(0,8).map((item) => <div key={item.id}><strong>{item.type || "Contact"} · {localDate(item.date)}</strong><p>{item.summary}</p><small>{item.participants}{item.actions ? ` · Actions: ${item.actions}` : ""}</small></div>)}</div> : <p>No communication records stored in the SEN workspace.</p>}<p className="uspMuted">Safeguarding narratives should remain in the school’s approved safeguarding system, not this profile.</p></article>}
          </div>}

          {tab === "timeline" && <div className="uspSection"><article className="uspCard"><span className="uspEyebrow">CONNECTED HISTORY</span><h3>Student support timeline</h3><p>Chronological view assembled from the tools this account is permitted to read.</p><div className="uspTimeline">{timeline.slice(0,50).map((event) => <div key={event.id}><time>{localDate(event.date)}</time><span className="uspDot"/><div><span className="uspBadge">{event.kind}</span><strong>{event.title}</strong><p>{event.detail}</p></div></div>)}{!timeline.length && <p className="uspEmpty">No linked support history is available for this student.</p>}</div></article></div>}
        </> : <article className="uspCard"><h2>Select a student</h2><p>Choose a student from the list to build their connected support view.</p></article>}
      </section>
    </div>}

    <footer className="uspFooter"><strong>Data protection:</strong> This profile deliberately reuses existing authorised records instead of copying sensitive pupil information into a new dataset. Follow your school’s retention, safeguarding and access procedures.</footer>
  </main>;
}
