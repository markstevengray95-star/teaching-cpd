import type { Course, Module } from "./data";

export const PHASE7_SESSION_ROUTES = [15, 30, 60, 90] as const;
export type Phase7RouteMinutes = (typeof PHASE7_SESSION_ROUTES)[number];

export type Phase7SlideGuide = {
  moduleId: string;
  title: string;
  purpose: string;
  facilitatorMove: string;
  discussionQuestion: string;
  misconception: string;
  accessibilityMove: string;
  extension: string;
  suggestedMinutes: number;
  routeCore: boolean;
};

export type Phase7FacilitatorPlan = {
  courseId: string;
  courseTitle: string;
  routeMinutes: Phase7RouteMinutes;
  selectedModuleIds: string[];
  estimatedMinutes: number;
  slides: Phase7SlideGuide[];
  independentFollowUpCount: number;
};

const ROUTE_SLIDE_TARGET: Record<Phase7RouteMinutes, number> = { 15: 6, 30: 10, 60: 18, 90: 28 };

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function firstSentence(value: string) {
  const text = clean(value);
  return text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || text;
}

function moduleText(module: Module) {
  if (module.type === "content") return module.body;
  if (module.type === "quiz") return module.question;
  if (module.type === "scenario") return module.prompt;
  if (module.type === "reflection") return module.prompt;
  if (module.type === "visual") return module.caption || module.items[0]?.text || module.title;
  if (module.type === "checklist") return module.prompt;
  return module.prompt;
}

function isAssessment(module: Module) {
  return module.id.startsWith("phase5-assess-");
}

function isRouteAnchor(module: Module) {
  return /presentation-.*-map|phase3-present-.*-(hook|section-understand|section-practise|section-transfer|worked-model|recap)|implementation-commitment/i.test(module.id);
}

function isTransferModule(module: Module) {
  return /transfer|recap|implementation|reflect/i.test(`${module.id} ${module.title}`) || module.type === "reflection";
}

function livePriority(module: Module, index: number, total: number) {
  let score = 0;
  if (index === 0) score += 12;
  if (index === total - 1) score += 5;
  if (isRouteAnchor(module)) score += 11;
  if (module.id.startsWith("phase4-practice-")) score += 9;
  if (module.type === "scenario") score += 8;
  if (module.type === "activity") score += 8;
  if (module.type === "quiz") score += 7;
  if (module.type === "visual") score += 5;
  if (module.type === "reflection" || module.type === "checklist") score += 5;
  if (module.type === "content") score += 3;
  if (/misconception|worked|inclusive|evidence|implementation|recap|core/i.test(`${module.id} ${module.title}`)) score += 3;
  return score;
}

function weight(module: Module) {
  if (module.type === "activity") return 2.6;
  if (module.type === "scenario") return 2.1;
  if (module.type === "reflection") return 1.8;
  if (module.type === "checklist") return 1.7;
  if (module.type === "quiz") return 1.4;
  if (module.type === "content") return 1.25;
  return 1;
}

function categoryLens(course: Course) {
  if (course.category === "Safeguarding") return {
    discussion: "Which part of current school policy or DSL guidance must shape this decision?",
    misconception: "Avoid treating training examples as a substitute for the school's current safeguarding procedure.",
    access: "Use calm, non-graphic examples and allow staff to step out or seek safeguarding support where appropriate.",
  };
  if (course.category === "SEND") return {
    discussion: "What is the actual pupil-task barrier here, and what would preserve ambition while improving access?",
    misconception: "Avoid choosing support from a diagnostic label alone; start with the individual barrier and context.",
    access: "Model clear language, visible steps and more than one way to participate in the discussion.",
  };
  if (course.category === "Leadership") return {
    discussion: "What implementation condition needs attention first: clarity, capability, capacity, support or follow-up?",
    misconception: "Avoid assuming that more monitoring fixes unclear expectations or weak implementation conditions.",
    access: "Give thinking time before public response and use paired rehearsal before whole-group discussion.",
  };
  if (course.category === "Wellbeing") return {
    discussion: "Which part of this issue is a system or workload problem rather than an individual resilience problem?",
    misconception: "Avoid framing structural workload or role-clarity problems as personal coping deficits.",
    access: "Do not require personal disclosure; staff can discuss a hypothetical or team-level example instead.",
  };
  if (course.category === "Digital Teaching") return {
    discussion: "What learning problem does the technology solve, and what evidence would justify continuing to use it?",
    misconception: "Avoid treating novelty, speed or engagement alone as evidence of better learning.",
    access: "Offer a non-device route where possible and narrate essential interface actions rather than relying on visual cues alone.",
  };
  return {
    discussion: "What problem is this intended to solve, and what evidence would tell us whether it helped?",
    misconception: "Avoid copying the visible technique without diagnosing the learning problem and checking the result.",
    access: "Use think time, paired rehearsal and visible instructions so participation does not depend on rapid public response.",
  };
}

