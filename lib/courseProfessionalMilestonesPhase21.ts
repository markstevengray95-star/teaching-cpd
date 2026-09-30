import type { Course } from "./data";

export const PRESENTATION_OVERHAUL_PHASE21_VERSION = "2026.22";

export type Phase21Window = "half_term" | "term";
export type Phase21Milestone = {
  id: string;
  title: string;
  window: Phase21Window;
  threshold: number;
  unit: "activities" | "courses" | "evidence_types" | "deep_tasks";
  description: string;
  whyItMatters: string;
};

export type Phase21Audit = {
  courseId: string;
  title: string;
  milestones: number;
  halfTermMilestones: number;
  termMilestones: number;
  dailyStreaks: number;
  leaderboards: number;
  evidenceBased: boolean;
  ready: boolean;
  score: number;
};

export const PHASE21_MILESTONES: Phase21Milestone[] = [
  {
    id: "half-term-five",
    title: "Half-term development momentum",
    window: "half_term",
    threshold: 5,
    unit: "activities",
    description: "Complete five substantial professional-development activities across the last six weeks.",
    whyItMatters: "Recognises sustained development without turning professional learning into a daily attendance streak.",
  },
  {
    id: "half-term-breadth",
    title: "Half-term evidence breadth",
    window: "half_term",
    threshold: 3,
    unit: "evidence_types",
    description: "Use at least three different kinds of learning evidence across the half-term window.",
    whyItMatters: "Rewards breadth of professional thinking rather than repeating one easy activity type.",
  },
  {
    id: "term-ten",
    title: "Term development milestone",
    window: "term",
    threshold: 10,
    unit: "activities",
    description: "Complete ten substantial development activities across the term window.",
    whyItMatters: "Creates a positive term-level milestone based on meaningful work rather than app usage frequency.",
  },
  {
    id: "term-cross-course",
    title: "Cross-course transfer",
    window: "term",
    threshold: 3,
    unit: "courses",
    description: "Secure substantive evidence in at least three different CPD courses during the term window.",
    whyItMatters: "Recognises professional learning that transfers across more than one topic or course.",
  },
  {
    id: "term-deep-practice",
    title: "Deep professional practice",
    window: "term",
    threshold: 4,
    unit: "deep_tasks",
    description: "Complete four higher-order tasks such as consequence reasoning, investigation, improvement, AI critique or team design.",
    whyItMatters: "Recognises difficult professional thinking rather than rewarding passive consumption.",
  },
];

export const PHASE21_HALF_TERM_DAYS = 42;
export const PHASE21_TERM_DAYS = 120;

export function validateProfessionalMilestonesPhase21() {
  if (PHASE21_MILESTONES.length < 5) throw new Error("Phase 21 requires a substantial milestone set");
  if (!PHASE21_MILESTONES.some(item => item.window === "half_term")) throw new Error("Phase 21 requires half-term milestones");
  if (!PHASE21_MILESTONES.some(item => item.window === "term")) throw new Error("Phase 21 requires term milestones");
  const text = PHASE21_MILESTONES.map(item => `${item.title} ${item.description} ${item.whyItMatters}`).join(" ");
  if (/daily streak|consecutive day|login streak/i.test(text)) throw new Error("Phase 21 must not use addictive daily streak mechanics");
  if (/leaderboard|rank staff|top staff/i.test(text)) throw new Error("Phase 21 must not rank individual staff");
  if (PHASE21_MILESTONES.some(item => item.threshold <= 0)) throw new Error("Phase 21 milestones require meaningful positive thresholds");
  return true;
}

export function auditProfessionalMilestonesPhase21(course: Course): Phase21Audit {
  let ready = true;
  try { validateProfessionalMilestonesPhase21(); } catch { ready = false; }
  const text = PHASE21_MILESTONES.map(item => `${item.title} ${item.description}`).join(" ");
  const dailyStreaks = (text.match(/daily streak|consecutive day|login streak/gi) || []).length;
  const leaderboards = (text.match(/leaderboard|rank staff|top staff/gi) || []).length;
  const halfTermMilestones = PHASE21_MILESTONES.filter(item => item.window === "half_term").length;
  const termMilestones = PHASE21_MILESTONES.filter(item => item.window === "term").length;
  const evidenceBased = PHASE21_MILESTONES.every(item => ["activities","courses","evidence_types","deep_tasks"].includes(item.unit));
  const score = Math.min(100,
    (PHASE21_MILESTONES.length >= 5 ? 20 : 0) +
    (halfTermMilestones >= 2 ? 15 : 0) +
    (termMilestones >= 3 ? 15 : 0) +
    (dailyStreaks === 0 ? 20 : 0) +
    (leaderboards === 0 ? 20 : 0) +
    (ready && evidenceBased ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, milestones: PHASE21_MILESTONES.length, halfTermMilestones, termMilestones, dailyStreaks, leaderboards, evidenceBased, ready, score };
}

export function summariseProfessionalMilestonesPhase21(courses: Course[]) {
  const reports = courses.map(auditProfessionalMilestonesPhase21);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    milestones: PHASE21_MILESTONES.length,
    halfTermMilestones: PHASE21_MILESTONES.filter(item => item.window === "half_term").length,
    termMilestones: PHASE21_MILESTONES.filter(item => item.window === "term").length,
    dailyStreaks: reports.reduce((sum, report) => sum + report.dailyStreaks, 0),
    leaderboards: reports.reduce((sum, report) => sum + report.leaderboards, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
