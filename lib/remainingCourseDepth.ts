import type { Course, Module } from "./data";

type VisualModule = Extract<Module, { type: "visual" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function objective(course: Course, index: number, fallback: string) {
  return course.objectives[index]?.trim() || fallback;
}

function buildApplicationVisual(course: Course): VisualModule {
  const focus = objective(course, 0, course.summary);
  const transfer = objective(course, 1, "translate the principle into a realistic professional action");
  const boundary = objective(course, 2, "recognise the main barrier, misconception or professional boundary");
  const evidence = objective(course, 3, "review evidence before deciding what to do next");

  return {
    id: `remaining-depth-${safeId(course.id)}-application-map`,
    type: "visual",
    title: `${course.title}: from principle to practice`,
    layout: "flow",
    caption: "Use this applied map to connect the course idea to a real professional decision rather than treating the learning as an isolated technique.",
    items: [
      { heading: "1 · Name the principle", text: focus, icon: "1" },
      { heading: "2 · Translate it", text: transfer, icon: "2" },
      { heading: "3 · Anticipate the difficulty", text: boundary, icon: "3" },
      { heading: "4 · Look for evidence", text: evidence, icon: "4" },
      { heading: "5 · Review and adapt", text: "Decide what you would keep, change, stop or escalate after seeing the effect in context.", icon: "5" },
    ],
  };
}

function buildTransferScenario(course: Course): ScenarioModule {
  const focus = objective(course, 0, course.summary).toLowerCase();
  const second = objective(course, 1, "apply the approach appropriately").toLowerCase();

  const variants: Record<Course["category"], ScenarioModule> = {
    "Teaching & Learning": {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: evidence changes the plan",
      prompt: `You have planned to ${focus}, but a quick check shows that only part of the class is ready for the next step. What best applies the learning from ${course.title}?`,
      options: [
        { label: "Continue exactly as planned so the lesson stays on schedule", feedback: "Sticking rigidly to the plan ignores useful evidence about current understanding." },
        { label: `Use the evidence to make a focused adjustment that still supports pupils to ${second}, then check again`, feedback: "This preserves the intended learning while making the next teaching move responsive to evidence." },
        { label: "Replace the original learning goal with an easier unrelated task", feedback: "Changing the goal can remove the intended learning rather than addressing the specific difficulty." },
      ],
    },
    Safeguarding: {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: concern without certainty",
      prompt: `A fictional school situation raises a concern connected to ${focus}, but the member of staff is unsure whether it is significant. Which response best applies the course learning?`,
      options: [
        { label: "Wait for complete certainty before passing anything on", feedback: "Staff should not require proof before using the school's safeguarding route for a concern." },
        { label: "Record the relevant facts, stay within role and use the school's current safeguarding procedure promptly", feedback: "This keeps the response factual, timely and within the school's safeguarding system." },
        { label: "Question several other pupils first to decide whether the concern is real", feedback: "Independent investigation may go beyond the staff member's role and interfere with the appropriate safeguarding response." },
      ],
    },
    SEND: {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: barrier before label",
      prompt: `A pupil is struggling with a task linked to ${focus}. Which response best transfers the course learning into classroom practice?`,
      options: [
        { label: "Use the pupil's label to choose the same support used for everyone with that label", feedback: "Needs vary; effective support should respond to the pupil and the specific task barrier." },
        { label: `Identify the barrier, use available pupil information and adjust access so the pupil can still ${second}`, feedback: "This keeps the important learning ambitious while responding to the actual barrier." },
        { label: "Lower the learning goal before checking what is causing the difficulty", feedback: "The access barrier should be understood before the learning ambition is reduced." },
      ],
    },
    Leadership: {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: implementation drifts",
      prompt: `A team agreed work linked to ${focus}, but practice is becoming inconsistent. Which response best applies ${course.title}?`,
      options: [
        { label: "Launch another initiative immediately", feedback: "Adding another initiative may increase ambiguity without addressing the cause of inconsistent implementation." },
        { label: `Restate the expected practice, diagnose barriers, provide focused support and review whether staff can ${second}`, feedback: "This combines clarity, support and evidence rather than treating variation as a simple compliance problem." },
        { label: "Assume the variation proves staff are unwilling to improve", feedback: "Effective leadership diagnoses the cause before deciding the appropriate response." },
      ],
    },
    Wellbeing: {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: improve the system",
      prompt: `A recurring pressure linked to ${focus} is affecting staff or pupils. Which response best applies the learning from ${course.title}?`,
      options: [
        { label: "Ask people to cope better without examining the recurring cause", feedback: "Personal coping may help, but it does not address an avoidable system cause by itself." },
        { label: `Identify what is controllable, test one proportionate change that supports people to ${second}, and review the effect`, feedback: "This treats wellbeing as a practical improvement problem while protecting important responsibilities." },
        { label: "Remove every demanding expectation regardless of its educational value", feedback: "A proportionate response should reduce avoidable pressure without abandoning important work automatically." },
      ],
    },
    "Digital Teaching": {
      id: `remaining-depth-${safeId(course.id)}-scenario`,
      type: "scenario",
      title: "Transfer challenge: useful is not enough",
      prompt: `A digital tool appears useful for work connected to ${focus}. What should happen before it becomes part of normal practice?`,
      options: [
        { label: "Adopt it because the first output looks polished", feedback: "A polished output does not establish accuracy, privacy, safeguarding or suitability." },
        { label: `Clarify the purpose, check privacy/safeguarding/accuracy and school expectations, then test whether it genuinely helps staff or pupils to ${second}`, feedback: "This keeps professional judgement and school governance at the centre of digital practice." },
        { label: "Upload sensitive information first so the tool can give a more personalised result", feedback: "Sensitive information should not be shared with a tool unless its approved use and data handling are clear and appropriate." },
      ],
    },
  };

  return variants[course.category];
}

function buildTransferQuiz(course: Course): QuizModule {
  const first = objective(course, 0, course.summary).toLowerCase();
  const second = objective(course, 1, "apply the approach appropriately").toLowerCase();
  const third = objective(course, 2, "review the effect and respond to evidence").toLowerCase();

  return {
    id: `remaining-depth-${safeId(course.id)}-quiz`,
    type: "quiz",
    title: "Transfer check: what makes the learning secure?",
    question: `Which response best shows that a member of staff can transfer ${course.title} into practice rather than simply repeat the headline idea?`,
    options: [
      `They can describe how to ${first} but always use exactly the same response regardless of context.`,
      `They can ${first}, connect this with how to ${second}, and use evidence or the relevant school procedure when deciding how to ${third}.`,
      "They can remember the course title and complete the slides quickly.",
      "They rely on personal preference when the course learning or school procedure points in a different direction.",
    ],
    answer: 1,
    feedback: "Transfer requires understanding the principle, applying it to context and using evidence or appropriate procedure to decide what happens next.",
  };
}

function insertBeforeClosing(modules: Module[], module: Module, fraction: number) {
  const reflectionIndex = modules.map(item => item.type).lastIndexOf("reflection");
  const upper = reflectionIndex >= 0 ? reflectionIndex : modules.length;
  const position = Math.max(2, Math.min(upper, Math.floor(upper * fraction)));
  modules.splice(position, 0, module);
}

export function deepenRemainingCourse(course: Course, index: number): Course {
  if (index < 30) return course;

  const modules = [...course.modules];
  const ids = new Set(modules.map(module => module.id));
  let addedMinutes = 0;

  const visual = buildApplicationVisual(course);
  if (!ids.has(visual.id)) {
    insertBeforeClosing(modules, visual, 0.46);
    ids.add(visual.id);
    addedMinutes += 5;
  }

  const scenarioCount = modules.filter(module => module.type === "scenario").length;
  if (scenarioCount < 2) {
    const scenario = buildTransferScenario(course);
    if (!ids.has(scenario.id)) {
      insertBeforeClosing(modules, scenario, 0.58);
      ids.add(scenario.id);
      addedMinutes += 6;
    }
  }

  const quizCount = modules.filter(module => module.type === "quiz").length;
  if (quizCount < 2) {
    const quiz = buildTransferQuiz(course);
    if (!ids.has(quiz.id)) {
      insertBeforeClosing(modules, quiz, 0.7);
      ids.add(quiz.id);
      addedMinutes += 5;
    }
  }

  return {
    ...course,
    duration: course.duration + addedMinutes,
    modules,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateRemainingCourseDepth(course: Course, index: number) {
  if (index < 30) return;
  const id = safeId(course.id);
  const prefix = `Remaining-course depth QA failed for ${course.id}:`;
  const quizzes = course.modules.filter(module => module.type === "quiz");
  const scenarios = course.modules.filter(module => module.type === "scenario");
  const appliedVisual = course.modules.find(module => module.id === `remaining-depth-${id}-application-map`);

  assert(Boolean(appliedVisual), `${prefix} missing course-specific application visual`);
  assert(appliedVisual?.type === "visual" && appliedVisual.items.length >= 5, `${prefix} application visual is incomplete`);
  assert(quizzes.length >= 2, `${prefix} needs at least two knowledge checks`);
  assert(scenarios.length >= 2, `${prefix} needs at least two decision scenarios`);

  const duplicateIds = course.modules.map(module => module.id);
  assert(new Set(duplicateIds).size === duplicateIds.length, `${prefix} depth layer introduced duplicate slide ids`);
}
