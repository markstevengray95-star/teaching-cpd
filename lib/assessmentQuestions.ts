import type { Module } from "./data";
export type Question = { topic: string; question: string; options: string[]; answer: number; feedback: string; reteach: string };
export function decodeQuestion(value: string): Question | null {
  const match = value.match(/^\[q\|([^|]+)\|(\d+)\]\s*([\s\S]*)$/);
  if (!match) return null;
  const parts = match[3].split("§"), answer = Number(match[2]);
  if (parts.length !== 7 || parts.some(p => !p.trim()) || !Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  return { topic: match[1], question: parts[0], options: parts.slice(1, 5), answer, feedback: parts[5], reteach: parts[6] };
}
export function isAssessmentBank(module: Module) { return module.type === "quiz" && module.options.some(o => o.startsWith("[q|")); }
export function questionsForModule(module: Extract<Module, { type: "quiz" }>): Question[] {
  if (isAssessmentBank(module)) return module.options.map(decodeQuestion).filter((q): q is Question => q !== null);
  return [{ topic: module.id, question: module.question, options: module.options, answer: module.answer, feedback: module.feedback, reteach: "Review the explanation and try again." }];
}
export function assessmentConfig(id: string) {
  if (id.endsWith("-diagnostic")) return { count: 5, threshold: 0, label: "Diagnostic: no pass mark" };
  if (id.endsWith("-retrieval")) return { count: 5, threshold: 75, label: "Retrieval: at least 75%" };
  if (id.endsWith("-scenario")) return { count: 4, threshold: 75, label: "Application: at least 75%" };
  if (id.endsWith("-mastery")) return { count: 6, threshold: 80, label: "Mastery: at least 80%" };
  return { count: 3, threshold: 100, label: "Application gate: all correct" };
}
export function selectAssessmentQuestions(bank: Question[], id: string, attempt: number) {
  const config = assessmentConfig(id), start = (attempt * 2) % Math.max(1, bank.length);
  return [...bank.slice(start), ...bank.slice(0, start)].slice(0, config.count);
}
export function scoreAssessment(questions: Question[], answers: Record<number, number>) {
  const complete = questions.length > 0 && questions.every((q, i) => Number.isInteger(answers[i]) && answers[i] >= 0 && answers[i] < q.options.length);
  const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  return { complete, correct, percent: questions.length ? Math.round(correct / questions.length * 100) : 0 };
}

