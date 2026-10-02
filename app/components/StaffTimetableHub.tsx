"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "./StaffTimetableHub.css";

type WeekKey = "W1" | "W2";
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

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
};

type ImportResult = {
  lessons: Lesson[];
  source: string;
};

type PdfTextItem = { str?: string; transform?: number[] };
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (input: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (page: number) => Promise<{
        getTextContent: () => Promise<{ items: PdfTextItem[] }>;
      }>;
    }>;
  };
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

const STORAGE_KEY = "teaching-cpd-personal-staff-timetable-v1";

type DemoTuple = [WeekKey, DayName, number, string, string, string];
const DEMO_DATA: DemoTuple[] = [
  ["W1","Wednesday",1,"Science","Y11 Science C","Physics Lab"],
  ["W1","Thursday",1,"Biology","Y10 Biology","Physics Lab"],
  ["W1","Friday",1,"Maths","Y10 Mathematics G","Physics Lab"],
  ["W1","Monday",2,"Science","Y9 Science J","Physics Lab"],
  ["W1","Tuesday",2,"Science","Y11 Science C","Physics Lab"],
  ["W1","Wednesday",2,"Physics","Y11 Physics A","Physics Lab"],
  ["W1","Thursday",2,"Physics","Y10 Physics","Physics Lab"],
  ["W1","Friday",2,"Geography","Y7 Geography","Geography Room"],
  ["W1","Monday",3,"Biology","Y10 Biology","Physics Lab"],
  ["W1","Tuesday",3,"Science","Y11 Science D","Science Lab"],
  ["W1","Wednesday",3,"Physics","Y11 Physics A","Physics Lab"],
  ["W1","Thursday",3,"Physics","Y10 Physics","Physics Lab"],
  ["W1","Monday",4,"Biology","Y10 Biology","Physics Lab"],
  ["W1","Tuesday",4,"Physics","Y13 Physics","Physics Lab"],
  ["W1","Wednesday",4,"Physics","Y12 Physics","Physics Lab"],
  ["W1","Friday",4,"Physics","Y10 Physics","Physics Lab"],
  ["W1","Monday",5,"Science","Y11 Science C","Physics Lab"],
  ["W1","Tuesday",5,"Physics","Y13 Physics","Physics Lab"],
  ["W1","Wednesday",5,"Physics","Y12 Physics","Physics Lab"],
  ["W1","Monday",6,"Science","Y11 Science D","Science Lab"],
  ["W1","Tuesday",6,"Physics","Y13 Physics","Physics Lab"],
  ["W1","Wednesday",6,"Physics","Y12 Physics","Physics Lab"],
  ["W2","Monday",1,"Physics","Y13 Physics","Physics Lab"],
  ["W2","Tuesday",1,"Science","Y11 Science C","Physics Lab"],
  ["W2","Wednesday",1,"Physics","Y11 Physics A","Physics Lab"],
  ["W2","Friday",1,"Maths","Y10 Mathematics G","Physics Lab"],
  ["W2","Monday",2,"Physics","Y13 Physics","Physics Lab"],
  ["W2","Tuesday",2,"Science","Y11 Science D","Science Lab"],
  ["W2","Wednesday",2,"Physics","Y11 Physics A","Physics Lab"],
  ["W2","Friday",2,"Science","Y7 Science","Physics Lab"],
  ["W2","Monday",3,"Physics","Y10 Physics","Physics Lab"],
  ["W2","Tuesday",3,"Science","Y11 Science D","Science Lab"],
  ["W2","Wednesday",3,"Science","Y11 Science D","Science Lab"],
  ["W2","Friday",3,"Science","Y9 Science J","Physics Lab"],
  ["W2","Monday",4,"Science","Y11 Science C","Physics Lab"],
  ["W2","Tuesday",4,"Physics","Y11 Physics A","Physics Lab"],
  ["W2","Wednesday",4,"Physics","Y12 Physics","Physics Lab"],
  ["W2","Friday",4,"Physics","Y10 Physics","Physics Lab"],
  ["W2","Monday",5,"Biology","Y10 Biology","Physics Lab"],
  ["W2","Tuesday",5,"Physics","Y13 Physics","Physics Lab"],
  ["W2","Wednesday",5,"Physics","Y12 Physics","Physics Lab"],
  ["W2","Friday",5,"Maths","Y10 Mathematics G","Physics Lab"],
  ["W2","Monday",6,"Biology","Y10 Biology","Physics Lab"],
  ["W2","Tuesday",6,"Physics","Y13 Physics","Physics Lab"],
  ["W2","Wednesday",6,"Physics","Y12 Physics","Physics Lab"],
  ["W2","Friday",6,"Maths","Y10 Mathematics G","Physics Lab"],
];

