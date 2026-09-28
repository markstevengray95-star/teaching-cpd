import type { Course, Module } from "./data";

export const NEXT_FIVE_COURSE_IDS = [
  "effective-feedback",
  "curriculum-sequencing",
  "metacognition-self-regulation",
  "supporting-anxious-pupils",
  "online-safety",
] as const;

type NextFiveId = (typeof NEXT_FIVE_COURSE_IDS)[number];
type ActivityModule = Extract<Module, { type: "activity" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
const nextFiveIds = new Set<string>(NEXT_FIVE_COURSE_IDS);

const bespokePractice: Record<NextFiveId, ActivityModule> = {
  "effective-feedback": {
    id: "qa15-feedback-action-cycle",
    type: "activity",
    title: "Practice studio: design a feedback-response cycle",
    prompt: "Choose one recurring pupil error or misconception and design a feedback routine that ends with pupil action rather than teacher comments alone.",
    instructions: [
      "State the learning goal and the specific error or gap the feedback should address.",
      "Write one concise feedback prompt, cue or model that tells the pupil what to improve without completing the thinking for them.",
      "Design the response task pupils will complete immediately after receiving the feedback.",
      "State how you will check whether the response improved the underlying learning rather than just the piece of work.",
      "Decide what you would reteach, adapt or stop if the same error remains common.",
    ],
    placeholder: "Learning goal…\nError/gap…\nFeedback prompt…\nPupil response task…\nCheck for improvement…\nNext teaching move…",
    minimumCharacters: 220,
  },
  "curriculum-sequencing": {
    id: "qa15-curriculum-sequence-map",
    type: "activity",
    title: "Practice studio: map the route to an endpoint",
    prompt: "Choose one important curriculum endpoint and work backwards to make the prerequisite knowledge, practice and planned revisiting explicit.",
    instructions: [
      "State the final concept, performance or outcome pupils should reach.",
      "Identify the prerequisite knowledge pupils must already have for that endpoint to make sense.",
      "Place the prerequisites in a sensible teaching sequence and explain one dependency between them.",
      "Choose where important knowledge should be revisited before the endpoint rather than relying on emergency reteaching.",
      "Identify one assessment or work sample that would reveal whether the sequence is working as intended.",
    ],
    placeholder: "Endpoint…\nPrerequisites…\nSequence/dependencies…\nPlanned revisiting…\nEvidence the sequence is working…",
    minimumCharacters: 240,
  },
  "metacognition-self-regulation": {
    id: "qa15-metacognition-thinkaloud",
    type: "activity",
    title: "Practice studio: script an expert think-aloud",
    prompt: "Choose one authentic subject task and make the normally hidden planning, monitoring and checking decisions visible to pupils.",
    instructions: [
      "State the task and the strategy an expert would select first.",
      "Write what you would say aloud to explain why that strategy fits the task.",
      "Add one monitoring question you would ask yourself while working.",
      "Show how you would respond if the strategy was not working as expected.",
      "Plan how the prompt or scaffold will fade so pupils increasingly make the decisions themselves.",
    ],
    placeholder: "Task…\nInitial strategy and why…\nMonitoring question…\nAdjustment if stuck…\nHow support will fade…",
    minimumCharacters: 220,
  },
  "supporting-anxious-pupils": {
    id: "qa15-anxiety-predictability-plan",
    type: "activity",
    title: "Practice studio: reduce avoidable uncertainty",
    prompt: "Use a fictional or fully anonymised classroom situation. Plan one proportionate change that makes expectations or transitions more predictable while staying within your professional role.",
    instructions: [
      "Describe the classroom demand or moment that is creating avoidable uncertainty without diagnosing a pupil.",
      "Choose one predictable routine, explanation, rehearsal or reasonable classroom adjustment that could reduce that barrier.",
      "State which learning expectation should remain appropriately ambitious.",
      "Identify when you would use an existing pupil plan or involve the appropriate pastoral, SEND or safeguarding route rather than act alone.",
      "Write the evidence you would review to decide whether the support helped access and participation.",
    ],
    placeholder: "Classroom demand…\nPredictability/support change…\nExpectation that remains…\nWhen to involve school support…\nEvidence to review…",
    minimumCharacters: 220,
  },
  "online-safety": {
    id: "qa15-online-safety-response-map",
    type: "activity",
    title: "Practice studio: map a safe response",
    prompt: "Use a fictional or fully anonymised online-safety concern. Rehearse the staff response without entering pupil-identifiable or confidential information.",
    instructions: [
      "State only the observable concern or information shared with you.",
      "Write the immediate response you would give the pupil, including what you would and would not promise.",
      "Identify what information should be preserved or recorded in line with school procedure rather than investigated independently.",
      "State the school's safeguarding/reporting route you would use and when you would seek DSL or deputy guidance.",
      "Identify one follow-up action within your role and one action that should remain with safeguarding or other authorised staff.",
    ],
    placeholder: "Observable concern…\nImmediate response…\nRecord/preserve…\nReporting route…\nFollow-up within role…",
    minimumCharacters: 220,
  },
};

const bespokeKnowledge: Partial<Record<NextFiveId, QuizModule>> = {
  "curriculum-sequencing": {
    id: "qa15-curriculum-knowledge",
    type: "quiz",
    title: "Check: sequence for future success",
    question: "A later unit repeatedly stalls because pupils cannot use an earlier prerequisite idea. Which curriculum response is strongest?",
    options: [
      "Keep reteaching the prerequisite only when the later unit fails",
      "Identify where the prerequisite should first be secured, plan purposeful revisiting, and check that pupils can use it before the later dependency",
      "Remove the later concept from the curriculum",
      "Add more unrelated content to the earlier unit",
    ],
    answer: 1,
    feedback: "Coherent sequencing anticipates dependencies: important prerequisites are deliberately taught, revisited and checked before later learning relies on them.",
  },
  "supporting-anxious-pupils": {
    id: "qa15-anxiety-knowledge",
    type: "quiz",
    title: "Check: support without overstepping",
    question: "Which response best reflects an appropriate classroom role when a pupil appears very anxious about a routine school task?",
    options: [
      "Diagnose the cause and decide on a long-term treatment plan",
      "Use predictable, proportionate support or an agreed plan, keep suitable expectations, and use pastoral, SEND or safeguarding routes if concern persists or increases",
      "Remove every challenging task permanently",
      "Ignore the concern because responding would always reduce resilience",
    ],
    answer: 1,
    feedback: "Staff can reduce avoidable uncertainty and use agreed support while remaining within role boundaries and involving the school's appropriate support systems when needed.",
  },
};

const bespokeDecision: Partial<Record<NextFiveId, ScenarioModule>> = {
  "effective-feedback": {
    id: "qa15-feedback-decision",
    type: "scenario",
    title: "Decision point: make feedback usable",
    prompt: "A pupil receives the same written comment on several pieces of work but continues to make the same conceptual error. What is the strongest next move?",
    options: [
      { label: "Write a longer version of the same comment and move on", feedback: "More wording does not guarantee that the pupil understands the gap or acts on it." },
      { label: "Clarify the specific gap, give a focused cue or model, require the pupil to improve or reattempt the relevant part, then check whether the understanding changed", feedback: "This turns feedback into a learning cycle: information, pupil action and a check on whether the gap has actually reduced." },
      { label: "Replace all feedback with a grade only", feedback: "A grade alone is unlikely to show the pupil what to do differently next." },
    ],
  },
  "metacognition-self-regulation": {
    id: "qa15-metacognition-decision",
    type: "scenario",
    title: "Decision point: reveal the strategy",
    prompt: "Pupils can complete a familiar worked example but become stuck when a problem changes slightly. What is the strongest teaching response?",
    options: [
      { label: "Tell pupils the answer to the new problem", feedback: "This may finish the task without making the planning and monitoring decisions visible." },
      { label: "Model a brief think-aloud showing how to identify the task, select a strategy, monitor progress and change approach when needed, then let pupils rehearse those decisions", feedback: "Metacognitive teaching makes strategic decisions explicit and then gradually transfers responsibility to pupils." },
      { label: "Remove all prompts immediately so pupils discover a strategy independently", feedback: "Abruptly removing support can leave novices practising unproductive approaches rather than learning how experts regulate their thinking." },
    ],
  },
  "online-safety": {
    id: "qa15-online-safety-decision",
    type: "scenario",
    title: "Decision point: a concerning online message",
    prompt: "A pupil shows you an online message that raises a safeguarding concern and asks you not to tell anyone. What is the strongest staff response?",
    options: [
      { label: "Promise secrecy so the pupil keeps talking", feedback: "Staff should not promise confidentiality they may be unable to keep when safeguarding information needs to be shared." },
      { label: "Listen calmly, avoid investigating, explain that you may need to share the concern, and follow the school's safeguarding/reporting procedure promptly", feedback: "This supports the pupil while keeping the response within the school's safeguarding system and the staff member's professional role." },
      { label: "Contact the other person yourself to establish exactly what happened before reporting it", feedback: "Independent investigation can interfere with the appropriate safeguarding response and is outside the normal classroom staff role." },
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
  const id = course.id as NextFiveId;
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

export function qualityAssureNextFiveCourse(course: Course): Course {
  if (!nextFiveIds.has(course.id)) return course;

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

  const finalActivity = activities.find(module => module.id.startsWith("qa15-")) || activities.at(-1);
  const earlierActivities = finalActivity ? activities.filter(module => module !== finalActivity) : activities;
  const finalChecklist = checklists.find(module => module.id === `presentation-${course.id}-check`) || checklists.at(-1);
  const earlierChecklists = finalChecklist ? checklists.filter(module => module !== finalChecklist) : checklists;
  const journey: Module[] = [...learning];

  earlierActivities.forEach((activity, index) => {
    const fraction = earlierActivities.length === 1 ? 0.56 : 0.48 + (index / Math.max(1, earlierActivities.length - 1)) * 0.26;
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
  const prefix = `Courses 11-15 interaction QA failed for ${course.id}/${module.id}:`;
  assert(module.id.trim().length > 0 && module.title.trim().length > 0, `${prefix} missing id or title`);

  if (module.type === "content") assert(module.body.trim().length >= 30, `${prefix} content is too thin`);
  if (module.type === "visual") {
    assert(module.items.length >= 2, `${prefix} visual needs at least two items`);
    assert(module.items.every(item => item.heading.trim().length > 0 && item.text.trim().length > 0), `${prefix} visual has an incomplete card`);
  }
  if (module.type === "quiz") {
    assert(module.options.length >= 3, `${prefix} quiz needs at least three options`);
    assert(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length, `${prefix} answer index is invalid`);
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
    assert(module.instructions.length >= 3 && module.instructions.every(step => step.trim().length >= 5), `${prefix} activity instructions are incomplete`);
    assert(threshold >= 30 && threshold <= 500, `${prefix} response threshold is impractical`);
  }
  if (module.type === "checklist") {
    assert(module.items.length >= 4, `${prefix} checklist needs at least four items`);
    assert(new Set(module.items.map(item => item.trim().toLowerCase())).size === module.items.length, `${prefix} checklist items are duplicated`);
  }
  if (module.type === "reflection") assert(module.prompt.trim().length >= 20, `${prefix} reflection prompt is too thin`);
}

export function validateNextFiveCourseQuality(course: Course) {
  if (!nextFiveIds.has(course.id)) return;
  const prefix = `Courses 11-15 flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);
  const types = new Set(course.modules.map(module => module.type));

  assert(course.modules.length >= 8, `${prefix} presentation is too thin`);
  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(isPresentationOverview(course, course.modules[0]), `${prefix} slide 1 must be the presentation overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must establish core content`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} readiness checklist must immediately precede reflection`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final practice must precede readiness and reflection`);
  assert(types.has("content") && types.has("visual") && types.has("quiz") && types.has("scenario") && types.has("activity") && types.has("checklist") && types.has("reflection"), `${prefix} missing a required presentation interaction type`);
  assert(!course.modules.some(module => isRedundantGenericSlide(course, module) || isGenericEngagementSlide(course, module)), `${prefix} redundant generic filler remains`);
  assert(!course.modules.some(module => module.id === `presentation-${course.id}-practice`), `${prefix} generic practice fallback remains`);

  const firstInteraction = course.modules.findIndex((module, index) => index > 1 && ["quiz", "scenario"].includes(module.type));
  assert(firstInteraction >= 2 && firstInteraction <= 7, `${prefix} learners go too long before the first active decision/check`);

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

  const activeMoments = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  assert(activeMoments >= 5, `${prefix} needs at least five active/reflection moments`);
}

export function validateNextFiveCatalogueOrder(courses: Course[]) {
  const actual = courses.slice(10, 15).map(course => course.id);
  const expected = [...NEXT_FIVE_COURSE_IDS];
  assert(actual.join("|") === expected.join("|"), `Courses 11-15 order changed. Expected ${expected.join(", ")} but found ${actual.join(", ")}`);
}
