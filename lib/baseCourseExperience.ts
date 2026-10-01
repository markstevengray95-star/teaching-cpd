import type { Course, Module } from "./data";

export type ExperienceMode = "ECT" | "Standard" | "Challenge";
export type ExperienceCard = { title: string; body: string; strength?: "Strong" | "Moderate" | "Context-dependent" | "Policy-critical" };
export type ExperienceExample = { label: string; body: string };

export type CourseExperience = {
  diagnostic: { question: string; options: string[]; answer: number; feedback: string }[];
  flashcards: { front: string; back: string }[];
  myths: ExperienceCard[];
  mistakes: ExperienceCard[];
  research: ExperienceCard[];
  beforeAfter: { before: string; after: string }[];
  annotatedExample: string[];
  subjectExamples: ExperienceExample[];
  roleExamples: ExperienceExample[];
  phaseExamples: ExperienceExample[];
  implementationChecklist: string[];
  discussionPrompts: string[];
  coachingPrompts: string[];
  leadershipPrompts: string[];
  facilitatorNotes: string[];
  pausePoints: string[];
  recommendedNext: string[];
};

const categoryResearch: Record<Course["category"], ExperienceCard[]> = {
  "Teaching & Learning": [
    { title: "Use evidence responsively", body: "The strongest classroom use is usually to apply a strategy deliberately, check what pupils actually do, and adapt rather than follow a script mechanically.", strength: "Strong" },
    { title: "Prior knowledge matters", body: "New learning is easier to build when important prior knowledge is accessible and instructional load is manageable.", strength: "Strong" },
    { title: "Implementation matters", body: "The name of a strategy matters less than the quality, timing and fit of the implementation in a specific classroom.", strength: "Context-dependent" },
  ],
  Safeguarding: [
    { title: "Current policy takes precedence", body: "School safeguarding policy, DSL guidance and current statutory expectations always take precedence over generic training examples.", strength: "Policy-critical" },
    { title: "Record and report, do not investigate", body: "Staff should respond calmly, record facts accurately and use the school's reporting route rather than conducting their own investigation.", strength: "Policy-critical" },
    { title: "Professional curiosity without assumption", body: "Patterns can matter, but individual signs should not be treated as proof of a cause. Concerns should be shared through safeguarding systems.", strength: "Strong" },
  ],
  SEND: [
    { title: "Know the pupil, not the label", body: "Needs vary within every diagnostic category. Effective support starts with the pupil, their plan, and the barriers created by the task or environment.", strength: "Strong" },
    { title: "Keep ambition high", body: "Adaptation is strongest when it improves access to the same important learning goal rather than automatically lowering the goal.", strength: "Strong" },
    { title: "Scaffolds should earn their place", body: "Support should reduce a real barrier and be reviewed so it does not unintentionally create dependence.", strength: "Context-dependent" },
  ],
  Leadership: [
    { title: "Clarity before monitoring", body: "Teams implement improvement more reliably when the intended practice, rationale and support are clear before monitoring begins.", strength: "Strong" },
    { title: "Fewer priorities are easier to implement", body: "Sustained improvement generally benefits from a small number of explicit priorities, repeated support and follow-up.", strength: "Strong" },
    { title: "Use evidence for improvement, not ranking", body: "Developmental information is most useful when it identifies patterns, barriers and next actions rather than producing simplistic staff league tables.", strength: "Strong" },
  ],
  Wellbeing: [
    { title: "Avoid single-cause explanations", body: "Wellbeing, attendance and engagement are shaped by interacting factors. Frameworks can guide questions but should not be treated as diagnoses.", strength: "Strong" },
    { title: "School systems matter", body: "Predictability, workload, relationships, routines and access to support can all change the day-to-day experience of pupils and staff.", strength: "Context-dependent" },
    { title: "Escalate concerns through the right route", body: "Where a welfare or safeguarding concern emerges, use the school's pastoral or safeguarding systems rather than trying to solve it alone.", strength: "Policy-critical" },
  ],
  "Digital Teaching": [
    { title: "Human judgement remains essential", body: "Digital and AI tools can assist work, but staff remain responsible for accuracy, suitability, privacy and professional decisions.", strength: "Strong" },
    { title: "Data minimisation matters", body: "Use only the information necessary for the task and avoid sharing identifiable or sensitive pupil data with tools that are not approved for it.", strength: "Policy-critical" },
    { title: "Design for verification", body: "Important outputs should be checked against trusted sources, school policy and professional knowledge before use.", strength: "Strong" },
  ],
};

