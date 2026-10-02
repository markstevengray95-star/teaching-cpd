"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  curriculumStages,
  getCurriculumLessons,
  getCurriculumSubjects,
  getCurriculumUnit,
  getCurriculumUnits,
  inferCurriculumStage,
  normaliseCurriculumSubject,
} from "./staffTimetableCurriculum";
import "./StaffTimetableHub.css";

type WeekKey = "W1" | "W2";
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type WorkspaceTab = "today" | "timetable" | "planning" | "classes" | "homework" | "workload" | "changes" | "tools";

type LessonPlan = {
  lessonDate: string;
  topic: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  resources: string;
  assessment: string;
  teacherNotes: string;
  curriculumStage: string;
  curriculumSubject: string;
  curriculumUnit: string;
  sequencePosition: number;
};

type Lesson = {
  id: string;
  week: WeekKey;
  day: DayName;
  period: number;
  start: string;
  end: string;
  subject: string;
  className: string;
  room: string;
  notes: string;
  plan: LessonPlan;
};

type Homework = {
  id: string;
  className: string;
  subject: string;
  title: string;
  setDate: string;
  dueDate: string;
  status: "To set" | "Set" | "Collected" | "Marked" | "Returned";
  priority: "Normal" | "High";
  notes: string;
};

type PrepItem = {
  id: string;
  className: string;
  subject: string;
  title: string;
  neededBy: string;
  status: "To prep" | "Requested" | "Ready" | "Done";
  priority: "Normal" | "High";
  room: string;
  notes: string;
};

type TeacherTask = {
  id: string;
  title: string;
  type: "Marking" | "Planning" | "Practical prep" | "Meeting" | "Duty" | "Admin" | "Other";
  status: "To do" | "In progress" | "Done";
  date: string;
  period: string;
  notes: string;
};

type TimetableChange = {
  id: string;
  date: string;
  lessonId: string;
  type: "Room change" | "Cover" | "Cancelled" | "Note";
  room: string;
  detail: string;
  notes: string;
};

type Activity = {
  id: string;
  week: WeekKey;
  day: DayName;
  start: string;
  end: string;
  title: string;
  group: string;
  room: string;
};

type KeyDate = {
  id: string;
  date: string;
  title: string;
  type: "Term" | "Holiday" | "Training" | "Deadline" | "Event";
};

type WorkspaceData = {
  lessons: Lesson[];
  homework: Homework[];
  prep: PrepItem[];
  tasks: TeacherTask[];
  changes: TimetableChange[];
  activities: Activity[];
  keyDates: KeyDate[];
  classNotes: Record<string, string>;
  curriculumSequences: Record<string, string[]>;
};

type ImportResult = { lessons: Lesson[]; source: string };
type PdfTextItem = { str?: string; transform?: number[] };
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (input: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (page: number) => Promise<{ getTextContent: () => Promise<{ items: PdfTextItem[] }> }> }> };
};

const DAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { period: 1, start: "08:55", end: "09:50" },
  { period: 2, start: "09:55", end: "10:50" },
  { period: 3, start: "11:10", end: "12:05" },
  { period: 4, start: "12:10", end: "13:05" },
  { period: 5, start: "14:05", end: "15:00" },
  { period: 6, start: "15:05", end: "16:00" },
] as const;
const STORAGE_KEY = "teaching-cpd-personal-staff-timetable-v2";
const OLD_STORAGE_KEY = "teaching-cpd-personal-staff-timetable-v1";

