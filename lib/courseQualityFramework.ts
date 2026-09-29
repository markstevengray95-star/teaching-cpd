import type { Course, Module } from "./data";

export const COURSE_TEMPLATE_VERSION = "2026.1";

export type CourseQualityStatus = "excellent" | "secure" | "developing" | "priority";
export type CourseQualityCheckId =
  | "purpose"
  | "objectives"
  | "journey"
  | "baseline"
  | "knowledge"
  | "visuals"
  | "practice"
  | "scenario"
  | "assessment"
  | "implementation"
  | "balance";

export type CourseQualityCheck = {
  id: CourseQualityCheckId;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  passed: boolean;
  essential?: boolean;
  evidence: string;
};

export type CourseQualityReport = {
  courseId: string;
  title: string;
  category: Course["category"];
  level: Course["level"];
  templateVersion: string;
  score: number;
  maxScore: number;
  percent: number;
  status: CourseQualityStatus;
  passed: boolean;
  moduleCount: number;
  estimatedKnowledgeWords: number;
  strengths: string[];
  priorities: string[];
  checks: CourseQualityCheck[];
};

export type CatalogueQualityAudit = {
  templateVersion: string;
  generatedAtBuild: true;
  courseCount: number;
  averagePercent: number;
  excellent: number;
  secure: number;
  developing: number;
  priority: number;
  phaseOneReady: number;
  reports: CourseQualityReport[];
  weakestDimensions: { id: CourseQualityCheckId; label: string; averagePercent: number; failingCourses: number }[];
};

export const COURSE_TEMPLATE_STAGES = [
  { stage: "Orient", intent: "Purpose, audience, outcomes and learning journey", expected: ["visual", "content"] },
  { stage: "Diagnose", intent: "Activate prior knowledge and establish a baseline", expected: ["reflection", "quiz", "scenario"] },
  { stage: "Learn", intent: "Build the essential professional knowledge in manageable chunks", expected: ["content", "visual"] },
  { stage: "Explore", intent: "Use models, examples and non-examples to make ideas visible", expected: ["visual", "content"] },
  { stage: "Practise", intent: "Rehearse the professional skill in a realistic context", expected: ["activity"] },
  { stage: "Decide", intent: "Apply judgement through a scenario or case", expected: ["scenario"] },
  { stage: "Check", intent: "Check understanding and address misconceptions", expected: ["quiz", "checklist"] },
  { stage: "Implement", intent: "Commit to a practical change, evidence and review point", expected: ["activity", "reflection", "checklist"] },
] as const;

