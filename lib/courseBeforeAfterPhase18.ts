import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE18_VERSION = "2026.19";

export type Phase18Criterion = {
  id: string;
  label: string;
  guidance: string;
};
export type Phase18Annotation = {
  id: string;
  label: string;
  excerpt: string;
  whyBetter: string;
};
export type Phase18StudioPack = {
  id: string;
  anchorId: string;
  title: string;
  brief: string;
  weakLabel: string;
  weakExample: string;
  criteria: Phase18Criterion[];
  strongerModel: string;
  annotations: Phase18Annotation[];
  reflectionPrompt: string;
};
export type Phase18Audit = {
  courseId: string;
  title: string;
  studios: number;
  criteria: number;
  annotations: number;
  weakExampleWords: number;
  modelWords: number;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function anchorId(course: Course) {
  return `overhaul10-archetype-${safeId(course.id)}-expert`;
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

type Lens = {
  title: string;
  brief: string;
  weakLabel: string;
  weak: string;
  model: string;
  annotations: Phase18Annotation[];
  criteria: Phase18Criterion[];
  reflection: string;
};

const COMMON_CRITERIA: Phase18Criterion[] = [
  { id: "precision", label: "Precise", guidance: "Names the actual professional problem, evidence or decision rather than relying on vague claims." },
  { id: "principle", label: "Principled", guidance: "Connects the action to a defensible course principle rather than copying a surface technique." },
  { id: "proportionate", label: "Proportionate", guidance: "Uses the smallest useful response and stays inside the professional role or boundary." },
  { id: "reviewable", label: "Reviewable", guidance: "States what evidence will be checked and what would lead to keep, adapt, fade or stop." },
];

function categoryLens(category: CourseCategory, course: Course): Lens {
  if (category === "Safeguarding") return {
    title: "Before / After Studio · strengthen a safeguarding record and response",
    brief: "Rewrite the weak example so it is factual, proportionate and usable within the school's safeguarding process. Do not add invented detail or investigate the concern.",
    weakLabel: "Weak professional response",
    weak: "The pupil was clearly upset because something bad must be happening at home. I asked lots of questions so I could understand the full story and told a few colleagues so they could keep an eye on the situation. I will wait for more information before deciding whether it needs reporting.",
    model: "I noticed a change from the pupil's usual presentation and the pupil asked to speak somewhere quieter. I listened without leading questions, recorded the factual information and the pupil's words where appropriate, and passed the concern through the school's current safeguarding route promptly. I have not tried to determine the cause. Any further information will be recorded factually and passed through the same safeguarding process.",
    annotations: [
      { id: "fact", label: "Observation separated from explanation", excerpt: "noticed a change from the pupil's usual presentation", whyBetter: "It records what was observed without claiming a cause that the staff member cannot know." },
      { id: "boundary", label: "Professional boundary protected", excerpt: "listened without leading questions", whyBetter: "The response supports the pupil without turning the staff interaction into an investigation." },
      { id: "route", label: "Correct route used promptly", excerpt: "passed the concern through the school's current safeguarding route promptly", whyBetter: "Action does not depend on the staff member deciding whether the concern is serious enough to share." },
      { id: "uncertainty", label: "Uncertainty preserved accurately", excerpt: "have not tried to determine the cause", whyBetter: "The record remains useful because it distinguishes fact from interpretation." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "After comparing your version with the model, name one change that made the response safer, more factual or more professionally defensible.",
  };
  if (category === "SEND") return {
    title: "Before / After Studio · improve an adaptive teaching response",
    brief: "Rewrite the weak example so it preserves ambition, responds to evidence and avoids turning a label into a fixed teaching plan.",
    weakLabel: "Weak adaptation plan",
    weak: "This pupil has additional needs, so I will give them easier work and an adult prompt for every step. If they finish it, I will keep using the same support because it clearly works. The main aim is to stop them struggling and make sure the task gets completed.",
    model: "The learner can explain the key idea but loses track when several written steps must be held in mind. I will keep the same learning goal, make the task sequence visible and use a brief start prompt only where needed. I will check independent task initiation and accuracy across the next two lessons. If independence increases, I will fade the prompt; if the barrier remains, I will review the task demand and evidence before changing the learning goal.",
    annotations: [
      { id: "barrier", label: "Barrier identified from evidence", excerpt: "loses track when several written steps must be held in mind", whyBetter: "The plan responds to a specific access demand instead of assuming support from a label." },
      { id: "ambition", label: "Learning goal preserved", excerpt: "keep the same learning goal", whyBetter: "Access support changes the route without automatically lowering the intended outcome." },
      { id: "small", label: "Support is proportionate", excerpt: "use a brief start prompt only where needed", whyBetter: "The response avoids permanent over-support and leaves space for independent thinking." },
      { id: "fade", label: "Support has a review rule", excerpt: "If independence increases, I will fade the prompt", whyBetter: "The plan defines evidence and a decision rule rather than treating support as permanent." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "What did you change so the plan supports access without creating unnecessary dependence or lowering the intended learning outcome?",
  };
  if (category === "Leadership") return {
    title: "Before / After Studio · improve an implementation response",
    brief: "Rewrite the weak leadership response so it diagnoses the implementation problem before increasing monitoring or adding another initiative.",
    weakLabel: "Weak implementation response",
    weak: "Staff are not implementing the new routine consistently, so I will make expectations stricter and monitor everyone more often. The strongest staff can show the others what to do. We need complete consistency quickly, and anyone who is still doing it differently at the next review will need to explain why.",
    model: "Implementation is inconsistent, but the current evidence does not show whether the main barrier is clarity, capability, capacity or principled adaptation. I will define the smallest non-negotiable element of the routine, provide one shared model and ask teams what is preventing reliable use. Support will be targeted to the barrier identified. At the next review I will check implementation evidence and workload impact before deciding whether the routine should be clarified, adapted or reinforced.",
    annotations: [
      { id: "diagnosis", label: "Diagnosis before attribution", excerpt: "does not show whether the main barrier is clarity, capability, capacity or principled adaptation", whyBetter: "The response avoids treating visible inconsistency as proof of weak motivation or compliance." },
      { id: "minimum", label: "Smallest non-negotiable defined", excerpt: "define the smallest non-negotiable element", whyBetter: "The team gains clarity without forcing unnecessary uniformity in every surface detail." },
      { id: "support", label: "Support matches the barrier", excerpt: "Support will be targeted to the barrier identified", whyBetter: "Professional development becomes responsive rather than generic." },
      { id: "review", label: "Implementation is reviewed with evidence", excerpt: "check implementation evidence and workload impact", whyBetter: "The review tests whether the change is working and sustainable instead of ranking staff." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "Which change shifted the response from compliance-focused monitoring towards evidence-led implementation leadership?",
  };
  if (category === "Wellbeing") return {
    title: "Before / After Studio · improve a wellbeing and workload response",
    brief: "Rewrite the weak example so it addresses controllable system friction rather than assuming that individual resilience is the main solution.",
    weakLabel: "Weak wellbeing response",
    weak: "Staff are stressed, so we will run another wellbeing afternoon and share resilience resources. We will encourage everyone to protect their time better and attend the optional activities. If people are still struggling after that, line managers can discuss personal coping strategies with them.",
    model: "Staff feedback identifies duplicated data entry and clustered deadlines as repeat sources of pressure. I will remove one duplicate reporting step and redesign the deadline sequence for the next cycle while keeping appropriate individual support available. We will compare time spent, missed deadlines and staff feedback before and after the change. The process will be kept, adapted or reversed according to whether it reduces avoidable workload without creating a new burden elsewhere.",
    annotations: [
      { id: "system", label: "Controllable system factor named", excerpt: "duplicated data entry and clustered deadlines", whyBetter: "The response targets a source of friction the organisation can actually change." },
      { id: "action", label: "Concrete process change", excerpt: "remove one duplicate reporting step", whyBetter: "The plan changes work itself rather than only adding a wellbeing activity around the work." },
      { id: "support", label: "Individual support still available", excerpt: "keeping appropriate individual support available", whyBetter: "System improvement and personal support are not treated as competing choices." },
      { id: "evidence", label: "Workload impact is testable", excerpt: "compare time spent, missed deadlines and staff feedback", whyBetter: "The school can check whether the change reduced friction rather than relying on popularity alone." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "What did you change so the response alters workload or system conditions rather than simply asking staff to cope better?",
  };
  if (category === "Digital Teaching") return {
    title: "Before / After Studio · improve a digital-use decision",
    brief: "Rewrite the weak example so the benefit of the tool is balanced with verification, privacy, accessibility and human professional responsibility.",
    weakLabel: "Weak digital workflow",
    weak: "The AI tool saves a lot of time and the output looks professional, so staff can use it for planning and feedback as long as they quickly read through it first. Everyone can decide what information to enter because they know their own context. If a mistake is found, we can correct it afterwards.",
    model: "The tool will be used only for tasks where it offers a clear educational or workload benefit. Staff must avoid entering information that is not appropriate for the approved workflow, verify important factual or evaluative outputs against reliable sources, and check accessibility before sharing material. A human professional remains responsible for the final decision or resource. The workflow will be reviewed after a defined trial using time saved, error patterns and access issues before wider adoption.",
    annotations: [
      { id: "purpose", label: "Purpose comes before the tool", excerpt: "only for tasks where it offers a clear educational or workload benefit", whyBetter: "Use is justified by the professional task rather than novelty or speed alone." },
      { id: "privacy", label: "Data boundary is explicit", excerpt: "avoid entering information that is not appropriate for the approved workflow", whyBetter: "Privacy is treated as a design condition, not an individual afterthought." },
      { id: "verify", label: "Verification is required", excerpt: "verify important factual or evaluative outputs against reliable sources", whyBetter: "Polished language is not treated as evidence of accuracy." },
      { id: "human", label: "Human responsibility retained", excerpt: "A human professional remains responsible", whyBetter: "The tool supports work without becoming the final professional decision-maker." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "Which change most clearly moved the workflow from convenient use to safe, professionally accountable use?",
  };
  return {
    title: "Before / After Studio · improve the teaching response",
    brief: `Rewrite the weak example using the principles from ${course.title}. Make pupil thinking visible, target the actual learning problem and include a reviewable next step.`,
    weakLabel: "Weak teaching response",
    weak: "Most pupils looked engaged and completed plenty of work, so the lesson strategy worked well. A few answers were wrong, so next lesson I will explain the whole topic again and give more practice questions. I will keep the same routine because the class seemed to enjoy it and the books looked good.",
    model: "Whole-class participation was high, but independent responses showed the same misconception in a sizeable group. I will begin the next lesson with a focused check that distinguishes the two ideas pupils are confusing, then use a short contrasting example before independent application. I will sample every pupil's response and compare accuracy with the previous evidence. If the misconception reduces, I will move to transfer; if it persists, I will adapt the explanation rather than simply adding more of the same practice.",
    annotations: [
      { id: "thinking", label: "Evidence of thinking replaces appearance", excerpt: "independent responses showed the same misconception", whyBetter: "The diagnosis is based on what pupils understand rather than engagement or work quantity alone." },
      { id: "target", label: "Next move targets the problem", excerpt: "focused check that distinguishes the two ideas pupils are confusing", whyBetter: "The response is specific enough to test and teach the actual misconception." },
      { id: "sample", label: "Every pupil can contribute evidence", excerpt: "sample every pupil's response", whyBetter: "The teacher reduces volunteer and visibility bias when judging understanding." },
      { id: "rule", label: "Review rule is explicit", excerpt: "If the misconception reduces... if it persists", whyBetter: "The next teaching decision is tied to evidence rather than habit." },
    ],
    criteria: COMMON_CRITERIA,
    reflection: "What changed most between the weak example and your improved version: the diagnosis, the action, the evidence check or the review rule? Explain why.",
  };
}

export function getPhase18StudioPack(course: Course): Phase18StudioPack {
  const id = safeId(course.id);
  const lens = categoryLens(course.category, course);
  return {
    id: `phase18-${id}`,
    anchorId: anchorId(course),
    title: lens.title,
    brief: lens.brief,
    weakLabel: lens.weakLabel,
    weakExample: lens.weak,
    criteria: lens.criteria,
    strongerModel: lens.model,
    annotations: lens.annotations,
    reflectionPrompt: lens.reflection,
  };
}

export function validateBeforeAfterPhase18(course: Course) {
  const pack = getPhase18StudioPack(course);
  if (!course.modules.some(module => module.id === pack.anchorId)) throw new Error(`Phase 18 ${course.id}: studio anchor is missing`);
  if (pack.criteria.length !== 4) throw new Error(`Phase 18 ${course.id}: requires four improvement criteria`);
  if (pack.annotations.length !== 4) throw new Error(`Phase 18 ${course.id}: requires four model annotations`);
  if (words(pack.weakExample) < 30) throw new Error(`Phase 18 ${course.id}: weak example is too shallow`);
  if (words(pack.strongerModel) < 45) throw new Error(`Phase 18 ${course.id}: stronger model is too shallow`);
  if (pack.annotations.some(item => !pack.strongerModel.includes(item.excerpt))) throw new Error(`Phase 18 ${course.id}: every annotation excerpt must appear in the stronger model`);
  if (!pack.reflectionPrompt.trim()) throw new Error(`Phase 18 ${course.id}: reflection prompt is required`);
  return true;
}

export function auditBeforeAfterPhase18(course: Course): Phase18Audit {
  const pack = getPhase18StudioPack(course);
  let ready = true;
  try { validateBeforeAfterPhase18(course); } catch { ready = false; }
  const weakExampleWords = words(pack.weakExample);
  const modelWords = words(pack.strongerModel);
  const score = Math.min(100,
    (course.modules.some(module => module.id === pack.anchorId) ? 20 : 0) +
    (pack.criteria.length === 4 ? 15 : 0) +
    (pack.annotations.length === 4 ? 20 : 0) +
    (weakExampleWords >= 30 ? 15 : 0) +
    (modelWords >= 45 ? 20 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, studios: 1, criteria: pack.criteria.length, annotations: pack.annotations.length, weakExampleWords, modelWords, ready, score };
}

export function summariseBeforeAfterPhase18(courses: Course[]) {
  const reports = courses.map(auditBeforeAfterPhase18);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalStudios: reports.length,
    totalCriteria: reports.reduce((sum, report) => sum + report.criteria, 0),
    totalAnnotations: reports.reduce((sum, report) => sum + report.annotations, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
