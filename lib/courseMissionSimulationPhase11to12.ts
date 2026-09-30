import type { Course, CourseCategory, Module } from "./data";

const P11 = "overhaul11-mission-";
const P12 = "overhaul12-sim-";

export const PRESENTATION_OVERHAUL_PHASE11_VERSION = "2026.12";
export const PRESENTATION_OVERHAUL_PHASE12_VERSION = "2026.13";

export type Phase11MissionStage = { id: string; label: string; purpose: string };
export type Phase11MissionPack = {
  moduleId: string;
  title: string;
  brief: string;
  objective: string;
  successSignals: string[];
  stages: Phase11MissionStage[];
};

export type Phase12MeterEffects = { evidence: number; access: number; sustainability: number };
export type Phase12SimulationChoice = {
  id: string;
  label: string;
  feedback: string;
  next: string;
  effects: Phase12MeterEffects;
};
export type Phase12SimulationState = {
  id: string;
  round: number;
  title: string;
  situation: string;
  choices: Phase12SimulationChoice[];
};
export type Phase12SimulationPack = {
  moduleId: string;
  simulationNumber: 1 | 2;
  title: string;
  subtitle: string;
  opening: string;
  states: Phase12SimulationState[];
};

export type Phase11to12Audit = {
  courseId: string;
  title: string;
  missionModules: number;
  missionStages: number;
  simulationModules: number;
  simulationStates: number;
  simulationChoices: number;
  branchingSimulations: number;
  score: number;
  ready: boolean;
};

type ActivityModule = Extract<Module, { type: "activity" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function insertAfter(modules: Module[], id: string, additions: Module[], fallback = 4) {
  const index = modules.findIndex(module => module.id === id);
  modules.splice(index >= 0 ? index + 1 : Math.min(fallback, modules.length), 0, ...additions);
}

function categoryMission(category: CourseCategory) {
  if (category === "Safeguarding") return {
    title: "Safeguarding decision mission",
    brief: "Use professional curiosity, factual recording and the school's current safeguarding route to make safe decisions without drifting into investigation.",
    objective: "Reach a defensible professional response that stays inside the staff role and moves concerns through the correct school procedure.",
    signals: ["The concern is recognised without speculation.", "Recording stays factual and proportionate.", "The correct safeguarding route is used promptly."],
  };
  if (category === "SEND") return {
    title: "Remove the barrier mission",
    brief: "Work out what is making participation or learning harder, preserve ambition and choose the smallest useful adaptation rather than defaulting to labels or permanent over-support.",
    objective: "Improve access while protecting independence, challenge and meaningful participation.",
    signals: ["The barrier is identified more precisely.", "The learning goal remains ambitious.", "Support can be faded or adjusted as independence grows."],
  };
  if (category === "Leadership") return {
    title: "Implementation mission",
    brief: "Turn an improvement idea into reliable team practice by separating clarity, capability, capacity and follow-through problems.",
    objective: "Create an implementation response that improves consistency without reducing professional judgement to compliance.",
    signals: ["Staff know what the intended practice actually is.", "Barriers are diagnosed rather than assumed.", "Review focuses on implementation evidence rather than staff ranking."],
  };
  if (category === "Wellbeing") return {
    title: "Reduce the friction mission",
    brief: "Identify what can be changed in the system, workload or routine rather than treating every problem as an individual resilience issue.",
    objective: "Choose a practical change that reduces avoidable friction and can be checked against real workload or wellbeing evidence.",
    signals: ["The controllable system factor is clear.", "The response does not depend on forced disclosure.", "There is evidence that workload or friction actually changes."],
  };
  if (category === "Digital Teaching") return {
    title: "Digital judgement mission",
    brief: "Decide where technology genuinely improves teaching or workload while protecting accuracy, privacy, accessibility and human professional judgement.",
    objective: "Use digital tools only where the educational or professional benefit remains stronger than the new risks they introduce.",
    signals: ["The purpose comes before the tool.", "Accuracy and privacy are checked rather than assumed.", "A human remains responsible for the final professional decision."],
  };
  return {
    title: "Improve the learning mission",
    brief: "Use evidence of pupil thinking to improve a real classroom decision without adding unnecessary complexity or copying a technique without its underlying principle.",
    objective: "Make one evidence-informed change that improves participation, thinking or learning and can be reviewed in practice.",
    signals: ["The learning problem is defined clearly.", "The response makes pupil thinking more visible.", "Evidence will determine the next teaching move."],
  };
}

const MISSION_STAGES: Phase11MissionStage[] = [
  { id: "brief", label: "Brief", purpose: "Understand the professional problem and what success would look like." },
  { id: "learn", label: "Learn", purpose: "Build the principle, evidence and boundaries behind the response." },
  { id: "practise", label: "Practise", purpose: "Rehearse decisions in activities, cases and examples." },
  { id: "decide", label: "Decide", purpose: "Respond to changing evidence and test professional judgement." },
  { id: "transfer", label: "Transfer", purpose: "Create something usable and decide how impact will be reviewed." },
];

export function getPhase11MissionPack(course: Course): Phase11MissionPack {
  const id = safeId(course.id);
  const lens = categoryMission(course.category);
  return {
    moduleId: `${P11}${id}`,
    title: lens.title,
    brief: `${lens.brief} This mission is built around ${course.title}.`,
    objective: lens.objective,
    successSignals: lens.signals,
    stages: MISSION_STAGES,
  };
}

function missionModule(course: Course): ActivityModule {
  const pack = getPhase11MissionPack(course);
  return {
    id: pack.moduleId,
    type: "activity",
    title: `Mission briefing · ${pack.title}`,
    prompt: pack.brief,
    instructions: [
      `Mission objective: ${pack.objective}`,
      "Choose the success signal you most need to protect during this course.",
      "Work through Brief → Learn → Practise → Decide → Transfer rather than treating the course as a slide deck.",
      "Accept the mission when you are clear what you are trying to improve.",
    ],
    placeholder: "My mission focus and the success signal I will protect…",
    minimumCharacters: 60,
  };
}

export function applyMissionPhase11(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => module.id !== `${P11}${id}`);
  insertAfter(modules, `overhaul10-archetype-${id}-identity`, [missionModule(course)], 3);
  return { ...course, duration: course.duration + 4, modules };
}

