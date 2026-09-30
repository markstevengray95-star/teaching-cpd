import type { Course, CourseCategory, Module } from "./data";

const P16 = "overhaul16-adventure-";
export const PRESENTATION_OVERHAUL_PHASE16_VERSION = "2026.17";

export type Phase16Effects = { evidence: number; trust: number; sustainability: number };
export type Phase16Choice = {
  id: string;
  label: string;
  feedback: string;
  next: string;
  effects: Phase16Effects;
  consequence: string;
};
export type Phase16State = {
  id: string;
  chapter: 1 | 2 | 3 | 4;
  title: string;
  situation: string;
  choices: Phase16Choice[];
};
export type Phase16Ending = {
  id: string;
  title: string;
  summary: string;
  transferPrompt: string;
};
export type Phase16AdventurePack = {
  moduleId: string;
  title: string;
  subtitle: string;
  opening: string;
  mission: string;
  states: Phase16State[];
  endings: Phase16Ending[];
};
export type Phase16Audit = {
  courseId: string;
  title: string;
  adventureModules: number;
  states: number;
  choices: number;
  distinctFirstBranches: number;
  consequenceBranches: number;
  endings: number;
  ready: boolean;
  score: number;
};

type ActivityModule = Extract<Module, { type: "activity" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function choice(id: string, label: string, feedback: string, next: string, effects: Phase16Effects, consequence: string): Phase16Choice {
  return { id, label, feedback, next, effects, consequence };
}

type Lens = {
  title: string;
  opening: string;
  mission: string;
  start: [string, string, string];
  branch: [string, string, string];
  pressure: [string, string, string];
};

function categoryLens(category: CourseCategory, courseTitle: string): Lens {
  if (category === "Safeguarding") return {
    title: "Safeguarding consequence adventure",
    opening: "A concern has been passed through the school's safeguarding route using the information available at the time. New factual information now arrives while colleagues are under pressure to know more, share more and move quickly.",
    mission: "Protect the pupil, stay inside the staff role, preserve factual evidence and keep the response aligned with the school's current safeguarding procedure as the situation changes.",
    start: [
      "Pass the new factual information through the safeguarding route promptly and note exactly what is known.",
      "Pause briefly to organise the known facts and clarify what is observation, report and assumption before passing the update on.",
      "Share the situation more widely with colleagues first so the team can decide how serious it appears.",
    ],
    branch: [
      "The safeguarding lead now has the update quickly, but asks you to separate direct facts from a colleague's interpretation.",
      "Your careful factual summary is useful, but the short delay means another colleague has already acted on incomplete information.",
      "Wider informal discussion creates conflicting versions of events and the pupil notices that more adults seem to know.",
    ],
    pressure: [
      "A further detail appears that changes the context but does not remove the need to follow the safeguarding route.",
      "Time pressure increases and you need to correct the information trail without drifting into investigation.",
      "Trust has been strained and the next action must reduce unnecessary sharing while keeping the concern moving through the correct route.",
    ],
  };
  if (category === "SEND") return {
    title: "Adaptive support consequence adventure",
    opening: "A support strategy linked to this course has improved access for one learner, but the next lesson shows a new tension between participation, independence and task demand.",
    mission: "Preserve an ambitious learning goal while adapting support in response to evidence rather than label, habit or convenience.",
    start: [
      "Keep the learning goal and reduce one specific barrier while collecting evidence of independent starts.",
      "Keep the current support unchanged for several more lessons so the learner experiences consistency.",
      "Fade most of the support now because task completion has improved.",
    ],
    branch: [
      "The learner starts more independently, but a demanding new task exposes a different access barrier.",
      "Completion remains high, but the learner waits for the familiar prompt before beginning work they can sometimes do alone.",
      "Independence rises in part of the task, but cognitive load increases and accuracy drops sharply later on.",
    ],
    pressure: [
      "A colleague wants one fixed support plan that can be used in every lesson for consistency.",
      "The learner's own feedback differs from the pattern adults expected from the available data.",
      "A deadline means the team needs a practical next step without lowering the intended learning outcome.",
    ],
  };
  if (category === "Leadership") return {
    title: "Implementation consequence adventure",
    opening: "A team has begun using a shared practice linked to this course. Early implementation is uneven and you have limited time before the next review point.",
    mission: "Improve consistency by diagnosing clarity, capability and capacity while protecting useful professional judgement and manageable workload.",
    start: [
      "Clarify the smallest non-negotiable practice and ask teams what is getting in the way.",
      "Increase monitoring immediately so variation becomes visible before the next review.",
      "Give teams greater freedom to interpret the priority while you wait for outcome data.",
    ],
    branch: [
      "The core expectation is clearer, but different teams reveal different capability and workload barriers.",
      "You gain more monitoring data, but some staff now optimise what is visible rather than the underlying practice.",
      "Staff value autonomy, but the shared priority now means different things in different parts of the school.",
    ],
    pressure: [
      "Senior leaders ask for a simple assurance statement even though implementation evidence is mixed.",
      "One team improves quickly while another struggles because the same routine creates different workload demands.",
      "The review deadline arrives before outcome data can show whether the practice has improved learning or provision.",
    ],
  };
  if (category === "Wellbeing") return {
    title: "Workload consequence adventure",
    opening: "A change intended to improve staff wellbeing is welcomed initially, but the first month reveals a mixture of genuine benefit, hidden workload and different experiences across teams.",
    mission: "Reduce avoidable system friction without treating wellbeing as a popularity exercise or an individual resilience problem.",
    start: [
      "Remove one duplicated process and define what evidence will show whether workload has actually reduced.",
      "Keep the popular wellbeing initiative and collect staff sentiment before changing any systems.",
      "Give each team freedom to design its own wellbeing response to local pressure.",
    ],
    branch: [
      "The duplicated task disappears, but another process now absorbs some of the time that was saved.",
      "Staff value the initiative, but the deadline and duplication patterns causing pressure remain unchanged.",
      "Some teams make useful changes while others create additional meetings and activities in the name of wellbeing.",
    ],
    pressure: [
      "A busy period makes it harder to distinguish temporary pressure from avoidable system friction.",
      "Staff feedback is divided: one group values consistency while another needs flexibility.",
      "Leadership wants to demonstrate impact, but the available evidence is mostly participation and satisfaction data.",
    ],
  };
  if (category === "Digital Teaching") return {
    title: "Digital rollout consequence adventure",
    opening: "A digital or AI-supported workflow linked to this course has saved time in a small trial. The school now wants to scale it, but accuracy, accessibility, privacy and human checking all need active decisions.",
    mission: "Keep the educational or workload benefit while ensuring a human remains responsible for safe, accurate and accessible professional use.",
    start: [
      "Scale only the verified workflow and define clear checking, privacy and accessibility boundaries.",
      "Scale quickly because the time saving is substantial, then correct problems as staff report them.",
      "Keep the tool optional and let each member of staff decide what information and checking is appropriate.",
    ],
    branch: [
      "The controlled rollout is slower, but staff can identify exactly which outputs still need human checking.",
      "Adoption grows rapidly, but inconsistent checking creates several conflicting outputs and avoidable rework.",
      "Staff autonomy is high, but practice now varies widely in what data is entered and how outputs are verified.",
    ],
    pressure: [
      "A useful-looking output contains a subtle error that would be easy to miss during a busy week.",
      "A learner or colleague cannot access part of the workflow in the format currently being used.",
      "The team wants a simple rule for acceptable use, but different tasks carry very different risks.",
    ],
  };
  return {
    title: "Classroom consequence adventure",
    opening: `A teaching approach linked to ${courseTitle} worked well enough in an initial lesson to justify continuing, but the next class responds differently and the evidence is no longer straightforward.`,
    mission: "Keep the underlying learning principle, respond to evidence of pupil thinking and avoid mistaking visible activity for secure learning.",
    start: [
      "Run a focused check of pupil thinking and adapt the next move to what it reveals.",
      "Keep the original routine for another lesson so pupils have more time to become familiar with it.",
      "Add an extra strategy immediately to increase engagement while the lesson is still moving.",
    ],
    branch: [
      "The check exposes a precise misconception, but correcting it will mean changing the pace of the planned lesson.",
      "The routine feels smoother, but the evidence still does not show whether quieter pupils understand the key idea.",
      "Participation increases, but it is now difficult to tell which change affected learning and which simply increased activity.",
    ],
    pressure: [
      "The next lesson has less time and a more demanding application task.",
      "Pupil responses are mixed: confidence rises while accuracy remains uneven.",
      "A colleague wants to copy the visible technique after seeing the class appear more engaged.",
    ],
  };
}

export function getPhase16AdventurePack(course: Course): Phase16AdventurePack {
  const id = safeId(course.id);
  const lens = categoryLens(course.category, course.title);
  const states: Phase16State[] = [
    {
      id: "start", chapter: 1, title: "Chapter 1 · Make the first move", situation: lens.opening,
      choices: [
        choice("evidence-first", lens.start[0], "You create a clearer evidence trail, but the deliberate process costs some time and exposes a new trade-off.", "evidence-consequence", { evidence: 16, trust: 6, sustainability: 4 }, "Your next decision starts with stronger evidence, but you now need to act on what it shows."),
        choice("hold-course", lens.start[1], "Consistency can be useful, but keeping the current course means uncertainty survives into the next decision.", "consistency-consequence", { evidence: 2, trust: 5, sustainability: 3 }, "The original approach remains stable, but the unresolved evidence gap becomes part of the next scenario."),
        choice("move-fast", lens.start[2], "The response creates momentum, but it also introduces a new risk that must now be managed rather than ignored.", "speed-consequence", { evidence: -8, trust: -5, sustainability: -6 }, "The fast move changes the environment; the next chapter is about repairing or containing its side effects."),
      ],
    },
    {
      id: "evidence-consequence", chapter: 2, title: "Chapter 2 · Evidence has a cost", situation: lens.branch[0],
      choices: [
        choice("protect-principle", "Keep the core principle, change only the part the new evidence says is not working, and name the next check.", "You preserve continuity while making the adaptation traceable to evidence.", "evidence-pressure", { evidence: 13, trust: 7, sustainability: 8 }, "People can see why the response changed and what evidence will determine the next move."),
        choice("optimise-result", "Prioritise the quickest visible improvement even if it means changing several things together.", "The visible problem may improve, but causal clarity falls because several variables changed at once.", "capacity-pressure", { evidence: -5, trust: 2, sustainability: -5 }, "Short-term improvement is possible, but the team can no longer tell which change produced it."),
        choice("defer", "Keep collecting information until the evidence is more complete before changing anything.", "More evidence can help, but delay itself now has consequences and may leave a known barrier in place.", "trust-pressure", { evidence: 7, trust: -4, sustainability: -2 }, "The evidence base grows while confidence in timely action begins to weaken."),
      ],
    },
    {
      id: "consistency-consequence", chapter: 2, title: "Chapter 2 · Consistency becomes dependence", situation: lens.branch[1],
      choices: [
        choice("target-gap", "Identify the single uncertainty that matters most and collect evidence on that before the next cycle.", "You turn vague consistency into a purposeful test rather than simply repeating the routine.", "evidence-pressure", { evidence: 14, trust: 5, sustainability: 6 }, "The unchanged routine now has a clear test attached to it."),
        choice("standardise", "Standardise the current approach more tightly so implementation is easier to compare.", "Comparison becomes easier, but local barriers and professional adaptation may be hidden.", "capacity-pressure", { evidence: 4, trust: -2, sustainability: -3 }, "Consistency improves on the surface while fit and ownership become the next pressure points."),
        choice("open-choice", "Let people adapt the response independently and compare what happens later.", "This may reveal useful variation, but without a shared principle it can become difficult to interpret the results.", "trust-pressure", { evidence: 1, trust: 6, sustainability: 1 }, "Autonomy rises, but the next review must separate principled adaptation from drift."),
      ],
    },
    {
      id: "speed-consequence", chapter: 2, title: "Chapter 2 · The side effect arrives", situation: lens.branch[2],
      choices: [
        choice("repair", "Acknowledge the side effect, return to the professional principle and make the smallest corrective change.", "A transparent recovery can restore trust while improving the quality of the next evidence.", "trust-pressure", { evidence: 10, trust: 12, sustainability: 7 }, "The route is recoverable, but your next decision will be judged against the repair you have just made."),
        choice("double-down", "Persist with the fast response so the team has enough time to see whether it settles.", "Persistence may protect consistency, but it also compounds the risk if the original move was poorly matched to the problem.", "capacity-pressure", { evidence: -7, trust: -7, sustainability: -8 }, "The original choice is now embedded more deeply, so changing course later will be harder."),
        choice("switch-again", "Replace the response with a different technique immediately to regain momentum.", "Another rapid switch may feel active, but it makes the evidence trail weaker and increases implementation noise.", "evidence-pressure", { evidence: -10, trust: -3, sustainability: -9 }, "Multiple rapid changes now make it difficult to know what caused the current result."),
      ],
    },
    {
      id: "evidence-pressure", chapter: 3, title: "Chapter 3 · Evidence under pressure", situation: lens.pressure[0],
      choices: [
        choice("bounded-trial", "Run a bounded next step with one agreed outcome measure and a clear keep/adapt/stop review point.", "This turns uncertainty into a manageable professional test without overclaiming impact.", "ending-learning", { evidence: 15, trust: 6, sustainability: 12 }, "You finish with a testable implementation loop rather than a permanent verdict."),
        choice("declare-success", "Treat the strongest recent signal as enough evidence to make the approach permanent.", "A promising signal is useful, but permanence outruns what the evidence can yet support.", "ending-fragile", { evidence: -6, trust: 1, sustainability: -5 }, "The approach ends with confidence, but the evidence base is too narrow to support the certainty."),
        choice("pause-all", "Pause the approach completely until stronger evidence is available.", "This protects against overclaiming but can also discard useful practice and delay learning from a proportionate trial.", "ending-cautious", { evidence: 3, trust: -1, sustainability: 2 }, "The risk is contained, but useful learning may also stop."),
      ],
    },
    {
      id: "capacity-pressure", chapter: 3, title: "Chapter 3 · Capacity and consistency collide", situation: lens.pressure[1],
      choices: [
        choice("minimum-viable", "Define the smallest defensible version of the practice, remove avoidable workload and keep one meaningful check.", "You protect the principle while making implementation more sustainable.", "ending-sustainable", { evidence: 8, trust: 7, sustainability: 17 }, "The final model is deliberately smaller, clearer and easier to maintain."),
        choice("full-fidelity", "Require full implementation everywhere so the review compares like with like.", "Fidelity can clarify comparison, but capacity problems may turn compliance into a substitute for quality.", "ending-fragile", { evidence: 5, trust: -6, sustainability: -12 }, "The practice looks consistent, but the implementation burden becomes part of the outcome."),
        choice("local-versions", "Allow each team or context to redesign the approach independently to fit local capacity.", "Fit may improve, but the shared principle can become too weak to evaluate across settings.", "ending-cautious", { evidence: -1, trust: 8, sustainability: 7 }, "Local ownership is strong while common evidence becomes harder to interpret."),
      ],
    },
    {
      id: "trust-pressure", chapter: 3, title: "Chapter 3 · Trust becomes part of the problem", situation: lens.pressure[2],
      choices: [
        choice("transparent-reset", "Explain what changed, what is still uncertain and what evidence will guide the next decision.", "Transparency makes uncertainty manageable and rebuilds professional trust around a clear process.", "ending-learning", { evidence: 10, trust: 16, sustainability: 9 }, "You finish with shared clarity about both the limit of the evidence and the next review point."),
        choice("reassure", "Reassure people that the approach is working and avoid highlighting uncertainty until the review is complete.", "Reassurance may reduce immediate anxiety, but hidden uncertainty can weaken trust later if results change.", "ending-fragile", { evidence: -3, trust: -7, sustainability: -2 }, "Short-term confidence is protected at the cost of a less transparent evidence trail."),
        choice("handover", "Hand the decision to another person or team without first clarifying the unresolved evidence and consequences.", "Responsibility moves, but the ambiguity moves with it and the next team inherits a poorly framed problem.", "ending-cautious", { evidence: -4, trust: -3, sustainability: 1 }, "The immediate pressure reduces, but the professional problem remains only partly resolved."),
      ],
    },
    {
      id: "ending-learning", chapter: 4, title: "Ending · Evidence-led learning loop", situation: "You reach the end with a clear professional principle, a visible evidence trail and a review point. The route was not perfect, but the consequences were noticed and used to improve the next decision.", choices: [],
    },
    {
      id: "ending-sustainable", chapter: 4, title: "Ending · Sustainable implementation", situation: "You finish with a smaller, clearer version of the practice that protects the core purpose while reducing avoidable burden. The next review can now test whether the streamlined version actually delivers the intended outcome.", choices: [],
    },
    {
      id: "ending-cautious", chapter: 4, title: "Ending · Cautious containment", situation: "You contain the immediate risk and avoid overclaiming, but some useful learning remains unresolved. The next step is to define the smallest safe test that would reduce uncertainty without recreating the original problem.", choices: [],
    },
    {
      id: "ending-fragile", chapter: 4, title: "Ending · Fragile success", situation: "The route produces a visible result, but the evidence, trust or sustainability underneath it remains fragile. The professional task now is to identify which hidden cost must be addressed before the approach is treated as secure practice.", choices: [],
    },
  ];

  return {
    moduleId: `${P16}${id}`,
    title: lens.title,
    subtitle: "Your decisions permanently change the route, pressures and ending",
    opening: lens.opening,
    mission: lens.mission,
    states,
    endings: [
      { id: "ending-learning", title: "Evidence-led learning loop", summary: "The route preserves evidence, trust and a clear review cycle.", transferPrompt: "What is one bounded change you could test in your own setting, and what evidence would determine keep/adapt/stop?" },
      { id: "ending-sustainable", title: "Sustainable implementation", summary: "The route protects the principle while reducing avoidable implementation burden.", transferPrompt: "Which part of your current practice is essential, and which part could be simplified without losing the intended outcome?" },
      { id: "ending-cautious", title: "Cautious containment", summary: "The route limits immediate risk but leaves an evidence gap to resolve.", transferPrompt: "What small, proportionate next test would reduce uncertainty without creating a larger new burden or risk?" },
      { id: "ending-fragile", title: "Fragile success", summary: "A visible result masks weakness in evidence, trust or sustainability.", transferPrompt: "Which hidden cost would you check first before treating a visible improvement as secure practice?" },
    ],
  };
}

function adventureModule(course: Course): ActivityModule {
  const pack = getPhase16AdventurePack(course);
  return {
    id: pack.moduleId,
    type: "activity",
    title: `Branching adventure · ${pack.title}`,
    prompt: pack.opening,
    instructions: [
      "Make a decision in each chapter. Your choice permanently changes the next scenario rather than simply revealing feedback.",
      "Watch Evidence, Trust and Sustainability. There is no single perfect meter score: the route creates trade-offs you must manage.",
      "Read the consequence ledger before each new choice; earlier decisions remain part of the situation.",
      "Reach an ending, review the complete decision trail and write one transfer action for your own professional context.",
    ],
    placeholder: "Your Phase 16 adventure outcome and transfer action…",
    minimumCharacters: 60,
  };
}

export function applyBranchingAdventurePhase16(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => module.id !== `${P16}${id}`);
  const lastSimulation = modules.map((module, index) => ({ module, index })).filter(item => item.module.id.startsWith("overhaul12-sim-")).at(-1)?.index ?? -1;
  const insertAt = lastSimulation >= 0 ? lastSimulation + 1 : Math.max(1, modules.length - 3);
  modules.splice(insertAt, 0, adventureModule(course));
  return { ...course, duration: course.duration + 8, modules };
}

