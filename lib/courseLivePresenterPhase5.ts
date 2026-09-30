import type { Course, Module } from "./data";
import { getWorkshopActivityPhase3Pack } from "./courseWorkshopActivityPhase3";
import { getProgressiveCasePhase4ModulePack } from "./courseProgressiveCasePhase4";

export const PRESENTATION_OVERHAUL_PHASE5_VERSION = "2026.6";
export const PHASE5_LIVE_MOMENT_KINDS = ["confidence", "poll", "word_cloud", "discussion", "questions"] as const;
export type Phase5LiveMomentKind = (typeof PHASE5_LIVE_MOMENT_KINDS)[number];
export type Phase5LiveMoment = {
  id: string;
  moduleId: string;
  kind: Phase5LiveMomentKind;
  title: string;
  prompt: string;
  options?: string[];
  responseMode: "anonymous" | "named";
  confidencePhase?: "pre" | "post";
  durationMinutes?: number;
  facilitatorPrompt: string;
  purpose: string;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function short(value: string, limit = 92) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trim()}…`;
}

function findModule(course: Course, ids: string[], fallback?: (module: Module) => boolean) {
  for (const id of ids) {
    const module = course.modules.find(item => item.id === id);
    if (module) return module;
  }
  return fallback ? course.modules.find(fallback) : undefined;
}

function categoryPrompt(course: Course) {
  if (course.category === "Safeguarding") return {
    cloud: "What one principle should stay stable when a safeguarding situation feels uncertain?",
    question: "What question about applying the school's safeguarding procedure would you want clarified before leaving?",
  };
  if (course.category === "SEND") return {
    cloud: "What word or short phrase best captures the difference between support and over-support?",
    question: "What barrier or adaptation question do you still need to resolve before applying this learning?",
  };
  if (course.category === "Leadership") return {
    cloud: "What implementation condition most often determines whether change actually sticks?",
    question: "What leadership or implementation question remains unresolved for your team?",
  };
  if (course.category === "Wellbeing") return {
    cloud: "What system condition most affects whether this wellbeing approach will help in practice?",
    question: "What workload, role or system question still needs answering before implementation?",
  };
  if (course.category === "Digital Teaching") return {
    cloud: "What one word should guide a decision about whether this technology is educationally worthwhile?",
    question: "What accuracy, privacy, accessibility or implementation question still needs resolving?",
  };
  return {
    cloud: "What one word or short phrase best captures the professional principle from this section?",
    question: "What question would you want clarified before trying this in your own practice?",
  };
}

function strongestLabels(options: { label: string; strongest?: boolean; correct?: boolean }[] | undefined) {
  if (!options?.length) return [] as string[];
  return options.map(item => short(item.label, 86));
}

export function getCourseLivePresenterPhase5Moments(course: Course): Phase5LiveMoment[] {
  const id = safeId(course.id);
  const category = categoryPrompt(course);
  const overview = findModule(course, [`overhaul1-cycle-${id}-overview`], module => /How this course works/i.test(module.title));
  const process1 = findModule(course, [`overhaul2-process-${id}-1`], module => module.id.startsWith("overhaul2-process-") && module.id.endsWith("-1"));
  const misconception = findModule(course, [`overhaul3-workshop-${id}-misconception`], module => module.id.startsWith("overhaul3-workshop-") && /misconception/i.test(module.id));
  const case1Decision = findModule(course, [`overhaul4-case-${id}-1-decision`]);
  const case1Evidence = findModule(course, [`overhaul4-case-${id}-1-evidence`]);
  const case2Decision = findModule(course, [`overhaul4-case-${id}-2-decision`]);
  const case2Transfer = findModule(course, [`overhaul4-case-${id}-2-transfer`]);
  const implementation = findModule(course, [`overhaul1-cycle-${id}-4-activity`], module => /implementation product/i.test(module.title));

  const workshopPack = misconception ? getWorkshopActivityPhase3Pack(course, misconception) : null;
  const case1DecisionPack = case1Decision ? getProgressiveCasePhase4ModulePack(course, case1Decision) : null;
  const case1EvidencePack = case1Evidence ? getProgressiveCasePhase4ModulePack(course, case1Evidence) : null;
  const case2DecisionPack = case2Decision ? getProgressiveCasePhase4ModulePack(course, case2Decision) : null;

  const moments: (Phase5LiveMoment | null)[] = [
    overview ? {
      id: `live5-${id}-confidence-pre`, moduleId: overview.id, kind: "confidence", title: "Starting confidence pulse",
      prompt: `How confident are you that you could apply the central ideas from ${course.title} appropriately in your own context right now?`,
      options: ["1 · Not yet confident", "2", "3 · Some confidence", "4", "5 · Ready to apply"], responseMode: "anonymous", confidencePhase: "pre", durationMinutes: 1,
      facilitatorPrompt: "Do not treat this as a staff-performance measure. Use the spread only to decide how much explanation and rehearsal the room may need.",
      purpose: "Diagnose starting confidence before the main learning begins.",
    } : null,
    process1 ? {
      id: `live5-${id}-word-cloud`, moduleId: process1.id, kind: "word_cloud", title: "Principle word cloud",
      prompt: category.cloud, responseMode: "anonymous", durationMinutes: 2,
      facilitatorPrompt: "Invite short phrases, then group similar responses and ask what important idea is missing rather than simply reading the most common word.",
      purpose: "Make the room's interpretation visible after the first substantial reading.",
    } : null,
    misconception && workshopPack ? {
      id: `live5-${id}-misconception-poll`, moduleId: misconception.id, kind: "poll", title: "Misconception poll",
      prompt: "Which statement would be the most professionally tempting mistake to make in your setting?",
      options: strongestLabels(workshopPack.options).slice(0, 4), responseMode: "anonymous", durationMinutes: 2,
      facilitatorPrompt: "Reveal the distribution only after everybody has committed. Discuss why an option is tempting before returning to the principle underneath.",
      purpose: "Surface plausible misconceptions without turning the activity into a memory test.",
    } : null,
    case1Decision && case1DecisionPack ? {
      id: `live5-${id}-case1-discuss`, moduleId: case1Decision.id, kind: "discussion", title: "Table decision",
      prompt: `${case1DecisionPack.firstDecisionPrompt} Discuss for three minutes, agree one response and submit the reasoning that persuaded the table.`,
      responseMode: "anonymous", durationMinutes: 3,
      facilitatorPrompt: "Ask tables to name the evidence they used and one assumption they deliberately avoided. Sample contrasting reasoning before revealing the model feedback.",
      purpose: "Turn the first progressive case into collaborative professional reasoning.",
    } : null,
    case1Evidence && case1EvidencePack ? {
      id: `live5-${id}-case1-poll`, moduleId: case1Evidence.id, kind: "poll", title: "New-evidence decision poll",
      prompt: case1EvidencePack.evidencePrompt,
      options: strongestLabels(case1EvidencePack.evidenceOptions), responseMode: "anonymous", durationMinutes: 2,
      facilitatorPrompt: "Reveal results after voting, then ask what new evidence caused anyone to change their original view.",
      purpose: "Test whether staff update professional judgement when the evidence changes.",
    } : null,
    case2Decision && case2DecisionPack ? {
      id: `live5-${id}-case2-discuss`, moduleId: case2Decision.id, kind: "discussion", title: "Implementation table challenge",
      prompt: `${case2DecisionPack.firstDecisionPrompt} Agree the strongest response for a team or school context and submit one implementation reason.`,
      responseMode: "anonymous", durationMinutes: 4,
      facilitatorPrompt: "Push beyond the visible technique: ask what condition, support, clarity or follow-up would make the response sustainable.",
      purpose: "Move the room from individual practice into implementation thinking.",
    } : null,
    case2Transfer ? {
      id: `live5-${id}-confidence-post`, moduleId: case2Transfer.id, kind: "confidence", title: "Application confidence pulse",
      prompt: `After the cases and rehearsal, how confident are you that you could make a context-sensitive decision about ${course.title} and explain your reasoning?`,
      options: ["1 · Not yet confident", "2", "3 · Some confidence", "4", "5 · Ready to apply"], responseMode: "anonymous", confidencePhase: "post", durationMinutes: 1,
      facilitatorPrompt: "Compare the room pattern with the starting pulse. Treat movement as a prompt for discussion, not proof of competence or course impact.",
      purpose: "Check perceived readiness after rehearsal without converting confidence into a staff score.",
    } : null,
    implementation ? {
      id: `live5-${id}-questions`, moduleId: implementation.id, kind: "questions", title: "Anonymous implementation questions",
      prompt: category.question, responseMode: "anonymous", durationMinutes: 3,
      facilitatorPrompt: "Address questions that unblock safe implementation. Park issues that require policy, specialist or leadership follow-up rather than improvising an answer.",
      purpose: "Capture unresolved barriers before staff commit to an implementation product.",
    } : null,
  ];

  return moments.filter((item): item is Phase5LiveMoment => Boolean(item));
}

export function getLivePresenterPhase5MomentForModule(course: Course, module: Module | undefined | null) {
  if (!module) return null;
  return getCourseLivePresenterPhase5Moments(course).find(moment => moment.moduleId === module.id) || null;
}

export function getNextLivePresenterPhase5Moment(course: Course, module: Module | undefined | null) {
  const moments = getCourseLivePresenterPhase5Moments(course);
  if (!moments.length) return null;
  const currentIndex = module ? course.modules.findIndex(item => item.id === module.id) : -1;
  return moments.find(moment => course.modules.findIndex(item => item.id === moment.moduleId) > currentIndex) || moments[0];
}

export function phase5LiveMomentActivityType(moment: Phase5LiveMoment) {
  if (moment.kind === "confidence") return "rating";
  if (moment.kind === "discussion") return "reflection";
  return moment.kind;
}

export function auditLivePresenterPhase5(course: Course) {
  const moments = getCourseLivePresenterPhase5Moments(course);
  const kinds = new Set(moments.map(moment => moment.kind));
  const confidence = moments.filter(moment => moment.kind === "confidence");
  const polls = moments.filter(moment => moment.kind === "poll");
  const discussions = moments.filter(moment => moment.kind === "discussion");
  const moduleIndexes = moments.map(moment => course.modules.findIndex(module => module.id === moment.moduleId));
  const distributed = moduleIndexes.length === moments.length && moduleIndexes.every(index => index >= 0) && moduleIndexes.every((index, i) => i === 0 || index > moduleIndexes[i - 1]);
  const optionReady = moments.filter(moment => moment.kind === "poll" || moment.kind === "confidence").every(moment => (moment.options?.length || 0) >= 3);
  return {
    courseId: course.id,
    title: course.title,
    moments: moments.length,
    kinds: kinds.size,
    confidenceMoments: confidence.length,
    polls: polls.length,
    discussions: discussions.length,
    wordClouds: moments.filter(moment => moment.kind === "word_cloud").length,
    questionMoments: moments.filter(moment => moment.kind === "questions").length,
    distributed,
    optionReady,
    ready: moments.length >= 8 && kinds.size === PHASE5_LIVE_MOMENT_KINDS.length && confidence.length >= 2 && polls.length >= 2 && discussions.length >= 2 && distributed && optionReady,
  };
}

export function validateLivePresenterPhase5(course: Course) {
  const audit = auditLivePresenterPhase5(course);
  if (!audit.ready) throw new Error(`CPD course ${course.id} failed Phase 5 live presenter integration`);
}