function periodTimes(period: number) {
  const match = PERIODS.find((item) => item.period === period) || PERIODS[0];
  return { start: match.start, end: match.end };
}

function createLesson(input: Omit<Lesson, "id" | "start" | "end"> & { id?: string; start?: string; end?: string }): Lesson {
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
  };
}

const DEMO_LESSONS: Lesson[] = DEMO_DATA.map(([week, day, period, subject, className, room], index) =>
  createLesson({ id: `demo_${index + 1}`, week, day, period, subject, className, room, notes: "" }),
);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function asWeek(value: unknown): WeekKey {
  const text = clean(value).toLowerCase();
  return text.includes("2") || text === "w2" ? "W2" : "W1";
}

function asDay(value: unknown): DayName | null {
  const text = clean(value).toLowerCase();
  return DAYS.find((day) => text === day.toLowerCase() || text.startsWith(day.slice(0, 3).toLowerCase())) || null;
}

function asPeriod(value: unknown, start?: string): number {
  const text = clean(value);
  const match = text.match(/([1-6])/);
  if (match) return Number(match[1]);
  const byStart = PERIODS.find((period) => period.start === clean(start));
  return byStart?.period || 1;
}

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
  return createLesson({
    id: `import_${Date.now()}_${index}`,
    week: asWeek(value.week ?? value.Week),
    day,
    period,
    start: start || times.start,
    end: clean(value.end ?? value.End) || times.end,
    subject: subject || "Lesson",
    className,
    room: clean(value.room ?? value.Room ?? value.location ?? value.Location),
    notes: clean(value.notes ?? value.Notes),
  });
}

function parseJson(text: string): Lesson[] {
  const parsed: unknown = JSON.parse(text);
  const candidate = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { lessons?: unknown[] }).lessons)
      ? (parsed as { lessons: unknown[] }).lessons
      : [];
  return dedupe(candidate.map((item, index) => item && typeof item === "object" ? normaliseImportedLesson(item as Record<string, unknown>, index) : null).filter((item): item is Lesson => Boolean(item)));
}

function splitDelimitedLine(line: string, delimiter: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { out.push(current.trim()); current = ""; continue; }
    current += char;
  }
  out.push(current.trim());
  return out;
}

function parseDelimited(text: string, delimiter: string): Lesson[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  const alias = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const positions = {
    week: alias(["week", "cycleweek", "cycle"]),
    day: alias(["day", "weekday"]),
    period: alias(["period", "lesson", "slot"]),
    start: alias(["start", "starttime", "time"]),
    end: alias(["end", "endtime"]),
    subject: alias(["subject", "lessonname"]),
    className: alias(["class", "classname", "group", "classgroup", "set"]),
    room: alias(["room", "location", "classroom"]),
    notes: alias(["notes", "note"]),
  };
  if (positions.day < 0 || (positions.subject < 0 && positions.className < 0)) return [];
  return dedupe(lines.slice(1).map((line, index) => {
    const row = splitDelimitedLine(line, delimiter);
    const value = (position: number) => position >= 0 ? row[position] : "";
    return normaliseImportedLesson({
      week: value(positions.week), day: value(positions.day), period: value(positions.period), start: value(positions.start), end: value(positions.end),
      subject: value(positions.subject), className: value(positions.className), room: value(positions.room), notes: value(positions.notes),
    }, index);
  }).filter((item): item is Lesson => Boolean(item)));
}

