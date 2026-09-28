import type { Course, Module } from "./data";

type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
type ActivityModule = Extract<Module, { type: "activity" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function isOverview(course: Course, module: Module) {
  return module.id === `presentation-${safeId(course.id)}-map` || (module.id.startsWith("presentation-") && module.id.endsWith("-map"));
}

function isGenericVisual(course: Course, module: Module) {
  return module.id === `vx-map-${course.id}` || module.id === `vx-info-${course.id}`;
}

function isGenericEngagement(course: Course, module: Module) {
  return module.id === `engagement-${course.id}-quick-decision` || module.id === `engagement-${course.id}-prediction`;
}

function buildCourseDecision(course: Course): ScenarioModule {
  const focus = course.objectives[0] || course.summary;
  const second = course.objectives[1] || "review the effect of the approach";
  const variants: Record<Course["category"], { prompt: string; options: ScenarioModule["options"] }> = {
    "Teaching & Learning": {
      prompt: `You are applying ${focus.toLowerCase()} but pupil evidence is mixed. Which response best demonstrates the professional thinking developed in ${course.title}?`,
      options: [
        { label: "Continue unchanged because the strategy has already been planned", feedback: "A planned strategy should still respond to evidence about pupil learning." },
        { label: `Use the evidence to make one focused adjustment, then ${second.toLowerCase()} and check the effect`, feedback: "This keeps the learning goal central while using evidence to guide the next teaching move." },
        { label: "Change several unrelated features at once so something is likely to work", feedback: "Changing too many variables makes it difficult to know which adjustment addressed the problem." },
      ],
    },
    Safeguarding: {
      prompt: `A situation raises a concern connected to ${focus.toLowerCase()}, but you do not have the full picture. What is the strongest professional response?`,
      options: [
        { label: "Wait until you can prove exactly what happened", feedback: "Safeguarding concerns should not be delayed while a member of staff tries to reach proof." },
        { label: "Respond within your role, record the relevant facts and follow the school's current safeguarding route promptly", feedback: "This keeps the response timely, factual and within the school's safeguarding system." },
        { label: "Investigate independently before telling the DSL or appropriate safeguarding lead", feedback: "Independent investigation can go beyond the staff member's role and interfere with the appropriate safeguarding response." },
      ],
    },
    SEND: {
      prompt: `A pupil is struggling with a task related to ${focus.toLowerCase()}. Which response best reflects the learning in ${course.title}?`,
      options: [
        { label: "Lower the learning goal immediately", feedback: "This changes the ambition before the specific barrier has been understood." },
        { label: "Identify the precise barrier, use available pupil information and adapt access while keeping the important learning appropriately ambitious", feedback: "This targets the actual barrier rather than making assumptions from a label." },
        { label: "Use the same adjustment for every pupil with a similar need", feedback: "Inclusive practice should respond to the individual pupil and the demands of the task." },
      ],
    },
    Leadership: {
      prompt: `A team is implementing work linked to ${focus.toLowerCase()} inconsistently. What is the strongest next leadership move?`,
      options: [
        { label: "Add another initiative to show the issue is important", feedback: "Additional initiatives can increase ambiguity and implementation load." },
        { label: "Clarify the expected practice, identify barriers, provide focused support and review implementation evidence", feedback: "This combines clarity, diagnosis, support and follow-up rather than jumping straight to judgement." },
        { label: "Assume inconsistency shows unwillingness and move directly to sanction", feedback: "Inconsistency can have several causes; effective leadership diagnoses before deciding the response." },
      ],
    },
    Wellbeing: {
      prompt: `A recurring pattern connected to ${focus.toLowerCase()} is creating pressure. Which response best uses the course learning?`,
      options: [
        { label: "Tell individuals to be more resilient while leaving the system unchanged", feedback: "Individual coping strategies do not address avoidable system causes on their own." },
        { label: "Identify a controllable cause, test a proportionate change and review whether it improves the situation without weakening important responsibilities", feedback: "This keeps the response practical, evidence-informed and sustainable." },
        { label: "Remove the responsibility completely without considering consequences", feedback: "A proportionate response should protect important work while reducing avoidable pressure where possible." },
      ],
    },
    "Digital Teaching": {
      prompt: `You are considering a digital approach connected to ${focus.toLowerCase()}. What is the strongest starting point?`,
      options: [
        { label: "Use the tool first and check policy only if a problem appears", feedback: "Governance, privacy and safeguarding checks should happen before sensitive or consequential use." },
        { label: "Clarify the educational purpose, check privacy/safeguarding/accuracy and school expectations, then review the output before use", feedback: "This keeps professional judgement and appropriate safeguards at the centre of digital practice." },
        { label: "Assume a polished output is accurate and suitable", feedback: "Fluent digital output can still be inaccurate, biased, inappropriate or inconsistent with school expectations." },
      ],
    },
  };
  const variant = variants[course.category];
  return {
    id: `remaining-${safeId(course.id)}-decision`,
    type: "scenario",
    title: "Decision point: apply the course thinking",
    prompt: variant.prompt,
    options: variant.options,
  };
}

function buildCourseKnowledge(course: Course): QuizModule {
  const objective = course.objectives[0] || course.summary;
  const second = course.objectives[1] || "apply the approach appropriately";
  return {
    id: `remaining-${safeId(course.id)}-knowledge`,
    type: "quiz",
    title: "Knowledge checkpoint: secure understanding",
    question: `Which statement best demonstrates secure understanding of ${course.title}?`,
    options: [
      `Use ${objective.toLowerCase()} as a fixed rule regardless of context`,
      `Understand how to ${objective.toLowerCase()}, connect it with ${second.toLowerCase()}, and use evidence or relevant school procedures to guide application`,
      "Treat completion of the course as evidence that the approach will work without checking impact",
      "Rely on personal preference when the course evidence or school procedure points elsewhere",
    ],
    answer: 1,
    feedback: "Secure professional learning combines understanding of the principle with appropriate contextual judgement and evidence about impact.",
  };
}

function buildCoursePractice(course: Course): ActivityModule {
  const objectives = course.objectives.slice(0, 4);
  const focus = objectives[0] || course.summary;
  const context: Record<Course["category"], string> = {
    "Teaching & Learning": "Choose an upcoming lesson, explanation, routine or assessment point.",
    Safeguarding: "Use a fictional or fully anonymised professional situation and do not enter pupil-identifiable safeguarding information.",
    SEND: "Choose an upcoming classroom task and focus on a specific access barrier rather than a diagnostic label.",
    Leadership: "Choose a real team routine or improvement priority without entering sensitive staff information.",
    Wellbeing: "Choose a recurring work routine, team process or pupil-support situation where a proportionate change can be tested.",
    "Digital Teaching": "Choose a realistic professional task and include privacy, safeguarding, accuracy and school-governance checks.",
  };
  return {
    id: `remaining-${safeId(course.id)}-practice`,
    type: "activity",
    title: "Application studio: design a usable next step",
    prompt: `${context[course.category]} Apply the central course focus: ${focus}`,
    instructions: [
      `Select the most relevant objective: ${objectives.join(" | ") || course.summary}`,
      "Describe the specific context and the evidence or information you currently have.",
      "Write the action, routine or professional decision you would make.",
      "Identify one likely misconception, barrier, implementation risk or boundary you need to manage.",
      "State what evidence would tell you the approach is helping rather than merely being completed.",
      "Decide what would make you keep, adapt, stop or escalate the approach after review.",
    ],
    placeholder: "Context…\nRelevant evidence/information…\nAction or decision…\nBarrier/risk/boundary…\nEvidence of impact…\nKeep/adapt/stop/escalate when…",
    minimumCharacters: 220,
  };
}

function chooseFinalReflection(modules: Module[]) {
  return modules.filter((module): module is Extract<Module, { type: "reflection" }> => module.type === "reflection").at(-1);
}

function replaceFallbacks(course: Course, modules: Module[]) {
  const decision = buildCourseDecision(course);
  const knowledge = buildCourseKnowledge(course);
  const practice = buildCoursePractice(course);
  return modules.map(module => {
    if (module.id === `presentation-${safeId(course.id)}-decision`) return decision;
    if (module.id === `presentation-${safeId(course.id)}-knowledge`) return knowledge;
    if (module.id === `presentation-${safeId(course.id)}-practice`) return practice;
    return module;
  });
}

export function qualityAssureRemainingCourse(course: Course, index: number): Course {
  if (index < 30) return course;

  let modules = course.modules.filter(module => !isGenericVisual(course, module) && !isGenericEngagement(course, module));
  modules = replaceFallbacks(course, modules);

  const overview = modules.find(module => isOverview(course, module));
  const finalReflection = chooseFinalReflection(modules);
  const finalChecklist = [...modules].reverse().find(module => module.type === "checklist");
  const activities = modules.filter((module): module is ActivityModule => module.type === "activity");
  const fallbackPractice = activities.find(module => module.id === `remaining-${safeId(course.id)}-practice`);
  const finalActivity = fallbackPractice || activities.at(-1);

  let middle = modules.filter(module => module !== overview && module !== finalReflection && module !== finalChecklist && module !== finalActivity);

  const firstContentIndex = middle.findIndex(module => module.type === "content");
  if (firstContentIndex > 0) {
    const [firstContent] = middle.splice(firstContentIndex, 1);
    middle.unshift(firstContent);
  }

  return {
    ...course,
    modules: [
      ...(overview ? [overview] : []),
      ...middle,
      ...(finalActivity ? [finalActivity] : []),
      ...(finalChecklist ? [finalChecklist] : []),
      ...(finalReflection ? [finalReflection] : []),
    ],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateModule(course: Course, module: Module) {
  const prefix = `Remaining-course interaction QA failed for ${course.id}/${module.id}:`;
  assert(module.id.trim().length > 0 && module.title.trim().length > 0, `${prefix} missing id or title`);

  if (module.type === "content") assert(module.body.trim().length >= 30, `${prefix} content is too thin`);
  if (module.type === "visual") {
    assert(module.items.length >= 2, `${prefix} visual needs at least two items`);
    assert(module.items.every(item => item.heading.trim().length > 0 && item.text.trim().length > 0), `${prefix} visual card is incomplete`);
  }
  if (module.type === "quiz") {
    assert(module.options.length >= 3, `${prefix} quiz needs at least three options`);
    assert(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length, `${prefix} quiz answer index is invalid`);
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
    assert(module.items.every(item => item.trim().length >= 5), `${prefix} checklist item is incomplete`);
    assert(new Set(module.items.map(item => item.trim().toLowerCase())).size === module.items.length, `${prefix} checklist items are duplicated`);
  }
  if (module.type === "reflection") assert(module.prompt.trim().length >= 20, `${prefix} reflection prompt is too thin`);
}

export function validateRemainingCourseQuality(course: Course, index: number) {
  if (index < 30) return;
  const prefix = `Remaining-course flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);
  const types = new Set(course.modules.map(module => module.type));

  assert(course.modules.length >= 7, `${prefix} presentation is too thin`);
  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(isOverview(course, course.modules[0]), `${prefix} slide 1 must be the learning-journey overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must establish core learning before application`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} readiness checklist must sit immediately before final reflection`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final application activity must sit before readiness and reflection`);

  ["content", "visual", "quiz", "scenario", "activity", "checklist", "reflection"].forEach(type => {
    assert(types.has(type as Module["type"]), `${prefix} missing ${type} slide`);
  });

  const firstInteraction = course.modules.findIndex(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type));
  assert(firstInteraction >= 0 && firstInteraction <= 6, `${prefix} learner waits too long for an interaction`);

  let passiveRun = 0;
  let longestPassiveRun = 0;
  for (const module of course.modules.slice(1, -3)) {
    if (module.type === "content" || module.type === "visual") {
      passiveRun += 1;
      longestPassiveRun = Math.max(longestPassiveRun, passiveRun);
    } else {
      passiveRun = 0;
    }
  }
  assert(longestPassiveRun <= 7, `${prefix} more than seven passive teaching slides appear without an interaction`);

  const meaningfulInteractions = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  assert(meaningfulInteractions >= 5, `${prefix} needs at least five meaningful interaction/reflection slides`);
  course.modules.forEach(module => validateModule(course, module));
}

export function validateRemainingCatalogue(courses: Course[]) {
  assert(courses.length > 30, "Remaining-course QA expected courses after position 30");
  courses.slice(30).forEach((course, offset) => validateRemainingCourseQuality(course, offset + 30));
}