export function isPhase16AdventureModule(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith(P16));
}

export function getPhase16AdventureModulePack(course: Course, module: Module | undefined | null) {
  if (!module || !isPhase16AdventureModule(module)) return null;
  return getPhase16AdventurePack(course);
}

export function validateBranchingAdventurePhase16(course: Course) {
  const modules = course.modules.filter(module => isPhase16AdventureModule(module));
  if (modules.length !== 1) throw new Error(`Phase 16 ${course.id}: requires exactly one branching adventure module`);
  const pack = getPhase16AdventurePack(course);
  if (pack.states.length < 11) throw new Error(`Phase 16 ${course.id}: adventure needs a substantial state graph`);
  const start = pack.states.find(state => state.id === "start");
  if (!start || start.choices.length !== 3 || new Set(start.choices.map(item => item.next)).size !== 3) throw new Error(`Phase 16 ${course.id}: first decision must create three distinct routes`);
  const chapter2 = pack.states.filter(state => state.chapter === 2);
  if (chapter2.length !== 3 || chapter2.some(state => state.choices.length !== 3)) throw new Error(`Phase 16 ${course.id}: each first route needs its own consequence chapter`);
  if (chapter2.some(state => new Set(state.choices.map(item => item.next)).size < 3)) throw new Error(`Phase 16 ${course.id}: consequence chapters must branch again`);
  const chapter3 = pack.states.filter(state => state.chapter === 3);
  if (chapter3.length !== 3 || chapter3.some(state => state.choices.length !== 3)) throw new Error(`Phase 16 ${course.id}: pressure chapter graph is incomplete`);
  const endings = pack.states.filter(state => state.chapter === 4);
  if (endings.length !== 4 || endings.some(state => state.choices.length)) throw new Error(`Phase 16 ${course.id}: requires four terminal endings`);
  const stateIds = new Set(pack.states.map(state => state.id));
  for (const state of pack.states) for (const item of state.choices) {
    if (!stateIds.has(item.next)) throw new Error(`Phase 16 ${course.id}: ${state.id}/${item.id} points to missing state ${item.next}`);
    if (!item.consequence.trim() || !item.feedback.trim()) throw new Error(`Phase 16 ${course.id}: ${state.id}/${item.id} needs feedback and consequence`);
  }
  return true;
}

