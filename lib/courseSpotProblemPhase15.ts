import type { Course, CourseCategory, Module } from "./data";

export const PRESENTATION_OVERHAUL_PHASE15_VERSION = "2026.16";
export const PHASE15_SCENE_KINDS = ["practice_snapshot", "evidence_audit"] as const;
export type Phase15SceneKind = (typeof PHASE15_SCENE_KINDS)[number];

export type Phase15Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  problem: boolean;
  annotation: string;
  expertAction: string;
};

export type Phase15Scene = {
  id: string;
  kind: Phase15SceneKind;
  anchorId: string;
  title: string;
  strapline: string;
  instruction: string;
  sceneLabel: string;
  sceneSummary: string;
  targetProblems: 3;
  hotspots: Phase15Hotspot[];
  expertSummary: string;
};

export type Phase15Audit = {
  courseId: string;
  title: string;
  scenes: number;
  hotspots: number;
  problems: number;
  annotations: number;
  kinds: number;
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
  const concept = firstAnchor(course, module => module.id.startsWith("overhaul7-visual-") && module.id.endsWith("-concept"), Math.floor(course.modules.length * 0.25));
  const evidence = firstAnchor(course, module => module.id.startsWith("overhaul7-visual-") && module.id.endsWith("-evidence"), Math.floor(course.modules.length * 0.72));
  return { concept, evidence };
}

const positions = [
  [14, 22], [48, 18], [80, 28], [18, 70], [52, 66], [83, 74],
] as const;

function hotspot(index: number, id: string, label: string, problem: boolean, annotation: string, expertAction: string): Phase15Hotspot {
  return { id, label, x: positions[index][0], y: positions[index][1], problem, annotation, expertAction };
}

