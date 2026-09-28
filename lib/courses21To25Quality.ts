import type { Course, Module } from "./data";

export const COURSES_21_TO_25_IDS = [
  "retrieval-practice",
  "adaptive-teaching",
  "behaviour-management",
  "send-inclusive-practice",
  "eal-inclusive-teaching",
] as const;

type TargetId = (typeof COURSES_21_TO_25_IDS)[number];
type ActivityModule = Extract<Module, { type: "activity" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
const targetIds = new Set<string>(COURSES_21_TO_25_IDS);

const bespokePractice: Record<TargetId, ActivityModule> = {
  "retrieval-practice": {
    id: "qa25-retrieval-sequence",
    type: "activity",
    title: "Practice studio: build a cumulative retrieval sequence",
    prompt: "Choose one class and design a short retrieval routine that deliberately revisits important knowledge across several time gaps rather than only yesterday's lesson.",
    instructions: [
      "Select four to six pieces of high-value knowledge that later learning depends on.",
      "Place some prompts for tomorrow, next week and later in the month so retrieval is genuinely spaced.",
      "Include at least one prompt that requires application or discrimination rather than simple recall.",
      "Plan how pupils will check and correct answers promptly after retrieval.",
      "State how you will use common errors to decide what needs reteaching, cueing or future retrieval.",
    ],
    placeholder: "High-value knowledge…\nTomorrow…\nNext week…\nLater this month…\nFeedback/correction…\nHow errors will shape teaching…",
    minimumCharacters: 230,
  },
  "adaptive-teaching": {
    id: "qa25-adaptive-plan",
    type: "activity",
    title: "Practice studio: adapt the route, preserve the goal",
    prompt: "Choose one upcoming task and identify a specific access barrier, a proportionate scaffold and the evidence you will use to decide when that support can fade.",
    instructions: [
      "State the shared learning goal that should remain ambitious.",
      "Identify the specific barrier shown by the task, pupil information or checking evidence.",
      "Choose one adaptation that addresses that barrier without completing the thinking for the pupil.",
      "Describe how you will check whether the adaptation is helping access to the intended learning.",
      "Set a clear condition for maintaining, changing or fading the scaffold.",
    ],
    placeholder: "Learning goal…\nSpecific barrier…\nAdaptation…\nCheck for impact…\nWhen support will change/fade…",
    minimumCharacters: 230,
  },
  "behaviour-management": {
    id: "qa25-behaviour-routine",
    type: "activity",
    title: "Practice studio: teach a routine before correcting it",
    prompt: "Choose one recurring classroom behaviour routine and make the expected behaviour, cue, rehearsal, acknowledgement and correction sequence explicit.",
    instructions: [
      "Define the expected behaviour in observable terms rather than a vague label such as 'behave'.",
      "Write the cue or instruction staff will use consistently.",
      "Plan how pupils will rehearse the routine successfully before it is relied upon under pressure.",
      "Write a brief, calm correction that redirects to the expectation without starting a public argument.",
      "State what evidence would tell you the routine needs reteaching or a wider school response.",
    ],
    placeholder: "Routine…\nObservable expectation…\nCue…\nRehearsal…\nCalm correction…\nEvidence/reteach point…",
    minimumCharacters: 220,
  },
  "send-inclusive-practice": {
    id: "qa25-send-barrier-plan",
    type: "activity",
    title: "Practice studio: remove a barrier without lowering ambition",
    prompt: "Choose one realistic classroom task and use pupil-specific information to plan an adjustment that improves access while preserving the important learning goal.",
    instructions: [
      "State the intended learning goal before considering any adjustment.",
      "Identify the precise barrier created by the task, environment, language, organisation or mode of response.",
      "Use relevant pupil-plan information where available rather than assumptions based on a label.",
      "Choose one proportionate adjustment and explain how it preserves the core learning demand.",
      "State how you will review whether the adjustment improves participation, independence or successful learning.",
    ],
    placeholder: "Learning goal…\nSpecific barrier…\nRelevant pupil information…\nAdjustment…\nHow ambition is preserved…\nEvidence to review…",
    minimumCharacters: 230,
  },
  "eal-inclusive-teaching": {
    id: "qa25-eal-language-map",
    type: "activity",
    title: "Practice studio: map the language of the lesson",
    prompt: "Choose one upcoming lesson and separate the conceptual goal from the English pupils need in order to access, discuss and explain that learning successfully.",
    instructions: [
      "State the subject concept pupils should understand, independent of language fluency.",
      "Select three to five essential words or phrases pupils need to understand and use.",
      "Identify one sentence structure, explanation pattern or disciplinary phrase worth modelling explicitly.",
      "Plan a structured talk or rehearsal opportunity before an extended written response where appropriate.",
      "State how you will check conceptual understanding without confusing language errors with lack of subject knowledge.",
    ],
    placeholder: "Conceptual goal…\nKey language…\nModel sentence/phrase…\nStructured talk/rehearsal…\nHow conceptual understanding will be checked…",
    minimumCharacters: 230,
  },
};

const bespokeKnowledge: Partial<Record<TargetId, QuizModule>> = {
  "behaviour-management": {
    id: "qa25-behaviour-knowledge",
    type: "quiz",
    title: "Check: prevention before correction",
    question: "Which approach is most likely to make a classroom routine reliable over time?",
    options: [
      "Keep the expectation vague so pupils can interpret it themselves",
      "Teach the routine explicitly, rehearse it, use a consistent cue and calmly reteach or correct when it breaks down",
      "Change the consequence and wording every lesson",
      "Wait for disruption before explaining what the expected behaviour was",
    ],
    answer: 1,
    feedback: "Reliable routines depend on clear observable expectations, explicit teaching, rehearsal and predictable follow-through rather than repeated improvisation.",
  },
};

const bespokeDecision: Partial<Record<TargetId, ScenarioModule>> = {
  "send-inclusive-practice": {
    id: "qa25-send-decision",
    type: "scenario",
    title: "Decision point: support the barrier, not the label",
    prompt: "A pupil with SEND understands the lesson discussion but becomes stuck when a task requires several written instructions to be held in mind at once. What is the strongest first response?",
    options: [
      { label: "Replace the learning objective with an easier one immediately", feedback: "This lowers the learning goal before addressing the specific access barrier." },
      { label: "Use the pupil's current plan and task evidence to reduce the memory/organisation barrier, for example with visible steps or chunking, while keeping the same core learning", feedback: "This responds to the actual barrier and available pupil information while preserving ambition." },
      { label: "Assume every pupil with the same diagnosis needs exactly the same support", feedback: "SEND provision should be responsive to the individual pupil and the demands of the task rather than a fixed label-based recipe." },
    ],
  },
  "eal-inclusive-teaching": {
    id: "qa25-eal-decision",
    type: "scenario",
    title: "Decision point: language demand or conceptual demand?",
    prompt: "A pupil gives a strong oral demonstration of a science concept using simple English but writes a very limited explanation. What is the strongest next teaching move?",
    options: [
      { label: "Conclude that the pupil does not understand the science", feedback: "Limited written English does not by itself show limited conceptual understanding." },
      { label: "Keep the scientific goal, explicitly model the key vocabulary and explanation structure, provide structured rehearsal, then ask the pupil to express the same concept again", feedback: "This supports the language needed to communicate secure subject thinking without lowering the conceptual demand." },
      { label: "Remove all technical language from future science work", feedback: "Pupils need supported access to disciplinary language rather than permanent exclusion from it." },
    ],
  },
};

function isPresentationOverview(course: Course, module: Module) {
  return module.id === `presentation-${course.id}-map` || (module.id.startsWith("presentation-") && module.id.endsWith("-map"));
}

function isRedundantGenericSlide(course: Course, module: Module) {
  return module.id === `vx-map-${course.id}` || module.id === `vx-info-${course.id}`;
}

function isGenericEngagementSlide(course: Course, module: Module) {
  return module.id === `engagement-${course.id}-quick-decision` || module.id === `engagement-${course.id}-prediction`;
}

function chooseFinalReflection(course: Course, modules: Module[]) {
  const reflections = modules.filter((module): module is Extract<Module, { type: "reflection" }> => module.type === "reflection");
  return reflections.find(module => module.id === `mc-reflect-${course.id}`) || reflections.at(-1);
}

function replaceFallbacks(course: Course, modules: Module[]) {
  const id = course.id as TargetId;
  const activity = bespokePractice[id];
  const quiz = bespokeKnowledge[id];
  const scenario = bespokeDecision[id];
  let sawPractice = false;

  const replaced = modules.map(module => {
    if (module.id === `presentation-${course.id}-practice`) {
      sawPractice = true;
      return activity;
    }
    if (quiz && module.id === `presentation-${course.id}-knowledge`) return quiz;
    if (scenario && module.id === `presentation-${course.id}-decision`) return scenario;
    return module;
  });

  if (!sawPractice && !replaced.some(module => module.id === activity.id)) replaced.push(activity);
  return replaced;
}

export function qualityAssureCourses21To25(course: Course): Course {
  if (!targetIds.has(course.id)) return course;

  let modules = course.modules.filter(module => !isRedundantGenericSlide(course, module) && !isGenericEngagementSlide(course, module));
  modules = replaceFallbacks(course, modules);

  const overview = modules.find(module => isPresentationOverview(course, module));
  const finalReflection = chooseFinalReflection(course, modules);
  const middle = modules.filter(module => module !== overview && module !== finalReflection && module.type !== "reflection");
  const learning = middle.filter(module => ["content", "visual", "quiz", "scenario"].includes(module.type));
  const activities = middle.filter((module): module is ActivityModule => module.type === "activity");
  const checklists = middle.filter(module => module.type === "checklist");

  const firstContentIndex = learning.findIndex(module => module.type === "content");
  if (firstContentIndex > 0) {
    const [content] = learning.splice(firstContentIndex, 1);
    learning.unshift(content);
  }

  const finalActivity = activities.find(module => module.id.startsWith("qa25-")) || activities.at(-1);
  const earlierActivities = finalActivity ? activities.filter(module => module !== finalActivity) : activities;
  const finalChecklist = checklists.find(module => module.id === `presentation-${course.id}-check`) || checklists.at(-1);
  const earlierChecklists = finalChecklist ? checklists.filter(module => module !== finalChecklist) : checklists;
  const journey: Module[] = [...learning];

  earlierActivities.forEach((activity, index) => {
    const fraction = earlierActivities.length === 1 ? 0.56 : 0.48 + (index / Math.max(1, earlierActivities.length - 1)) * 0.24;
    const anchor = Math.max(2, Math.min(journey.length - 1, Math.floor(journey.length * fraction)));
    journey.splice(anchor + 1, 0, activity);
  });

  earlierChecklists.forEach((checklist, index) => {
    const fraction = 0.72 + (index / Math.max(1, earlierChecklists.length)) * 0.12;
    const anchor = Math.max(2, Math.min(journey.length - 1, Math.floor(journey.length * fraction)));
    journey.splice(anchor + 1, 0, checklist);
  });

  return {
    ...course,
    modules: [
      ...(overview ? [overview] : []),
      ...journey,
      ...(finalActivity ? [finalActivity] : []),
      ...(finalChecklist ? [finalChecklist] : []),
      ...(finalReflection ? [finalReflection] : []),
    ],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateInteraction(course: Course, module: Module) {
  const prefix = `Courses 21-25 interaction QA failed for ${course.id}/${module.id}:`;
  assert(module.id.trim().length > 0 && module.title.trim().length > 0, `${prefix} missing id or title`);

  if (module.type === "content") assert(module.body.trim().length >= 30, `${prefix} content is too thin`);
  if (module.type === "visual") {
    assert(module.items.length >= 2, `${prefix} visual needs at least two items`);
    assert(module.items.every(item => item.heading.trim().length > 0 && item.text.trim().length > 0), `${prefix} visual has an incomplete card`);
  }
  if (module.type === "quiz") {
    assert(module.options.length >= 3, `${prefix} quiz needs at least three options`);
    assert(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length, `${prefix} answer index is invalid`);
    assert(module.options.every(option => option.trim().length > 0), `${prefix} quiz has an empty option`);
    assert(new Set(module.options.map(option => option.trim().toLowerCase())).size === module.options.length, `${prefix} quiz options are duplicated`);
    assert(module.feedback.trim().length >= 10, `${prefix} quiz feedback is too thin`);
  }
  if (module.type === "scenario") {
    assert(module.prompt.trim().length >= 20, `${prefix} scenario prompt is too thin`);
    assert(module.options.length >= 3, `${prefix} scenario needs at least three choices`);
    assert(module.options.every(option => option.label.trim().length >= 3 && option.feedback.trim().length >= 10), `${prefix} scenario choice or feedback is incomplete`);
    assert(new Set(module.options.map(option => option.label.trim().toLowerCase())).size === module.options.length, `${prefix} scenario choices are duplicated`);
  }
  if (module.type === "activity") {
    const threshold = module.minimumCharacters ?? 30;
    assert(module.prompt.trim().length >= 20, `${prefix} activity prompt is too thin`);
    assert(module.instructions.length >= 3 && module.instructions.every(step => step.trim().length >= 5), `${prefix} activity steps are incomplete`);
    assert(threshold >= 30 && threshold <= 500, `${prefix} activity response threshold is impractical`);
  }
  if (module.type === "checklist") {
    assert(module.items.length >= 4, `${prefix} checklist needs at least four items`);
    assert(module.items.every(item => item.trim().length >= 5), `${prefix} checklist has an incomplete item`);
    assert(new Set(module.items.map(item => item.trim().toLowerCase())).size === module.items.length, `${prefix} checklist contains duplicate items`);
  }
  if (module.type === "reflection") assert(module.prompt.trim().length >= 20, `${prefix} reflection is too thin`);
}

export function validateCourses21To25Quality(course: Course) {
  if (!targetIds.has(course.id)) return;
  const prefix = `Courses 21-25 flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);
  const types = new Set(course.modules.map(module => module.type));

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} slide 1 must be the presentation overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must teach core content before testing application`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} penultimate slide must be the final readiness check`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final practice must come before readiness and reflection`);
  assert(types.has("quiz") && types.has("scenario") && types.has("activity") && types.has("checklist"), `${prefix} course needs quiz, scenario, activity and checklist interactions`);

  const firstDecision = course.modules.findIndex((module, index) => index > 1 && ["quiz", "scenario"].includes(module.type));
  assert(firstDecision >= 2 && firstDecision <= 7, `${prefix} learners go too long before the first active check`);

  let passiveRun = 0;
  let activityRun = 0;
  let checklistRun = 0;
  for (const module of course.modules) {
    validateInteraction(course, module);
    passiveRun = ["content", "visual"].includes(module.type) ? passiveRun + 1 : 0;
    activityRun = module.type === "activity" ? activityRun + 1 : 0;
    checklistRun = module.type === "checklist" ? checklistRun + 1 : 0;
    assert(passiveRun <= 6, `${prefix} more than six passive slides appear consecutively near ${module.id}`);
    assert(activityRun <= 1, `${prefix} activities are bunched together near ${module.id}`);
    assert(checklistRun <= 1, `${prefix} checklists are bunched together near ${module.id}`);
  }

  const interactiveCount = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  assert(interactiveCount >= 5, `${prefix} presentation needs at least five active/reflection moments`);
}

export function validateCourses21To25Order(courses: Course[]) {
  const actual = courses.slice(20, 25).map(course => course.id);
  assert(actual.join("|") === COURSES_21_TO_25_IDS.join("|"), `Courses 21-25 order changed. Expected ${COURSES_21_TO_25_IDS.join(", ")} but found ${actual.join(", ")}`);
}
