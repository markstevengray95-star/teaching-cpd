import type { Course, Module } from "./data";

export const FIRST_TEN_COURSE_IDS = [
  "rosenshine-principles",
  "maslow-needs",
  "effective-questioning",
  "retrieval-practice",
  "adaptive-teaching",
  "behaviour-management",
  "send-inclusive-practice",
  "eal-inclusive-teaching",
  "effective-feedback",
  "metacognition-self-regulation",
] as const;

const firstTenIds = new Set<string>(FIRST_TEN_COURSE_IDS);

type ActivityModule = Extract<Module, { type: "activity" }>;

const bespokePractice: Partial<Record<(typeof FIRST_TEN_COURSE_IDS)[number], ActivityModule>> = {
  "behaviour-management": {
    id: "qa10-behaviour-routine-rehearsal",
    type: "activity",
    title: "Practice studio: teach one routine properly",
    prompt: "Choose one classroom routine that regularly loses learning time and turn it into something you can explicitly teach, rehearse and review.",
    instructions: [
      "Name the routine and the exact problem it is meant to prevent.",
      "Write the cue that starts the routine and no more than five observable pupil actions.",
      "Write the brief teacher language you will use to model and rehearse it.",
      "Identify the point most likely to break down and the calm correction you will use.",
      "State what evidence, over several lessons, would show the routine is becoming secure rather than merely followed after repeated reminders.",
    ],
    placeholder: "Routine…\nCue…\nPupil actions…\nTeacher script…\nLikely breakdown…\nCorrection…\nEvidence it is becoming secure…",
    minimumCharacters: 220,
  },
  "send-inclusive-practice": {
    id: "qa10-send-barrier-plan",
    type: "activity",
    title: "Practice studio: barrier to independence plan",
    prompt: "Use an upcoming lesson and a known, non-sensitive learner need to practise identifying a barrier without automatically lowering the learning goal.",
    instructions: [
      "State the important learning goal that should remain ambitious.",
      "Identify the precise barrier created by the task, explanation, language, routine or environment.",
      "Choose the smallest useful adjustment or scaffold that addresses that barrier.",
      "State what thinking the pupil must still do independently.",
      "Write the evidence you will use to decide whether to keep, adapt or fade the support.",
    ],
    placeholder: "Learning goal…\nBarrier…\nAdjustment…\nThinking the pupil still does…\nEvidence…\nKeep/adapt/fade when…",
    minimumCharacters: 220,
  },
  "eal-inclusive-teaching": {
    id: "qa10-eal-language-map",
    type: "activity",
    title: "Practice studio: map the language demand",
    prompt: "Choose one upcoming subject task and separate the disciplinary thinking from the English pupils need in order to access and communicate that thinking.",
    instructions: [
      "State the subject concept or thinking pupils are meant to learn.",
      "Identify up to five high-value words, phrases or sentence structures pupils will need.",
      "Choose one model, visual, example or rehearsal routine that will make the language usable.",
      "Plan one structured opportunity for pupils to say or write the language themselves.",
      "State how you will distinguish a language difficulty from a conceptual misunderstanding when you check learning.",
    ],
    placeholder: "Subject learning…\nLanguage demand…\nModel/support…\nPupil rehearsal…\nHow I will check language vs concept…",
    minimumCharacters: 220,
  },
  "effective-feedback": {
    id: "qa10-feedback-action-cycle",
    type: "activity",
    title: "Practice studio: redesign feedback for action",
    prompt: "Take one real feedback routine and redesign it so the learner has a clear next step and protected time to improve the work.",
    instructions: [
      "State the learning goal and the most important gap you commonly see.",
      "Write one focused feedback message or whole-class feedback point.",
      "Plan the exact correction, redraft or reattempt pupils will complete.",
      "Remove one low-value marking action that does not change pupil thinking or performance.",
      "Write the short follow-up check that will tell you whether the feedback actually improved the work.",
    ],
    placeholder: "Learning goal…\nImportant gap…\nFocused feedback…\nPupil action…\nLow-value marking to remove…\nFollow-up check…",
    minimumCharacters: 220,
  },
  "metacognition-self-regulation": {
    id: "qa10-metacognition-think-aloud",
    type: "activity",
    title: "Practice studio: model, prompt, fade",
    prompt: "Choose one recurring subject task and design a short think-aloud that makes expert planning, monitoring and evaluation visible.",
    instructions: [
      "State the task and the strategic decision pupils often miss.",
      "Write a concise teacher think-aloud that explains how you choose the strategy.",
      "Add one monitoring question pupils can ask themselves while working.",
      "Add one evaluation question that leads to a specific change next time.",
      "State the evidence that would show the prompts can be reduced because pupils are regulating the process independently.",
    ],
    placeholder: "Task…\nStrategic decision…\nThink-aloud…\nMonitoring prompt…\nEvaluation prompt…\nFade prompts when…",
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

export function qualityAssureFirstTenCourse(course: Course): Course {
  if (!firstTenIds.has(course.id)) return course;

  let modules = course.modules.filter(module => !isRedundantGenericSlide(course, module));
  modules = replaceGenericPractice(course, modules);

  const overview = modules.find(module => isPresentationOverview(course, module));
  const learning = modules.filter(module =>
    module !== overview &&
    module.type !== "activity" &&
    module.type !== "checklist" &&
    module.type !== "reflection"
  );
  const activities = modules.filter(module => module.type === "activity");
  const checklists = modules.filter(module => module.type === "checklist");
  const reflections = modules.filter(module => module.type === "reflection");

  return {
    ...course,
    modules: [
      ...(overview ? [overview] : []),
      ...learning,
      ...activities,
      ...checklists,
      ...reflections,
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

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} presentation overview must be slide 1`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
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