function categoryScenes(category: CourseCategory) {
  if (category === "Safeguarding") return {
    practice: {
      label: "Concern-record snapshot",
      summary: "A member of staff has written a short concern note after a pupil conversation. Inspect what is safe, factual and professionally bounded.",
      hotspots: [
        hotspot(0, "quote", "Exact words recorded", false, "The record preserves the pupil's own words rather than replacing them with an adult interpretation.", "Keep the factual wording and distinguish direct quotation from observation."),
        hotspot(1, "promise", "Promise of secrecy", true, "The note says the pupil was promised that nobody else would be told. Staff should not promise confidentiality they cannot keep.", "Explain that information may need to be shared with the appropriate safeguarding people."),
        hotspot(2, "time", "Time and context included", false, "The record includes when and where the concern arose, which improves factual clarity.", "Retain concise contextual details that help the safeguarding team understand the record."),
        hotspot(3, "guess", "Adult conclusion written as fact", true, "A judgement about what 'must have happened' is presented as if it were observed.", "Separate observation, quotation and professional concern from inference."),
        hotspot(4, "route", "Current school route used", false, "The record is passed through the school's current safeguarding process rather than held informally.", "Keep using current school policy and DSL guidance."),
        hotspot(5, "investigate", "Plans to question other pupils", true, "The note proposes gathering a fuller story from other pupils, which moves into investigation.", "Recognise, record and report; do not investigate beyond the staff role."),
      ],
      expert: "A defensible safeguarding record is factual, timely and routed correctly. It avoids promises of secrecy, speculative conclusions and staff-led investigation.",
    },
    audit: {
      label: "Safeguarding follow-up audit",
      summary: "New information appears after the initial report. Inspect the planned follow-up before deciding whether it is professionally safe.",
      hotspots: [
        hotspot(0, "newfact", "New factual information added", false, "The follow-up records the new information without rewriting the original account.", "Add new facts clearly and preserve the chronology."),
        hotspot(1, "delay", "Wait for another incident", true, "The plan delays reporting until there is 'enough evidence'. Staff do not need to prove a concern before using the reporting route.", "Pass new information through the current safeguarding route promptly."),
        hotspot(2, "chronology", "Chronology preserved", false, "The follow-up shows when each piece of information became known.", "Maintain a clear, factual chronology."),
        hotspot(3, "broadcast", "Informal staff-group discussion", true, "The plan shares sensitive details widely to gather opinions, which is not an appropriate substitute for the safeguarding route.", "Share information only through appropriate school safeguarding processes and on a need-to-know basis."),
        hotspot(4, "dsl", "DSL/policy direction followed", false, "The plan explicitly returns to current DSL and policy guidance.", "Continue to follow local procedure when circumstances change."),
        hotspot(5, "prove", "Attempt to verify the account", true, "The plan asks the staff member to test whether the account is true before reporting the update.", "Record and report the new information without investigating."),
      ],
      expert: "Follow-up should add facts, preserve chronology and return to the current safeguarding route. It should not delay, broaden informal sharing or attempt to prove the concern.",
    },
  };

  if (category === "SEND") return {
    practice: {
      label: "Support-plan snapshot",
      summary: "A support plan has been drafted for a learner. Inspect whether it responds to the actual barrier while preserving ambition and independence.",
      hotspots: [
        hotspot(0, "goal", "Same ambitious outcome", false, "The intended learning outcome stays ambitious even though access is adapted.", "Keep the goal stable unless assessment evidence shows it genuinely needs to change."),
        hotspot(1, "label", "Diagnosis used as the plan", true, "The plan assumes a strategy because of the diagnostic label rather than identifying the barrier in this task.", "Start with the specific barrier, task and learner evidence."),
        hotspot(2, "voice", "Learner evidence included", false, "The plan includes pupil voice and evidence about when the barrier appears.", "Use learner evidence alongside professional observation and existing plans."),
        hotspot(3, "adult", "Adult prompts every step", true, "The support risks creating prompt dependence because success requires continuous adult direction.", "Use the smallest useful scaffold and plan how independence will be checked."),
        hotspot(4, "review", "Review point included", false, "The plan states when support will be reviewed and what evidence will be considered.", "Keep explicit review and fade/adapt criteria."),
        hotspot(5, "lower", "Task demand automatically lowered", true, "The plan reduces the cognitive demand before establishing whether access could be improved another way.", "Adapt access, representation or scaffolding before lowering the intended learning demand."),
      ],
      expert: "Strong SEND planning identifies the barrier, preserves ambition, uses proportionate support and plans for review and independence rather than making a label the intervention.",
    },
    audit: {
      label: "Independence evidence audit",
      summary: "The support has been used for several weeks. Inspect the review evidence and decide whether the plan is actually improving access and independence.",
      hotspots: [
        hotspot(0, "completion", "Completion rate only", true, "More finished work does not show whether understanding or independence improved.", "Include evidence of access, learning and independence, not completion alone."),
        hotspot(1, "independence", "Prompt dependence tracked", false, "The review checks how much prompting is needed over time.", "Keep tracking independence as well as outcome completion."),
        hotspot(2, "permanent", "Support made permanent automatically", true, "A successful support is being fixed in place without testing whether it can be faded or adapted.", "Review whether the scaffold can reduce as competence and confidence grow."),
        hotspot(3, "samegoal", "Learning goal remains visible", false, "The review keeps the original intended outcome in view when judging the support.", "Continue to judge access against the intended learning."),
        hotspot(4, "task", "Evidence from more than one task", false, "The review checks whether the support transfers across relevant contexts rather than relying on one lesson.", "Use proportionate evidence across contexts where the barrier matters."),
        hotspot(5, "adultview", "Adult opinion treated as sufficient", true, "The review relies on a single adult impression without pupil evidence or observable indicators.", "Triangulate professional observation with learner experience and task evidence."),
      ],
      expert: "Review evidence should test whether support improves meaningful access and independence. Successful support may need adaptation or fading rather than becoming permanent by default.",
    },
  };

  if (category === "Leadership") return {
    practice: {
      label: "Implementation-plan snapshot",
      summary: "A department has drafted an implementation plan. Inspect whether it diagnoses the problem or simply increases pressure and activity.",
      hotspots: [
        hotspot(0, "purpose", "Purpose is clear", false, "The team can explain the intended practice and the problem it is meant to solve.", "Keep the purpose explicit and connected to pupil/staff outcomes."),
        hotspot(1, "league", "Public staff ranking", true, "A league table is being used as the main implementation measure, which can distort learning and does not diagnose barriers.", "Use implementation evidence to support improvement rather than rank staff."),
        hotspot(2, "barriers", "Clarity/capability/capacity checked", false, "The plan distinguishes different implementation barriers before choosing support.", "Continue diagnosing the barrier before prescribing a response."),
        hotspot(3, "initiative", "Second initiative added", true, "A new initiative is launched when workload rises, increasing implementation load instead of fixing the first problem.", "Remove friction or narrow the implementation focus before adding more."),
        hotspot(4, "review", "Review point and evidence named", false, "The plan states what will be reviewed and when.", "Keep review evidence linked to the intended practice and outcome."),
        hotspot(5, "uniform", "Exact uniformity required", true, "The plan treats every surface feature as non-negotiable even when context differs.", "Clarify the core principle and minimum expected practice while allowing justified professional adaptation."),
      ],
      expert: "Strong implementation plans make purpose clear, diagnose barriers and protect capacity. They avoid ranking, initiative overload and unnecessary uniformity.",
    },
    audit: {
      label: "Leadership evidence-board audit",
      summary: "A leadership review board is being prepared. Inspect whether the evidence will actually help the team decide what to keep, adapt or stop.",
      hotspots: [
        hotspot(0, "implementation", "Implementation evidence included", false, "The board shows whether the intended practice is understood and being used.", "Keep implementation evidence separate from claims about impact."),
        hotspot(1, "snapshot", "Single walk-through used as verdict", true, "One brief observation is treated as conclusive evidence of implementation quality.", "Use proportionate evidence across time and contexts."),
        hotspot(2, "capacity", "Capacity barriers visible", false, "The board records workload/system barriers that affect implementation.", "Keep capacity evidence alongside capability and clarity evidence."),
        hotspot(3, "causal", "Causal impact claimed too early", true, "The board claims the initiative caused an outcome without sufficient evidence.", "Separate implementation evidence from cautious evaluation of impact."),
        hotspot(4, "adapt", "Keep/adapt/stop decision built in", false, "The review requires an implementation decision rather than automatic continuation.", "Keep explicit decision rules tied to evidence."),
        hotspot(5, "names", "Named staff comparison", true, "The board compares individual staff rather than identifying common implementation conditions.", "Use aggregate themes for development and avoid individual ranking."),
      ],
      expert: "A useful leadership evidence board separates implementation from impact, shows system conditions and supports keep/adapt/stop decisions without turning CPD into staff ranking.",
    },
  };

  if (category === "Wellbeing") return {
    practice: {
      label: "Wellbeing action-plan snapshot",
      summary: "A staff wellbeing action plan is ready for launch. Inspect whether it changes the source of pressure or mainly adds another activity.",
      hotspots: [
        hotspot(0, "friction", "Specific workload friction named", false, "The plan identifies the duplicated process or pressure it intends to reduce.", "Keep the problem specific enough to change and measure."),
        hotspot(1, "resilience", "Resilience workshop as main fix", true, "The plan treats a system/workload problem mainly as an individual coping problem.", "Address controllable organisational causes alongside optional individual support."),
        hotspot(2, "choice", "Support without forced disclosure", false, "Staff can access support without being required to disclose personal information publicly.", "Keep support voluntary and appropriately confidential."),
        hotspot(3, "extra", "New form added to monitor wellbeing", true, "The intervention adds administrative load while claiming to reduce pressure.", "Avoid measurement approaches that recreate the workload problem."),
        hotspot(4, "measure", "Reduction in friction measured", false, "The plan checks whether the targeted workload problem actually reduces.", "Keep outcome measures connected to the original pressure."),
        hotspot(5, "attendance", "Success = event attendance", true, "Attendance at a wellbeing activity is treated as evidence that wellbeing or workload improved.", "Measure the intended system or wellbeing outcome rather than participation alone."),
      ],
      expert: "Good wellbeing design starts with the source of pressure, avoids adding friction, keeps support voluntary and checks whether the targeted workload/system problem actually improves.",
    },
    audit: {
      label: "Workload-impact audit",
      summary: "The initiative has run for a term. Inspect the review before leaders decide whether to keep it.",
      hotspots: [
        hotspot(0, "time", "Time/duplication measure", false, "The review checks whether the intended workload friction reduced.", "Keep measures tied to the problem the intervention was designed to change."),
        hotspot(1, "liked", "Positive comments used as proof", true, "Enjoyment or positive reaction is treated as sufficient evidence of impact.", "Distinguish reaction from changes in workload, systems or wellbeing outcomes."),
        hotspot(2, "choice", "Different staff experiences considered", false, "The review recognises that the same initiative may affect roles differently.", "Keep role/context variation visible when interpreting evidence."),
        hotspot(3, "nochange", "Underlying process unchanged", true, "The review recommends continuing even though the original duplicated process remains intact.", "Return to the root cause if the intended friction has not changed."),
        hotspot(4, "adapt", "Adapt/stop option included", false, "The team can change or stop the initiative rather than treating continuation as automatic.", "Keep explicit decision rules."),
        hotspot(5, "more", "Add another wellbeing activity", true, "The proposed response to weak impact is to add more activity rather than redesign the system problem.", "Reduce or redesign before layering on another initiative."),
      ],
      expert: "Wellbeing review should distinguish reaction from outcome, return to the system cause and allow leaders to adapt or stop activity that does not reduce the targeted pressure.",
    },
  };

  if (category === "Digital Teaching") return {
    practice: {
      label: "AI workflow snapshot",
      summary: "A team wants to use an AI workflow with pupils and staff. Inspect whether the plan protects purpose, privacy, accessibility and professional judgement.",
      hotspots: [
        hotspot(0, "purpose", "Educational purpose named", false, "The workflow begins with a clear educational/professional purpose rather than starting with the tool.", "Keep the intended outcome explicit."),
        hotspot(1, "data", "Sensitive data entered freely", true, "The plan leaves staff to decide individually what sensitive information is safe to enter.", "Use clear shared data/privacy boundaries."),
        hotspot(2, "verify", "Important outputs verified", false, "The workflow requires human checking before important content is used.", "Keep verification proportionate to the stakes of the output."),
        hotspot(3, "confidence", "Polished wording trusted", true, "Fluent, confident output is treated as evidence of accuracy.", "Verify claims and retain human responsibility for the final decision."),
        hotspot(4, "access", "Accessibility check included", false, "The team checks whether the workflow creates access barriers for pupils or staff.", "Keep accessibility part of the implementation decision."),
        hotspot(5, "rollout", "Immediate whole-school rollout", true, "The workflow is scaled before benefit, safety and implementation conditions have been tested.", "Pilot, verify and set guardrails before wider rollout."),
      ],
      expert: "A safe digital workflow starts with purpose, protects data and access, verifies important outputs and scales only after benefit and guardrails are clear.",
    },
    audit: {
      label: "Digital evidence audit",
      summary: "The pilot is complete. Inspect the evidence leaders are using to decide whether the workflow should scale.",
      hotspots: [
        hotspot(0, "benefit", "Intended outcome measured", false, "The review checks whether the tool improved the actual learning/workload outcome.", "Keep benefit evidence tied to the original purpose."),
        hotspot(1, "speed", "Speed treated as sufficient", true, "Time saving alone is treated as proof that the workflow is effective and safe.", "Balance efficiency with accuracy, privacy, accessibility and professional quality."),
        hotspot(2, "errors", "Error patterns reviewed", false, "The team records what kinds of outputs require correction.", "Use error evidence to design verification expectations."),
        hotspot(3, "optout", "Accessibility issues ignored", true, "The review notes access problems but proposes scaling without adaptation.", "Resolve or mitigate access barriers before wider use."),
        hotspot(4, "human", "Human sign-off retained", false, "Professional responsibility remains with the staff member using the output.", "Keep clear human oversight for consequential decisions."),
        hotspot(5, "personalrules", "Each staff member sets own safety rules", true, "Inconsistent personal rules replace shared school guardrails.", "Set shared minimum boundaries for privacy, verification and use."),
      ],
      expert: "Scaling decisions should weigh real benefit against error, privacy and accessibility evidence, with shared guardrails and human accountability retained.",
    },
  };

  return {
    practice: {
      label: "Lesson-plan snapshot",
      summary: "A lesson plan looks organised and busy. Inspect whether it actually creates useful evidence of pupil thinking and responsive teaching decisions.",
      hotspots: [
        hotspot(0, "goal", "Learning goal is precise", false, "The intended learning is clear enough to judge whether pupils are progressing.", "Keep the learning goal specific and visible."),
        hotspot(1, "volunteer", "One volunteer checks understanding", true, "A single confident pupil is used as evidence for the whole class.", "Sample thinking across the class using a method that makes misconceptions visible."),
        hotspot(2, "sample", "All-pupil check planned", false, "The plan includes a check that samples more than one pupil's thinking.", "Keep a planned evidence point before the next teaching move."),
        hotspot(3, "busy", "Busy = learning", true, "The plan treats quiet task completion as proof of understanding.", "Distinguish participation/compliance from evidence of learning."),
        hotspot(4, "adapt", "Response to misconception planned", false, "The teacher has a clear next move if the evidence shows a predictable misconception.", "Keep the lesson responsive rather than locked to the original script."),
        hotspot(5, "same", "Same routine for every class", true, "The plan assumes a routine that worked elsewhere should be repeated unchanged despite different evidence/context.", "Keep the principle but adapt the surface routine to the class and evidence."),
      ],
      expert: "Strong lesson planning links a precise goal to evidence of pupil thinking and a responsive next move. Visible busyness or one volunteer is not enough evidence of learning.",
    },
    audit: {
      label: "Feedback-and-evidence audit",
      summary: "A teacher reviews a lesson and the feedback that followed. Inspect whether the evidence supports a useful next professional decision.",
      hotspots: [
        hotspot(0, "thinking", "Pupil thinking sampled", false, "The review uses evidence that reveals what pupils understood or misunderstood.", "Keep evidence close to the intended learning."),
        hotspot(1, "praise", "Generic praise treated as feedback", true, "The review counts broad praise as if it tells pupils what to improve next.", "Use feedback that is actionable and connected to the learning goal."),
        hotspot(2, "misconception", "Specific misconception identified", false, "The review names the misconception rather than simply saying pupils 'struggled'.", "Keep diagnosis precise enough to change the next teaching move."),
        hotspot(3, "quantity", "More work = better learning", true, "The review assumes a larger quantity of completed work demonstrates deeper learning.", "Use evidence of understanding, retention or transfer rather than volume alone."),
        hotspot(4, "review", "Next check is planned", false, "The teacher decides how the revised approach will be checked next time.", "Keep the evidence loop open until the intended outcome is tested again."),
        hotspot(5, "blame", "Weak outcome blamed on motivation only", true, "The review jumps to a motivation explanation without checking task, explanation, prior knowledge or evidence quality.", "Diagnose the learning/implementation problem before attributing cause."),
      ],
      expert: "Useful lesson review moves from evidence of pupil thinking to a precise diagnosis and a testable next move. It avoids generic praise, output volume and unsupported causal assumptions.",
    },
  };
}