export function auditBranchingAdventurePhase16(course: Course): Phase16Audit {
  const pack = getPhase16AdventurePack(course);
  const adventureModules = course.modules.filter(module => isPhase16AdventureModule(module)).length;
  const choices = pack.states.reduce((sum, state) => sum + state.choices.length, 0);
  const start = pack.states.find(state => state.id === "start");
  const distinctFirstBranches = start ? new Set(start.choices.map(item => item.next)).size : 0;
  const consequenceBranches = pack.states.filter(state => state.chapter === 2 && new Set(state.choices.map(item => item.next)).size >= 3).length;
  const endings = pack.states.filter(state => state.chapter === 4).length;
  let ready = true;
  try { validateBranchingAdventurePhase16(course); } catch { ready = false; }
  const score = Math.min(100,
    (adventureModules === 1 ? 20 : 0) +
    (pack.states.length >= 11 ? 15 : 0) +
    (choices >= 21 ? 15 : 0) +
    (distinctFirstBranches === 3 ? 15 : 0) +
    (consequenceBranches === 3 ? 15 : 0) +
    (endings === 4 ? 10 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, adventureModules, states: pack.states.length, choices, distinctFirstBranches, consequenceBranches, endings, ready, score };
}

export function summariseBranchingAdventurePhase16(courses: Course[]) {
  const reports = courses.map(auditBranchingAdventurePhase16);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalAdventures: reports.reduce((sum, report) => sum + report.adventureModules, 0),
    totalStates: reports.reduce((sum, report) => sum + report.states, 0),
    totalChoices: reports.reduce((sum, report) => sum + report.choices, 0),
    totalEndings: reports.reduce((sum, report) => sum + report.endings, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
