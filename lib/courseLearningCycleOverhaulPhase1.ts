import type { Course, Module } from "./data";

const PREFIX = "overhaul1-cycle-";
const CHECKPOINT_PREFIX = "overhaul1-checkpoint-";

type VisualModule = Extract<Module, { type: "visual" }>;
type ActivityModule = Extract<Module, { type: "activity" }>;

export const PRESENTATION_OVERHAUL_PHASE1_VERSION = "2026.2";

export const PRESENTATION_LEARNING_CYCLE = [
  "Read",
  "Think",
  "Discuss",
  "Practise",
  "Decide",
  "Apply",
  "Reflect",
] as const;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function isActive(module: Module) {
  return ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type);
}

function isPassive(module: Module) {
  return module.type === "content" || module.type === "visual";
}

function cycleOverview(course: Course): VisualModule {
  const id = safeId(course.id);
  return {
    id: `${PREFIX}${id}-overview`,
    type: "visual",
    title: "How this course works: learn actively, not passively",
    layout: "cycle",
    caption: `Every section of ${course.title} now moves from understanding into professional action. Expect to read, think, discuss, practise, decide, apply and reflect rather than simply move through information slides.`,
    items: [
      { heading: "Read", text: "Build enough professional knowledge to understand the idea rather than memorise a technique.", icon: "1" },
      { heading: "Think", text: "Pause to explain, connect or challenge the idea before more information is added.", icon: "2" },
      { heading: "Discuss", text: "Compare interpretations, assumptions and possible responses with another professional perspective.", icon: "3" },
      { heading: "Practise", text: "Rehearse the skill, decision or planning move in a realistic school context.", icon: "4" },
      { heading: "Decide", text: "Use evidence to choose a proportionate professional response and justify it.", icon: "5" },
      { heading: "Apply", text: "Create something usable for your own role, class, team or setting.", icon: "6" },
      { heading: "Reflect", text: "Decide what to try, what evidence to collect and when to review the effect.", icon: "7" },
    ],
  };
}

function cycleAnchor(course: Course, cycle: 1 | 2 | 3 | 4): VisualModule {
  const id = safeId(course.id);
  const configs = {
    1: {
      title: "Learning cycle 1 · Build the professional idea",
      caption: "READ → THINK → DISCUSS",
      layout: "flow" as const,
      items: [
        { heading: "Read for meaning", text: `Identify the principle in ${course.title} that matters most and the problem it is designed to solve.`, icon: "R" },
        { heading: "Think before moving on", text: "Explain the idea in your own words and identify one assumption that still needs testing.", icon: "T" },
        { heading: "Discuss the boundary", text: "Ask when the principle would help, when it might not, and what contextual information would change the decision.", icon: "D" },
      ],
    },
    2: {
      title: "Learning cycle 2 · Turn knowledge into rehearsal",
      caption: "THINK → PRACTISE → FEEDBACK",
      layout: "flow" as const,
      items: [
        { heading: "Make the reasoning visible", text: "Use the worked model to identify why the response fits rather than copying the surface technique.", icon: "1" },
        { heading: "Rehearse", text: "Try the move in a realistic context, including the wording, sequence, scaffold or decision you would actually use.", icon: "2" },
        { heading: "Improve it", text: "Compare your first attempt with the evidence, feedback or non-example and strengthen the next version.", icon: "3" },
      ],
    },
    3: {
      title: "Learning cycle 3 · Make professional decisions",
      caption: "DISCUSS → DECIDE → APPLY",
      layout: "flow" as const,
      items: [
        { heading: "Interrogate the evidence", text: "Separate what is observed from what is assumed before choosing an action.", icon: "1" },
        { heading: "Decide", text: "Choose the smallest useful response and justify why it fits this context better than the alternatives.", icon: "2" },
        { heading: "Apply", text: "Adapt the response to your own role, subject, phase, team or pupil context instead of copying it unchanged.", icon: "3" },
      ],
    },
    4: {
      title: "Learning cycle 4 · Transfer and review",
      caption: "APPLY → REFLECT → REVIEW",
      layout: "timeline" as const,
      items: [
        { heading: "Create", text: "Leave with one usable action, plan, resource, script, routine or decision for your own setting.", icon: "1" },
        { heading: "Evidence", text: "Choose evidence close enough to the intended outcome to tell you whether the change helped.", icon: "2" },
        { heading: "Review", text: "Set a point to keep, adapt, fade, revisit or stop the response according to what the evidence shows.", icon: "3" },
      ],
    },
  }[cycle];
  return { id: `${PREFIX}${id}-${cycle}`, type: "visual", ...configs };
}

