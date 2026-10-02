"use client";

import { useMemo, useState } from "react";
import "./StaffTimetableLessonHomework.css";

export type LessonLinkedHomework = {
  id: string;
  className: string;
  subject: string;
  title: string;
  setDate: string;
  dueDate: string;
  status: "To set" | "Set" | "Collected" | "Marked" | "Returned";
  priority: "Normal" | "High";
  notes: string;
  sourceLessonId?: string;
  sourceLessonDate?: string;
  sourceAssessmentId?: string;
  sourceTopic?: string;
  courseId?: string;
  sequencePosition?: number;
  curriculumUnit?: string;
  curriculumSubtopic?: string;
  completionPercent?: number;
  followUp?: "None" | "Reminder" | "Catch-up" | "Contact home" | "Intervention";
  followUpNotes?: string;
  autoMoveWithLesson?: boolean;
};

type LessonContext = {
  id: string;
  className: string;
  subject: string;
  lessonDate: string;
  topic: string;
  homeworkTask: string;
  courseId: string;
  sequencePosition: number;
  curriculumUnit: string;
  curriculumSubtopic: string;
};

function isoAfter(value: string, days: number) {
  const base = value ? new Date(`${value}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}
function makeId() { return `lesson_hw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export default function StaffTimetableLessonHomework({ lesson, homework, readOnly, onChange }: { lesson: LessonContext; homework: LessonLinkedHomework[]; readOnly: boolean; onChange: (homework: LessonLinkedHomework[]) => void }) {
  const linked = useMemo(() => homework.filter((item) => item.sourceLessonId === lesson.id), [homework, lesson.id]);
  const baseDate = lesson.lessonDate || new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(lesson.homeworkTask || (lesson.topic ? `Consolidate: ${lesson.topic}` : "Lesson homework"));
  const [dueDate, setDueDate] = useState(isoAfter(baseDate, 7));
  const [priority, setPriority] = useState<"Normal" | "High">("Normal");
  const [autoMove, setAutoMove] = useState(true);

  function create() {
    if (readOnly || !title.trim()) return;
    const item: LessonLinkedHomework = {
      id: makeId(), className: lesson.className, subject: lesson.subject, title: title.trim(), setDate: baseDate, dueDate,
      status: "To set", priority, notes: "", sourceLessonId: lesson.id, sourceLessonDate: lesson.lessonDate,
      sourceTopic: lesson.topic, courseId: lesson.courseId, sequencePosition: lesson.sequencePosition,
      curriculumUnit: lesson.curriculumUnit, curriculumSubtopic: lesson.curriculumSubtopic,
      completionPercent: 0, followUp: "None", followUpNotes: "", autoMoveWithLesson: autoMove,
    };
    onChange([...homework, item]);
  }

  function patch(id: string, change: Partial<LessonLinkedHomework>) { if (!readOnly) onChange(homework.map((item) => item.id === id ? { ...item, ...change } : item)); }
  function remove(id: string) { if (!readOnly) onChange(homework.filter((item) => item.id !== id)); }

  return <section className="ttLessonHomework">
    <div className="ttLessonHomeworkHead"><div><span>PHASE 8 · LESSON HOMEWORK</span><h3>Homework linked to this lesson</h3><p>Keep the whole chain together: lesson → homework → due date → completion → follow-up.</p></div><div><strong>{linked.length}</strong><small>linked</small></div></div>
    {!readOnly && <div className="ttLessonHomeworkCreate"><label className="wide"><span>Homework task</span><textarea value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Use the generated lesson homework or write your own…" /></label><label><span>Due date</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as "Normal" | "High")}><option>Normal</option><option>High</option></select></label><label className="check"><input type="checkbox" checked={autoMove} onChange={(event) => setAutoMove(event.target.checked)} /><span>Move dates automatically if this lesson date moves</span></label><button className="ttButton primary" type="button" onClick={create}>Attach homework</button></div>}
    {linked.length > 0 ? <div className="ttLessonHomeworkList">{linked.map((item) => <article key={item.id}>
      <div className="ttLessonHomeworkTitle"><input disabled={readOnly} value={item.title} onChange={(event) => patch(item.id, { title: event.target.value })} /><span>{item.sourceTopic || lesson.topic || "Lesson-linked"}</span></div>
      <div className="ttLessonHomeworkFields"><label><span>Status</span><select disabled={readOnly} value={item.status} onChange={(event) => patch(item.id, { status: event.target.value as LessonLinkedHomework["status"] })}>{["To set","Set","Collected","Marked","Returned"].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Due date</span><input disabled={readOnly} type="date" value={item.dueDate} onChange={(event) => patch(item.id, { dueDate: event.target.value })} /></label><label><span>Completion</span><div className="ttHomeworkCompletion"><input disabled={readOnly} type="range" min={0} max={100} step={5} value={item.completionPercent ?? 0} onChange={(event) => patch(item.id, { completionPercent: Number(event.target.value) })} /><b>{item.completionPercent ?? 0}%</b></div></label><label><span>Follow-up</span><select disabled={readOnly} value={item.followUp || "None"} onChange={(event) => patch(item.id, { followUp: event.target.value as LessonLinkedHomework["followUp"] })}>{["None","Reminder","Catch-up","Contact home","Intervention"].map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <div className="ttLessonHomeworkNotes"><textarea disabled={readOnly} value={item.followUpNotes || ""} onChange={(event) => patch(item.id, { followUpNotes: event.target.value })} placeholder="Follow-up note, missing work pattern, catch-up arrangement…" /><label><input type="checkbox" disabled={readOnly} checked={Boolean(item.autoMoveWithLesson)} onChange={(event) => patch(item.id, { autoMoveWithLesson: event.target.checked })} /> Move with lesson</label>{!readOnly && <button className="ttButton danger" type="button" onClick={() => remove(item.id)}>Remove</button>}</div>
    </article>)}</div> : <div className="ttLessonHomeworkEmpty">No homework is attached to this lesson yet.</div>}
  </section>;
}
