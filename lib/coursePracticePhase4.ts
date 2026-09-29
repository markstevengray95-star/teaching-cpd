import type { Course, Module } from "./data";

const PREFIX = "phase4-practice-";
type ScenarioModule = Extract<Module, { type: "scenario" }>;

type PracticeProfile = {
  strongEvidence: string[];
  weakEvidence: string[];
  hotspots: { label: string; detail: string; priority: boolean }[];
  implementationEvidence: string[];
  impactEvidence: string[];
  weakMeasures: string[];
};

const PROFILES: Record<Course["category"], PracticeProfile> = {
  "Teaching & Learning": {
    strongEvidence: [
      "Whole-class responses reveal the same misconception across several pupils.",
      "Pupil work shows a specific error pattern that changes after the teaching adjustment.",
      "More pupils can explain the intended idea independently after the scaffold is reduced.",
    ],
    weakEvidence: [
      "The activity looked busy, so learning must have improved.",
      "One confident volunteer answered correctly, so the whole class understands.",
      "The strategy is popular, therefore it will work in every lesson.",
    ],
    hotspots: [
      { label: "Learning goal", detail: "Is the intended learning clear enough to judge whether the strategy helped?", priority: true },
      { label: "Participation", detail: "Are you sampling thinking from the class or mainly hearing from volunteers?", priority: true },
      { label: "Cognitive load", detail: "Is unnecessary memory, language or task complexity blocking the intended thinking?", priority: true },
      { label: "Room display", detail: "Could the visual environment be simplified if it distracts some pupils?", priority: false },
      { label: "Seating preference", detail: "May matter for individuals, but it is not automatically the central teaching problem.", priority: false },
      { label: "Teacher style", detail: "A personal preference is less useful than observable evidence about learning.", priority: false },
    ],
    implementationEvidence: ["The agreed routine is visible in lesson planning and classroom use.", "Teachers can describe when and why they use the approach."],
    impactEvidence: ["Pupil responses show fewer target misconceptions over time.", "Independent success on the intended task improves after the change."],
    weakMeasures: ["Staff say they enjoyed the training.", "The activity was completed in every lesson regardless of need."],
  },
  Safeguarding: {
    strongEvidence: [
      "The pupil's exact words, time, context and action taken are recorded factually.",
      "The concern is passed promptly through the school's current safeguarding route.",
      "The member of staff stays within role boundaries and does not investigate independently.",
    ],
    weakEvidence: [
      "A colleague thinks the pupil is probably fine because they seemed cheerful later.",
      "The member of staff waits for proof before sharing the concern.",
      "A detailed personal theory is recorded as though it were an observed fact.",
    ],
    hotspots: [
      { label: "Immediate safety", detail: "Is anyone at immediate risk and does the school procedure require urgent escalation?", priority: true },
      { label: "Recording", detail: "Are facts, the pupil's words, actions and chronology recorded accurately?", priority: true },
      { label: "Reporting route", detail: "Has the concern reached the DSL/deputy through the current agreed process?", priority: true },
      { label: "Independent investigation", detail: "Staff should not question widely or gather their own proof.", priority: false },
      { label: "Personal diagnosis", detail: "Staff should record and report concerns rather than diagnose motives or conditions.", priority: false },
      { label: "Promise of secrecy", detail: "Confidentiality cannot be promised when information may need to be shared for safety.", priority: false },
    ],
    implementationEvidence: ["Staff can locate the reporting route and identify the DSL/deputy without prompting.", "Records contain factual chronology and appropriate escalation."],
    impactEvidence: ["Concerns are passed on promptly and fewer records need clarification or correction.", "Staff confidence improves without increasing out-of-role investigation."],
    weakMeasures: ["Attendance at annual safeguarding training alone.", "The number of concerns falls, without checking whether under-reporting has increased."],
  },
  SEND: {
    strongEvidence: [
      "The pupil starts the intended task more independently after a specific barrier is reduced.",
      "A scaffold improves access and can later be faded without lowering the learning goal.",
      "Pupil-specific information and pupil voice explain which adjustment is useful in this context.",
    ],
    weakEvidence: [
      "The strategy is recommended for a diagnosis, so it must suit this pupil.",
      "The adult completes difficult thinking for the pupil, so the lesson appears successful.",
      "The learning goal is lowered before identifying what is actually blocking access.",
    ],
    hotspots: [
      { label: "Task demand", detail: "Which part of the task creates the actual barrier: language, memory, organisation, sensory demand or prior knowledge?", priority: true },
      { label: "Independence", detail: "Does support help the pupil do more of the important thinking independently?", priority: true },
      { label: "Pupil-specific information", detail: "Does the response use the pupil's plan, specialist advice or own feedback where available?", priority: true },
      { label: "Diagnosis label", detail: "A diagnosis can inform planning but should not become a one-size-fits-all strategy list.", priority: false },
      { label: "Permanent scaffold", detail: "Support should be reviewed rather than left in place automatically.", priority: false },
      { label: "Task removal", detail: "Removing challenge is not automatically the same as providing access.", priority: false },
    ],
    implementationEvidence: ["The intended adjustment is used consistently in the agreed context.", "Staff can explain the barrier the adjustment is intended to reduce."],
    impactEvidence: ["The pupil completes more of the intended thinking independently.", "Pupil feedback and work indicate improved access without unnecessary reduction in challenge."],
    weakMeasures: ["A support strategy appears on a plan but is not observed in practice.", "The pupil is quieter, therefore the support must be effective."],
  },
  Leadership: {
    strongEvidence: [
      "Staff can state the small number of agreed behaviours and why they matter.",
      "Implementation evidence identifies a specific barrier before leaders add monitoring.",
      "Follow-up combines modelling, rehearsal, feedback and a clear review point.",
    ],
    weakEvidence: [
      "A new initiative is launched because the previous one feels slow.",
      "One observation is treated as a complete judgement of implementation quality.",
      "More monitoring is added before checking whether staff had clarity, time and support.",
    ],
    hotspots: [
      { label: "Clarity", detail: "Can staff describe the expected practice in observable terms?", priority: true },
      { label: "Conditions", detail: "Do staff have the knowledge, time, resources and modelling needed to implement it?", priority: true },
      { label: "Evidence", detail: "Are leaders using multiple proportionate sources to diagnose progress and barriers?", priority: true },
      { label: "Launch event", detail: "A strong launch helps, but it cannot substitute for sustained implementation routines.", priority: false },
      { label: "Compliance count", detail: "Counting completion can miss whether the change is useful or well implemented.", priority: false },
      { label: "Initiative volume", detail: "Adding more priorities can reduce rather than improve implementation quality.", priority: false },
    ],
    implementationEvidence: ["The agreed behaviour is observable in team routines and professional conversations.", "Staff know where to access support and can describe the review process."],
    impactEvidence: ["The targeted pupil, staff or organisational outcome changes in the intended direction.", "Barriers reduce while implementation becomes more consistent and sustainable."],
    weakMeasures: ["Everyone attended the launch presentation.", "A single walk-through found the behaviour once."],
  },
  Wellbeing: {
    strongEvidence: [
      "A recurring source of duplication or friction is identified with evidence about time and workflow.",
      "A system change reduces avoidable workload without removing an important educational or safeguarding function.",
      "Staff feedback is considered alongside workload patterns rather than used as the only measure.",
    ],
    weakEvidence: [
      "A wellbeing activity is added on top of unchanged workload systems.",
      "A difficult process is kept because it has always been done that way.",
      "One positive survey response is treated as proof that workload is sustainable.",
    ],
    hotspots: [
      { label: "Avoidable workload", detail: "Which recurring process creates time cost without proportionate value?", priority: true },
      { label: "Role clarity", detail: "Are responsibilities and decision routes clear enough to avoid repeated work?", priority: true },
      { label: "Duplication", detail: "Is the same information being requested, recorded or checked more than once?", priority: true },
      { label: "Personal resilience", detail: "Individual strategies can help but should not hide preventable system problems.", priority: false },
      { label: "One-off event", detail: "Short events may be welcome but are not a substitute for sustainable working conditions.", priority: false },
      { label: "Removing safeguards", detail: "Reducing workload must not remove essential safety or educational processes without analysis.", priority: false },
    ],
    implementationEvidence: ["The agreed workflow change is actually being used by the people affected.", "Duplicated steps or unnecessary requests have been removed as planned."],
    impactEvidence: ["Time spent on the recurring process decreases without reducing service quality.", "Staff report greater clarity and fewer repeated bottlenecks over the review period."],
    weakMeasures: ["Attendance at a wellbeing event.", "A single satisfaction score collected immediately after launch."],
  },
  "Digital Teaching": {
    strongEvidence: [
      "The digital tool is selected for a clear educational purpose and the output is independently checked.",
      "Sensitive data is excluded or handled through an approved process.",
      "Accessibility, reliability and human oversight are checked before wider use.",
    ],
    weakEvidence: [
      "The output looks polished, so its factual accuracy is assumed.",
      "A tool is adopted mainly because it is new or saves a few clicks.",
      "Identifiable pupil information is entered without checking approval or necessity.",
    ],
    hotspots: [
      { label: "Purpose", detail: "Does the technology improve the educational task rather than simply digitise it?", priority: true },
      { label: "Privacy & safeguarding", detail: "Is personal or sensitive information protected and the tool appropriate for the context?", priority: true },
      { label: "Accuracy & oversight", detail: "Who checks important outputs and remains accountable for the final decision?", priority: true },
      { label: "Novelty", detail: "Newness is not evidence of educational value.", priority: false },
      { label: "Visual polish", detail: "Professional-looking output can still contain errors or bias.", priority: false },
      { label: "Automation volume", detail: "Automating more tasks is not automatically better if judgement or access is weakened.", priority: false },
    ],
    implementationEvidence: ["Staff use the agreed checking, privacy and approval routine when using the tool.", "The tool is used for the intended bounded purpose rather than uncontrolled expansion."],
    impactEvidence: ["The task becomes more efficient or educationally useful without increasing error, access or privacy problems.", "Users can explain and verify important outputs rather than accepting them automatically."],
    weakMeasures: ["The tool generated many resources quickly.", "Staff report that the interface is easy to use."],
  },
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function scenario(id: string, title: string, prompt: string, options: ScenarioModule["options"]): ScenarioModule {
  return { id, type: "scenario", title, prompt, options };
}

function option(label: string, feedback: string) {
  return { label, feedback };
}

function sortEvidence(course: Course, profile: PracticeProfile): ScenarioModule {
  const options = [
    ...profile.strongEvidence.map(item => option(`[strong] ${item}`, "This is specific enough to inform a professional decision.")),
    ...profile.weakEvidence.map(item => option(`[weak] ${item}`, "This relies on assumption, proxy evidence or an over-general conclusion.")),
  ];
  return scenario(`${PREFIX}${safeId(course.id)}-sort`, "Phase 4 · Sort the evidence", `Drag or tap each statement into Stronger evidence or Weak / assumption. Use ${course.title} to decide whether the information is observable and useful enough to guide action.`, options);
}

function rankResponse(course: Course): ScenarioModule {
  const objective = course.objectives[0] || course.summary;
  return scenario(`${PREFIX}${safeId(course.id)}-rank`, "Phase 4 · Rank the professional response", `Put the actions into the strongest sequence for applying ${course.title}. The first objective is: ${objective}`, [
    option("[rank:1] Define the intended outcome precisely.", "Start with the purpose so later evidence and action can be judged against it."),
    option("[rank:2] Gather enough baseline evidence to identify the real barrier or problem.", "Diagnosis should come before adding a technique."),
    option("[rank:3] Choose one proportionate action linked to the course principle.", "Keep the response small enough to understand and review."),
    option("[rank:4] Check implementation and the immediate response using relevant evidence.", "Do not assume that completing the action means it worked."),
    option("[rank:5] Decide whether to keep, adapt, fade or stop the response.", "A review decision closes the improvement cycle."),
  ]);
}

function hotspotInvestigation(course: Course, profile: PracticeProfile): ScenarioModule {
  return scenario(`${PREFIX}${safeId(course.id)}-hotspot`, "Phase 4 · Hotspot investigation", `Scan the situation as though you were observing practice linked to ${course.title}. Select the three hotspots you would investigate first before making a judgement.`, profile.hotspots.map(item => option(`[hotspot:${item.priority ? "priority" : "secondary"}] ${item.label} — ${item.detail}`, item.priority ? "This is close to the intended professional decision and should be checked early." : "This may matter, but it is less diagnostic than the priority hotspots in this case.")));
}

function evidenceAnalyst(course: Course, profile: PracticeProfile): ScenarioModule {
  return scenario(`${PREFIX}${safeId(course.id)}-evidence`, "Phase 4 · Evidence analyst", `Classify each measure for ${course.title} as implementation evidence, impact evidence or weak / insufficient evidence.`, [
    ...profile.implementationEvidence.map(item => option(`[implementation] ${item}`, "This tells you whether the intended practice or process actually happened.")),
    ...profile.impactEvidence.map(item => option(`[impact] ${item}`, "This is closer to the intended pupil, staff or organisational outcome.")),
    ...profile.weakMeasures.map(item => option(`[weak] ${item}`, "This may be interesting but cannot by itself establish implementation quality or impact.")),
  ]);
}

function branchingCase(course: Course): ScenarioModule {
  const objective = course.objectives[0] || course.summary;
  return scenario(`${PREFIX}${safeId(course.id)}-branch`, "Phase 4 · Branching case", `Work through three decision points. Your choices alter the route through a realistic ${course.title} case. Aim to preserve the intended outcome while using proportionate evidence.`, [
    option("[branch:1:best] Start by clarifying what is observable and what is still an assumption.", "Strong start: you are separating evidence from interpretation before acting."),
    option("[branch:1:okay] Choose a familiar strategy immediately, then see what happens.", "Possible, but you have skipped diagnosis and may not know what problem the strategy is solving."),
    option("[branch:1:risk] Treat the first impression as proof and make a broad judgement.", "Risky: the response is being built on inference rather than evidence."),
    option(`[branch:2:best] Use the course principle — ${objective} — to choose one proportionate next action.`, "Strong: the action is explicitly linked to the professional purpose."),
    option("[branch:2:okay] Add several possible strategies at the same time.", "This may help, but it becomes difficult to know which change mattered and can increase load."),
    option("[branch:2:risk] Lower the expectation or remove the challenge before checking the barrier.", "Risky: this may protect short-term comfort while losing the intended outcome."),
    option("[branch:3:best] Compare implementation and impact evidence, then make a keep / adapt / fade / stop decision.", "Strong finish: evidence is being used to make an explicit review decision."),
    option("[branch:3:okay] Keep the response because it appeared to go smoothly once.", "One successful-looking episode is weak evidence for a sustained decision."),
    option("[branch:3:risk] Increase monitoring without diagnosing why the response did not work.", "Risky: more monitoring does not fix unclear expectations, weak support or a poor strategy."),
  ]);
}

function implementationSimulator(course: Course): ScenarioModule {
  return scenario(`${PREFIX}${safeId(course.id)}-simulation`, "Phase 4 · Implementation simulator", `Run a short implementation cycle for ${course.title}. Choose the strongest decision at each round; the simulator will score how well you protect clarity, evidence and sustainable follow-through.`, [
    option("[sim:1:best] Define one observable behaviour and the outcome it is intended to improve.", "This creates a clear implementation target."),
    option("[sim:1:okay] Launch the full idea and explain that staff should adapt it themselves.", "Some autonomy is useful, but the implementation target is still vague."),
    option("[sim:1:risk] Add the approach to several existing priorities without removing anything.", "Initiative overload makes reliable implementation less likely."),
    option("[sim:2:best] Provide modelling or rehearsal, then check whether the agreed behaviour is actually happening.", "Support and implementation evidence come before judgement."),
    option("[sim:2:okay] Send a reminder email and wait until the end of term to review.", "A reminder may help, but delayed feedback makes barriers harder to diagnose."),
    option("[sim:2:risk] Begin formal monitoring before staff have had support or practice.", "Monitoring before support can create performance theatre rather than learning."),
    option("[sim:3:best] Use more than one meaningful evidence source and decide what to keep, adapt or stop.", "The review is proportionate and connected to the intended outcome."),
    option("[sim:3:okay] Count completion and ask staff whether they liked the approach.", "Useful context, but weak evidence of actual impact."),
    option("[sim:3:risk] If impact is weak, add another initiative immediately.", "Adding complexity before diagnosis is likely to worsen implementation."),
  ]);
}

export function addAdvancedPracticePhase4(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));
  const profile = PROFILES[course.category];

  const practiseDivider = modules.findIndex(module => module.id === `phase3-present-${id}-section-practise`);
  const practiseAt = practiseDivider >= 0 ? practiseDivider + 1 : Math.min(8, modules.length);
  modules.splice(practiseAt, 0, sortEvidence(course, profile), hotspotInvestigation(course, profile), branchingCase(course));

  const evidenceDepth = modules.findIndex(module => module.id === `depth-2026-${id}-evidence`);
  const evidenceAt = evidenceDepth >= 0 ? evidenceDepth + 1 : Math.max(practiseAt + 3, Math.floor(modules.length * 0.65));
  modules.splice(evidenceAt, 0, evidenceAnalyst(course, profile), rankResponse(course));

  const transferDivider = modules.findIndex(module => module.id === `phase3-present-${id}-section-transfer`);
  modules.splice(transferDivider >= 0 ? transferDivider : modules.length, 0, implementationSimulator(course));

  return { ...course, duration: course.duration + 30, modules };
}