export function getPhase15Scenes(course: Course): Phase15Scene[] {
  const id = safeId(course.id);
  const a = anchors(course);
  const lens = categoryScenes(course.category);
  return [
    {
      id: `phase15-${id}-practice`, kind: "practice_snapshot", anchorId: a.concept,
      title: "Spot the problem · practice snapshot", strapline: "Inspect the scene before seeing the expert annotation.",
      instruction: "Select exactly three hotspots that weaken the professional response. Three other hotspots are defensible features.",
      sceneLabel: lens.practice.label, sceneSummary: lens.practice.summary, targetProblems: 3,
      hotspots: lens.practice.hotspots, expertSummary: lens.practice.expert,
    },
    {
      id: `phase15-${id}-audit`, kind: "evidence_audit", anchorId: a.evidence,
      title: "Spot the problem · evidence audit", strapline: "Decide what should survive professional scrutiny.",
      instruction: "Select exactly three hotspots that would need changing before this evidence or plan is relied upon.",
      sceneLabel: lens.audit.label, sceneSummary: lens.audit.summary, targetProblems: 3,
      hotspots: lens.audit.hotspots, expertSummary: lens.audit.expert,
    },
  ];
}

export function getPhase15SceneForModule(course: Course, module: Module | undefined | null) {
  if (!module) return null;
  return getPhase15Scenes(course).find(scene => scene.anchorId === module.id) || null;
}

