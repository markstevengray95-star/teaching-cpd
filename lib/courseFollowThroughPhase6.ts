import type { Course, Module } from "./data";

const SEP = "§";
const PHASE5_PREFIX = "phase5-assess-";

type QuizModule = Extract<Module, { type: "quiz" }>;

export type Phase6RetrievalQuestion = {
  topic: string;
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  reteach: string;
};

export const PHASE6_REVIEW_STAGES = [
  { id: "1_week", label: "7-day transfer check", days: 7, purpose: "Did the planned change actually make it into practice?" },
  { id: "1_month", label: "30-day impact review", days: 30, purpose: "What evidence suggests the change is helping, neutral or unhelpful?" },
  { id: "3_month", label: "90-day sustain review", days: 90, purpose: "Should the practice be kept, adapted, faded or stopped?" },
] as const;

function parseEncodedQuestion(value: string): Phase6RetrievalQuestion | null {
  const match = value.match(/^\[q\|([^|]+)\|(\d+)\]\s*(.*)$/);
  if (!match) return null;
  const parts = match[3].split(SEP);
  const answer = Number(match[2]);
  if (parts.length < 7 || !Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  return {
    topic: match[1],
    prompt: parts[0],
    options: [parts[1], parts[2], parts[3], parts[4]],
    answer,
    explanation: parts[5],
    reteach: parts[6],
  };
}

export function getPhase6RetrievalQuestions(course: Course): Phase6RetrievalQuestion[] {
  const phase5 = course.modules
    .filter((module): module is QuizModule => module.type === "quiz" && module.id.startsWith(PHASE5_PREFIX));
  const preferred = [
    ...phase5.filter(module => module.id.endsWith("-mastery")),
    ...phase5.filter(module => module.id.endsWith("-scenario")),
    ...phase5.filter(module => module.id.endsWith("-retrieval")),
    ...phase5,
  ];
  const seen = new Set<string>();
  const questions: Phase6RetrievalQuestion[] = [];
  for (const module of preferred) {
    for (const option of module.options) {
      const question = parseEncodedQuestion(option);
      if (!question) continue;
      const key = question.prompt.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      questions.push(question);
    }
  }
  return questions;
}

export function findImplementationCommitmentModule(course: Course) {
  return course.modules.find(module => /implementation[-_ ]commitment|commitment/i.test(`${module.id} ${module.title}`)) || null;
}

export function validateCourseFollowThroughPhase6(course: Course) {
  const retrieval = getPhase6RetrievalQuestions(course);
  if (retrieval.length < 8) throw new Error(`CPD course ${course.id} needs at least 8 Phase 6 spaced-retrieval questions`);
  if (!course.modules.some(module => module.id.startsWith(PHASE5_PREFIX) && module.id.endsWith("-mastery"))) {
    throw new Error(`CPD course ${course.id} needs a Phase 5 mastery source before Phase 6 follow-through`);
  }
  if (!course.modules.some(module => module.id.startsWith(PHASE5_PREFIX) && module.id.endsWith("-application"))) {
    throw new Error(`CPD course ${course.id} needs a demonstrated-application gate before Phase 6 follow-through`);
  }
}

export function auditCourseFollowThroughPhase6(course: Course) {
  const retrieval = getPhase6RetrievalQuestions(course);
  return {
    courseId: course.id,
    title: course.title,
    followThroughReady: retrieval.length >= 8,
    retrievalQuestions: retrieval.length,
    checkpoints: PHASE6_REVIEW_STAGES.length,
    hasImplementationCommitment: Boolean(findImplementationCommitmentModule(course)),
    evidenceReady: true,
  };
}