function blankPlan(): LessonPlan {
  return { lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", teacherNotes: "", curriculumStage: "", curriculumSubject: "", curriculumUnit: "", sequencePosition: -1 };
}
function blankWorkspace(): WorkspaceData {
  return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {} };
}
function periodTimes(period: number) {
  const match = PERIODS.find((item) => item.period === period) || PERIODS[0];
  return { start: match.start, end: match.end };
}
function createLesson(input: Omit<Lesson, "id" | "start" | "end" | "plan"> & { id?: string; start?: string; end?: string; plan?: Partial<LessonPlan> }): Lesson {
  const times = periodTimes(input.period);
  return {
    id: input.id || `tt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    week: input.week,
    day: input.day,
    period: input.period,
    start: input.start || times.start,
    end: input.end || times.end,
    subject: input.subject.trim() || "Lesson",
    className: input.className.trim(),
    room: input.room.trim(),
    notes: input.notes.trim(),
    plan: { ...blankPlan(), ...(input.plan || {}) },
  };
}
function clean(value: unknown) { return String(value ?? "").trim(); }
function asWeek(value: unknown): WeekKey { const text = clean(value).toLowerCase(); return text.includes("2") || text === "w2" ? "W2" : "W1"; }
function asDay(value: unknown): DayName | null { const text = clean(value).toLowerCase(); return DAYS.find((day) => text === day.toLowerCase() || text.startsWith(day.slice(0, 3).toLowerCase())) || null; }
function asPeriod(value: unknown, start?: string): number { const match = clean(value).match(/([1-6])/); if (match) return Number(match[1]); return PERIODS.find((period) => period.start === clean(start))?.period || 1; }
function inferSubject(className: string) {
  const lower = className.toLowerCase();
  const subjects = ["physics", "chemistry", "biology", "geography", "mathematics", "maths", "science", "english", "history"];
  const match = subjects.find((subject) => lower.includes(subject));
  if (!match) return "Lesson";
  if (match === "mathematics") return "Maths";
  return match[0].toUpperCase() + match.slice(1);
}
function dedupe(lessons: Lesson[]) {
  const seen = new Set<string>();
  return lessons.filter((lesson) => {
    const key = `${lesson.week}|${lesson.day}|${lesson.period}|${lesson.className}|${lesson.subject}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function formatDate(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function minutes(value: string) { const [h, m] = value.split(":").map(Number); return (h || 0) * 60 + (m || 0); }
function makeId(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function isOpenHomework(item: Homework) { return !["Marked", "Returned"].includes(item.status); }
function subjectTone(subject: string) {
  const key = subject.toLowerCase();
  if (key.includes("physics")) return "tone-blue";
  if (key.includes("biology")) return "tone-green";
  if (key.includes("chemistry")) return "tone-purple";
  if (key.includes("math")) return "tone-amber";
  if (key.includes("geography")) return "tone-teal";
  if (key.includes("english") || key.includes("literature") || key.includes("language")) return "tone-rose";
  if (key.includes("history")) return "tone-slate";
  if (key.includes("science")) return "tone-cyan";
  return "tone-neutral";
}
function normaliseImportedLesson(value: Record<string, unknown>, index: number): Lesson | null {
  const day = asDay(value.day ?? value.Day);
  if (!day) return null;
  const start = clean(value.start ?? value.Start ?? value.time ?? value.Time);
  const period = asPeriod(value.period ?? value.Period ?? value.slot ?? value.Slot, start);
  if (period < 1 || period > 6) return null;
  const className = clean(value.className ?? value.class ?? value.Class ?? value.group ?? value.Group);
  const subject = clean(value.subject ?? value.Subject) || inferSubject(className);
  if (!className && !subject) return null;
  const times = periodTimes(period);
  return createLesson({ id: `import_${Date.now()}_${index}`, week: asWeek(value.week ?? value.Week), day, period, start: start || times.start, end: clean(value.end ?? value.End) || times.end, subject: subject || "Lesson", className, room: clean(value.room ?? value.Room ?? value.location ?? value.Location), notes: clean(value.notes ?? value.Notes) });
}
function parseJson(text: string): Lesson[] {
  const parsed: unknown = JSON.parse(text);
  const candidate = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && Array.isArray((parsed as { lessons?: unknown[] }).lessons) ? (parsed as { lessons: unknown[] }).lessons : [];
  return dedupe(candidate.map((item, index) => item && typeof item === "object" ? normaliseImportedLesson(item as Record<string, unknown>, index) : null).filter((item): item is Lesson => Boolean(item)));
}
function splitDelimitedLine(line: string, delimiter: string) {
  const out: string[] = []; let current = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { out.push(current.trim()); current = ""; continue; }
    current += char;
  }
  out.push(current.trim()); return out;
}
function parseDelimited(text: string, delimiter: string): Lesson[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  const alias = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const positions = { week: alias(["week", "cycleweek", "cycle"]), day: alias(["day", "weekday"]), period: alias(["period", "lesson", "slot"]), start: alias(["start", "starttime", "time"]), end: alias(["end", "endtime"]), subject: alias(["subject", "lessonname"]), className: alias(["class", "classname", "group", "classgroup", "set"]), room: alias(["room", "location", "classroom"]), notes: alias(["notes", "note"]) };
  if (positions.day < 0 || (positions.subject < 0 && positions.className < 0)) return [];
  return dedupe(lines.slice(1).map((line, index) => {
    const row = splitDelimitedLine(line, delimiter); const value = (position: number) => position >= 0 ? row[position] : "";
    return normaliseImportedLesson({ week: value(positions.week), day: value(positions.day), period: value(positions.period), start: value(positions.start), end: value(positions.end), subject: value(positions.subject), className: value(positions.className), room: value(positions.room), notes: value(positions.notes) }, index);
  }).filter((item): item is Lesson => Boolean(item)));
}
function parsePlainText(text: string): Lesson[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); const lessons: Lesson[] = [];
  let week: WeekKey = "W1"; let day: DayName | null = null; let period = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/week\s*2|\[w2\]/i.test(line)) { week = "W2"; continue; }
    if (/week\s*1|\[w1\]/i.test(line)) { week = "W1"; continue; }
    const nextDay = asDay(line); if (nextDay && DAYS.some((candidate) => candidate.toLowerCase() === line.toLowerCase())) { day = nextDay; continue; }
    const periodMatch = line.match(/^P\s*([1-6])$/i); if (periodMatch) { period = Number(periodMatch[1]); continue; }
    const timeMatch = line.match(/^(08:55|09:55|11:10|12:10|14:05|15:05)/); if (timeMatch) { period = asPeriod("", timeMatch[1]); continue; }
    if (!day || !period || /^off\s*site$/i.test(line)) continue;
    if (/^Y\d|^Year\s*\d|^CCF|^Form|^Tutor/i.test(line)) {
      const className = line; let subject = inferSubject(className); let room = "";
      const next = lines[i + 1] || "";
      if (next && !asDay(next) && !/^P\s*[1-6]$/i.test(next) && !/^\d{2}:\d{2}/.test(next)) { subject = next; i += 1; }
      const possibleRoom = lines[i + 1] || "";
      if (possibleRoom && !asDay(possibleRoom) && !/^P\s*[1-6]$/i.test(possibleRoom) && !/^\d{2}:\d{2}/.test(possibleRoom) && !/week\s*[12]/i.test(possibleRoom)) { room = possibleRoom; i += 1; }
      lessons.push(createLesson({ week, day, period, subject, className, room, notes: "Imported timetable" }));
    }
  }
  return dedupe(lessons);
}
function getPdfJsFromWindow() { return (window as unknown as { pdfjsLib?: PdfJs }).pdfjsLib; }
function loadPdfJs(): Promise<PdfJs> {
  return new Promise((resolve, reject) => {
    const existing = getPdfJsFromWindow(); if (existing) { resolve(existing); return; }
    const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; script.async = true;
    script.onload = () => { const lib = getPdfJsFromWindow(); if (!lib) { reject(new Error("The PDF reader could not start.")); return; } lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(lib); };
    script.onerror = () => reject(new Error("The PDF reader could not load. Try CSV, text or JSON instead.")); document.head.appendChild(script);
  });
}
async function parsePdf(file: File): Promise<Lesson[]> {
  const lib = await loadPdfJs(); const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise; const lessons: Lesson[] = [];
  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 4); pageNo += 1) {
    const page = await pdf.getPage(pageNo); const content = await page.getTextContent();
    const items = content.items.map((item) => ({ text: clean(item.str), x: Number(item.transform?.[4] || 0), y: Number(item.transform?.[5] || 0) })).filter((item) => item.text);
    const joined = items.map((item) => item.text).join(" ");
    const weekMatch = joined.match(/Week\s*([12])\s*\[W[12]\]/i) || joined.match(/\bWeek\s*([12])\b/i);
    const week: WeekKey | null = weekMatch ? (weekMatch[1] === "2" ? "W2" : "W1") : (pdf.numPages === 2 ? (pageNo === 2 ? "W2" : "W1") : null);
    if (!week) continue;
    const dayXs = new Map<DayName, number>(); DAYS.forEach((dayName) => { const found = items.find((item) => item.text.toLowerCase() === dayName.toLowerCase()); if (found) dayXs.set(dayName, found.x); }); if (dayXs.size < 4) continue;
    const periodYs = new Map<number, number>(); PERIODS.forEach(({ period, start }) => { const label = items.find((item) => item.text.replace(/\s/g, "").toUpperCase() === `P${period}`); const time = items.find((item) => item.text.startsWith(start)); if (label || time) periodYs.set(period, (label || time)!.y); }); if (periodYs.size < 4) continue;
    const cells = new Map<string, { text: string; x: number; y: number }[]>(); const excluded = new Set<string>([...DAYS, ...PERIODS.flatMap((period) => [`P${period.period}`, period.start, period.end])]);
    items.forEach((item) => {
      if (excluded.has(item.text) || /week\s/i.test(item.text) || /timetable|printed by|isams|eprep/i.test(item.text)) return;
      const nearestDay = [...dayXs.entries()].sort((a, b) => Math.abs(item.x - a[1]) - Math.abs(item.x - b[1]))[0]; if (!nearestDay || Math.abs(item.x - nearestDay[1]) > 105) return;
      const nearestPeriod = [...periodYs.entries()].sort((a, b) => Math.abs(item.y - a[1]) - Math.abs(item.y - b[1]))[0]; if (!nearestPeriod || Math.abs(item.y - nearestPeriod[1]) > 46) return;
      const key = `${nearestDay[0]}|${nearestPeriod[0]}`; cells.set(key, [...(cells.get(key) || []), item]);
    });
    cells.forEach((cellItems, key) => {
      const [dayText, periodText] = key.split("|"); const dayName = asDay(dayText); const period = Number(periodText); if (!dayName || !period) return;
      const values = [...new Set(cellItems.sort((a, b) => b.y - a.y || a.x - b.x).map((item) => item.text).filter(Boolean))].filter((value) => !/^off\s*site$/i.test(value)); if (!values.length) return;
      const classIndex = values.findIndex((value) => /^Y\d|^Year\s*\d|^CCF|^Form|^Tutor/i.test(value)); if (classIndex < 0) return;
      const className = values[classIndex]; const afterClass = values.slice(classIndex + 1); const subject = afterClass[0] || inferSubject(className); const room = afterClass.slice(1).join(" ");
      lessons.push(createLesson({ week, day: dayName, period, subject, className, room, notes: "Imported timetable" }));
    });
  }
  return dedupe(lessons);
}

