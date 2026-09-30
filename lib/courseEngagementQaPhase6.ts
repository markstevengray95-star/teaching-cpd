import type { Course, Module } from "./data";
import { auditPresentationOverhaulPhase1 } from "./courseLearningCycleOverhaulPhase1";
import { auditProfessionalReadingPhase2 } from "./courseProfessionalReadingPhase2";
import { auditWorkshopActivityPhase3 } from "./courseWorkshopActivityPhase3";
import { auditProgressiveCasePhase4 } from "./courseProgressiveCasePhase4";
import { auditLivePresenterPhase5 } from "./courseLivePresenterPhase5";

const PREFIX = "overhaul6-engagement-";
const TARGET_ACTIVE_SHARE = 35;

export const PRESENTATION_OVERHAUL_PHASE6_VERSION = "2026.7";

export type Phase6EngagementCheck = {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
};

export type Phase6EngagementAudit = {
  courseId: string;
  title: string;
  score: number;
  ready: boolean;
  activeShare: number;
  longestPassiveRun: number;
  coreReadingWords: number;
  workshopActivities: number;
  choicePoints: number;
  progressiveCases: number;
  caseModules: number;
  liveMoments: number;
  liveKinds: number;
  autoRepairs: number;
  checks: Phase6EngagementCheck[];
};

type ActivityModule = Extract<Module, { type: "activity" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function isActive(module: Module) {
  return ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type);
}

function isPassive(module: Module) {
  return module.type === "content" || module.type === "visual";
}

function categoryLens(course: Course) {
  if (course.category === "Safeguarding") return {
    evidence: "What factual evidence or current school procedure should shape the next professional decision?",
    boundary: "What is the staff member's role here, and what belongs with the DSL or current safeguarding process?",
  };
  if (course.category === "SEND") return {
    evidence: "What evidence would show whether the adaptation improves access without reducing ambition or independence?",
    boundary: "Which part of the support addresses the actual barrier, and which part could become unnecessary over-support?",
  };
  if (course.category === "Leadership") return {
    evidence: "What implementation evidence would distinguish a clarity, capability, capacity or follow-up problem?",
    boundary: "What needs improving in the system before interpreting this as an individual staff problem?",
  };
  if (course.category === "Wellbeing") return {
    evidence: "What evidence would show that the underlying workload or system condition has genuinely changed?",
    boundary: "Which part of the issue needs a system response rather than asking individuals to cope differently?",
  };
  if (course.category === "Digital Teaching") return {
    evidence: "What evidence would justify continuing this technology once accuracy, privacy and accessibility are considered?",
    boundary: "What still needs human professional judgement rather than being delegated to the tool?",
  };
  return {
    evidence: "What evidence would show that the intended learning or professional outcome is actually improving?",
    boundary: "What limitation, non-example or contextual factor would make you adapt rather than copy this approach?",
  };
}

function repairActivity(course: Course, number: number, previous: Module[]): ActivityModule {
  const recent = previous.slice(-4).map(module => module.title).filter(Boolean);
  const lens = categoryLens(course);
  const context = recent.length ? `Use the recent section (${recent.join(" · ")})` : `Use the recent learning from ${course.title}`;
  return {
    id: `${PREFIX}${safeId(course.id)}-${number}`,
    type: "activity",
    title: "Engagement reset · retrieve, challenge and apply",
    prompt: `${context} before more information is added.`,
    instructions: [
      "Retrieve the strongest professional idea from the previous section without reopening it.",
      lens.boundary,
      lens.evidence,
      "Adapt the idea to one real or realistic context from your role and state what you would do next.",
    ],
    placeholder: "Key idea… Boundary/limitation… Evidence… My adapted next step…",
    minimumCharacters: 90,
  };
}

function breakPassiveRuns(course: Course, modules: Module[]) {
  const result: Module[] = [];
  let passiveRun = 0;
  let number = 1;
  for (const module of modules) {
    if (isPassive(module) && passiveRun >= 3) {
      result.push(repairActivity(course, number++, result));
      passiveRun = 0;
    }
    result.push(module);
    passiveRun = isPassive(module) ? passiveRun + 1 : 0;
  }
  return { modules: result, nextNumber: number };
}

function activeShare(modules: Module[]) {
  if (!modules.length) return 0;
  return Math.round((modules.filter(isActive).length / modules.length) * 100);
}

function neededForTarget(modules: Module[]) {
  const active = modules.filter(isActive).length;
  const total = modules.length;
  const target = TARGET_ACTIVE_SHARE / 100;
  if (!total || active / total >= target) return 0;
  return Math.max(0, Math.ceil((target * total - active) / (1 - target)));
}

function safeInsertionIndexes(modules: Module[]) {
  const preferred = modules
    .map((module, index) => ({ module, index }))
    .filter(({ module }) =>
      module.id.startsWith("overhaul2-process-") ||
      module.id.endsWith("-transfer") ||
      module.id.startsWith("overhaul1-cycle-") && module.type === "activity" ||
      module.id.startsWith("overhaul3-workshop-") && /compare|branch|rank/.test(module.id),
    )
    .map(item => item.index + 1);
  const unique = [...new Set(preferred)].filter(index => index > 1 && index < modules.length - 1);
  if (unique.length) return unique;
  return [0.2, 0.4, 0.6, 0.8].map(fraction => Math.max(2, Math.min(modules.length - 1, Math.floor(modules.length * fraction))));
}

