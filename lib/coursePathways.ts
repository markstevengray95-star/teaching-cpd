import type { Course } from "./data";

export type LearningProgress = Record<string, { completedModules: string[]; completedAt?: string }>;
export const pathwayRoles = ["Teacher", "ECT", "Teaching assistant", "Pastoral staff", "Leader", "Support staff"] as const;
export type PathwayRole = typeof pathwayRoles[number];
type Step = { courseId: string; purpose: string };
export type LearningPathway = { id: string; title: string; outcome: string; roles: readonly PathwayRole[]; steps: Step[] };

export const learningPathways: LearningPathway[] = [
  { id: "classroom-start", title: "Build calm classroom routines", outcome: "Move from a rehearsed calm response to predictable routines and prevention.", roles: ["Teacher","ECT","Teaching assistant"], steps: [
    {courseId:"short-calm-responses",purpose:"Rehearse one calm response."},
    {courseId:"behaviour-routines",purpose:"Establish consistent entry, transition and response routines."},
    {courseId:"behaviour-management",purpose:"Connect routines with prevention and proportionate correction."},
    {courseId:"de-escalation",purpose:"Practise responding when an interaction starts to escalate."},
  ]},
  { id: "visible-thinking", title: "Make pupil thinking visible", outcome: "Use participation, questions and feedback to decide what to teach next.", roles: ["Teacher","ECT","Teaching assistant","Leader"], steps: [
    {courseId:"short-understanding-check",purpose:"Try a check that includes everyone."},
    {courseId:"effective-questioning",purpose:"Design questions that expose misconceptions."},
    {courseId:"checking-for-understanding",purpose:"Interpret responses before deciding the next teaching move."},
    {courseId:"effective-feedback",purpose:"Help pupils act on the evidence and improve their work."},
  ]},
  { id: "inclusive-access", title: "Remove barriers without lowering ambition", outcome: "Identify a barrier, adapt the route and review whether support increases independence.", roles: ["Teacher","ECT","Teaching assistant","Leader"], steps: [
    {courseId:"short-adaptive-teaching",purpose:"Remove one barrier in a specific task."},
    {courseId:"adaptive-teaching",purpose:"Choose and fade temporary scaffolds."},
    {courseId:"send-inclusive-practice",purpose:"Use individual needs and evidence rather than labels."},
    {courseId:"high-quality-teaching-send",purpose:"Connect inclusive planning with everyday teaching."},
  ]},
  { id: "durable-learning", title: "Explain, practise and remember", outcome: "Connect clear explanations, modelling and spaced retrieval rather than collecting isolated techniques.", roles: ["Teacher","ECT","Teaching assistant"], steps: [
    {courseId:"short-retrieval",purpose:"Choose knowledge worth retrieving."},
    {courseId:"cognitive-load-theory",purpose:"Recognise unnecessary demands in a learning task."},
    {courseId:"worked-examples-and-modelling",purpose:"Make the thinking visible before independent practice."},
    {courseId:"retrieval-practice",purpose:"Plan retrieval with useful feedback and spacing."},
    {courseId:"metacognition-self-regulation",purpose:"Help pupils plan, monitor and evaluate their learning."},
  ]},
  { id: "safeguarding-response", title: "Listen, record and report", outcome: "Rehearse staff awareness and the school reporting route. This does not replace required local training or designated-lead guidance.", roles: ["Teacher","ECT","Teaching assistant","Pastoral staff","Leader","Support staff"], steps: [
    {courseId:"short-safeguarding-disclosures",purpose:"Rehearse receiving a disclosure without investigating."},
    {courseId:"short-factual-records",purpose:"Separate factual recording from interpretation."},
    {courseId:"safeguarding-essentials",purpose:"Connect awareness with current school responsibilities and procedures."},
    {courseId:"short-online-safety",purpose:"Apply the reporting boundary to an online concern."},
    {courseId:"online-safety",purpose:"Develop awareness of online contexts and the agreed response."},
  ]},
  { id: "safe-school", title: "Know your school safety role", outcome: "Recognise hazards and rehearse reporting and emergency roles. Awareness courses do not authorise specialist actions.", roles: ["Teacher","ECT","Teaching assistant","Pastoral staff","Leader","Support staff"], steps: [
    {courseId:"short-classroom-safety",purpose:"Carry out a focused classroom risk check."},
    {courseId:"health-safety-essentials-schools",purpose:"Connect everyday checks with school arrangements."},
    {courseId:"short-evacuation",purpose:"Locate and rehearse your agreed evacuation role."},
    {courseId:"fire-safety-emergency-evacuation",purpose:"Review emergency responsibilities and limits."},
    {courseId:"accident-near-miss-riddor-awareness",purpose:"Understand the staff reporting route and follow-up."},
  ]},
  { id: "pastoral-support", title: "Connect pastoral support and attendance", outcome: "Use check-ins to identify barriers and agree coordinated support within your role.", roles: ["Teacher","Pastoral staff","Teaching assistant","Leader"], steps: [
    {courseId:"effective-tutoring",purpose:"Structure a purposeful pastoral check-in."},
    {courseId:"supporting-anxious-pupils",purpose:"Recognise barriers and avoid assumptions about anxiety."},
    {courseId:"attendance-persistent-absence",purpose:"Connect early support with attendance procedures."},
    {courseId:"ebsa-school-support",purpose:"Explore coordinated support and reintegration."},
  ]},
  { id: "lead-team", title: "Lead improvement sustainably", outcome: "Move from a manageable personal routine to focused team learning and review.", roles: ["Leader","Teacher"], steps: [
    {courseId:"short-workload",purpose:"Identify one sustainable routine."},
    {courseId:"middle-leadership",purpose:"Clarify priorities, responsibilities and evidence."},
    {courseId:"effective-department-meetings",purpose:"Use team time for a specific improvement task."},
    {courseId:"instructional-coaching",purpose:"Support rehearsal and developmental feedback."},
    {courseId:"change-management-schools",purpose:"Plan implementation, review and proportionate adaptation."},
  ]},
];

export function courseFinished(course: Course, progress: LearningProgress): boolean {
  const state = progress[course.id];
  return Boolean(state?.completedAt) || course.modules.every(m=>state?.completedModules.includes(m.id));
}

export function pathwayState(pathway: LearningPathway, catalogue: readonly Course[], progress: LearningProgress) {
  const steps = pathway.steps.map(step => {
    const course = catalogue.find(c=>c.id===step.courseId);
    if (!course) throw new Error("Missing pathway course: " + step.courseId);
    return { ...step, course, complete: courseFinished(course,progress) };
  });
  return { steps, completed: steps.filter(s=>s.complete).length, minutes: steps.reduce((n,s)=>n+s.course.duration,0), next: steps.find(s=>!s.complete) };
}
