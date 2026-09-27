import type { Course, CourseCategory, Module } from "./data";

const flagshipCourseIds = new Set([
  "rosenshine-principles",
  "effective-questioning",
  "cognitive-load-theory",
  "behaviour-management",
  "retrieval-practice",
  "adaptive-teaching",
  "effective-feedback",
  "metacognition-self-regulation",
  "send-inclusive-practice",
  "safeguarding-essentials",
  "health-safety-essentials-schools",
  "allergy-safety-schools-2026",
  "regulation-support-academy",
]);

type CategoryPack = {
  baselineQuestion: string;
  baselineOptions: string[];
  baselineAnswer: number;
  baselineFeedback: string;
  commonMistakes: string[];
  practiceInstructions: string[];
  evidenceIdeas: string[];
};

const packs: Record<CourseCategory, CategoryPack> = {
  "Teaching & Learning": {
    baselineQuestion: "Which approach is most likely to turn professional learning into better classroom practice?",
    baselineOptions: [
      "Use the named strategy in every lesson in exactly the same way",
      "Identify a precise learning problem, apply one relevant strategy, gather evidence and adapt",
      "Change several routines at once so impact is faster",
      "Judge success mainly by whether the lesson felt smoother",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Strong implementation begins with a precise learning need and uses evidence to decide whether to keep, adapt or stop a change.",
    commonMistakes: [
      "Treating a research-informed idea as a fixed script rather than a professional decision tool",
      "Changing too many things at once, making it hard to identify what helped",
      "Checking participation but not checking what pupils actually understood or could do",
      "Keeping a scaffold or routine after pupils no longer need it",
    ],
    practiceInstructions: [
      "Name one precise learning problem in a real class.",
      "Select one idea from this course that directly addresses that problem.",
      "Describe exactly what you will do differently in the lesson.",
      "Choose one low-workload source of evidence: pupil responses, work, independence, errors or participation.",
      "State what would make you keep, adapt or stop the approach after repeated use.",
    ],
    evidenceIdeas: ["Pupil work before/after", "Whole-class response patterns", "Common error frequency", "Independence or scaffold use", "Short pupil explanation/sample"],
  },
  Safeguarding: {
    baselineQuestion: "What should staff do when a generic training example differs from current school procedure or statutory guidance?",
    baselineOptions: [
      "Follow the generic example because it is part of a course",
      "Follow current statutory requirements, school policy and the authorised safeguarding/safety route",
      "Choose whichever option is quickest",
      "Wait until a colleague tells them what to do",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Current statutory requirements, local policy and authorised school procedures take precedence over generic training examples.",
    commonMistakes: [
      "Treating awareness training as a substitute for school-specific induction, policy or specialist certification",
      "Waiting for certainty instead of using the correct reporting or escalation route",
      "Keeping important information in personal notes instead of approved systems",
      "Going beyond the staff member's training, authorisation or professional role",
    ],
    practiceInstructions: [
      "Identify the current school policy or procedure connected to this course.",
      "Record the correct local contact, reporting route or escalation point without adding confidential pupil information.",
      "Identify one realistic situation where staff may hesitate or make the wrong assumption.",
      "Write the safe decision rule staff should use in that situation.",
      "List any site-specific drill, induction or specialist training that must sit alongside this CPD.",
    ],
    evidenceIdeas: ["Policy acknowledgement", "Training completion record", "Drill/debrief evidence", "Procedure audit", "Near-miss learning", "Role-specific certificate reference"],
  },
  SEND: {
    baselineQuestion: "Which starting point best supports inclusive classroom practice?",
    baselineOptions: [
      "Use the same strategy for everyone with the same diagnosis",
      "Clarify the learning goal, identify the actual barrier and use pupil-specific evidence to choose support",
      "Lower the learning goal whenever a pupil struggles",
      "Keep every scaffold permanently once introduced",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Inclusive practice starts with the intended learning and the specific barrier, then uses proportionate support that is reviewed over time.",
    commonMistakes: [
      "Using a diagnostic label as if it automatically specifies the right classroom strategy",
      "Reducing challenge before checking whether access could be improved in another way",
      "Adding multiple supports when one targeted scaffold would be enough",
      "Measuring adult help rather than pupil participation and growing independence",
    ],
    practiceInstructions: [
      "Choose one upcoming task and state the important learning goal.",
      "Identify the specific cognitive, language, sensory, motor or executive demand creating a barrier.",
      "Choose the smallest useful adaptation or scaffold.",
      "Plan how you will teach the pupil to use the support rather than depend on the adult.",
      "State what evidence would justify keeping, changing or fading the support.",
    ],
    evidenceIdeas: ["Task completion with reduced prompting", "Accuracy/quality of pupil work", "Pupil voice", "Participation", "Scaffold use", "Independence over time"],
  },
  Leadership: {
    baselineQuestion: "What is the strongest first step when a school wants to improve a professional practice?",
    baselineOptions: [
      "Launch several initiatives at once",
      "Diagnose the problem, define a small number of intended practices and plan support before monitoring",
      "Start by ranking staff performance",
      "Send one presentation and assume implementation is complete",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Sustainable improvement starts with diagnosis, clarity, support and follow-up rather than monitoring alone.",
    commonMistakes: [
      "Launching too many priorities for staff to implement reliably",
      "Monitoring before staff have seen clear examples or had time to practise",
      "Using implementation evidence as a simplistic performance score",
      "Continuing a low-value initiative because it has already consumed time",
    ],
    practiceInstructions: [
      "State the problem the team is trying to solve and the evidence behind it.",
      "Define one to three observable practices that would indicate stronger implementation.",
      "Identify the modelling, rehearsal, resources or time staff will need.",
      "Choose evidence that shows implementation barriers without ranking individuals.",
      "Set a review point with explicit keep, adapt, scale or stop decisions.",
    ],
    evidenceIdeas: ["Implementation survey", "Department work samples", "Staff confidence/knowledge check", "Meeting follow-up", "Action completion", "Aggregated observation patterns"],
  },
  Wellbeing: {
    baselineQuestion: "Which is the most responsible way to use a wellbeing framework in school?",
    baselineOptions: [
      "Use it to diagnose the cause of an individual's behaviour",
      "Use it as one lens, consider evidence and context, and use pastoral/SEND/safeguarding routes where appropriate",
      "Lower expectations whenever someone appears stressed",
      "Assume the same support will work for everyone",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Wellbeing frameworks can guide professional curiosity but should not replace evidence, individual knowledge or specialist/safeguarding processes.",
    commonMistakes: [
      "Inferring a diagnosis or home circumstance from limited observations",
      "Treating wellbeing as only an individual's resilience problem",
      "Removing challenge automatically instead of improving support or conditions",
      "Trying to solve concerns alone instead of using appropriate school systems",
    ],
    practiceInstructions: [
      "Identify one observable environmental, workload, routine or relationship factor within the school's control.",
      "Describe the change you can make without diagnosing an individual.",
      "Keep appropriate expectations clear alongside the support.",
      "Identify the pastoral, SEND or safeguarding route if the concern goes beyond ordinary classroom support.",
      "Review whether the change improved access, predictability or participation.",
    ],
    evidenceIdeas: ["Pupil/staff voice", "Participation patterns", "Routine consistency", "Workload/process audit", "Attendance/engagement patterns used cautiously"],
  },
  "Digital Teaching": {
    baselineQuestion: "What should come first when deciding whether to use a digital or AI tool?",
    baselineOptions: [
      "Whether the tool is new or popular",
      "A clear educational/operational purpose plus privacy, accuracy, accessibility and verification checks",
      "Whether it can replace professional judgement",
      "Whether it produces the longest output",
    ],
    baselineAnswer: 1,
    baselineFeedback: "Technology should solve a clear problem while staff retain responsibility for privacy, accuracy, suitability and professional decisions.",
    commonMistakes: [
      "Choosing a tool before defining the educational or operational problem",
      "Sharing more personal or sensitive data than the task requires",
      "Assuming fluent output is accurate or unbiased",
      "Automating a professional decision that still needs human judgement",
    ],
    practiceInstructions: [
      "Define the task or learning problem before naming a tool.",
      "Identify the minimum data needed and remove sensitive information where appropriate.",
      "Define how important outputs will be checked.",
      "Consider accessibility, bias and unequal access.",
      "State the human decision that remains with the member of staff.",
    ],
    evidenceIdeas: ["Time saved", "Accuracy checks", "Accessibility review", "Teacher/pupil feedback", "Error log", "Data-protection check"],
  },
};

function startModule(course: Course): Module {
  return {
    id: `mc-start-${course.id}`,
    type: "content",
    title: "Start here: purpose, route and outcomes",
    body: `${course.summary} This flagship course is designed as a professional-learning sequence rather than a reading exercise. Begin with the baseline check, work through the core explanations and visuals, test decisions through scenarios and knowledge checks, then complete the practical tool and follow-up cycle. You do not need to implement every idea at once.`,
    keyPoints: [
      `${course.duration} minutes of core professional learning`,
      `${course.objectives.length} explicit learning outcomes`,
      `Recommended for: ${course.recommendedFor.join(", ")}`,
      "Use Course Lab for diagnostics, branching practice and subject/phase examples",
      "Use Course Studio for notes, facilitator mode, search and evidence planning",
      "Finish by choosing one small implementation action and a review point",
    ],
  };
}

function baselineModule(course: Course): Module {
  const pack = packs[course.category];
  return {
    id: `mc-baseline-${course.id}`,
    type: "quiz",
    title: "Baseline retrieval check",
    question: pack.baselineQuestion,
    options: pack.baselineOptions,
    answer: pack.baselineAnswer,
    feedback: pack.baselineFeedback,
  };
}

function roadmapModule(course: Course): Module {
  return {
    id: `mc-route-${course.id}`,
    type: "visual",
    title: "How this course turns knowledge into practice",
    layout: "flow",
    caption: "Use the course in stages. The goal is reliable professional practice, not simply reaching the final screen.",
    items: [
      { heading: "Orient", text: "Clarify the problem, outcomes and starting point.", icon: "1" },
      { heading: "Understand", text: "Build the core concepts through explanation, examples and visuals.", icon: "2" },
      { heading: "Decide", text: "Use scenarios and knowledge checks to test professional judgement.", icon: "3" },
      { heading: "Practise", text: "Create or rehearse something usable in your own setting.", icon: "4" },
      { heading: "Implement", text: "Try one focused change in real practice.", icon: "5" },
      { heading: "Review", text: "Use evidence to keep, adapt, scale or stop the change.", icon: "6" },
    ],
  };
}

function misconceptionModule(course: Course): Module {
  const pack = packs[course.category];
  return {
    id: `mc-misconceptions-${course.id}`,
    type: "content",
    title: "Common implementation mistakes",
    body: `Knowing the ideas in ${course.title} is not the same as implementing them well. Use these checks to avoid common failure modes when transferring the course into day-to-day practice.`,
    keyPoints: pack.commonMistakes,
  };
}

function resourceModule(course: Course): Module {
  const pack = packs[course.category];
  return {
    id: `mc-resource-${course.id}`,
    type: "content",
    title: "Ready-to-use professional learning materials",
    body: "Use this as a compact resource pack after the course. It is designed to reduce the gap between CPD and implementation and can be adapted for a department meeting, coaching conversation or individual action plan.",
    keyPoints: [
      `5-minute recap: explain the core purpose of ${course.title} in one sentence, then name one example and one common misuse.`,
      `Discussion prompt: which part of ${course.title} would solve a real problem in our current context?`,
      `Look-for: choose one observable practice that shows implementation without turning it into a staff score.`,
      `Evidence check: ${pack.evidenceIdeas.slice(0, 3).join("; ")}.`,
      "Exit ticket: What will I do differently, where will I try it, and what evidence will I review?",
      "Follow-up: revisit implementation after repeated use rather than relying on a one-off impression.",
    ],
  };
}

function practiceModule(course: Course): Module {
  const pack = packs[course.category];
  return {
    id: `mc-practice-${course.id}`,
    type: "activity",
    title: "Build a usable implementation tool",
    prompt: `Turn ${course.title} into something you can actually use in your setting next week.`,
    instructions: pack.practiceInstructions,
    placeholder: "Context / class / team…\nProblem or goal…\nSpecific change…\nWhat I will do…\nEvidence I will collect…\nReview decision…",
    minimumCharacters: 220,
  };
}

function evidenceModule(course: Course): Module {
  const pack = packs[course.category];
  return {
    id: `mc-evidence-${course.id}`,
    type: "checklist",
    title: "Evidence without unnecessary workload",
    prompt: "Choose proportionate evidence before you implement. You do not need every source below.",
    items: [
      ...pack.evidenceIdeas,
      "A short implementation note: what was actually done?",
      "A comparison with the intended outcome, not just whether the activity happened",
      "A decision: keep, adapt, scale, stop or revisit later",
    ],
    completionText: "Implementation evidence plan ready.",
  };
}

function followUpModule(course: Course): Module {
  return {
    id: `mc-followup-${course.id}`,
    type: "visual",
    title: "30-day implementation cycle",
    layout: "timeline",
    caption: "The course ends when practice has been reviewed, not when the final module is clicked.",
    items: [
      { heading: "Days 1–3", text: "Choose one small action and define what successful implementation would look like.", icon: "1" },
      { heading: "Week 1", text: "Try the action in a realistic context and note the main implementation barrier.", icon: "2" },
      { heading: "Week 2", text: "Repeat with one sensible refinement rather than redesigning everything.", icon: "3" },
      { heading: "Week 3", text: "Sample evidence from practice and compare it with the intended outcome.", icon: "4" },
      { heading: "Week 4", text: "Decide whether to keep, adapt, scale, stop or seek further support.", icon: "5" },
    ],
  };
}

function finalReflection(course: Course): Module {
  return {
    id: `mc-reflect-${course.id}`,
    type: "reflection",
    title: "Implementation commitment and review question",
    prompt: `From ${course.title}, identify one practice you will implement, the setting in which you will use it, the evidence you will review, and the date or event that will trigger your follow-up. Keep the change specific enough that another colleague could recognise what you actually did.`,
  };
}

export function enhanceMainCourse(course: Course): Course {
  if (!flagshipCourseIds.has(course.id)) return course;
  if (course.modules.some(module => module.id === `mc-start-${course.id}`)) return course;

  const front: Module[] = [startModule(course), baselineModule(course), roadmapModule(course)];
  const back: Module[] = [
    misconceptionModule(course),
    resourceModule(course),
    practiceModule(course),
    evidenceModule(course),
    followUpModule(course),
    finalReflection(course),
  ];

  return {
    ...course,
    modules: [...front, ...course.modules, ...back],
  };
}