const DEMO_DATA: Array<[WeekKey, DayName, number, string, string, string]> = [
  ["W1","Wednesday",1,"Science","Y11 Science C","Physics Lab"],["W1","Thursday",1,"Biology","Y10 Biology","Physics Lab"],["W1","Friday",1,"Maths","Y10 Mathematics G","Physics Lab"],["W1","Monday",2,"Science","Y9 Science J","Physics Lab"],["W1","Tuesday",2,"Science","Y11 Science C","Physics Lab"],["W1","Wednesday",2,"Physics","Y11 Physics A","Physics Lab"],["W1","Thursday",2,"Physics","Y10 Physics","Physics Lab"],["W1","Friday",2,"Geography","Y7 Geography","Geography Room"],["W1","Monday",3,"Biology","Y10 Biology","Physics Lab"],["W1","Tuesday",3,"Science","Y11 Science D","Science Lab"],["W1","Wednesday",3,"Physics","Y11 Physics A","Physics Lab"],["W1","Thursday",3,"Physics","Y10 Physics","Physics Lab"],["W1","Monday",4,"Biology","Y10 Biology","Physics Lab"],["W1","Tuesday",4,"Physics","Y13 Physics","Physics Lab"],["W1","Wednesday",4,"Physics","Y12 Physics","Physics Lab"],["W1","Friday",4,"Physics","Y10 Physics","Physics Lab"],["W1","Monday",5,"Science","Y11 Science C","Physics Lab"],["W1","Tuesday",5,"Physics","Y13 Physics","Physics Lab"],["W1","Wednesday",5,"Physics","Y12 Physics","Physics Lab"],["W1","Monday",6,"Science","Y11 Science D","Science Lab"],["W1","Tuesday",6,"Physics","Y13 Physics","Physics Lab"],["W1","Wednesday",6,"Physics","Y12 Physics","Physics Lab"],
  ["W2","Monday",1,"Physics","Y13 Physics","Physics Lab"],["W2","Tuesday",1,"Science","Y11 Science C","Physics Lab"],["W2","Wednesday",1,"Physics","Y11 Physics A","Physics Lab"],["W2","Friday",1,"Maths","Y10 Mathematics G","Physics Lab"],["W2","Monday",2,"Physics","Y13 Physics","Physics Lab"],["W2","Tuesday",2,"Science","Y11 Science D","Science Lab"],["W2","Wednesday",2,"Physics","Y11 Physics A","Physics Lab"],["W2","Friday",2,"Science","Y7 Science","Physics Lab"],["W2","Monday",3,"Physics","Y10 Physics","Physics Lab"],["W2","Tuesday",3,"Science","Y11 Science D","Science Lab"],["W2","Wednesday",3,"Science","Y11 Science D","Science Lab"],["W2","Friday",3,"Science","Y9 Science J","Physics Lab"],["W2","Monday",4,"Science","Y11 Science C","Physics Lab"],["W2","Tuesday",4,"Physics","Y11 Physics A","Physics Lab"],["W2","Wednesday",4,"Physics","Y12 Physics","Physics Lab"],["W2","Friday",4,"Physics","Y10 Physics","Physics Lab"],["W2","Monday",5,"Biology","Y10 Biology","Physics Lab"],["W2","Tuesday",5,"Physics","Y13 Physics","Physics Lab"],["W2","Wednesday",5,"Physics","Y12 Physics","Physics Lab"],["W2","Friday",5,"Maths","Y10 Mathematics G","Physics Lab"],["W2","Monday",6,"Biology","Y10 Biology","Physics Lab"],["W2","Tuesday",6,"Physics","Y13 Physics","Physics Lab"],["W2","Wednesday",6,"Physics","Y12 Physics","Physics Lab"],["W2","Friday",6,"Maths","Y10 Mathematics G","Physics Lab"]
];
const DEMO_WORKSPACE: WorkspaceData = (() => {
  const base = blankWorkspace();
  base.lessons = DEMO_DATA.map(([week, day, period, subject, className, room], index) => createLesson({ id: `demo_${index + 1}`, week, day, period, subject, className, room, notes: "", plan: index === 22 ? { topic: "Nuclear instability", objectives: "Explain how neutron-proton balance affects nuclear stability.", vocabulary: "isotope, neutron, proton, stability, decay", sequence: "Retrieval starter → N-Z diagram modelling → worked examples → exam question → exit ticket", assessment: "Hinge question and 4-mark exam question", curriculumStage: "A level", curriculumSubject: "Physics", curriculumUnit: "Nuclear physics", lessonDate: "", resources: "N-Z diagram and exam questions", teacherNotes: "Check beta-plus vs beta-minus misconceptions", sequencePosition: 0 } : undefined }));
  base.homework = [{ id: "demo_hw", className: "Y13 Physics", subject: "Physics", title: "Complete nuclear decay exam questions", setDate: todayIso(), dueDate: todayIso(), status: "Collected", priority: "Normal", notes: "Use the mark scheme for self-correction after marking." }];
  base.prep = [{ id: "demo_prep", className: "Y12 Physics", subject: "Physics", title: "Set up practical equipment", neededBy: todayIso(), status: "To prep", priority: "High", room: "Physics Lab", notes: "Check equipment before the lesson." }];
  base.tasks = [{ id: "demo_task", title: "Mark Y13 nuclear homework", type: "Marking", status: "To do", date: todayIso(), period: "P1", notes: "" }];
  base.activities = [{ id: "demo_act", week: "W1", day: "Monday", start: "16:30", end: "17:30", title: "STEM Robotics", group: "Activity group", room: "Science Lab" }];
  base.curriculumSequences["Y13 Physics"] = ["Nuclear instability", "Radioactive decay", "Half-life calculations", "Nuclear radius", "Binding energy", "Fission and chain reactions"];
  return base;
})();

