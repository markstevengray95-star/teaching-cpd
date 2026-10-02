"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ClassCurriculumProfile, getCourseLessonSequence, getPhase1Course, inferClassCurriculumProfile } from "./staffTimetableCurriculumPhase1";
import "./StaffTimetableAssessments.css";

export type CurriculumAssessmentTopicResult = {
  sequencePosition: number;
  title: string;
  unitTitle: string;
  subtopicTitle: string;
  scorePercent: number | null;
};

export type CurriculumAssessment = {
  id: string;
  className: string;
  subject: string;
  title: string;
  assessmentDate: string;
  courseId: string;
  thresholdPercent: number;
  topicResults: CurriculumAssessmentTopicResult[];
  notes: string;
  createdAt: string;
};

export type AssessmentFollowUpAction = "reteach" | "retrieval" | "homework" | "intervention" | "revision";

type AssessmentLesson = {
  className: string;
  subject: string;
  plan: { sequencePosition?: number; courseId?: string; topic?: string };
};

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function id() { return `assessment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export default function StaffTimetableAssessments({
  lessons,
  profiles,
  assessments,
  today,
  initialClass,
  readOnly,
  onChange,
  onFollowUp,
}: {
  lessons: AssessmentLesson[];
  profiles: Record<string, ClassCurriculumProfile>;
  assessments: CurriculumAssessment[];
  today: string;
  initialClass?: string;
  readOnly: boolean;
  onChange: (assessments: CurriculumAssessment[]) => void;
  onFollowUp: (action: AssessmentFollowUpAction, assessment: CurriculumAssessment, topic: CurriculumAssessmentTopicResult) => void;
}) {
  const classes = useMemo(() => [...new Set(lessons.map((lesson) => lesson.className).filter(Boolean))].sort(), [lessons]);
  const [selectedClass, setSelectedClass] = useState(classes.includes(initialClass || "") ? (initialClass || "") : classes[0] || "");
  const visibleClass = classes.includes(selectedClass) ? selectedClass : classes[0] || "";
  const classLessons = lessons.filter((lesson) => lesson.className === visibleClass);
  const profile = visibleClass ? profiles[visibleClass] || inferClassCurriculumProfile(visibleClass, classLessons[0]?.subject || "Science") : null;
  const sequence = profile ? getCourseLessonSequence(profile) : [];
  const maxPlanned = Math.max(-1, ...classLessons.map((lesson) => Number(lesson.plan.sequencePosition)).filter((position) => Number.isInteger(position) && position >= 0));
  const defaultScopeEnd = Math.min(sequence.length - 1, Math.max(maxPlanned, Math.min(sequence.length - 1, 5)));
  const [scopeEnd, setScopeEnd] = useState(defaultScopeEnd);
  const [title, setTitle] = useState("Curriculum check");
  const [date, setDate] = useState(today);
  const [threshold, setThreshold] = useState(60);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const classAssessments = assessments.filter((item) => item.className === visibleClass).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  const active = assessments.find((item) => item.id === activeId) || classAssessments[0] || null;
  const scored = active?.topicResults.filter((item) => item.scorePercent !== null) || [];
  const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.scorePercent || 0), 0) / scored.length) : null;
  const weak = active?.topicResults.filter((item) => item.scorePercent !== null && Number(item.scorePercent) < active.thresholdPercent).sort((a, b) => Number(a.scorePercent) - Number(b.scorePercent)) || [];

  function createAssessment() {
    if (readOnly || !profile || !sequence.length) return;
    const end = Math.min(Math.max(scopeEnd, 0), sequence.length - 1);
    const item: CurriculumAssessment = {
      id: id(), className: visibleClass, subject: profile.subject, title: title.trim() || "Curriculum check", assessmentDate: date || today,
      courseId: profile.courseId, thresholdPercent: clamp(threshold), notes: "", createdAt: new Date().toISOString(),
      topicResults: sequence.slice(0, end + 1).map((topic) => ({ sequencePosition: topic.sequencePosition, title: topic.title, unitTitle: topic.unitTitle, subtopicTitle: topic.subtopicTitle, scorePercent: null })),
    };
    onChange([...assessments, item]); setActiveId(item.id);
  }

  function updateActive(patch: Partial<CurriculumAssessment>) {
    if (!active || readOnly) return;
    onChange(assessments.map((item) => item.id === active.id ? { ...item, ...patch } : item));
  }

  function updateScore(position: number, raw: string) {
    if (!active || readOnly) return;
    const parsed = raw === "" ? null : clamp(Number(raw));
    updateActive({ topicResults: active.topicResults.map((item) => item.sequencePosition === position ? { ...item, scorePercent: Number.isFinite(parsed) ? parsed : null } : item) });
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !active || readOnly) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const updates = new Map<number, number>();
    rows.forEach((line, index) => {
      const parts = line.split(/[,;\t]/).map((part) => part.trim().replace(/^"|"$/g, ""));
      if (index === 0 && parts.some((part) => /topic|score|percent|position/i.test(part))) return;
      const firstNumber = Number(parts[0]); const score = Number(String(parts[parts.length - 1]).replace("%", ""));
      if (!Number.isFinite(score)) return;
      let position = Number.isInteger(firstNumber) ? firstNumber : -1;
      if (position >= 1 && !active.topicResults.some((item) => item.sequencePosition === position) && active.topicResults.some((item) => item.sequencePosition === position - 1)) position -= 1;
      if (position < 0) { const match = active.topicResults.find((item) => item.title.toLowerCase() === parts[0].toLowerCase()); if (match) position = match.sequencePosition; }
      if (position >= 0) updates.set(position, clamp(score));
    });
    updateActive({ topicResults: active.topicResults.map((item) => updates.has(item.sequencePosition) ? { ...item, scorePercent: updates.get(item.sequencePosition)! } : item) });
    event.target.value = "";
  }

  function removeActive() {
    if (!active || readOnly || !window.confirm(`Delete ${active.title}?`)) return;
    onChange(assessments.filter((item) => item.id !== active.id)); setActiveId(null);
  }

  if (!classes.length) return <section className="ttAssessmentShell"><div className="ttAssessmentEmpty"><strong>No classes yet</strong><span>Add or import timetable lessons before creating curriculum-linked assessments.</span></div></section>;

  return <section className="ttAssessmentShell">
    <div className="ttAssessmentHero"><div><span>PHASE 7 · ASSESSMENTS</span><h2>Assessment → weak topics → next action</h2><p>Record class-level topic percentages against the curriculum. Weak areas feed straight back into reteaching, retrieval, homework, intervention follow-up and revision planning.</p></div><label><span>Class</span><select value={visibleClass} onChange={(event) => { setSelectedClass(event.target.value); setActiveId(null); }}>{classes.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="ttAssessmentPrivacy"><strong>Class-level analysis only.</strong><span>This timetable workspace stores topic percentages, not pupil names or individual sensitive records. Use the intervention system for individual follow-up.</span></div>

    {!readOnly && <div className="ttAssessmentBuilder"><div><label><span>Assessment title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Weak-topic threshold</span><input type="number" min={0} max={100} value={threshold} onChange={(event) => setThreshold(clamp(Number(event.target.value)))} /></label><label><span>Curriculum covered to</span><select value={Math.max(0, scopeEnd)} onChange={(event) => setScopeEnd(Number(event.target.value))}>{sequence.map((item) => <option key={item.sequencePosition} value={item.sequencePosition}>{item.sequencePosition + 1}. {item.title}</option>)}</select></label></div><button className="ttButton primary" disabled={!sequence.length} onClick={createAssessment}>+ Create linked assessment</button></div>}

    <div className="ttAssessmentGrid"><aside><h3>Assessments</h3>{classAssessments.map((item) => { const entered = item.topicResults.filter((topic) => topic.scorePercent !== null); const itemAverage = entered.length ? Math.round(entered.reduce((sum, topic) => sum + Number(topic.scorePercent), 0) / entered.length) : null; return <button type="button" key={item.id} className={active?.id === item.id ? "active" : ""} onClick={() => setActiveId(item.id)}><strong>{item.title}</strong><span>{item.assessmentDate} · {itemAverage === null ? "No results" : `${itemAverage}% avg`}</span></button>; })}{!classAssessments.length && <div className="ttAssessmentEmpty small"><span>No assessments for this class yet.</span></div>}</aside>
      <main>{active ? <><div className="ttAssessmentSummary"><div><small>Course</small><strong>{getPhase1Course(active.courseId)?.title || active.subject}</strong></div><div><small>Average entered</small><strong>{average === null ? "—" : `${average}%`}</strong></div><div><small>Weak topics</small><strong>{weak.length}</strong></div><div><small>Threshold</small><strong>{active.thresholdPercent}%</strong></div></div>
        <div className="ttAssessmentToolbar"><div><input disabled={readOnly} value={active.title} onChange={(event) => updateActive({ title: event.target.value })} /><input disabled={readOnly} type="number" min={0} max={100} value={active.thresholdPercent} onChange={(event) => updateActive({ thresholdPercent: clamp(Number(event.target.value)) })} /></div>{!readOnly && <div><button className="ttButton" onClick={() => fileRef.current?.click()}>Import topic CSV</button><input ref={fileRef} className="ttAssessmentFile" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={importCsv} /><button className="ttButton danger" onClick={removeActive}>Delete</button></div>}</div>
        <div className="ttAssessmentTable"><div className="head"><span>Curriculum point</span><span>Unit</span><span>Score %</span></div>{active.topicResults.map((topic) => { const isWeak = topic.scorePercent !== null && topic.scorePercent < active.thresholdPercent; return <div key={topic.sequencePosition} className={isWeak ? "weak" : ""}><span><b>{topic.sequencePosition + 1}. {topic.title}</b><small>{topic.subtopicTitle}</small></span><span>{topic.unitTitle}</span><span><input disabled={readOnly} type="number" min={0} max={100} value={topic.scorePercent ?? ""} placeholder="—" onChange={(event) => updateScore(topic.sequencePosition, event.target.value)} /></span></div>; })}</div>
        {weak.length > 0 && <section className="ttAssessmentFollowUp"><div><span>RESPONSIVE FOLLOW-UP</span><h3>Weak topics</h3><p>Choose what should happen next. Actions are sent back into the timetable workspace rather than becoming a disconnected analysis report.</p></div>{weak.map((topic) => <article key={topic.sequencePosition}><div><strong>{topic.title}</strong><span>{topic.scorePercent}% · below {active.thresholdPercent}%</span></div><div>{(["reteach","retrieval","homework","intervention","revision"] as AssessmentFollowUpAction[]).map((action) => <button className="ttMiniLink" key={action} disabled={readOnly} onClick={() => onFollowUp(action, active, topic)}>{action === "reteach" ? "Plan reteach" : action === "retrieval" ? "Add retrieval" : action === "homework" ? "Set homework" : action === "intervention" ? "Intervention follow-up" : "Plan revision"}</button>)}</div></article>)}</section>}
        <label className="ttAssessmentNotes"><span>Assessment notes</span><textarea disabled={readOnly} value={active.notes} onChange={(event) => updateActive({ notes: event.target.value })} placeholder="Class-level observations, question design notes or teaching implications…" /></label>
      </> : <div className="ttAssessmentEmpty"><strong>Select or create an assessment</strong><span>Results will be mapped to the class curriculum sequence.</span></div>}</main></div>
  </section>;
}
