"use client";

import { useMemo, useState } from "react";
import { MediumTermPlan } from "./staffTimetableMediumTerm";
import { CurriculumAssessment } from "./StaffTimetableAssessments";
import { LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import "./StaffTimetableWeeklyPlanning.css";

type WeeklyLesson = {
  id: string;
  week: "W1" | "W2";
  day: string;
  period: number;
  start: string;
  end: string;
  subject: string;
  className: string;
  room: string;
  plan: {
    lessonDate?: string;
    topic?: string;
    objectives?: string;
    sequence?: string;
    assessment?: string;
    homeworkTask?: string;
    generatedResources?: Array<{ id: string; title: string }>;
    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";
  };
};

type WeeklyPrep = {
  id: string;
  className: string;
  subject: string;
  title: string;
  neededBy: string;
  status: "To prep" | "Requested" | "Ready" | "Done";
  priority: "Normal" | "High";
};

type WeeklyTask = {
  id: string;
  title: string;
  type: string;
  status: "To do" | "In progress" | "Done";
  date: string;
  period: string;
};

type PlanningRow = {
  id: string;
  lessonId: string;
  className: string;
  subject: string;
  date: string;
  day: string;
  period: number;
  start: string;
  room: string;
  topic: string;
  readiness: number;
  missing: string[];
  hasResources: boolean;
  hasHomework: boolean;
  needsReflectionFollowUp: boolean;
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function dateAtNoon(value: string) { return new Date(`${value}T12:00:00`); }
function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function addDays(value: string, days: number) { const date = dateAtNoon(value); date.setDate(date.getDate() + days); return iso(date); }
function formatDate(value: string) { const date = dateAtNoon(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
function tidy(value?: string) { return (value || "").trim(); }

export default function StaffTimetableWeeklyPlanning({
  lessons,
  mediumTermPlans,
  assessments,
  homework,
  prep,
  tasks,
  today,
  readOnly,
  onOpenLesson,
  onOpenClass,
  onOpenMediumTerm,
  onOpenHomework,
  onOpenAssessments,
  onAddTask,
}: {
  lessons: WeeklyLesson[];
  mediumTermPlans: MediumTermPlan[];
  assessments: CurriculumAssessment[];
  homework: LessonLinkedHomework[];
  prep: WeeklyPrep[];
  tasks: WeeklyTask[];
  today: string;
  readOnly: boolean;
  onOpenLesson: (lessonId: string) => void;
  onOpenClass: (className: string) => void;
  onOpenMediumTerm: (className: string) => void;
  onOpenHomework: () => void;
  onOpenAssessments: () => void;
  onAddTask: () => void;
}) {
  const [range, setRange] = useState<7 | 14>(7);
  const [classFilter, setClassFilter] = useState("All classes");
  const [onlyNeedsAction, setOnlyNeedsAction] = useState(false);
  const endDate = addDays(today, range - 1);
  const classes = useMemo(() => [...new Set(lessons.map((lesson) => lesson.className).filter(Boolean))].sort(), [lessons]);

  const rows = useMemo<PlanningRow[]>(() => {
    const plannedSessions = mediumTermPlans.flatMap((plan) => plan.sessions.filter((session) => session.date >= today && session.date <= endDate && session.status === "planned").map((session) => ({ className: plan.className, session })));
    const fromMedium = plannedSessions.map(({ className, session }) => {
      const lesson = lessons.find((item) => item.id === session.sourceLessonId);
      if (!lesson) return null;
      const topic = tidy(lesson.plan.topic) || tidy(session.topic);
      const objectives = tidy(lesson.plan.objectives) || tidy(session.objectives);
      const sequence = tidy(lesson.plan.sequence) || tidy(session.sequence);
      const assessment = tidy(lesson.plan.assessment) || tidy(session.assessment);
      const missing = [!topic ? "topic" : "", !objectives ? "objectives" : "", !sequence ? "sequence" : "", !assessment ? "assessment" : ""].filter(Boolean);
      const readiness = Math.round((4 - missing.length) / 4 * 100);
      return {
        id: session.id,
        lessonId: lesson.id,
        className,
        subject: lesson.subject,
        date: session.date,
        day: session.day,
        period: session.period,
        start: session.start,
        room: session.room || lesson.room,
        topic: topic || "Lesson not planned yet",
        readiness,
        missing,
        hasResources: Boolean(lesson.plan.generatedResources?.length),
        hasHomework: Boolean(tidy(lesson.plan.homeworkTask)) || homework.some((item) => item.sourceLessonId === lesson.id),
        needsReflectionFollowUp: ["needs-revisiting", "not-completed"].includes(lesson.plan.reflectionOutcome || ""),
      } satisfies PlanningRow;
    }).filter(Boolean) as PlanningRow[];

    const mediumLessonIds = new Set(fromMedium.map((row) => row.lessonId));
    const dated = lessons.filter((lesson) => !mediumLessonIds.has(lesson.id) && tidy(lesson.plan.lessonDate) && String(lesson.plan.lessonDate) >= today && String(lesson.plan.lessonDate) <= endDate).map((lesson) => {
      const missing = [!tidy(lesson.plan.topic) ? "topic" : "", !tidy(lesson.plan.objectives) ? "objectives" : "", !tidy(lesson.plan.sequence) ? "sequence" : "", !tidy(lesson.plan.assessment) ? "assessment" : ""].filter(Boolean);
      return {
        id: `dated-${lesson.id}`,
        lessonId: lesson.id,
        className: lesson.className,
        subject: lesson.subject,
        date: lesson.plan.lessonDate || "",
        day: lesson.day,
        period: lesson.period,
        start: lesson.start,
        room: lesson.room,
        topic: tidy(lesson.plan.topic) || "Lesson not planned yet",
        readiness: Math.round((4 - missing.length) / 4 * 100),
        missing,
        hasResources: Boolean(lesson.plan.generatedResources?.length),
        hasHomework: Boolean(tidy(lesson.plan.homeworkTask)) || homework.some((item) => item.sourceLessonId === lesson.id),
        needsReflectionFollowUp: ["needs-revisiting", "not-completed"].includes(lesson.plan.reflectionOutcome || ""),
      } satisfies PlanningRow;
    });

    return [...fromMedium, ...dated].sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period || DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  }, [mediumTermPlans, lessons, homework, today, endDate]);

  const visibleRows = rows.filter((row) => (classFilter === "All classes" || row.className === classFilter) && (!onlyNeedsAction || row.readiness < 100 || row.needsReflectionFollowUp));
  const unplanned = rows.filter((row) => row.readiness < 100);
  const fullyReady = rows.filter((row) => row.readiness === 100);
  const resourceReady = rows.filter((row) => row.hasResources);
  const reflectionFlags = rows.filter((row) => row.needsReflectionFollowUp);
  const duePrep = prep.filter((item) => item.status !== "Done" && item.neededBy >= today && item.neededBy <= endDate).sort((a, b) => a.neededBy.localeCompare(b.neededBy));
  const dueTasks = tasks.filter((item) => item.status !== "Done" && item.date >= today && item.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));
  const dueHomework = homework.filter((item) => !["Marked", "Returned"].includes(item.status) && item.dueDate >= today && item.dueDate <= endDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const latestWeakByClass = classes.map((className) => {
    const latest = assessments.filter((item) => item.className === className).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0];
    const weak = latest?.topicResults.filter((topic) => topic.scorePercent !== null && Number(topic.scorePercent) < latest.thresholdPercent).length || 0;
    return { className, weak };
  }).filter((item) => item.weak > 0);

  const grouped = visibleRows.reduce<Record<string, PlanningRow[]>>((acc, row) => { (acc[row.date] ||= []).push(row); return acc; }, {});

  return <section className="ttWeeklyPlanning">
    <div className="ttWeeklyPlanningHero">
      <div><span>PHASE 18 · WEEKLY PLANNING CENTRE</span><h2>Plan the week from one screen</h2><p>See every dated lesson, what is ready, what is missing, and the homework, prep, tasks and assessment follow-up that compete for your time.</p></div>
      <div className="ttWeeklyPlanningControls noPrint">
        <div className="ttWeeklyRange"><button type="button" className={range === 7 ? "active" : ""} onClick={() => setRange(7)}>7 days</button><button type="button" className={range === 14 ? "active" : ""} onClick={() => setRange(14)}>14 days</button></div>
        <label><span>Class</span><select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option>All classes</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="ttWeeklyCheck"><input type="checkbox" checked={onlyNeedsAction} onChange={(event) => setOnlyNeedsAction(event.target.checked)} /><span>Only show lessons needing action</span></label>
      </div>
    </div>

    <div className="ttWeeklyKpis">
      <div><small>Dated lessons</small><strong>{rows.length}</strong><span>{formatDate(today)}–{formatDate(endDate)}</span></div>
      <div className={unplanned.length ? "warning" : "good"}><small>Need planning</small><strong>{unplanned.length}</strong><span>{fullyReady.length} fully ready</span></div>
      <div><small>Resources ready</small><strong>{resourceReady.length}</strong><span>lesson packs attached</span></div>
      <div className={reflectionFlags.length ? "warning" : ""}><small>Reflection follow-up</small><strong>{reflectionFlags.length}</strong><span>revisit / incomplete</span></div>
      <div className={duePrep.length ? "warning" : ""}><small>Prep due</small><strong>{duePrep.length}</strong><span>before end of range</span></div>
    </div>

    {!rows.length ? <div className="ttWeeklyEmpty"><strong>No dated lessons in this range</strong><span>Create or extend medium-term plans to populate the weekly planning centre.</span></div> : <div className="ttWeeklyLayout">
      <main className="ttWeeklyDays">
        {Object.entries(grouped).map(([date, dayRows]) => <section key={date} className="ttWeeklyDay">
          <header><div><small>{formatDate(date)}</small><h3>{dayRows[0]?.day || "School day"}</h3></div><div><strong>{dayRows.length}</strong><span>lesson{dayRows.length === 1 ? "" : "s"}</span></div></header>
          <div className="ttWeeklyLessonList">{dayRows.map((row) => <article key={row.id} className={row.readiness === 100 ? "ready" : row.readiness >= 50 ? "partial" : "notReady"}>
            <button type="button" className="ttWeeklyLessonMain" onClick={() => onOpenLesson(row.lessonId)}>
              <div className="ttWeeklyTime"><b>P{row.period}</b><span>{row.start}</span></div>
              <div className="ttWeeklyLessonText"><small>{row.className} · {row.subject}{row.room ? ` · ${row.room}` : ""}</small><strong>{row.topic}</strong><span>{row.missing.length ? `Missing: ${row.missing.join(", ")}` : "Core lesson plan ready"}</span></div>
              <div className="ttWeeklyReadiness"><strong>{row.readiness}%</strong><span>ready</span></div>
            </button>
            <div className="ttWeeklyBadges"><span className={row.hasResources ? "on" : ""}>{row.hasResources ? "✓" : "○"} Resources</span><span className={row.hasHomework ? "on" : ""}>{row.hasHomework ? "✓" : "○"} Homework</span>{row.needsReflectionFollowUp && <span className="flag">! Reflection follow-up</span>}<button type="button" onClick={() => onOpenClass(row.className)}>Class workspace</button></div>
          </article>)}</div>
        </section>)}
      </main>

      <aside className="ttWeeklySidebar">
        <section><div className="ttWeeklySideHead"><div><span>PREP</span><h3>Due this range</h3></div><strong>{duePrep.length}</strong></div>{duePrep.slice(0, 6).map((item) => <div className="ttWeeklySideItem" key={item.id}><b>{item.title}</b><span>{item.className || item.subject} · {formatDate(item.neededBy)}</span><small>{item.status}{item.priority === "High" ? " · High priority" : ""}</small></div>)}{!duePrep.length && <div className="ttWeeklySideEmpty">No practical prep due.</div>}</section>
        <section><div className="ttWeeklySideHead"><div><span>TASKS</span><h3>Teacher workload</h3></div><strong>{dueTasks.length}</strong></div>{dueTasks.slice(0, 6).map((item) => <div className="ttWeeklySideItem" key={item.id}><b>{item.title}</b><span>{formatDate(item.date)}{item.period ? ` · ${item.period}` : ""}</span><small>{item.type} · {item.status}</small></div>)}{!dueTasks.length && <div className="ttWeeklySideEmpty">No open tasks due.</div>}{!readOnly && <button type="button" className="ttButton" onClick={onAddTask}>+ Add task</button>}</section>
        <section><div className="ttWeeklySideHead"><div><span>HOMEWORK</span><h3>Due / follow-up</h3></div><strong>{dueHomework.length}</strong></div>{dueHomework.slice(0, 6).map((item) => <button type="button" className="ttWeeklySideItem action" key={item.id} onClick={onOpenHomework}><b>{item.title}</b><span>{item.className} · {formatDate(item.dueDate)}</span><small>{item.status}{typeof item.completionPercent === "number" ? ` · ${item.completionPercent}% complete` : ""}</small></button>)}{!dueHomework.length && <div className="ttWeeklySideEmpty">No homework due in range.</div>}</section>
        <section><div className="ttWeeklySideHead"><div><span>ASSESSMENT</span><h3>Weak-topic alerts</h3></div><strong>{latestWeakByClass.reduce((sum, item) => sum + item.weak, 0)}</strong></div>{latestWeakByClass.slice(0, 6).map((item) => <button type="button" className="ttWeeklySideItem action" key={item.className} onClick={onOpenAssessments}><b>{item.className}</b><span>{item.weak} weak curriculum topic{item.weak === 1 ? "" : "s"}</span><small>Open latest assessment evidence</small></button>)}{!latestWeakByClass.length && <div className="ttWeeklySideEmpty">No current weak-topic alerts.</div>}</section>
        <section><div className="ttWeeklySideHead"><div><span>SEQUENCING</span><h3>Medium-term plans</h3></div></div><div className="ttWeeklyPlanLinks">{classes.slice(0, 8).map((className) => <button type="button" key={className} onClick={() => onOpenMediumTerm(className)}><span>{className}</span><b>{mediumTermPlans.some((plan) => plan.className === className) ? "Open plan" : "Build plan"}</b></button>)}</div></section>
      </aside>
    </div>}
  </section>;
}