function parsePlainText(text: string): Lesson[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lessons: Lesson[] = [];
  let week: WeekKey = "W1";
  let day: DayName | null = null;
  let period = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/week\s*2|\[w2\]/i.test(line)) { week = "W2"; continue; }
    if (/week\s*1|\[w1\]/i.test(line)) { week = "W1"; continue; }
    const nextDay = asDay(line);
    if (nextDay && DAYS.some((candidate) => candidate.toLowerCase() === line.toLowerCase())) { day = nextDay; continue; }
    const periodMatch = line.match(/^P\s*([1-6])$/i);
    if (periodMatch) { period = Number(periodMatch[1]); continue; }
    const timeMatch = line.match(/^(08:55|09:55|11:10|12:10|14:05|15:05)/);
    if (timeMatch) { period = asPeriod("", timeMatch[1]); continue; }
    if (!day || !period) continue;
    if (/^off\s*site$/i.test(line)) continue;
    if (/^Y\d|^Year\s*\d|^CCF|^Form|^Tutor/i.test(line)) {
      const className = line;
      let subject = inferSubject(className);
      let room = "";
      const next = lines[i + 1] || "";
      if (next && !asDay(next) && !/^P\s*[1-6]$/i.test(next) && !/^\d{2}:\d{2}/.test(next)) { subject = next; i += 1; }
      const possibleRoom = lines[i + 1] || "";
      if (possibleRoom && !asDay(possibleRoom) && !/^P\s*[1-6]$/i.test(possibleRoom) && !/^\d{2}:\d{2}/.test(possibleRoom) && !/week\s*[12]/i.test(possibleRoom)) { room = possibleRoom; i += 1; }
      lessons.push(createLesson({ week, day, period, subject, className, room, notes: "Imported timetable" }));
    }
  }
  return dedupe(lessons);
}

function getPdfJsFromWindow() {
  return (window as unknown as { pdfjsLib?: PdfJs }).pdfjsLib;
}

function loadPdfJs(): Promise<PdfJs> {
  return new Promise((resolve, reject) => {
    const existing = getPdfJsFromWindow();
    if (existing) { resolve(existing); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = getPdfJsFromWindow();
      if (!lib) { reject(new Error("The PDF reader could not start.")); return; }
      lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(lib);
    };
    script.onerror = () => reject(new Error("The PDF reader could not load. Try CSV, text or JSON instead."));
    document.head.appendChild(script);
  });
}

async function parsePdf(file: File): Promise<Lesson[]> {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const lessons: Lesson[] = [];
  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 4); pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const items = content.items.map((item) => ({
      text: clean(item.str),
      x: Number(item.transform?.[4] || 0),
      y: Number(item.transform?.[5] || 0),
    })).filter((item) => item.text);
    const joined = items.map((item) => item.text).join(" ");
    const weekMatch = joined.match(/Week\s*([12])\s*\[W[12]\]/i) || joined.match(/\bWeek\s*([12])\b/i);
    const week: WeekKey | null = weekMatch ? (weekMatch[1] === "2" ? "W2" : "W1") : (pdf.numPages === 2 ? (pageNo === 2 ? "W2" : "W1") : null);
    if (!week) continue;

    const dayXs = new Map<DayName, number>();
    DAYS.forEach((day) => {
      const found = items.find((item) => item.text.toLowerCase() === day.toLowerCase());
      if (found) dayXs.set(day, found.x);
    });
    if (dayXs.size < 4) continue;

    const periodYs = new Map<number, number>();
    PERIODS.forEach(({ period, start }) => {
      const label = items.find((item) => item.text.replace(/\s/g, "").toUpperCase() === `P${period}`);
      const time = items.find((item) => item.text.startsWith(start));
      if (label || time) periodYs.set(period, (label || time)!.y);
    });
    if (periodYs.size < 4) continue;

    const cells = new Map<string, { text: string; x: number; y: number }[]>();
    const excluded = new Set<string>([...DAYS, ...PERIODS.flatMap((period) => [`P${period.period}`, period.start, period.end])]);
    items.forEach((item) => {
      if (excluded.has(item.text) || /week\s/i.test(item.text) || /timetable|printed by|isams|eprep/i.test(item.text)) return;
      const dayEntries = [...dayXs.entries()];
      const nearestDay = dayEntries.sort((a, b) => Math.abs(item.x - a[1]) - Math.abs(item.x - b[1]))[0];
      if (!nearestDay || Math.abs(item.x - nearestDay[1]) > 105) return;
      const periodEntries = [...periodYs.entries()];
      const nearestPeriod = periodEntries.sort((a, b) => Math.abs(item.y - a[1]) - Math.abs(item.y - b[1]))[0];
      if (!nearestPeriod || Math.abs(item.y - nearestPeriod[1]) > 46) return;
      const key = `${nearestDay[0]}|${nearestPeriod[0]}`;
      cells.set(key, [...(cells.get(key) || []), item]);
    });

    cells.forEach((cellItems, key) => {
      const [dayText, periodText] = key.split("|");
      const day = asDay(dayText);
      const period = Number(periodText);
      if (!day || !period) return;
      const values = [...new Set(cellItems.sort((a, b) => b.y - a.y || a.x - b.x).map((item) => item.text).filter(Boolean))]
        .filter((value) => !/^off\s*site$/i.test(value));
      if (!values.length) return;
      const classIndex = values.findIndex((value) => /^Y\d|^Year\s*\d|^CCF|^Form|^Tutor/i.test(value));
      if (classIndex < 0) return;
      const className = values[classIndex];
      const afterClass = values.slice(classIndex + 1);
      const subject = afterClass[0] || inferSubject(className);
      const room = afterClass.slice(1).join(" ");
      lessons.push(createLesson({ week, day, period, subject, className, room, notes: "Imported timetable" }));
    });
  }
  return dedupe(lessons);
}

