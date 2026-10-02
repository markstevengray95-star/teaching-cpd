"use client";

import { useMemo, useState } from "react";
import { LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import "./StaffTimetableWorkloadExtensions.css";

type WeekKey = "W1" | "W2";
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

type SchedulerLesson = {
  id: string;
  week: WeekKey;
  day: DayName;
  period: number;
  start: string;
  end: string;
};

type SchedulerTask = {
  id: string;
  title: string;
  type: "Marking" | "Planning" | "Practical prep" | "Meeting" | "Duty" | "Admin" | "Other";
  status: "To do" | "In progress" | "Done";
  date: string;
  period: string;
  notes: string;
};

type SchedulerPrep = {
  id: string;
  className: string;
  subject: string;
  title: string;
  neededBy: string;
  status: "To prep" | "Requested" | "Ready" | "Done";
  priority: "Normal" | "High";
};

type SchedulerActivity = {
  id: string;
  week: WeekKey;
  day: DayName;
  start: string;
  end: string;
  title: string;
};

type Slot = {
  key: string;
  date: string;
  day: DayName;
  period: number;
  start: string;
  end: string;
};

export type SmartSchedulerAssignment = { taskId: string; date: string; period: number };
export type SmartSchedulerNewTask = Pick<SchedulerTask, "title" | "type" | "date" | "period" | "notes">;

const DAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { period: 1, start: "08:55", end: "09:50" },
  { period: 2, start: "09:55", end: "10:50" },
  { period: 3, start: "11:10", end: "12:05" },
  { period: 4, start: "12:10", end: "13:05" },
  { period: 5, start: "14:05", end: "15:00" },
  { period: 6, start: "15:05", end: "16:00" },
] as const;

