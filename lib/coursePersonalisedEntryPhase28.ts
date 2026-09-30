import type { Course, CourseCategory, Module } from "./data";

export const PRESENTATION_OVERHAUL_PHASE28_VERSION = "2026.29";

export type Phase28RouteId = "new" | "basics" | "practical" | "experienced" | "leading";
export type Phase28Route = {
  id: Phase28RouteId;
  label: string;
  strapline: string;
  challenge: string;
  recommendedTypes: Module["type"][];
  emphasis: string[];
  openingPrompt: string;
};
export type Phase28Pack = {
  id: string;
  title: string;
  subtitle: string;
  routes: Phase28Route[];
};
export type Phase28Audit = {
  courseId: string;
  title: string;
  routes: number;
  distinctChallenges: number;
  categorySpecific: boolean;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function categoryPrompt(category: CourseCategory, course: Course) {
  if (category === "Safeguarding") return {
    practical: "As you work through this route, keep asking: what should the member of staff notice, record and pass through the school's current safeguarding route without drifting into investigation?",
    experienced: "Use each example to test professional boundaries, factual recording and uncertainty. Where could a plausible response accidentally exceed the ordinary staff role?",
    leading: "Consider how you would make the school's current safeguarding route, reporting expectations and professional boundaries easy for every member of staff to understand and enact.",
  };
  if (category === "SEND") return {
    practical: "Keep linking each strategy to the barrier it is intended to remove, the learning goal it should protect and the evidence that will show whether independence improves.",
    experienced: "Challenge any adaptation that looks supportive but lowers ambition, solves the wrong barrier or creates prompt dependence.",
    leading: "Consider how a team can make adaptive practice more consistent without turning SEND support into fixed strategies attached to labels.",
  };
  if (category === "Leadership") return {
    practical: "Translate each idea into one implementation move that improves clarity, capability or capacity and has a realistic review point.",
    experienced: "Test whether each leadership response diagnoses the implementation barrier or merely increases monitoring and visible compliance.",
    leading: "Use the course to design a small implementation sequence your team could model, rehearse, support and review without unnecessary workload.",
  };
  if (category === "Wellbeing") return {
    practical: "Look for one controllable workload or system condition that could be removed, simplified, sequenced or redesigned rather than adding another wellbeing activity.",
    experienced: "Test whether each proposed improvement changes the source of pressure or simply shifts responsibility back to individual coping.",
    leading: "Use the course to plan a bounded team-level change and define evidence that would show workload reduced without moving elsewhere.",
  };
  if (category === "Digital Teaching") return {
    practical: "For each tool or workflow, define the professional purpose, data boundary, verification step, accessibility check and human owner of the final decision.",
    experienced: "Challenge fluent or time-saving digital outputs for accuracy, privacy, accessibility and unintended dependency before judging them successful.",
    leading: "Use the course to define a team safe-use routine that supports innovation while keeping verification and human accountability explicit.",
  };
  return {
    practical: `Use ${course.title} to choose one teaching move you can try, the learning problem it addresses and the pupil evidence you will check afterwards.`,
    experienced: "Challenge surface-level success. Look for independent evidence of pupil thinking, transfer and the conditions under which the approach should be adapted.",
    leading: "Use the course to build a shared team routine around one principle, including modelling, rehearsal, implementation evidence and a review decision.",
  };
}

export function getPhase28Pack(course: Course): Phase28Pack {
  const prompt = categoryPrompt(course.category, course);
  return {
    id: `phase28-${safeId(course.id)}`,
    title: `Choose your route · ${course.title}`,
    subtitle: "Start from your current experience and goal. The course content stays the same, but your route highlights the most useful slides and changes the professional challenge prompts.",
    routes: [
      {
        id: "new",
        label: "New to this topic",
        strapline: "Build the core idea first",
        challenge: "Guided foundation",
        recommendedTypes: ["content", "visual", "quiz"],
        emphasis: ["Core definitions and principles", "Worked examples and visual explanations", "Low-stakes knowledge checks"],
        openingPrompt: `Begin by explaining ${course.title} in plain language: what problem does it address and what should staff expect to notice if it is working?`,
      },
      {
        id: "basics",
        label: "Refresh the basics",
        strapline: "Retrieve the essentials quickly",
        challenge: "Retrieval and correction",
        recommendedTypes: ["visual", "quiz", "reflection", "content"],
        emphasis: ["Key principles rather than every detail", "Misconceptions and non-examples", "A concise action to refresh in practice"],
        openingPrompt: `Before reading on, list three ideas you already associate with ${course.title}. Use the course to correct, sharpen or replace them.`,
      },
      {
        id: "practical",
        label: "I want practical strategies",
        strapline: "Move quickly into application",
        challenge: "Applied practice",
        recommendedTypes: ["scenario", "activity", "checklist", "visual"],
        emphasis: ["Realistic scenarios and decision points", "Actions staff can rehearse", "Evidence to check after trying the strategy"],
        openingPrompt: prompt.practical,
      },
      {
        id: "experienced",
        label: "Experienced practitioner",
        strapline: "Skip surface familiarity and critique",
        challenge: "Critical professional judgement",
        recommendedTypes: ["scenario", "activity", "reflection", "quiz"],
        emphasis: ["Edge cases and competing explanations", "Evidence quality and professional boundaries", "When to adapt, fade or stop an approach"],
        openingPrompt: prompt.experienced,
      },
      {
        id: "leading",
        label: "I am leading others",
        strapline: "Turn learning into implementation",
        challenge: "Team implementation",
        recommendedTypes: ["scenario", "reflection", "checklist", "activity"],
        emphasis: ["Shared language and modelling", "Implementation barriers and workload", "Team evidence, follow-up and review"],
        openingPrompt: prompt.leading,
      },
    ],
  };
}

export function validatePersonalisedEntryPhase28(course: Course) {
  const pack = getPhase28Pack(course);
  if (pack.routes.length !== 5) throw new Error(`Phase 28 ${course.id}: requires five entry routes`);
  if (new Set(pack.routes.map(route => route.id)).size !== 5) throw new Error(`Phase 28 ${course.id}: route ids must be unique`);
  if (pack.routes.some(route => route.recommendedTypes.length < 3 || route.emphasis.length < 3 || !route.openingPrompt.trim())) throw new Error(`Phase 28 ${course.id}: routes need recommendations, emphasis and a prompt`);
  if (new Set(pack.routes.map(route => route.challenge)).size < 5) throw new Error(`Phase 28 ${course.id}: challenge levels need to be distinct`);
  return true;
}

export function auditPersonalisedEntryPhase28(course: Course): Phase28Audit {
  const pack = getPhase28Pack(course);
  let ready = true;
  try { validatePersonalisedEntryPhase28(course); } catch { ready = false; }
  const distinctChallenges = new Set(pack.routes.map(route => route.challenge)).size;
  const categorySpecific = pack.routes.some(route => route.id === "practical" && !route.openingPrompt.startsWith("Begin by"));
  const score = Math.min(100, (pack.routes.length === 5 ? 30 : 0) + (distinctChallenges === 5 ? 25 : 0) + (pack.routes.every(route => route.recommendedTypes.length >= 3) ? 20 : 0) + (categorySpecific ? 15 : 0) + (ready ? 10 : 0));
  return { courseId: course.id, title: course.title, routes: pack.routes.length, distinctChallenges, categorySpecific, ready, score };
}

export function summarisePersonalisedEntryPhase28(courses: Course[]) {
  const reports = courses.map(auditPersonalisedEntryPhase28);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    routesPerCourse: reports[0]?.routes || 0,
    totalRoutes: reports.reduce((sum, report) => sum + report.routes, 0),
    categorySpecific: reports.filter(report => report.categorySpecific).length,
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
