import type { Course, Module } from "./data";

export const COURSE_LENGTH_OPTIMISATION_VERSION = "2026.27";

export type CourseLengthAudit = {
  courseId: string;
  title: string;
  beforeModules: number;
  afterModules: number;
  removedModules: number;
  reductionPercent: number;
  beforeMinutes: number;
  afterMinutes: number;
  hasInteractive: boolean;
  hasVisual: boolean;
  hasSynthesisAnchor: boolean;
};

const phasePrefixes = {
  reading: "overhaul2-reading-",
  process: "overhaul2-process-",
  workshop: "overhaul3-workshop-",
  progressiveCase: "overhaul4-case-",
  engagementRepair: "overhaul6-engagement-",
  visual: "overhaul7-visual-",
  adaptive: "overhaul8-path-",
  synthesis: "overhaul9-synthesis-",
  simulation: "overhaul12-sim-",
};

function occurrenceMap(modules: Module[]) {
  const counters = new Map<string, number>();
  return modules.map(module => {
    const matched = Object.values(phasePrefixes).find(prefix => module.id.startsWith(prefix));
    if (!matched) return { module, prefix: "", occurrence: -1 };
    const occurrence = counters.get(matched) || 0;
    counters.set(matched, occurrence + 1);
    return { module, prefix: matched, occurrence };
  });
}

function keepGeneratedModule(prefix: string, occurrence: number) {
  if (!prefix) return true;
  if (prefix === phasePrefixes.engagementRepair) return false;
  if (prefix === phasePrefixes.reading) return occurrence !== 1;
  if (prefix === phasePrefixes.process) return occurrence !== 1;
  if (prefix === phasePrefixes.workshop) return [0, 3, 7].includes(occurrence);
  if (prefix === phasePrefixes.progressiveCase) return occurrence <= 6 || occurrence === 13;
  if (prefix === phasePrefixes.visual) return occurrence !== 1;
  if (prefix === phasePrefixes.adaptive) return occurrence !== 1;
  if (prefix === phasePrefixes.simulation) return occurrence === 0;
  return true;
}

function targetDuration(minutes: number) {
  if (minutes <= 40) return minutes;
  const reduced = Math.round((minutes * 0.8) / 5) * 5;
  return Math.max(35, Math.min(75, reduced));
}

export function shortenCourseJourney(course: Course): Course {
  const mapped = occurrenceMap(course.modules);
  const kept = mapped.filter(({ module, prefix, occurrence }, index) => {
    if (index === 0) return true;
    if (module.id.startsWith("overhaul1-checkpoint-")) return false;
    if (module.id.startsWith(phasePrefixes.synthesis)) return true;
    return keepGeneratedModule(prefix, occurrence);
  }).map(({ module }) => module);

  const interactiveTypes = new Set(["quiz", "scenario", "reflection", "checklist", "activity"]);
  const needsInteractive = !kept.some(module => interactiveTypes.has(module.type));
  const needsVisual = !kept.some(module => module.type === "visual");
  const extras: Module[] = [];
  if (needsInteractive) {
    const module = course.modules.find(item => interactiveTypes.has(item.type));
    if (module && !kept.some(item => item.id === module.id)) extras.push(module);
  }
  if (needsVisual) {
    const module = course.modules.find(item => item.type === "visual");
    if (module && !kept.some(item => item.id === module.id) && !extras.some(item => item.id === module.id)) extras.push(module);
  }

  const keepIds = new Set([...kept, ...extras].map(module => module.id));
  const modules = course.modules.filter(module => keepIds.has(module.id));
  return {
    ...course,
    duration: targetDuration(course.duration),
    modules,
    summary: course.summary.replace(/\s+/g, " ").trim(),
  };
}

export function auditCourseLength(before: Course, after: Course): CourseLengthAudit {
  const interactiveTypes = new Set(["quiz", "scenario", "reflection", "checklist", "activity"]);
  const removedModules = Math.max(0, before.modules.length - after.modules.length);
  return {
    courseId: before.id,
    title: before.title,
    beforeModules: before.modules.length,
    afterModules: after.modules.length,
    removedModules,
    reductionPercent: before.modules.length ? Math.round((removedModules / before.modules.length) * 100) : 0,
    beforeMinutes: before.duration,
    afterMinutes: after.duration,
    hasInteractive: after.modules.some(module => interactiveTypes.has(module.type)),
    hasVisual: after.modules.some(module => module.type === "visual"),
    hasSynthesisAnchor: after.modules.some(module => module.id.startsWith(phasePrefixes.synthesis)),
  };
}

export function summariseCourseLengthOptimisation(before: Course[], after: Course[]) {
  const afterById = new Map(after.map(course => [course.id, course]));
  const reports = before.map(course => auditCourseLength(course, afterById.get(course.id) || course));
  return {
    courseCount: reports.length,
    totalModulesBefore: reports.reduce((sum, report) => sum + report.beforeModules, 0),
    totalModulesAfter: reports.reduce((sum, report) => sum + report.afterModules, 0),
    totalModulesRemoved: reports.reduce((sum, report) => sum + report.removedModules, 0),
    averageReductionPercent: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.reductionPercent, 0) / reports.length) : 0,
    averageMinutesBefore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.beforeMinutes, 0) / reports.length) : 0,
    averageMinutesAfter: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.afterMinutes, 0) / reports.length) : 0,
    allKeepInteractive: reports.every(report => report.hasInteractive),
    allKeepVisual: reports.every(report => report.hasVisual),
    allKeepSynthesis: reports.every(report => report.hasSynthesisAnchor),
    reports,
  };
}
