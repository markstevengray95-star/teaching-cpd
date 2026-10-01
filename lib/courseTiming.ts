import type { Course, Module } from "./data";
import { shortCourseBudgets } from "./shortCourses";
import { isAssessmentBank, assessmentConfig } from "./assessmentQuestions";

const focused = new Set(["staff-wellbeing", "behaviour-routines", "de-escalation", "effective-tutoring", "parent-communication", "effective-department-meetings", "developmental-lesson-feedback", "cover-supply-classroom-management"]);
const extended = new Set(["safeguarding-essentials", "regulation-support-academy", "curriculum-intent-implementation-impact", "self-harm-suicide-awareness-staff", "allergy-safety-schools-2026"]);

export function plannedCourseMinutes(course: Course): number {
  if (course.id.startsWith("short-")) return course.duration;
  if (extended.has(course.id)) return 90;
  if (focused.has(course.id)) return 45;
  if (course.category === "Leadership" || course.category === "Safeguarding" || course.modules.length >= 85) return 75;
  return 60;
}

function taskWeight(module: Module): number {
  if (module.type === "content") return Math.max(.5, module.body.split(/\s+/).length / 180);
  if (module.type === "activity" || module.type === "reflection") return 2;
  if (module.type === "scenario") return 1.5;
  if (module.type === "quiz" && isAssessmentBank(module)) return assessmentConfig(module.id).count * .8;
  if (module.type === "quiz" || module.type === "checklist") return 1;
  return .75;
}

/** A transparent pacing budget, not a timer or measured learner completion time. */
export function moduleTimeBudget(course: Course): number[] {
  if (course.id.startsWith("short-")) return shortCourseBudgets(course.duration);
  const weights = course.modules.map(taskWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  const duration = course.duration * 100;
  const ticks = weights.map(w => Math.floor(w / total * duration));
  let remainder = duration - ticks.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i++, remainder--) ticks[i % ticks.length]++;
  return ticks.map(t => t / 100);
}

export function withCourseTiming(course: Course): Course {
  return withModuleBudgets({ ...course, duration: plannedCourseMinutes(course) });
}

export function withModuleBudgets(course: Course): Course {
  const budgets = moduleTimeBudget(course);
  return { ...course, modules: course.modules.map((module, i) => ({ ...module, minutes: budgets[i] })) };
}
