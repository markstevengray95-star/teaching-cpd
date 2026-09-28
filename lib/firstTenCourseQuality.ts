import type { Course, Module } from "./data";

export const FIRST_TEN_COURSE_IDS = [
  "autism-inclusive-classroom",
  "adhd-classroom-strategies",
  "middle-leadership",
  "instructional-coaching",
  "staff-wellbeing",
  "behaviour-routines",
  "assessment-for-learning",
  "de-escalation",
  "dyslexia-classroom-support",
  "disciplinary-literacy",
] as const;

const firstTenIds = new Set<string>(FIRST_TEN_COURSE_IDS);

type ActivityModule = Extract<Module, { type: "activity" }>;

const bespokePractice: Partial<Record<(typeof FIRST_TEN_COURSE_IDS)[number], ActivityModule>> = {
  "de-escalation": {
    id: "qa10-deescalation-rehearsal",
    type: "activity",
    title: "Practice studio: rehearse a calm response",
    prompt: "Use a fictional or fully anonymised situation to rehearse how you would reduce heat, preserve dignity and follow school systems without turning the interaction into a public confrontation.",
    instructions: [
      "Describe the observable behaviour and immediate context without guessing the pupil's motive.",
      "Write the brief, calm language you would use first.",
      "Identify one environmental or task adjustment that could reduce unnecessary pressure while keeping expectations clear.",
      "State the point at which you would move to the school's agreed behaviour, pastoral or safeguarding route.",
      "Write what you would record or review afterwards so repeated patterns inform future support.",
    ],
    placeholder: "Observable situation…\nFirst calm response…\nPressure-reducing adjustment…\nEscalation point…\nFollow-up/recording…",
    minimumCharacters: 220,
  },
  "dyslexia-classroom-support": {
    id: "qa10-dyslexia-access-audit",
    type: "activity",
    title: "Practice studio: remove one literacy access barrier",
    prompt: "Choose an upcoming lesson resource or task and improve access without automatically reducing the subject thinking pupils are expected to do.",
    instructions: [
      "State the important subject learning that must remain intact.",
      "Identify the reading, spelling, processing, memory or recording demand that may create a barrier.",
      "Choose one proportionate adjustment, representation or assistive support that addresses that demand.",
      "State what thinking or disciplinary work the pupil must still do independently.",
      "Write the evidence you will use to decide whether the support helped and whether it should be kept, adapted or faded.",
    ],
    placeholder: "Learning goal…\nLiteracy/access demand…\nAdjustment…\nThinking pupils still do…\nEvidence…\nKeep/adapt/fade…",
    minimumCharacters: 220,
  },
  "disciplinary-literacy": {
    id: "qa10-disciplinary-literacy-design",
    type: "activity",
    title: "Practice studio: make disciplinary language visible",
    prompt: "Choose one authentic subject task and plan how you will explicitly teach the vocabulary, reading or writing move pupils need in order to think like a specialist in that subject.",
    instructions: [
      "State the disciplinary thinking the task requires: explain, compare, evaluate, justify, interpret or another subject-specific move.",
      "Identify the high-value vocabulary, text feature or sentence structure pupils need.",
      "Choose one model or annotated example that makes the expert move visible.",
      "Plan a short guided attempt where pupils use the language or structure themselves.",
      "Write the check that will tell you whether pupils understand the subject idea rather than merely copying the wording.",
    ],
    placeholder: "Disciplinary goal…\nLanguage/text demand…\nModel…\nGuided attempt…\nUnderstanding check…",
    minimumCharacters: 220,
  },
};

function isPresentationOverview(course: Course, module: Module) {
  return module.id === `presentation-${course.id}-map` || (module.id.startsWith("presentation-") && module.id.endsWith("-map"));
}

function isRedundantGenericSlide(course: Course, module: Module) {
  return module.id === `vx-map-${course.id}` || module.id === `vx-info-${course.id}`;
}

function replaceGenericPractice(course: Course, modules: Module[]) {
  const replacement = bespokePractice[course.id as keyof typeof bespokePractice];
  if (!replacement) return modules;
  const genericId = `presentation-${course.id}-practice`;
  let replaced = false;
  const next = modules.map(module => {
    if (module.id !== genericId) return module;
    replaced = true;
    return replacement;
  });
  if (!replaced && !next.some(module => module.type === "activity")) next.push(replacement);
  return next;
}

