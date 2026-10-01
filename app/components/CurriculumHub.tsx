"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./CurriculumHub.css";

type ResourceLink = { label?: string; url?: string };
type Unit = {
  id: string;
  organization_id: string;
  department: string;
  subject: string;
  year_group: string;
  title: string;
  sequence_order: number;
  overview: string;
  objectives: string[];
  vocabulary: string[];
  knowledge_organiser: string;
  assessment_notes: string;
  resource_links: ResourceLink[];
};
type Lesson = {
  id: string;
  unit_id: string;
  title: string;
  sequence_order: number;
  objectives: string[];
  key_knowledge: string;
  lesson_outline: string;
  assessment: string;
  resource_links: ResourceLink[];
};

const manageRoles: StaffRole[] = ["hod", "slt", "administrator", "super-admin"];
const wholeSchoolRoles: StaffRole[] = ["slt", "administrator", "super-admin"];
const defaultYears = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"];

function splitList(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

export default function CurriculumHub() {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [ownDepartment, setOwnDepartment] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [unitDepartment, setUnitDepartment] = useState("");
  const [unitSubject, setUnitSubject] = useState("");
  const [unitYear, setUnitYear] = useState("Year 7");
  const [unitTitle, setUnitTitle] = useState("");
  const [unitSequence, setUnitSequence] = useState("1");
  const [unitOverview, setUnitOverview] = useState("");
  const [unitObjectives, setUnitObjectives] = useState("");
  const [unitVocabulary, setUnitVocabulary] = useState("");
  const [unitKnowledge, setUnitKnowledge] = useState("");
  const [unitAssessment, setUnitAssessment] = useState("");

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSequence, setLessonSequence] = useState("1");
  const [lessonObjectives, setLessonObjectives] = useState("");
  const [lessonKnowledge, setLessonKnowledge] = useState("");
  const [lessonOutline, setLessonOutline] = useState("");
  const [lessonAssessment, setLessonAssessment] = useState("");

  const canManage = manageRoles.includes(role);
  const canManageWholeSchool = wholeSchoolRoles.includes(role);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.assign("/auth?next=/curriculum");
        return;
      }
      const access = await resolveStaffAccess(client, auth.user);
      const [{ data: modern }, { data: legacy }] = await Promise.all([
        client.from("staff_development_profiles").select("department,preferred_organization_id").eq("user_id", auth.user.id).maybeSingle(),
        client.from("staff_profiles").select("department,organisation_id").eq("id", auth.user.id).maybeSingle(),
      ]);
      const dept = modern?.department || legacy?.department || "Whole school";
      const org = access.organizationId || modern?.preferred_organization_id || legacy?.organisation_id || null;
      if (!mounted) return;
      setUserId(auth.user.id);
      setRole(access.role);
      setOrganizationId(org);
      setOwnDepartment(dept);
      setUnitDepartment(dept);
      const requested = new URLSearchParams(window.location.search).get("department");
      if (requested) setDepartmentFilter(requested);
      if (org) await loadCurriculum(org);
      setLoading(false);
    })().catch((error) => {
      console.error("Curriculum hub load failed", error);
      if (mounted) { setMessage("The curriculum hub could not be loaded yet."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  async function loadCurriculum(org: string) {
    const client = getSupabaseBrowserClient();
    const [unitResult, lessonResult] = await Promise.all([
      client.from("school_curriculum_units").select("id,organization_id,department,subject,year_group,title,sequence_order,overview,objectives,vocabulary,knowledge_organiser,assessment_notes,resource_links").eq("organization_id", org).order("subject").order("year_group").order("sequence_order"),
      client.from("school_curriculum_lessons").select("id,unit_id,title,sequence_order,objectives,key_knowledge,lesson_outline,assessment,resource_links").order("sequence_order"),
    ]);
    const loadedUnits = (unitResult.data || []) as Unit[];
    setUnits(loadedUnits);
    setLessons((lessonResult.data || []) as Lesson[]);
    setSelectedUnitId((current) => current || loadedUnits[0]?.id || null);
    const error = unitResult.error || lessonResult.error;
    if (error) setMessage(error.message);
  }

  const departments = useMemo(() => Array.from(new Set([ownDepartment, ...units.map((unit) => unit.department)].filter(Boolean))).sort(), [ownDepartment, units]);
  const subjects = useMemo(() => Array.from(new Set(units.filter((unit) => departmentFilter === "All" || unit.department === departmentFilter).map((unit) => unit.subject))).sort(), [departmentFilter, units]);
  const years = useMemo(() => Array.from(new Set([...defaultYears, ...units.map((unit) => unit.year_group)])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [units]);
  const filteredUnits = useMemo(() => units.filter((unit) => (departmentFilter === "All" || unit.department === departmentFilter) && (subjectFilter === "All" || unit.subject === subjectFilter) && (yearFilter === "All" || unit.year_group === yearFilter)), [departmentFilter, subjectFilter, yearFilter, units]);
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) || filteredUnits[0] || null;
  const selectedLessons = selectedUnit ? lessons.filter((lesson) => lesson.unit_id === selectedUnit.id).sort((a, b) => a.sequence_order - b.sequence_order) : [];

  useEffect(() => {
    if (filteredUnits.length && !filteredUnits.some((unit) => unit.id === selectedUnitId)) setSelectedUnitId(filteredUnits[0].id);
  }, [filteredUnits, selectedUnitId]);

  async function createUnit() {
    if (!organizationId || !userId || !canManage || !unitTitle.trim() || !unitSubject.trim()) {
      setMessage("Add a subject and topic title before creating the unit.");
      return;
    }
    const department = canManageWholeSchool ? unitDepartment.trim() || ownDepartment : ownDepartment;
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.from("school_curriculum_units").insert({
      organization_id: organizationId,
      department,
      subject: unitSubject.trim(),
      year_group: unitYear,
      title: unitTitle.trim(),
      sequence_order: Number(unitSequence) || 1,
      overview: unitOverview.trim(),
      objectives: splitList(unitObjectives),
      vocabulary: splitList(unitVocabulary),
      knowledge_organiser: unitKnowledge.trim(),
      assessment_notes: unitAssessment.trim(),
      created_by: userId,
    }).select("id").single();
    if (error) return setMessage(error.message);
    setUnitTitle(""); setUnitOverview(""); setUnitObjectives(""); setUnitVocabulary(""); setUnitKnowledge(""); setUnitAssessment("");
    setMessage("Curriculum unit created.");
    await loadCurriculum(organizationId);
    if (data?.id) setSelectedUnitId(data.id);
  }

  async function createLesson() {
    if (!userId || !organizationId || !selectedUnit || !canManage || !lessonTitle.trim()) {
      setMessage("Choose a curriculum unit and add a lesson title.");
      return;
    }
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("school_curriculum_lessons").insert({
      unit_id: selectedUnit.id,
      title: lessonTitle.trim(),
      sequence_order: Number(lessonSequence) || selectedLessons.length + 1,
      objectives: splitList(lessonObjectives),
      key_knowledge: lessonKnowledge.trim(),
      lesson_outline: lessonOutline.trim(),
      assessment: lessonAssessment.trim(),
      created_by: userId,
    });
    if (error) return setMessage(error.message);
    setLessonTitle(""); setLessonObjectives(""); setLessonKnowledge(""); setLessonOutline(""); setLessonAssessment("");
    setLessonSequence(String(selectedLessons.length + 2));
    setMessage("Lesson added to the curriculum sequence.");
    await loadCurriculum(organizationId);
  }

  async function deleteUnit(unit: Unit) {
    if (!canManage || !window.confirm(`Delete “${unit.title}” and all of its lessons?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("school_curriculum_units").delete().eq("id", unit.id);
    if (error) return setMessage(error.message);
    if (organizationId) await loadCurriculum(organizationId);
  }

  async function deleteLesson(lesson: Lesson) {
    if (!canManage || !window.confirm(`Delete lesson “${lesson.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("school_curriculum_lessons").delete().eq("id", lesson.id);
    if (error) return setMessage(error.message);
    setLessons((current) => current.filter((item) => item.id !== lesson.id));
  }

  if (loading) return <main className="cuPage"><div className="cuLoading">Loading curriculum…</div></main>;

  return <main className="cuPage">
    <header className="cuTopbar"><Link href="/teach">← Teach</Link><div><span>PHASE 34</span><strong>Curriculum Hub</strong></div><Link href="/department-hub">Department Hub →</Link></header>

    <section className="cuHero"><div><span className="cuEyebrow">SUBJECT → YEAR → TOPIC → LESSONS</span><h1>Curriculum in one navigable structure.</h1><p>Keep schemes of work, objectives, vocabulary, knowledge organisers, assessment guidance and lesson sequences together.</p></div><div className="cuHeroStats"><span><strong>{new Set(units.map((u) => u.subject)).size}</strong><small>subjects</small></span><span><strong>{units.length}</strong><small>topics / units</small></span><span><strong>{lessons.length}</strong><small>lessons</small></span></div></section>

    {message && <div className="cuMessage">{message}</div>}

    <section className="cuFilters">
      <label><span>Department</span><select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setSubjectFilter("All"); }}><option>All</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Subject</span><select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option>All</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Year group</span><select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}><option>All</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
      <Link href="/resource-generator">Create teaching resource</Link>
    </section>

    <section className="cuWorkspace">
      <aside className="cuUnitList">
        <div className="cuListHeading"><span>TOPICS / UNITS</span><strong>{filteredUnits.length}</strong></div>
        {filteredUnits.map((unit) => <button key={unit.id} className={selectedUnit?.id === unit.id ? "active" : ""} onClick={() => setSelectedUnitId(unit.id)}><span>{unit.subject} · {unit.year_group}</span><strong>{unit.title}</strong><small>{unit.overview || `${lessons.filter((lesson) => lesson.unit_id === unit.id).length} lessons`}</small></button>)}
        {!filteredUnits.length && <div className="cuEmpty">No curriculum units match these filters yet.</div>}
      </aside>

      <section className="cuDetail">
        {selectedUnit ? <>
          <div className="cuDetailHeading"><div><span>{selectedUnit.department} · {selectedUnit.subject} · {selectedUnit.year_group}</span><h2>{selectedUnit.title}</h2></div>{canManage && <button className="danger" onClick={() => deleteUnit(selectedUnit)}>Delete unit</button>}</div>
          {selectedUnit.overview && <p className="cuLead">{selectedUnit.overview}</p>}
          <div className="cuInfoGrid">
            <article><span>LEARNING OBJECTIVES</span>{selectedUnit.objectives.length ? <ul>{selectedUnit.objectives.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No objectives added yet.</p>}</article>
            <article><span>KEY VOCABULARY</span><div className="cuTags">{selectedUnit.vocabulary.length ? selectedUnit.vocabulary.map((item) => <b key={item}>{item}</b>) : <p>No vocabulary added yet.</p>}</div></article>
            <article className="wide"><span>KNOWLEDGE ORGANISER</span><p>{selectedUnit.knowledge_organiser || "No knowledge-organiser summary has been added yet."}</p></article>
            <article className="wide"><span>ASSESSMENT & CHECKPOINTS</span><p>{selectedUnit.assessment_notes || "No assessment guidance has been added yet."}</p></article>
          </div>

          <div className="cuLessonsHeading"><div><span>LESSON SEQUENCE</span><h3>{selectedLessons.length} lessons</h3></div></div>
          <div className="cuLessons">{selectedLessons.map((lesson) => <article key={lesson.id}><div className="cuLessonNumber">{lesson.sequence_order}</div><div><h4>{lesson.title}</h4>{lesson.objectives.length > 0 && <p><strong>Objectives:</strong> {lesson.objectives.join(" · ")}</p>}{lesson.key_knowledge && <p><strong>Key knowledge:</strong> {lesson.key_knowledge}</p>}{lesson.lesson_outline && <details><summary>Lesson outline</summary><p>{lesson.lesson_outline}</p></details>}{lesson.assessment && <p><strong>Check for understanding:</strong> {lesson.assessment}</p>}</div>{canManage && <button onClick={() => deleteLesson(lesson)}>Delete</button>}</article>)}{!selectedLessons.length && <div className="cuEmpty">No lessons have been sequenced for this unit yet.</div>}</div>
        </> : <div className="cuBlank"><strong>Choose or create a curriculum unit.</strong><p>The hierarchy will appear here as subjects, year groups, topics and individual lessons are added.</p></div>}
      </section>
    </section>

    {canManage && <section className="cuManageGrid">
      <article><span className="cuEyebrow">NEW CURRICULUM UNIT</span><h2>Add a topic / scheme</h2><div className="cuForm">{canManageWholeSchool && <input value={unitDepartment} onChange={(e) => setUnitDepartment(e.target.value)} placeholder="Department"/>}<input value={unitSubject} onChange={(e) => setUnitSubject(e.target.value)} placeholder="Subject, e.g. Physics"/><select value={unitYear} onChange={(e) => setUnitYear(e.target.value)}>{years.map((item) => <option key={item}>{item}</option>)}</select><input value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="Topic / unit title"/><input type="number" min="1" value={unitSequence} onChange={(e) => setUnitSequence(e.target.value)} placeholder="Sequence"/><textarea value={unitOverview} onChange={(e) => setUnitOverview(e.target.value)} placeholder="Unit overview" rows={3}/><textarea value={unitObjectives} onChange={(e) => setUnitObjectives(e.target.value)} placeholder="Objectives, separated by commas or new lines" rows={3}/><textarea value={unitVocabulary} onChange={(e) => setUnitVocabulary(e.target.value)} placeholder="Key vocabulary, separated by commas" rows={3}/><textarea value={unitKnowledge} onChange={(e) => setUnitKnowledge(e.target.value)} placeholder="Knowledge organiser summary" rows={4}/><textarea value={unitAssessment} onChange={(e) => setUnitAssessment(e.target.value)} placeholder="Assessment / checkpoint guidance" rows={3}/><button onClick={createUnit}>Create curriculum unit</button></div></article>
      <article><span className="cuEyebrow">ADD LESSON</span><h2>{selectedUnit ? `Add to ${selectedUnit.title}` : "Choose a unit first"}</h2><div className="cuForm"><input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson title" disabled={!selectedUnit}/><input type="number" min="1" value={lessonSequence} onChange={(e) => setLessonSequence(e.target.value)} placeholder="Lesson number" disabled={!selectedUnit}/><textarea value={lessonObjectives} onChange={(e) => setLessonObjectives(e.target.value)} placeholder="Lesson objectives" rows={3} disabled={!selectedUnit}/><textarea value={lessonKnowledge} onChange={(e) => setLessonKnowledge(e.target.value)} placeholder="Key knowledge" rows={4} disabled={!selectedUnit}/><textarea value={lessonOutline} onChange={(e) => setLessonOutline(e.target.value)} placeholder="Lesson outline / suggested sequence" rows={5} disabled={!selectedUnit}/><textarea value={lessonAssessment} onChange={(e) => setLessonAssessment(e.target.value)} placeholder="Assessment / check for understanding" rows={3} disabled={!selectedUnit}/><button onClick={createLesson} disabled={!selectedUnit}>Add lesson</button></div></article>
    </section>}
  </main>;
}