function cycleActivity(course: Course, cycle: 1 | 2 | 4): ActivityModule {
  const id = safeId(course.id);
  if (cycle === 1) return {
    id: `${PREFIX}${id}-1-activity`,
    type: "activity",
    title: "Think and discuss: make the principle usable",
    prompt: `Before moving deeper into ${course.title}, turn the first ideas into something you can explain and challenge.`,
    instructions: [
      "Write the central principle in one sentence without using course jargon.",
      "Name the professional problem or barrier this principle is intended to address.",
      "Identify one situation where copying the visible technique without the principle could lead to weak practice.",
      "If completing this with colleagues, compare answers and agree the most important difference between the principle and the technique.",
    ],
    placeholder: "The principle is… It matters because… A weak surface-level version would be…",
    minimumCharacters: 80,
  };
  if (cycle === 2) return {
    id: `${PREFIX}${id}-2-activity`,
    type: "activity",
    title: "Rehearsal: improve the first attempt",
    prompt: `Use one realistic situation from your work to rehearse a response informed by ${course.title}.`,
    instructions: [
      "Choose a real or realistic context where this learning would matter.",
      "Draft the action, wording, sequence, scaffold or professional move you would use first.",
      "Check it against the worked example and course principles.",
      "Revise the response so the second attempt is more precise, proportionate and evidence-informed.",
    ],
    placeholder: "Context… First attempt… What I would improve… Revised response…",
    minimumCharacters: 100,
  };
  return {
    id: `${PREFIX}${id}-4-activity`,
    type: "activity",
    title: "Create your implementation product",
    prompt: `Turn ${course.title} into one usable professional product rather than leaving with a general intention.`,
    instructions: [
      "Choose one output you will actually use: a plan, routine, script, checklist, adaptation, meeting action, question sequence or implementation step.",
      "State exactly where and when you will use it.",
      "Name the evidence you will collect to judge whether it helped.",
      "Set a review point and decide in advance what would make you keep, adapt, fade or stop it.",
    ],
    placeholder: "My usable output… I will use it… Evidence… Review point…",
    minimumCharacters: 120,
  };
}

function activeCheckpoint(course: Course, number: number, previous: Module[]): ActivityModule {
  const recent = previous.filter(module => isPassive(module)).slice(-3);
  const titles = recent.map(module => module.title);
  return {
    id: `${CHECKPOINT_PREFIX}${safeId(course.id)}-${number}`,
    type: "activity",
    title: "Active checkpoint · stop, retrieve and use it",
    prompt: "Do something with the previous learning before another explanation is added.",
    instructions: [
      titles[0] ? `Retrieve the main idea from “${titles[0]}” without reopening the slide.` : "Retrieve the strongest idea from the previous section.",
      titles[1] ? `Connect “${titles[1]}” to a real professional problem you encounter.` : "Connect the learning to a realistic professional problem.",
      titles[2] ? `Give a non-example or limitation for “${titles[2]}”.` : "Identify one limitation or non-example.",
      "Write one question you would ask a colleague to test whether the idea has really been understood.",
    ],
    placeholder: "Main idea… Connection… Limitation/non-example… Question…",
    minimumCharacters: 70,
  };
}

function ensureActiveRhythm(course: Course, modules: Module[]) {
  const result: Module[] = [];
  let passiveRun = 0;
  let checkpoint = 1;
  for (const module of modules) {
    if (isPassive(module)) {
      if (passiveRun >= 3) {
        result.push(activeCheckpoint(course, checkpoint++, result));
        passiveRun = 0;
      }
      result.push(module);
      passiveRun += 1;
    } else {
      result.push(module);
      passiveRun = 0;
    }
  }
  return result;
}

function insertAfter(modules: Module[], predicate: (module: Module) => boolean, additions: Module[]) {
  const index = modules.findIndex(predicate);
  const at = index >= 0 ? index + 1 : Math.min(3, modules.length);
  modules.splice(at, 0, ...additions);
}

