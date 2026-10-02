import { ClassCurriculumProfile, getCourseLessonSequence, SuggestedCurriculumLesson } from "./staffTimetableCurriculumPhase1";

export type MediumTermWeek = "W1" | "W2";
export type MediumTermDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type MediumTermSessionStatus = "planned" | "complete" | "missed";
export type PlanningBlockType = "Holiday" | "INSET" | "Assessment week" | "Trip" | "Other";

export type PlanningBlock = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: PlanningBlockType;
};

export type MediumTermPatternLesson = {
  id: string;
  week: MediumTermWeek;
  day: MediumTermDay;
  period: number;
  start: string;
  end: string;
  subject: string;
  className: string;
  room: string;
};

export type MediumTermKeyDate = {
  date: string;
  title: string;
  type: "Term" | "Holiday" | "Training" | "Deadline" | "Event";
};

export type MediumTermChange = {
  date: string;
  lessonId: string;
  type: "Room change" | "Cover" | "Cancelled" | "Note";
};

export type MediumTermSession = {
  id: string;
  date: string;
  week: MediumTermWeek;
  day: MediumTermDay;
  period: number;
  start: string;
  end: string;
  room: string;
  sourceLessonId: string;
  sequencePosition: number;
  topic: string;
  unitTitle: string;
  subtopicTitle: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  assessment: string;
  status: MediumTermSessionStatus;
};

export type MediumTermPlan = {
  id: string;
  className: string;
  courseId: string;
  profile: ClassCurriculumProfile;
  startDate: string;
  endDate: string;
  anchorWeek: MediumTermWeek;
  startSequencePosition: number;
  generatedAt: string;
  sessions: MediumTermSession[];
};

type Slot = Omit<MediumTermSession, "id" | "sequencePosition" | "topic" | "unitTitle" | "subtopicTitle" | "vocabulary" | "objectives" | "sequence" | "assessment" | "status">;

type GenerateInput = {
  className: string;
  profile: ClassCurriculumProfile;
  patternLessons: MediumTermPatternLesson[];
  startDate: string;
  endDate: string;
  anchorWeek: MediumTermWeek;
  planningBlocks: PlanningBlock[];
  keyDates: MediumTermKeyDate[];
  changes: MediumTermChange[];
  startSequencePosition?: number;
};

const DAY_NAMES: MediumTermDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00`);
}

function iso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = dateAtNoon(value);
  date.setDate(date.getDate() + days);
  return iso(date);
}

function mondayOf(value: string) {
  const date = dateAtNoon(value);
  const jsDay = date.getDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  date.setDate(date.getDate() + offset);
  return date;
}

function weekForDate(dateValue: string, anchorDate: string, anchorWeek: MediumTermWeek): MediumTermWeek {
  const currentMonday = mondayOf(dateValue).getTime();
  const anchorMonday = mondayOf(anchorDate).getTime();
  const weeks = Math.floor((currentMonday - anchorMonday) / (7 * 24 * 60 * 60 * 1000));
  const even = Math.abs(weeks) % 2 === 0;
  if (even) return anchorWeek;
  return anchorWeek === "W1" ? "W2" : "W1";
}

function isNonTeachingDate(dateValue: string, blocks: PlanningBlock[], keyDates: MediumTermKeyDate[]) {
  const blockedByRange = blocks.some((block) => dateValue >= block.startDate && dateValue <= block.endDate);
  if (blockedByRange) return true;
  return keyDates.some((item) => item.date === dateValue && (item.type === "Holiday" || item.type === "Training"));
}

function dayName(value: string): MediumTermDay | null {
  const day = dateAtNoon(value).getDay();
  if (day < 1 || day > 5) return null;
  return DAY_NAMES[day - 1];
}

function slotsForInput(input: GenerateInput, fromDate = input.startDate): Slot[] {
  const lessons = input.patternLessons
    .filter((lesson) => lesson.className === input.className)
    .slice()
    .sort((a, b) => a.period - b.period);
  if (!lessons.length || !input.startDate || !input.endDate || input.endDate < input.startDate) return [];

  const slots: Slot[] = [];
  let cursor = input.startDate;
  while (cursor <= input.endDate) {
    if (cursor >= fromDate) {
      const day = dayName(cursor);
      if (day && !isNonTeachingDate(cursor, input.planningBlocks, input.keyDates)) {
        const week = weekForDate(cursor, input.startDate, input.anchorWeek);
        lessons
          .filter((lesson) => lesson.week === week && lesson.day === day)
          .forEach((lesson) => {
            const cancelled = input.changes.some((change) => change.date === cursor && change.lessonId === lesson.id && change.type === "Cancelled");
            if (!cancelled) slots.push({ date: cursor, week, day, period: lesson.period, start: lesson.start, end: lesson.end, room: lesson.room, sourceLessonId: lesson.id });
          });
      }
    }
    cursor = addDays(cursor, 1);
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
}

function sessionFrom(slot: Slot, curriculum: SuggestedCurriculumLesson, className: string): MediumTermSession {
  return {
    id: `${className}-${slot.date}-p${slot.period}-${curriculum.sequencePosition}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    ...slot,
    sequencePosition: curriculum.sequencePosition,
    topic: curriculum.title,
    unitTitle: curriculum.unitTitle,
    subtopicTitle: curriculum.subtopicTitle,
    vocabulary: curriculum.vocabulary,
    objectives: curriculum.objectives,
    sequence: curriculum.sequence,
    assessment: curriculum.assessment,
    status: "planned",
  };
}