export function isPhase11MissionModule(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith(P11));
}

function simulationLanguage(category: CourseCategory, simulationNumber: 1 | 2, course: Course) {
  const later = simulationNumber === 2;
  if (category === "Safeguarding") return later ? {
    title: "Safeguarding simulation · new information arrives",
    opening: "A concern has already been passed through the school's safeguarding route. Later, another factual piece of information becomes available and colleagues are unsure what belongs in the record and what should happen next.",
    strong: "Record the new factual information and use the current safeguarding route again, without investigating.",
    mixed: "Discuss it informally first and decide later whether it seems serious enough to record.",
    weak: "Question several pupils to work out exactly what happened before contacting safeguarding staff.",
  } : {
    title: "Safeguarding simulation · first response",
    opening: "During the school day, a pupil says something that may indicate a safeguarding concern. The information is incomplete and you need to decide what to do within your role.",
    strong: "Listen, stay factual, avoid leading questions and follow the school's current reporting route.",
    mixed: "Ask several detailed questions so the DSL receives a complete story.",
    weak: "Wait to see whether the pupil mentions it again before recording anything.",
  };
  if (category === "SEND") return later ? {
    title: "SEND simulation · support is working, but dependence is growing",
    opening: "An adaptation has improved task completion, but the learner now waits for adult prompts before starting work they can sometimes do independently.",
    strong: "Keep the ambitious goal and plan how to fade or reshape the support using evidence of independence.",
    mixed: "Keep the support exactly as it is because task completion has improved.",
    weak: "Remove all support immediately to encourage independence.",
  } : {
    title: "SEND simulation · find the barrier",
    opening: "A learner is not starting a demanding task. Colleagues have suggested several explanations, but the actual barrier has not yet been tested.",
    strong: "Check the task demand and learner evidence, then choose the smallest adaptation that preserves the goal.",
    mixed: "Use the same support normally recommended for this label.",
    weak: "Lower the learning objective so the pupil can complete something quickly.",
  };
  if (category === "Leadership") return later ? {
    title: "Leadership simulation · implementation under pressure",
    opening: "A shared team routine has launched, but workload is rising and implementation is inconsistent. Some staff understand the purpose; others are improvising different versions.",
    strong: "Clarify the smallest non-negotiable practice, diagnose barriers and remove avoidable workload before reviewing implementation.",
    mixed: "Increase monitoring immediately so everyone follows the routine in exactly the same way.",
    weak: "Launch another initiative to create fresh momentum.",
  } : {
    title: "Leadership simulation · inconsistent practice",
    opening: "A team priority is being implemented differently across the department. The visible inconsistency may reflect clarity, capability, capacity or professional adaptation.",
    strong: "Clarify the intended practice and gather evidence about the barriers before deciding on support.",
    mixed: "Assume the problem is staff motivation and restate the expectation more forcefully.",
    weak: "Rank staff publicly so the strongest implementation becomes obvious.",
  };
  if (category === "Wellbeing") return later ? {
    title: "Wellbeing simulation · did the change actually reduce workload?",
    opening: "A new wellbeing initiative has been well received, but staff still report the same duplication and deadlines that were creating pressure beforehand.",
    strong: "Check whether the underlying workload process changed and remove or redesign the system friction that remains.",
    mixed: "Keep the initiative because staff said they enjoyed it.",
    weak: "Add another resilience activity without changing the workload process.",
  } : {
    title: "Wellbeing simulation · identify the controllable pressure",
    opening: "A team reports rising pressure. There are several possible causes, including duplicated systems, unclear deadlines and individual circumstances.",
    strong: "Identify the controllable system factors first, while keeping appropriate individual support available.",
    mixed: "Offer a wellbeing resource and wait to see whether pressure improves.",
    weak: "Tell staff that managing stress is primarily a matter of personal resilience.",
  };
  if (category === "Digital Teaching") return later ? {
    title: "Digital simulation · scale it safely",
    opening: "A digital tool has saved time for several staff and the team now wants to use it more widely. Questions remain about accessibility, checking outputs and what information can be entered.",
    strong: "Set clear safe-use boundaries, accessibility checks and human verification before scaling the workflow.",
    mixed: "Scale it quickly because the early users reported time savings.",
    weak: "Allow each person to decide independently what data and outputs are safe to use.",
  } : {
    title: "Digital simulation · useful output, uncertain reliability",
    opening: "A digital or AI tool produces a useful-looking resource quickly, but some details may be inaccurate and the source material includes information that needs careful handling.",
    strong: "Check the purpose, verify the content and protect privacy before using or sharing the output.",
    mixed: "Use it with minor edits because it looks professionally written.",
    weak: "Assume the tool is accurate because it generated the answer confidently.",
  };
  return later ? {
    title: "Teaching simulation · transfer under pressure",
    opening: "A strategy worked in one class, but a second class responds differently and the original routine is no longer producing useful evidence of learning.",
    strong: "Keep the underlying principle, adapt the surface routine and check pupil thinking again.",
    mixed: "Repeat the original routine more frequently because it worked before.",
    weak: "Abandon the principle completely after one weaker lesson.",
  } : {
    title: "Teaching simulation · the lesson changes",
    opening: `During a lesson linked to ${course.title}, pupils appear busy but the evidence of understanding is weaker than expected. You need to decide what to do next.`,
    strong: "Use a focused check of pupil thinking, then adapt the next teaching move to the evidence.",
    mixed: "Continue because most pupils look engaged and revisit the issue next lesson.",
    weak: "Add more explanation immediately without checking what pupils currently understand.",
  };
}