export function validateAdvancedPracticePhase4(course: Course) {
  const id = safeId(course.id);
  const suffixes = ["sort", "rank", "hotspot", "evidence", "branch", "simulation"];
  const phase4 = course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`));
  if (phase4.length !== suffixes.length) throw new Error(`CPD course ${course.id} needs all six Phase 4 advanced-practice modules`);
  suffixes.forEach(suffix => {
    const expected = `${PREFIX}${id}-${suffix}`;
    const module = course.modules.find(item => item.id === expected);
    if (!module || module.type !== "scenario") throw new Error(`CPD course ${course.id} is missing Phase 4 module ${expected}`);
    if (module.options.length < 5) throw new Error(`CPD course ${course.id} Phase 4 module ${expected} needs a meaningful option set`);
  });
  const metadataPrefixes = ["[strong]", "[rank:", "[hotspot:", "[implementation]", "[branch:", "[sim:"];
  metadataPrefixes.forEach(prefix => {
    if (!phase4.some(module => module.type === "scenario" && module.options.some(item => item.label.startsWith(prefix)))) {
      throw new Error(`CPD course ${course.id} is missing Phase 4 interaction metadata ${prefix}`);
    }
  });
}

export function auditAdvancedPracticePhase4(course: Course) {
  const id = safeId(course.id);
  const phase4Modules = course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`));
  const optionCount = phase4Modules.reduce((sum, module) => sum + (module.type === "scenario" ? module.options.length : 0), 0);
  return {
    courseId: course.id,
    title: course.title,
    phase4Modules: phase4Modules.length,
    advancedDecisions: optionCount,
    interactionTypes: ["sort", "rank", "hotspot", "evidence", "branch", "simulation"],
  };
}