function guideFor(course: Course, module: Module, suggestedMinutes: number, routeCore: boolean): Phase7SlideGuide {
  const lens = categoryLens(course);
  const text = firstSentence(moduleText(module));
  let move = "Explain the core idea briefly, then connect it to a realistic school context.";
  let question = lens.discussion;
  let extension = `Ask staff to identify one context where “${module.title}” would need adapting rather than copying directly.`;

  if (module.type === "visual") {
    move = "Use the visual as the explanation. Ask staff to predict or interpret before you reveal your own summary.";
    question = "What do you notice first in this model, and which part would matter most in your context?";
    extension = "Ask pairs to redraw the model for a different subject, phase, team or pupil context.";
  } else if (module.type === "quiz") {
    move = "Commit everyone to an answer before discussing it. Probe the reasoning, not just the option chosen.";
    question = "What makes the strongest option stronger than the most tempting alternative?";
    extension = "Ask staff to write a new distractor that represents a plausible professional misconception.";
  } else if (module.type === "scenario") {
    move = "Give silent decision time first, then compare choices before revealing or discussing feedback.";
    question = "Which evidence in the scenario should drive the decision, and what assumption still needs checking?";
    extension = "Change one feature of the scenario and ask whether the preferred response should change.";
  } else if (module.type === "activity") {
    move = "Protect rehearsal time. Circulate for reasoning and evidence rather than turning the task into another explanation.";
    question = "What would a strong attempt look or sound like, and how would you know it was improving?";
    extension = "Repeat the task with a harder constraint, reduced scaffold or different audience.";
  } else if (module.type === "reflection") {
    move = "Allow quiet writing before paired discussion. Ask for one concrete change rather than a broad intention.";
    question = "What will you do differently, where will you try it, and what evidence will you review?";
    extension = "Ask partners to challenge whether the planned evidence is close enough to the intended outcome.";
  } else if (module.type === "checklist") {
    move = "Turn the checklist into a decision tool. Ask staff which item is essential, contextual or unnecessary in their setting.";
    question = "Which item would make the biggest difference to successful implementation this week?";
    extension = "Ask staff to remove one low-value step and justify why the plan remains safe and effective.";
  } else if (module.type === "content") {
    move = "Keep explanation concise. Pause after the central principle and ask staff to connect it to prior experience or evidence.";
    question = lens.discussion;
    extension = "Ask staff for a non-example: what might look similar on the surface but miss the principle?";
  }

  return {
    moduleId: module.id,
    title: module.title,
    purpose: text || `Build understanding of ${module.title}.`,
    facilitatorMove: move,
    discussionQuestion: question,
    misconception: lens.misconception,
    accessibilityMove: lens.access,
    extension,
    suggestedMinutes,
    routeCore,
  };
}