export function generateMediumTermPlan(input: GenerateInput): MediumTermPlan {
  const courseSequence = getCourseLessonSequence(input.profile);
  const startPosition = Math.max(0, input.startSequencePosition || 0);
  const slots = slotsForInput(input);
  const sessions = slots
    .map((slot, index) => {
      const curriculum = courseSequence[startPosition + index];
      return curriculum ? sessionFrom(slot, curriculum, input.className) : null;
    })
    .filter((item): item is MediumTermSession => Boolean(item));

  return {
    id: `mtp-${input.className.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    className: input.className,
    courseId: input.profile.courseId,
    profile: input.profile,
    startDate: input.startDate,
    endDate: input.endDate,
    anchorWeek: input.anchorWeek,
    startSequencePosition: startPosition,
    generatedAt: new Date().toISOString(),
    sessions,
  };
}

export function reflowMediumTermPlan(plan: MediumTermPlan, input: Omit<GenerateInput, "startSequencePosition">, fromDate: string): MediumTermPlan {
  const courseSequence = getCourseLessonSequence(plan.profile);
  const frozen = plan.sessions.filter((session) => session.date < fromDate || session.status === "complete");
  const consumedPositions = new Set(
    frozen
      .filter((session) => session.status === "complete" || (session.status === "planned" && session.date < fromDate))
      .map((session) => session.sequencePosition),
  );
  let nextPosition = plan.startSequencePosition;
  while (consumedPositions.has(nextPosition)) nextPosition += 1;

  const slots = slotsForInput({ ...input, profile: plan.profile, className: plan.className, startSequencePosition: nextPosition }, fromDate);
  const future = slots
    .map((slot) => {
      while (consumedPositions.has(nextPosition)) nextPosition += 1;
      const curriculum = courseSequence[nextPosition];
      if (!curriculum) return null;
      const session = sessionFrom(slot, curriculum, plan.className);
      nextPosition += 1;
      return session;
    })
    .filter((item): item is MediumTermSession => Boolean(item));

  return { ...plan, endDate: input.endDate, anchorWeek: input.anchorWeek, generatedAt: new Date().toISOString(), sessions: [...frozen, ...future].sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period) };
}

export function nextDate(value: string) {
  return addDays(value, 1);
}

export function mediumTermStats(plan?: MediumTermPlan) {
  const sessions = plan?.sessions || [];
  return {
    total: sessions.length,
    complete: sessions.filter((item) => item.status === "complete").length,
    missed: sessions.filter((item) => item.status === "missed").length,
    planned: sessions.filter((item) => item.status === "planned").length,
    firstDate: sessions[0]?.date || "",
    lastDate: sessions[sessions.length - 1]?.date || "",
  };
}