function chooseFinalReflection(course: Course, modules: Module[]) {
  const reflections = modules.filter((module): module is Extract<Module, { type: "reflection" }> => module.type === "reflection");
  const flagshipReflection = reflections.find(module => module.id === `mc-reflect-${course.id}`);
  return flagshipReflection || reflections.at(-1);
}

export function qualityAssureFirstTenCourse(course: Course): Course {
  if (!firstTenIds.has(course.id)) return course;

  let modules = course.modules.filter(module => !isRedundantGenericSlide(course, module));
  modules = replaceGenericPractice(course, modules);

  const overview = modules.find(module => isPresentationOverview(course, module));
  const finalReflection = chooseFinalReflection(course, modules);
  const learning = modules.filter(module =>
    module !== overview &&
    module !== finalReflection &&
    module.type !== "activity" &&
    module.type !== "checklist" &&
    module.type !== "reflection"
  );
  const activities = modules.filter(module => module.type === "activity");
  const checklists = modules.filter(module => module.type === "checklist");

  return {
    ...course,
    modules: [
      ...(overview ? [overview] : []),
      ...learning,
      ...activities,
      ...checklists,
      ...(finalReflection ? [finalReflection] : []),
    ],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateFirstTenCourseQuality(course: Course) {
  if (!firstTenIds.has(course.id)) return;
  const prefix = `First-ten QA failed for ${course.id}:`;
  const types = new Set(course.modules.map(module => module.type));
  const reflections = course.modules.filter(module => module.type === "reflection");

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} presentation overview must be slide 1`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(reflections.length === 1, `${prefix} course should have one definitive final reflection, found ${reflections.length}`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} readiness checklist must come immediately before reflection`);
  assert(types.has("content") && types.has("visual") && types.has("quiz") && types.has("scenario") && types.has("activity") && types.has("checklist") && types.has("reflection"), `${prefix} missing a required presentation interaction type`);
  assert(!course.modules.some(module => isRedundantGenericSlide(course, module)), `${prefix} redundant generic visual/deep-dive slide remains`);

  for (const module of course.modules) {
    if (module.type === "quiz") {
      assert(module.options.length >= 3, `${prefix} quiz ${module.id} needs at least 3 options`);
      assert(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length, `${prefix} quiz ${module.id} has an invalid answer index`);
      assert(module.question.trim().length > 10 && module.feedback.trim().length > 10, `${prefix} quiz ${module.id} is missing question/feedback detail`);
    }
    if (module.type === "scenario") {
      assert(module.options.length >= 3, `${prefix} scenario ${module.id} needs at least 3 choices`);
      assert(module.prompt.trim().length > 20, `${prefix} scenario ${module.id} prompt is too thin`);
      assert(module.options.every(option => option.label.trim().length > 5 && option.feedback.trim().length > 10), `${prefix} scenario ${module.id} has incomplete feedback`);
    }
    if (module.type === "activity") {
      assert(module.instructions.length >= 3, `${prefix} activity ${module.id} needs at least 3 steps`);
      assert((module.minimumCharacters ?? 0) >= 80, `${prefix} activity ${module.id} needs a meaningful response threshold`);
    }
    if (module.type === "checklist") {
      assert(module.items.length >= 4, `${prefix} checklist ${module.id} needs at least 4 checks`);
    }
    if (module.type === "reflection") {
      assert(module.prompt.trim().length > 20, `${prefix} reflection ${module.id} is too thin`);
    }
    if (module.type === "visual") {
      assert(module.items.length >= 2, `${prefix} visual ${module.id} needs at least 2 items`);
    }
  }
}

export function validateFirstTenCatalogueOrder(courses: Course[]) {
  const actual = courses.slice(0, FIRST_TEN_COURSE_IDS.length).map(course => course.id);
  const expected = [...FIRST_TEN_COURSE_IDS];
  assert(actual.join("|") === expected.join("|"), `First-ten catalogue order changed. Expected ${expected.join(", ")} but found ${actual.join(", ")}`);
}