function addDensityRepairs(course: Course, modules: Module[], count: number, startNumber: number) {
  if (count <= 0) return modules;
  const result = [...modules];
  const anchors = safeInsertionIndexes(result);
  let offset = 0;
  for (let i = 0; i < count; i += 1) {
    const base = anchors[i % anchors.length] ?? Math.floor(((i + 1) / (count + 1)) * result.length);
    const index = Math.max(1, Math.min(result.length - 1, base + offset));
    result.splice(index, 0, repairActivity(course, startNumber + i, result.slice(0, index)));
    offset += 1;
  }
  return result;
}

export function repairPresentationEngagementPhase6(course: Course): Course {
  const id = safeId(course.id);
  const cleanModules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));
  const broken = breakPassiveRuns(course, cleanModules);
  const densityRepairs = neededForTarget(broken.modules);
  const modules = addDensityRepairs(course, broken.modules, densityRepairs, broken.nextNumber);
  const added = modules.length - cleanModules.length;
  return { ...course, duration: course.duration + added * 2, modules };
}

function makeCheck(id: string, label: string, passed: boolean, score: number, maxScore: number, detail: string): Phase6EngagementCheck {
  return { id, label, passed, score: passed ? score : 0, maxScore, detail };
}

export function auditPresentationEngagementPhase6(course: Course): Phase6EngagementAudit {
  const rhythm = auditPresentationOverhaulPhase1(course);
  const reading = auditProfessionalReadingPhase2(course);
  const workshop = auditWorkshopActivityPhase3(course);
  const cases = auditProgressiveCasePhase4(course);
  const live = auditLivePresenterPhase5(course);
  const repairs = course.modules.filter(module => module.id.startsWith(`${PREFIX}${safeId(course.id)}-`)).length;

  const checks = [
    makeCheck("rhythm-passive", "No long passive runs", rhythm.longestPassiveRun <= 3, 10, 10, `${rhythm.longestPassiveRun} passive slides at most`),
    makeCheck("rhythm-active", "Strong active-learning share", rhythm.activeShare >= TARGET_ACTIVE_SHARE, 10, 10, `${rhythm.activeShare}% active slides; target ${TARGET_ACTIVE_SHARE}%+`),
    makeCheck("cycles", "Four active learning cycles", rhythm.cycleAnchors === 4 && rhythm.cycleActivities >= 3, 10, 10, `${rhythm.cycleAnchors}/4 cycle anchors · ${rhythm.cycleActivities} core cycle activities`),
    makeCheck("reading", "Substantial professional reading", reading.readingModules === 3 && reading.totalCoreWords >= 900 && reading.processingActivities === 3 && reading.glossaryTerms >= 15 && reading.pausePrompts >= 9, 15, 15, `${reading.totalCoreWords} core words · ${reading.glossaryTerms} glossary terms · ${reading.pausePrompts} processing prompts`),
    makeCheck("workshop", "Varied workshop interaction", workshop.workshopActivities === 8 && workshop.uniqueKinds === 8 && workshop.choicePoints >= 30 && workshop.hasBranchingCase && workshop.hasEvidenceSort && workshop.hasCompareAndRank, 20, 20, `${workshop.workshopActivities}/8 activity types · ${workshop.choicePoints} choice points`),
    makeCheck("cases", "Progressive cases and rehearsal", cases.caseArcs === 2 && cases.case1Complete && cases.case2Complete && cases.modules === 14 && cases.decisionPoints >= 18 && cases.requiredSecondAttempts === 2, 20, 20, `${cases.caseArcs}/2 case arcs · ${cases.modules} case modules · ${cases.requiredSecondAttempts} required retries`),
    makeCheck("live", "Course-aware live interaction", live.ready && live.moments >= 8 && live.kinds === 5 && live.distributed, 15, 15, `${live.moments} live moments · ${live.kinds}/5 interaction families`),
  ];
  const score = checks.reduce((sum, item) => sum + item.score, 0);
  const ready = checks.every(item => item.passed);
  return {
    courseId: course.id,
    title: course.title,
    score,
    ready,
    activeShare: rhythm.activeShare,
    longestPassiveRun: rhythm.longestPassiveRun,
    coreReadingWords: reading.totalCoreWords,
    workshopActivities: workshop.workshopActivities,
    choicePoints: workshop.choicePoints + cases.decisionPoints,
    progressiveCases: cases.caseArcs,
    caseModules: cases.modules,
    liveMoments: live.moments,
    liveKinds: live.kinds,
    autoRepairs: repairs,
    checks,
  };
}

export function validatePresentationEngagementPhase6(course: Course) {
  const audit = auditPresentationEngagementPhase6(course);
  const failed = audit.checks.filter(check => !check.passed);
  if (failed.length) throw new Error(`CPD course ${course.id} failed presentation-overhaul Phase 6 engagement QA: ${failed.map(check => check.label).join(", ")}`);
}

export function summarisePresentationEngagementPhase6(courses: Course[]) {
  const reports = courses.map(auditPresentationEngagementPhase6);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    averageActiveShare: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.activeShare, 0) / reports.length) : 0,
    minimumActiveShare: reports.length ? Math.min(...reports.map(report => report.activeShare)) : 0,
    longestPassiveRun: reports.length ? Math.max(...reports.map(report => report.longestPassiveRun)) : 0,
    autoRepairs: reports.reduce((sum, report) => sum + report.autoRepairs, 0),
    totalCoreReadingWords: reports.reduce((sum, report) => sum + report.coreReadingWords, 0),
    totalChoicePoints: reports.reduce((sum, report) => sum + report.choicePoints, 0),
    totalLiveMoments: reports.reduce((sum, report) => sum + report.liveMoments, 0),
    reports,
  };
}
