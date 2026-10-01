import { buildCourseExperience as sourceExperience, suggestedMode } from "./baseCourseExperience";
import type { Course, Module } from "./data";
import { questionsForModule } from "./assessmentQuestions";
import { isSafetyCourse } from "./classroomPractice";
export { suggestedMode };
export type { ExperienceMode, CourseExperience } from "./baseCourseExperience";

export function buildCourseExperience(course: Course, allCourses: Course[]) {
  const experience = sourceExperience(course, allCourses);
  if (isSafetyCourse(course)) {
    experience.myths = [
      { title: "Myth: a tidy space proves an activity is safe", body: "Consider the actual activity, equipment, access and people involved. Appearance alone does not establish safety." },
      { title: "Myth: a warning replaces a risk control", body: "Use the current school arrangements and appropriate controls. Pause unresolved activity and seek support within your role." },
      { title: "Myth: awareness training replaces specialist competence", body: "This rehearsal does not authorise specialist work, medical treatment or repairs. Follow current plans and trained guidance." },
    ];
    experience.research = [{ title: "Use the current arrangements", body: "Use the school's current risk assessments, reporting routes, emergency arrangements and relevant pupil-specific plans. This generic practice does not replace them.", strength: "Policy-critical" }];
    experience.beforeAfter = [{ before: "Proceed because this activity usually runs without an incident.", after: "Check what has changed, pause unresolved risks and obtain appropriate guidance before proceeding." }];
    experience.implementationChecklist = ["Identify the activity and anything that has changed.", "Check the current school arrangements and relevant pupil-specific plans.", "Control immediate hazards safely within your role and competence.", "Pause unresolved activity and obtain the designated support.", "Record or report concerns through the agreed route.", "Proceed only when the appropriate checks and arrangements are in place."];
    experience.annotatedExample = [...experience.implementationChecklist];
    experience.subjectExamples = experience.subjectExamples.map(e => ({ ...e, body: "Consider the real activity and equipment in this setting. Use relevant current risk assessments and competent support rather than transferring a generic classroom example unchanged." }));
    experience.phaseExamples = experience.phaseExamples.map(e => ({ ...e, body: "Check the needs, supervision and current arrangements for the people present. Do not infer safety from their age or familiarity with a routine." }));
  }
  const quizzes = course.modules.filter((m): m is Extract<Module, { type: "quiz" }> => m.type === "quiz" && Boolean(m.question.trim()) && Boolean(m.options[m.answer]?.trim()));
  const scenarios = course.modules.filter((m): m is Extract<Module, { type: "scenario" }> => m.type === "scenario" && Boolean(m.prompt.trim()) && m.options.length > 1);
  const decoded = quizzes.flatMap(questionsForModule);
  const questions = decoded.map(m => ({ front: `${m.question.includes("?") ? m.question : `${m.question}\nWhich response is correct, and why?`}\n\n${m.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join("\n")}`, back: `${m.options[m.answer]}\n\n${m.feedback}` }));
  const situations = scenarios.slice(0, 3).map(m => ({ front: `${m.prompt}\n\nWhat would you do, and why?`, back: m.options.map(o => `${o.label}: ${o.feedback}`).join("\n\n") }));
  const seen = new Set<string>();
  const flashcards = [...questions, ...situations].filter(c => {
    const key = c.front.trim(); if (!key || !c.back.trim() || seen.has(key)) return false; seen.add(key); return true;
  }).slice(0, 12);
  return { ...experience, flashcards, diagnostic: decoded.length ? decoded.slice(0, 5).map(q => ({ question: q.question, options: q.options, answer: q.answer, feedback: q.feedback })) : experience.diagnostic };
}