const QUALITY_STANDARD: Array<{
  id: CourseQualityCheckId;
  label: string;
  description: string;
  maxScore: number;
  essential?: boolean;
}> = [
  { id: "purpose", label: "Purpose & audience", description: "Clear summary, duration, level and intended audience.", maxScore: 10, essential: true },
  { id: "objectives", label: "Learning objectives", description: "Three to six distinct, actionable learning objectives.", maxScore: 10, essential: true },
  { id: "journey", label: "Presentation opening", description: "A presentation journey map opens the course and makes the sequence explicit.", maxScore: 8, essential: true },
  { id: "baseline", label: "Diagnostic baseline", description: "Early reflection/check activates prior knowledge before substantive learning.", maxScore: 8 },
  { id: "knowledge", label: "Knowledge depth", description: "Enough substantive explanation to teach rather than merely prompt discussion.", maxScore: 12 },
  { id: "visuals", label: "Visual communication", description: "Multiple visual explainers make relationships and processes easier to understand.", maxScore: 10 },
  { id: "practice", label: "Practical rehearsal", description: "A meaningful activity requires staff to apply the learning to practice.", maxScore: 10, essential: true },
  { id: "scenario", label: "Scenario / case", description: "A realistic decision point tests professional judgement.", maxScore: 8 },
  { id: "assessment", label: "Knowledge checks", description: "At least one knowledge check tests understanding and gives feedback.", maxScore: 8 },
  { id: "implementation", label: "Reflection & implementation", description: "The course closes with reflection, readiness and a concrete next step.", maxScore: 8, essential: true },
  { id: "balance", label: "Presentation balance", description: "The presentation uses a varied mix of module types rather than long runs of one format.", maxScore: 8 },
];

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function words(value: string | undefined) {
  if (!value) return 0;
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function moduleWordCount(module: Module) {
  if (module.type === "content") return words(module.body) + (module.keyPoints || []).reduce((sum, item) => sum + words(item), 0);
  if (module.type === "visual") return words(module.caption) + module.items.reduce((sum, item) => sum + words(item.heading) + words(item.text), 0);
  if (module.type === "quiz") return words(module.question) + module.options.reduce((sum, item) => sum + words(item), 0) + words(module.feedback);
  if (module.type === "scenario") return words(module.prompt) + module.options.reduce((sum, item) => sum + words(item.label) + words(item.feedback), 0);
  if (module.type === "activity") return words(module.prompt) + module.instructions.reduce((sum, item) => sum + words(item), 0);
  if (module.type === "checklist") return words(module.prompt) + module.items.reduce((sum, item) => sum + words(item), 0);
  return words(module.prompt);
}

function scoreStatus(percent: number): CourseQualityStatus {
  if (percent >= 90) return "excellent";
  if (percent >= 78) return "secure";
  if (percent >= 62) return "developing";
  return "priority";
}

function makeCheck(
  id: CourseQualityCheckId,
  ratio: number,
  evidence: string,
): CourseQualityCheck {
  const standard = QUALITY_STANDARD.find(item => item.id === id)!;
  const bounded = Math.max(0, Math.min(1, ratio));
  const score = Math.round(standard.maxScore * bounded);
  return {
    ...standard,
    score,
    passed: bounded >= 0.75,
    evidence,
  };
}

function isJourneyMap(course: Course, module: Module | undefined) {
  return Boolean(module && module.type === "visual" && module.id.startsWith("presentation-") && module.id.endsWith("-map"));
}

function hasImplementationLanguage(module: Module) {
  const source = module.type === "content" ? module.body
    : module.type === "visual" ? `${module.caption || ""} ${module.items.map(item => `${item.heading} ${item.text}`).join(" ")}`
    : module.type === "quiz" ? `${module.question} ${module.feedback}`
    : module.type === "scenario" ? `${module.prompt} ${module.options.map(option => `${option.label} ${option.feedback}`).join(" ")}`
    : module.type === "activity" ? `${module.prompt} ${module.instructions.join(" ")}`
    : module.type === "checklist" ? `${module.prompt} ${module.items.join(" ")}`
    : module.prompt;
  return /implement|apply|evidence|review|next step|practice|action/i.test(source);
}

export function applyCourseTemplateFoundation(course: Course): Course {
  const id = safeId(course.id);
  const briefId = `quality-${id}-course-brief`;
  const baselineId = `quality-${id}-baseline`;
  const commitmentId = `quality-${id}-implementation-commitment`;
  const modules = course.modules.filter(module => ![briefId, baselineId, commitmentId].includes(module.id));
  const firstIsMap = isJourneyMap(course, modules[0]);
  const insertAt = firstIsMap ? 1 : 0;
  let addedMinutes = 0;

  const brief: Extract<Module, { type: "content" }> = {
    id: briefId,
    type: "content",
    title: "Course brief: purpose, audience and outcomes",
    body: `${course.summary} This course is designed for ${course.recommendedFor.join(", ") || "school staff"}. Use the presentation as a guided learning sequence: build the knowledge, test professional judgement, practise the skill and leave with a specific implementation step.`,
    keyPoints: course.objectives.slice(0, 6),
  };
  modules.splice(insertAt, 0, brief);
  addedMinutes += 3;

  const baseline: Extract<Module, { type: "reflection" }> = {
    id: baselineId,
    type: "reflection",
    title: "Baseline: what is your starting point?",
    prompt: `Before the main learning, note your current approach to ${course.title.toLowerCase()}. What already works, where are you least confident, and which course objective would make the biggest difference to your practice?`,
  };
  modules.splice(insertAt + 1, 0, baseline);
  addedMinutes += 3;

  const commitment: Extract<Module, { type: "reflection" }> = {
    id: commitmentId,
    type: "reflection",
    title: "Implementation commitment: one change, one measure, one review",
    prompt: `Choose one specific action from ${course.title} that you will use in practice. State the context, the evidence you will collect to judge whether it helped, and when you will review whether to keep, adapt or stop the approach.`,
  };
  modules.push(commitment);
  addedMinutes += 4;

  return { ...course, duration: course.duration + addedMinutes, modules };
}

export function auditCourse(course: Course): CourseQualityReport {
  const types = course.modules.map(module => module.type);
  const counts = types.reduce<Record<string, number>>((acc, type) => ({ ...acc, [type]: (acc[type] || 0) + 1 }), {});
  const contentWords = course.modules.filter(module => module.type === "content").reduce((sum, module) => sum + moduleWordCount(module), 0);
  const totalWords = course.modules.reduce((sum, module) => sum + moduleWordCount(module), 0);
  const visualItems = course.modules.filter((module): module is Extract<Module, { type: "visual" }> => module.type === "visual").reduce((sum, module) => sum + module.items.length, 0);
  const earlyModules = course.modules.slice(0, Math.min(6, course.modules.length));
  const baselinePresent = earlyModules.some(module => module.id.includes("baseline") || module.type === "quiz" || module.type === "scenario");
  const implementationModules = course.modules.slice(Math.max(0, course.modules.length - 6));
  const implementationPresent = implementationModules.some(hasImplementationLanguage);
  const reflectionPresent = Boolean(counts.reflection);
  const checklistPresent = Boolean(counts.checklist);
  const distinctTypes = new Set(types).size;
  const dominantShare = course.modules.length ? Math.max(...Object.values(counts)) / course.modules.length : 1;

  const purposeParts = [course.summary.trim().length >= 45, course.duration >= 20, Boolean(course.level), course.recommendedFor.length > 0];
  const objectiveUnique = new Set(course.objectives.map(item => item.trim().toLowerCase())).size;
  const objectiveRatio = course.objectives.length >= 3 && course.objectives.length <= 6 && objectiveUnique === course.objectives.length ? 1 : course.objectives.length >= 2 ? 0.6 : 0.25;
  const knowledgeRatio = contentWords >= 500 && (counts.content || 0) >= 3 ? 1 : contentWords >= 300 && (counts.content || 0) >= 2 ? 0.82 : contentWords >= 160 ? 0.58 : 0.3;
  const visualRatio = (counts.visual || 0) >= 3 && visualItems >= 9 ? 1 : (counts.visual || 0) >= 2 && visualItems >= 6 ? 0.82 : (counts.visual || 0) >= 1 ? 0.55 : 0;
  const balanceRatio = distinctTypes >= 7 && dominantShare <= 0.38 ? 1 : distinctTypes >= 6 && dominantShare <= 0.48 ? 0.82 : distinctTypes >= 5 ? 0.62 : 0.35;

  const checks: CourseQualityCheck[] = [
    makeCheck("purpose", purposeParts.filter(Boolean).length / purposeParts.length, `${purposeParts.filter(Boolean).length}/4 core course-identification fields meet the standard.`),
    makeCheck("objectives", objectiveRatio, `${course.objectives.length} objectives · ${objectiveUnique} unique.`),
    makeCheck("journey", isJourneyMap(course, course.modules[0]) ? 1 : 0, isJourneyMap(course, course.modules[0]) ? "Course opens with the presentation journey map." : "Presentation journey map is not the opening module."),
    makeCheck("baseline", baselinePresent ? 1 : 0.35, baselinePresent ? "An early diagnostic/reflection is present." : "No clear diagnostic baseline appears near the start."),
    makeCheck("knowledge", knowledgeRatio, `${counts.content || 0} knowledge modules · about ${contentWords} explanatory words.`),
    makeCheck("visuals", visualRatio, `${counts.visual || 0} visual modules · ${visualItems} visual items.`),
    makeCheck("practice", counts.activity ? Math.min(1, (counts.activity || 0) / 2 + 0.5) : 0, `${counts.activity || 0} practical activity module(s).`),
    makeCheck("scenario", counts.scenario ? 1 : 0, `${counts.scenario || 0} scenario/case module(s).`),
    makeCheck("assessment", counts.quiz ? Math.min(1, (counts.quiz || 0) / 2 + 0.5) : 0, `${counts.quiz || 0} knowledge-check module(s).`),
    makeCheck("implementation", reflectionPresent && implementationPresent && checklistPresent ? 1 : reflectionPresent && implementationPresent ? 0.78 : reflectionPresent ? 0.55 : 0, `${counts.reflection || 0} reflection(s) · ${counts.checklist || 0} checklist(s) · implementation close ${implementationPresent ? "present" : "not explicit"}.`),
    makeCheck("balance", balanceRatio, `${distinctTypes} module types · dominant format ${Math.round(dominantShare * 100)}% of slides.`),
  ];

  const score = checks.reduce((sum, check) => sum + check.score, 0);
  const maxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  const percent = Math.round((score / maxScore) * 100);
  const essentialPassed = checks.filter(check => check.essential).every(check => check.passed);
  return {
    courseId: course.id,
    title: course.title,
    category: course.category,
    level: course.level,
    templateVersion: COURSE_TEMPLATE_VERSION,
    score,
    maxScore,
    percent,
    status: scoreStatus(percent),
    passed: essentialPassed && percent >= 78,
    moduleCount: course.modules.length,
    estimatedKnowledgeWords: totalWords,
    strengths: checks.filter(check => check.passed).sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore)).slice(0, 4).map(check => check.label),
    priorities: checks.filter(check => !check.passed).sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore)).slice(0, 4).map(check => check.label),
    checks,
  };
}

