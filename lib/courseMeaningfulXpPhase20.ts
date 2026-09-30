import type { Course } from "./data";

export const PRESENTATION_OVERHAUL_PHASE20_VERSION = "2026.21";

export type Phase20EvidenceKey = "assessment" | "inspection" | "adventure" | "investigation" | "improvement" | "ai_critique" | "deep_reflection" | "mastery_chain";
export type Phase20Achievement = {
  id: string;
  evidenceKey: Phase20EvidenceKey;
  title: string;
  xp: number;
  description: string;
  evidence: string;
  icon: string;
};
export type Phase20Tier = { id: string; label: string; minimumXp: number; description: string };
export type Phase20Audit = {
  courseId: string;
  title: string;
  achievements: number;
  totalAvailableXp: number;
  evidenceTypes: number;
  clickAwards: number;
  meaningfulOnly: boolean;
  ready: boolean;
  score: number;
};

export const PHASE20_ACHIEVEMENTS: Phase20Achievement[] = [
  { id: "assessment-secured", evidenceKey: "assessment", title: "Assessment Secured", xp: 100, icon: "A", description: "Pass a substantive Phase 5 assessment rather than simply completing a slide.", evidence: "At least one Phase 5 assessment record has passed=true." },
  { id: "evidence-detective", evidenceKey: "inspection", title: "Evidence Detective", xp: 90, icon: "E", description: "Complete a Phase 15 inspection by identifying or reviewing the professional evidence accurately.", evidence: "At least one Phase 15 inspection is complete." },
  { id: "consequence-thinker", evidenceKey: "adventure", title: "Consequence Thinker", xp: 120, icon: "C", description: "Complete the consequence-led branching adventure and save a transfer action.", evidence: "Phase 16 adventure complete=true." },
  { id: "case-investigator", evidenceKey: "investigation", title: "Case Investigator", xp: 140, icon: "I", description: "Process all staged evidence, make the evidence-led judgement and save the professional next action.", evidence: "Phase 17 investigation complete=true." },
  { id: "practice-improver", evidenceKey: "improvement", title: "Practice Improver", xp: 160, icon: "P", description: "Substantively improve a weak response, compare it with the expert model and complete the self-review.", evidence: "Phase 18 studio complete=true." },
  { id: "ai-critical-thinker", evidenceKey: "ai_critique", title: "AI Critical Thinker", xp: 150, icon: "AI", description: "Answer independently, correctly critique the AI response and produce a stronger final professional answer.", evidence: "Phase 19 challenge complete=true." },
  { id: "reflective-practitioner", evidenceKey: "deep_reflection", title: "Reflective Practitioner", xp: 180, icon: "R", description: "Build a chain of written transfer, evidence and improvement actions across advanced course activities.", evidence: "Phase 16, 17, 18 and 19 written responses all meet their substantive completion thresholds." },
  { id: "professional-mastery", evidenceKey: "mastery_chain", title: "Professional Mastery Chain", xp: 300, icon: "M", description: "Combine assessment, evidence inspection, consequence reasoning, investigation, improvement and AI critique in one course.", evidence: "All six core evidence-based achievements are secured." },
];

export const PHASE20_TIERS: Phase20Tier[] = [
  { id: "starting", label: "Building Evidence", minimumXp: 0, description: "Begin collecting demonstrated evidence of professional learning." },
  { id: "developing", label: "Evidence User", minimumXp: 200, description: "Use evidence in more than one substantial course activity." },
  { id: "applying", label: "Practice Improver", minimumXp: 500, description: "Apply, critique and improve professional responses across the course." },
  { id: "implementing", label: "Implementation Builder", minimumXp: 900, description: "Connect judgement, transfer and implementation evidence consistently." },
  { id: "mastery", label: "Professional Mastery", minimumXp: 1300, description: "Secure the full evidence-led learning chain across the course." },
];

export function phase20TierForXp(xp: number) {
  return [...PHASE20_TIERS].reverse().find(tier => xp >= tier.minimumXp) || PHASE20_TIERS[0];
}

export function phase20NextTierForXp(xp: number) {
  return PHASE20_TIERS.find(tier => tier.minimumXp > xp) || null;
}

export function validateMeaningfulXpPhase20() {
  if (PHASE20_ACHIEVEMENTS.length < 8) throw new Error("Phase 20 requires a substantial achievement set");
  if (PHASE20_ACHIEVEMENTS.some(item => item.xp <= 0 || !item.evidence.trim())) throw new Error("Phase 20 achievements need positive XP and explicit evidence rules");
  if (PHASE20_ACHIEVEMENTS.some(item => /click|open slide|time-on-page|streak/i.test(item.description + item.evidence))) throw new Error("Phase 20 must not award XP for superficial engagement");
  const keys = new Set(PHASE20_ACHIEVEMENTS.map(item => item.evidenceKey));
  if (keys.size < 8) throw new Error("Phase 20 needs diverse meaningful evidence types");
  return true;
}

export function auditMeaningfulXpPhase20(course: Course): Phase20Audit {
  let ready = true;
  try { validateMeaningfulXpPhase20(); } catch { ready = false; }
  const totalAvailableXp = PHASE20_ACHIEVEMENTS.reduce((sum, item) => sum + item.xp, 0);
  const evidenceTypes = new Set(PHASE20_ACHIEVEMENTS.map(item => item.evidenceKey)).size;
  const clickAwards = PHASE20_ACHIEVEMENTS.filter(item => /click|open slide|time-on-page|streak/i.test(item.description + item.evidence)).length;
  const meaningfulOnly = clickAwards === 0;
  const score = Math.min(100,
    (PHASE20_ACHIEVEMENTS.length >= 8 ? 20 : 0) +
    (evidenceTypes >= 8 ? 20 : 0) +
    (totalAvailableXp >= 1000 ? 15 : 0) +
    (PHASE20_TIERS.length >= 5 ? 15 : 0) +
    (meaningfulOnly ? 20 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, achievements: PHASE20_ACHIEVEMENTS.length, totalAvailableXp, evidenceTypes, clickAwards, meaningfulOnly, ready, score };
}

export function summariseMeaningfulXpPhase20(courses: Course[]) {
  const reports = courses.map(auditMeaningfulXpPhase20);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    achievementsPerCourse: PHASE20_ACHIEVEMENTS.length,
    totalAvailableXpPerCourse: PHASE20_ACHIEVEMENTS.reduce((sum, item) => sum + item.xp, 0),
    evidenceTypes: new Set(PHASE20_ACHIEVEMENTS.map(item => item.evidenceKey)).size,
    meaningfulOnly: reports.every(report => report.meaningfulOnly),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
