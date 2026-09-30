import type { Course, Module } from "./data";

const PREFIX = "overhaul3-workshop-";

export const PRESENTATION_OVERHAUL_PHASE3_VERSION = "2026.4";
export const PHASE3_WORKSHOP_KINDS = ["misconception", "match", "sequence", "compare", "sort", "evidence", "rank", "branch"] as const;
export type Phase3WorkshopKind = (typeof PHASE3_WORKSHOP_KINDS)[number];

type ActivityModule = Extract<Module, { type: "activity" }>;

export type Phase3WorkshopOption = {
  id: string;
  label: string;
  detail?: string;
  group?: string;
  target?: string;
  order?: number;
  correct?: boolean;
  feedback?: string;
};

export type Phase3BranchStage = {
  prompt: string;
  options: { id: string; label: string; strongest: boolean; feedback: string }[];
};

export type Phase3WorkshopPack = {
  moduleId: string;
  kind: Phase3WorkshopKind;
  title: string;
  strapline: string;
  instruction: string;
  groups?: { id: string; label: string; description: string }[];
  targets?: { id: string; label: string }[];
  options?: Phase3WorkshopOption[];
  compare?: { a: string; b: string; stronger: "a" | "b"; explanation: string };
  branch?: Phase3BranchStage[];
  successText: string;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function short(value: string, limit = 135) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trim()}…`;
}

function objective(course: Course, index: number) {
  return course.objectives[index] || course.objectives[0] || course.summary;
}

function context(course: Course) {
  if (course.category === "Safeguarding") return {
    scene: "A member of staff notices a concerning change and receives partial information from a pupil.",
    goodAction: "Listen, record facts and use the school's current safeguarding route promptly.",
    weakAction: "Investigate independently until there is enough evidence to be certain.",
    evidence: "A factual record of what was observed or said, plus confirmation that the agreed safeguarding route was followed.",
    assumption: "The pupil seems calm, so the concern is probably not significant.",
    principle: "recognise, record and report without investigating",
  };
  if (course.category === "SEND") return {
    scene: "A pupil is struggling to begin an ambitious task even though parts of the underlying idea are secure.",
    goodAction: "Identify the barrier, preserve the learning goal and add the smallest useful scaffold before reviewing independence.",
    weakAction: "Replace the task with a permanently easier objective because of the pupil's label.",
    evidence: "The pupil starts the original learning task with less avoidable support and can explain more of the thinking independently.",
    assumption: "A strategy that helped one pupil with the same label will automatically help this pupil.",
    principle: "respond to the barrier, not the label",
  };
  if (course.category === "Leadership") return {
    scene: "A department improvement routine is being implemented inconsistently and staff describe different expectations.",
    goodAction: "Re-establish the intended practice, identify barriers and provide focused support before increasing monitoring.",
    weakAction: "Publish individual rankings so staff feel more pressure to comply.",
    evidence: "Staff can describe the agreed routine consistently and implementation evidence shows fewer avoidable variations.",
    assumption: "Inconsistent implementation proves that individual staff are unwilling to improve.",
    principle: "clarify, diagnose and support before judging",
  };
  if (course.category === "Wellbeing") return {
    scene: "Staff report that a recurring process is creating avoidable workload and duplication across teams.",
    goodAction: "Map the workflow, remove low-value duplication and check whether workload has genuinely shifted rather than disappeared.",
    weakAction: "Add a resilience session without changing the workload-generating process.",
    evidence: "The repeated task takes less time or occurs less often without reducing the quality of the intended outcome.",
    assumption: "People who cope quietly are not affected by the workload problem.",
    principle: "address system conditions as well as individual coping",
  };
  if (course.category === "Digital Teaching") return {
    scene: "A team wants to introduce a digital or AI-supported routine because it appears faster and more engaging.",
    goodAction: "Define the educational problem, protect sensitive data, test accessibility and verify whether the tool improves the intended outcome.",
    weakAction: "Adopt the tool because colleagues report that pupils enjoy using it.",
    evidence: "The intended learning or workload outcome improves while accuracy, privacy and accessibility remain acceptable.",
    assumption: "A faster digital process is automatically a better professional process.",
    principle: "start with purpose and retain human oversight",
  };
  return {
    scene: "A teacher wants to improve a recurring classroom problem and is deciding which part of practice to change first.",
    goodAction: "Define the learning problem, choose a small evidence-informed move and check pupil thinking before deciding what to do next.",
    weakAction: "Copy the visible technique from a successful lesson without checking whether it solves the same problem.",
    evidence: "Whole-class responses, work or explanation show a clearer picture of what pupils understand and where the next teaching decision should focus.",
    assumption: "If pupils look busy and engaged, the strategy must be improving learning.",
    principle: "connect the technique to the learning problem and evidence",
  };
}

function pack(course: Course, kind: Phase3WorkshopKind): Phase3WorkshopPack {
  const c = context(course);
  const id = `${PREFIX}${safeId(course.id)}-${kind}`;
  const goalA = short(objective(course, 0));
  const goalB = short(objective(course, 1));
  const goalC = short(objective(course, 2));

  if (kind === "misconception") return {
    moduleId: id,
    kind,
    title: "Misconception challenge · spot the seductive errors",
    strapline: "Some statements sound professionally plausible while breaking the principle underneath.",
    instruction: "Select every statement that represents a misconception, then check your reasoning.",
    options: [
      { id: "m1", label: `If staff can name the technique from ${course.title}, implementation is secure.`, correct: true, feedback: "Recognition is weaker than being able to explain, adapt and enact the principle." },
      { id: "m2", label: `A useful decision should remain connected to the underlying principle: ${c.principle}.`, correct: false, feedback: "This keeps the reasoning visible rather than treating the technique as the goal." },
      { id: "m3", label: c.assumption, correct: true, feedback: "This is an assumption presented as evidence; it needs testing rather than acceptance." },
      { id: "m4", label: `Professional judgement should consider context, evidence and the intended outcome before adapting the approach.`, correct: false, feedback: "This is a sound boundary for applying the course learning." },
    ],
    successText: "You separated plausible-sounding misconceptions from the principles that should guide practice.",
  };

  if (kind === "match") return {
    moduleId: id,
    kind,
    title: "Match the professional reasoning",
    strapline: "Connect each part of the learning to the job it performs in professional decision-making.",
    instruction: "Match each concept to the description that best represents it.",
    targets: [
      { id: "purpose", label: "Purpose / problem" },
      { id: "principle", label: "Underlying principle" },
      { id: "evidence", label: "Evidence" },
      { id: "adapt", label: "Adaptation" },
    ],
    options: [
      { id: "m-purpose", label: short(course.summary, 110), target: "purpose" },
      { id: "m-principle", label: `The approach should preserve this reasoning: ${c.principle}.`, target: "principle" },
      { id: "m-evidence", label: c.evidence, target: "evidence" },
      { id: "m-adapt", label: `Change wording, timing, support or examples while protecting: ${goalA}.`, target: "adapt" },
    ],
    successText: "You matched the technique to its purpose, principle, evidence and adaptation logic.",
  };

  if (kind === "sequence") return {
    moduleId: id,
    kind,
    title: "Sequence the professional response",
    strapline: "Good practice depends on the order of thinking, not just the ingredients.",
    instruction: "Move the steps into the strongest sequence, then check the order.",
    options: [
      { id: "s1", label: "Define the professional or learning problem precisely.", order: 1 },
      { id: "s2", label: `Identify the principle from ${course.title} that is relevant.`, order: 2 },
      { id: "s3", label: "Choose the smallest useful action that fits the context.", order: 3 },
      { id: "s4", label: "Rehearse or plan exactly how the action will be enacted.", order: 4 },
      { id: "s5", label: "Collect evidence and decide whether to keep, adapt or stop.", order: 5 },
    ],
    successText: "You built a reasoning sequence that moves from diagnosis to action and review.",
  };

  if (kind === "compare") return {
    moduleId: id,
    kind,
    title: "Before / after critique",
    strapline: "Compare two plausible approaches and identify what makes one professionally stronger.",
    instruction: "Choose the stronger response. The aim is to identify the reasoning difference, not simply the nicer wording.",
    compare: {
      a: c.weakAction,
      b: c.goodAction,
      stronger: "b",
      explanation: `Response B is stronger because it is more closely connected to ${c.principle}, keeps the intended outcome visible and creates a route to checking evidence rather than relying on assumption.`,
    },
    successText: "You identified the stronger professional response and the reasoning that makes it more transferable.",
  };

  if (kind === "sort") return {
    moduleId: id,
    kind,
    title: "Evidence sort · observation or assumption?",
    strapline: "Professional decisions become weaker when inference is treated as if it were directly observed evidence.",
    instruction: "Sort each statement into Evidence or Assumption.",
    groups: [
      { id: "evidence", label: "Evidence", description: "Observable, recorded or directly checkable information." },
      { id: "assumption", label: "Assumption", description: "An interpretation that still needs testing." },
    ],
    options: [
      { id: "e1", label: c.evidence, group: "evidence" },
      { id: "e2", label: c.assumption, group: "assumption" },
      { id: "e3", label: `The course objective is “${goalB}”, so any evidence should be close to that intended outcome.`, group: "evidence" },
      { id: "e4", label: "The strategy looked smooth, therefore it must have produced the intended impact.", group: "assumption" },
      { id: "e5", label: "A colleague reports one successful example, so the approach will work in every context.", group: "assumption" },
      { id: "e6", label: "A planned review compares what happened with the success criteria agreed before implementation.", group: "evidence" },
    ],
    successText: "You separated checkable evidence from interpretation and assumption.",
  };

  if (kind === "evidence") return {
    moduleId: id,
    kind,
    title: "Evidence lens · choose what would really test the claim",
    strapline: `The evidence should match what you are claiming about ${course.title}.`,
    instruction: `Which evidence would give the strongest test of this objective: “${goalC}”?`,
    options: [
      { id: "ev1", label: "Staff say the session was interesting and well presented.", correct: false, feedback: "Useful experience data, but too far from the stated professional outcome." },
      { id: "ev2", label: c.evidence, correct: true, feedback: "This is closer to the intended change and can inform the next professional decision." },
      { id: "ev3", label: "The resource was downloaded by many people.", correct: false, feedback: "Reach or activity is not the same as implementation or impact." },
      { id: "ev4", label: "One memorable anecdote from a successful lesson or meeting.", correct: false, feedback: "Anecdotes can prompt inquiry but should not carry the whole impact claim." },
    ],
    successText: "You selected evidence that is close enough to the intended outcome to support a useful review.",
  };

  if (kind === "rank") return {
    moduleId: id,
    kind,
    title: "Rank the responses · strongest to weakest",
    strapline: "Several responses may be possible, but they are not equally well aligned to the evidence and principle.",
    instruction: "Put the responses in order from strongest professional response to weakest.",
    options: [
      { id: "r1", label: c.goodAction, order: 1 },
      { id: "r2", label: `Clarify what “${goalA}” would look like in this context, then make a small testable adjustment.`, order: 2 },
      { id: "r3", label: "Repeat the current approach for longer without changing the evidence being collected.", order: 3 },
      { id: "r4", label: c.weakAction, order: 4 },
    ],
    successText: "You ranked the responses by alignment to the principle, proportionality and usefulness of the evidence loop.",
  };

  return {
    moduleId: id,
    kind,
    title: "Branching case · respond as the situation develops",
    strapline: c.scene,
    instruction: "Work through three decision points. New information appears after each choice, so keep updating your professional response.",
    branch: [
      {
        prompt: "Decision 1 · What should you do first?",
        options: [
          { id: "b1a", label: c.goodAction, strongest: true, feedback: "This starts with a proportionate response grounded in the course principle." },
          { id: "b1b", label: "Act immediately on the first interpretation without checking what problem is actually present.", strongest: false, feedback: "This risks solving an assumed problem rather than the one supported by evidence." },
          { id: "b1c", label: "Do nothing until the situation becomes more obvious.", strongest: false, feedback: "Waiting for certainty can lose the opportunity for a small, useful professional response." },
        ],
      },
      {
        prompt: "Decision 2 · New evidence is mixed. What next?",
        options: [
          { id: "b2a", label: "Treat the first positive sign as proof and roll the approach out unchanged everywhere.", strongest: false, feedback: "Early positive evidence is useful, but it does not remove context or uncertainty." },
          { id: "b2b", label: "Compare the evidence with the intended outcome, identify the barrier and adapt one feature before checking again.", strongest: true, feedback: "This keeps the review cycle connected to evidence and makes the next test informative." },
          { id: "b2c", label: "Abandon the whole principle because implementation was not perfect immediately.", strongest: false, feedback: "A weak first implementation does not necessarily invalidate the underlying principle." },
        ],
      },
      {
        prompt: "Decision 3 · The approach is now workable. How should you sustain it?",
        options: [
          { id: "b3a", label: "Define the routine, keep evidence proportionate and schedule a review point to keep, adapt, fade or stop.", strongest: true, feedback: "This turns a successful trial into sustainable professional practice without assuming it should continue forever." },
          { id: "b3b", label: "Add more monitoring and paperwork so the change looks firmly embedded.", strongest: false, feedback: "Additional process is only useful if it helps implementation or evidence rather than creating compliance theatre." },
          { id: "b3c", label: "Stop collecting any evidence once staff feel confident using it.", strongest: false, feedback: "Confidence matters, but a light review still helps detect drift, barriers or changed conditions." },
        ],
      },
    ],
    successText: "You navigated a changing professional situation by revisiting evidence and adapting the response rather than following a fixed script.",
  };
}

function moduleFor(course: Course, kind: Phase3WorkshopKind): ActivityModule {
  const p = pack(course, kind);
  return {
    id: p.moduleId,
    type: "activity",
    title: p.title,
    prompt: p.strapline,
    instructions: [p.instruction, "Complete the interactive task above. Your successful completion will be written into the activity response automatically."],
    placeholder: "Complete the interactive workshop above to unlock this activity.",
    minimumCharacters: 12,
  };
}

function insertAfter(modules: Module[], id: string, additions: Module[]) {
  const index = modules.findIndex(module => module.id === id);
  modules.splice(index >= 0 ? index + 1 : Math.min(5, modules.length), 0, ...additions);
}

function insertBeforeFirst(modules: Module[], predicate: (module: Module) => boolean, additions: Module[]) {
  const index = modules.findIndex(predicate);
  modules.splice(index >= 0 ? index : modules.length, 0, ...additions);
}

export function applyWorkshopActivityPhase3(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));

  insertAfter(modules, `overhaul2-process-${id}-1`, [moduleFor(course, "misconception")]);
  insertAfter(modules, `overhaul1-cycle-${id}-1-activity`, [moduleFor(course, "match")]);
  insertAfter(modules, `overhaul2-process-${id}-2`, [moduleFor(course, "sequence")]);
  insertAfter(modules, `overhaul1-cycle-${id}-2-activity`, [moduleFor(course, "compare")]);
  insertAfter(modules, `overhaul2-process-${id}-3`, [moduleFor(course, "sort"), moduleFor(course, "evidence")]);
  insertBeforeFirst(modules, module => module.id === `overhaul1-cycle-${id}-4`, [moduleFor(course, "rank"), moduleFor(course, "branch")]);

  return { ...course, duration: course.duration + 24, modules };
}

export function isWorkshopActivityPhase3Module(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith(PREFIX));
}

export function getWorkshopActivityPhase3Pack(course: Course, module: Module | undefined | null) {
  if (!module || !isWorkshopActivityPhase3Module(module)) return null;
  const kind = PHASE3_WORKSHOP_KINDS.find(item => module.id.endsWith(`-${item}`));
  return kind ? pack(course, kind) : null;
}

export function auditWorkshopActivityPhase3(course: Course) {
  const modules = course.modules.filter(module => isWorkshopActivityPhase3Module(module));
  const kinds = modules.map(module => PHASE3_WORKSHOP_KINDS.find(kind => module.id.endsWith(`-${kind}`))).filter(Boolean) as Phase3WorkshopKind[];
  const packs = modules.map(module => getWorkshopActivityPhase3Pack(course, module)).filter(Boolean) as Phase3WorkshopPack[];
  const choicePoints = packs.reduce((sum, item) => sum + (item.options?.length || 0) + (item.branch?.reduce((stageSum, stage) => stageSum + stage.options.length, 0) || 0) + (item.compare ? 2 : 0), 0);
  const early = modules.filter(module => course.modules.indexOf(module) < Math.floor(course.modules.length / 2)).length;
  const late = modules.length - early;
  return {
    courseId: course.id,
    title: course.title,
    workshopActivities: modules.length,
    uniqueKinds: new Set(kinds).size,
    choicePoints,
    earlyActivities: early,
    lateActivities: late,
    hasBranchingCase: kinds.includes("branch"),
    hasEvidenceSort: kinds.includes("sort") && kinds.includes("evidence"),
    hasCompareAndRank: kinds.includes("compare") && kinds.includes("rank"),
  };
}

export function validateWorkshopActivityPhase3(course: Course) {
  const audit = auditWorkshopActivityPhase3(course);
  if (audit.workshopActivities !== PHASE3_WORKSHOP_KINDS.length) throw new Error(`CPD course ${course.id} needs all ${PHASE3_WORKSHOP_KINDS.length} Phase 3 workshop activities`);
  if (audit.uniqueKinds !== PHASE3_WORKSHOP_KINDS.length) throw new Error(`CPD course ${course.id} needs all eight distinct Phase 3 interaction types`);
  if (audit.choicePoints < 30) throw new Error(`CPD course ${course.id} needs at least 30 meaningful Phase 3 choice points`);
  if (!audit.hasBranchingCase || !audit.hasEvidenceSort || !audit.hasCompareAndRank) throw new Error(`CPD course ${course.id} is missing a required Phase 3 workshop interaction family`);
  if (audit.earlyActivities < 3 || audit.lateActivities < 3) throw new Error(`CPD course ${course.id} must distribute Phase 3 workshop activities across the course rather than clustering them in one section`);
}
