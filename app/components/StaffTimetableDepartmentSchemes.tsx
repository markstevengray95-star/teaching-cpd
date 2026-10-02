"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import "./StaffTimetableDepartmentSchemes.css";

export type DepartmentSchemeUnit = {
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
};

export type DepartmentSchemeLesson = {
  id: string;
  unit_id: string;
  title: string;
  sequence_order: number;
  objectives: string[];
  key_knowledge: string;
  lesson_outline: string;
  assessment: string;
};

export type DepartmentSchemeCopy = {
  unitId: string;
  department: string;
  subject: string;
  yearGroup: string;
  title: string;
  copiedAt: string;
  lessons: DepartmentSchemeLesson[];
};

function inferYear(className: string) {
  const match = className.match(/(?:year\s*)?(7|8|9|10|11|12|13)\b/i);
  return match ? match[1] : "";
}

export default function StaffTimetableDepartmentSchemes({ className, subject, currentCopy, readOnly, onImport }: { className: string; subject: string; currentCopy?: DepartmentSchemeCopy; readOnly: boolean; onImport: (unit: DepartmentSchemeUnit, lessons: DepartmentSchemeLesson[]) => void }) {
  const [units, setUnits] = useState<DepartmentSchemeUnit[]>([]);
  const [lessons, setLessons] = useState<DepartmentSchemeLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading shared department schemes…");
  const [department, setDepartment] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) { setMessage("Sign in to load shared department schemes."); return; }
        const access = await resolveStaffAccess(supabase, auth.user);
        if (!access.organizationId) { setMessage("No school organisation is linked to this account yet."); return; }
        setCanManage(["hod", "slt", "administrator", "super-admin"].includes(access.role));
        const { data: unitRows, error: unitError } = await supabase.from("school_curriculum_units").select("id,organization_id,department,subject,year_group,title,sequence_order,overview,objectives,vocabulary,knowledge_organiser,assessment_notes").eq("organization_id", access.organizationId).order("department").order("subject").order("year_group").order("sequence_order");
        if (unitError) throw unitError;
        const typedUnits = (unitRows || []) as DepartmentSchemeUnit[];
        const ids = typedUnits.map((item) => item.id);
        let typedLessons: DepartmentSchemeLesson[] = [];
        if (ids.length) {
          const { data: lessonRows, error: lessonError } = await supabase.from("school_curriculum_lessons").select("id,unit_id,title,sequence_order,objectives,key_knowledge,lesson_outline,assessment").in("unit_id", ids).order("sequence_order");
          if (lessonError) throw lessonError;
          typedLessons = (lessonRows || []) as DepartmentSchemeLesson[];
        }
        if (cancelled) return;
        setUnits(typedUnits); setLessons(typedLessons);
        const subjectMatch = typedUnits.find((item) => item.subject.toLowerCase() === subject.toLowerCase());
        setDepartment(subjectMatch?.department || typedUnits[0]?.department || "");
        setSelectedId(subjectMatch?.id || typedUnits[0]?.id || "");
        setMessage(typedUnits.length ? "Choose a master scheme and copy a snapshot into this class." : "No shared curriculum schemes have been published yet.");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Shared schemes could not be loaded.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [subject]);

  const departments = useMemo(() => [...new Set(units.map((item) => item.department).filter(Boolean))].sort(), [units]);
  const year = inferYear(className);
  const filtered = useMemo(() => units.filter((item) => (!department || item.department === department) && (!subject || item.subject.toLowerCase() === subject.toLowerCase() || !units.some((candidate) => candidate.department === department && candidate.subject.toLowerCase() === subject.toLowerCase()))).sort((a, b) => {
    const aBoost = year && a.year_group.includes(year) ? -1 : 0;
    const bBoost = year && b.year_group.includes(year) ? -1 : 0;
    return aBoost - bBoost || a.sequence_order - b.sequence_order || a.title.localeCompare(b.title);
  }), [units, department, subject, year]);
  const selected = units.find((item) => item.id === selectedId) || filtered[0] || null;
  const selectedLessons = selected ? lessons.filter((item) => item.unit_id === selected.id).sort((a, b) => a.sequence_order - b.sequence_order) : [];

  return <section className="ttDepartmentSchemes">
    <div className="ttDepartmentSchemesHead"><div><span>PHASE 13 · SHARED DEPARTMENT PLANNING</span><h3>Department schemes of work</h3><p>Browse the school&apos;s shared Curriculum Hub and copy a master sequence into {className}. Your timetable receives an editable snapshot; changing it will not alter the department master.</p></div>{canManage && <Link className="ttButton" href="/curriculum">Manage master curriculum</Link>}</div>
    {currentCopy && <div className="ttSchemeCurrent"><strong>Current class snapshot:</strong><span>{currentCopy.title} · {currentCopy.lessons.length} lessons · copied {new Date(currentCopy.copiedAt).toLocaleDateString("en-GB")}</span></div>}
    <div className="ttSchemeStatus">{loading ? "Loading…" : message}</div>
    {departments.length > 0 && <div className="ttSchemeFilters"><label><span>Department</span><select value={department} onChange={(event) => { setDepartment(event.target.value); setSelectedId(""); }}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><div><strong>{subject}</strong><span>{year ? `Class year detected: ${year}` : "Select a scheme for this class"}</span></div></div>}
    {filtered.length > 0 && <div className="ttSchemeLayout"><aside>{filtered.map((unit) => <button type="button" key={unit.id} className={(selected?.id === unit.id) ? "active" : ""} onClick={() => setSelectedId(unit.id)}><strong>{unit.title}</strong><span>{unit.subject} · {unit.year_group}</span><small>{lessons.filter((item) => item.unit_id === unit.id).length} lessons</small></button>)}</aside><main>{selected && <><div className="ttSchemePreviewHead"><div><small>{selected.department} · {selected.subject} · {selected.year_group}</small><h4>{selected.title}</h4><p>{selected.overview || "Shared department curriculum sequence."}</p></div><button type="button" className="ttButton primary" disabled={readOnly || !selectedLessons.length} onClick={() => onImport(selected, selectedLessons)}>Copy scheme to this class</button></div><div className="ttSchemeLessonList">{selectedLessons.map((lesson, index) => <article key={lesson.id}><span>{index + 1}</span><div><strong>{lesson.title}</strong><small>{lesson.lesson_outline || lesson.key_knowledge || "Department lesson"}</small></div></article>)}</div></>}</main></div>}
    {!loading && !filtered.length && <div className="ttSchemeEmpty">No matching department scheme is available yet. HoDs can publish one from the Curriculum Hub.</div>}
  </section>;
}