function makeChoice(id: string, label: string, feedback: string, next: string, effects: Phase12MeterEffects): Phase12SimulationChoice {
  return { id, label, feedback, next, effects };
}

export function getPhase12SimulationPack(course: Course, simulationNumber: 1 | 2): Phase12SimulationPack {
  const id = safeId(course.id);
  const language = simulationLanguage(course.category, simulationNumber, course);
  const states: Phase12SimulationState[] = [
    {
      id: "start", round: 1, title: "The situation changes", situation: language.opening,
      choices: [
        makeChoice("principle", language.strong, "Strong start: the response stays connected to the professional principle and creates better evidence for the next decision.", "strong-signal", { evidence: 18, access: 10, sustainability: 8 }),
        makeChoice("surface", language.mixed, "Plausible, but the response relies too heavily on a surface judgement. The next round will contain more ambiguity.", "mixed-signal", { evidence: 2, access: 1, sustainability: -4 }),
        makeChoice("assume", language.weak, "This creates a recoverable problem because the decision moves ahead of the evidence or professional boundary.", "recovery", { evidence: -14, access: -8, sustainability: -8 }),
      ],
    },
    {
      id: "strong-signal", round: 2, title: "Useful evidence appears", situation: "Your first move gives you better information. There is some improvement, but one important barrier remains and the response needs adapting rather than simply repeating.",
      choices: [
        makeChoice("adapt", "Keep the principle, adapt the response and state what evidence you will check next.", "Good professional adaptation: the decision remains evidence-led without treating the first strategy as a fixed recipe.", "final-strong", { evidence: 15, access: 10, sustainability: 12 }),
        makeChoice("scale", "Scale the first response immediately because the early evidence is positive.", "Early success is not enough to justify broad implementation without checking context and unintended effects.", "final-recovery", { evidence: -2, access: 0, sustainability: -8 }),
        makeChoice("stop", "Stop the approach because it did not solve every barrier at once.", "This discards a useful principle before testing whether a proportionate adaptation would solve the remaining problem.", "final-recovery", { evidence: -8, access: -4, sustainability: -5 }),
      ],
    },
    {
      id: "mixed-signal", round: 2, title: "The evidence is ambiguous", situation: "The situation has not deteriorated, but the evidence is too weak to know whether the response is solving the intended problem. Colleagues offer different explanations.",
      choices: [
        makeChoice("target", "Gather one targeted piece of evidence linked directly to the intended outcome before changing course.", "This reduces guesswork and gives the next decision a defensible evidence base.", "final-strong", { evidence: 16, access: 6, sustainability: 8 }),
        makeChoice("more", "Add more strategies at the same time so at least one of them is likely to work.", "Adding multiple changes makes it harder to know what helped and can increase workload or dependence.", "final-recovery", { evidence: -8, access: -2, sustainability: -12 }),
        makeChoice("person", "Assume the inconsistency is mainly caused by the individual involved.", "This jumps to an attribution before checking task, system, access or implementation conditions.", "final-recovery", { evidence: -10, access: -8, sustainability: -5 }),
      ],
    },
    {
      id: "recovery", round: 2, title: "You need to recover the decision", situation: "The first move has not produced useful evidence and may have introduced a new barrier. You can still recover by returning to the underlying professional principle.",
      choices: [
        makeChoice("reset", "Reset to the core principle, identify what evidence is missing and make the smallest corrective move.", "Strong recovery: professional judgement is not about never making a weak first move; it is about noticing and correcting it using evidence.", "final-strong", { evidence: 20, access: 12, sustainability: 10 }),
        makeChoice("persist", "Persist with the original response so people have enough time to get used to it.", "Persistence without useful evidence can turn a weak response into an implementation problem.", "final-recovery", { evidence: -8, access: -6, sustainability: -10 }),
        makeChoice("abandon", "Abandon the whole principle and return to previous practice immediately.", "This confuses a weak implementation choice with evidence that the underlying principle is wrong.", "final-recovery", { evidence: -6, access: -3, sustainability: -7 }),
      ],
    },
    {
      id: "final-strong", round: 3, title: "Make the transfer decision", situation: "The response is now better aligned to the principle and the evidence is clearer. Your final task is to decide how this should transfer into normal practice without overclaiming impact.",
      choices: [
        makeChoice("review", "Use it in a defined context, collect the agreed evidence and set a review point for keep/adapt/stop.", "Mission-quality finish: the action, evidence and review decision remain connected.", "end", { evidence: 14, access: 8, sustainability: 16 }),
        makeChoice("permanent", "Make the approach permanent now because the simulation improved.", "A promising response still needs real implementation evidence before becoming a permanent routine.", "end", { evidence: -3, access: 0, sustainability: -7 }),
        makeChoice("claim", "Report that the strategy has solved the wider problem.", "This overclaims what the available evidence can show.", "end", { evidence: -10, access: 0, sustainability: -5 }),
      ],
    },
    {
      id: "final-recovery", round: 3, title: "Finish with a recovery plan", situation: "The route you took created uncertainty or an additional barrier. You now need to finish with a professional recovery decision rather than simply selecting another technique.",
      choices: [
        makeChoice("reframe", "Re-state the problem, return to the course principle and define one evidence-led next step with a review point.", "Strong recovery finish: the simulation ends with a clearer professional process, not a guess at a new technique.", "end", { evidence: 18, access: 10, sustainability: 14 }),
        makeChoice("copy", "Copy the strongest-looking strategy from another setting without adapting it.", "A visible technique may not transfer if the problem, people or implementation conditions are different.", "end", { evidence: -5, access: -4, sustainability: -8 }),
        makeChoice("wait", "Make no further change and hope the problem resolves over time.", "Waiting without a review plan leaves the professional problem and evidence gap unresolved.", "end", { evidence: -8, access: -5, sustainability: -6 }),
      ],
    },
  ];
  return {
    moduleId: `${P12}${id}-${simulationNumber}`,
    simulationNumber,
    title: language.title,
    subtitle: simulationNumber === 1 ? "In-the-moment professional judgement" : "Implementation and transfer under pressure",
    opening: language.opening,
    states,
  };
}

