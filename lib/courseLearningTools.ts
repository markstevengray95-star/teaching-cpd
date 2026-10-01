import type { Course, Module } from "./data";
import { questionsForModule, type Question } from "./assessmentQuestions";
import { isSafetyCourse } from "./classroomPractice";

export const learningToolsVersion = 1;
export const toolkitKey = "learning-tools:takeaway:v1";

export function courseQuestions(course: Course): Question[] {
  const unique = new Map<string, Question>();
  for (const module of course.modules) if (module.type === "quiz") {
    for (const question of questionsForModule(module)) if (!unique.has(question.question)) unique.set(question.question, question);
  }
  return [...unique.values()];
}

/** Use the actual course questions and cases, not a category-level invented answer. */
export function activityChallenge(course: Course, module: Module) {
  const activities = course.modules.filter(m => m.type === "activity");
  const position = Math.max(0, activities.findIndex(m => m.id === module.id));
  const bank = courseQuestions(course);
  const question = bank[position % Math.max(1, bank.length)];
  const cases = course.modules.filter((m): m is Extract<Module, { type: "scenario" }> => m.type === "scenario");
  const scenario = cases[position % Math.max(1, cases.length)];
  return {
    objective: course.objectives[position % course.objectives.length],
    question,
    weakResponse: question?.options.find((_, i) => i !== question.answer),
    scenario,
    safe: isSafetyCourse(course) || course.category === "Safeguarding",
  };
}

export function choiceFeedback(module: Extract<Module, { type: "quiz" }>, choice: number) {
  return {
    correct: choice === module.answer,
    selected: module.options[choice],
    model: module.options[module.answer],
    explanation: module.feedback,
    next: choice === module.answer
      ? "Explain why this response fits the question. What detail in a different situation could change your decision?"
      : "Compare your selection with the course response. Identify the distinction you missed, revisit the explanation, then try again.",
  };
}

export type Takeaway = { problem: string; action: string; support: string; evidence: string; reviewDate: string };
export const emptyTakeaway: Takeaway = { problem: "", action: "", support: "", evidence: "", reviewDate: "" };
export function readTakeaway(raw?: string): Takeaway {
  try {
    const value = JSON.parse(raw || "{}");
    if (value.version !== learningToolsVersion) return { ...emptyTakeaway };
    return Object.fromEntries(Object.entries(emptyTakeaway).map(([key]) => [key, typeof value[key] === "string" ? value[key] : ""])) as Takeaway;
  } catch { return { ...emptyTakeaway }; }
}
export function takeawayText(course: Course, value: Takeaway) {
  const safe = isSafetyCourse(course) || course.category === "Safeguarding";
  return [
    course.title + " — practical takeaway",
    "Course focus: " + course.objectives.join("; "),
    "Problem or need: " + value.problem,
    "One action: " + value.action,
    "Resources / designated support: " + value.support,
    "Evidence and review criteria: " + value.evidence,
    "Review date: " + value.reviewDate,
    ...(safe ? ["Use current school procedures and designated professional guidance. This template is not specialist certification."] : []),
    "Fictional or non-identifiable examples only. Do not add confidential pupil or staff information.",
  ].join("\n\n");
}