function dateAtNoon(value: string) { return new Date(`${value}T12:00:00`); }
function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function addDays(value: string, days: number) { const date = dateAtNoon(value); date.setDate(date.getDate() + days); return iso(date); }
function mondayOf(value: string) { const date = dateAtNoon(value); const day = date.getDay(); date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day)); return iso(date); }
function pretty(value: string) { const date = dateAtNoon(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
function periodNumber(value: string) { const match = value.match(/(?:^|\s)P?([1-6])(?:\b|$)/i); return match ? Number(match[1]) : null; }
function overlaps(startA: string, endA: string, startB: string, endB: string) { return startA < endB && endA > startB; }

export default function StaffTimetableSmartScheduler({
  lessons,
  tasks,
  prep,
  homework,
  activities,
  week,
  today,
  readOnly,
  onScheduleTasks,
  onCreateTask,
  onMarkTaskDone,
}: {
  lessons: SchedulerLesson[];
  tasks: SchedulerTask[];
  prep: SchedulerPrep[];
  homework: LessonLinkedHomework[];
  activities: SchedulerActivity[];
  week: WeekKey;
  today: string;
  readOnly: boolean;
  onScheduleTasks: (assignments: SmartSchedulerAssignment[]) => void;
  onCreateTask: (task: SmartSchedulerNewTask) => void;
  onMarkTaskDone: (taskId: string) => void;
}) {
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const monday = mondayOf(today);

  const slots = useMemo<Slot[]>(() => {
    const result: Slot[] = [];
    DAYS.forEach((day, dayIndex) => {
      const date = addDays(monday, dayIndex);
      if (date < today) return;
      PERIODS.forEach((period) => {
        const teaching = lessons.some((lesson) => lesson.week === week && lesson.day === day && lesson.period === period.period);
        const activity = activities.some((item) => item.week === week && item.day === day && overlaps(period.start, period.end, item.start, item.end));
        const allocated = tasks.some((task) => task.status !== "Done" && task.date === date && periodNumber(task.period) === period.period);
        if (!teaching && !activity && !allocated) result.push({ key: `${date}-p${period.period}`, date, day, ...period });
      });
    });
    return result;
  }, [lessons, tasks, activities, week, monday, today]);

  const queue = useMemo(() => tasks.filter((task) => task.status !== "Done" && !periodNumber(task.period)).slice().sort((a, b) => {
    const aDate = a.date || "9999-12-31";
    const bDate = b.date || "9999-12-31";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    const priority = (value: SchedulerTask["type"]) => value === "Marking" ? 0 : value === "Planning" ? 1 : value === "Practical prep" ? 2 : 3;
    return priority(a.type) - priority(b.type) || a.title.localeCompare(b.title);
  }), [tasks]);

  const unscheduledPrep = useMemo(() => prep.filter((item) => item.status !== "Done" && !tasks.some((task) => task.status !== "Done" && task.notes.includes(`prep:${item.id}`))).sort((a, b) => a.neededBy.localeCompare(b.neededBy)), [prep, tasks]);
  const markingCandidates = useMemo(() => homework.filter((item) => item.status === "Collected" && !tasks.some((task) => task.status !== "Done" && task.notes.includes(`homework:${item.id}`))).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [homework, tasks]);
  const followUpCandidates = useMemo(() => homework.filter((item) => item.status !== "Returned" && item.followUp && item.followUp !== "None" && !tasks.some((task) => task.status !== "Done" && task.notes.includes(`homework-followup:${item.id}`))).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [homework, tasks]);

  function autoSchedule() {
    if (readOnly || !queue.length || !slots.length) return;
    const available = [...slots];
    const assignments: SmartSchedulerAssignment[] = [];
    queue.forEach((task) => {
      const preferred = available.findIndex((slot) => !task.date || slot.date <= task.date);
      const index = preferred >= 0 ? preferred : 0;
      const slot = available[index];
      if (!slot) return;
      assignments.push({ taskId: task.id, date: slot.date, period: slot.period });
      available.splice(index, 1);
    });
    onScheduleTasks(assignments);
    setMessage(assignments.length ? `Scheduled ${assignments.length} task${assignments.length === 1 ? "" : "s"} into free periods.` : "No free periods were available.");
  }

  function scheduleOne(taskId: string) {
    const key = selectedSlots[taskId];
    const slot = slots.find((item) => item.key === key);
    if (!slot || readOnly) return;
    onScheduleTasks([{ taskId, date: slot.date, period: slot.period }]);
    setSelectedSlots((current) => ({ ...current, [taskId]: "" }));
    setMessage("Task scheduled into the selected free period.");
  }

  function createPrepTask(item: SchedulerPrep) {
    if (readOnly) return;
    onCreateTask({ title: `Prepare: ${item.title}`, type: "Practical prep", date: item.neededBy, period: "", notes: `Created from practical prep · prep:${item.id}${item.className ? ` · ${item.className}` : ""}` });
  }

  function createMarkingTask(item: LessonLinkedHomework) {
    if (readOnly) return;
    onCreateTask({ title: `Mark: ${item.title}`, type: "Marking", date: item.dueDate || today, period: "", notes: `Created from homework · homework:${item.id} · ${item.className}` });
  }

  function createFollowUpTask(item: LessonLinkedHomework) {
    if (readOnly) return;
    onCreateTask({ title: `${item.followUp}: ${item.title}`, type: "Admin", date: item.dueDate || today, period: "", notes: `Homework follow-up · homework-followup:${item.id} · ${item.className}${item.followUpNotes ? ` · ${item.followUpNotes}` : ""}` });
  }

  const capacityState = queue.length > slots.length ? "over" : queue.length ? "balanced" : "clear";

  return <section className="ttSmartScheduler">
    <div className="ttExtensionHero">
      <div><span>PHASE 19 · SMART FREE-PERIOD SCHEDULER</span><h3>Turn free periods into a realistic workload plan</h3><p>The scheduler finds teaching-free periods in {week}, avoids activities and already-booked tasks, then places unscheduled work into the remaining capacity.</p></div>
      <div className={`ttCapacityBadge ${capacityState}`}><strong>{slots.length}</strong><span>free slots left</span><small>{queue.length} task{queue.length === 1 ? "" : "s"} waiting</small></div>
    </div>

    <div className="ttExtensionKpis">
      <div><small>Free periods remaining</small><strong>{slots.length}</strong></div>
      <div className={queue.length > slots.length ? "warning" : ""}><small>Unscheduled tasks</small><strong>{queue.length}</strong></div>
      <div><small>Prep not task-linked</small><strong>{unscheduledPrep.length}</strong></div>
      <div><small>Homework to mark</small><strong>{markingCandidates.length}</strong></div>
      <div><small>Follow-ups</small><strong>{followUpCandidates.length}</strong></div>
    </div>

    {message && <div className="ttExtensionMessage" role="status">{message}</div>}

    <div className="ttSchedulerGrid">
      <main className="ttSchedulerQueue">
        <div className="ttExtensionSectionHead"><div><span>WORK QUEUE</span><h4>Unscheduled teacher tasks</h4></div>{!readOnly && <button type="button" className="ttButton primary" disabled={!queue.length || !slots.length} onClick={autoSchedule}>Schedule queue automatically</button>}</div>
        {queue.length ? <div className="ttSchedulerTaskList">{queue.map((task) => <article key={task.id}>
          <div className="ttSchedulerTaskText"><small>{task.type}{task.date ? ` · target ${pretty(task.date)}` : " · no target date"}</small><strong>{task.title}</strong><span>{task.notes || "No notes"}</span></div>
          <div className="ttSchedulerTaskActions noPrint"><select disabled={readOnly || !slots.length} value={selectedSlots[task.id] || ""} onChange={(event) => setSelectedSlots((current) => ({ ...current, [task.id]: event.target.value }))}><option value="">Choose free period…</option>{slots.map((slot) => <option key={slot.key} value={slot.key}>{pretty(slot.date)} · P{slot.period} · {slot.start}</option>)}</select><button type="button" className="ttButton" disabled={readOnly || !selectedSlots[task.id]} onClick={() => scheduleOne(task.id)}>Schedule</button><button type="button" className="ttMiniAction" disabled={readOnly} onClick={() => onMarkTaskDone(task.id)}>Done</button></div>
        </article>)}</div> : <div className="ttExtensionEmpty"><strong>No unscheduled tasks</strong><span>Your teacher-task queue is already allocated or complete.</span></div>}
      </main>

      <aside className="ttSchedulerSlots">
        <div className="ttExtensionSectionHead"><div><span>CAPACITY MAP</span><h4>Available free periods</h4></div></div>
        {slots.length ? <div className="ttSlotGrid">{DAYS.map((day) => { const daySlots = slots.filter((slot) => slot.day === day); if (!daySlots.length) return null; return <section key={day}><header><strong>{day}</strong><span>{daySlots.length} free</span></header>{daySlots.map((slot) => <div key={slot.key}><b>P{slot.period}</b><span>{slot.start}–{slot.end}</span><small>{pretty(slot.date)}</small></div>)}</section>; })}</div> : <div className="ttExtensionEmpty compact"><span>No unallocated free periods remain this week.</span></div>}
      </aside>
    </div>

    <div className="ttWorkloadSources">
      <section><div className="ttExtensionSectionHead"><div><span>PRACTICAL PREP</span><h4>Convert prep into schedulable tasks</h4></div><strong>{unscheduledPrep.length}</strong></div>{unscheduledPrep.slice(0, 5).map((item) => <div className="ttSourceRow" key={item.id}><div><b>{item.title}</b><span>{item.className || item.subject} · needed {pretty(item.neededBy)}</span></div>{!readOnly && <button type="button" onClick={() => createPrepTask(item)}>Add to queue</button>}</div>)}{!unscheduledPrep.length && <div className="ttExtensionEmpty compact"><span>No prep needs converting.</span></div>}</section>
      <section><div className="ttExtensionSectionHead"><div><span>MARKING</span><h4>Collected homework</h4></div><strong>{markingCandidates.length}</strong></div>{markingCandidates.slice(0, 5).map((item) => <div className="ttSourceRow" key={item.id}><div><b>{item.title}</b><span>{item.className} · due {pretty(item.dueDate)}</span></div>{!readOnly && <button type="button" onClick={() => createMarkingTask(item)}>Add marking task</button>}</div>)}{!markingCandidates.length && <div className="ttExtensionEmpty compact"><span>No collected homework awaiting a task.</span></div>}</section>
      <section><div className="ttExtensionSectionHead"><div><span>FOLLOW-UP</span><h4>Homework actions</h4></div><strong>{followUpCandidates.length}</strong></div>{followUpCandidates.slice(0, 5).map((item) => <div className="ttSourceRow" key={item.id}><div><b>{item.followUp}: {item.title}</b><span>{item.className}{item.followUpNotes ? ` · ${item.followUpNotes}` : ""}</span></div>{!readOnly && <button type="button" onClick={() => createFollowUpTask(item)}>Add follow-up</button>}</div>)}{!followUpCandidates.length && <div className="ttExtensionEmpty compact"><span>No homework follow-ups need scheduling.</span></div>}</section>
    </div>
  </section>;
}