export function auditCatalogue(courses: Course[]): CatalogueQualityAudit {
  const reports = courses.map(auditCourse).sort((a, b) => a.percent - b.percent || a.title.localeCompare(b.title));
  const dimensionRows = QUALITY_STANDARD.map(standard => {
    const courseChecks = reports.map(report => report.checks.find(check => check.id === standard.id)!).filter(Boolean);
    const averagePercent = courseChecks.length ? Math.round(courseChecks.reduce((sum, check) => sum + (check.score / check.maxScore) * 100, 0) / courseChecks.length) : 0;
    return {
      id: standard.id,
      label: standard.label,
      averagePercent,
      failingCourses: courseChecks.filter(check => !check.passed).length,
    };
  }).sort((a, b) => a.averagePercent - b.averagePercent || b.failingCourses - a.failingCourses);

  return {
    templateVersion: COURSE_TEMPLATE_VERSION,
    generatedAtBuild: true,
    courseCount: reports.length,
    averagePercent: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.percent, 0) / reports.length) : 0,
    excellent: reports.filter(report => report.status === "excellent").length,
    secure: reports.filter(report => report.status === "secure").length,
    developing: reports.filter(report => report.status === "developing").length,
    priority: reports.filter(report => report.status === "priority").length,
    phaseOneReady: reports.filter(report => report.passed).length,
    reports,
    weakestDimensions: dimensionRows,
  };
}

export function validateCourseAgainstQualityFramework(course: Course) {
  const report = auditCourse(course);
  const failedEssentials = report.checks.filter(check => check.essential && !check.passed);
  if (failedEssentials.length) {
    throw new Error(`CPD course ${course.id} fails Phase 1 essentials: ${failedEssentials.map(check => check.label).join(", ")}`);
  }
}