function insertBefore(modules: Module[], predicate: (module: Module) => boolean, additions: Module[]) {
  const index = modules.findIndex(predicate);
  const at = index >= 0 ? index : modules.length;
  modules.splice(at, 0, ...additions);
}

export function applyPresentationOverhaulPhase1(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`) && !module.id.startsWith(`${CHECKPOINT_PREFIX}${id}-`));

  const hookIndex = modules.findIndex(module => module.id === `phase3-present-${id}-hook`);
  modules.splice(hookIndex >= 0 ? hookIndex + 1 : Math.min(2, modules.length), 0, cycleOverview(course));

  insertAfter(
    modules,
    module => module.id === `phase3-present-${id}-section-understand`,
    [cycleAnchor(course, 1), cycleActivity(course, 1)],
  );

  insertAfter(
    modules,
    module => module.id === `phase3-present-${id}-worked-model`,
    [cycleAnchor(course, 2), cycleActivity(course, 2)],
  );

  const firstPhase4 = modules.findIndex(module => module.id.startsWith("phase4-practice-"));
  if (firstPhase4 >= 0) modules.splice(firstPhase4, 0, cycleAnchor(course, 3));
  else insertBefore(modules, module => module.id === `phase3-present-${id}-section-transfer`, [cycleAnchor(course, 3)]);

  insertBefore(
    modules,
    module => module.id === `phase3-present-${id}-section-transfer`,
    [cycleAnchor(course, 4), cycleActivity(course, 4)],
  );

  const rhythmic = ensureActiveRhythm(course, modules);
  const added = rhythmic.length - course.modules.length;
  return { ...course, duration: course.duration + Math.max(15, added * 2), modules: rhythmic };
}

function longestPassiveRun(course: Course) {
  let run = 0;
  let longest = 0;
  for (const module of course.modules) {
    run = isPassive(module) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

export function auditPresentationOverhaulPhase1(course: Course) {
  const id = safeId(course.id);
  const cycleModules = course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`));
  const checkpoints = course.modules.filter(module => module.id.startsWith(`${CHECKPOINT_PREFIX}${id}-`));
  const active = course.modules.filter(isActive).length;
  const passive = course.modules.filter(isPassive).length;
  const activeShare = course.modules.length ? Math.round((active / course.modules.length) * 100) : 0;
  return {
    courseId: course.id,
    title: course.title,
    cycleModules: cycleModules.length,
    cycleAnchors: cycleModules.filter(module => /^overhaul1-cycle-.+-[1-4]$/.test(module.id)).length,
    cycleActivities: cycleModules.filter(module => module.type === "activity").length,
    automaticCheckpoints: checkpoints.length,
    longestPassiveRun: longestPassiveRun(course),
    activeSlides: active,
    passiveSlides: passive,
    activeShare,
  };
}

export function validatePresentationOverhaulPhase1(course: Course) {
  const id = safeId(course.id);
  const required = [
    `${PREFIX}${id}-overview`,
    `${PREFIX}${id}-1`,
    `${PREFIX}${id}-1-activity`,
    `${PREFIX}${id}-2`,
    `${PREFIX}${id}-2-activity`,
    `${PREFIX}${id}-3`,
    `${PREFIX}${id}-4`,
    `${PREFIX}${id}-4-activity`,
  ];
  required.forEach(moduleId => {
    if (!course.modules.some(module => module.id === moduleId)) throw new Error(`CPD course ${course.id} is missing presentation-overhaul Phase 1 module ${moduleId}`);
  });

  const audit = auditPresentationOverhaulPhase1(course);
  if (audit.longestPassiveRun > 3) throw new Error(`CPD course ${course.id} has ${audit.longestPassiveRun} passive slides in a row after presentation-overhaul Phase 1`);
  if (audit.cycleAnchors !== 4) throw new Error(`CPD course ${course.id} needs four presentation-overhaul learning cycles`);
  if (audit.cycleActivities < 3) throw new Error(`CPD course ${course.id} needs structured think/rehearse/apply activities in the learning-cycle architecture`);
  if (audit.activeShare < 30) throw new Error(`CPD course ${course.id} is still too passive: only ${audit.activeShare}% active slides`);
}
