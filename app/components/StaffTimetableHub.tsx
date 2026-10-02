"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  ClassCurriculumProfile,
  getCourseLessonSequence,
  getNextSuggestedLesson,
  getPhase1Course,
  getPhase1Courses,
  getPhase1ExamBoards,
  getPhase1Lessons,
  getPhase1Subjects,
  getPhase1Subtopics,
  getPhase1Units,
  inferClassCurriculumProfile,
  phase1Stages,
  profileLabel,
} from "./staffTimetableCurriculumPhase1";
import {
  MediumTermPlan,
  MediumTermSession,
  PlanningBlock,
  generateMediumTermPlan,
  mediumTermStats,
  nextDate,
  reflowMediumTermPlan,
} from "./staffTimetableMediumTerm";
import StaffTimetableLessonResources, { type TimetableAttachedResource } from "./StaffTimetableLessonResources";
import StaffTimetableProgress from "./StaffTimetableProgress";
import StaffTimetableAssessments, { type AssessmentFollowUpAction, type CurriculumAssessment, type CurriculumAssessmentTopicResult } from "./StaffTimetableAssessments";
import StaffTimetableLessonHomework, { type LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import StaffTimetableClassWorkspace from "./StaffTimetableClassWorkspace";
import StaffTimetableLessonReflection, { type LessonReflectionOutcome } from "./StaffTimetableLessonReflection";
import { type NextLessonSuggestion } from "./StaffTimetableNextLesson";
import { buildClassSupportText, type ClassInclusionProfile } from "./StaffTimetableInclusionProfile";
import { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";
import StaffTimetableLeadershipSync from "./StaffTimetableLeadershipSync";
import StaffTimetableLeadershipLink from "./StaffTimetableLeadershipLink";
import { reorderMediumTermPlanSessions } from "./StaffTimetablePlanningCalendar";
import StaffTimetableWeeklyPlanning from "./StaffTimetableWeeklyPlanning";
import "./StaffTimetableHub.css";
import "./StaffTimetableMediumTerm.css";

type WeekKey = "W1" | "W2";
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type WorkspaceTab = "today" | "weekly" | "timetable" | "planning" | "mediumterm" | "classes" | "progress" | "assessments" | "homework" | "workload" | "changes" | "tools";

type LessonPlan = {
  lessonDate: string;
  topic: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  resources: string;
  assessment: string;
  examPractice: string;
  teacherNotes: string;
  curriculumStage: string;
  curriculumSubject: string;
  curriculumUnit: string;
  curriculumSubtopic: string;
  examBoard: string;
  courseId: string;
  sequencePosition: number;
  planningMode: "simple" | "detailed";
  priorKnowledge: string;
  retrieval: string;
  misconceptions: string;
  teacherExplanation: string;
  modelling: string;
  guidedPractice: string;
  independentPractice: string;
  sendEalAdaptations: string;
  stretchChallenge: string;
  homeworkTask: string;
  exitTicket: string;
  reflection: string;
  reflectionOutcome: LessonReflectionOutcome;
  reflectionNote: string;
  reflectionUpdatedAt: string;
  reflectionCarryAppliedAt: string;
  generatedResources: TimetableAttachedResource[];
};

type GeneratedLessonPlan = Pick<LessonPlan,
  "objectives" | "vocabulary" | "priorKnowledge" | "retrieval" | "misconceptions" | "teacherExplanation" | "modelling" |
  "guidedPractice" | "independentPractice" | "assessment" | "examPractice" | "sendEalAdaptations" | "stretchChallenge" |
  "homeworkTask" | "exitTicket" | "sequence"
>;

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

type Homework = LessonLinkedHomework;

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
  classCurriculumProfiles: Record<string, ClassCurriculumProfile>;
  mediumTermPlans: MediumTermPlan[];
  planningBlocks: PlanningBlock[];
  assessments: CurriculumAssessment[];
  classInclusionProfiles: Record<string, ClassInclusionProfile>;
  departmentSchemeCopies: Record<string, DepartmentSchemeCopy>;
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
  return {
    lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", examPractice: "", teacherNotes: "",
    curriculumStage: "", curriculumSubject: "", curriculumUnit: "", curriculumSubtopic: "", examBoard: "", courseId: "", sequencePosition: -1,
    planningMode: "simple", priorKnowledge: "", retrieval: "", misconceptions: "", teacherExplanation: "", modelling: "", guidedPractice: "", independentPractice: "",
    sendEalAdaptations: "", stretchChallenge: "", homeworkTask: "", exitTicket: "", reflection: "", reflectionOutcome: "", reflectionNote: "", reflectionUpdatedAt: "", reflectionCarryAppliedAt: "", generatedResources: [],
  };
}
function blankWorkspace(): WorkspaceData {
  return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [], assessments: [], classInclusionProfiles: {}, departmentSchemeCopies: {} };
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
function dateOffsetIso(days: number) {
  const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function shiftIsoDate(value: string, days: number) {
  if (!value || !days) return value;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dateDeltaDays(from: string, to: string) {
  if (!from || !to || from === to) return 0;
  const a = new Date(`${from}T12:00:00`).getTime(); const b = new Date(`${to}T12:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86400000);
}
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
  base.classCurriculumProfiles["Y13 Physics"] = { stage: "A level", examBoard: "AQA", subject: "Physics", courseId: "aqa-alevel-physics-7408" };
  base.mediumTermPlans = [generateMediumTermPlan({
    className: "Y13 Physics",
    profile: base.classCurriculumProfiles["Y13 Physics"],
    patternLessons: base.lessons,
    startDate: todayIso(),
    endDate: dateOffsetIso(42),
    anchorWeek: "W1",
    planningBlocks: [],
    keyDates: [],
    changes: [],
  })];
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
  const [mediumStart, setMediumStart] = useState(todayIso());
  const [mediumEnd, setMediumEnd] = useState(dateOffsetIso(84));
  const [mediumAnchorWeek, setMediumAnchorWeek] = useState<WeekKey>("W1");
  const [blockDraft, setBlockDraft] = useState<{ title: string; startDate: string; endDate: string; type: PlanningBlock["type"] }>({ title: "", startDate: "", endDate: "", type: "Holiday" });
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
  const followUpHomework = active.homework.filter((item) => item.followUp && item.followUp !== "None" && item.status !== "Returned");

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
    mutate((current) => {
      const previous = current.lessons.find((lesson) => lesson.id === planLessonId);
      if (!previous) return current;
      const dayShift = dateDeltaDays(previous.plan.lessonDate || "", nextPlan.lessonDate || "");
      const homework = dayShift ? current.homework.map((item) => item.sourceLessonId === planLessonId && item.autoMoveWithLesson ? { ...item, setDate: shiftIsoDate(item.setDate, dayShift), dueDate: shiftIsoDate(item.dueDate, dayShift), sourceLessonDate: nextPlan.lessonDate } : item) : current.homework;
      const shouldCarry = Boolean(nextPlan.reflectionUpdatedAt) && nextPlan.reflectionUpdatedAt !== previous.plan.reflectionCarryAppliedAt && (nextPlan.reflectionOutcome === "needs-revisiting" || nextPlan.reflectionOutcome === "not-completed");
      const sourcePlan = shouldCarry ? { ...nextPlan, reflectionCarryAppliedAt: nextPlan.reflectionUpdatedAt } : nextPlan;
      let lessons = current.lessons.map((lesson) => lesson.id === planLessonId ? { ...lesson, plan: sourcePlan } : lesson);

      if (shouldCarry) {
        const order = (lesson: Lesson) => {
          if (lesson.plan.lessonDate) return `0-${lesson.plan.lessonDate}-${String(lesson.period).padStart(2, "0")}`;
          const sequence = Number.isInteger(lesson.plan.sequencePosition) && lesson.plan.sequencePosition >= 0 ? String(lesson.plan.sequencePosition).padStart(4, "0") : "9999";
          return `1-${sequence}-${lesson.week}-${String(DAYS.indexOf(lesson.day)).padStart(2, "0")}-${String(lesson.period).padStart(2, "0")}`;
        };
        const classmates = lessons.filter((lesson) => lesson.className === previous.className).slice().sort((a, b) => order(a).localeCompare(order(b)));
        const currentIndex = classmates.findIndex((lesson) => lesson.id === planLessonId);
        const target = classmates.slice(Math.max(0, currentIndex + 1)).find((lesson) => lesson.id !== planLessonId) || classmates.find((lesson) => lesson.id !== planLessonId && !lesson.plan.topic);
        if (target) {
          const marker = `[Reflection follow-up ${nextPlan.reflectionUpdatedAt}]`;
          lessons = lessons.map((lesson) => {
            if (lesson.id !== target.id || lesson.plan.teacherNotes.includes(marker)) return lesson;
            if (nextPlan.reflectionOutcome === "needs-revisiting") {
              const previousTopic = nextPlan.topic || previous.plan.topic || "the previous lesson";
              return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\n\n` : ""}Reflection follow-up: revisit ${previousTopic} with 4–6 retrieval questions, one misconception check and one short application before moving on.`, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\n\n` : ""}${marker} Previous lesson marked Needs revisiting.${nextPlan.reflectionNote ? ` Note: ${nextPlan.reflectionNote}` : ""}` } };
            }
            const previousTopic = nextPlan.topic || previous.plan.topic || "previous learning";
            return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: lesson.plan.topic || `Continue: ${previousTopic}`, vocabulary: lesson.plan.vocabulary || nextPlan.vocabulary, objectives: lesson.plan.objectives || nextPlan.objectives, sequence: lesson.plan.sequence || `Check what was completed previously, finish the unfinished teaching/practice from ${previousTopic}, then check readiness before moving on.`, assessment: lesson.plan.assessment || nextPlan.assessment, curriculumStage: lesson.plan.curriculumStage || nextPlan.curriculumStage, curriculumSubject: lesson.plan.curriculumSubject || nextPlan.curriculumSubject, curriculumUnit: lesson.plan.curriculumUnit || nextPlan.curriculumUnit, curriculumSubtopic: lesson.plan.curriculumSubtopic || nextPlan.curriculumSubtopic, examBoard: lesson.plan.examBoard || nextPlan.examBoard, courseId: lesson.plan.courseId || nextPlan.courseId, sequencePosition: lesson.plan.sequencePosition >= 0 ? lesson.plan.sequencePosition : nextPlan.sequencePosition, retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\n\n` : ""}Quickly retrieve what pupils completed in ${previousTopic}, then continue from the unfinished point.`, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\n\n` : ""}${marker} Previous lesson marked Not completed.${nextPlan.reflectionNote ? ` Note: ${nextPlan.reflectionNote}` : ""}` } };
          });
        }
      }
      return { ...current, homework, lessons };
    });
    setPlanLessonId(null);
  }
  function assessmentFollowUp(action: AssessmentFollowUpAction, assessment: CurriculumAssessment, topic: CurriculumAssessmentTopicResult) {
    if (demo) return;
    if (action === "homework") {
      const homework: Homework = { id: makeId("assessment_hw"), className: assessment.className, subject: assessment.subject, title: `Assessment follow-up: ${topic.title}`, setDate: today, dueDate: dateOffsetIso(7), status: "To set", priority: "Normal", notes: `Created from ${assessment.title}. Class topic score: ${topic.scorePercent ?? "—"}% (threshold ${assessment.thresholdPercent}%).`, sourceAssessmentId: assessment.id, sourceTopic: topic.title, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle, completionPercent: 0, followUp: "None" };
      mutate((current) => ({ ...current, homework: [...current.homework, homework] })); setTab("homework"); setStatus(`Created homework for ${assessment.className}: ${topic.title}.`); return;
    }
    if (action === "intervention") {
      const task: TeacherTask = { id: makeId("assessment_intervention"), title: `Intervention follow-up: ${assessment.className} · ${topic.title}`, type: "Planning", status: "To do", date: today, period: "", notes: `Class-level assessment flag from ${assessment.title}: ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold. Use the intervention area for individual pupil records.` };
      mutate((current) => ({ ...current, tasks: [...current.tasks, task] })); setTab("workload"); setStatus(`Added intervention follow-up task for ${topic.title}.`); return;
    }
    const candidates = workspace.lessons.filter((lesson) => lesson.className === assessment.className);
    const target = candidates.find((lesson) => !lesson.plan.topic) || null;
    if (!target) {
      const label = action === "reteach" ? "reteach" : action === "retrieval" ? "retrieval" : "revision";
      const task: TeacherTask = { id: makeId("assessment_plan"), title: `Plan ${label}: ${assessment.className} · ${topic.title}`, type: "Planning", status: "To do", date: today, period: "", notes: `No blank timetable lesson was available. Assessment: ${assessment.title}; score ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold.` };
      mutate((current) => ({ ...current, tasks: [...current.tasks, task] })); setTab("workload"); setStatus(`No blank ${assessment.className} lesson was available, so a planning task was added.`); return;
    }
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => {
      if (lesson.id !== target.id) return lesson;
      if (action === "retrieval") return { ...lesson, plan: { ...lesson.plan, retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\n\n` : ""}Assessment-responsive retrieval: write 4–6 short questions revisiting ${topic.title}, including one misconception check and one application question.`, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle } };
      const prefix = action === "reteach" ? "Reteach" : "Revision";
      return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: `${prefix}: ${topic.title}`, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\n\n` : ""}Assessment response from ${assessment.title}: ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold.`, retrieval: lesson.plan.retrieval || `Retrieve prerequisite knowledge for ${topic.title} before ${prefix.toLowerCase()}ing.`, homeworkTask: lesson.plan.homeworkTask || `Consolidate ${topic.title} after the responsive lesson.` } };
    }) }));
    setPlanLessonId(target.id); setTab("planning"); setStatus(`Prepared a ${action} response for ${assessment.className}: ${topic.title}.`);
  }
  function applyNextLessonSuggestion(suggestion: NextLessonSuggestion) {
    if (demo) return;
    mutate((current) => {
      const classSupport = buildClassSupportText(current.classInclusionProfiles[suggestion.className]);
      return { ...current, lessons: current.lessons.map((lesson) => lesson.id === suggestion.targetLessonId ? { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: suggestion.title, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, retrieval: suggestion.retrieval, sendEalAdaptations: lesson.plan.sendEalAdaptations || classSupport, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\n\n` : ""}${suggestion.teacherNotes}` } } : lesson) };
    });
    setPlanLessonId(suggestion.targetLessonId);
    setTab("planning");
    setStatus(`Prepared the Phase 10 next-lesson suggestion for ${suggestion.className}.`);
  }
  function importDepartmentScheme(className: string, unit: DepartmentSchemeUnit, schemeLessons: DepartmentSchemeLesson[]) {
    if (demo || !className || !schemeLessons.length) return;
    const copy: DepartmentSchemeCopy = { unitId: unit.id, department: unit.department, subject: unit.subject, yearGroup: unit.year_group, title: unit.title, copiedAt: new Date().toISOString(), lessons: schemeLessons.map((item) => ({ ...item })) };
    mutate((current) => {
      const targets = current.lessons.filter((lesson) => lesson.className === className).slice().sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
      const targetIndex = new Map(targets.map((lesson, index) => [lesson.id, index]));
      const nextLessons = current.lessons.map((lesson) => {
        const index = targetIndex.get(lesson.id);
        if (index === undefined || index >= schemeLessons.length || lesson.plan.topic) return lesson;
        const scheme = schemeLessons[index];
        const note = `Department scheme snapshot: ${unit.title}. This is a local copy; edits here do not change the department master.`;
        return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed" as const, topic: scheme.title, vocabulary: lesson.plan.vocabulary || unit.vocabulary.join(", "), objectives: lesson.plan.objectives || (scheme.objectives.length ? scheme.objectives.join("\n") : unit.objectives.join("\n")), sequence: lesson.plan.sequence || scheme.lesson_outline || scheme.key_knowledge, assessment: lesson.plan.assessment || scheme.assessment || unit.assessment_notes, curriculumSubject: lesson.plan.curriculumSubject || unit.subject, curriculumUnit: unit.title, curriculumSubtopic: scheme.title, sequencePosition: lesson.plan.sequencePosition >= 0 ? lesson.plan.sequencePosition : index, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\n\n` : ""}${note}` } };
      });
      return { ...current, lessons: nextLessons, curriculumSequences: { ...current.curriculumSequences, [className]: schemeLessons.map((item) => item.title) }, departmentSchemeCopies: { ...current.departmentSchemeCopies, [className]: copy } };
    });
    setStatus(`Copied ${unit.title} into ${className}. The department master remains unchanged.`);
  }
  function movePlannedLesson(className: string, sourceId: string, targetId: string, shiftRemaining: boolean) {
    if (demo || !className || !sourceId || !targetId) return;
    mutate((current) => ({
      ...current,
      mediumTermPlans: current.mediumTermPlans.map((plan) => plan.className === className ? reorderMediumTermPlanSessions(plan, sourceId, targetId, shiftRemaining) : plan),
    }));
    setStatus(`${shiftRemaining ? "Shifted" : "Swapped"} the planned curriculum lesson for ${className}. Completed lessons were left unchanged.`);
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
  function saveClassProfile(patch: Partial<ClassCurriculumProfile>) {
    if (!visibleClass || demo) return;
    const existing = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    let next: ClassCurriculumProfile = { ...existing, ...patch };
    if (patch.stage) {
      next.examBoard = getPhase1ExamBoards(next.stage)[0];
      next.subject = getPhase1Subjects(next.stage, next.examBoard)[0] || next.subject;
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    } else if (patch.examBoard) {
      next.subject = getPhase1Subjects(next.stage, next.examBoard)[0] || next.subject;
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    } else if (patch.subject) {
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    }
    mutate((current) => ({ ...current, classCurriculumProfiles: { ...current.classCurriculumProfiles, [visibleClass]: next } }));
  }
  function autoPopulateCourseSequence() {
    if (!visibleClass || demo) return;
    const profile = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    const sequence = getCourseLessonSequence(profile);
    if (!sequence.length) return;
    const targets = workspace.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => {
      const index = targets.findIndex((target) => target.id === lesson.id);
      if (index < 0 || index >= sequence.length || lesson.plan.topic) return lesson;
      const suggestion = sequence[index];
      return { ...lesson, plan: { ...lesson.plan, topic: suggestion.title, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, curriculumStage: suggestion.stage, curriculumSubject: suggestion.subject, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, examBoard: suggestion.examBoard, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition } };
    }) }));
    setStatus(`Filled blank ${visibleClass} lesson plans from ${getPhase1Course(profile.courseId)?.title || profile.subject}.`);
  }
  function generateMediumTermForClass() {
    if (!visibleClass || demo || !mediumStart || !mediumEnd || mediumEnd < mediumStart) return;
    const profile = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    const sequence = getCourseLessonSequence(profile);
    const alreadyPlanned = new Set(workspace.lessons.filter((lesson) => lesson.className === visibleClass).map((lesson) => lesson.plan.topic).filter(Boolean));
    const firstUnused = sequence.findIndex((item) => !alreadyPlanned.has(item.title));
    const startSequencePosition = alreadyPlanned.size ? (firstUnused >= 0 ? firstUnused : sequence.length) : 0;
    const plan = generateMediumTermPlan({ className: visibleClass, profile, patternLessons: workspace.lessons, startDate: mediumStart, endDate: mediumEnd, anchorWeek: mediumAnchorWeek, planningBlocks: workspace.planningBlocks, keyDates: workspace.keyDates, changes: workspace.changes, startSequencePosition });
    mutate((current) => ({ ...current, mediumTermPlans: [...current.mediumTermPlans.filter((item) => item.className !== visibleClass), plan] }));
    setStatus(`Built a dated medium-term plan for ${visibleClass} with ${plan.sessions.length} teaching sessions.`);
  }
  function reflowSelectedMediumTerm() {
    if (!visibleClass || demo) return;
    mutate((current) => {
      const plan = current.mediumTermPlans.find((item) => item.className === visibleClass); if (!plan) return current;
      const fromDate = today > plan.startDate ? today : plan.startDate;
      const nextPlan = reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks: current.planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      return { ...current, mediumTermPlans: current.mediumTermPlans.map((item) => item.id === plan.id ? nextPlan : item) };
    });
    setStatus(`Reflowed future ${visibleClass} lessons around current non-teaching dates and cancellations.`);
  }
  function markMediumTermSession(planId: string, sessionId: string, status: MediumTermSession["status"]) {
    if (demo) return;
    mutate((current) => {
      const plan = current.mediumTermPlans.find((item) => item.id === planId); if (!plan) return current;
      const target = plan.sessions.find((item) => item.id === sessionId); if (!target) return current;
      let nextPlan: MediumTermPlan = { ...plan, sessions: plan.sessions.map((item) => item.id === sessionId ? { ...item, status } : item) };
      if (status === "missed") {
        nextPlan = reflowMediumTermPlan(nextPlan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks: current.planningBlocks, keyDates: current.keyDates, changes: current.changes }, nextDate(target.date));
      }
      return { ...current, mediumTermPlans: current.mediumTermPlans.map((item) => item.id === planId ? nextPlan : item) };
    });
  }
  function openMediumTermSession(session: MediumTermSession) {
    if (demo) return;
    const plan = workspace.mediumTermPlans.find((item) => item.className === visibleClass); if (!plan) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === session.sourceLessonId ? { ...lesson, plan: { ...lesson.plan, lessonDate: session.date, topic: session.topic, vocabulary: session.vocabulary, objectives: session.objectives, sequence: session.sequence, assessment: session.assessment, curriculumStage: plan.profile.stage, curriculumSubject: plan.profile.subject, curriculumUnit: session.unitTitle, curriculumSubtopic: session.subtopicTitle, examBoard: plan.profile.examBoard, courseId: plan.profile.courseId, sequencePosition: session.sequencePosition } } : lesson) }));
    setPlanLessonId(session.sourceLessonId); setTab("planning");
  }
  function savePlanningBlock() {
    if (demo) return;
    const startDate = blockDraft.startDate || mediumStart; const endDate = blockDraft.endDate || startDate;
    if (!startDate || !endDate || endDate < startDate) return;
    const block: PlanningBlock = { id: makeId("block"), title: blockDraft.title.trim() || blockDraft.type, startDate, endDate, type: blockDraft.type };
    mutate((current) => {
      const planningBlocks = [...current.planningBlocks, block];
      const mediumTermPlans = current.mediumTermPlans.map((plan) => {
        const fromDate = block.startDate > plan.startDate ? block.startDate : plan.startDate;
        return reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      });
      return { ...current, planningBlocks, mediumTermPlans };
    });
    setBlockDraft({ title: "", startDate: "", endDate: "", type: "Holiday" });
  }
  function removePlanningBlock(blockId: string) {
    if (demo) return;
    mutate((current) => {
      const removed = current.planningBlocks.find((item) => item.id === blockId); const planningBlocks = current.planningBlocks.filter((item) => item.id !== blockId);
      if (!removed) return { ...current, planningBlocks };
      const mediumTermPlans = current.mediumTermPlans.map((plan) => {
        const candidate = removed.startDate > today ? removed.startDate : today;
        const fromDate = candidate > plan.startDate ? candidate : plan.startDate;
        return reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      });
      return { ...current, planningBlocks, mediumTermPlans };
    });
  }
  function clearMediumTermPlan() {
    if (!visibleClass || demo) return;
    mutate((current) => ({ ...current, mediumTermPlans: current.mediumTermPlans.filter((item) => item.className !== visibleClass) }));
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ version: 15, week, workspace }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `staff-timetable-backup-${today}.json`; a.click(); URL.revokeObjectURL(url);
  }
  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as { workspace?: WorkspaceData; week?: WeekKey }; if (!parsed.workspace) throw new Error("This is not a timetable workspace backup."); setDemo(false); setWorkspace({ ...blankWorkspace(), ...parsed.workspace }); if (parsed.week) setWeek(parsed.week); setStatus("Workspace backup restored."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Backup could not be restored."); }
    finally { event.target.value = ""; }
  }

  const activePlanLesson = active.lessons.find((lesson) => lesson.id === planLessonId) || null;
  const selectedClassLessons = active.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
  const inferredClassProfile = inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
  const currentClassProfile = active.classCurriculumProfiles[visibleClass] || inferredClassProfile;
  const profileBoards = getPhase1ExamBoards(currentClassProfile.stage);
  const profileSubjects = getPhase1Subjects(currentClassProfile.stage, currentClassProfile.examBoard);
  const profileCourses = getPhase1Courses(currentClassProfile.stage, currentClassProfile.examBoard, currentClassProfile.subject);
  const selectedProfileCourse = getPhase1Course(currentClassProfile.courseId) || profileCourses[0];
  const nextProfileLesson = getNextSuggestedLesson(currentClassProfile, selectedClassLessons.map((lesson) => lesson.plan.topic));
  const selectedMediumTermPlan = active.mediumTermPlans.find((item) => item.className === visibleClass);
  const selectedMediumStats = mediumTermStats(selectedMediumTermPlan);
  const selectedCourseLength = getCourseLessonSequence(currentClassProfile).length;
  const nextKeyDate = active.keyDates.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nowCard = currentOrNext();
  const filteredPlanning = active.lessons.filter((lesson) => !search || [lesson.subject, lesson.className, lesson.plan.topic, lesson.plan.curriculumUnit].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="staffTimetablePage">
      <StaffTimetableLeadershipSync lessons={workspace.lessons} classCurriculumProfiles={workspace.classCurriculumProfiles} mediumTermPlans={workspace.mediumTermPlans} assessments={workspace.assessments} disabled={demo} />
      <section className="staffTimetableHero">
        <div><div className="staffTimetableEyebrow">STAFF · PERSONAL WORKSPACE</div><h1>My timetable & planner</h1><p>Your timetable, lesson planning, class notes, homework, marking, practical prep and weekly workload in one place. The normal workspace starts blank and contains no preloaded staff names.</p></div>
        <div className="staffTimetableHeroActions noPrint"><StaffTimetableLeadershipLink /><button className={demo ? "ttButton demo active" : "ttButton demo"} onClick={() => { setDemo((value) => !value); setPendingImport(null); }}>{demo ? "Exit demo" : "View demo"}</button><button className="ttButton" onClick={printTimetable}>Print timetable</button><Link className="ttButton" href="/school">School tools</Link></div>
      </section>

      {demo && <div className="ttDemoBanner"><strong>Demo mode</strong><span>A read-only example based on the original timetable, including example planning and workload data. Your own saved workspace has not changed.</span></div>}

      <nav className="ttWorkspaceNav noPrint" aria-label="Timetable workspace">
        {(["today","weekly","timetable","planning","mediumterm","classes","progress","assessments","homework","workload","changes","tools"] as WorkspaceTab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({today:"Today",weekly:"Plan week",timetable:"Timetable",planning:"Lesson planning",mediumterm:"Medium-term",classes:"Classes",progress:"Progress",assessments:"Assessments",homework:"Homework",workload:"Prep & tasks",changes:"Changes",tools:"Tools"} as Record<WorkspaceTab,string>)[item]}</button>)}
      </nav>

      {tab === "today" && <section className="ttDashboardShell">
        <div className="ttDashboardHero">
          <div><span className="staffTimetableEyebrow">MORNING BRIEFING</span><h2>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2><p>Week {week === "W1" ? "1" : "2"} · {todayLessons().length} lessons today</p></div>
          <div className="ttDashboardHeroActions noPrint"><button className="ttButton primary" onClick={() => setTab("weekly")}>Plan the week</button><button className="ttButton" onClick={() => setTab("planning")}>Plan a lesson</button><button className="ttButton" onClick={() => setItemEditor({ kind: "task" })}>+ Task</button><button className="ttButton" onClick={() => setTab("timetable")}>Open timetable</button></div>
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

      {tab === "weekly" && <StaffTimetableWeeklyPlanning
        lessons={active.lessons}
        mediumTermPlans={active.mediumTermPlans}
        assessments={active.assessments}
        homework={active.homework}
        prep={active.prep}
        tasks={active.tasks}
        today={today}
        readOnly={demo}
        onOpenLesson={(lessonId) => { setPlanLessonId(lessonId); setTab("planning"); }}
        onOpenClass={(className) => { setClassSelection(className); setTab("classes"); }}
        onOpenMediumTerm={(className) => { setClassSelection(className); setTab("mediumterm"); }}
        onOpenHomework={() => setTab("homework")}
        onOpenAssessments={() => setTab("assessments")}
        onAddTask={() => setItemEditor({ kind: "task" })}
      />}

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
        <div className="ttPlanningGrid">{filteredPlanning.map((lesson) => <article className="ttPlanningCard" key={lesson.id}><div className={`ttSubjectBar ${subjectTone(lesson.subject)}`} /><div><small>{lesson.week} · {lesson.day} · P{lesson.period}</small><h3>{lesson.subject} · {lesson.className}</h3><p>{lesson.plan.topic || "No lesson topic planned yet."}</p><div className="ttChipRow">{lesson.plan.curriculumStage && <span>{lesson.plan.curriculumStage}</span>}{lesson.plan.curriculumUnit && <span>{lesson.plan.curriculumUnit}</span>}{lesson.plan.lessonDate && <span>{formatDate(lesson.plan.lessonDate)}</span>}{lesson.plan.planningMode === "detailed" && <span>Detailed</span>}{lesson.plan.exitTicket && <span>Exit ticket ready</span>}</div></div><button className="ttButton" onClick={() => setPlanLessonId(lesson.id)}>{lesson.plan.topic ? "Edit plan" : "Plan lesson"}</button></article>)}</div>
      </section>}

      {tab === "mediumterm" && <section className="ttWorkspace ttMtpShell"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">PHASE 2 · MEDIUM-TERM PLANNING</span><h2>Automatic curriculum map</h2><p className="ttMuted">Turn the repeating W1/W2 timetable into dated lessons across a term. Holidays, INSET, assessment blocks, trips and cancellations are skipped, while missed lessons can roll forward automatically.</p></div><div className="ttMtpToolbar"><div className="ttMtpToolbarLeft"><select value={visibleClass} onChange={(event) => setClassSelection(event.target.value)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></div></div></div>
        {!visibleClass ? <div className="ttMtpEmpty"><strong>No classes yet</strong><span>Upload or build the timetable first.</span></div> : <>
          <div className="ttMtpSetup"><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Build the teaching sequence</h2></div></div><div className="ttMtpCourseLine"><span>{profileLabel(currentClassProfile)}</span>{selectedProfileCourse?.code && <span>{selectedProfileCourse.code}</span>}<span>{selectedCourseLength} curriculum lessons</span></div><div className="ttMtpForm"><label><span>Start date</span><input type="date" disabled={demo} value={mediumStart} onChange={(event) => setMediumStart(event.target.value)} /></label><label><span>End date</span><input type="date" disabled={demo} value={mediumEnd} onChange={(event) => setMediumEnd(event.target.value)} /></label><label><span>Starting cycle</span><select disabled={demo} value={mediumAnchorWeek} onChange={(event) => setMediumAnchorWeek(event.target.value as WeekKey)}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label><label><span>Class</span><input value={visibleClass} disabled /></label></div><div className="ttButtonRow"><button className="ttButton primary" disabled={demo || !selectedProfileCourse} onClick={generateMediumTermForClass}>{selectedMediumTermPlan ? "Rebuild dated plan" : "Build dated plan"}</button>{selectedMediumTermPlan && <button className="ttButton" disabled={demo} onClick={reflowSelectedMediumTerm}>Reflow future lessons</button>}{selectedMediumTermPlan && <button className="ttButton danger" disabled={demo} onClick={clearMediumTermPlan}>Clear plan</button>}</div><div className="ttMtpHint">The first calendar week in this date range is treated as <strong>{mediumAnchorWeek === "W1" ? "Week 1" : "Week 2"}</strong>. The planner then alternates the cycle automatically and only schedules dates where this class actually appears on the timetable.</div>{selectedMediumTermPlan && <><div className="ttMtpStats"><div><small>Scheduled</small><strong>{selectedMediumStats.total}</strong></div><div><small>Complete</small><strong>{selectedMediumStats.complete}</strong></div><div><small>Missed</small><strong>{selectedMediumStats.missed}</strong></div><div><small>Still planned</small><strong>{selectedMediumStats.planned}</strong></div></div><div className="ttMtpProgress"><span style={{ width: `${selectedMediumStats.total ? Math.round(selectedMediumStats.complete / selectedMediumStats.total * 100) : 0}%` }} /></div></>}</article>
            <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Non-teaching dates</h2><p>Adding or removing a block automatically reflows affected medium-term plans.</p></div></div><div className="ttMtpBlockForm"><label className="wide"><span>Reason</span><input disabled={demo} value={blockDraft.title} onChange={(event) => setBlockDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. October half term" /></label><label><span>Type</span><select disabled={demo} value={blockDraft.type} onChange={(event) => setBlockDraft((current) => ({ ...current, type: event.target.value as PlanningBlock["type"] }))}>{["Holiday","INSET","Assessment week","Trip","Other"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>From</span><input type="date" disabled={demo} value={blockDraft.startDate} onChange={(event) => setBlockDraft((current) => ({ ...current, startDate: event.target.value }))} /></label><label><span>To</span><input type="date" disabled={demo} value={blockDraft.endDate} onChange={(event) => setBlockDraft((current) => ({ ...current, endDate: event.target.value }))} /></label><div className="wide"><button className="ttButton" disabled={demo} onClick={savePlanningBlock}>+ Add non-teaching block</button></div></div><div className="ttMtpBlocks">{active.planningBlocks.map((block) => <div className="ttMtpBlock" key={block.id}><div><strong>{block.title}</strong><span>{block.type} · {formatDate(block.startDate)}{block.endDate !== block.startDate ? ` – ${formatDate(block.endDate)}` : ""}</span></div>{!demo && <button className="ttMiniLink" onClick={() => removePlanningBlock(block.id)}>Remove</button>}</div>)}{!active.planningBlocks.length && <div className="ttMtpNotice">Holiday and Training items already saved under Key dates are skipped automatically. Use these blocks for date ranges such as half term, assessment week or a class trip.</div>}</div></article></div>
          {selectedMediumTermPlan ? <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Dated teaching sequence</h2><p>{formatDate(selectedMediumTermPlan.startDate)} to {formatDate(selectedMediumTermPlan.endDate)} · generated from the class timetable and {selectedProfileCourse?.title || currentClassProfile.subject}.</p></div></div><div className="ttMtpTimeline">{selectedMediumTermPlan.sessions.map((session) => <div className={`ttMtpSession ${session.status}`} key={session.id}><div className="ttMtpDate"><strong>{formatDate(session.date)}</strong><span>{session.week} · {session.day.slice(0,3)} · P{session.period}</span></div><div className="ttMtpLesson"><strong>{session.topic}</strong><span>{session.unitTitle} · {session.subtopicTitle}</span><small>{session.start}–{session.end}{session.room ? ` · ${session.room}` : ""}</small></div><div className="ttMtpActions"><span className="ttMtpStatus">{session.status}</span><button className="ttMiniLink" onClick={() => openMediumTermSession(session)}>Open plan</button>{session.status !== "complete" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "complete")}>Complete</button>}{session.status !== "missed" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "missed")}>Missed</button>}{session.status !== "planned" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "planned")}>Reset</button>}</div></div>)}</div>{!selectedMediumTermPlan.sessions.length && <div className="ttMtpEmpty"><strong>No schedulable lessons in this range</strong><span>Check the class timetable, date range, W1/W2 starting cycle and non-teaching blocks.</span></div>}</article> : <div className="ttMtpEmpty"><strong>No medium-term plan for {visibleClass}</strong><span>Choose the date range above and build the plan. It will distribute the next curriculum lessons across the class’s real timetable slots.</span></div>}
        </>}
      </section>}

      {tab === "classes" && <section className="ttWorkspace"><StaffTimetableClassWorkspace
        classes={classes}
        className={visibleClass}
        lessons={active.lessons}
        profile={active.classCurriculumProfiles[visibleClass]}
        homework={active.homework}
        assessments={active.assessments}
        mediumTermPlans={active.mediumTermPlans}
        notes={active.classNotes[visibleClass] || ""}
        today={today}
        readOnly={demo}
        onSelectClass={(nextClass) => { setClassSelection(nextClass); setCurriculumText(active.curriculumSequences[nextClass]?.join("\n") || ""); }}
        onOpenPlan={(lessonId) => setPlanLessonId(lessonId)}
        onOpenMediumTerm={() => setTab("mediumterm")}
        onOpenAssessments={() => setTab("assessments")}
        onOpenHomework={() => setTab("homework")}
        onApplyNextSuggestion={applyNextLessonSuggestion}
        inclusionProfile={active.classInclusionProfiles[visibleClass]}
        departmentSchemeCopy={active.departmentSchemeCopies[visibleClass]}
        onInclusionChange={(profile) => mutate((current) => ({ ...current, classInclusionProfiles: { ...current.classInclusionProfiles, [visibleClass]: profile } }))}
        onImportScheme={(unit, schemeLessons) => importDepartmentScheme(visibleClass, unit, schemeLessons)}
        onMovePlannedLesson={movePlannedLesson}
        onNotesChange={(value) => mutate((current) => ({ ...current, classNotes: { ...current.classNotes, [visibleClass]: value } }))}
      /><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">CURRICULUM SETUP · PHASE 1</span><h2>Curriculum profile & setup</h2><p className="ttMuted">The Phase 9 class workspace above brings day-to-day planning together. Use this area when you need to change the class curriculum profile or sequence.</p></div><div className="ttWorkspaceActions"><select className="ttSelect" value={visibleClass} onChange={(event) => { setClassSelection(event.target.value); setCurriculumText(active.curriculumSequences[event.target.value]?.join("\n") || ""); }}>{classes.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        {!visibleClass ? <div className="ttBlankState"><h3>No classes yet</h3><p>Add or upload timetable lessons first.</p></div> : <div className="ttClassGrid"><article className="ttPanel"><div className="ttKpiGrid compact"><div><small>Lessons / cycle</small><strong>{selectedClassLessons.length}</strong></div><div><small>Open homework</small><strong>{active.homework.filter((item) => item.className === visibleClass && isOpenHomework(item)).length}</strong></div><div><small>Open prep</small><strong>{active.prep.filter((item) => item.className === visibleClass && item.status !== "Done").length}</strong></div><div><small>Planned lessons</small><strong>{selectedClassLessons.filter((item) => item.plan.topic).length}</strong></div></div><label className="ttField"><span>Class progress / next steps</span><textarea value={active.classNotes[visibleClass] || ""} disabled={demo} onChange={(event) => mutate((current) => ({ ...current, classNotes: { ...current.classNotes, [visibleClass]: event.target.value } }))} placeholder="Misconceptions, progress, follow-up or planning notes…" /></label><div className="ttStackList">{selectedClassLessons.map((lesson) => <button className="ttAgendaRow" key={lesson.id} onClick={() => { setPlanLessonId(lesson.id); setTab("planning"); }}><b>{lesson.week} · {lesson.day} · P{lesson.period}</b><span>{lesson.room || "Room not set"}</span><small>{lesson.plan.topic || "No lesson topic planned"}</small></button>)}</div></article>
          <article className="ttPanel ttCurriculumProfilePanel"><div className="ttPanelHeader"><div><h2>Curriculum profile</h2><p>Key Stage → exam board → subject → course. Once chosen, unrelated courses disappear from lesson planning.</p></div></div><div className="ttProfileSummary"><strong>{profileLabel(currentClassProfile)}</strong><span>{selectedProfileCourse ? `${selectedProfileCourse.units.length} units · ${getCourseLessonSequence(currentClassProfile).length} suggested lessons` : "Choose a course"}</span></div><div className="ttProfileGrid">
            <label><span>Key Stage</span><select disabled={demo} value={currentClassProfile.stage} onChange={(event) => saveClassProfile({ stage: event.target.value as ClassCurriculumProfile["stage"] })}>{phase1Stages.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Exam board</span><select disabled={demo} value={currentClassProfile.examBoard} onChange={(event) => saveClassProfile({ examBoard: event.target.value as ClassCurriculumProfile["examBoard"] })}>{profileBoards.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Subject</span><select disabled={demo} value={currentClassProfile.subject} onChange={(event) => saveClassProfile({ subject: event.target.value as ClassCurriculumProfile["subject"] })}>{profileSubjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Course / specification</span><select disabled={demo} value={currentClassProfile.courseId} onChange={(event) => saveClassProfile({ courseId: event.target.value })}>{profileCourses.map((item) => <option key={item.id} value={item.id}>{item.title}{item.code && item.code !== "KS3" ? ` · ${item.code}` : ""}</option>)}</select></label>
          </div>{nextProfileLesson ? <div className="ttNextLesson"><small>NEXT SUGGESTED LESSON</small><strong>{nextProfileLesson.title}</strong><span>{nextProfileLesson.unitTitle} · {nextProfileLesson.subtopicTitle}</span><button className="ttButton primary" disabled={demo} onClick={() => { const nextBlank = selectedClassLessons.find((item) => !item.plan.topic); if (nextBlank) { setPlanLessonId(nextBlank.id); setTab("planning"); } }}>Plan next lesson</button></div> : <div className="ttEmptyPreview"><strong>Sequence complete or not configured</strong><span>Choose the class course above or review already planned lessons.</span></div>}<div className="ttButtonRow"><button className="ttButton primary" disabled={demo || !selectedProfileCourse} onClick={autoPopulateCourseSequence}>Auto-fill blank lessons from course</button></div><details className="ttCustomSequence"><summary>Custom sequence override</summary><p>Use this only when your department teaches a different order.</p><textarea className="ttSequenceBox" value={curriculumText || active.curriculumSequences[visibleClass]?.join("\n") || ""} disabled={demo} onChange={(event) => setCurriculumText(event.target.value)} placeholder={'Lesson 1\nLesson 2\nLesson 3'} /><div className="ttButtonRow"><button className="ttButton" disabled={demo} onClick={saveCurriculumSequence}>Save custom sequence</button><button className="ttButton" disabled={demo} onClick={autoPopulateSequence}>Use custom sequence</button></div></details><div className="ttIntegrationLinks"><Link href="/curriculum">Open full curriculum hub</Link><Link href="/teaching-learning">Teaching & Learning Hub</Link><Link href="/resource-generator">Create resources</Link></div></article></div>}
      </section>}

      {tab === "progress" && <StaffTimetableProgress
        lessons={active.lessons}
        profiles={active.classCurriculumProfiles}
        mediumTermPlans={active.mediumTermPlans}
        today={today}
        onOpenMediumTerm={(className) => { setClassSelection(className); setTab("mediumterm"); }}
      />}

      {tab === "assessments" && <StaffTimetableAssessments
        lessons={active.lessons}
        profiles={active.classCurriculumProfiles}
        assessments={active.assessments}
        today={today}
        initialClass={visibleClass}
        readOnly={demo}
        onChange={(assessments) => mutate((current) => ({ ...current, assessments }))}
        onFollowUp={assessmentFollowUp}
      />}

      {tab === "homework" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">HOMEWORK & MARKING</span><h2>Homework tracker</h2></div>{!demo && <button className="ttButton primary" onClick={() => setItemEditor({ kind: "homework" })}>+ Add homework</button>}</div><div className="ttKpiGrid"><div><small>Outstanding</small><strong>{openHomework.length}</strong></div><div><small>Overdue</small><strong>{overdueHomework.length}</strong></div><div><small>Waiting to mark</small><strong>{markingQueue.length}</strong></div><div><small>Returned</small><strong>{active.homework.filter((item) => item.status === "Returned").length}</strong></div></div><div className="ttDataList">{active.homework.slice().sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")).map((item) => <button key={item.id} className={`ttDataRow ${item.dueDate < today && isOpenHomework(item) ? "urgent" : ""}`} onClick={() => { if (demo) return; if (item.sourceLessonId) { setPlanLessonId(item.sourceLessonId); setTab("planning"); } else setItemEditor({ kind: "homework", id: item.id }); }}><div><b>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</b><small>{item.status}{typeof item.completionPercent === "number" ? ` · ${item.completionPercent}% complete` : ""}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.subject}{item.sourceTopic ? ` · ${item.sourceTopic}` : ""}{item.followUp && item.followUp !== "None" ? ` · Follow-up: ${item.followUp}` : ""}{item.priority === "High" ? " · High priority" : ""}</span></div><span className="ttRowAction">{demo ? "Demo" : item.sourceLessonId ? "Open lesson" : "Edit"}</span></button>)}{!active.homework.length && <div className="ttEmptyPreview"><span>No homework tasks yet.</span></div>}</div></section>}

      {tab === "workload" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">WORKLOAD</span><h2>Practical prep & teacher tasks</h2></div><div className="ttWorkspaceActions">{!demo && <><button className="ttButton" onClick={() => setItemEditor({ kind: "prep" })}>+ Prep</button><button className="ttButton primary" onClick={() => setItemEditor({ kind: "task" })}>+ Task</button></>}</div></div><div className="ttKpiGrid"><div><small>Open prep</small><strong>{openPrep.length}</strong></div><div><small>Overdue prep</small><strong>{overduePrep.length}</strong></div><div><small>Open tasks</small><strong>{openTasks.length}</strong></div><div><small>Homework follow-up</small><strong>{followUpHomework.length}</strong></div><div><small>Next free slot</small><strong className="smallStrong">{nextFreeSlot()}</strong></div></div><div className="ttSplitGrid"><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Practical prep</h2></div></div><div className="ttDataList">{active.prep.map((item) => <button className={`ttDataRow compactRow ${item.priority === "High" || (item.neededBy < today && item.status !== "Done") ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "prep", id: item.id })}><div><b>{formatDate(item.neededBy)}</b><small>{item.status}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.room || item.subject}</span></div></button>)}{!active.prep.length && <div className="ttEmptyPreview"><span>No prep items yet.</span></div>}</div></article><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Teacher tasks</h2></div></div><div className="ttDataList">{active.tasks.map((item) => <button className={`ttDataRow compactRow ${item.date < today && item.status !== "Done" ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "task", id: item.id })}><div><b>{formatDate(item.date)}</b><small>{item.period || "Unscheduled"}</small></div><div><strong>{item.title}</strong><span>{item.type} · {item.status}</span></div></button>)}{!active.tasks.length && <div className="ttEmptyPreview"><span>No teacher tasks yet.</span></div>}</div></article></div></section>}

      {tab === "changes" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">CHANGES & COVER</span><h2>Timetable changes</h2><p className="ttMuted">Record cancellations, room changes, cover and one-off notes without changing the normal timetable.</p></div>{!demo && <button className="ttButton primary" onClick={() => setItemEditor({ kind: "change" })}>+ Add change</button>}</div><div className="ttDataList">{active.changes.slice().sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map((item) => { const lesson = active.lessons.find((lesson) => lesson.id === item.lessonId); return <button className={`ttDataRow ${item.type === "Cancelled" ? "urgent" : ""}`} key={item.id} onClick={() => !demo && setItemEditor({ kind: "change", id: item.id })}><div><b>{formatDate(item.date)}</b><small>{item.type}</small></div><div><strong>{lesson ? `${lesson.week} · ${lesson.day} · P${lesson.period} · ${lesson.className}` : "Lesson"}</strong><span>{[item.room,item.detail,item.notes].filter(Boolean).join(" · ") || "No extra detail"}</span></div></button>; })}{!active.changes.length && <div className="ttEmptyPreview"><span>No timetable changes recorded.</span></div>}</div></section>}

      {tab === "tools" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">TOOLS & BACKUP</span><h2>Workspace tools</h2></div></div><div className="ttToolsGrid"><article className="ttPanel"><h2>Backup</h2><p>Export your full timetable workspace, including lesson plans, homework, prep, tasks and changes.</p><div className="ttButtonRow"><button className="ttButton primary" onClick={exportBackup}>Export backup</button><input ref={backupRef} className="ttFileInput" type="file" accept="application/json,.json" onChange={importBackup} /><button className="ttButton" disabled={demo} onClick={() => backupRef.current?.click()}>Restore backup</button></div></article><article className="ttPanel"><h2>Key dates</h2><p>{nextKeyDate ? `Next: ${nextKeyDate.title} · ${formatDate(nextKeyDate.date)}` : "Add half terms, training days, deadlines or events."}</p>{!demo && <button className="ttButton" onClick={() => setItemEditor({ kind: "keyDate" })}>+ Add key date</button>}<div className="ttStackList">{active.keyDates.slice().sort((a,b)=>a.date.localeCompare(b.date)).map((item) => <button className="ttAgendaRow" key={item.id} onClick={() => !demo && setItemEditor({ kind: "keyDate", id: item.id })}><b>{item.title}</b><span>{formatDate(item.date)} · {item.type}</span></button>)}</div></article><article className="ttPanel"><h2>Connected CPD tools</h2><div className="ttIntegrationLinks"><Link href="/curriculum">Curriculum planning</Link><Link href="/resource-generator">Teaching resource generator</Link><Link href="/teaching-learning">Teaching & Learning Hub</Link><Link href="/calendar">School calendar</Link><Link href="/integrations">Google integrations</Link></div></article><article className="ttPanel"><h2>Workspace status</h2><p>{status}</p><div className="ttButtonRow"><button className="ttButton" onClick={printTimetable}>Print timetable</button><button className="ttButton danger" onClick={clearTimetable}>{demo ? "Exit demo" : "Clear workspace"}</button></div></article></div></section>}

      {editorOpen && <LessonEditor form={form} setForm={setForm} editing={Boolean(editingId)} onClose={() => setEditorOpen(false)} onDelete={deleteLesson} onSave={saveLesson} />}
      {activePlanLesson && <PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} inclusionProfile={active.classInclusionProfiles[activePlanLesson.className]} homework={active.homework} readOnly={demo} onHomeworkChange={(homework) => mutate((current) => ({ ...current, homework }))} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}
      {itemEditor && <ItemEditor kind={itemEditor.kind} itemId={itemEditor.id} workspace={workspace} activeWorkspace={active} week={week} classes={classes} subjects={subjects} onClose={() => setItemEditor(null)} onChange={setWorkspace} />}
    </main>
  );
}

function LessonEditor({ form, setForm, editing, onClose, onDelete, onSave }: { form: { week: WeekKey; day: DayName; period: number; subject: string; className: string; room: string; notes: string }; setForm: React.Dispatch<React.SetStateAction<{ week: WeekKey; day: DayName; period: number; subject: string; className: string; room: string; notes: string }>>; editing: boolean; onClose: () => void; onDelete: () => void; onSave: () => void }) {
  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">PERSONAL TIMETABLE</span><h2>{editing ? "Edit lesson" : "Add lesson"}</h2></div><button className="ttIconButton" onClick={onClose}>×</button></div><div className="ttFormGrid"><label><span>Week</span><select value={form.week} onChange={(event) => setForm((current) => ({ ...current, week: event.target.value as WeekKey }))}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label><label><span>Day</span><select value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value as DayName }))}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label><label><span>Period</span><select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: Number(event.target.value) }))}>{PERIODS.map((period) => <option key={period.period} value={period.period}>P{period.period} · {period.start}–{period.end}</option>)}</select></label><label><span>Subject</span><input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} /></label><label><span>Class / group</span><input value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} /></label><label><span>Room</span><input value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} /></label><label className="wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label></div><div className="ttModalActions">{editing && <button className="ttButton danger pushLeft" onClick={onDelete}>Delete</button>}<button className="ttButton" onClick={onClose}>Cancel</button><button className="ttButton primary" onClick={onSave}>Save lesson</button></div></section></div>;
}

function PlanEditor({ lesson, homework, readOnly, onHomeworkChange, onClose, onSave, classProfile, inclusionProfile }: { lesson: Lesson; homework: Homework[]; readOnly: boolean; onHomeworkChange: (homework: Homework[]) => void; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile; inclusionProfile?: ClassInclusionProfile }) {
  const [plan, setPlan] = useState<LessonPlan>({ ...blankPlan(), ...lesson.plan, planningMode: lesson.plan?.planningMode || "simple" });
  const inferred = classProfile || inferClassCurriculumProfile(lesson.className, lesson.subject);
  const [stage, setStage] = useState<ClassCurriculumProfile["stage"]>((phase1Stages.includes(plan.curriculumStage as ClassCurriculumProfile["stage"]) ? plan.curriculumStage : inferred.stage) as ClassCurriculumProfile["stage"]);
  const initialBoard = (plan.examBoard || inferred.examBoard) as ClassCurriculumProfile["examBoard"];
  const [examBoard, setExamBoard] = useState<ClassCurriculumProfile["examBoard"]>(initialBoard);
  const initialSubject = (plan.curriculumSubject || inferred.subject) as ClassCurriculumProfile["subject"];
  const [subject, setSubject] = useState<ClassCurriculumProfile["subject"]>(initialSubject);
  const initialCourses = getPhase1Courses(stage, initialBoard, initialSubject);
  const [courseId, setCourseId] = useState(plan.courseId || inferred.courseId || initialCourses[0]?.id || "");
  const initialUnits = getPhase1Units(plan.courseId || inferred.courseId || initialCourses[0]?.id || "");
  const initialUnit = initialUnits.find((item) => item.title === plan.curriculumUnit) || initialUnits[0];
  const [unitId, setUnitId] = useState(initialUnit?.id || "");
  const initialSubtopics = getPhase1Subtopics(plan.courseId || inferred.courseId || initialCourses[0]?.id || "", initialUnit?.id || "");
  const initialSubtopic = initialSubtopics.find((item) => item.title === plan.curriculumSubtopic) || initialSubtopics[0];
  const [subtopicId, setSubtopicId] = useState(initialSubtopic?.id || "");
  const [lessonIndex, setLessonIndex] = useState(Math.max(0, plan.sequencePosition || 0));
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationSource, setGenerationSource] = useState<"ai" | "template" | "">("");
  const [teacherRequirements, setTeacherRequirements] = useState("");

  const boards = getPhase1ExamBoards(stage);
  const subjects = getPhase1Subjects(stage, examBoard);
  const courses = getPhase1Courses(stage, examBoard, subject);
  const units = getPhase1Units(courseId);
  const subtopics = getPhase1Subtopics(courseId, unitId);
  const lessons = getPhase1Lessons(courseId, unitId, subtopicId);
  const selectedCourse = getPhase1Course(courseId);
  const selectedUnit = units.find((item) => item.id === unitId);
  const selectedSubtopic = subtopics.find((item) => item.id === subtopicId);
  const selectedTemplate = lessons[Math.min(lessonIndex, Math.max(lessons.length - 1, 0))];
  const detailedKeys: (keyof LessonPlan)[] = ["priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","assessment","examPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","reflection"];
  const detailedComplete = detailedKeys.filter((key) => String(plan[key] || "").trim()).length;

  const field = (key: keyof LessonPlan, label: string, multiline = false, placeholder = "", className = "") => <label className={`${multiline ? "wide" : ""} ${className}`.trim()}><span>{label}</span>{multiline ? <textarea disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /> : <input disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />}</label>;

  function resetFor(nextStage: ClassCurriculumProfile["stage"], nextBoard: ClassCurriculumProfile["examBoard"], nextSubject: ClassCurriculumProfile["subject"]) {
    setStage(nextStage); setExamBoard(nextBoard); setSubject(nextSubject); const nextCourse = getPhase1Courses(nextStage, nextBoard, nextSubject)[0]; setCourseId(nextCourse?.id || ""); const nextUnit = nextCourse?.units[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0);
  }
  function changeStage(next: ClassCurriculumProfile["stage"]) { const board = getPhase1ExamBoards(next)[0]; resetFor(next, board, getPhase1Subjects(next, board)[0] || "Science"); }
  function changeBoard(next: ClassCurriculumProfile["examBoard"]) { resetFor(stage, next, getPhase1Subjects(stage, next)[0] || subject); }
  function changeSubject(next: ClassCurriculumProfile["subject"]) { resetFor(stage, examBoard, next); }
  function changeCourse(next: string) { setCourseId(next); const nextUnit = getPhase1Units(next)[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0); }
  function changeUnit(next: string) { setUnitId(next); setSubtopicId(getPhase1Subtopics(courseId, next)[0]?.id || ""); setLessonIndex(0); }
  function changeSubtopic(next: string) { setSubtopicId(next); setLessonIndex(0); }

  function detailedDefaults(topic: string, objectives: string, vocabulary: string) {
    const focus = topic || "the lesson focus";
    return {
      priorKnowledge: `Identify the prerequisite knowledge pupils need before ${focus}. Link back to the most relevant previous learning.`,
      retrieval: `3–5 short retrieval questions on prerequisite knowledge for ${focus}. Include one question that checks a likely prerequisite misconception.`,
      misconceptions: `Anticipate the most likely misconceptions about ${focus}. Plan one check that exposes each misconception before independent practice.`,
      teacherExplanation: objectives ? `Explicitly explain and chunk the core knowledge needed to meet: ${objectives}` : `Explicitly explain and chunk the core knowledge for ${focus}.`,
      modelling: `Model one high-quality example for ${focus}. Think aloud, make decisions visible and annotate the success criteria.`,
      guidedPractice: `Complete a scaffolded example together. Use targeted questioning, then gradually remove prompts as pupils become more secure.`,
      independentPractice: `Pupils apply ${focus} independently. Start with a core task, then increase challenge while checking for accuracy and understanding.`,
      sendEalAdaptations: `Reduce unnecessary language/cognitive load without reducing the core learning: chunk instructions, pre-teach key vocabulary${vocabulary ? ` (${vocabulary})` : ""}, provide a model/visual, allow processing time and check understanding discreetly.`,
      stretchChallenge: `Require deeper explanation, justification, comparison or transfer of ${focus} to an unfamiliar context rather than simply adding more work.`,
      homeworkTask: `Set a short task that consolidates ${focus} and includes retrieval from earlier learning.`,
      exitTicket: `Use 2–3 questions that directly test the lesson objectives for ${focus}, including one item that reveals the key misconception.`,
    };
  }

  function buildDetailedStructure() {
    const defaults = detailedDefaults(plan.topic || selectedTemplate?.title || "", plan.objectives || selectedTemplate?.objectives || "", plan.vocabulary || selectedTemplate?.vocabulary || "");
    setPlan((current) => ({
      ...current,
      planningMode: "detailed",
      priorKnowledge: current.priorKnowledge || defaults.priorKnowledge,
      retrieval: current.retrieval || defaults.retrieval,
      misconceptions: current.misconceptions || defaults.misconceptions,
      teacherExplanation: current.teacherExplanation || defaults.teacherExplanation,
      modelling: current.modelling || defaults.modelling,
      guidedPractice: current.guidedPractice || defaults.guidedPractice,
      independentPractice: current.independentPractice || defaults.independentPractice,
      sendEalAdaptations: current.sendEalAdaptations || defaults.sendEalAdaptations,
      stretchChallenge: current.stretchChallenge || defaults.stretchChallenge,
      homeworkTask: current.homeworkTask || defaults.homeworkTask,
      exitTicket: current.exitTicket || defaults.exitTicket,
    }));
  }

  async function generateFullLesson(overwrite = false) {
    if (readOnly || generatingLesson) return;
    const topic = (plan.topic || selectedTemplate?.title || "").trim();
    if (!topic) { setGenerationMessage("Choose a curriculum lesson or enter a lesson topic first."); return; }
    if (overwrite && !window.confirm("Regenerate the structured lesson sections? This will replace existing objectives, vocabulary, sequence and detailed planning fields. Your curriculum selection, resources, notes and reflection will be kept.")) return;

    setGeneratingLesson(true);
    setGenerationMessage("Building a complete 55-minute lesson…");
    setGenerationSource("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sign in again before generating a lesson.");

      const response = await fetch("/api/lesson-generator", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: lesson.subject || subject,
          className: lesson.className,
          stage,
          examBoard,
          course: selectedCourse?.title || courseId,
          unit: selectedUnit?.title || plan.curriculumUnit,
          subtopic: selectedSubtopic?.title || plan.curriculumSubtopic,
          topic,
          objectives: plan.objectives || selectedTemplate?.objectives || "",
          vocabulary: plan.vocabulary || selectedTemplate?.vocabulary || "",
          teacherRequirements,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { lesson?: GeneratedLessonPlan; source?: "ai" | "template"; error?: string };
      if (!response.ok || !payload.lesson) throw new Error(payload.error || "The lesson could not be generated.");
      const generated = payload.lesson;
      const generatedKeys: (keyof GeneratedLessonPlan)[] = ["objectives","vocabulary","priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","assessment","examPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","sequence"];

      setPlan((current) => {
        const next = { ...current, planningMode: "detailed" as const, topic: current.topic || topic };
        generatedKeys.forEach((key) => {
          if (overwrite || !String(current[key] || "").trim()) next[key] = generated[key];
        });
        return next;
      });
      const source = payload.source === "ai" ? "ai" : "template";
      setGenerationSource(source);
      setGenerationMessage(source === "ai" ? "Lesson generated. Review and edit each section before saving." : "AI was unavailable, so a classroom-ready built-in lesson structure was used. Review and edit before saving.");
    } catch (error) {
      setGenerationMessage(error instanceof Error ? error.message : "The lesson could not be generated.");
    } finally {
      setGeneratingLesson(false);
    }
  }

  function applySuggestedLesson() {
    if (!selectedTemplate || !selectedCourse || !selectedUnit || !selectedSubtopic) return;
    const courseSequence = getCourseLessonSequence({ stage, examBoard, subject, courseId });
    const sequencePosition = courseSequence.findIndex((item) => item.unitId === unitId && item.subtopicId === subtopicId && item.title === selectedTemplate.title);
    setPlan((current) => ({ ...current, curriculumStage: stage, curriculumSubject: subject, curriculumUnit: selectedUnit.title, curriculumSubtopic: selectedSubtopic.title, examBoard, courseId, sequencePosition, topic: selectedTemplate.title, vocabulary: selectedTemplate.vocabulary, objectives: selectedTemplate.objectives, sequence: selectedTemplate.sequence, assessment: selectedTemplate.assessment }));
  }

  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal ttPlanModal ttPhase3PlanModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">LESSON PLANNING · PHASES 4–5, 8, 11–13</span><h2>{lesson.subject} · {lesson.className}</h2><p>{lesson.week} · {lesson.day} · P{lesson.period} · {lesson.room}</p></div><button className="ttIconButton" onClick={onClose}>×</button></div>
    <div className="ttPlanModeBar"><div className="ttPlanModeSwitch"><button type="button" className={plan.planningMode === "simple" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "simple" }))}>Simple</button><button type="button" className={plan.planningMode === "detailed" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "detailed" }))}>Detailed</button></div><div className="ttPlanCompletion"><span>Detailed plan</span><b>{detailedComplete}/{detailedKeys.length}</b><i><em style={{ width: `${Math.round(detailedComplete / detailedKeys.length * 100)}%` }} /></i></div>{!readOnly && <button type="button" className="ttButton" onClick={buildDetailedStructure}>Build detailed structure</button>}</div>
    <section className="ttLessonGenerator"><div className="ttLessonGeneratorHead"><div><span className="staffTimetableEyebrow">ONE-CLICK LESSON GENERATION</span><h3>Generate the full lesson</h3><p>Build an editable 55-minute lesson from the selected curriculum topic, including retrieval, explanation, modelling, practice, checks, exam-style application, homework, adaptations and exit ticket.</p></div><span className={`ttGeneratorBadge ${generationSource || "ready"}`}>{generatingLesson ? "Generating…" : generationSource === "ai" ? "AI generated" : generationSource === "template" ? "Built-in fallback" : "Ready"}</span></div><label className="ttGeneratorRequirements"><span>Optional teacher requirements</span><textarea disabled={readOnly || generatingLesson} value={teacherRequirements} onChange={(event) => setTeacherRequirements(event.target.value)} placeholder="e.g. practical lesson, stronger exam technique focus, include paired discussion, keep independent task to 15 minutes…" /></label><div className="ttGeneratorActions">{!readOnly && <><button type="button" className="ttButton primary" disabled={generatingLesson || !(plan.topic || selectedTemplate?.title)} onClick={() => generateFullLesson(false)}>{generatingLesson ? "Generating lesson…" : "Generate full lesson"}</button><button type="button" className="ttButton" disabled={generatingLesson || !(plan.topic || selectedTemplate?.title)} onClick={() => generateFullLesson(true)}>Regenerate planning sections</button></>}<span>{generationMessage || "Generation fills blank sections by default, so existing teacher edits are preserved."}</span></div><div className="ttGeneratorNote"><b>Teacher review required.</b><span>Generated content is a planning draft, not an official exam-board resource or mark scheme. Check subject accuracy, suitability and timings before teaching.</span></div></section>
    <section className="ttCurriculumPicker"><div className="ttCurriculumPickerHead"><div><strong>Curriculum lesson bank</strong><span>{classProfile ? `Class profile: ${profileLabel(classProfile)}. ` : ""}Choose the unit, sub-topic and lesson to pre-fill this plan.</span></div>{selectedTemplate && !readOnly && <button className="ttButton primary" onClick={applySuggestedLesson}>Use suggested lesson</button>}</div><div className="ttPhase1PickerGrid">
      <label><span>Key Stage</span><select disabled={readOnly} value={stage} onChange={(event) => changeStage(event.target.value as ClassCurriculumProfile["stage"])}>{phase1Stages.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Exam board</span><select disabled={readOnly} value={examBoard} onChange={(event) => changeBoard(event.target.value as ClassCurriculumProfile["examBoard"])}>{boards.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Subject</span><select disabled={readOnly} value={subject} onChange={(event) => changeSubject(event.target.value as ClassCurriculumProfile["subject"])}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Course</span><select disabled={readOnly} value={courseId} onChange={(event) => changeCourse(event.target.value)}>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}{item.code && item.code !== "KS3" ? ` · ${item.code}` : ""}</option>)}</select></label>
      <label><span>Unit</span><select disabled={readOnly} value={unitId} onChange={(event) => changeUnit(event.target.value)}>{units.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label><span>Sub-topic</span><select disabled={readOnly} value={subtopicId} onChange={(event) => changeSubtopic(event.target.value)}>{subtopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="wide"><span>Lesson sequence</span><select disabled={readOnly || !lessons.length} value={Math.min(lessonIndex, Math.max(lessons.length - 1, 0))} onChange={(event) => setLessonIndex(Number(event.target.value))}>{lessons.length ? lessons.map((item, index) => <option key={`${item.id}-${index}`} value={index}>{index + 1}. {item.title}</option>) : <option value={0}>No lessons in this selection</option>}</select></label>
    </div>{selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}</section>
    <StaffTimetableLessonResources
      context={{
        subject: lesson.subject || subject,
        className: lesson.className,
        stage,
        examBoard,
        course: selectedCourse?.title || courseId,
        unit: selectedUnit?.title || plan.curriculumUnit,
        subtopic: selectedSubtopic?.title || plan.curriculumSubtopic,
        topic: plan.topic || selectedTemplate?.title || "",
        objectives: plan.objectives || selectedTemplate?.objectives || "",
        vocabulary: plan.vocabulary || selectedTemplate?.vocabulary || "",
        sequence: plan.sequence || selectedTemplate?.sequence || "",
        assessment: plan.assessment || selectedTemplate?.assessment || "",
        retrieval: plan.retrieval,
        misconceptions: plan.misconceptions,
        examPractice: plan.examPractice,
      }}
      resources={plan.generatedResources || []}
      readOnly={readOnly}
      onChange={(generatedResources) => setPlan((current) => ({ ...current, generatedResources }))}
    />
    <StaffTimetableLessonHomework
      lesson={{ id: lesson.id, className: lesson.className, subject: lesson.subject, lessonDate: plan.lessonDate, topic: plan.topic || selectedTemplate?.title || "", homeworkTask: plan.homeworkTask, courseId: plan.courseId || courseId, sequencePosition: plan.sequencePosition, curriculumUnit: plan.curriculumUnit || selectedUnit?.title || "", curriculumSubtopic: plan.curriculumSubtopic || selectedSubtopic?.title || "" }}
      homework={homework}
      readOnly={readOnly}
      onChange={onHomeworkChange}
    />
    <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>1</span><div><h3>Core lesson</h3><p>The essentials shown in both planning modes.</p></div></div><div className="ttFormGrid"><label><span>Lesson date</span><input type="date" disabled={readOnly} value={plan.lessonDate} onChange={(event) => setPlan((current) => ({ ...current, lessonDate: event.target.value }))} /></label>{field("topic","Topic / lesson title")}{field("objectives","Learning objectives",true,"What should pupils know, understand or be able to do?")}{field("vocabulary","Key vocabulary",true,"Subject-specific language pupils need to understand and use")}{field("sequence","Lesson content / sequence",true,"Starter → explanation/model → practice → review")}{field("assessment","Checks for understanding",true,"Hinge questions, cold call, mini-whiteboards, exam question, exit ticket…")}{field("resources","Resources / links",true,"Slides, worksheet, textbook pages, equipment, links…")}{field("teacherNotes","Teacher notes",true,"Reminders, class-specific logistics or follow-up")}</div></section>
    {plan.planningMode === "detailed" && <div className="ttDetailedPlan">
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>2</span><div><h3>Connect to prior learning</h3><p>Make prerequisites and retrieval explicit before new learning.</p></div></div><div className="ttFormGrid">{field("priorKnowledge","Prior knowledge",true,"What must pupils already know or be able to do?")}{field("retrieval","Retrieval starter",true,"3–5 short questions or prompts")}{field("misconceptions","Likely misconceptions",true,"What wrong ideas or errors are most likely, and how will you expose them?")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>3</span><div><h3>Teach and model</h3><p>Plan the explanation and make expert thinking visible.</p></div></div><div className="ttFormGrid">{field("teacherExplanation","Teacher explanation",true,"Chunk the new knowledge and identify the key explanation points")}{field("modelling","Worked example / modelling",true,"What will you model and what thinking will you narrate?")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>4</span><div><h3>Practise and check</h3><p>Move from supported practice toward independent application.</p></div></div><div className="ttFormGrid">{field("guidedPractice","Guided practice",true,"Scaffolded examples, questioning and supported rehearsal")}{field("independentPractice","Independent practice",true,"What will pupils do independently to secure the learning?")}{field("assessment","Checks / hinge questions",true,"Diagnostic questions that determine whether to move on or reteach")}{field("examPractice","Exam-style application",true,"An age-appropriate application or exam-style question with teacher success criteria")}{field("exitTicket","Exit ticket",true,"2–3 final questions directly aligned to the objectives")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>5</span><div><h3>Access and challenge</h3><p>Support access to the same core learning and plan purposeful stretch.</p></div></div><div className="ttFormGrid">{field("sendEalAdaptations","SEND / EAL adaptations",true,"Chunking, visuals, vocabulary, modelling, processing time, accessible task design…")}{field("stretchChallenge","Stretch / challenge",true,"Deeper explanation, evaluation, transfer or unfamiliar application")}</div><div className="ttInclusionNote"><b>Keep this lesson-focused.</b><span>Use approved school systems for individual pupil plans, medical information or sensitive records.</span></div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>6</span><div><h3>Consolidate and reflect</h3><p>Close the learning loop without creating unnecessary planning workload.</p></div></div><div className="ttFormGrid">{field("homeworkTask","Homework / consolidation",true,"A short consolidation or retrieval task linked to this lesson")}{field("reflection","Teacher reflection",true,"What worked? What needs revisiting? What should change next time?")}</div></section>
    </div>}
    {buildClassSupportText(inclusionProfile) && <section className="ttLessonClassSupport"><div><span>PHASE 12 · CLASS ACCESS</span><strong>Generic class support is available</strong><small>Apply the class profile to SEND / EAL adaptations without storing individual pupil information here.</small></div><button type="button" className="ttButton" disabled={readOnly} onClick={() => { const support = buildClassSupportText(inclusionProfile); setPlan((current) => ({ ...current, planningMode: "detailed", sendEalAdaptations: current.sendEalAdaptations.includes(support) ? current.sendEalAdaptations : [current.sendEalAdaptations, support].filter(Boolean).join("\n\n") })); }}>Apply class support</button></section>}
    <StaffTimetableLessonReflection
      outcome={plan.reflectionOutcome}
      note={plan.reflectionNote}
      updatedAt={plan.reflectionUpdatedAt}
      readOnly={readOnly}
      onChange={({ outcome, note, updatedAt }) => setPlan((current) => ({ ...current, reflectionOutcome: outcome, reflectionNote: note, reflectionUpdatedAt: updatedAt, reflection: note || current.reflection }))}
    />
    <div className="ttModalActions ttStickyPlanActions"><button className="ttButton" onClick={onClose}>Close</button>{!readOnly && <button className="ttButton primary" onClick={() => onSave(plan)}>Save lesson plan</button>}</div></section></div>;
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