export function validateSpotProblemPhase15(course: Course) {
  const scenes = getPhase15Scenes(course);
  if (scenes.length !== 2) throw new Error(`Phase 15 ${course.id}: requires two spot-the-problem scenes`);
  if (new Set(scenes.map(scene => scene.kind)).size !== 2) throw new Error(`Phase 15 ${course.id}: requires both scene kinds`);
  for (const scene of scenes) {
    if (!scene.anchorId || !course.modules.some(module => module.id === scene.anchorId)) throw new Error(`Phase 15 ${course.id}: ${scene.kind} anchor is missing`);
    if (scene.hotspots.length !== 6) throw new Error(`Phase 15 ${course.id}: ${scene.kind} requires six hotspots`);
    if (scene.targetProblems !== 3 || scene.hotspots.filter(item => item.problem).length !== 3) throw new Error(`Phase 15 ${course.id}: ${scene.kind} requires exactly three problem hotspots`);
    if (new Set(scene.hotspots.map(item => item.id)).size !== 6) throw new Error(`Phase 15 ${course.id}: ${scene.kind} hotspot ids must be unique`);
    for (const item of scene.hotspots) {
      if (!item.annotation.trim() || !item.expertAction.trim()) throw new Error(`Phase 15 ${course.id}: ${scene.kind}/${item.id} needs annotation and expert action`);
      if (item.x < 0 || item.x > 100 || item.y < 0 || item.y > 100) throw new Error(`Phase 15 ${course.id}: ${scene.kind}/${item.id} hotspot position is invalid`);
    }
    if (!scene.expertSummary.trim()) throw new Error(`Phase 15 ${course.id}: ${scene.kind} needs an expert summary`);
  }
  return true;
}

