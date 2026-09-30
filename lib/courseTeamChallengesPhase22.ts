import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE22_VERSION = "2026.23";

export type Phase22ChallengeKind = "response_design" | "routine_design" | "implementation_plan";
export type Phase22Role = { id: string; label: string; responsibility: string };
export type Phase22Challenge = {
  id: string;
  kind: Phase22ChallengeKind;
  title: string;
  brief: string;
  output: string;
  prompts: string[];
  successChecks: string[];
};
export type Phase22TeamPack = {
  id: string;
  title: string;
  subtitle: string;
  roles: Phase22Role[];
  challenges: Phase22Challenge[];
  facilitationRule: string;
};
export type Phase22Audit = {
  courseId: string;
  title: string;
  challenges: number;
  challengeKinds: number;
  roles: number;
  successChecks: number;
  individualLeaderboards: number;
  teamOutputFocused: boolean;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

const ROLES: Phase22Role[] = [
  { id: "facilitator", label: "Facilitator", responsibility: "Keeps the group focused on the professional problem and makes sure every voice is heard." },
  { id: "evidence", label: "Evidence checker", responsibility: "Challenges claims that are not supported by course principles, evidence or agreed school procedure." },
  { id: "context", label: "Context challenger", responsibility: "Tests whether the proposed response would still work in a different class, role, workload or implementation condition." },
  { id: "reporter", label: "Reporter", responsibility: "Captures the team's final shared output, evidence check and review point." },
];

type Lens = { response: string; routine: string; implementation: string; boundary: string; evidence: string };
function categoryLens(category: CourseCategory, course: Course): Lens {
  if (category === "Safeguarding") return {
    response: "Design a calm, factual staff response to an ambiguous safeguarding concern that stays inside the staff role and uses the current school route.",
    routine: "Build a shared team routine for recognising, recording and reporting concerns so staff know what happens first, what must be factual and what must not become an investigation.",
    implementation: "Plan how the team will refresh safeguarding procedure knowledge, identify uncertainty quickly and check that reporting routes remain understood without discussing confidential cases in this activity.",
    boundary: "Do not investigate, diagnose or include identifiable/confidential pupil details in the team challenge.",
    evidence: "The final product should show factual recording, correct escalation and clear professional boundaries.",
  };
  if (category === "SEND") return {
    response: "Design a team response to a learner barrier that preserves ambition and tests the smallest useful adaptation before lowering the learning goal.",
    routine: "Build a shared routine for identifying barriers, selecting proportionate support and reviewing independence so scaffolds do not become permanent by default.",
    implementation: "Plan how the team will make adaptive practice more consistent while protecting professional judgement and avoiding one-size-fits-all SEND strategies.",
    boundary: "Do not turn labels into fixed teaching plans or reward task completion at the expense of independence and learning.",
    evidence: "The final product should identify the barrier, preserve the intended goal where appropriate and state how support will be reviewed or faded.",
  };
  if (category === "Leadership") return {
    response: "Design a leadership response to inconsistent implementation that diagnoses clarity, capability and capacity before attributing the problem to motivation.",
    routine: "Build a team routine for clarifying the smallest non-negotiable practice, modelling it and gathering implementation barriers before increasing monitoring.",
    implementation: "Create a realistic implementation plan with one priority, targeted support, an evidence source and a review point that includes workload impact.",
    boundary: "Do not use individual staff ranking or public comparison as the team improvement mechanism.",
    evidence: "The final product should separate diagnosis, support, monitoring and review rather than collapsing them into compliance checking.",
  };
  if (category === "Wellbeing") return {
    response: "Design a team response to a repeated workload pressure that changes a controllable system condition rather than only adding a wellbeing activity.",
    routine: "Build a team routine for spotting duplication, deadline congestion or low-value workload and agreeing what can be removed, simplified, shared or automated.",
    implementation: "Plan a small workload change, protect necessary individual support and define evidence that would show whether the change reduced pressure without moving the burden elsewhere.",
    boundary: "Do not frame avoidable system friction as an individual resilience deficit.",
    evidence: "The final product should change work itself and define a practical before/after workload check.",
  };
  if (category === "Digital Teaching") return {
    response: "Design a team response to a useful but imperfect digital workflow that keeps privacy, accessibility, verification and human responsibility inside the process.",
    routine: "Build a shared safe-use routine that tells staff when a tool is appropriate, what information must not be entered, what must be checked and who remains accountable.",
    implementation: "Plan a bounded trial with a defined purpose, verification expectations, accessibility checks and evidence for deciding whether to scale, adapt or stop.",
    boundary: "Do not treat polished output, speed or novelty as evidence that a digital workflow is safe or educationally worthwhile.",
    evidence: "The final product should include educational benefit, data boundaries, verification, accessibility and human oversight.",
  };
  return {
    response: `Design a shared professional response to a learning problem linked to ${course.title}, using evidence of pupil thinking rather than visible engagement alone.`,
    routine: `Build a repeatable team routine from ${course.title} that makes thinking visible, targets the actual learning problem and includes a review point.`,
    implementation: `Create a team implementation plan for one practice from ${course.title}, including modelling, rehearsal, evidence collection and a keep/adapt/stop decision.`,
    boundary: "Do not copy a visible technique without the principle, learning problem and evidence underneath it.",
    evidence: "The final product should state the intended learning change, the professional action, the evidence check and the next decision.",
  };
}

export function getPhase22TeamPack(course: Course): Phase22TeamPack {
  const lens = categoryLens(course.category, course);
  const commonChecks = ["The problem is stated precisely.", "The response is justified by a course principle.", lens.evidence, "The team has a clear review point and decision rule."];
  return {
    id: `phase22-${safeId(course.id)}`,
    title: `Team Challenge · ${course.title}`,
    subtitle: "Use one shared screen or facilitated group session to produce a collective professional response. The team succeeds by improving the output, not by ranking individuals.",
    roles: ROLES,
    facilitationRule: lens.boundary,
    challenges: [
      { id: "response", kind: "response_design", title: "Shared response design", brief: lens.response, output: "A concise shared professional response the team could actually use.", prompts: ["What is the professional problem?", "Which course principle should govern the response?", "What would staff actually do or say?", "What evidence would make the team adapt the response?"], successChecks: commonChecks },
      { id: "routine", kind: "routine_design", title: "Routine design lab", brief: lens.routine, output: "A four-step routine with a clear start, action, evidence check and review decision.", prompts: ["What must happen every time?", "What can legitimately vary by context?", "What evidence keeps the routine honest?", "Where could the routine create unintended workload, dependence or risk?"], successChecks: commonChecks },
      { id: "implementation", kind: "implementation_plan", title: "Implementation planning sprint", brief: lens.implementation, output: "A small team implementation plan with ownership, support, evidence and review built in.", prompts: ["What is the smallest worthwhile change?", "What support or modelling is needed?", "What will the team collect as implementation evidence?", "When will the team review and decide to keep, adapt or stop?"], successChecks: commonChecks },
    ],
  };
}

export function validateTeamChallengesPhase22(course: Course) {
  const pack = getPhase22TeamPack(course);
  if (pack.challenges.length !== 3) throw new Error(`Phase 22 ${course.id}: requires three team challenge types`);
  if (new Set(pack.challenges.map(item => item.kind)).size !== 3) throw new Error(`Phase 22 ${course.id}: requires response, routine and implementation challenges`);
  if (pack.roles.length < 4) throw new Error(`Phase 22 ${course.id}: requires collaborative roles`);
  if (pack.challenges.some(item => item.prompts.length < 4 || item.successChecks.length < 4)) throw new Error(`Phase 22 ${course.id}: each challenge requires guided prompts and success checks`);
  const text = JSON.stringify(pack);
  if (/individual leaderboard|rank individual|top performer|best staff member/i.test(text)) throw new Error(`Phase 22 ${course.id}: individual staff leaderboards are prohibited`);
  if (!/team|shared|collective/i.test(pack.subtitle + pack.challenges.map(item => item.output).join(" "))) throw new Error(`Phase 22 ${course.id}: challenge must centre a shared team output`);
  return true;
}

export function auditTeamChallengesPhase22(course: Course): Phase22Audit {
  const pack = getPhase22TeamPack(course);
  let ready = true;
  try { validateTeamChallengesPhase22(course); } catch { ready = false; }
  const text = JSON.stringify(pack);
  const individualLeaderboards = (text.match(/individual leaderboard|rank individual|top performer|best staff member/gi) || []).length;
  const successChecks = pack.challenges.reduce((sum, item) => sum + item.successChecks.length, 0);
  const challengeKinds = new Set(pack.challenges.map(item => item.kind)).size;
  const teamOutputFocused = pack.challenges.every(item => /shared|team|implementation|routine|professional response/i.test(item.output));
  const score = Math.min(100,
    (pack.challenges.length === 3 ? 20 : 0) +
    (challengeKinds === 3 ? 20 : 0) +
    (pack.roles.length >= 4 ? 15 : 0) +
    (successChecks >= 12 ? 15 : 0) +
    (individualLeaderboards === 0 ? 20 : 0) +
    (ready && teamOutputFocused ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, challenges: pack.challenges.length, challengeKinds, roles: pack.roles.length, successChecks, individualLeaderboards, teamOutputFocused, ready, score };
}

export function summariseTeamChallengesPhase22(courses: Course[]) {
  const reports = courses.map(auditTeamChallengesPhase22);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    challengesPerCourse: reports[0]?.challenges || 0,
    totalChallenges: reports.reduce((sum, report) => sum + report.challenges, 0),
    rolesPerChallenge: reports[0]?.roles || 0,
    individualLeaderboards: reports.reduce((sum, report) => sum + report.individualLeaderboards, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