function chooseModules(course: Course, routeMinutes: Phase7RouteMinutes) {
  const live = course.modules.map((module, index) => ({ module, index })).filter(item => !isAssessment(item.module));
  if (!live.length) return [] as Module[];
  const target = Math.min(ROUTE_SLIDE_TARGET[routeMinutes], live.length);
  const chosen = new Set<number>();
  const add = (item: { module: Module; index: number } | undefined) => {
    if (item && chosen.size < target) chosen.add(item.index);
  };

  add(live[0]);
  add(live.find(item => /phase3-present-.*-hook/i.test(item.module.id)));
  add(live.find(item => item.module.type === "content" && !isRouteAnchor(item.module)) || live.find(item => item.module.type === "visual" && !isRouteAnchor(item.module)));
  add(live.find(item => item.module.type === "scenario" || item.module.type === "quiz"));
  add(live.find(item => item.module.type === "activity" || item.module.id.startsWith("phase4-practice-")));
  add([...live].reverse().find(item => isTransferModule(item.module)) || live[live.length - 1]);

  const anchors = live.filter(item => isRouteAnchor(item.module));
  for (const item of anchors) {
    if (chosen.size >= target) break;
    chosen.add(item.index);
  }

  const ranked = live
    .filter(item => !chosen.has(item.index))
    .map(item => ({ ...item, score: livePriority(item.module, item.index, course.modules.length) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  for (const item of ranked) {
    if (chosen.size >= target) break;
    chosen.add(item.index);
  }

  return [...chosen].sort((a, b) => a - b).map(index => course.modules[index]).filter(Boolean);
}

function allocateMinutes(modules: Module[], routeMinutes: Phase7RouteMinutes) {
  if (!modules.length) return [] as number[];
  const weights = modules.map(weight);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const raw = weights.map(value => Math.max(1, Math.floor((value / totalWeight) * routeMinutes)));
  let remaining = routeMinutes - raw.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (remaining > 0) {
    raw[cursor % raw.length] += 1;
    remaining -= 1;
    cursor += 1;
  }
  while (remaining < 0) {
    const index = raw.findIndex(value => value > 1);
    if (index < 0) break;
    raw[index] -= 1;
    remaining += 1;
  }
  return raw;
}

export function getPhase7FacilitatorPlan(course: Course, routeMinutes: Phase7RouteMinutes = 60): Phase7FacilitatorPlan {
  const selected = chooseModules(course, routeMinutes);
  const timings = allocateMinutes(selected, routeMinutes);
  return {
    courseId: course.id,
    courseTitle: course.title,
    routeMinutes,
    selectedModuleIds: selected.map(module => module.id),
    estimatedMinutes: timings.reduce((sum, value) => sum + value, 0),
    slides: selected.map((module, index) => guideFor(course, module, timings[index] || 1, true)),
    independentFollowUpCount: course.modules.filter(isAssessment).length,
  };
}

export function getPhase7SlideGuide(course: Course, module: Module, routeMinutes: Phase7RouteMinutes = 60) {
  const plan = getPhase7FacilitatorPlan(course, routeMinutes);
  const route = plan.slides.find(slide => slide.moduleId === module.id);
  if (route) return route;
  return guideFor(course, module, Math.max(1, Math.round(routeMinutes / Math.max(8, plan.slides.length))), false);
}

export function auditCourseFacilitatorPhase7(course: Course) {
  const routes = PHASE7_SESSION_ROUTES.map(minutes => getPhase7FacilitatorPlan(course, minutes));
  const interactiveReady = routes.every(route => route.slides.some(slide => {
    const module = course.modules.find(item => item.id === slide.moduleId);
    return module ? ["quiz", "scenario", "activity", "reflection", "checklist"].includes(module.type) : false;
  }));
  const transferReady = routes.every(route => route.slides.some(slide => {
    const module = course.modules.find(item => item.id === slide.moduleId);
    return module ? isTransferModule(module) : false;
  }));
  const substantiveReady = routes.every(route => route.slides.some(slide => {
    const module = course.modules.find(item => item.id === slide.moduleId);
    return module ? ["content", "visual"].includes(module.type) && !isRouteAnchor(module) : false;
  }));
  const routeTimingReady = routes.every(route => route.estimatedMinutes === route.routeMinutes);
  const notesReady = course.modules.length > 0;
  return {
    courseId: course.id,
    title: course.title,
    routes: routes.length,
    routeTimingReady,
    interactiveReady,
    transferReady,
    substantiveReady,
    notesReady,
    printableReady: true,
    routeSlides: Object.fromEntries(routes.map(route => [String(route.routeMinutes), route.slides.length])),
  };
}

export function validateCourseFacilitatorPhase7(course: Course) {
  const audit = auditCourseFacilitatorPhase7(course);
  if (audit.routes !== 4) throw new Error(`CPD course ${course.id} needs all four Phase 7 delivery routes`);
  if (!audit.routeTimingReady) throw new Error(`CPD course ${course.id} has a Phase 7 delivery route with invalid timing`);
  if (!audit.interactiveReady) throw new Error(`CPD course ${course.id} needs interaction in every Phase 7 delivery route`);
  if (!audit.transferReady) throw new Error(`CPD course ${course.id} needs transfer or implementation in every Phase 7 route`);
  if (!audit.substantiveReady) throw new Error(`CPD course ${course.id} needs substantive learning in every Phase 7 route`);
  if (!audit.notesReady) throw new Error(`CPD course ${course.id} needs Phase 7 presenter guidance`);
}