export function auditSpotProblemPhase15(course: Course): Phase15Audit {
  const scenes = getPhase15Scenes(course);
  let ready = true;
  try { validateSpotProblemPhase15(course); } catch { ready = false; }
  const hotspots = scenes.reduce((sum, scene) => sum + scene.hotspots.length, 0);
  const problems = scenes.reduce((sum, scene) => sum + scene.hotspots.filter(item => item.problem).length, 0);
  const annotations = scenes.reduce((sum, scene) => sum + scene.hotspots.filter(item => item.annotation.trim() && item.expertAction.trim()).length, 0);
  const kinds = new Set(scenes.map(scene => scene.kind)).size;
  const score = Math.min(100,
    (scenes.length === 2 ? 25 : 0) +
    (hotspots === 12 ? 20 : 0) +
    (problems === 6 ? 20 : 0) +
    (annotations === 12 ? 20 : 0) +
    (kinds === 2 ? 5 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, scenes: scenes.length, hotspots, problems, annotations, kinds, ready, score };
}

export function summariseSpotProblemPhase15(courses: Course[]) {
  const reports = courses.map(auditSpotProblemPhase15);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalScenes: reports.reduce((sum, report) => sum + report.scenes, 0),
    totalHotspots: reports.reduce((sum, report) => sum + report.hotspots, 0),
    totalProblems: reports.reduce((sum, report) => sum + report.problems, 0),
    totalAnnotations: reports.reduce((sum, report) => sum + report.annotations, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