export default function StaffTimetableHub() {
  const [week, setWeek] = useState<WeekKey>("W1");
  const [tab, setTab] = useState<WorkspaceTab>("today");
  const [workspace, setWorkspace] = useState<WorkspaceData>(blankWorkspace());
  const [demo, setDemo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [status, setStatus] = useState("No timetable loaded yet.");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ week: "W1" as WeekKey, day: "Monday" as DayName, period: 1, subject: "", className: "", room: "", notes: "" });
  const [planLessonId, setPlanLessonId] = useState<string | null>(null);
  const [classSelection, setClassSelection] = useState("");
  const [search, setSearch] = useState("");
  const [itemEditor, setItemEditor] = useState<null | { kind: "homework" | "prep" | "task" | "change" | "activity" | "keyDate"; id?: string }>(null);
  const [curriculumText, setCurriculumText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { workspace?: Partial<WorkspaceData>; week?: WeekKey };
        if (parsed.workspace) setWorkspace({ ...blankWorkspace(), ...parsed.workspace, lessons: (parsed.workspace.lessons || []).map((lesson) => createLesson({ ...lesson, plan: lesson.plan || blankPlan() })) });
        if (parsed.week === "W1" || parsed.week === "W2") setWeek(parsed.week);
      } else {
        const oldRaw = window.localStorage.getItem(OLD_STORAGE_KEY);
        if (oldRaw) {
          const old = JSON.parse(oldRaw) as { lessons?: Lesson[]; week?: WeekKey };
          setWorkspace((current) => ({ ...current, lessons: (old.lessons || []).map((lesson) => createLesson({ ...lesson, plan: lesson.plan || blankPlan() })) }));
          if (old.week === "W1" || old.week === "W2") setWeek(old.week);
        }
      }
    } catch (error) { console.warn("Could not restore staff timetable", error); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => {
    if (!loaded || demo) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ workspace, week }));
  }, [workspace, week, loaded, demo]);

  const active = demo ? DEMO_WORKSPACE : workspace;
  const weekLessons = useMemo(() => active.lessons.filter((lesson) => lesson.week === week), [active.lessons, week]);
  const classes = useMemo(() => [...new Set(active.lessons.map((lesson) => lesson.className).filter(Boolean))].sort(), [active.lessons]);
  const subjects = useMemo(() => [...new Set(active.lessons.map((lesson) => lesson.subject).filter(Boolean))].sort(), [active.lessons]);
  const teachingHours = (weekLessons.length * 55 / 60).toFixed(1).replace(".0", "");
  const freePeriods = 30 - weekLessons.length;
  const visibleClass = classSelection || classes[0] || "";
  const today = todayIso();
  const openHomework = active.homework.filter(isOpenHomework);
  const overdueHomework = openHomework.filter((item) => item.dueDate && item.dueDate < today);
  const markingQueue = active.homework.filter((item) => item.status === "Collected");
  const openPrep = active.prep.filter((item) => item.status !== "Done");
  const overduePrep = openPrep.filter((item) => item.neededBy && item.neededBy < today);
  const openTasks = active.tasks.filter((item) => item.status !== "Done");

  function mutate(updater: (current: WorkspaceData) => WorkspaceData) { if (!demo) setWorkspace(updater); }
  function lessonFor(day: DayName, period: number) { return weekLessons.find((lesson) => lesson.day === day && lesson.period === period); }
  function changeForLesson(lessonId: string) { return active.changes.filter((item) => item.lessonId === lessonId && (!item.date || item.date >= today)).sort((a, b) => a.date.localeCompare(b.date))[0]; }
  function openEditor(day: DayName, period: number) {
    if (demo) return;
    const existing = lessonFor(day, period); setEditingId(existing?.id || null);
    setForm({ week, day, period, subject: existing?.subject || "", className: existing?.className || "", room: existing?.room || "", notes: existing?.notes || "" }); setEditorOpen(true);
  }
  function saveLesson() {
    if (!form.subject.trim() && !form.className.trim()) return;
    const existing = workspace.lessons.find((lesson) => lesson.id === editingId);
    const next = createLesson({ ...form, id: editingId || undefined, plan: existing?.plan || blankPlan() });
    mutate((current) => ({ ...current, lessons: [...current.lessons.filter((lesson) => lesson.id !== editingId && !(lesson.week === next.week && lesson.day === next.day && lesson.period === next.period)), next] }));
    setEditorOpen(false); setStatus("Timetable saved on this device.");
  }
  function deleteLesson() { if (!editingId) return; mutate((current) => ({ ...current, lessons: current.lessons.filter((lesson) => lesson.id !== editingId) })); setEditorOpen(false); }
  async function readTimetableFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setPendingImport(null); setStatus(`Reading ${file.name}…`);
    try {
      const lower = file.name.toLowerCase(); let imported: Lesson[] = [];
      if (file.type === "application/pdf" || lower.endsWith(".pdf")) imported = await parsePdf(file);
      else { const text = await file.text(); if (lower.endsWith(".json")) imported = parseJson(text); else if (lower.endsWith(".csv")) imported = parseDelimited(text, ","); else if (lower.endsWith(".tsv")) imported = parseDelimited(text, "\t"); else imported = parsePlainText(text); }
      if (!imported.length) { setStatus("I couldn't detect timetable lessons in that file. Try an iSAMS PDF, CSV with Day/Class/Subject columns, JSON, TSV or plain timetable text."); return; }
      setPendingImport({ lessons: imported, source: file.name }); setStatus(`Detected ${imported.length} lessons. Review the preview, then choose Auto-fill timetable.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "The timetable could not be read."); }
    finally { event.target.value = ""; }
  }
  function applyImport() {
    if (!pendingImport) return; const imported = pendingImport.lessons; setDemo(false);
    setWorkspace((current) => ({ ...current, lessons: importMode === "replace" ? imported : dedupe([...current.lessons, ...imported]) }));
    setPendingImport(null); setStatus(`Auto-filled ${imported.length} lessons from ${pendingImport.source}. You can click any lesson to correct it.`); setTab("timetable");
  }
  function clearTimetable() { if (demo) { setDemo(false); return; } if (!window.confirm("Clear your saved timetable and linked teacher-workspace data on this device?")) return; setWorkspace(blankWorkspace()); setPendingImport(null); setStatus("Blank workspace ready for an upload or manual entry."); }
  function printTimetable() { setTab("timetable"); window.setTimeout(() => window.print(), 50); }
  function nextFreeSlot() {
    for (const day of DAYS) for (const period of PERIODS) if (!active.lessons.some((lesson) => lesson.week === week && lesson.day === day && lesson.period === period.period)) return `${week} · ${day} · P${period.period}`;
    return "No free period this week";
  }
  function todayLessons() {
    const jsDay = new Date().getDay(); const day = DAYS[jsDay - 1]; if (!day) return [];
    return active.lessons.filter((lesson) => lesson.week === week && lesson.day === day).sort((a, b) => a.period - b.period);
  }
  function currentOrNext() {
    const items = todayLessons(); const now = new Date(); const nowMins = now.getHours() * 60 + now.getMinutes();
    const current = items.find((lesson) => nowMins >= minutes(lesson.start) && nowMins < minutes(lesson.end)); if (current) return { label: "Now", lesson: current };
    const next = items.find((lesson) => minutes(lesson.start) > nowMins); return next ? { label: "Next", lesson: next } : null;
  }
  function savePlan(nextPlan: LessonPlan) {
    if (!planLessonId) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === planLessonId ? { ...lesson, plan: nextPlan } : lesson) }));
    setPlanLessonId(null);
  }
  function saveCurriculumSequence() {
    if (!visibleClass || demo) return;
    const sequence = curriculumText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    mutate((current) => ({ ...current, curriculumSequences: { ...current.curriculumSequences, [visibleClass]: sequence } }));
  }
  function autoPopulateSequence() {
    if (!visibleClass || demo) return;
    const sequence = (active.curriculumSequences[visibleClass] || []).filter(Boolean); if (!sequence.length) return;
    const targets = workspace.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => {
      const index = targets.findIndex((target) => target.id === lesson.id); if (index < 0 || index >= sequence.length || lesson.plan.topic) return lesson;
      return { ...lesson, plan: { ...lesson.plan, topic: sequence[index], sequencePosition: index } };
    }) }));
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ version: 2, week, workspace }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `staff-timetable-backup-${today}.json`; a.click(); URL.revokeObjectURL(url);
  }
  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as { workspace?: WorkspaceData; week?: WeekKey }; if (!parsed.workspace) throw new Error("This is not a timetable workspace backup."); setDemo(false); setWorkspace({ ...blankWorkspace(), ...parsed.workspace }); if (parsed.week) setWeek(parsed.week); setStatus("Workspace backup restored."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Backup could not be restored."); }
    finally { event.target.value = ""; }
  }

  const activePlanLesson = active.lessons.find((lesson) => lesson.id === planLessonId) || null;
  const selectedClassLessons = active.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
  const nextKeyDate = active.keyDates.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nowCard = currentOrNext();
  const filteredPlanning = active.lessons.filter((lesson) => !search || [lesson.subject, lesson.className, lesson.plan.topic, lesson.plan.curriculumUnit].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="staffTimetablePage">
      <section className="staffTimetableHero">
        <div><div className="staffTimetableEyebrow">STAFF · PERSONAL WORKSPACE</div><h1>My timetable & planner</h1><p>Your timetable, lesson planning, class notes, homework, marking, practical prep and weekly workload in one place. The normal workspace starts blank and contains no preloaded staff names.</p></div>
        <div className="staffTimetableHeroActions noPrint"><button className={demo ? "ttButton demo active" : "ttButton demo"} onClick={() => { setDemo((value) => !value); setPendingImport(null); }}>{demo ? "Exit demo" : "View demo"}</button><button className="ttButton" onClick={printTimetable}>Print timetable</button><Link className="ttButton" href="/school">School tools</Link></div>
      </section>

      {demo && <div className="ttDemoBanner"><strong>Demo mode</strong><span>A read-only example based on the original timetable, including example planning and workload data. Your own saved workspace has not changed.</span></div>}

      <nav className="ttWorkspaceNav noPrint" aria-label="Timetable workspace">
        {(["today","timetable","planning","classes","homework","workload","changes","tools"] as WorkspaceTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({today:"Today",timetable:"Timetable",planning:"Lesson planning",classes:"Classes",homework:"Homework",workload:"Prep & tasks",changes:"Changes",tools:"Tools"} as Record<WorkspaceTab,string>)[item]}</button>)}
      </nav>

      {tab === "today" && <section className="ttDashboardShell">
        <div className="ttDashboardHero">
          <div><span className="staffTimetableEyebrow">MORNING BRIEFING</span><h2>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2><p>Week {week === "W1" ? "1" : "2"} · {todayLessons().length} lessons today</p></div>
          <div className="ttDashboardHeroActions noPrint"><button className="ttButton primary" onClick={() => setTab("planning")}>Plan a lesson</button><button className="ttButton" onClick={() => setItemEditor({ kind: "task" })}>+ Task</button><button className="ttButton" onClick={() => setTab("timetable")}>Open timetable</button></div>
        </div>
        <div className="ttKpiGrid">
          <div><small>Open homework</small><strong>{openHomework.length}</strong><span>{overdueHomework.length ? `${overdueHomework.length} overdue` : "Up to date"}</span></div>
          <div><small>Waiting to mark</small><strong>{markingQueue.length}</strong><span>Collected work</span></div>
          <div><small>Practical prep</small><strong>{openPrep.length}</strong><span>{overduePrep.length ? `${overduePrep.length} overdue` : "Open items"}</span></div>
          <div><small>Teacher tasks</small><strong>{openTasks.length}</strong><span>{nextFreeSlot()}</span></div>
        </div>
        <div className="ttDashboardGrid">
          <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Live lesson status</h2></div></div>{nowCard ? <div className="ttLiveCard"><span>{nowCard.label}</span><h3>{nowCard.lesson.subject} · {nowCard.lesson.className}</h3><p>P{nowCard.lesson.period} · {nowCard.lesson.start}–{nowCard.lesson.end} · {nowCard.lesson.room || "Room not set"}</p>{nowCard.lesson.plan.topic && <b>Planned topic: {nowCard.lesson.plan.topic}</b>}</div> : <div className="ttEmptyPreview"><strong>No more lessons today</strong><span>Use a free period for planning, marking or prep.</span></div>}</article>
          <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Today&apos;s agenda</h2></div></div><div className="ttStackList">{todayLessons().length ? todayLessons().map((lesson) => <button className="ttAgendaRow" key={lesson.id} onClick={() => { setPlanLessonId(lesson.id); setTab("planning"); }}><b>P{lesson.period} · {lesson.subject}</b><span>{lesson.className} · {lesson.room || "Room not set"}</span><small>{lesson.plan.topic || "No lesson topic planned yet"}</small></button>) : <div className="ttEmptyPreview"><span>No teaching lessons scheduled today.</span></div>}</div></article>
          <article className="ttPanel widePanel"><div className="ttPanelHeader"><div><h2>Week overview</h2></div></div><div className="ttWeekOverview">{DAYS.map((day) => { const count = weekLessons.filter((lesson) => lesson.day === day).length; return <div key={day}><b>{day.slice(0,3)}</b><strong>{count}</strong><span>{6-count} free</span><i style={{ width: `${Math.round(count/6*100)}%` }} /></div>; })}</div></article>
          <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Marking workload</h2></div><button className="ttMiniLink" onClick={() => setTab("homework")}>Open</button></div><div className="ttStackList">{markingQueue.slice(0,6).map((item) => <div className="ttListRow" key={item.id}><b>{item.title}</b><span>{item.className} · due {formatDate(item.dueDate)}</span></div>)}{!markingQueue.length && <div className="ttEmptyPreview"><span>No collected homework waiting to mark.</span></div>}</div></article>
          <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Upcoming</h2></div></div><div className="ttStackList">{nextKeyDate && <div className="ttListRow"><b>{nextKeyDate.title}</b><span>{nextKeyDate.type} · {formatDate(nextKeyDate.date)}</span></div>}{openPrep.slice(0,3).map((item) => <div className="ttListRow" key={item.id}><b>{item.title}</b><span>{item.className} · needed {formatDate(item.neededBy)}</span></div>)}{!nextKeyDate && !openPrep.length && <div className="ttEmptyPreview"><span>No upcoming dates or prep items.</span></div>}</div></article>
        </div>
      </section>}

      {tab === "timetable" && <>
        <section className="ttSetupGrid noPrint">
          <article className="ttPanel ttImportPanel"><div className="ttPanelHeader"><div><span className="ttStep">1</span><h2>Upload timetable</h2></div><span className="ttPrivacy">Processed in your browser</span></div><p>Best with an iSAMS timetable PDF. CSV, TSV, JSON and timetable text are also supported.</p><input ref={fileRef} className="ttFileInput" type="file" accept=".pdf,.csv,.tsv,.txt,.json,text/plain,application/pdf,text/csv,application/json" onChange={readTimetableFile} /><button className="ttUploadZone" onClick={() => fileRef.current?.click()}><span className="ttUploadIcon">⇧</span><strong>Choose timetable file</strong><small>PDF · CSV · TSV · TXT · JSON</small></button><div className="ttImportStatus" aria-live="polite">{status}</div></article>
          <article className="ttPanel"><div className="ttPanelHeader"><div><span className="ttStep">2</span><h2>Review & auto-fill</h2></div></div>{!pendingImport ? <div className="ttEmptyPreview"><strong>No import waiting</strong><span>Upload a timetable to preview detected lessons.</span></div> : <><div className="ttImportControls"><label><span>Import behaviour</span><select value={importMode} onChange={(event) => setImportMode(event.target.value as "replace" | "merge")}><option value="replace">Replace my timetable</option><option value="merge">Merge with existing lessons</option></select></label><button className="ttButton primary" onClick={applyImport}>Auto-fill timetable</button></div><div className="ttPreviewList">{pendingImport.lessons.slice(0, 12).map((lesson) => <div key={lesson.id}><b>{lesson.week} · {lesson.day.slice(0,3)} · P{lesson.period}</b><span>{lesson.subject} · {lesson.className}{lesson.room ? ` · ${lesson.room}` : ""}</span></div>)}{pendingImport.lessons.length > 12 && <small>+ {pendingImport.lessons.length - 12} more detected lessons</small>}</div></>}</article>
        </section>
        <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">TWO-WEEK VIEW</span><h2>{demo ? "Demo timetable" : active.lessons.length ? "Your timetable" : "Blank timetable"}</h2></div><div className="ttWorkspaceActions noPrint"><div className="ttWeekSwitch"><button className={week === "W1" ? "active" : ""} onClick={() => setWeek("W1")}>Week 1</button><button className={week === "W2" ? "active" : ""} onClick={() => setWeek("W2")}>Week 2</button></div>{!demo && <button className="ttButton" onClick={() => openEditor("Monday", 1)}>+ Add lesson</button>}<button className="ttButton danger" onClick={clearTimetable}>{demo ? "Return to personal" : "Clear workspace"}</button></div></div>
          <div className="ttStats"><div><small>Lessons</small><strong>{weekLessons.length}</strong></div><div><small>Teaching time</small><strong>{teachingHours}h</strong></div><div><small>Free periods</small><strong>{freePeriods}</strong></div><div><small>Subjects</small><strong>{new Set(weekLessons.map((lesson) => lesson.subject)).size}</strong></div></div>
          {!active.lessons.length && <div className="ttBlankState"><span>▦</span><h3>Your timetable is empty</h3><p>Upload a timetable above for automatic filling, or click a free period to add a lesson manually.</p></div>}
          <div className="ttGridWrap"><div className="ttGrid"><div className="ttGridHead timeHead">Time</div>{DAYS.map((day) => <div className="ttGridHead" key={day}>{day}</div>)}{PERIODS.map((period, index) => <div className="ttGridRowContents" key={period.period}><div className="ttTimeCell"><strong>P{period.period}</strong><span>{period.start}</span><small>{period.end}</small></div>{DAYS.map((day) => { const lesson = lessonFor(day, period.period); const change = lesson ? changeForLesson(lesson.id) : undefined; return <button type="button" className={lesson ? `ttLessonCell ${subjectTone(lesson.subject)} ${change?.type === "Cancelled" ? "cancelled" : ""}` : "ttLessonCell free"} key={`${day}-${period.period}`} onClick={() => openEditor(day, period.period)} disabled={demo}>{lesson ? <><b>{lesson.subject}</b><span>{lesson.className || "Class"}</span><small>{change?.room || lesson.room || "Room not set"}</small>{lesson.plan.topic && <em>{lesson.plan.topic}</em>}{change && <i>{change.type}{change.detail ? ` · ${change.detail}` : ""}</i>}</> : <><b>Free</b><span>{demo ? "" : "Click to add"}</span></>}</button>; })}{index === 1 && <><div className="ttBreakLabel">Break · 10:50–11:10</div>{DAYS.map((day) => <div className="ttBreakCell" key={`break-${day}`}>20 min</div>)}</>}{index === 3 && <><div className="ttBreakLabel">Lunch · 13:05–14:05</div>{DAYS.map((day) => <div className="ttBreakCell" key={`lunch-${day}`}>60 min</div>)}</>}</div>)}</div></div>
          <div className="ttActivitiesStrip"><div className="ttPanelHeader"><div><h2>Activities</h2></div>{!demo && <button className="ttMiniLink noPrint" onClick={() => setItemEditor({ kind: "activity" })}>+ Add</button>}</div>{active.activities.filter((item) => item.week === week).length ? active.activities.filter((item) => item.week === week).map((item) => <div className="ttListRow" key={item.id}><b>{item.day} · {item.start}–{item.end} · {item.title}</b><span>{item.group}{item.room ? ` · ${item.room}` : ""}</span></div>) : <p className="ttMuted">No activities added for this week.</p>}</div>
        </section>
      </>}

      {tab === "planning" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">LESSON CONTENT</span><h2>Lesson planning</h2><p className="ttMuted">Plan directly against timetable lessons, then see the topic on the timetable and class dashboard.</p></div><div className="ttWorkspaceActions"><input className="ttSearch" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search class, subject or topic" /><Link className="ttButton" href="/curriculum">Curriculum Hub</Link><Link className="ttButton" href="/resource-generator">Resource Generator</Link></div></div>
        <div className="ttPlanningGrid">{filteredPlanning.map((lesson) => <article className="ttPlanningCard" key={lesson.id}><div className={`ttSubjectBar ${subjectTone(lesson.subject)}`} /><div><small>{lesson.week} · {lesson.day} · P{lesson.period}</small><h3>{lesson.subject} · {lesson.className}</h3><p>{lesson.plan.topic || "No lesson topic planned yet."}</p><div className="ttChipRow">{lesson.plan.curriculumStage && <span>{lesson.plan.curriculumStage}</span>}{lesson.plan.curriculumUnit && <span>{lesson.plan.curriculumUnit}</span>}{lesson.plan.lessonDate && <span>{formatDate(lesson.plan.lessonDate)}</span>}</div></div><button className="ttButton" onClick={() => setPlanLessonId(lesson.id)}>{lesson.plan.topic ? "Edit plan" : "Plan lesson"}</button></article>)}</div>
      </section>}

      {tab === "classes" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">CLASS DASHBOARD</span><h2>Classes & curriculum sequence</h2></div><div className="ttWorkspaceActions"><select className="ttSelect" value={visibleClass} onChange={(event) => { setClassSelection(event.target.value); setCurriculumText(active.curriculumSequences[event.target.value]?.join("\n") || ""); }}>{classes.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        {!visibleClass ? <div className="ttBlankState"><h3>No classes yet</h3><p>Add or upload timetable lessons first.</p></div> : <div className="ttClassGrid"><article className="ttPanel"><div className="ttKpiGrid compact"><div><small>Lessons / cycle</small><strong>{selectedClassLessons.length}</strong></div><div><small>Open homework</small><strong>{active.homework.filter((item) => item.className === visibleClass && isOpenHomework(item)).length}</strong></div><div><small>Open prep</small><strong>{active.prep.filter((item) => item.className === visibleClass && item.status !== "Done").length}</strong></div><div><small>Planned lessons</small><strong>{selectedClassLessons.filter((item) => item.plan.topic).length}</strong></div></div><label className="ttField"><span>Class progress / next steps</span><textarea value={active.classNotes[visibleClass] || ""} disabled={demo} onChange={(event) => mutate((current) => ({ ...current, classNotes: { ...current.classNotes, [visibleClass]: event.target.value } }))} placeholder="Misconceptions, progress, follow-up, seating or planning notes…" /></label><div className="ttStackList">{selectedClassLessons.map((lesson) => <button className="ttAgendaRow" key={lesson.id} onClick={() => { setPlanLessonId(lesson.id); setTab("planning"); }}><b>{lesson.week} · {lesson.day} · P{lesson.period}</b><span>{lesson.room || "Room not set"}</span><small>{lesson.plan.topic || "No lesson topic planned"}</small></button>)}</div></article>
          <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Topic sequence</h2><p>Paste one lesson title per line, then auto-fill blank lesson-plan topics in timetable order.</p></div></div><textarea className="ttSequenceBox" value={curriculumText || active.curriculumSequences[visibleClass]?.join("\n") || ""} disabled={demo} onChange={(event) => setCurriculumText(event.target.value)} placeholder={'Lesson 1\nLesson 2\nLesson 3'} /><div className="ttButtonRow"><button className="ttButton" disabled={demo} onClick={saveCurriculumSequence}>Save sequence</button><button className="ttButton primary" disabled={demo} onClick={autoPopulateSequence}>Auto-populate lesson topics</button></div><div className="ttIntegrationLinks"><Link href="/curriculum">Open full curriculum hub</Link><Link href="/teaching-learning">Teaching & Learning Hub</Link><Link href="/resource-generator">Create resources</Link></div></article></div>}
      </section>}

      {tab === "homework" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">HOMEWORK & MARKING</span><h2>Homework tracker</h2></div>{!demo && <button className="ttButton primary" onClick={() => setItemEditor({ kind: "homework" })}>+ Add homework</button>}</div><div className="ttKpiGrid"><div><small>Outstanding</small><strong>{openHomework.length}</strong></div><div><small>Overdue</small><strong>{overdueHomework.length}</strong></div><div><small>Waiting to mark</small><strong>{markingQueue.length}</strong></div><div><small>Returned</small><strong>{active.homework.filter((item) => item.status === "Returned").length}</strong></div></div><div className="ttDataList">{active.homework.slice().sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")).map((item) => <button key={item.id} className={`ttDataRow ${item.dueDate < today && isOpenHomework(item) ? "urgent" : ""}`} onClick={() => !demo && setItemEditor({ kind: "homework", id: item.id })}><div><b>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</b><small>{item.status}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.subject}{item.priority === "High" ? " · High priority" : ""}</span></div><span className="ttRowAction">{demo ? "Demo" : "Edit"}</span></button>)}{!active.homework.length && <div className="ttEmptyPreview"><span>No homework tasks yet.</span></div>}</div></section>}

      {tab === "workload" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">WORKLOAD</span><h2>Practical prep & teacher tasks</h2></div><div className="ttWorkspaceActions">{!demo && <><button className="ttButton" onClick={() => setItemEditor({ kind: "prep" })}>+ Prep</button><button className="ttButton primary" onClick={() => setItemEditor({ kind: "task" })}>+ Task</button></>}</div></div><div className="ttKpiGrid"><div><small>Open prep</small><strong>{openPrep.length}</strong></div><div><small>Overdue prep</small><strong>{overduePrep.length}</strong></div><div><small>Open tasks</small><strong>{openTasks.length}</strong></div><div><small>Next free slot</small><strong className="smallStrong">{nextFreeSlot()}</strong></div></div><div className="ttSplitGrid"><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Practical prep</h2></div></div><div className="ttDataList">{active.prep.map((item) => <button className={`ttDataRow compactRow ${item.priority === "High" || (item.neededBy < today && item.status !== "Done") ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "prep", id: item.id })}><div><b>{formatDate(item.neededBy)}</b><small>{item.status}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.room || item.subject}</span></div></button>)}{!active.prep.length && <div className="ttEmptyPreview"><span>No prep items yet.</span></div>}</div></article><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Teacher tasks</h2></div></div><div className="ttDataList">{active.tasks.map((item) => <button className={`ttDataRow compactRow ${item.date < today && item.status !== "Done" ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "task", id: item.id })}><div><b>{formatDate(item.date)}</b><small>{item.period || "Unscheduled"}</small></div><div><strong>{item.title}</strong><span>{item.type} · {item.status}</span></div></button>)}{!active.tasks.length && <div className="ttEmptyPreview"><span>No teacher tasks yet.</span></div>}</div></article></div></section>}

      {tab === "changes" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">CHANGES & COVER</span><h2>Timetable changes</h2><p className="ttMuted">Record cancellations, room changes, cover and one-off notes without changing the normal timetable.</p></div>{!demo && <button className="ttButton primary" onClick={() => setItemEditor({ kind: "change" })}>+ Add change</button>}</div><div className="ttDataList">{active.changes.slice().sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map((item) => { const lesson = active.lessons.find((lesson) => lesson.id === item.lessonId); return <button className={`ttDataRow ${item.type === "Cancelled" ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "change", id: item.id })}><div><b>{formatDate(item.date)}</b><small>{item.type}</small></div><div><strong>{lesson ? `${lesson.week} · ${lesson.day} · P${lesson.period} · ${lesson.className}` : "Lesson"}</strong><span>{[item.room,item.detail,item.notes].filter(Boolean).join(" · ") || "No extra detail"}</span></div></button>; })}{!active.changes.length && <div className="ttEmptyPreview"><span>No timetable changes recorded.</span></div>}</div></section>}

      {tab === "tools" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">TOOLS & BACKUP</span><h2>Workspace tools</h2></div></div><div className="ttToolsGrid"><article className="ttPanel"><h2>Backup</h2><p>Export your full timetable workspace, including lesson plans, homework, prep, tasks and changes.</p><div className="ttButtonRow"><button className="ttButton primary" onClick={exportBackup}>Export backup</button><input ref={backupRef} className="ttFileInput" type="file" accept="application/json,.json" onChange={importBackup} /><button className="ttButton" disabled={demo} onClick={() => backupRef.current?.click()}>Restore backup</button></div></article><article className="ttPanel"><h2>Key dates</h2><p>{nextKeyDate ? `Next: ${nextKeyDate.title} · ${formatDate(nextKeyDate.date)}` : "Add half terms, training days, deadlines or events."}</p>{!demo && <button className="ttButton" onClick={() => setItemEditor({ kind: "keyDate" })}>+ Add key date</button>}<div className="ttStackList">{active.keyDates.slice().sort((a,b)=>a.date.localeCompare(b.date)).map((item) => <button className="ttAgendaRow" key={item.id} onClick={() => !demo && setItemEditor({ kind: "keyDate", id: item.id })}><b>{item.title}</b><span>{formatDate(item.date)} · {item.type}</span></button>)}</div></article><article className="ttPanel"><h2>Connected CPD tools</h2><div className="ttIntegrationLinks"><Link href="/curriculum">Curriculum planning</Link><Link href="/resource-generator">Teaching resource generator</Link><Link href="/teaching-learning">Teaching & Learning Hub</Link><Link href="/calendar">School calendar</Link><Link href="/integrations">Google integrations</Link></div></article><article className="ttPanel"><h2>Workspace status</h2><p>{status}</p><div className="ttButtonRow"><button className="ttButton" onClick={printTimetable}>Print timetable</button><button className="ttButton danger" onClick={clearTimetable}>{demo ? "Exit demo" : "Clear workspace"}</button></div></article></div></section>}

      {editorOpen && <LessonEditor form={form} setForm={setForm} editing={Boolean(editingId)} onClose={() => setEditorOpen(false)} onDelete={deleteLesson} onSave={saveLesson} />}
      {activePlanLesson && <PlanEditor lesson={activePlanLesson} readOnly={demo} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}
      {itemEditor && <ItemEditor kind={itemEditor.kind} itemId={itemEditor.id} workspace={workspace} activeWorkspace={active} week={week} classes={classes} subjects={subjects} onClose={() => setItemEditor(null)} onChange={setWorkspace} />}
    </main>
  );
}