const genericMyths: Record<Course["category"], ExperienceCard[]> = {
  "Teaching & Learning": [
    { title: "Myth: a named strategy works automatically", body: "Impact depends on what the teacher actually does, when it is used and how pupils respond." },
    { title: "Myth: more activity always means more learning", body: "Pupil activity is useful when it directs attention and thinking towards the intended learning." },
    { title: "Myth: one lesson proves impact", body: "Useful implementation evidence normally comes from repeated use and multiple observations, not a single impression." },
  ],
  Safeguarding: [
    { title: "Myth: staff need certainty before reporting", body: "Staff should pass on concerns according to school procedure; they do not need to prove what happened themselves." },
    { title: "Myth: confidentiality means keeping disclosures secret", body: "Staff should never promise secrecy where information may need to be shared to keep a child safe." },
    { title: "Myth: one sign identifies the cause", body: "Indicators can have many explanations. Record what is observed and share concerns appropriately." },
  ],
  SEND: [
    { title: "Myth: a diagnosis tells you exactly what a pupil needs", body: "Diagnosis can inform planning, but classroom support still needs to be individualised." },
    { title: "Myth: support means making work easier", body: "Good adaptation improves access while preserving important thinking and ambition." },
    { title: "Myth: scaffolds should stay forever", body: "Where appropriate, scaffolds should be reduced as pupils become more independent." },
  ],
  Leadership: [
    { title: "Myth: monitoring alone improves practice", body: "Monitoring is only useful when expectations, support and follow-up are clear." },
    { title: "Myth: more initiatives show greater ambition", body: "Too many priorities can dilute implementation and increase workload." },
    { title: "Myth: consistency means identical teaching", body: "Consistency is usually about shared principles and expectations, not removing professional judgement." },
  ],
  Wellbeing: [
    { title: "Myth: a framework can diagnose an individual", body: "Frameworks can support professional thinking but do not replace assessment, pastoral knowledge or safeguarding procedures." },
    { title: "Myth: resilience is only an individual responsibility", body: "Workload, systems, relationships and environmental conditions also matter." },
    { title: "Myth: reduced challenge is always supportive", body: "Support and high expectations can coexist." },
  ],
  "Digital Teaching": [
    { title: "Myth: AI output is reliable because it sounds confident", body: "Fluent output can still be wrong, incomplete or biased and requires checking." },
    { title: "Myth: removing a pupil's name always removes privacy risk", body: "Other details can still identify a pupil when combined." },
    { title: "Myth: technology automatically improves learning", body: "Its value depends on the learning problem it solves and how it is used." },
  ],
};

