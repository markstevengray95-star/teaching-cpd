import type { Course, Module } from "./data";

export const COURSES_16_TO_20_IDS = [
  "parent-communication",
  "ect-induction",
  "rosenshine-principles",
  "maslow-needs",
  "effective-questioning",
] as const;

type TargetId = (typeof COURSES_16_TO_20_IDS)[number];
type ActivityModule = Extract<Module, { type: "activity" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
const targetIds = new Set<string>(COURSES_16_TO_20_IDS);

const bespokePractice: Record<TargetId, ActivityModule> = {
  "parent-communication": {
    id: "qa20-parent-communication-plan",
    type: "activity",
    title: "Practice studio: plan a clear parent/carer message",
    prompt: "Choose a realistic, non-confidential school communication and turn it into a concise message that is factual, respectful and easy to act on.",
    instructions: [
      "State the purpose of the communication in one sentence.",
      "List the specific observable evidence or examples that are relevant and appropriate to share.",
      "Write the message using neutral, respectful language rather than assumptions about motive.",
      "Make the requested next step or support action explicit.",
      "State what should be recorded on the school's approved system and what information should not be included in an ordinary message.",
    ],
    placeholder: "Purpose…\nRelevant evidence…\nDraft message…\nNext step…\nRecord/privacy check…",
    minimumCharacters: 220,
  },
  "ect-induction": {
    id: "qa20-ect-habit-cycle",
    type: "activity",
    title: "Practice studio: build one reliable classroom habit",
    prompt: "Choose one high-leverage classroom habit and turn it into a manageable development cycle rather than trying to improve everything at once.",
    instructions: [
      "Name one precise classroom behaviour or routine you want to improve.",
      "Describe what successful performance would look and sound like in practice.",
      "Plan how a mentor, colleague or model could help you rehearse the behaviour before using it live.",
      "Identify one piece of evidence you will review after trying it.",
      "Write the next adaptation you would make if the routine is not yet reliable.",
    ],
    placeholder: "Target habit…\nWhat good looks like…\nRehearsal/support…\nEvidence…\nNext adaptation…",
    minimumCharacters: 220,
  },
  "rosenshine-principles": {
    id: "qa20-rosenshine-lesson-cycle",
    type: "activity",
    title: "Practice studio: design a responsive Rosenshine cycle",
    prompt: "Use one upcoming lesson to connect review, modelling, guided practice, checking, scaffolding and independent practice without turning the principles into a rigid checklist.",
    instructions: [
      "Identify the prerequisite knowledge worth reviewing because today's learning depends on it.",
      "Choose one difficult new step and plan how you will model or exemplify it clearly.",
      "Plan a guided attempt and the question or response method that will make pupil thinking visible.",
      "State what evidence would tell you to re-model, maintain support or begin fading scaffolds.",
      "Plan where independent practice and a later spaced review will occur.",
    ],
    placeholder: "Prerequisite review…\nModelled step…\nGuided practice/check…\nDecision rule for support…\nIndependent practice…\nLater review…",
    minimumCharacters: 250,
  },
  "maslow-needs": {
    id: "qa20-maslow-classroom-lens",
    type: "activity",
    title: "Practice studio: improve a classroom condition without diagnosing",
    prompt: "Choose one classroom condition linked to predictability, belonging, safety, competence or opportunity for growth and plan a practical improvement without using Maslow as a diagnosis of an individual pupil.",
    instructions: [
      "Describe the classroom condition or barrier you can actually observe.",
      "Identify which need area is a useful lens for thinking about the environment, while noting that this does not prove a pupil's cause or need.",
      "Choose one practical classroom change that remains within your role and maintains appropriate expectations.",
      "State when pastoral, SEND or safeguarding systems would take priority over a motivational framework.",
      "Identify evidence you could review to judge whether the classroom change improved access, participation or confidence.",
    ],
    placeholder: "Observable condition…\nUseful lens, not diagnosis…\nClassroom change…\nWhen school systems take priority…\nEvidence to review…",
    minimumCharacters: 240,
  },
  "effective-questioning": {
    id: "qa20-questioning-hinge-design",
    type: "activity",
    title: "Practice studio: design a diagnostic questioning sequence",
    prompt: "Choose one upcoming lesson and design a short questioning sequence that reveals pupil thinking and leads to a clear teaching decision.",
    instructions: [
      "State the precise learning point or misconception you need the question to diagnose.",
      "Write one hinge question with plausible responses that reveal different misunderstandings.",
      "Plan how every pupil will respond rather than relying only on volunteers.",
      "Write one follow-up prompt that probes reasoning rather than just asking for the answer again.",
      "State what response pattern would make you move on, re-model, add a scaffold or change the next task.",
    ],
    placeholder: "Learning point…\nHinge question and responses…\nWhole-class response method…\nFollow-up prompt…\nTeaching decision rule…",
    minimumCharacters: 230,
  },
};

const bespokeKnowledge: Partial<Record<TargetId, QuizModule>> = {
  "parent-communication": {
    id: "qa20-parent-communication-knowledge",
    type: "quiz",
    title: "Check: communicate from evidence",
    question: "Which message is most likely to support a constructive parent/carer conversation about repeated incomplete work?",
    options: [
      "Your child is lazy and never tries hard enough.",
      "Three recent tasks were not completed by the agreed point. I would like us to agree a simple next step for completing and checking the next task.",
      "Other pupils manage this, so your child should too.",
      "There is a problem. Please sort it out.",
    ],
    answer: 1,
    feedback: "Constructive communication is specific, factual and respectful, avoids comparisons or assumptions about motive, and makes the next step clear.",
  },
  "ect-induction": {
    id: "qa20-ect-knowledge",
    type: "quiz",
    title: "Check: make development manageable",
    question: "Which development target is most useful for an ECT working with a mentor?",
    options: [
      "Improve every part of teaching this half term",
      "After giving a lesson-start cue, wait, scan the room and reinforce the agreed entry routine consistently for two weeks, then review what happens",
      "Become more confident",
      "Try as many new strategies as possible in every lesson",
    ],
    answer: 1,
    feedback: "A useful development target is specific, observable, rehearsable and narrow enough to review with evidence rather than becoming a vague judgement about overall teaching.",
  },
};

const bespokeDecision: Partial<Record<TargetId, ScenarioModule>> = {};

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

export function qualityAssureCourses16To20(course: Course): Course {
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

  const finalActivity = activities.find(module => module.id.startsWith("qa20-")) || activities.at(-1);
  const earlierActivities = finalActivity ? activities.filter(module => module !== finalActivity) : activities;
  const finalChecklist = checklists.find(module => module.id === `presentation-${course.id}-check`) || checklists.at(-1);
  const earlierChecklists = finalChecklist ? checklists.filter(module => module !== finalChecklist) : checklists;
  const journey: Module[] = [...learning];

  earlierActivities.forEach((activity, index) => {
    const fraction = earlierActivities.length === 1 ? 0.56 : 0.46 + (index / Math.max(1, earlierActivities.length - 1)) * 0.28;
    const anchor = Math.max(2, Math.min(journey.length - 1, Math.floor(journey.length * fraction)));
    journey.splice(anchor + 1, 0, activity);
  });

  earlierChecklists.forEach((checklist, index) => {
    const fraction = 0.7 + (index / Math.max(1, earlierChecklists.length)) * 0.14;
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
  const prefix = `Courses 16-20 interaction QA failed for ${course.id}/${module.id}:`;
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

export function validateCourses16To20Quality(course: Course) {
  if (!targetIds.has(course.id)) return;
  const prefix = `Courses 16-20 flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);
  const types = new Set(course.modules.map(module => module.type));

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} slide 1 must be the presentation overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must teach core content before testing application`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} penultimate slide must be readiness check`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final practice must sit before readiness and reflection`);
  assert(types.has("content") && types.has("visual") && types.has("quiz") && types.has("scenario") && types.has("activity") && types.has("checklist") && types.has("reflection"), `${prefix} a required presentation interaction type is missing`);
  assert(!course.modules.some(module => isRedundantGenericSlide(course, module) || isGenericEngagementSlide(course, module)), `${prefix} generic filler remains in the deck`);

  const firstInteraction = course.modules.findIndex((module, index) => index > 1 && ["quiz", "scenario"].includes(module.type));
  assert(firstInteraction >= 2 && firstInteraction <= 7, `${prefix} learners go too long before the first decision/knowledge check`);

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

  const activeCount = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  assert(activeCount >= 5, `${prefix} course needs at least five active/reflection moments`);
}

export function validateCourses16To20Order(courses: Course[]) {
  const actual = courses.slice(15, 20).map(course => course.id);
  const expected = [...COURSES_16_TO_20_IDS];
  assert(actual.join("|") === expected.join("|"), `Courses 16-20 order changed. Expected ${expected.join(", ")} but found ${actual.join(", ")}`);
}
