import type { Course } from "./data";
export const followUpKey = "learning-tools:follow-up:v1";
export type FollowUpCheck = { days: 7 | 14; recalls: string[]; reflection: string; reviewedAt?: string; questionIds: string[] };
export type FollowUpRecord = { version: 1; startDate: string; checks: FollowUpCheck[] };
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
}
export function addDays(date: string, days: number) {
  if (!validDate(date)) return "";
  const value = new Date(date + "T12:00:00Z"); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10);
}
export function followUpSchedule(startDate: string, today: string) {
  if (!validDate(startDate) || !validDate(today)) return [];
  return ([7, 14] as const).map(days => { const due = addDays(startDate, days); return {days,due,status:today < due ? "Planned" : today === due ? "Due today" : "Ready to revisit"}; });
}
export function readFollowUp(raw?: string): FollowUpRecord {
  const fallback: FollowUpRecord = {version:1,startDate:"",checks:[]};
  try {
    const v = JSON.parse(raw || "{}"); if (v.version !== 1) return fallback;
    const checks: FollowUpCheck[] = [];
    if (Array.isArray(v.checks)) for (const c of v.checks) if ((c.days === 7 || c.days === 14) && Array.isArray(c.recalls) && c.recalls.every((s: unknown) => typeof s === "string") && Array.isArray(c.questionIds) && c.questionIds.every((s: unknown) => typeof s === "string") && typeof c.reflection === "string") {
      if (!checks.some(existing => existing.days === c.days)) checks.push({days:c.days,recalls:c.recalls,reflection:c.reflection,questionIds:c.questionIds,reviewedAt:typeof c.reviewedAt === "string" ? c.reviewedAt : undefined});
    }
    return {version:1,startDate:typeof v.startDate === "string" && validDate(v.startDate) ? v.startDate : "",checks};
  } catch { return fallback; }
}
export function reviewCalendar(course: Course, startDate: string) {
  if (!validDate(startDate)) return "";
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, m => "\\" + m);
  const compact = (date: string) => date.replace(/-/g, "");
  const events = ([7,14] as const).flatMap(days => {
    const due = addDays(startDate, days);
    return ["BEGIN:VEVENT","UID:" + course.id + "-" + days + "-" + compact(startDate) + "@teaching-cpd.local","DTSTAMP:" + compact(startDate) + "T120000Z","DTSTART;VALUE=DATE:" + compact(due),"DTEND;VALUE=DATE:" + compact(addDays(due,1)),"SUMMARY:" + escape(course.title + " — " + days + "-day CPD review"),"DESCRIPTION:" + escape("Open Teaching CPD and revisit your course. Recall before checking feedback; review one implementation action. Do not add confidential information."),"BEGIN:VALARM","TRIGGER:-PT0M","ACTION:DISPLAY","DESCRIPTION:Teaching CPD follow-up review","END:VALARM","END:VEVENT"];
  });
  function fold(line: string) {
    let result = "", bytes = 0;
    for (const character of line) { const size = new TextEncoder().encode(character).length; if (bytes + size > 74) { result += "\r\n "; bytes = 1; } result += character; bytes += size; }
    return result;
  }
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Teaching CPD//Course Follow Up//EN","CALSCALE:GREGORIAN",...events,"END:VCALENDAR",""].map(fold).join("\r\n");
}
