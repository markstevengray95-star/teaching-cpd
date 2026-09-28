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
type FirstTenId = (typeof FIRST_TEN_COURSE_IDS)[number];
type ActivityModule = Extract<Module, { type: "activity" }>;
type QuizModule = Extract<Module, { type: "quiz" }>;
type ScenarioModule = Extract<Module, { type: "scenario" }>;

const bespokePractice: Partial<Record<FirstTenId, ActivityModule>> = {
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

const bespokeKnowledge: Partial<Record<FirstTenId, QuizModule>> = {
  "autism-inclusive-classroom": {
    id: "qa10-autism-knowledge",
    type: "quiz",
    title: "Check: individual needs before assumptions",
    question: "Which planning decision best reflects inclusive classroom practice for an autistic pupil?",
    options: [
      "Use the same strategy for every autistic pupil because the diagnosis determines support",
      "Use pupil-specific information, identify the barrier in this task or environment and choose proportionate support while keeping the learning appropriately ambitious",
      "Remove all unexpected change and challenge permanently",
      "Wait until a difficulty occurs before reading the pupil's current support information",
    ],
    answer: 1,
    feedback: "Autistic pupils vary widely. Strong practice combines pupil-specific information with analysis of the actual classroom barrier rather than using a diagnosis as a fixed teaching recipe.",
  },
  "middle-leadership": {
    id: "qa10-middle-leadership-knowledge",
    type: "quiz",
    title: "Check: monitor for improvement",
    question: "After a team has a clear agreed practice and appropriate support, what is the strongest purpose of monitoring?",
    options: [
      "Rank staff from strongest to weakest",
      "Gather proportionate evidence about implementation and barriers so support and the approach can be refined",
      "Prove that the original leadership decision was correct",
      "Add another initiative whenever practice is inconsistent",
    ],
    answer: 1,
    feedback: "Monitoring is most useful when it helps leaders understand implementation, diagnose barriers and improve support rather than turning professional learning into a ranking exercise.",
  },
  "instructional-coaching": {
    id: "qa10-coaching-knowledge",
    type: "quiz",
    title: "Check: make the step coachable",
    question: "Which target is most suitable for an instructional coaching cycle?",
    options: [
      "Become a better teacher",
      "Improve questioning across every aspect of every lesson immediately",
      "After a hinge question, give thinking time, scan every response and choose the next teaching move from the response pattern",
      "Raise all pupil outcomes this term",
    ],
    answer: 2,
    feedback: "A coachable target is narrow, observable and rehearsable. It should be specific enough to model, practise, notice in a lesson and refine with evidence.",
  },
  "staff-wellbeing": {
    id: "qa10-wellbeing-knowledge",
    type: "quiz",
    title: "Check: improve the system",
    question: "A recurring administrative process is creating avoidable workload. What is the strongest first response?",
    options: [
      "Tell staff to become more resilient",
      "Identify the purpose and source of friction, simplify the process where possible and review whether workload falls without losing important quality",
      "Add another wellbeing activity while leaving the process unchanged",
      "Delete the process immediately without checking why it exists",
    ],
    answer: 1,
    feedback: "Sustainable workload improvement starts with controllable systems: purpose, duplication, clarity, ownership and process design should be examined before adding coping activities.",
  },
  "behaviour-routines": {
    id: "qa10-behaviour-routines-knowledge",
    type: "quiz",
    title: "Check: when is a routine becoming secure?",
    question: "Which evidence best suggests a classroom routine is becoming reliably learned?",
    options: [
      "The class completed it once after several reminders",
      "Pupils complete the sequence from the agreed cue with fewer prompts across repeated lessons",
      "The teacher has explained the rule several times",
      "More sanctions are being issued when the routine fails",
    ],
    answer: 1,
    feedback: "A secure routine becomes increasingly predictable from the agreed cue and needs less corrective prompting because the sequence has been explicitly taught and rehearsed.",
  },
  "de-escalation": {
    id: "qa10-deescalation-knowledge",
    type: "quiz",
    title: "Check: lower the temperature",
    question: "Which combination is most consistent with a calm de-escalation response?",
    options: [
      "Match the pupil's intensity, demand a full explanation and correct them in front of an audience",
      "Use calm concise language, reduce unnecessary stimulation or audience, keep boundaries clear and follow the school's agreed support procedures",
      "Promise that no consequence or follow-up will occur",
      "Continue questioning rapidly until the pupil explains every detail",
    ],
    answer: 1,
    feedback: "De-escalation aims to reduce unnecessary intensity while maintaining safety, clear boundaries and the school's agreed behaviour, pastoral and safeguarding procedures.",
  },
  "dyslexia-classroom-support": {
    id: "qa10-dyslexia-knowledge",
    type: "quiz",
    title: "Check: preserve the learning goal",
    question: "Which adjustment best supports a pupil experiencing a literacy-processing barrier without automatically reducing subject challenge?",
    options: [
      "Replace the subject concept with easier content",
      "Identify the specific reading or recording demand and use clearer layout, chunking, explicit vocabulary or appropriate assistive support while preserving the important subject thinking",
      "Remove all reading and writing permanently",
      "Use the same support for every pupil with dyslexia regardless of the task",
    ],
    answer: 1,
    feedback: "Effective support responds to the individual barrier and task demand while preserving access to meaningful subject knowledge and building independence where possible.",
  },
  "disciplinary-literacy": {
    id: "qa10-disciplinary-literacy-knowledge",
    type: "quiz",
    title: "Check: literacy belongs to the discipline",
    question: "What best distinguishes disciplinary literacy from a generic literacy activity?",
    options: [
      "It focuses mainly on spelling lists that are identical in every subject",
      "It explicitly teaches how experts in a subject read, use vocabulary, build explanations, interpret evidence or construct arguments",
      "It removes difficult subject terminology",
      "It replaces subject teaching with separate English exercises",
    ],
    answer: 1,
    feedback: "Disciplinary literacy makes the distinctive reading, writing, speaking and reasoning practices of a subject visible so pupils can participate more successfully in that discipline.",
  },
};

const bespokeDecision: Partial<Record<FirstTenId, ScenarioModule>> = {
  "adhd-classroom-strategies": {
    id: "qa10-adhd-decision",
    type: "scenario",
    title: "Decision point: make the sequence manageable",
    prompt: "A pupil understands a six-step practical task when an adult prompts each stage, but repeatedly loses their place when working independently. What is the strongest next adjustment?",
    options: [
      { label: "Repeat all six verbal instructions more loudly at the start", feedback: "A longer verbal load still requires the pupil to hold the whole sequence in working memory." },
      { label: "Externalise the steps in a concise visible checklist, teach the pupil how to use it and reduce adult prompts as they become more independent", feedback: "This reduces an incidental executive-function demand while keeping the pupil responsible for completing the learning task." },
      { label: "Remove the practical task and give a permanently easier activity", feedback: "The first aim should be to reduce the access barrier rather than automatically lower the learning goal." },
    ],
  },
  "instructional-coaching": {
    id: "qa10-coaching-decision",
    type: "scenario",
    title: "Decision point: from broad goal to rehearsal",
    prompt: "A teacher says, ‘I need to improve my questioning.’ What is the strongest next move for an instructional coach?",
    options: [
      { label: "Give the teacher a long list of questioning techniques to try at once", feedback: "Too many simultaneous changes make focused rehearsal and useful feedback difficult." },
      { label: "Use evidence from the teacher's context to identify one high-leverage questioning behaviour, model it, rehearse it and agree what evidence will be reviewed", feedback: "This turns a broad intention into a specific behaviour that can be practised, observed and refined." },
      { label: "Score the teacher's entire lesson before discussing a development step", feedback: "Instructional coaching should support a focused improvement cycle rather than begin as a broad performance judgement." },
    ],
  },
  "staff-wellbeing": {
    id: "qa10-wellbeing-decision",
    type: "scenario",
    title: "Decision point: remove avoidable workload",
    prompt: "Three teams are manually entering the same non-sensitive information into separate documents every week. What is the strongest response?",
    options: [
      { label: "Keep the process unchanged and add a staff wellbeing session", feedback: "A wellbeing activity does not remove the duplicated workload causing the pressure." },
      { label: "Clarify why the information is needed, identify one reliable source or shared process, remove unnecessary duplication and review whether quality is maintained", feedback: "This tackles a controllable system cause while protecting the useful purpose of the information." },
      { label: "Tell staff to work faster", feedback: "This treats the symptom as an individual problem rather than examining avoidable system friction." },
    ],
  },
  "assessment-for-learning": {
    id: "qa10-afl-decision",
    type: "scenario",
    title: "Decision point: use the evidence now",
    prompt: "A one-minute hinge question shows that around two-thirds of the class have selected the same misconception. What is the strongest next move?",
    options: [
      { label: "Record the scores and continue with the planned next section", feedback: "Collecting evidence is not formative if it does not influence the next teaching or learning action." },
      { label: "Pause, address the shared misconception with a focused explanation or contrast, then use another short check before deciding whether to move on", feedback: "This uses evidence to adapt teaching and then verifies whether the response improved understanding." },
      { label: "Ask one pupil who was correct to confirm that the class now understands", feedback: "One response cannot show whether the wider misconception has been resolved." },
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

function replaceGenericPractice(course: Course, modules: Module[]) {
  const replacement = bespokePractice[course.id as FirstTenId];
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

function replaceGenericCoreInteractions(course: Course, modules: Module[]) {
  const quiz = bespokeKnowledge[course.id as FirstTenId];
  const scenario = bespokeDecision[course.id as FirstTenId];
  return modules.map(module => {
    if (quiz && module.id === `presentation-${course.id}-knowledge`) return quiz;
    if (scenario && module.id === `presentation-${course.id}-decision`) return scenario;
    return module;
  });
}

function chooseFinalReflection(course: Course, modules: Module[]) {
  const reflections = modules.filter((module): module is Extract<Module, { type: "reflection" }> => module.type === "reflection");
  const flagshipReflection = reflections.find(module => module.id === `mc-reflect-${course.id}`);
  return flagshipReflection || reflections.at(-1);
}

export function qualityAssureFirstTenCourse(course: Course): Course {
  if (!firstTenIds.has(course.id)) return course;

  let modules = course.modules.filter(module => !isRedundantGenericSlide(course, module) && !isGenericEngagementSlide(course, module));
  modules = replaceGenericPractice(course, modules);
  modules = replaceGenericCoreInteractions(course, modules);

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
  assert(!course.modules.some(module => isGenericEngagementSlide(course, module)), `${prefix} generic engagement filler remains`);
  assert(!course.modules.some(module => module.id === `presentation-${course.id}-knowledge` || module.id === `presentation-${course.id}-decision`), `${prefix} generic core quiz/scenario fallback remains`);

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
