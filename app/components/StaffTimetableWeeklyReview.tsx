"use client";

import { useMemo, useState } from "react";
import { MediumTermPlan, MediumTermSessionStatus } from "./staffTimetableMediumTerm";
import { LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import "./StaffTimetableWorkloadExtensions.css";

type ReviewLesson = {
  id: string;
  subject: string;
  className: string;
  plan: {
    topic?: string;
    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";
    reflectionNote?: string;
  };
};

type ReviewTask = {
  id: string;
  title: string;
  type: string;
  status: "To do" | "In progress" | "Done";
  date: string;
  period: string;
};

type ReviewPrep = {
  id: string;
  className: string;
  subject: string;
  title: string;
  neededBy: string;
  status: "To prep" | "Requested" | "Ready" | "Done";
  priority: "Normal" | "High";
};

function dateAtNoon(value: string) { return new Date(`${value}T12:00:00`); }
function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function addDays(value: string, days: number) { const date = dateAtNoon(value); date.setDate(date.getDate() + days); return iso(date); }
function mondayOf(value: string) { const date = dateAtNoon(value); const day = date.getDay(); date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day)); return iso(date); }
function pretty(value: string) { const date = dateAtNoon(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }

export default function StaffTimetableWeeklyReview({
  lessons,
  mediumTermPlans,
  tasks,
  prep,
  homework,
  today,
  readOnly,
  onSessionStatus,
  onReflowClass,
  onCarryTasks,
  onOpenLesson,
  onOpenHomework,
  onOpenWorkload,
}: {
  lessons: ReviewLesson[];
  mediumTermPlans: MediumTermPlan[];
  tasks: ReviewTask[];
  prep: ReviewPrep[];
  homework: LessonLinkedHomework[];
  today: string;
  readOnly: boolean;
  onSessionStatus: (planId: string, sessionId: string, status: MediumTermSessionStatus) => void;
  onReflowClass: (className: string) => void;
  onCarryTasks: (taskIds: string[]) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenHomework: () => void;
  onOpenWorkload: () => void;
}) {
  const [message, setMessage] = useState("");
  const monday = mondayOf(today);
  const reviewEnd = today < addDays(monday, 4) ? today : addDays(monday, 4);

  const sessions = useMemo(() => mediumTermPlans.flatMap((plan) => plan.sessions.filter((session) => session.date >= monday && session.date <= reviewEnd).map((session) => ({ plan, session }))).sort((a, b) => a.session.date.localeCompare(b.session.date) || a.session.period - b.session.period), [mediumTermPlans, monday, reviewEnd]);
  const completed = sessions.filter(({ session }) => session.status === "complete");
  const missed = sessions.filter(({ session }) => session.status === "missed");
  const pastStillPlanned = sessions.filter(({ session }) => session.status === "planned" && session.date < today);
  const reviewed = sessions.length - pastStillPlanned.length;

  const reflectionFlags = useMemo(() => lessons.filter((lesson) => ["needs-revisiting", "not-completed"].includes(lesson.plan.reflectionOutcome || "")), [lessons]);
  const carryTasks = useMemo(() => tasks.filter((task) => task.status !== "Done" && task.date && task.date <= today).sort((a, b) => a.date.localeCompare(b.date)), [tasks, today]);
  const overduePrep = useMemo(() => prep.filter((item) => item.status !== "Done" && item.neededBy && item.neededBy < today).sort((a, b) => a.neededBy.localeCompare(b.neededBy)), [prep, today]);
  const overdueHomework = useMemo(() => homework.filter((item) => !["Marked", "Returned"].includes(item.status) && item.dueDate && item.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [homework, today]);
  const classesToReflow = useMemo(() => [...new Set([...missed, ...pastStillPlanned].map(({ plan }) => plan.className))].sort(), [missed, pastStillPlanned]);

  const priorities = useMemo(() => {
    const items: Array<{ level: "urgent" | "watch" | "good"; title: string; detail: string }> = [];
    if (pastStillPlanned.length) items.push({ level: "urgent", title: `${pastStillPlanned.length} lesson${pastStillPlanned.length === 1 ? "" : "s"} need an outcome`, detail: "Mark each as complete or missed so the curriculum sequence stays accurate." });
    if (reflectionFlags.length) items.push({ level: "watch", title: `${reflectionFlags.length} reflection follow-up${reflectionFlags.length === 1 ? "" : "s"}`, detail: "Revisit lessons flagged as incomplete or needing another pass." });
    if (carryTasks.length) items.push({ level: "watch", title: `${carryTasks.length} unfinished teacher task${carryTasks.length === 1 ? "" : "s"}`, detail: "Carry these into next week, then Phase 19 can place them into free periods." });
    if (overduePrep.length) items.push({ level: "urgent", title: `${overduePrep.length} overdue prep item${overduePrep.length === 1 ? "" : "s"}`, detail: "Check practical requirements before the next related lesson." });
    if (overdueHomework.length) items.push({ level: "watch", title: `${overdueHomework.length} overdue homework item${overdueHomework.length === 1 ? "" : "s"}`, detail: "Review marking or follow-up rather than silently moving the original deadline." });
    if (!items.length) items.push({ level: "good", title: "No carry-forward pressure detected", detail: "This week is up to date across lesson outcomes, tasks, prep and homework." });
    return items;
  }, [pastStillPlanned, reflectionFlags, carryTasks, overduePrep, overdueHomework]);

  function carryAll() {
    if (readOnly || !carryTasks.length) return;
    onCarryTasks(carryTasks.map((task) => task.id));
    setMessage(`Carried ${carryTasks.length} unfinished task${carryTasks.length === 1 ? "" : "s"} into next week and returned them to the scheduling queue.`);
  }

  async function copyReview() {
    const lines = [
      `Weekly review · ${pretty(monday)} to ${pretty(reviewEnd)}`,
      `Curriculum sessions: ${sessions.length} · complete ${completed.length} · missed ${missed.length} · awaiting outcome ${pastStillPlanned.length}`,
      `Reflection follow-ups: ${reflectionFlags.length}`,
      `Unfinished teacher tasks: ${carryTasks.length}`,
      `Overdue prep: ${overduePrep.length}`,
      `Overdue homework: ${overdueHomework.length}`,
      "",
      "Next priorities:",
      ...priorities.map((item) => `- ${item.title}: ${item.detail}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setMessage("Weekly review copied to the clipboard.");
    } catch {
      setMessage("The browser could not copy the review automatically.");
    }
  }

  return <section className="ttWeeklyReview">
    <div className="ttExtensionHero review">
      <div><span>PHASE 20 · WEEKLY REVIEW & CARRY-FORWARD</span><h3>Close the week without losing unfinished work</h3><p>Review curriculum outcomes, lesson reflections and teacher workload together. Missed lessons can reflow the sequence; unfinished tasks can return to next week&apos;s Phase 19 scheduling queue.</p></div>
      <div className="ttReviewCompletion"><strong>{sessions.length ? Math.round(reviewed / sessions.length * 100) : 100}%</strong><span>lesson outcomes reviewed</span><small>{pretty(monday)}–{pretty(reviewEnd)}</small></div>
    </div>

    <div className="ttExtensionKpis">
      <div><small>Sessions this week</small><strong>{sessions.length}</strong></div>
      <div className={pastStillPlanned.length ? "warning" : ""}><small>Awaiting outcome</small><strong>{pastStillPlanned.length}</strong></div>
      <div><small>Completed</small><strong>{completed.length}</strong></div>
      <div className={missed.length ? "warning" : ""}><small>Missed</small><strong>{missed.length}</strong></div>
      <div className={carryTasks.length ? "warning" : ""}><small>Tasks to carry</small><strong>{carryTasks.length}</strong></div>
    </div>

    {message && <div className="ttExtensionMessage" role="status">{message}</div>}

    <div className="ttReviewGrid">
      <main>
        <section className="ttReviewPanel">
          <div className="ttExtensionSectionHead"><div><span>LESSON OUTCOMES</span><h4>Confirm what actually happened</h4></div><span>{pastStillPlanned.length ? `${pastStillPlanned.length} action${pastStillPlanned.length === 1 ? "" : "s"}` : "Up to date"}</span></div>
          {sessions.length ? <div className="ttReviewSessionList">{sessions.map(({ plan, session }) => <article key={`${plan.id}-${session.id}`} className={session.status}>
            <button type="button" className="ttReviewSessionMain" onClick={() => onOpenLesson(session.sourceLessonId)}><div><small>{pretty(session.date)} · P{session.period} · {plan.className}</small><strong>{session.topic}</strong><span>{session.unitTitle}{session.subtopicTitle ? ` · ${session.subtopicTitle}` : ""}</span></div><b>{session.status === "complete" ? "Complete" : session.status === "missed" ? "Missed" : session.date < today ? "Needs outcome" : "Planned"}</b></button>
            {session.status === "planned" && session.date < today && !readOnly && <div className="ttReviewSessionActions"><button type="button" onClick={() => onSessionStatus(plan.id, session.id, "complete")}>Mark complete</button><button type="button" className="warn" onClick={() => onSessionStatus(plan.id, session.id, "missed")}>Mark missed & reflow</button></div>}
          </article>)}</div> : <div className="ttExtensionEmpty"><span>No medium-term sessions fall inside this review window.</span></div>}
        </section>

        <section className="ttReviewPanel">
          <div className="ttExtensionSectionHead"><div><span>REFLECTIONS</span><h4>Lessons that need another pass</h4></div><strong>{reflectionFlags.length}</strong></div>
          {reflectionFlags.length ? <div className="ttReflectionReviewList">{reflectionFlags.slice(0, 8).map((lesson) => <button type="button" key={lesson.id} onClick={() => onOpenLesson(lesson.id)}><div><small>{lesson.className} · {lesson.subject}</small><strong>{lesson.plan.topic || "Lesson reflection"}</strong><span>{lesson.plan.reflectionNote || (lesson.plan.reflectionOutcome === "not-completed" ? "Lesson marked not completed." : "Lesson marked as needing revisiting.")}</span></div><b>{lesson.plan.reflectionOutcome === "not-completed" ? "Not completed" : "Revisit"}</b></button>)}</div> : <div className="ttExtensionEmpty compact"><span>No lesson reflections are currently flagged.</span></div>}
        </section>
      </main>

      <aside>
        <section className="ttReviewPanel priorities"><div className="ttExtensionSectionHead"><div><span>NEXT-WEEK PRIORITIES</span><h4>Automatic carry-forward summary</h4></div></div>{priorities.map((item, index) => <div className={`ttPriorityRow ${item.level}`} key={`${item.title}-${index}`}><span>{index + 1}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div></div>)}</section>

        <section className="ttReviewPanel"><div className="ttExtensionSectionHead"><div><span>CURRICULUM FLOW</span><h4>Classes needing sequence attention</h4></div><strong>{classesToReflow.length}</strong></div>{classesToReflow.map((className) => <div className="ttCarryRow" key={className}><div><b>{className}</b><span>Past planned or missed lesson detected</span></div>{!readOnly && <button type="button" onClick={() => onReflowClass(className)}>Reflow from today</button>}</div>)}{!classesToReflow.length && <div className="ttExtensionEmpty compact"><span>No class sequence currently needs reflowing.</span></div>}</section>

        <section className="ttReviewPanel"><div className="ttExtensionSectionHead"><div><span>TEACHER TASKS</span><h4>Carry into next week</h4></div><strong>{carryTasks.length}</strong></div>{carryTasks.slice(0, 6).map((task) => <div className="ttCarryRow" key={task.id}><div><b>{task.title}</b><span>{task.type} · {pretty(task.date)}{task.period ? ` · ${task.period}` : ""}</span></div></div>)}{!carryTasks.length && <div className="ttExtensionEmpty compact"><span>No unfinished dated tasks need carrying.</span></div>}{!readOnly && <button type="button" className="ttButton primary" disabled={!carryTasks.length} onClick={carryAll}>Carry tasks +7 days</button>}</section>

        <section className="ttReviewPanel"><div className="ttExtensionSectionHead"><div><span>DEADLINES</span><h4>Do not silently move these</h4></div></div><button type="button" className="ttReviewLinkRow" onClick={onOpenWorkload}><span>Overdue practical prep</span><strong>{overduePrep.length}</strong></button><button type="button" className="ttReviewLinkRow" onClick={onOpenHomework}><span>Overdue homework</span><strong>{overdueHomework.length}</strong></button><p className="ttReviewNote">Original prep and homework dates are kept intact so the record stays accurate. Use the linked workload tools to decide the follow-up.</p></section>

        <button type="button" className="ttButton ttCopyReview" onClick={copyReview}>Copy weekly review summary</button>
      </aside>
    </div>
  </section>;
}
