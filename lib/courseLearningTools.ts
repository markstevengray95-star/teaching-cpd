import type { Course, Module } from "./data";
import { questionsForModule, type Question } from "./assessmentQuestions";
import { isSafetyCourse } from "./classroomPractice";

export const learningToolsVersion = 1;
export const toolkitKey = "learning-tools:takeaway:v1";
export const personalisationKey = "learning-tools:start:v1";
export const practiceRoles = ["Teacher", "Teaching assistant", "Pastoral staff", "Leader"] as const;
export const practicePhases = ["Primary", "Secondary", "Post-16"] as const;
export type PracticeRole = typeof practiceRoles[number];
export type PracticePhase = typeof practicePhases[number];

export function startingQuestions(course: Course) {
  return courseQuestions(course).slice(0, 3);
}

export function readStartingPoint(course: Course, raw?: string) {
  const fallback = { role: "Teacher" as PracticeRole, phase: "Secondary" as PracticePhase, answers: {} as Record<number, number>, checked: false };
  try {
    const value = JSON.parse(raw || "{}"), questions = startingQuestions(course);
    if (value.version !== 1) return fallback;
    const role = practiceRoles.includes(value.role) ? value.role as PracticeRole : fallback.role;
    const phase = practicePhases.includes(value.phase) ? value.phase as PracticePhase : fallback.phase;
    if (JSON.stringify(value.questionIds) !== JSON.stringify(questions.map(q => q.question))) return { ...fallback, role, phase };
    const answers: Record<number, number> = {};
    questions.forEach((q, i) => { const n = value.answers?.[i]; if (Number.isInteger(n) && n >= 0 && n < q.options.length) answers[i] = n; });
    return { role, phase, answers, checked: questions.length > 0 && Object.keys(answers).length === questions.length };
  } catch { return fallback; }
}

export function recommendedFocus(course: Course, percent: number, weakTopics: string[]) {
  const reading = course.modules.find(m => m.type === "content" && !m.title.startsWith("Reference · "))
    || course.modules.find(m => m.type === "content");
  const caseModule = course.modules.find(m => m.type === "scenario");
  const check = course.modules.find(m => m.type === "quiz" && questionsForModule(m).some(q => weakTopics.includes(q.topic)));
  const ids = percent >= 80 ? [caseModule?.id, check?.id] : [reading?.id, check?.id, caseModule?.id];
  return {
    label: percent >= 80 ? "Apply and test your understanding" : percent >= 50 ? "Read selectively, then practise" : "Build the foundations, then rehearse",
    moduleIds: [...new Set(ids.filter((id): id is string => Boolean(id)))],
    explanation: percent >= 80
      ? "This short starting check suggests you can focus on applying the ideas. It is not proof of competence; all required course tasks still apply."
      : "Use the explanation and case to investigate the ideas you missed. Revisit the linked check after reading; the recommendation does not replace the complete course.",
  };
}

export function roleExample(course: Course, role: PracticeRole, phase: PracticePhase) {
  const safe = isSafetyCourse(course) || course.category === "Safeguarding";
  const scenario = course.modules.find(m => m.type === "scenario");
  const roles = {
    Teacher: safe ? "Rehearse your immediate response and reporting route within your role; do not investigate or improvise specialist action." : "Plan an explanation or response, sample evidence from across the group, and decide your next teaching move.",
    "Teaching assistant": safe ? "Identify what you should report to the designated colleague and what you should not take on independently." : "Rehearse an agreed prompt with the teacher. Decide when to pause support so the learner can attempt the thinking, and what evidence to share back.",
    "Pastoral staff": safe ? "Separate reported facts from assumptions and identify the designated route and follow-up responsibility." : "Plan a check-in that identifies the specific barrier, agrees one manageable next step and connects with the teaching team.",
    Leader: safe ? "Check that staff know the current procedure, designated contacts and limits of their role. Identify a gap to resolve without collecting personal case details here." : "Use the case in a team discussion. Agree what staff need to rehearse, one implementation barrier and how you will review evidence without adding unnecessary workload.",
  };
  const phases = {
    Primary: safe ? "Consider the school's current supervision and communication arrangements for this setting." : "Use a short oral or visual example. Check whether the response reflects understanding rather than an adult supplying the answer.",
    Secondary: safe ? "Consider how current arrangements are communicated across subject rooms and staff changes." : "Connect the example to a subject task and its prerequisites. Check whether the same difficulty appears in a different question.",
    "Post-16": safe ? "Check the setting's current procedures and age-appropriate responsibilities; familiarity or independence is not evidence that a risk is controlled." : "Connect the example to an extended or independent task. Ask what evidence shows the learner can transfer the idea without the original prompt.",
  };
  return { case: scenario?.type === "scenario" ? scenario.prompt : course.summary, objective: course.objectives[0], roleTask: roles[role], phaseTask: phases[phase] };
}

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
