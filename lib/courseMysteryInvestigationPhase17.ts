import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE17_VERSION = "2026.18";

export type Phase17EvidenceKind = "pupil_voice" | "observation" | "work_sample" | "context";
export type Phase17Evidence = {
  id: string;
  kind: Phase17EvidenceKind;
  label: string;
  source: string;
  content: string;
  prompt: string;
};
export type Phase17Judgement = {
  id: string;
  label: string;
  feedback: string;
  strongest: boolean;
};
export type Phase17MysteryPack = {
  id: string;
  anchorId: string;
  title: string;
  brief: string;
  question: string;
  evidence: Phase17Evidence[];
  judgements: Phase17Judgement[];
  expertSynthesis: string;
  nextActionPrompt: string;
};
export type Phase17Audit = {
  courseId: string;
  title: string;
  mysteries: number;
  evidenceItems: number;
  evidenceKinds: number;
  judgements: number;
  stagedUnlock: boolean;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function anchorId(course: Course) {
  return `overhaul4-case-${safeId(course.id)}-2-transfer`;
}

type Lens = {
  title: string;
  brief: string;
  question: string;
  pupil: string;
  observation: string;
  work: string;
  context: string;
  strong: string;
  plausible: string;
  weak: string;
  synthesis: string;
  action: string;
};

function categoryLens(category: CourseCategory, course: Course): Lens {
  if (category === "Safeguarding") return {
    title: "Mystery case · what does the evidence actually justify?",
    brief: "A member of staff has noticed several pieces of information that may or may not connect. Your job is to build a factual picture without investigating, leading or filling gaps with assumptions.",
    question: "What professional judgement is justified, and what must remain with the school's safeguarding process?",
    pupil: "The pupil says that things have felt difficult recently and asks whether they can speak somewhere quieter. They do not give a full explanation and should not be pressed to do so.",
    observation: "A factual record from earlier in the week notes a change from the pupil's usual presentation. It records what was seen and heard, not a diagnosis or explanation.",
    work: "A piece of school work contains a brief comment that could be relevant, but its meaning is not clear without context and should not be interpreted as proof of a specific event.",
    context: "The school's current procedure states that concerns should be recorded factually and passed promptly through the designated safeguarding route; classroom staff should not investigate.",
    strong: "There is enough factual information to record and pass the concern through the school's safeguarding route, while being explicit about what is known, what is reported and what remains uncertain.",
    plausible: "The clues probably point to one particular explanation, so the record should name that explanation to help the safeguarding lead act quickly.",
    weak: "The evidence is too incomplete to justify any action until the pupil gives a clearer account.",
    synthesis: "The evidence supports professional curiosity and prompt reporting, not a staff-led investigation or a confident causal conclusion. Good safeguarding judgement preserves uncertainty accurately while using the correct route.",
    action: "Write the factual next action you would take without including identifiable or confidential pupil information.",
  };
  if (category === "SEND") return {
    title: "Mystery case · what is the barrier?",
    brief: "A learner is completing less of a demanding task than expected. Several explanations have been suggested, but each piece of evidence tells a different part of the story.",
    question: "Which barrier is most defensible to act on first without lowering the learning goal?",
    pupil: "The learner says they understand the topic when it is discussed but lose track of what to do when the task has several written steps and a long model on the page.",
    observation: "During guided practice the learner answers accurately when one step is visible at a time, but pauses for a long time when the full independent task is presented.",
    work: "The completed section is accurate and uses the required subject knowledge. Errors increase mainly where several instructions must be held in mind at once.",
    context: "The intended learning outcome is appropriate and ambitious. Existing support guidance emphasises adapting access to the task and reviewing independence rather than automatically reducing challenge.",
    strong: "The first barrier to test is the task's multi-step access demand; preserve the learning goal, make the sequence more visible and review whether independent initiation improves.",
    plausible: "The learner needs a permanently simplified version of this type of task because the full task is currently incomplete.",
    weak: "The learner is probably unmotivated because they can answer verbally but do not finish the written task.",
    synthesis: "Across the evidence, subject understanding appears stronger than independent navigation of the multi-step task. A proportionate access adaptation can be tested without lowering ambition or turning a temporary scaffold into a permanent plan.",
    action: "State the smallest adaptation you would test and the evidence you would use to decide whether to keep, fade or change it.",
  };
  if (category === "Leadership") return {
    title: "Mystery case · why is implementation uneven?",
    brief: "A shared practice is visible across the team, but implementation quality varies. It would be easy to label this as a motivation problem before checking the system conditions.",
    question: "What is the most defensible implementation diagnosis to test first?",
    pupil: "Learner feedback suggests the routine is clear and useful in some classes but feels different or unpredictable in others.",
    observation: "Learning walks show that most staff are attempting the agreed routine, although several versions have developed and some omit the part intended to reveal learner thinking.",
    work: "Planning and review samples show that teams understand the broad purpose, but there is no shared example of the smallest non-negotiable version of the practice.",
    context: "The change was introduced during a high-workload period. Some staff had modelling and rehearsal; others received only written guidance.",
    strong: "Test clarity, capability and capacity before attributing inconsistency to motivation; define the smallest non-negotiable practice and target support where the evidence shows a barrier.",
    plausible: "Increase monitoring first because tighter accountability will reveal who is not implementing the routine properly.",
    weak: "Replace the initiative because variation proves the approach cannot work consistently across a school.",
    synthesis: "The evidence points to an implementation problem with uneven clarity, rehearsal and capacity. Monitoring can describe variation, but it cannot by itself diagnose or remove the conditions producing it.",
    action: "Write the first implementation change you would make and the evidence you would collect before the next review.",
  };
  if (category === "Wellbeing") return {
    title: "Mystery case · what is creating the pressure?",
    brief: "Staff report that workload pressure remains high even though a recent wellbeing initiative was positively received. The visible story and the system evidence do not fully match.",
    question: "Which controllable source of pressure should be tested before adding another wellbeing activity?",
    pupil: "Where relevant, learner-facing staff report that competing deadlines make it harder to give timely feedback and maintain predictable routines during the busiest weeks.",
    observation: "A workflow review shows the same information being entered into two systems and several deadlines clustering in the same fortnight.",
    work: "Calendar and task samples show that the wellbeing activity itself is well attended, but it has not removed any existing reporting, meeting or duplication requirement.",
    context: "Staff feedback is mixed: they value the initiative but repeatedly identify duplication and deadline congestion as the pressures they would most like changed.",
    strong: "Test whether removing duplication or redesigning deadline patterns reduces workload friction, while keeping appropriate individual support available.",
    plausible: "Expand the popular wellbeing initiative because positive participation shows it is helping staff manage the pressure.",
    weak: "The remaining pressure is mainly an individual resilience issue because the school has already provided a wellbeing programme.",
    synthesis: "Positive reception is not the same as reduced workload. The combined evidence points to controllable system friction that can be changed and then checked against workload evidence.",
    action: "Name one system change you would test and what evidence would show that pressure actually reduced rather than simply felt better temporarily.",
  };
  if (category === "Digital Teaching") return {
    title: "Mystery case · useful tool or hidden risk?",
    brief: "A digital workflow linked to this course appears to save time and produces polished outputs, but staff experience is mixed and one output has raised questions.",
    question: "What should be checked before the workflow is scaled further?",
    pupil: "Learner feedback says the digital material is clear for many users, but one format is difficult to access and some generated explanations use unfamiliar wording.",
    observation: "Staff complete the workflow faster, but checking practice varies: some verify every important output while others assume polished language indicates accuracy.",
    work: "A sample output is mostly useful but contains one subtle factual error and an accessibility issue that would be easy to miss during a busy week.",
    context: "The school's expectations require appropriate privacy, accessibility and human professional oversight. Different tasks carry different levels of risk.",
    strong: "Keep the useful workflow only with explicit verification, privacy and accessibility checks matched to the risk of the task before scaling it further.",
    plausible: "Scale the workflow because the time saving is established, then correct individual errors as users report them.",
    weak: "Stop all use of the tool because one flawed output shows that digital support is unreliable.",
    synthesis: "The evidence supports conditional use rather than automatic adoption or rejection. The benefit survives only when verification, privacy, accessibility and human responsibility remain part of the workflow.",
    action: "Write the safe-use boundary and human check you would require before this workflow is used more widely.",
  };
  return {
    title: "Mystery case · what is really happening in the learning?",
    brief: `A strategy linked to ${course.title} appears successful at first glance, but pupil voice, observation and work evidence do not all tell the same story.`,
    question: "What does the combined evidence justify changing in the next teaching move?",
    pupil: "Several pupils say the lesson feels clear when the teacher models the process, but some are unsure how to begin when the support is removed.",
    observation: "Participation is high during whole-class interaction. When every pupil must respond independently, a specific misconception appears in a sizeable minority of answers.",
    work: "Completed work looks neat and substantial, but the same misconception appears in several different examples, including from pupils who were visibly engaged.",
    context: "The next lesson requires pupils to apply the same idea in a less familiar context, so surface fluency is unlikely to be enough.",
    strong: "Treat the misconception as the priority: use a focused check, reteach or contrast the idea, then test independent application before moving on.",
    plausible: "Keep the lesson sequence unchanged because engagement and quantity of completed work suggest the strategy is broadly successful.",
    weak: "Add more explanation for the whole class immediately without first identifying which pupils hold the misconception or why.",
    synthesis: "The strongest evidence comes from the pattern across independent responses and work, not visible engagement alone. The next move should target the misconception and then check whether understanding transfers.",
    action: "Write the next teaching move and the specific evidence you would collect to decide whether understanding has improved.",
  };
}

export function getPhase17MysteryPack(course: Course): Phase17MysteryPack {
  const id = safeId(course.id);
  const lens = categoryLens(course.category, course);
  return {
    id: `phase17-${id}`,
    anchorId: anchorId(course),
    title: lens.title,
    brief: lens.brief,
    question: lens.question,
    evidence: [
      { id: "pupil", kind: "pupil_voice", label: "Pupil / participant voice", source: "VOICE", content: lens.pupil, prompt: "What does this add to your current hypothesis? Name what you know and what you still cannot assume." },
      { id: "observation", kind: "observation", label: "Observation", source: "OBSERVATION", content: lens.observation, prompt: "How does this observation strengthen, weaken or complicate your first explanation?" },
      { id: "work", kind: "work_sample", label: "Work / record sample", source: "EVIDENCE SAMPLE", content: lens.work, prompt: "What pattern is now visible across the evidence, and which explanation is becoming less defensible?" },
      { id: "context", kind: "context", label: "Context information", source: "CONTEXT", content: lens.context, prompt: "What changes once the wider context or professional boundary is included?" },
    ],
    judgements: [
      { id: "evidence-led", label: lens.strong, feedback: "This conclusion stays within what the combined evidence can support and leads to a proportionate next step.", strongest: true },
      { id: "overreach", label: lens.plausible, feedback: "This is plausible, but it moves beyond the evidence or treats one visible signal as stronger than the full pattern.", strongest: false },
      { id: "assumption", label: lens.weak, feedback: "This conclusion either attributes cause too quickly or delays action despite enough evidence for a proportionate professional response.", strongest: false },
    ],
    expertSynthesis: lens.synthesis,
    nextActionPrompt: lens.action,
  };
}

export function validateMysteryInvestigationPhase17(course: Course) {
  const pack = getPhase17MysteryPack(course);
  if (!course.modules.some(module => module.id === pack.anchorId)) throw new Error(`Phase 17 ${course.id}: mystery anchor is missing`);
  if (pack.evidence.length !== 4) throw new Error(`Phase 17 ${course.id}: requires four staged evidence items`);
  const kinds = new Set(pack.evidence.map(item => item.kind));
  if (kinds.size !== 4) throw new Error(`Phase 17 ${course.id}: requires pupil voice, observation, work sample and context`);
  if (pack.evidence.some(item => !item.content.trim() || !item.prompt.trim())) throw new Error(`Phase 17 ${course.id}: all evidence needs content and a processing prompt`);
  if (pack.judgements.length !== 3 || pack.judgements.filter(item => item.strongest).length !== 1) throw new Error(`Phase 17 ${course.id}: requires three judgements with one strongest evidence-led conclusion`);
  if (!pack.expertSynthesis.trim() || !pack.nextActionPrompt.trim()) throw new Error(`Phase 17 ${course.id}: expert synthesis and transfer prompt are required`);
  return true;
}

export function auditMysteryInvestigationPhase17(course: Course): Phase17Audit {
  const pack = getPhase17MysteryPack(course);
  let ready = true;
  try { validateMysteryInvestigationPhase17(course); } catch { ready = false; }
  const evidenceKinds = new Set(pack.evidence.map(item => item.kind)).size;
  const score = Math.min(100,
    (course.modules.some(module => module.id === pack.anchorId) ? 20 : 0) +
    (pack.evidence.length === 4 ? 20 : 0) +
    (evidenceKinds === 4 ? 20 : 0) +
    (pack.judgements.length === 3 ? 15 : 0) +
    (pack.evidence.every(item => item.prompt.trim().length > 20) ? 15 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, mysteries: 1, evidenceItems: pack.evidence.length, evidenceKinds, judgements: pack.judgements.length, stagedUnlock: pack.evidence.length === 4, ready, score };
}

export function summariseMysteryInvestigationPhase17(courses: Course[]) {
  const reports = courses.map(auditMysteryInvestigationPhase17);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalMysteries: reports.length,
    totalEvidenceItems: reports.reduce((sum, report) => sum + report.evidenceItems, 0),
    totalJudgements: reports.reduce((sum, report) => sum + report.judgements, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