export function buildCourseExperience(course: Course, allCourses: Course[]): CourseExperience {
  const quizModules = course.modules.filter((m): m is Extract<Module, { type: "quiz" }> => m.type === "quiz");
  const contentModules = course.modules.filter((m): m is Extract<Module, { type: "content" }> => m.type === "content");
  const scenarioModules = course.modules.filter((m): m is Extract<Module, { type: "scenario" }> => m.type === "scenario");
  const keyPointPool = contentModules.flatMap(m => m.keyPoints || []);

  const diagnostic = quizModules.length
    ? quizModules.slice(0, 5).map(q => ({ question: q.question, options: q.options, answer: q.answer, feedback: q.feedback }))
    : [{
        question: `Which statement best matches the purpose of ${course.title}?`,
        options: [course.objectives[0] || course.summary, "Use a rigid routine regardless of context", "Replace professional judgement with a checklist", "Reduce expectations whenever a pupil struggles"],
        answer: 0,
        feedback: course.objectives[0] || course.summary,
      }];

  const flashcards = [
    ...course.objectives.map((objective, i) => ({ front: `Objective ${i + 1}`, back: objective })),
    ...keyPointPool.slice(0, 8).map((point, i) => ({ front: `Key idea ${i + 1}`, back: point })),
  ].slice(0, 12);

  const mistakes: ExperienceCard[] = [
    { title: "Applying the idea mechanically", body: `Using ${course.title} as a fixed script instead of checking whether it fits the learning need or professional context.` },
    { title: "Skipping the check", body: "Introducing a strategy but not collecting evidence about what changed, what stayed the same or what pupils still need." },
    { title: "Trying to change too much at once", body: "A small, repeatable implementation step is usually easier to evaluate than a broad redesign." },
  ];

  const beforeAfter = [
    { before: `Before: apply ${course.title} as a generic technique because it sounds useful.`, after: `After: identify the specific problem, choose one element of ${course.title}, define what success would look like and check evidence after use.` },
    { before: "Before: decide that the strategy worked because the lesson felt smoother.", after: "After: sample pupil responses, work, independence or participation and use that evidence to decide the next step." },
  ];

  const annotatedExample = [
    `1. Identify a precise need linked to: ${course.objectives[0] || course.summary}.`,
    `2. Choose one small practice change from the course rather than implementing everything at once.`,
    `3. Decide what evidence would be useful before you try it.`,
    `4. Use the strategy repeatedly enough to learn from implementation, then review and adapt.`,
  ];

  const subjectExamples: ExperienceExample[] = [
    { label: "Science", body: `Use ${course.title} when modelling explanations, practical routines, graph interpretation or misconceptions; make the evidence visible through pupil reasoning and work.` },
    { label: "Mathematics", body: `Apply the course principle to worked examples, representations, questioning and error analysis rather than simply increasing worksheet volume.` },
    { label: "English", body: `Apply the principle to reading, modelling analytical writing, vocabulary, discussion and feedback while keeping the disciplinary goal explicit.` },
    { label: "Humanities", body: `Use the principle with source analysis, extended explanations, disciplinary vocabulary and structured argument.` },
    { label: "Practical subjects", body: `Apply the principle to demonstration, routines, safety, sequencing and the gradual transfer of practical independence.` },
  ];

  const roleExamples: ExperienceExample[] = [
    { label: "ECT / new teacher", body: "Start with one clearly modelled routine or strategy, rehearse it, and review evidence with a mentor before adding complexity." },
    { label: "Teacher", body: "Choose one class and one recurring problem, test a focused change, then use evidence to refine it." },
    { label: "Teaching assistant", body: "Use the same learning goal as the teacher, prompt rather than replace pupil thinking, and communicate what support helped or hindered independence." },
    { label: "Middle leader", body: "Agree a small shared practice, provide examples and rehearsal, then gather implementation barriers before judging impact." },
    { label: "Senior / CPD leader", body: "Connect the course to school priorities, protect implementation time, monitor patterns rather than ranking staff, and plan follow-up support." },
  ];

  const phaseExamples: ExperienceExample[] = [
    { label: "Primary", body: "Use concise routines, concrete examples and frequent checking while considering developmental differences and language demands." },
    { label: "KS3", body: "Make routines and disciplinary expectations explicit, especially where pupils are adjusting to multiple teachers and subjects." },
    { label: "GCSE", body: "Combine secure core knowledge with modelling of exam/disciplinary thinking and carefully faded support." },
    { label: "Post-16", body: "Increase independence while still modelling expert thinking, monitoring misconceptions and teaching how to practise effectively." },
  ];

  const implementationChecklist = [
    "Name the specific problem or learning barrier you are trying to improve.",
    "Choose one small strategy from this course rather than several at once.",
    "Decide what you will look for as evidence of change.",
    "Plan when and where you will try the strategy.",
    "Use the strategy more than once before drawing a conclusion where appropriate.",
    "Review the evidence and decide whether to keep, adapt or stop the approach.",
  ];

  const discussionPrompts = [
    `Which idea from ${course.title} is most relevant to our current pupils or team priorities?`,
    "Where could this idea be overused or applied too mechanically?",
    "What would useful evidence of implementation look like without creating unnecessary workload?",
    scenarioModules[0]?.prompt || "What would this principle look like in a real lesson next week?",
  ];

  const coachingPrompts = [
    "What is the smallest observable change you want to make?",
    "What is happening now, and what would you like to happen instead?",
    "What evidence would help you decide whether the change is useful?",
    "What might make implementation difficult, and how could that barrier be reduced?",
    "When will you review the change and decide the next step?",
  ];

  const leadershipPrompts = [
    `How does ${course.title} connect to an agreed school or department priority?`,
    "What does good implementation look like without requiring identical practice from every teacher?",
    "What support, modelling or rehearsal will staff need?",
    "How will leaders separate implementation evidence from simplistic performance judgements?",
    "When will the school stop, adapt or scale the approach?",
  ];

  const facilitatorNotes = [
    `15-minute micro-CPD: use one visual/key idea, one scenario and one discussion prompt from ${course.title}.`,
    "30-minute session: add a retrieval check, pair discussion and a short implementation-planning activity.",
    "60-minute session: include diagnostic confidence, two practice tasks, discussion, action planning and an exit reflection.",
    "Keep confidential pupil or staff details out of group examples. Use school policy where the topic is safeguarding, SEND, data protection or safety-critical.",
  ];

  const pausePoints = [
    `Pause after the first key idea: where do we already see this done well?`,
    `Pause at the first scenario: what evidence would change your decision?`,
    `Pause before action planning: what is one small change worth testing?`,
  ];

  const recommendedNext = allCourses
    .filter(c => c.id !== course.id && c.category === course.category)
    .slice(0, 3)
    .map(c => c.id);

  return {
    diagnostic,
    flashcards,
    myths: genericMyths[course.category],
    mistakes,
    research: categoryResearch[course.category],
    beforeAfter,
    annotatedExample,
    subjectExamples,
    roleExamples,
    phaseExamples,
    implementationChecklist,
    discussionPrompts,
    coachingPrompts,
    leadershipPrompts,
    facilitatorNotes,
    pausePoints,
    recommendedNext,
  };
}

export function suggestedMode(score: number): ExperienceMode {
  if (score >= 80) return "Challenge";
  if (score < 55) return "ECT";
  return "Standard";
}

