import type { Course, Module } from "./data";
import { auditCoursePresentationPhase3 } from "./coursePresentationPhase3";
import { auditAdvancedPracticePhase4 } from "./coursePracticePhase4";
import { auditCourseAssessmentPhase5 } from "./courseAssessmentPhase5";
import { auditCourseFollowThroughPhase6 } from "./courseFollowThroughPhase6";
import { auditCourseFacilitatorPhase7 } from "./courseFacilitatorPhase7";

export type Phase8Check = {
  id: string;
  label: string;
  passed: boolean;
  critical: boolean;
  detail: string;
};

export type Phase8CourseAudit = {
  courseId: string;
  title: string;
  checks: Phase8Check[];
  passed: boolean;
  criticalFailures: number;
  warnings: number;
  percent: number;
  placeholderHits: string[];
};

const PLACEHOLDERS = [
  /\blorem ipsum\b/i,
  /\bcoming soon\b/i,
  /\bplaceholder\b/i,
  /\btodo\b/i,
  /\btbc\b/i,
  /\bfixme\b/i,
  /\[\s*to be added\s*\]/i,
  /\[\s*add (?:content|text|detail|example|image)\s*\]/i,
];

function clean(value: string | undefined | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function moduleStrings(module: Module) {
  const values = [module.id, module.title];
  if (module.type === "content") values.push(module.body, ...(module.keyPoints || []));
  if (module.type === "quiz") values.push(module.question, ...module.options, module.feedback || "");
  if (module.type === "scenario") values.push(module.prompt, ...module.options.flatMap(option => [option.label, option.feedback]));
  if (module.type === "reflection") values.push(module.prompt);
  if (module.type === "visual") values.push(module.caption || "", ...module.items.flatMap(item => [item.heading, item.text]));
  if (module.type === "checklist") values.push(module.prompt, ...module.items);
  if (module.type === "activity") values.push(module.prompt, ...module.instructions);
  return values.map(clean).filter(Boolean);
}

function longestContentRun(course: Course) {
  let longest = 0;
  let current = 0;
  for (const module of course.modules) {
    current = module.type === "content" ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

function visualAccessibilityReady(course: Course) {
  return course.modules
    .filter((module): module is Extract<Module, { type: "visual" }> => module.type === "visual")
    .every(module => Boolean(clean(module.title)) && module.items.length > 0 && module.items.every(item => Boolean(clean(item.heading)) && Boolean(clean(item.text))));
}

function interactiveAccessibilityReady(course: Course) {
  return course.modules.every(module => {
    if (module.type === "quiz") return Boolean(clean(module.question)) && module.options.length >= 2 && module.options.every(option => Boolean(clean(option)));
    if (module.type === "scenario") return Boolean(clean(module.prompt)) && module.options.length >= 2 && module.options.every(option => Boolean(clean(option.label)) && Boolean(clean(option.feedback)));
    if (module.type === "activity") return Boolean(clean(module.prompt)) && module.instructions.length > 0 && module.instructions.every(item => Boolean(clean(item)));
    if (module.type === "checklist") return Boolean(clean(module.prompt)) && module.items.length > 0 && module.items.every(item => Boolean(clean(item)));
    if (module.type === "reflection") return Boolean(clean(module.prompt));
    return true;
  });
}

function placeholderHits(course: Course) {
  const hits = new Set<string>();
  const text = [course.title, course.summary, ...course.objectives, ...course.modules.flatMap(moduleStrings)];
  for (const value of text) {
    for (const pattern of PLACEHOLDERS) {
      if (pattern.test(value)) hits.add(value.slice(0, 120));
    }
  }
  return [...hits];
}

function check(id: string, label: string, passed: boolean, detail: string, critical = true): Phase8Check {
  return { id, label, passed, critical, detail };
}

export function auditCourseFinalQaPhase8(course: Course): Phase8CourseAudit {
  const presentation = auditCoursePresentationPhase3(course);
  const practice = auditAdvancedPracticePhase4(course);
  const assessment = auditCourseAssessmentPhase5(course);
  const follow = auditCourseFollowThroughPhase6(course);
  const facilitator = auditCourseFacilitatorPhase7(course);
  const placeholders = placeholderHits(course);
  const moduleIds = course.modules.map(module => module.id);
  const titleCounts = new Map<string, number>();
  course.modules.forEach(module => titleCounts.set(clean(module.title).toLowerCase(), (titleCounts.get(clean(module.title).toLowerCase()) || 0) + 1));
  const duplicateTitles = [...titleCounts.entries()].filter(([title, count]) => title && count > 2);
  const interactiveCount = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  const firstModuleReady = Boolean(course.modules[0]?.id.startsWith("presentation-") && course.modules[0]?.id.endsWith("-map"));

  const checks: Phase8Check[] = [
    check("identity", "Unique course and module identity", Boolean(clean(course.id)) && Boolean(clean(course.title)) && new Set(moduleIds).size === moduleIds.length, `${moduleIds.length} modules · ${new Set(moduleIds).size} unique module IDs`),
    check("opening", "Clear presentation opening", firstModuleReady, firstModuleReady ? "Course opens with the presentation journey map." : "Course does not open with its journey map."),
    check("objectives", "Usable learning objectives", course.objectives.length >= 3 && course.objectives.length <= 6 && course.objectives.every(objective => clean(objective).length >= 20), `${course.objectives.length} objectives`, false),
    check("unfinished-copy", "No unfinished placeholder copy", placeholders.length === 0, placeholders.length ? `${placeholders.length} placeholder/unfinished text hits` : "No placeholder text detected."),
    check("presentation", "Presentation structure and visuals", presentation.phase3Slides >= 6 && presentation.visualSlides >= 6 && longestContentRun(course) <= 3, `${presentation.phase3Slides} Phase 3 slides · ${presentation.visualSlides} visuals · longest content run ${longestContentRun(course)}`),
    check("interaction", "Interaction is distributed through the course", interactiveCount >= 8, `${interactiveCount} interactive/reflective modules`, false),
    check("practice", "Advanced professional practice", practice.phase4Modules >= 6, `${practice.phase4Modules}/6 Phase 4 practice environments`),
    check("mastery", "Assessment and mastery", assessment.phase5Modules === 5 && assessment.diagnosticReady && assessment.masteryGateReady && assessment.uniqueQuestions >= 8, `${assessment.phase5Modules}/5 assessment stages · ${assessment.uniqueQuestions} unique questions`),
    check("follow-through", "Implementation and impact follow-through", follow.followThroughReady && follow.checkpoints === 3 && follow.hasImplementationCommitment, `${follow.checkpoints}/3 checkpoints · ${follow.retrievalQuestions} spaced-retrieval questions`),
    check("facilitation", "Facilitator delivery routes", facilitator.routes === 4 && facilitator.routeTimingReady && facilitator.interactiveReady && facilitator.transferReady && facilitator.substantiveReady && facilitator.printableReady, `${facilitator.routes}/4 routes · timing ${facilitator.routeTimingReady ? "ready" : "issue"}`),
    check("visual-access", "Visual content has meaningful text alternatives", visualAccessibilityReady(course), "All visual cards require a heading and explanatory text."),
    check("interactive-access", "Interactive content is readable and labelled", interactiveAccessibilityReady(course), "Questions, choices, prompts and instructions must be non-empty."),
    check("duplicate-titles", "Slide titles are not excessively duplicated", duplicateTitles.length === 0, duplicateTitles.length ? `${duplicateTitles.length} titles appear more than twice.` : "No excessive repeated slide titles.", false),
    check("summary", "Course purpose is clear", clean(course.summary).length >= 70, `${clean(course.summary).length} characters in course summary`, false),
  ];

  const criticalFailures = checks.filter(item => item.critical && !item.passed).length;
  const warnings = checks.filter(item => !item.critical && !item.passed).length;
  const earned = checks.filter(item => item.passed).length;
  const percent = Math.round((earned / checks.length) * 100);
  return {
    courseId: course.id,
    title: course.title,
    checks,
    passed: criticalFailures === 0,
    criticalFailures,
    warnings,
    percent,
    placeholderHits: placeholders,
  };
}

export function validateCourseFinalQaPhase8(course: Course) {
  const audit = auditCourseFinalQaPhase8(course);
  const failures = audit.checks.filter(item => item.critical && !item.passed);
  if (failures.length) {
    throw new Error(`CPD course ${course.id} failed Phase 8 QA: ${failures.map(item => item.label).join(", ")}`);
  }
}

export function summarisePhase8Quality(courses: Course[]) {
  const reports = courses.map(auditCourseFinalQaPhase8);
  return {
    courseCount: reports.length,
    passed: reports.filter(report => report.passed).length,
    withWarnings: reports.filter(report => report.warnings > 0).length,
    criticalFailures: reports.reduce((sum, report) => sum + report.criticalFailures, 0),
    warnings: reports.reduce((sum, report) => sum + report.warnings, 0),
    averagePercent: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.percent, 0) / reports.length) : 0,
    reports,
  };
}
