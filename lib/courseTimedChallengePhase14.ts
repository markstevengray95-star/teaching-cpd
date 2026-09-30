import type { Course, CourseCategory, Module } from "./data";

export const PRESENTATION_OVERHAUL_PHASE14_VERSION = "2026.15";
export const PHASE14_TIMED_KINDS = ["retrieval", "ranking", "spot_error"] as const;
export type Phase14TimedKind = (typeof PHASE14_TIMED_KINDS)[number];

export type Phase14Option = {
  id: string;
  label: string;
  correct?: boolean;
  error?: boolean;
  feedback: string;
};

export type Phase14TimedChallenge = {
  id: string;
  kind: Phase14TimedKind;
  anchorId: string;
  seconds: 45 | 60 | 75;
  title: string;
  strapline: string;
  prompt: string;
  options: Phase14Option[];
  correctOrder?: string[];
  requiredErrors?: number;
  success: string;
};

export type Phase14Audit = {
  courseId: string;
  title: string;
  challenges: number;
  timedSeconds: number;
  choicePoints: number;
  kinds: number;
  optionalTimers: boolean;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function firstAnchor(course: Course, predicate: (module: Module) => boolean, fallbackIndex: number) {
  return course.modules.find(predicate)?.id || course.modules[Math.min(fallbackIndex, Math.max(0, course.modules.length - 1))]?.id || "";
}

function anchors(course: Course) {
  const reading = firstAnchor(course, module => module.id.startsWith("overhaul2-process-"), 8);
  const workshop = firstAnchor(course, module => module.id.startsWith("overhaul3-workshop-") && module.id.includes("rank"), Math.floor(course.modules.length * 0.48));
  const caseModel = firstAnchor(course, module => module.id.startsWith("overhaul4-case-") && module.id.endsWith("-model"), Math.floor(course.modules.length * 0.7));
  return { reading, workshop, caseModel };
}

function option(id: string, label: string, feedback: string, flags: { correct?: boolean; error?: boolean } = {}): Phase14Option {
  return { id, label, feedback, ...flags };
}

function categoryContent(category: CourseCategory) {
  if (category === "Safeguarding") return {
    retrieval: {
      prompt: "Which principle should be retrieved first when a safeguarding concern is incomplete?",
      options: [
        option("route", "Recognise, record factually and use the school's current safeguarding route without investigating.", "Correct. Staff do not need to prove a concern before using the current reporting procedure.", { correct: true }),
        option("prove", "Gather enough detail to decide whether the concern is probably true before reporting it.", "That moves toward investigation and can delay the correct reporting route."),
        option("wait", "Wait for a repeated concern so the evidence is stronger.", "Safeguarding concerns should be handled through current school procedure with the information available."),
      ],
    },
    ranking: [
      ["notice", "Notice the concern and stay within the staff role"],
      ["record", "Record what was observed or said factually"],
      ["report", "Use the school's current safeguarding route"],
      ["follow", "Follow DSL/policy guidance if new information appears"],
    ] as [string, string][],
    spot: [
      option("fact", "The note clearly separates what was said from the adult's interpretation.", "This is a strength, not an error."),
      option("promise", "The adult promises the pupil the information will stay between them.", "Correct error: staff should not promise confidentiality they cannot keep.", { error: true }),
      option("route", "The concern is passed through the school's current safeguarding process promptly.", "This is a strength, not an error."),
      option("investigate", "The adult plans to question other pupils before speaking to safeguarding staff.", "Correct error: that moves into investigation rather than recognition, recording and reporting.", { error: true }),
    ],
  };

  if (category === "SEND") return {
    retrieval: {
      prompt: "What is the strongest first principle when choosing an adaptation?",
      options: [
        option("barrier", "Identify the actual barrier while preserving the intended learning goal.", "Correct. Adapt the route to learning rather than lowering ambition by default.", { correct: true }),
        option("label", "Start with the strategy most commonly linked to the pupil's diagnosis.", "A label does not automatically identify the barrier in this task."),
        option("completion", "Choose whatever support makes task completion fastest.", "Completion alone does not show access, learning or independence."),
      ],
    },
    ranking: [
      ["identify", "Identify the barrier in the task, environment or communication"],
      ["protect", "Protect the intended learning outcome"],
      ["adapt", "Choose the smallest useful adaptation"],
      ["review", "Review access and independence, then fade or adapt support"],
    ] as [string, string][],
    spot: [
      option("goal", "The adaptation keeps the same ambitious learning goal.", "This is a strength, not an error."),
      option("permanent", "Because the support worked once, it is written in as a permanent routine without review.", "Correct error: effective support still needs review and may need fading or adapting.", { error: true }),
      option("voice", "The plan uses evidence from the learner and the demands of the specific task.", "This is a strength, not an error."),
      option("adult", "Success is defined only as finishing work while an adult remains beside the learner.", "Correct error: this does not test independence or whether the barrier is actually reduced.", { error: true }),
    ],
  };

  if (category === "Leadership") return {
    retrieval: {
      prompt: "What should happen before leaders increase monitoring of inconsistent implementation?",
      options: [
        option("diagnose", "Clarify the intended practice and diagnose clarity, capability and capacity barriers.", "Correct. Monitoring cannot fix an implementation problem that has not been diagnosed.", { correct: true }),
        option("rank", "Rank staff by visible compliance so the strongest model is obvious.", "Ranking does not diagnose why implementation differs."),
        option("repeat", "Repeat the expectation more forcefully before gathering further evidence.", "Restating an expectation may not address capability, capacity or design barriers."),
      ],
    },
    ranking: [
      ["clarify", "Clarify the intended practice and its purpose"],
      ["diagnose", "Diagnose the implementation barrier"],
      ["support", "Provide proportionate support or remove system friction"],
      ["review", "Review implementation evidence and adapt"],
    ] as [string, string][],
    spot: [
      option("purpose", "The team can explain the intended practice and why it matters.", "This is a strength, not an error."),
      option("league", "A public staff league table is used as the main implementation measure.", "Correct error: ranking staff is not a sound substitute for implementation evidence.", { error: true }),
      option("barrier", "Leaders distinguish clarity, capability and capacity problems.", "This is a strength, not an error."),
      option("initiative", "When workload rises, a second initiative is launched to restore momentum.", "Correct error: adding implementation load can make the original problem worse.", { error: true }),
    ],
  };

  if (category === "Wellbeing") return {
    retrieval: {
      prompt: "What should be checked before treating rising staff pressure as an individual resilience issue?",
      options: [
        option("system", "Controllable system, workload and role-friction factors.", "Correct. Organisational causes should be examined rather than defaulting to individual coping.", { correct: true }),
        option("resilience", "Whether staff have completed enough resilience activities.", "That starts with an individual solution before diagnosing the source of pressure."),
        option("attendance", "Whether enough staff attended the wellbeing launch.", "Attendance does not show whether the underlying workload problem changed."),
      ],
    },
    ranking: [
      ["define", "Define the specific pressure or friction"],
      ["control", "Identify controllable system factors"],
      ["change", "Make one practical change"],
      ["measure", "Check whether workload or friction actually reduces"],
    ] as [string, string][],
    spot: [
      option("duplication", "The team measures whether duplicated work actually reduces.", "This is a strength, not an error."),
      option("enjoyment", "The initiative is judged successful only because staff say they enjoyed it.", "Correct error: positive reaction does not prove the original workload problem changed.", { error: true }),
      option("choice", "Individual support is available without forced personal disclosure.", "This is a strength, not an error."),
      option("extra", "A new wellbeing activity is added while the original duplicated process stays unchanged.", "Correct error: this adds activity without reducing the source of friction.", { error: true }),
    ],
  };

  if (category === "Digital Teaching") return {
    retrieval: {
      prompt: "What is the strongest rule before using a polished-looking digital or AI output professionally?",
      options: [
        option("verify", "Verify important content, protect privacy and keep human responsibility for the final decision.", "Correct. Fluency and speed do not replace verification or professional accountability.", { correct: true }),
        option("polish", "Use it if the output looks professional and only make light edits.", "Professional-looking output can still be inaccurate or inappropriate."),
        option("popular", "Use it if several colleagues already trust the tool.", "Popularity does not establish accuracy, privacy or accessibility."),
      ],
    },
    ranking: [
      ["purpose", "Define the educational or professional purpose"],
      ["risk", "Check privacy, accessibility and data boundaries"],
      ["verify", "Verify important outputs using human judgement"],
      ["review", "Review whether the tool improved the intended outcome"],
    ] as [string, string][],
    spot: [
      option("purpose", "The team states the educational purpose before choosing a tool.", "This is a strength, not an error."),
      option("data", "Staff are told to decide individually what sensitive information is safe to enter.", "Correct error: shared safe-use boundaries are needed.", { error: true }),
      option("check", "Important outputs are checked before being used with pupils or staff.", "This is a strength, not an error."),
      option("confidence", "Confident AI wording is treated as evidence that the answer is reliable.", "Correct error: confident language is not evidence of accuracy.", { error: true }),
    ],
  };

  return {
    retrieval: {
      prompt: "Which principle gives the strongest basis for the next teaching move?",
      options: [
        option("thinking", "Use evidence of pupil thinking, then adapt teaching to what that evidence shows.", "Correct. Responsive teaching needs evidence of thinking, not just visible activity.", { correct: true }),
        option("busy", "Continue if most pupils look busy and compliant.", "Visible activity does not necessarily show understanding."),
        option("more", "Add more explanation whenever pupils seem uncertain.", "More explanation without diagnosis may address the wrong misconception."),
      ],
    },
    ranking: [
      ["problem", "Define the learning problem precisely"],
      ["evidence", "Gather evidence of pupil thinking"],
      ["adapt", "Adapt the next teaching move"],
      ["review", "Review whether the change improved the intended outcome"],
    ] as [string, string][],
    spot: [
      option("sample", "The teacher samples thinking from several pupils rather than one volunteer.", "This is a strength, not an error."),
      option("busy", "The lesson is judged successful mainly because pupils are quiet and busy.", "Correct error: activity and compliance are not sufficient evidence of learning.", { error: true }),
      option("adapt", "The next explanation changes after a misconception becomes visible.", "This is a strength, not an error."),
      option("repeat", "A routine is repeated unchanged because it worked with a different class.", "Correct error: keep the principle but adapt the surface routine to context and evidence.", { error: true }),
    ],
  };
}

export function getPhase14TimedChallenges(course: Course): Phase14TimedChallenge[] {
  const id = safeId(course.id);
  const a = anchors(course);
  const lens = categoryContent(course.category);
  const rankOptions = lens.ranking.map(([itemId, label], index) => option(itemId, label, index === 0 ? "Start with the problem or purpose before choosing an action." : "Use the professional sequence rather than jumping straight to action."));
  return [
    {
      id: `phase14-${id}-retrieval`, kind: "retrieval", anchorId: a.reading, seconds: 45,
      title: "45-second retrieval sprint", strapline: "Retrieve the principle before reopening the explanation.",
      prompt: lens.retrieval.prompt, options: lens.retrieval.options,
      success: "Retrieved. You identified the principle that should guide the next professional decision.",
    },
    {
      id: `phase14-${id}-ranking`, kind: "ranking", anchorId: a.workshop, seconds: 60,
      title: "60-second judgement ranking", strapline: "Build the professional sequence under light time pressure.",
      prompt: "Select the four actions in the strongest order.", options: rankOptions,
      correctOrder: lens.ranking.map(([itemId]) => itemId),
      success: "Strong sequence. You moved from diagnosis or purpose to action and then evidence-informed review.",
    },
    {
      id: `phase14-${id}-spot`, kind: "spot_error", anchorId: a.caseModel, seconds: 75,
      title: "75-second spot-the-error", strapline: "Find the two professional traps hidden in the example.",
      prompt: "Select exactly two statements that weaken the professional response.", options: lens.spot,
      requiredErrors: 2,
      success: "Both traps found. You distinguished plausible-looking practice from the stronger professional standard.",
    },
  ];
}

export function getPhase14TimedChallengeForModule(course: Course, module: Module | undefined | null) {
  if (!module) return null;
  return getPhase14TimedChallenges(course).find(challenge => challenge.anchorId === module.id) || null;
}

export function validateTimedChallengesPhase14(course: Course) {
  const challenges = getPhase14TimedChallenges(course);
  if (challenges.length !== 3) throw new Error(`Phase 14 ${course.id}: requires three optional timed challenges`);
  if (new Set(challenges.map(challenge => challenge.kind)).size !== 3) throw new Error(`Phase 14 ${course.id}: requires retrieval, ranking and spot-error challenges`);
  const expected = [45, 60, 75];
  challenges.forEach((challenge, index) => {
    if (!challenge.anchorId || !course.modules.some(module => module.id === challenge.anchorId)) throw new Error(`Phase 14 ${course.id}: ${challenge.kind} challenge anchor is missing`);
    if (challenge.seconds !== expected[index]) throw new Error(`Phase 14 ${course.id}: invalid timer for ${challenge.kind}`);
    if (challenge.options.length < 3) throw new Error(`Phase 14 ${course.id}: ${challenge.kind} needs at least three choice points`);
  });
  const retrieval = challenges[0];
  if (retrieval.options.filter(item => item.correct).length !== 1) throw new Error(`Phase 14 ${course.id}: retrieval requires exactly one correct response`);
  const ranking = challenges[1];
  if (!ranking.correctOrder || ranking.correctOrder.length !== 4 || new Set(ranking.correctOrder).size !== 4) throw new Error(`Phase 14 ${course.id}: ranking requires four unique ordered actions`);
  const spot = challenges[2];
  if (spot.requiredErrors !== 2 || spot.options.filter(item => item.error).length !== 2) throw new Error(`Phase 14 ${course.id}: spot-error requires exactly two errors`);
  return true;
}

export function auditTimedChallengesPhase14(course: Course): Phase14Audit {
  const challenges = getPhase14TimedChallenges(course);
  let ready = true;
  try { validateTimedChallengesPhase14(course); } catch { ready = false; }
  const timedSeconds = challenges.reduce((sum, challenge) => sum + challenge.seconds, 0);
  const choicePoints = challenges.reduce((sum, challenge) => sum + challenge.options.length, 0);
  const kinds = new Set(challenges.map(challenge => challenge.kind)).size;
  const score = Math.min(100,
    (challenges.length === 3 ? 25 : 0) +
    (kinds === 3 ? 20 : 0) +
    (timedSeconds === 180 ? 15 : 0) +
    (choicePoints >= 11 ? 15 : 0) +
    (ready ? 25 : 0)
  );
  return { courseId: course.id, title: course.title, challenges: challenges.length, timedSeconds, choicePoints, kinds, optionalTimers: true, ready, score };
}

export function summariseTimedChallengesPhase14(courses: Course[]) {
  const reports = courses.map(auditTimedChallengesPhase14);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalChallenges: reports.reduce((sum, report) => sum + report.challenges, 0),
    totalTimedSeconds: reports.reduce((sum, report) => sum + report.timedSeconds, 0),
    totalChoicePoints: reports.reduce((sum, report) => sum + report.choicePoints, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
