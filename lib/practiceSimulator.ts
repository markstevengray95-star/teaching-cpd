export type SimulatorChoice = {
  label: string;
  feedback: string;
  quality: "strong" | "develop" | "risk";
};

export type PracticeScenario = {
  id: string;
  title: string;
  category: string;
  situation: string;
  coachingPoint: string;
  relatedCourseIds: string[];
  choices: SimulatorChoice[];
};

export const practiceScenarios: PracticeScenario[] = [
  {
    id:"parent-conversation",
    title:"A difficult parent conversation",
    category:"Communication",
    situation:"A parent says a recent sanction was unfair and arrives frustrated. You have the behaviour record but do not yet know their perspective.",
    coachingPoint:"Separate observable information from assumptions, listen for context, restate the shared aim and agree a clear next step.",
    relatedCourseIds:["parent-communication","difficult-conversations","effective-feedback"],
    choices:[
      {label:"Start by explaining why the parent is wrong",feedback:"Leading with a rebuttal can escalate the conversation before the concern has been understood.",quality:"risk"},
      {label:"Acknowledge the concern, establish the facts, listen for relevant context and agree what will happen next",feedback:"This keeps the conversation factual, respectful and action-focused without abandoning school expectations.",quality:"strong"},
      {label:"Promise immediately that the sanction will be removed",feedback:"A premature promise may bypass the agreed process before the information has been reviewed.",quality:"develop"},
    ],
  },
  {
    id:"behaviour-routine",
    title:"A routine is breaking down",
    category:"Behaviour",
    situation:"Transitions into independent work have become noisy and slow. Reminders are increasing but the routine is becoming less consistent.",
    coachingPoint:"Re-teach the routine as observable behaviour, rehearse it, use a consistent cue and review whether the environment is making success easier.",
    relatedCourseIds:["behaviour-routines","behaviour-management","de-escalation"],
    choices:[
      {label:"Give increasingly long verbal warnings each time",feedback:"More language can add ambiguity if the routine itself is no longer clear or practised.",quality:"develop"},
      {label:"Pause, re-teach and rehearse the exact transition, then use the same concise cue consistently",feedback:"This treats the routine as something pupils need to know and practise, not merely comply with after repeated reminders.",quality:"strong"},
      {label:"Remove independent work from future lessons",feedback:"Avoiding the routine removes useful learning rather than addressing why it is breaking down.",quality:"risk"},
    ],
  },
  {
    id:"send-barrier",
    title:"A pupil cannot get started",
    category:"SEND & Inclusion",
    situation:"A pupil understands the idea when discussing it but cannot begin a long written task independently. The learning goal itself remains appropriate.",
    coachingPoint:"Identify the task barrier and adapt access while maintaining the important learning goal and planning how support can reduce over time.",
    relatedCourseIds:["send-inclusive-practice","adaptive-teaching","adhd-classroom-strategies","dyslexia-classroom-support"],
    choices:[
      {label:"Replace the task with a much easier learning objective",feedback:"This lowers ambition before the specific access barrier has been addressed.",quality:"risk"},
      {label:"Provide a temporary structure for starting and sequencing the response, then fade it as independence improves",feedback:"This targets the barrier while preserving the core learning goal.",quality:"strong"},
      {label:"Complete the opening paragraph for the pupil every time",feedback:"This may get the task started but can create dependency if the thinking is repeatedly removed.",quality:"develop"},
    ],
  },
  {
    id:"safeguarding-concern",
    title:"A safeguarding concern without certainty",
    category:"Safeguarding",
    situation:"In a fictional scenario, a pupil makes a brief comment that causes concern but does not give a full explanation. You are unsure what it means.",
    coachingPoint:"Staff do not need to prove a concern. Respond calmly, avoid investigating, record relevant facts and follow the school's current safeguarding route promptly.",
    relatedCourseIds:["safeguarding-essentials"],
    choices:[
      {label:"Wait until there is enough evidence to prove what happened",feedback:"Safeguarding concerns should not be held back while an individual member of staff tries to reach proof.",quality:"risk"},
      {label:"Listen appropriately, record the relevant facts and pass the concern through the school's current safeguarding procedure",feedback:"This keeps the response timely, factual and within the member of staff's role.",quality:"strong"},
      {label:"Question other pupils to work out whether the concern is true",feedback:"Independent investigation may go beyond the staff member's role and interfere with the appropriate safeguarding response.",quality:"risk"},
    ],
  },
  {
    id:"misconception",
    title:"A confident class has misunderstood",
    category:"Teaching & Learning",
    situation:"Most pupils answer a question quickly, but a whole-class response reveals that many have chosen the same plausible misconception.",
    coachingPoint:"Use the response as evidence: diagnose the reasoning, re-model the difficult step and check again before moving on.",
    relatedCourseIds:["checking-for-understanding","effective-questioning","effective-explanations"],
    choices:[
      {label:"Move on because most pupils answered quickly",feedback:"Speed or confidence does not establish that the underlying understanding is secure.",quality:"risk"},
      {label:"Ask why pupils selected that answer, re-model the key distinction and run another whole-class check",feedback:"This turns the misconception into evidence for the next teaching move.",quality:"strong"},
      {label:"Tell pupils the correct answer and continue",feedback:"Correction helps, but without examining the reasoning the misconception may persist.",quality:"develop"},
    ],
  },
  {
    id:"coaching-conversation",
    title:"A coaching target is too broad",
    category:"Coaching",
    situation:"A colleague wants to 'improve questioning', but the target is too broad to rehearse or review consistently.",
    coachingPoint:"Convert broad goals into one observable, high-leverage behaviour that can be modelled, rehearsed and reviewed with evidence.",
    relatedCourseIds:["instructional-coaching","effective-questioning","effective-feedback"],
    choices:[
      {label:"Keep the broad target so it covers everything",feedback:"A broad target makes rehearsal and evidence difficult to focus.",quality:"develop"},
      {label:"Agree one precise behaviour, rehearse it and decide what evidence you will review at the next check-in",feedback:"A narrow action step makes coaching concrete and iterative.",quality:"strong"},
      {label:"Replace coaching with a general performance judgement",feedback:"This changes the purpose from development to evaluation and removes the focused practice cycle.",quality:"risk"},
    ],
  },
  {
    id:"leadership-drift",
    title:"A department initiative is drifting",
    category:"Leadership",
    situation:"A department agreed a new checking-for-understanding routine. A month later, practice varies widely and staff describe different interpretations of the expectation.",
    coachingPoint:"Clarify the intended practice, diagnose barriers, support implementation and review evidence before deciding the next action.",
    relatedCourseIds:["middle-leadership","instructional-coaching","checking-for-understanding"],
    choices:[
      {label:"Launch a second initiative to create momentum",feedback:"Additional change can increase ambiguity when the first routine is not yet secure.",quality:"risk"},
      {label:"Re-establish the core routine, gather implementation barriers, provide focused support and schedule a review",feedback:"This combines clarity, diagnosis, support and follow-up.",quality:"strong"},
      {label:"Assume variation shows a lack of commitment",feedback:"Variation can have several causes; diagnosing implementation is more useful before reaching that conclusion.",quality:"develop"},
    ],
  },
  {
    id:"responsible-ai",
    title:"An AI tool produces an excellent-looking resource",
    category:"Digital Teaching",
    situation:"A generative AI tool produces a polished pupil resource. It includes factual claims and was created without any pupil-identifiable information.",
    coachingPoint:"A polished output still needs educational, factual, safeguarding, privacy and school-policy review before use.",
    relatedCourseIds:["ai-in-education","online-safety"],
    choices:[
      {label:"Use it immediately because the formatting looks professional",feedback:"Fluent presentation does not establish factual accuracy or suitability.",quality:"risk"},
      {label:"Check the important claims, educational purpose, accessibility and school expectations before adapting it for use",feedback:"This keeps professional judgement and verification at the centre of AI-supported work.",quality:"strong"},
      {label:"Add identifiable pupil data so the tool can personalise it further",feedback:"Sensitive information should not be shared unless the tool and intended use are specifically approved for that data handling.",quality:"risk"},
    ],
  },
];
