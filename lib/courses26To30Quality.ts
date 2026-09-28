import type { Course, Module } from "./data";

export const COURSES_26_TO_30_IDS = [
  "effective-feedback",
  "metacognition-self-regulation",
  "worked-examples-and-modelling",
  "checking-for-understanding",
  "effective-explanations",
] as const;

type TargetId = (typeof COURSES_26_TO_30_IDS)[number];
type ActivityModule = Extract<Module, { type: "activity" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
const targetIds = new Set<string>(COURSES_26_TO_30_IDS);

const bespokePractice: Partial<Record<TargetId, ActivityModule>> = {
  "effective-feedback": {
    id: "qa30-feedback-cycle",
    type: "activity",
    title: "Practice studio: close the feedback loop",
    prompt: "Choose one recurring piece of feedback in your subject and redesign it so pupils understand the next step, act on it and show whether the feedback improved the work.",
    instructions: [
      "State the learning goal or success criterion the feedback should move forward.",
      "Write one focused feedback message that prioritises the highest-value next step rather than listing every possible improvement.",
      "Plan the pupil action that must follow the feedback during lesson time or a clearly defined follow-up.",
      "Decide what support, model or prompt pupils may need in order to act successfully.",
      "Identify the evidence you will inspect to decide whether the feedback actually improved learning.",
    ],
    placeholder: "Learning goal…\nFocused feedback…\nPupil response task…\nSupport/model…\nEvidence of improvement…",
    minimumCharacters: 230,
  },
  "metacognition-self-regulation": {
    id: "qa30-metacognition-thinkaloud",
    type: "activity",
    title: "Practice studio: model strategic thinking",
    prompt: "Choose a real subject task and plan a short think-aloud that makes planning, monitoring and evaluation decisions visible before pupils practise them themselves.",
    instructions: [
      "State the task and the strategic decision pupils commonly find difficult.",
      "Write what you will say aloud while planning the first move and why that choice is appropriate.",
      "Add a monitoring checkpoint where you deliberately notice whether the strategy is working.",
      "Plan one prompt pupils can use during guided practice without turning the task into a script they follow forever.",
      "State how pupils will evaluate the outcome and what support you would fade as independence improves.",
    ],
    placeholder: "Task…\nStrategic decision…\nThink-aloud…\nMonitoring checkpoint…\nGuided prompt…\nEvaluation/fading plan…",
    minimumCharacters: 230,
  },
};

const bespokeKnowledge: Partial<Record<TargetId, QuizModule>> = {
  "effective-feedback": {
    id: "qa30-feedback-knowledge",
    type: "quiz",
    title: "Check: feedback needs pupil action",
    question: "Which feedback routine is most likely to improve learning?",
    options: [
      "Write detailed comments on every error but give no lesson time to respond",
      "Identify one high-value next step, give pupils time to act on it and check the revised work",
      "Give a grade only because pupils can infer the next step themselves",
      "Delay all feedback until the topic has finished",
    ],
    answer: 1,
    feedback: "Feedback is most useful when it is focused, understandable and followed by a meaningful pupil response that the teacher can inspect.",
  },
  "worked-examples-and-modelling": {
    id: "qa30-modelling-knowledge",
    type: "quiz",
    title: "Check: when should support fade?",
    question: "After modelling a process, when is it most sensible to remove another layer of scaffold?",
    options: [
      "Immediately, because the teacher has already shown the answer",
      "When checks during guided practice show pupils can carry more of the process successfully",
      "At exactly the same time for every class regardless of evidence",
      "Only after every pupil can complete the task perfectly",
    ],
    answer: 1,
    feedback: "Modelling should transfer thinking gradually. Evidence from guided practice should determine whether support is maintained, adapted or faded.",
  },
  "effective-explanations": {
    id: "qa30-explanation-knowledge",
    type: "quiz",
    title: "Check: explain the structure, then test it",
    question: "Which explanation design is strongest for an unfamiliar concept?",
    options: [
      "Include every interesting fact before stating the core idea",
      "State the essential relationship, connect necessary prior knowledge, use a purposeful example or contrast, then check pupils can apply the idea",
      "Use several decorative analogies without clarifying where they stop working",
      "Assume nodding means the explanation was understood",
    ],
    answer: 1,
    feedback: "Clear explanations foreground the essential idea, manage supporting detail deliberately and include a check that reveals whether pupils can use the new understanding.",
  },
};

const bespokeDecision: Partial<Record<TargetId, ScenarioModule>> = {
  "metacognition-self-regulation": {
    id: "qa30-metacognition-decision",
    type: "scenario",
    title: "Decision point: make strategy visible",
    prompt: "Pupils can complete a familiar task with prompts but struggle to choose an approach independently when the problem changes slightly. What is the strongest next teaching move?",
    options: [
      { label: "Give the answer immediately whenever the context changes", feedback: "This removes the strategic decision pupils need to learn to make." },
      { label: "Model how you recognise the task features, choose a strategy and monitor whether it is working, then give pupils a guided opportunity to make those decisions", feedback: "This makes normally hidden strategic thinking explicit while still transferring responsibility to pupils." },
      { label: "Tell pupils to be more independent without showing what independent decision-making involves", feedback: "Independence develops through explicit modelling, guided practice and gradual fading rather than instruction alone." },
    ],
  },
  "checking-for-understanding": {
    id: "qa30-cfu-decision",
    type: "scenario",
    title: "Decision point: evidence changes the next move",
    prompt: "A whole-class check shows that roughly half the pupils selected the same misconception. What is the strongest response?",
    options: [
      { label: "Move on because some pupils answered correctly", feedback: "The response pattern shows substantial uncertainty that should shape the next teaching move." },
      { label: "Surface the misconception, contrast it with the correct idea, re-model or add guided practice, then run a second brief check", feedback: "A useful check leads to an instructional decision and a recheck rather than simply producing a score." },
      { label: "Ask one confident pupil whether everyone now understands", feedback: "One response cannot reliably establish whether the misconception has been resolved across the class." },
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

function preferredFinalActivity(course: Course, activities: ActivityModule[]) {
  const preferredIds: Partial<Record<TargetId, string>> = {
    "effective-feedback": "qa30-feedback-cycle",
    "metacognition-self-regulation": "qa30-metacognition-thinkaloud",
    "worked-examples-and-modelling": "deep3-modelling-script",
    "checking-for-understanding": "deep3-cfu-hinge-lab",
    "effective-explanations": "deep3-explanation-redesign",
  };
  const preferred = preferredIds[course.id as TargetId];
  return activities.find(module => module.id === preferred) || activities.at(-1);
}

function replaceFallbacks(course: Course, modules: Module[]) {
  const id = course.id as TargetId;
  const activity = bespokePractice[id];
  const quiz = bespokeKnowledge[id];
  const scenario = bespokeDecision[id];
  let sawPractice = false;

  const replaced = modules.flatMap(module => {
    if (module.id === `presentation-${course.id}-practice`) {
      if (activity) {
        sawPractice = true;
        return [activity];
      }
      if (["worked-examples-and-modelling", "checking-for-understanding", "effective-explanations"].includes(course.id)) return [];
    }
    if (quiz && module.id === `presentation-${course.id}-knowledge`) return [quiz];
    if (scenario && module.id === `presentation-${course.id}-decision`) return [scenario];
    return [module];
  });

  if (activity && !sawPractice && !replaced.some(module => module.id === activity.id)) replaced.push(activity);
  return replaced;
}

export function qualityAssureCourses26To30(course: Course): Course {
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

  const finalActivity = preferredFinalActivity(course, activities);
  const earlierActivities = finalActivity ? activities.filter(module => module !== finalActivity) : activities;
  const finalChecklist = checklists.find(module => module.id === `presentation-${course.id}-check`) || checklists.at(-1);
  const earlierChecklists = finalChecklist ? checklists.filter(module => module !== finalChecklist) : checklists;
  const journey: Module[] = [...learning];

  earlierActivities.forEach((activity, index) => {
    const fraction = earlierActivities.length === 1 ? 0.58 : 0.46 + (index / Math.max(1, earlierActivities.length - 1)) * 0.28;
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
  const prefix = `Courses 26-30 interaction QA failed for ${course.id}/${module.id}:`;
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

export function validateCourses26To30Quality(course: Course) {
  if (!targetIds.has(course.id)) return;
  const prefix = `Courses 26-30 flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);
  const interactive = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type));

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} slide 1 must be the presentation overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must teach core content before application`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} readiness checklist must immediately precede reflection`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final practice activity must precede readiness and reflection`);
  assert(interactive.length >= 5, `${prefix} needs at least five meaningful interaction/reflection points`);
  assert(course.modules.slice(1, Math.min(7, course.modules.length)).some(module => module.type === "quiz" || module.type === "scenario"), `${prefix} needs an early decision or knowledge check`);

  let passiveRun = 0;
  let longestPassiveRun = 0;
  for (const module of course.modules.slice(1, -3)) {
    if (module.type === "content" || module.type === "visual") passiveRun += 1;
    else passiveRun = 0;
    longestPassiveRun = Math.max(longestPassiveRun, passiveRun);
  }
  assert(longestPassiveRun <= 6, `${prefix} has too many passive explanation slides in a row`);

  course.modules.forEach(module => validateInteraction(course, module));
}

export function validateCourses26To30Order(courses: Course[]) {
  const actual = courses.slice(25, 30).map(course => course.id);
  assert(actual.join("|") === COURSES_26_TO_30_IDS.join("|"), `Courses 26-30 order changed. Expected ${COURSES_26_TO_30_IDS.join(", ")} but found ${actual.join(", ")}`);
}