function LessonEditor({ form, setForm, editing, onClose, onDelete, onSave }: { form: { week: WeekKey; day: DayName; period: number; subject: string; className: string; room: string; notes: string }; setForm: React.Dispatch<React.SetStateAction<{ week: WeekKey; day: DayName; period: number; subject: string; className: string; room: string; notes: string }>>; editing: boolean; onClose: () => void; onDelete: () => void; onSave: () => void }) {
  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">PERSONAL TIMETABLE</span><h2>{editing ? "Edit lesson" : "Add lesson"}</h2></div><button className="ttIconButton" onClick={onClose}>×</button></div><div className="ttFormGrid"><label><span>Week</span><select value={form.week} onChange={(event) => setForm((current) => ({ ...current, week: event.target.value as WeekKey }))}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label><label><span>Day</span><select value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value as DayName }))}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label><label><span>Period</span><select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: Number(event.target.value) }))}>{PERIODS.map((period) => <option key={period.period} value={period.period}>P{period.period} · {period.start}–{period.end}</option>)}</select></label><label><span>Subject</span><input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} /></label><label><span>Class / group</span><input value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} /></label><label><span>Room</span><input value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} /></label><label className="wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label></div><div className="ttModalActions">{editing && <button className="ttButton danger pushLeft" onClick={onDelete}>Delete</button>}<button className="ttButton" onClick={onClose}>Cancel</button><button className="ttButton primary" onClick={onSave}>Save lesson</button></div></section></div>;
}