function simulationModule(course: Course, simulationNumber: 1 | 2): ActivityModule {
  const pack = getPhase12SimulationPack(course, simulationNumber);
  return {
    id: pack.moduleId,
    type: "activity",
    title: pack.title,
    prompt: pack.opening,
    instructions: [
      "Work through three decision rounds. Your choice changes the next situation.",
      "Watch the Evidence, Access and Sustainability meters rather than hunting for a single magic answer.",
      "If an early decision is weak, use the recovery route to return to the professional principle.",
      "Finish with a transfer or recovery decision, then save the simulation to your CPD record.",
    ],
    placeholder: "Simulation outcome will be recorded here automatically…",
    minimumCharacters: 40,
  };
}

export function applySimulationPhase12(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${P12}${id}-`));
  insertAfter(modules, `overhaul2-process-${id}-2`, [simulationModule(course, 1)], Math.min(12, modules.length));
  insertAfter(modules, `overhaul4-case-${id}-2-transfer`, [simulationModule(course, 2)], Math.max(4, modules.length - 8));
  return { ...course, duration: course.duration + 12, modules };
}

export function isPhase12SimulationModule(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith(P12));
}

export function getPhase12SimulationModulePack(course: Course, module: Module | undefined | null) {
  if (!module || !isPhase12SimulationModule(module)) return null;
  const simulationNumber: 1 | 2 = module.id.endsWith("-2") ? 2 : 1;
  return getPhase12SimulationPack(course, simulationNumber);
}

export function validateMissionSimulationPhases11to12(course: Course) {
  const mission = course.modules.filter(module => module.id.startsWith(P11));
  const simulations = course.modules.filter(module => module.id.startsWith(P12));
  if (mission.length !== 1) throw new Error(`Presentation Phase 11: ${course.id} needs exactly one mission briefing`);
  if (getPhase11MissionPack(course).stages.length !== 5) throw new Error(`Presentation Phase 11: ${course.id} needs five mission stages`);
  if (simulations.length !== 2) throw new Error(`Presentation Phase 12: ${course.id} needs two branching simulations`);
  const missionIndex = course.modules.findIndex(module => module.id === mission[0].id);
  const simIndexes = simulations.map(module => course.modules.findIndex(item => item.id === module.id)).sort((a, b) => a - b);
  if (!(missionIndex >= 0 && missionIndex < simIndexes[0] && simIndexes[0] < simIndexes[1])) throw new Error(`Presentation Phases 11–12: ${course.id} mission/simulation order is invalid`);
  [1, 2].forEach(number => {
    const pack = getPhase12SimulationPack(course, number as 1 | 2);
    if (pack.states.length < 6) throw new Error(`Presentation Phase 12: ${course.id} simulation ${number} needs a full branching state graph`);
    if (pack.states.some(state => state.choices.length < 3)) throw new Error(`Presentation Phase 12: ${course.id} simulation ${number} needs three meaningful choices per state`);
    const start = pack.states.find(state => state.id === "start");
    if (!start || new Set(start.choices.map(choice => choice.next)).size < 3) throw new Error(`Presentation Phase 12: ${course.id} simulation ${number} must genuinely branch after the first decision`);
    const rounds = new Set(pack.states.map(state => state.round));
    if (rounds.size < 3) throw new Error(`Presentation Phase 12: ${course.id} simulation ${number} needs three decision rounds`);
  });
}

export function auditMissionSimulationPhases11to12(course: Course): Phase11to12Audit {
  const missionModules = course.modules.filter(module => module.id.startsWith(P11)).length;
  const simulationModules = course.modules.filter(module => module.id.startsWith(P12)).length;
  const packs = [getPhase12SimulationPack(course, 1), getPhase12SimulationPack(course, 2)];
  const simulationStates = packs.reduce((sum, pack) => sum + pack.states.length, 0);
  const simulationChoices = packs.reduce((sum, pack) => sum + pack.states.reduce((stateSum, state) => stateSum + state.choices.length, 0), 0);
  const branchingSimulations = packs.filter(pack => {
    const start = pack.states.find(state => state.id === "start");
    return Boolean(start && new Set(start.choices.map(choice => choice.next)).size >= 3);
  }).length;
  const missionStages = getPhase11MissionPack(course).stages.length;
  const score = Math.min(100,
    (missionModules === 1 ? 20 : 0) +
    (missionStages >= 5 ? 15 : 0) +
    (simulationModules === 2 ? 25 : 0) +
    (simulationStates >= 12 ? 15 : 0) +
    (simulationChoices >= 36 ? 15 : 0) +
    (branchingSimulations === 2 ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, missionModules, missionStages, simulationModules, simulationStates, simulationChoices, branchingSimulations, score, ready: score === 100 };
}

export function summariseMissionSimulationPhases11to12(courses: Course[]) {
  const reports = courses.map(auditMissionSimulationPhases11to12);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    totalSimulations: reports.reduce((sum, report) => sum + report.simulationModules, 0),
    totalDecisionOptions: reports.reduce((sum, report) => sum + report.simulationChoices, 0),
    reports,
  };
}