function subjectTone(subject: string) {
  const key = subject.toLowerCase();
  if (key.includes("physics")) return "tone-blue";
  if (key.includes("biology")) return "tone-green";
  if (key.includes("chemistry")) return "tone-purple";
  if (key.includes("math")) return "tone-amber";
  if (key.includes("geography")) return "tone-teal";
  if (key.includes("science")) return "tone-cyan";
  return "tone-neutral";
}

export default function StaffTimetableHub() {
  const [week, setWeek] = useState<WeekKey>("W1");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [demo, setDemo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [status, setStatus] = useState("No timetable loaded yet.");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ week: "W1" as WeekKey, day: "Monday" as DayName, period: 1, subject: "", className: "", room: "", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lessons?: Lesson[]; week?: WeekKey };
        if (Array.isArray(parsed.lessons)) setLessons(parsed.lessons);
        if (parsed.week === "W1" || parsed.week === "W2") setWeek(parsed.week);
      }
    } catch (error) {
      console.warn("Could not restore staff timetable", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || demo) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lessons, week }));
  }, [lessons, week, loaded, demo]);

  const visibleLessons = demo ? DEMO_LESSONS : lessons;
  const weekLessons = useMemo(() => visibleLessons.filter((lesson) => lesson.week === week), [visibleLessons, week]);
  const teachingHours = useMemo(() => (weekLessons.length * 55 / 60).toFixed(1).replace(".0", ""), [weekLessons.length]);
  const freePeriods = 30 - weekLessons.length;
  const subjectCount = useMemo(() => new Set(weekLessons.map((lesson) => lesson.subject).filter(Boolean)).size, [weekLessons]);

  function lessonFor(day: DayName, period: number) {
    return weekLessons.find((lesson) => lesson.day === day && lesson.period === period);
  }

  function openEditor(day: DayName, period: number) {
    if (demo) return;
    const existing = lessonFor(day, period);
    setEditingId(existing?.id || null);
    setForm({
      week, day, period,
      subject: existing?.subject || "",
      className: existing?.className || "",
      room: existing?.room || "",
      notes: existing?.notes || "",
    });
    setEditorOpen(true);
  }

  function saveLesson() {
    if (!form.subject.trim() && !form.className.trim()) return;
    const next = createLesson({ ...form, id: editingId || undefined });
    setLessons((current) => {
      const withoutSlot = current.filter((lesson) => lesson.id !== editingId && !(lesson.week === next.week && lesson.day === next.day && lesson.period === next.period));
      return [...withoutSlot, next];
    });
    setEditorOpen(false);
    setStatus("Timetable saved on this device.");
  }

  function deleteLesson() {
    if (!editingId) return;
    setLessons((current) => current.filter((lesson) => lesson.id !== editingId));
    setEditorOpen(false);
  }

  async function readTimetableFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImport(null);
    setStatus(`Reading ${file.name}…`);
    try {
      const lower = file.name.toLowerCase();
      let imported: Lesson[] = [];
      if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
        imported = await parsePdf(file);
      } else {
        const text = await file.text();
        if (lower.endsWith(".json")) imported = parseJson(text);
        else if (lower.endsWith(".csv")) imported = parseDelimited(text, ",");
        else if (lower.endsWith(".tsv")) imported = parseDelimited(text, "\t");
        else imported = parsePlainText(text);
      }
      if (!imported.length) {
        setStatus("I couldn't detect timetable lessons in that file. Try an iSAMS PDF, CSV with Day/Class/Subject columns, JSON, TSV or plain timetable text.");
        return;
      }
      setPendingImport({ lessons: imported, source: file.name });
      setStatus(`Detected ${imported.length} lessons. Review the preview, then choose Auto-fill timetable.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The timetable could not be read.");
    } finally {
      event.target.value = "";
    }
  }

  function applyImport() {
    if (!pendingImport) return;
    const imported = pendingImport.lessons;
    setDemo(false);
    setLessons((current) => importMode === "replace" ? imported : dedupe([...current, ...imported]));
    setPendingImport(null);
    setStatus(`Auto-filled ${imported.length} lessons from ${pendingImport.source}. You can click any lesson to correct it.`);
  }

  function clearTimetable() {
    if (demo) { setDemo(false); return; }
    if (!window.confirm("Clear your saved timetable on this device?")) return;
    setLessons([]);
    setPendingImport(null);
    setStatus("Blank timetable ready for an upload or manual entry.");
  }

  function printTimetable() {
    window.print();
  }

  return (
    <main className="staffTimetablePage">
      <section className="staffTimetableHero">
        <div>
          <div className="staffTimetableEyebrow">STAFF · PERSONAL WORKSPACE</div>
          <h1>My timetable</h1>
          <p>Upload a timetable and auto-fill your working week, or build it manually. The normal workspace starts blank and contains no preloaded staff names.</p>
        </div>
        <div className="staffTimetableHeroActions noPrint">
          <button className={demo ? "ttButton demo active" : "ttButton demo"} onClick={() => { setDemo((value) => !value); setPendingImport(null); }}>
            {demo ? "Exit demo" : "View demo"}
          </button>
          <button className="ttButton" onClick={printTimetable}>Print</button>
          <Link className="ttButton" href="/school">School tools</Link>
        </div>
      </section>

      {demo && <div className="ttDemoBanner"><strong>Demo mode</strong><span>A read-only example based on the original timetable. Your own saved timetable has not been changed.</span></div>}

      <section className="ttSetupGrid noPrint">
        <article className="ttPanel ttImportPanel">
          <div className="ttPanelHeader">
            <div><span className="ttStep">1</span><h2>Upload timetable</h2></div>
            <span className="ttPrivacy">Processed in your browser</span>
          </div>
          <p>Best with an iSAMS timetable PDF. CSV, TSV, JSON and timetable text are also supported. Nothing is added until you review the detected lessons.</p>
          <input ref={fileRef} className="ttFileInput" type="file" accept=".pdf,.csv,.tsv,.txt,.json,text/plain,application/pdf,text/csv,application/json" onChange={readTimetableFile} />
          <button className="ttUploadZone" onClick={() => fileRef.current?.click()}>
            <span className="ttUploadIcon">⇧</span>
            <strong>Choose timetable file</strong>
            <small>PDF · CSV · TSV · TXT · JSON</small>
          </button>
          <div className="ttImportStatus" aria-live="polite">{status}</div>
        </article>

        <article className="ttPanel">
          <div className="ttPanelHeader"><div><span className="ttStep">2</span><h2>Review & auto-fill</h2></div></div>
          {!pendingImport ? (
            <div className="ttEmptyPreview"><strong>No import waiting</strong><span>Upload a timetable to see the detected lessons here before they are added.</span></div>
          ) : (
            <>
              <div className="ttImportControls">
                <label><span>Import behaviour</span><select value={importMode} onChange={(event) => setImportMode(event.target.value as "replace" | "merge")}><option value="replace">Replace my timetable</option><option value="merge">Merge with existing lessons</option></select></label>
                <button className="ttButton primary" onClick={applyImport}>Auto-fill timetable</button>
              </div>
              <div className="ttPreviewList">
                {pendingImport.lessons.slice(0, 12).map((lesson) => <div key={lesson.id}><b>{lesson.week} · {lesson.day.slice(0, 3)} · P{lesson.period}</b><span>{lesson.subject} · {lesson.className}{lesson.room ? ` · ${lesson.room}` : ""}</span></div>)}
                {pendingImport.lessons.length > 12 && <small>+ {pendingImport.lessons.length - 12} more detected lessons</small>}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="ttWorkspace">
        <div className="ttWorkspaceTop">
          <div>
            <span className="staffTimetableEyebrow">TWO-WEEK VIEW</span>
            <h2>{demo ? "Demo timetable" : lessons.length ? "Your timetable" : "Blank timetable"}</h2>
          </div>
          <div className="ttWorkspaceActions noPrint">
            <div className="ttWeekSwitch" role="group" aria-label="Timetable week"><button className={week === "W1" ? "active" : ""} onClick={() => setWeek("W1")}>Week 1</button><button className={week === "W2" ? "active" : ""} onClick={() => setWeek("W2")}>Week 2</button></div>
            {!demo && <button className="ttButton" onClick={() => openEditor("Monday", 1)}>+ Add lesson</button>}
            <button className="ttButton danger" onClick={clearTimetable}>{demo ? "Return to blank/personal" : "Clear"}</button>
          </div>
        </div>

        <div className="ttStats">
          <div><small>Lessons</small><strong>{weekLessons.length}</strong></div>
          <div><small>Teaching time</small><strong>{teachingHours}h</strong></div>
          <div><small>Free periods</small><strong>{freePeriods}</strong></div>
          <div><small>Subjects</small><strong>{subjectCount}</strong></div>
        </div>

        {!visibleLessons.length ? (
          <div className="ttBlankState">
            <span>▦</span><h3>Your timetable is empty</h3><p>Upload a timetable above for automatic filling, or click a free period to add a lesson manually.</p>
            <div className="noPrint"><button className="ttButton primary" onClick={() => fileRef.current?.click()}>Upload timetable</button><button className="ttButton" onClick={() => setDemo(true)}>See demo</button></div>
          </div>
        ) : null}

        <div className="ttGridWrap">
          <div className="ttGrid">
            <div className="ttGridHead timeHead">Time</div>
            {DAYS.map((day) => <div className="ttGridHead" key={day}>{day}</div>)}
            {PERIODS.map((period, index) => (
              <div className="ttGridRowContents" key={period.period}>
                <div className="ttTimeCell"><strong>P{period.period}</strong><span>{period.start}</span><small>{period.end}</small></div>
                {DAYS.map((day) => {
                  const lesson = lessonFor(day, period.period);
                  return <button type="button" className={lesson ? `ttLessonCell ${subjectTone(lesson.subject)}` : "ttLessonCell free"} key={`${day}-${period.period}`} onClick={() => openEditor(day, period.period)} disabled={demo}>
                    {lesson ? <><b>{lesson.subject}</b><span>{lesson.className || "Class"}</span><small>{lesson.room || "Room not set"}</small></> : <><b>Free</b><span>{demo ? "" : "Click to add"}</span></>}
                  </button>;
                })}
                {index === 1 && <><div className="ttBreakLabel">Break · 10:50–11:10</div>{DAYS.map((day) => <div className="ttBreakCell" key={`break-${day}`}>20 min</div>)}</>}
                {index === 3 && <><div className="ttBreakLabel">Lunch · 13:05–14:05</div>{DAYS.map((day) => <div className="ttBreakCell" key={`lunch-${day}`}>60 min</div>)}</>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ttHelp noPrint">
        <div><strong>Upload privacy</strong><p>Timetable files are read in your browser for this feature. The personal timetable is stored in this browser's local storage.</p></div>
        <div><strong>Import tip</strong><p>For CSV/TSV, use columns such as Week, Day, Period, Subject, Class and Room. iSAMS-style two-week PDFs are detected from their timetable layout.</p></div>
        <div><strong>Blank by default</strong><p>No colleague names or old staff timetables are loaded into the personal workspace. Demo mode is separate and read-only.</p></div>
      </section>

      {editorOpen && <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
        <section className="ttModal" role="dialog" aria-modal="true" aria-label="Edit timetable lesson">
          <div className="ttModalHeader"><div><span className="staffTimetableEyebrow">PERSONAL TIMETABLE</span><h2>{editingId ? "Edit lesson" : "Add lesson"}</h2></div><button className="ttIconButton" onClick={() => setEditorOpen(false)} aria-label="Close">×</button></div>
          <div className="ttFormGrid">
            <label><span>Week</span><select value={form.week} onChange={(event) => setForm((current) => ({ ...current, week: event.target.value as WeekKey }))}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label>
            <label><span>Day</span><select value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value as DayName }))}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
            <label><span>Period</span><select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: Number(event.target.value) }))}>{PERIODS.map((period) => <option key={period.period} value={period.period}>P{period.period} · {period.start}–{period.end}</option>)}</select></label>
            <label><span>Subject</span><input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="e.g. Physics" /></label>
            <label><span>Class / group</span><input value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} placeholder="e.g. Y12 Physics" /></label>
            <label><span>Room</span><input value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} placeholder="e.g. Lab 2" /></label>
            <label className="wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional reminder" /></label>
          </div>
          <div className="ttModalActions">{editingId && <button className="ttButton danger pushLeft" onClick={deleteLesson}>Delete</button>}<button className="ttButton" onClick={() => setEditorOpen(false)}>Cancel</button><button className="ttButton primary" onClick={saveLesson}>Save lesson</button></div>
        </section>
      </div>}
    </main>
  );
}
