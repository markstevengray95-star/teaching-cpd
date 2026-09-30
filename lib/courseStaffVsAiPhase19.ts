import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE19_VERSION = "2026.20";

export type Phase19IssueKind = "assumption" | "omission" | "judgement" | "distractor";
export type Phase19Issue = {
  id: string;
  kind: Phase19IssueKind;
  label: string;
  explanation: string;
  correct: boolean;
};
export type Phase19ChallengePack = {
  id: string;
  anchorId: string;
  title: string;
  brief: string;
  staffPrompt: string;
  aiResponse: string;
  issues: Phase19Issue[];
  rewritePrompt: string;
  expertPrinciples: string[];
};
export type Phase19Audit = {
  courseId: string;
  title: string;
  challenges: number;
  issueOptions: number;
  trueIssues: number;
  issueKinds: number;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function anchorId(course: Course) {
  return `overhaul9-synthesis-${safeId(course.id)}-ready`;
}

type Lens = {
  title: string;
  brief: string;
  prompt: string;
  ai: string;
  assumption: [string,string];
  omission: [string,string];
  judgement: [string,string];
  distractors: [string,string][];
  rewrite: string;
  principles: string[];
};

function categoryLens(category: CourseCategory, course: Course): Lens {
  if (category === "Safeguarding") return {
    title: "Staff vs AI · safeguard the professional judgement",
    brief: "Answer before seeing the AI response. Then audit the AI for over-confidence, missing safeguarding boundaries and decisions that should remain with the school's current procedure and designated staff.",
    prompt: "A pupil shares incomplete information that could indicate a safeguarding concern. What should you do next, and what should you deliberately avoid doing?",
    ai: "I would first ask the pupil several follow-up questions so I can establish exactly what happened and whether the concern is serious. If the story seems credible, I would write a detailed interpretation of what I think is happening and let relevant colleagues know to watch the pupil closely. Once I have enough evidence, I would pass the case to the safeguarding lead.",
    assumption: ["The AI treats credibility as something the classroom member of staff can establish", "Staff do not need to prove a concern or decide whether a pupil's account is credible before using the safeguarding route."],
    omission: ["The AI omits the need to use the school's current reporting procedure promptly", "The response should explicitly record factual information and pass the concern through the agreed safeguarding route without waiting for a complete account."],
    judgement: ["The AI moves the member of staff into an investigative role", "Detailed follow-up questioning, causal interpretation and wider informal sharing exceed the ordinary staff role and can damage a clear safeguarding process."],
    distractors: [["The AI response is too short", "Length is not the issue; the problem is professional boundary and evidence quality."],["The AI should use more technical safeguarding vocabulary", "Extra jargon would not fix the unsafe reasoning."],["The AI should make the pupil promise to tell the truth", "That would be inappropriate and is not a defensible safeguarding improvement."]],
    rewrite: "Rewrite the response so it is calm, factual, prompt and firmly within the member of staff's safeguarding role.",
    principles: ["Listen without investigating", "Separate fact from interpretation", "Use the current school safeguarding route promptly", "Do not promise secrecy or spread information beyond those who need it"],
  };
  if (category === "SEND") return {
    title: "Staff vs AI · challenge the generic SEND answer",
    brief: "Answer first, then test whether the AI has turned a label into a teaching plan or confused task completion with successful support.",
    prompt: "A learner can explain the key idea verbally but struggles to start a multi-step written task independently. What would you change first?",
    ai: "Because the learner has additional needs, I would simplify the work, reduce the amount they need to complete and give them an adult to prompt every stage. Consistent support is important, so I would keep the same adjustments in future lessons if the pupil finishes the task successfully.",
    assumption: ["The AI assumes a broad label tells us which support the learner needs", "Support should respond to the observed barrier and task demand rather than a category or diagnosis alone."],
    omission: ["The AI does not check independence or plan how support will be faded", "Completion is not enough; the plan should collect evidence about access, accuracy and growing independence."],
    judgement: ["The AI lowers the learning demand before testing a smaller access adaptation", "A more defensible response preserves the intended learning goal and changes the route only as much as the evidence justifies."],
    distractors: [["The AI uses the word learner instead of pupil", "Terminology is not the weakness in the reasoning."],["The response needs a longer list of interventions", "More strategies would increase generic support rather than improve the diagnosis."],["The AI should always remove written work", "That would replace one blanket response with another."]],
    rewrite: "Rewrite the plan so it identifies the barrier, preserves ambition and includes evidence for fading, keeping or changing support.",
    principles: ["Identify the barrier before selecting support", "Keep the intended learning goal where appropriate", "Use the smallest useful scaffold", "Review independence and fade support when evidence justifies it"],
  };
  if (category === "Leadership") return {
    title: "Staff vs AI · audit the leadership shortcut",
    brief: "Answer first, then identify where the AI mistakes visible inconsistency for an individual compliance problem instead of diagnosing implementation conditions.",
    prompt: "A team is implementing an agreed practice inconsistently. What should a leader do before deciding that staff need tighter monitoring?",
    ai: "The fastest solution is to make the expectation non-negotiable, monitor every member of staff weekly and publish examples of who is meeting the standard. Staff who are still inconsistent after a month should receive extra scrutiny because the variation shows the initiative has not been taken seriously enough.",
    assumption: ["The AI assumes inconsistency mainly reflects weak motivation or seriousness", "Variation can result from unclear expectations, uneven modelling, capability gaps, workload or legitimate contextual adaptation."],
    omission: ["The AI omits diagnosis of clarity, capability and capacity", "Before increasing monitoring, leaders need evidence about what is preventing reliable implementation."],
    judgement: ["The AI uses surveillance and comparison as the primary improvement strategy", "Monitoring can describe implementation, but it should not replace modelling, support and a clear shared definition of the intended practice."],
    distractors: [["The AI should use more leadership terminology", "Jargon would not address the underlying implementation error."],["The AI should make the initiative optional", "The problem is not solved by abandoning clarity."],["The AI should add several new priorities", "Adding more change would likely increase implementation noise."]],
    rewrite: "Rewrite the leadership response so it diagnoses the barrier, clarifies the smallest non-negotiable practice and sets an evidence-led review point.",
    principles: ["Clarity before monitoring", "Diagnose implementation barriers", "Target support to the barrier", "Review impact and workload as well as visible compliance"],
  };
  if (category === "Wellbeing") return {
    title: "Staff vs AI · separate wellbeing support from system repair",
    brief: "Answer first, then challenge an AI response that sounds supportive but leaves avoidable workload and system friction unchanged.",
    prompt: "Staff say workload pressure is high and repeatedly mention duplicated processes and clustered deadlines. What would you change first?",
    ai: "I would arrange a wellbeing week, provide resilience resources and encourage staff to set firmer personal boundaries. Managers could check in with colleagues who continue to feel overwhelmed. If stress remains high, the school could offer more optional wellbeing activities and time-management guidance.",
    assumption: ["The AI assumes the main solution sits with individual coping", "The evidence points to controllable organisational friction, so a system-level response should be tested as well as offering individual support."],
    omission: ["The AI leaves the duplicated processes and deadline design untouched", "The response should change at least one identified source of avoidable workload and then measure whether pressure reduces."],
    judgement: ["The AI treats positive wellbeing activity as a substitute for workload improvement", "Supportive activities can have value, but they should not obscure preventable system causes of pressure."],
    distractors: [["The AI response needs a wellbeing slogan", "Presentation language is not the substantive problem."],["All individual support should be removed", "System change and appropriate individual support can coexist."],["The school should cancel every deadline", "The aim is better system design, not removal of necessary work."]],
    rewrite: "Rewrite the response so it changes a controllable source of workload and defines evidence that would show the change helped.",
    principles: ["Target controllable system friction", "Keep appropriate individual support available", "Measure workload change rather than participation alone", "Avoid adding wellbeing activity that becomes more work"],
  };
  if (category === "Digital Teaching") return {
    title: "Staff vs AI · critique an AI answer about AI",
    brief: "Answer first, then audit whether the generated response protects privacy, accuracy, accessibility and human professional responsibility.",
    prompt: "A digital or AI-supported workflow appears to save staff time. What conditions should be in place before it is scaled?",
    ai: "If the tool saves time and the outputs look professional, the school should roll it out quickly. Staff can decide what information to enter based on their own judgement and should skim the output before using it. Any mistakes can be corrected later, and users who need accessibility adjustments can request them once the workflow is established.",
    assumption: ["The AI assumes polished output and time saving are enough evidence of quality", "Apparent fluency does not establish accuracy, educational suitability or safe use."],
    omission: ["The AI omits an explicit privacy and accessibility design boundary", "Approved use should define appropriate data handling and accessibility before rollout, not after problems appear."],
    judgement: ["The AI weakens human verification and responsibility", "A human professional remains responsible for important factual, evaluative or pupil-facing decisions and should verify outputs according to risk."],
    distractors: [["The AI should always recommend the newest model", "Model novelty is not the central professional issue."],["The tool should never be used for any school task", "The evidence supports conditional, governed use rather than automatic rejection."],["Staff should write longer prompts", "Prompt length does not solve governance, verification or accessibility."]],
    rewrite: "Rewrite the rollout advice so the educational benefit survives alongside privacy, accessibility, verification and human oversight.",
    principles: ["Start with a defined professional purpose", "Protect appropriate data boundaries", "Verify important outputs", "Keep accessibility and human accountability inside the workflow"],
  };
  return {
    title: "Staff vs AI · beat the plausible teaching answer",
    brief: `Answer from your own professional reasoning before seeing the AI response. Then test whether the AI has mistaken visible engagement for learning in ${course.title}.`,
    prompt: "A class appears engaged and completes plenty of work, but a later check shows a repeated misconception in a sizeable group. What should happen next?",
    ai: "The lesson was mostly successful because participation and work completion were high. I would repeat the explanation for the whole class, give more practice questions and keep the same routine so pupils become more confident. The misconception should reduce with enough repetition and exposure.",
    assumption: ["The AI assumes visible engagement and work quantity are reliable evidence of secure learning", "The repeated misconception in independent responses is stronger evidence about what needs teaching next."],
    omission: ["The AI does not diagnose the misconception or make pupil reasoning visible", "A stronger response uses a focused check or contrast that reveals why pupils are choosing the wrong idea."],
    judgement: ["The AI recommends more of the same without a review rule", "Professional judgement should connect the next move to evidence and specify what would make the teacher keep, adapt or change it."],
    distractors: [["The AI should make the lesson more entertaining", "Engagement is not the missing evidence."],["The AI should remove all practice questions", "Practice can be useful when it is diagnostic and well targeted."],["The AI should teach only the pupils who volunteered answers", "That would increase sampling bias rather than improve the evidence."]],
    rewrite: "Rewrite the response so it diagnoses the learning problem, targets the misconception and includes a clear evidence check before moving on.",
    principles: ["Use evidence of pupil thinking", "Target the specific misconception", "Avoid repeating a strategy without diagnosis", "Build in a retry and review decision"],
  };
}

export function getPhase19ChallengePack(course: Course): Phase19ChallengePack {
  const id = safeId(course.id);
  const lens = categoryLens(course.category, course);
  const issues: Phase19Issue[] = [
    { id: "assumption", kind: "assumption", label: lens.assumption[0], explanation: lens.assumption[1], correct: true },
    { id: "omission", kind: "omission", label: lens.omission[0], explanation: lens.omission[1], correct: true },
    { id: "judgement", kind: "judgement", label: lens.judgement[0], explanation: lens.judgement[1], correct: true },
    ...lens.distractors.map((item, index) => ({ id: `d${index + 1}`, kind: "distractor" as const, label: item[0], explanation: item[1], correct: false })),
  ];
  return {
    id: `phase19-${id}`,
    anchorId: anchorId(course),
    title: lens.title,
    brief: lens.brief,
    staffPrompt: lens.prompt,
    aiResponse: lens.ai,
    issues,
    rewritePrompt: lens.rewrite,
    expertPrinciples: lens.principles,
  };
}

export function validateStaffVsAiPhase19(course: Course) {
  const pack = getPhase19ChallengePack(course);
  if (!course.modules.some(module => module.id === pack.anchorId)) throw new Error(`Phase 19 ${course.id}: challenge anchor is missing`);
  if (pack.issues.length !== 6) throw new Error(`Phase 19 ${course.id}: requires six critique options`);
  const trueIssues = pack.issues.filter(item => item.correct);
  if (trueIssues.length !== 3) throw new Error(`Phase 19 ${course.id}: requires three genuine AI weaknesses`);
  const kinds = new Set(trueIssues.map(item => item.kind));
  if (!["assumption","omission","judgement"].every(kind => kinds.has(kind as Phase19IssueKind))) throw new Error(`Phase 19 ${course.id}: requires assumption, omission and judgement weaknesses`);
  if (pack.aiResponse.trim().split(/\s+/).length < 35) throw new Error(`Phase 19 ${course.id}: AI response is too shallow to critique`);
  if (pack.expertPrinciples.length < 4) throw new Error(`Phase 19 ${course.id}: requires four expert principles`);
  return true;
}

export function auditStaffVsAiPhase19(course: Course): Phase19Audit {
  const pack = getPhase19ChallengePack(course);
  let ready = true;
  try { validateStaffVsAiPhase19(course); } catch { ready = false; }
  const trueIssues = pack.issues.filter(item => item.correct);
  const issueKinds = new Set(trueIssues.map(item => item.kind)).size;
  const score = Math.min(100,
    (course.modules.some(module => module.id === pack.anchorId) ? 20 : 0) +
    (pack.issues.length === 6 ? 20 : 0) +
    (trueIssues.length === 3 ? 20 : 0) +
    (issueKinds === 3 ? 20 : 0) +
    (pack.expertPrinciples.length >= 4 ? 10 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, challenges: 1, issueOptions: pack.issues.length, trueIssues: trueIssues.length, issueKinds, ready, score };
}

export function summariseStaffVsAiPhase19(courses: Course[]) {
  const reports = courses.map(auditStaffVsAiPhase19);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalChallenges: reports.length,
    totalIssueOptions: reports.reduce((sum, report) => sum + report.issueOptions, 0),
    totalTrueIssues: reports.reduce((sum, report) => sum + report.trueIssues, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