function PlanEditor({ lesson, readOnly, onClose, onSave }: { lesson: Lesson; readOnly: boolean; onClose: () => void; onSave: (plan: LessonPlan) => void }) {
  const [plan, setPlan] = useState<LessonPlan>({ ...blankPlan(), ...lesson.plan });
  const inferredStage = (curriculumStages.includes(plan.curriculumStage as (typeof curriculumStages)[number]) ? plan.curriculumStage : inferCurriculumStage(lesson.className)) as (typeof curriculumStages)[number];
  const inferredSubject = normaliseCurriculumSubject(plan.curriculumSubject || lesson.subject);
  const [bankStage, setBankStage] = useState<string>(inferredStage);
  const [bankSubject, setBankSubject] = useState<string>(inferredSubject);
  const initialUnits = getCurriculumUnits(inferredStage, inferredSubject);
  const [bankUnit, setBankUnit] = useState<string>(initialUnits.some((item) => item.unit === plan.curriculumUnit) ? plan.curriculumUnit : (initialUnits[0]?.unit || ""));
  const [bankLessonIndex, setBankLessonIndex] = useState<number>(() => Math.max(0, plan.sequencePosition || 0));

  const availableSubjects = getCurriculumSubjects(bankStage);
  const availableUnits = getCurriculumUnits(bankStage, bankSubject);
  const availableLessons = getCurriculumLessons(bankStage, bankSubject, bankUnit);
  const selectedUnit = getCurriculumUnit(bankStage, bankSubject, bankUnit);
  const selectedTemplate = availableLessons[bankLessonIndex] || availableLessons[0];

  const field = (key: keyof LessonPlan, label: string, multiline = false, placeholder = "") => <label className={multiline ? "wide" : ""}><span>{label}</span>{multiline ? <textarea disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /> : <input disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />}</label>;

  function changeStage(next: string) {
    setBankStage(next);
    const subjects = getCurriculumSubjects(next);
    const nextSubject = subjects.includes(bankSubject as "English" | "Geography" | "History") ? bankSubject : (normaliseCurriculumSubject(lesson.subject) || subjects[0] || "");
    setBankSubject(nextSubject);
    const units = getCurriculumUnits(next, nextSubject);
    setBankUnit(units[0]?.unit || "");
    setBankLessonIndex(0);
  }

  function changeSubject(next: string) {
    setBankSubject(next);
    const units = getCurriculumUnits(bankStage, next);
    setBankUnit(units[0]?.unit || "");
    setBankLessonIndex(0);
  }

  function changeUnit(next: string) {
    setBankUnit(next);
    setBankLessonIndex(0);
  }

  function applySuggestedLesson() {
    if (!selectedTemplate) return;
    setPlan((current) => ({
      ...current,
      curriculumStage: bankStage,
      curriculumSubject: bankSubject,
      curriculumUnit: bankUnit,
      sequencePosition: Math.max(0, bankLessonIndex),
      topic: selectedTemplate.title,
      vocabulary: selectedTemplate.vocabulary,
      objectives: selectedTemplate.objectives,
      sequence: selectedTemplate.sequence,
      assessment: selectedTemplate.assessment,
    }));
  }

  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal ttPlanModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">LESSON PLANNING</span><h2>{lesson.subject} · {lesson.className}</h2><p>{lesson.week} · {lesson.day} · P{lesson.period} · {lesson.room}</p></div><button className="ttIconButton" onClick={onClose}>×</button></div>
    <section className="ttCurriculumPicker">
      <div className="ttCurriculumPickerHead"><div><strong>Curriculum lesson bank</strong><span>Choose a stage, subject, unit and lesson to pre-fill the plan. You can edit every field afterwards.</span></div>{selectedTemplate && !readOnly && <button className="ttButton primary" onClick={applySuggestedLesson}>Use suggested lesson</button>}</div>
      <div className="ttCurriculumPickerGrid">
        <label><span>Stage</span><select disabled={readOnly} value={bankStage} onChange={(event) => changeStage(event.target.value)}>{curriculumStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
        <label><span>Subject</span><select disabled={readOnly} value={bankSubject} onChange={(event) => changeSubject(event.target.value)}><option value="">Manual / another subject</option>{availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
        <label className="wide"><span>Unit / topic</span><select disabled={readOnly || !bankSubject} value={bankUnit} onChange={(event) => changeUnit(event.target.value)}><option value="">Choose a unit</option>{availableUnits.map((item) => <option key={item.unit} value={item.unit}>{item.unit}</option>)}</select></label>
        <label className="wide"><span>Suggested lesson</span><select disabled={readOnly || !availableLessons.length} value={Math.min(bankLessonIndex, Math.max(availableLessons.length - 1, 0))} onChange={(event) => setBankLessonIndex(Number(event.target.value))}>{availableLessons.length ? availableLessons.map((item, index) => <option key={`${item.title}-${index}`} value={index}>{index + 1}. {item.title}</option>) : <option value={0}>No built-in sequence for this subject</option>}</select></label>
      </div>
      {selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}
      {!bankSubject && <p className="ttCurriculumNote">This subject can still be planned manually below. The built-in bank currently provides English, Geography and History at KS3, GCSE and A level.</p>}
    </section>
    <div className="ttFormGrid"><label><span>Lesson date</span><input type="date" disabled={readOnly} value={plan.lessonDate} onChange={(event) => setPlan((current) => ({ ...current, lessonDate: event.target.value }))} /></label>{field("topic","Topic / lesson title",false,"e.g. Coastal erosion landforms")}{field("curriculumStage","Curriculum stage",false,"KS3, GCSE, A level")}{field("curriculumSubject","Curriculum subject",false,lesson.subject)}{field("curriculumUnit","Curriculum unit",false,"e.g. AQA GCSE – The challenge of natural hazards")}{field("vocabulary","Key vocabulary",false,"Key terms for this lesson")}{field("objectives","Learning objectives",true,"What should pupils know, understand or be able to do?")}{field("sequence","Lesson content / teaching sequence",true,"Starter, explanation/model, guided practice, independent application, review…")}{field("resources","Resources / links",true,"Slides, worksheet, textbook pages, equipment, links…")}{field("assessment","Assessment / checks for understanding",true,"Hinge question, exam question, exit ticket…")}{field("teacherNotes","Teacher notes",true,"Misconceptions, adaptations, follow-up, reminders…")}</div><div className="ttModalActions"><button className="ttButton" onClick={onClose}>Close</button>{!readOnly && <button className="ttButton primary" onClick={() => onSave(plan)}>Save lesson plan</button>}</div></section></div>;
}

function ItemEditor({ kind, itemId, workspace, activeWorkspace, week, classes, subjects, onClose, onChange }: { kind: "homework" | "prep" | "task" | "change" | "activity" | "keyDate"; itemId?: string; workspace: WorkspaceData; activeWorkspace: WorkspaceData; week: WeekKey; classes: string[]; subjects: string[]; onClose: () => void; onChange: React.Dispatch<React.SetStateAction<WorkspaceData>> }) {
  const existing = kind === "homework" ? workspace.homework.find((item) => item.id === itemId) : kind === "prep" ? workspace.prep.find((item) => item.id === itemId) : kind === "task" ? workspace.tasks.find((item) => item.id === itemId) : kind === "change" ? workspace.changes.find((item) => item.id === itemId) : kind === "activity" ? workspace.activities.find((item) => item.id === itemId) : workspace.keyDates.find((item) => item.id === itemId);
  const firstClass = classes[0] || ""; const firstSubject = subjects[0] || "";
  const [data, setData] = useState<Record<string,string>>(() => {
    if (existing) return Object.fromEntries(Object.entries(existing).map(([k,v]) => [k,String(v ?? "")]));
    if (kind === "homework") return { id: makeId("hw"), className:firstClass, subject:firstSubject, title:"", setDate:todayIso(), dueDate:"", status:"To set", priority:"Normal", notes:"" };
    if (kind === "prep") return { id:makeId("prep"), className:firstClass, subject:firstSubject, title:"", neededBy:todayIso(), status:"To prep", priority:"Normal", room:"", notes:"" };
    if (kind === "task") return { id:makeId("task"), title:"", type:"Marking", status:"To do", date:todayIso(), period:"", notes:"" };
    if (kind === "change") return { id:makeId("change"), date:todayIso(), lessonId:activeWorkspace.lessons[0]?.id || "", type:"Room change", room:"", detail:"", notes:"" };
    if (kind === "activity") return { id:makeId("activity"), week, day:"Monday", start:"16:30", end:"17:30", title:"", group:"", room:"" };
    return { id:makeId("date"), date:todayIso(), title:"", type:"Event" };
  });
  const set = (key:string,value:string) => setData((current) => ({ ...current, [key]:value }));
  function save() {
    if (kind === "homework") onChange((current) => ({ ...current, homework:[...current.homework.filter((item)=>item.id!==data.id), data as unknown as Homework] }));
    if (kind === "prep") onChange((current) => ({ ...current, prep:[...current.prep.filter((item)=>item.id!==data.id), data as unknown as PrepItem] }));
    if (kind === "task") onChange((current) => ({ ...current, tasks:[...current.tasks.filter((item)=>item.id!==data.id), data as unknown as TeacherTask] }));
    if (kind === "change") onChange((current) => ({ ...current, changes:[...current.changes.filter((item)=>item.id!==data.id), data as unknown as TimetableChange] }));
    if (kind === "activity") onChange((current) => ({ ...current, activities:[...current.activities.filter((item)=>item.id!==data.id), data as unknown as Activity] }));
    if (kind === "keyDate") onChange((current) => ({ ...current, keyDates:[...current.keyDates.filter((item)=>item.id!==data.id), data as unknown as KeyDate] }));
    onClose();
  }
  function remove() {
    if (!itemId) return;
    onChange((current) => ({ ...current, homework: kind === "homework" ? current.homework.filter((item)=>item.id!==itemId) : current.homework, prep: kind === "prep" ? current.prep.filter((item)=>item.id!==itemId) : current.prep, tasks: kind === "task" ? current.tasks.filter((item)=>item.id!==itemId) : current.tasks, changes: kind === "change" ? current.changes.filter((item)=>item.id!==itemId) : current.changes, activities: kind === "activity" ? current.activities.filter((item)=>item.id!==itemId) : current.activities, keyDates: kind === "keyDate" ? current.keyDates.filter((item)=>item.id!==itemId) : current.keyDates })); onClose();
  }
  const title = ({homework:"Homework",prep:"Practical prep",task:"Teacher task",change:"Timetable change",activity:"Activity",keyDate:"Key date"} as const)[kind];
  return <div className="ttModalBackdrop noPrint" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><section className="ttModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">WORKSPACE</span><h2>{itemId ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}</h2></div><button className="ttIconButton" onClick={onClose}>×</button></div><div className="ttFormGrid">
    {kind === "homework" && <><label><span>Class</span><input list="ttClasses" value={data.className} onChange={(e)=>set("className",e.target.value)} /></label><label><span>Subject</span><input value={data.subject} onChange={(e)=>set("subject",e.target.value)} /></label><label className="wide"><span>Task</span><input value={data.title} onChange={(e)=>set("title",e.target.value)} /></label><label><span>Set date</span><input type="date" value={data.setDate} onChange={(e)=>set("setDate",e.target.value)} /></label><label><span>Due date</span><input type="date" value={data.dueDate} onChange={(e)=>set("dueDate",e.target.value)} /></label><label><span>Status</span><select value={data.status} onChange={(e)=>set("status",e.target.value)}>{["To set","Set","Collected","Marked","Returned"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>Priority</span><select value={data.priority} onChange={(e)=>set("priority",e.target.value)}><option>Normal</option><option>High</option></select></label><label className="wide"><span>Notes</span><textarea value={data.notes} onChange={(e)=>set("notes",e.target.value)} /></label></>}
    {kind === "prep" && <><label><span>Class</span><input list="ttClasses" value={data.className} onChange={(e)=>set("className",e.target.value)} /></label><label><span>Subject</span><input value={data.subject} onChange={(e)=>set("subject",e.target.value)} /></label><label className="wide"><span>Prep item</span><input value={data.title} onChange={(e)=>set("title",e.target.value)} /></label><label><span>Needed by</span><input type="date" value={data.neededBy} onChange={(e)=>set("neededBy",e.target.value)} /></label><label><span>Status</span><select value={data.status} onChange={(e)=>set("status",e.target.value)}>{["To prep","Requested","Ready","Done"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>Priority</span><select value={data.priority} onChange={(e)=>set("priority",e.target.value)}><option>Normal</option><option>High</option></select></label><label><span>Room</span><input value={data.room} onChange={(e)=>set("room",e.target.value)} /></label><label className="wide"><span>Equipment / technician notes</span><textarea value={data.notes} onChange={(e)=>set("notes",e.target.value)} /></label></>}
    {kind === "task" && <><label className="wide"><span>Task</span><input value={data.title} onChange={(e)=>set("title",e.target.value)} /></label><label><span>Type</span><select value={data.type} onChange={(e)=>set("type",e.target.value)}>{["Marking","Planning","Practical prep","Meeting","Duty","Admin","Other"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>Status</span><select value={data.status} onChange={(e)=>set("status",e.target.value)}>{["To do","In progress","Done"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>Date</span><input type="date" value={data.date} onChange={(e)=>set("date",e.target.value)} /></label><label><span>When</span><select value={data.period} onChange={(e)=>set("period",e.target.value)}><option value="">Unscheduled</option>{PERIODS.map(p=><option key={p.period}>P{p.period}</option>)}<option>Break</option><option>Lunch</option><option>After school</option></select></label><label className="wide"><span>Notes</span><textarea value={data.notes} onChange={(e)=>set("notes",e.target.value)} /></label></>}
    {kind === "change" && <><label><span>Date</span><input type="date" value={data.date} onChange={(e)=>set("date",e.target.value)} /></label><label><span>Lesson</span><select value={data.lessonId} onChange={(e)=>set("lessonId",e.target.value)}>{activeWorkspace.lessons.map(l=><option key={l.id} value={l.id}>{l.week} · {l.day} · P{l.period} · {l.className}</option>)}</select></label><label><span>Change type</span><select value={data.type} onChange={(e)=>set("type",e.target.value)}>{["Room change","Cover","Cancelled","Note"].map(v=><option key={v}>{v}</option>)}</select></label><label><span>New room</span><input value={data.room} onChange={(e)=>set("room",e.target.value)} /></label><label className="wide"><span>Cover teacher / short detail</span><input value={data.detail} onChange={(e)=>set("detail",e.target.value)} /></label><label className="wide"><span>Notes</span><textarea value={data.notes} onChange={(e)=>set("notes",e.target.value)} /></label></>}
    {kind === "activity" && <><label><span>Week</span><select value={data.week} onChange={(e)=>set("week",e.target.value)}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label><label><span>Day</span><select value={data.day} onChange={(e)=>set("day",e.target.value)}>{DAYS.map(v=><option key={v}>{v}</option>)}</select></label><label><span>Start</span><input type="time" value={data.start} onChange={(e)=>set("start",e.target.value)} /></label><label><span>End</span><input type="time" value={data.end} onChange={(e)=>set("end",e.target.value)} /></label><label className="wide"><span>Activity</span><input value={data.title} onChange={(e)=>set("title",e.target.value)} /></label><label><span>Group</span><input value={data.group} onChange={(e)=>set("group",e.target.value)} /></label><label><span>Room</span><input value={data.room} onChange={(e)=>set("room",e.target.value)} /></label></>}
    {kind === "keyDate" && <><label><span>Date</span><input type="date" value={data.date} onChange={(e)=>set("date",e.target.value)} /></label><label><span>Type</span><select value={data.type} onChange={(e)=>set("type",e.target.value)}>{["Term","Holiday","Training","Deadline","Event"].map(v=><option key={v}>{v}</option>)}</select></label><label className="wide"><span>Title</span><input value={data.title} onChange={(e)=>set("title",e.target.value)} /></label></>}
  </div><datalist id="ttClasses">{classes.map(v=><option key={v} value={v}/>)}</datalist><div className="ttModalActions">{itemId && <button className="ttButton danger pushLeft" onClick={remove}>Delete</button>}<button className="ttButton" onClick={onClose}>Cancel</button><button className="ttButton primary" onClick={save}>Save</button></div></section></div>;
}
