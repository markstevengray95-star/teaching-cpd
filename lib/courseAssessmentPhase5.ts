import type { Course, Module } from "./data";

const PREFIX = "phase5-assess-";
const SEP = "§";
type QuizModule = Extract<Module, { type: "quiz" }>;

type AssessmentQuestion = {
  topic: string;
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  reteach: string;
};

type CategoryProfile = {
  lens: string;
  strongAction: string;
  weakAction: string;
  evidence: string;
  inclusive: string;
  review: string;
  categoryQuestions: AssessmentQuestion[];
};

const CATEGORY_PROFILES: Record<Course["category"], CategoryProfile> = {
  "Teaching & Learning": {
    lens: "pupil thinking and the intended learning",
    strongAction: "Use a small teaching response linked to the identified misconception or barrier, then check whole-class evidence.",
    weakAction: "Add a popular strategy immediately without first identifying the learning problem it is meant to solve.",
    evidence: "Changes in pupil explanations, responses or independent work that are close to the intended learning.",
    inclusive: "Preserve the learning goal while reducing avoidable language, memory, access or task barriers.",
    review: "Keep, adapt, fade or stop the teaching response according to what pupil evidence shows.",
    categoryQuestions: [
      { topic: "diagnosis", prompt: "Which source gives the strongest evidence about whole-class understanding?", options: ["A single confident volunteer", "A whole-class response to a diagnostic question", "How quiet the room feels", "Whether the activity finished on time"], answer: 1, explanation: "Whole-class response methods reduce sampling bias and reveal patterns in understanding.", reteach: "Revisit the course sections on diagnostic evidence and making pupil thinking visible." },
      { topic: "adaptation", prompt: "Several pupils understand an idea verbally but cannot begin an extended written task. What is the strongest first adjustment?", options: ["Lower the learning goal for the group", "Provide a temporary scaffold that preserves the same goal", "Complete the first half for them", "Remove the task permanently"], answer: 1, explanation: "A temporary scaffold can improve access without unnecessarily lowering ambition.", reteach: "Revisit inclusive application and the worked example on barrier reduction." },
      { topic: "evidence", prompt: "Which measure is closest to impact rather than implementation?", options: ["The routine appeared in lesson plans", "Staff attended the CPD", "Pupil errors on the target concept reduced over time", "The resource was downloaded"], answer: 2, explanation: "Impact evidence is close to the intended pupil outcome; the other options mainly show implementation or participation.", reteach: "Revisit the evidence and follow-through section." },
      { topic: "review", prompt: "A strategy was implemented consistently but the target misconception did not improve. What is the strongest next move?", options: ["Continue unchanged because implementation was faithful", "Add several more strategies at once", "Review the diagnosis and adapt or stop the response", "Assume pupils were not trying"], answer: 2, explanation: "Fidelity alone does not prove impact. The response should be reviewed against the intended outcome.", reteach: "Revisit keep/adapt/fade/stop review decisions." },
    ],
  },
  Safeguarding: {
    lens: "safety, factual recording, current school procedure and professional role boundaries",
    strongAction: "Listen, record factually, use the current school reporting route promptly and stay within role boundaries.",
    weakAction: "Wait for proof, investigate independently or replace the school's current safeguarding procedure with personal judgement.",
    evidence: "Accurate chronology, factual records and evidence that concerns reached the appropriate safeguarding route promptly.",
    inclusive: "Respond calmly and accessibly while avoiding leading questions, promises of secrecy or assumptions about presentation.",
    review: "Follow the current school safeguarding policy and DSL/deputy guidance; escalate through the agreed route when required.",
    categoryQuestions: [
      { topic: "disclosure", prompt: "A pupil begins to share information that may indicate a safeguarding concern. What should the member of staff prioritise?", options: ["Promise secrecy so the pupil continues", "Listen, avoid leading questions and explain the information may need to be shared", "Interview other pupils for confirmation", "Wait until there is proof before recording anything"], answer: 1, explanation: "The immediate role is to listen appropriately, avoid investigation and follow the school's reporting process.", reteach: "Revisit responding to disclosures and professional role boundaries." },
      { topic: "recording", prompt: "Which record is strongest?", options: ["A factual chronology using observed information and the pupil's words where appropriate", "A detailed theory about what probably happened", "A summary written several days later from memory", "A judgement about whether the pupil seemed believable"], answer: 0, explanation: "Safeguarding records should distinguish facts, words, chronology and action from interpretation.", reteach: "Revisit factual recording and chronology." },
      { topic: "reporting", prompt: "What should take precedence if training content conflicts with the school's current safeguarding procedure?", options: ["The training slide", "The school's current policy and safeguarding lead guidance", "Whichever route is quickest", "A colleague's preferred process"], answer: 1, explanation: "Current school procedure and safeguarding leadership should govern the response.", reteach: "Revisit the course reminder about current policy and reporting routes." },
      { topic: "evidence", prompt: "Which is weak evidence of safeguarding effectiveness on its own?", options: ["Concerns are passed on promptly", "Records need fewer factual corrections", "Staff attended annual training", "Staff can identify the reporting route"], answer: 2, explanation: "Attendance shows participation but does not by itself demonstrate secure safeguarding practice.", reteach: "Revisit implementation versus impact evidence." },
    ],
  },
  SEND: {
    lens: "the pupil-specific barrier, access to the intended learning and growing independence",
    strongAction: "Identify the actual barrier, use pupil-specific information and provide proportionate support that can be reviewed and faded.",
    weakAction: "Choose a strategy from a diagnosis label without checking whether it addresses this pupil's barrier in this task.",
    evidence: "The pupil accesses more of the intended thinking independently and can use reduced support over time where appropriate.",
    inclusive: "Use clear communication, accessible representations and predictable scaffolds while keeping ambition appropriate.",
    review: "Use pupil response, work and relevant plans or specialist advice to decide whether support should be kept, adapted or faded.",
    categoryQuestions: [
      { topic: "barrier", prompt: "What is the strongest starting point for adapting a task for a pupil with SEND?", options: ["The diagnosis label alone", "The actual barrier created by the task and context", "A generic strategy list", "Reducing the learning goal automatically"], answer: 1, explanation: "Adaptive support should respond to the pupil-task barrier rather than a stereotype.", reteach: "Revisit the barrier analysis and inclusive application sections." },
      { topic: "independence", prompt: "Which outcome best indicates that a scaffold is helping?", options: ["The adult completes more of the task", "The pupil is quieter", "The pupil completes more of the important thinking independently", "The scaffold is used in every lesson"], answer: 2, explanation: "Useful support should improve access while protecting or increasing pupil independence.", reteach: "Revisit the course content on scaffolding and independence." },
      { topic: "ambition", prompt: "A pupil cannot start a complex task but can explain the concept orally. What is the strongest response?", options: ["Replace the objective with an easier one", "Use a temporary structure for starting the same task", "Remove all written work", "Complete the opening paragraph for the pupil"], answer: 1, explanation: "The route can be adapted while the intended learning remains ambitious.", reteach: "Revisit keep-the-goal/change-the-route reasoning." },
      { topic: "review", prompt: "When should a scaffold be reviewed?", options: ["Only at the end of the year", "When evidence suggests the pupil may need it adapted, reduced or changed", "Never once it appears on a plan", "Only if the pupil requests removal"], answer: 1, explanation: "Support should remain responsive rather than becoming permanent by default.", reteach: "Revisit evidence, review and fading support." },
    ],
  },
  Leadership: {
    lens: "clarity, implementation conditions, proportionate evidence and sustainable improvement",
    strongAction: "Clarify the small number of expected behaviours, diagnose barriers, provide support and review implementation with proportionate evidence.",
    weakAction: "Add more monitoring or another initiative before checking whether staff had clarity, capability, time and support.",
    evidence: "Observable implementation plus evidence that the intended pupil, staff or organisational outcome is changing.",
    inclusive: "Design improvement so expectations, support, workload and access are clear for the staff who must implement it.",
    review: "Use implementation and impact evidence to decide what to sustain, adapt, support further or stop.",
    categoryQuestions: [
      { topic: "clarity", prompt: "A department initiative is inconsistent. What should a leader check first?", options: ["Whether another initiative should replace it", "Whether the expected practice is clear and barriers are understood", "Which staff member should be ranked lowest", "Whether monitoring frequency can be doubled"], answer: 1, explanation: "Clarity and barrier diagnosis should come before adding pressure or change.", reteach: "Revisit clarity before monitoring and implementation conditions." },
      { topic: "evidence", prompt: "Which is strongest implementation evidence?", options: ["Everyone attended the launch", "The agreed routine is observable across relevant team practice and staff can explain it", "One successful example was seen once", "The policy document exists"], answer: 1, explanation: "Implementation evidence asks whether the intended practice is happening with sufficient consistency and understanding.", reteach: "Revisit implementation evidence and follow-up." },
      { topic: "support", prompt: "What is the strongest response when staff understand a change but lack confidence using it?", options: ["Add a compliance deadline only", "Model, rehearse and give focused feedback", "Publish a ranking", "Introduce a second priority"], answer: 1, explanation: "Capability gaps are best addressed through professional learning and rehearsal rather than additional ambiguity.", reteach: "Revisit modelling, rehearsal and coaching support." },
      { topic: "impact", prompt: "Which measure is closest to impact?", options: ["Staff opened the guidance", "The routine was mentioned in meetings", "The targeted pupil or organisational outcome changed in the intended direction", "The launch event received positive feedback"], answer: 2, explanation: "Impact evidence concerns the intended outcome, not merely participation or visibility.", reteach: "Revisit impact measures and review decisions." },
    ],
  },
  Wellbeing: {
    lens: "avoidable workload, role clarity, duplication and sustainable working conditions",
    strongAction: "Identify a controllable source of friction, simplify the system without removing essential functions and review the effect over time.",
    weakAction: "Add a wellbeing activity on top of unchanged workload systems and treat immediate satisfaction as proof of impact.",
    evidence: "Reduced avoidable time or duplication alongside maintained educational, operational and safeguarding quality.",
    inclusive: "Consider different roles, working patterns, access needs and the distribution of workload rather than assuming one solution suits all staff.",
    review: "Keep changes that reduce friction without creating new risks; adapt or stop those that shift workload elsewhere.",
    categoryQuestions: [
      { topic: "systems", prompt: "Which response is most likely to improve sustainable workload?", options: ["Add a wellbeing event to the calendar", "Remove or simplify a duplicated recurring process", "Ask staff to become more resilient", "Add another reporting form"], answer: 1, explanation: "System-level workload reduction addresses a controllable source of repeated friction.", reteach: "Revisit controllable systems and duplication." },
      { topic: "evidence", prompt: "Which measure gives stronger evidence of workload impact?", options: ["Attendance at a wellbeing session", "Time spent on a recurring process before and after the change", "A launch-day satisfaction score", "Number of reminder emails sent"], answer: 1, explanation: "A direct measure of the target workload process is more informative than participation or immediate reaction.", reteach: "Revisit evidence and impact measures." },
      { topic: "safety", prompt: "What should happen before removing an unpopular process?", options: ["Remove it immediately", "Check its educational, operational and safeguarding purpose and redesign proportionately", "Replace it with two shorter processes", "Keep it forever because it already exists"], answer: 1, explanation: "Workload reduction should not accidentally remove an essential function.", reteach: "Revisit proportionate system redesign." },
      { topic: "review", prompt: "A change saves one team time but transfers the same workload to another team. What is the strongest conclusion?", options: ["The change was successful", "The impact needs wider review and redesign", "The second team should work faster", "Only the first team's feedback matters"], answer: 1, explanation: "Sustainable improvement considers the whole workflow rather than moving friction elsewhere.", reteach: "Revisit whole-system review and unintended consequences." },
    ],
  },
  "Digital Teaching": {
    lens: "educational purpose, privacy, accuracy, accessibility and accountable human oversight",
    strongAction: "Use the tool for a defined purpose, protect sensitive information, verify important outputs and retain human accountability.",
    weakAction: "Adopt a tool because it is new or polished and accept its output without checking privacy, accuracy or educational value.",
    evidence: "The task improves without unacceptable errors, access barriers, privacy problems or loss of professional oversight.",
    inclusive: "Check accessibility, alternative routes, digital confidence and whether technology creates new barriers for pupils or staff.",
    review: "Continue only where the tool adds value and important outputs remain checked by an accountable person.",
    categoryQuestions: [
      { topic: "privacy", prompt: "Which is the safest default with a general-purpose AI or digital tool?", options: ["Paste identifiable sensitive pupil information", "Remove sensitive data and follow approved school processes", "Assume the provider handles every school use case", "Share accounts so setup is quicker"], answer: 1, explanation: "Sensitive information should be protected and school-approved processes followed.", reteach: "Revisit privacy, safeguarding and approved use." },
      { topic: "accuracy", prompt: "A generated resource looks polished. What should happen before important use?", options: ["Use it because presentation quality indicates accuracy", "Verify factual and educational suitability", "Ask the tool if it is confident", "Remove human review to save time"], answer: 1, explanation: "Professional-looking output can still contain errors, bias or unsuitable content.", reteach: "Revisit accuracy and human oversight." },
      { topic: "purpose", prompt: "What is the strongest reason to adopt a digital tool?", options: ["It is new", "It serves a clear educational or operational purpose better enough to justify its costs and risks", "Other schools mention it", "It can automate the most tasks"], answer: 1, explanation: "Technology should be selected for a clear purpose rather than novelty or automation volume.", reteach: "Revisit purpose before tool selection." },
      { topic: "access", prompt: "A tool improves speed but creates a barrier for some users. What is the strongest response?", options: ["Ignore the barrier because most users benefit", "Review accessibility and provide an effective alternative or adaptation", "Require everyone to use it identically", "Remove all technology"], answer: 1, explanation: "Efficiency should not be gained by excluding users who need an accessible route.", reteach: "Revisit accessibility and inclusive digital practice." },
    ],
  },
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function encode(question: AssessmentQuestion) {
  const safe = (value: string) => value.replaceAll(SEP, " ").replace(/\s+/g, " ").trim();
  return `[q|${safe(question.topic)}|${question.answer}] ${[question.prompt, ...question.options, question.explanation, question.reteach].map(safe).join(SEP)}`;
}

function fromExistingQuiz(module: QuizModule, index: number): AssessmentQuestion | null {
  if (module.id.startsWith(PREFIX) || module.options.length < 4 || module.answer < 0 || module.answer > 3) return null;
  return {
    topic: `course-check-${index + 1}`,
    prompt: module.question,
    options: [module.options[0], module.options[1], module.options[2], module.options[3]],
    answer: module.answer,
    explanation: module.feedback,
    reteach: `Revisit the course section connected to “${module.title}” and explain why the correct response is stronger before retrying.`,
  };
}

function universalQuestions(course: Course, profile: CategoryProfile): AssessmentQuestion[] {
  const objective = course.objectives[0] || course.summary;
  const second = course.objectives[1] || "use evidence to guide professional decisions";
  return [
    {
      topic: "purpose",
      prompt: `When applying ${course.title}, which starting point gives the strongest professional foundation?`,
      options: [
        "Choose the most familiar technique first and justify it afterwards.",
        `Clarify the intended outcome, then gather enough evidence about ${profile.lens} before acting.`,
        "Use several interventions at once so at least one is likely to work.",
        "Judge success mainly by whether the activity was completed.",
      ],
      answer: 1,
      explanation: "A clear outcome and proportionate baseline evidence make later decisions easier to justify and review.",
      reteach: "Revisit the opening challenge, course brief and worked application model.",
    },
    {
      topic: "objective",
      prompt: `Which action best supports this course objective: “${objective}”?`,
      options: [profile.weakAction, profile.strongAction, "Copy the routine exactly in every context without checking fit.", "Measure only whether staff or pupils say they liked the activity."],
      answer: 1,
      explanation: `The strongest response connects ${course.title} to a defined purpose, a proportionate action and evidence that can be reviewed.`,
      reteach: `Revisit the deep knowledge section and the objective: ${objective}`,
    },
    {
      topic: "evidence",
      prompt: `Which is the strongest evidence that ${course.title} is having the intended effect?`,
      options: ["The training was completed.", "The strategy appears in a plan.", profile.evidence, "The approach is popular with colleagues."],
      answer: 2,
      explanation: "Impact evidence should sit close to the intended outcome rather than participation, visibility or popularity.",
      reteach: "Revisit Evidence, implementation and whole-school follow-through plus the Phase 4 Evidence Analyst.",
    },
    {
      topic: "inclusion",
      prompt: `Which principle best protects inclusive application of ${course.title}?`,
      options: ["Use the same support in exactly the same way for everyone.", profile.inclusive, "Lower expectations whenever a barrier appears.", "Add more adult support before identifying the barrier."],
      answer: 1,
      explanation: "Inclusive practice responds to the actual barrier while protecting the intended professional or learning outcome.",
      reteach: "Revisit the inclusive application section and the course hotspot investigation.",
    },
    {
      topic: "review",
      prompt: `Evidence shows that the chosen response in ${course.title} is not improving the intended outcome. What is the strongest next step?`,
      options: ["Continue unchanged because the response was implemented faithfully.", profile.review, "Add several new responses before reviewing the original one.", "Treat the lack of impact as proof that the people involved are resistant."],
      answer: 1,
      explanation: "Professional learning should end in a review decision rather than automatic continuation.",
      reteach: "Revisit keep/adapt/fade/stop and the implementation simulator.",
    },
    {
      topic: "implementation",
      prompt: `Which statement best distinguishes implementation evidence from impact evidence in ${course.title}?`,
      options: ["Implementation asks whether the agreed practice happened; impact asks whether the intended outcome changed.", "Implementation and impact are the same if staff completed the training.", "Impact should be measured before checking whether the approach was used.", "Implementation evidence should rely mainly on staff enjoyment."],
      answer: 0,
      explanation: "You need to know both whether the change happened and whether the target outcome changed; they answer different questions.",
      reteach: "Revisit the Phase 4 Evidence Analyst and Phase 2 evidence section.",
    },
    {
      topic: "transfer",
      prompt: `What makes transfer from ${course.title} into day-to-day practice most likely?`,
      options: ["A memorable presentation on its own", `A specific action linked to “${second}”, evidence to collect and a review point`, "A longer list of optional strategies", "Repeating the same technique regardless of context"],
      answer: 1,
      explanation: "Transfer improves when staff leave with a defined action, evidence and review point rather than a broad intention.",
      reteach: "Revisit the Transfer section and implementation commitment.",
    },
    {
      topic: "misconception",
      prompt: `Which response is most likely to weaken professional judgement in ${course.title}?`,
      options: ["Separating observation from assumption", "Checking the intended outcome", profile.weakAction, "Reviewing whether the response should be adapted"],
      answer: 2,
      explanation: "Premature action without diagnosis makes it harder to know whether the response is appropriate or effective.",
      reteach: "Revisit misconceptions, limits and non-examples." ,
    },
  ];
}

function questionBank(course: Course) {
  const profile = CATEGORY_PROFILES[course.category];
  const existing = course.modules
    .filter((module): module is QuizModule => module.type === "quiz" && !module.id.startsWith(PREFIX))
    .map(fromExistingQuiz)
    .filter((question): question is AssessmentQuestion => Boolean(question))
    .slice(0, 5);
  const bank = [...existing, ...profile.categoryQuestions, ...universalQuestions(course, profile)];
  const seen = new Set<string>();
  return bank.filter(question => {
    const key = question.prompt.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assessmentModule(course: Course, kind: "diagnostic" | "retrieval" | "scenario" | "mastery" | "application", bank: AssessmentQuestion[]): QuizModule {
  const id = `${PREFIX}${safeId(course.id)}-${kind}`;
  const config = {
    diagnostic: { title: "Phase 5 · Diagnostic pre-check", prompt: "Answer a short baseline set before the main assessment sequence. There is no pass mark: the purpose is to identify what to revisit.", feedback: "Diagnostic baseline completed.", count: 6 },
    retrieval: { title: "Phase 5 · Retrieval mastery sprint", prompt: "Complete a rotating retrieval set. Reach at least 75% to unlock completion; missed areas trigger targeted reteach before a new attempt.", feedback: "Retrieval mastery threshold reached.", count: 9 },
    scenario: { title: "Phase 5 · Scenario application assessment", prompt: "Apply the course ideas to realistic professional decisions. Reach at least 75% and use the feedback to refine weaker judgement.", feedback: "Scenario application threshold reached.", count: 10 },
    mastery: { title: "Phase 5 · Final understanding assessment", prompt: "Complete a rotating final assessment across purpose, evidence, inclusion, misconceptions, implementation and review. Reach at least 80% to unlock completion.", feedback: "Final mastery threshold reached.", count: 12 },
    application: { title: "Phase 5 · Demonstrated application gate", prompt: "Finish with three high-value professional judgement questions. All three must be secure before the course can move to its implementation commitment.", feedback: "Demonstrated application secured.", count: 9 },
  }[kind];
  const repeated = bank.length ? bank : universalQuestions(course, CATEGORY_PROFILES[course.category]);
  const options = Array.from({ length: Math.max(config.count, repeated.length) }, (_, index) => encode(repeated[index % repeated.length]));
  return { id, type: "quiz", title: config.title, question: config.prompt, options, answer: 0, feedback: config.feedback };
}

export function addCourseAssessmentPhase5(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));
  const bank = questionBank(course);
  const diagnostic = assessmentModule(course, "diagnostic", bank);
  const retrieval = assessmentModule(course, "retrieval", bank);
  const scenario = assessmentModule(course, "scenario", bank);
  const mastery = assessmentModule(course, "mastery", bank);
  const application = assessmentModule(course, "application", bank);

  const baselineIndex = modules.findIndex(module => module.id.includes("-baseline"));
  modules.splice(baselineIndex >= 0 ? baselineIndex + 1 : Math.min(3, modules.length), 0, diagnostic);

  const understandIndex = modules.findIndex(module => module.id === `phase3-present-${id}-section-understand`);
  const retrievalAt = understandIndex >= 0 ? Math.min(modules.length, understandIndex + 3) : Math.min(8, modules.length);
  modules.splice(retrievalAt, 0, retrieval);

  const transferIndex = modules.findIndex(module => module.id === `phase3-present-${id}-section-transfer`);
  const scenarioAt = transferIndex >= 0 ? transferIndex : Math.max(0, modules.length - 3);
  modules.splice(scenarioAt, 0, scenario);

  const commitmentIndex = modules.findIndex(module => module.id.includes("implementation-commitment"));
  const finalAt = commitmentIndex >= 0 ? commitmentIndex : modules.length;
  modules.splice(finalAt, 0, mastery, application);

  return { ...course, duration: course.duration + 30, modules };
}

function parseEncoded(value: string) {
  const match = value.match(/^\[q\|([^|]+)\|(\d+)\]\s*(.*)$/);
  if (!match) return null;
  const parts = match[3].split(SEP);
  if (parts.length < 7) return null;
  const answer = Number(match[2]);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  return { topic: match[1], answer, parts };
}

export function validateCourseAssessmentPhase5(course: Course) {
  const id = safeId(course.id);
  const kinds = ["diagnostic", "retrieval", "scenario", "mastery", "application"] as const;
  kinds.forEach(kind => {
    const moduleId = `${PREFIX}${id}-${kind}`;
    const module = course.modules.find((item): item is QuizModule => item.id === moduleId && item.type === "quiz");
    if (!module) throw new Error(`CPD course ${course.id} is missing Phase 5 assessment ${kind}`);
    const minimum = kind === "diagnostic" ? 6 : kind === "retrieval" ? 9 : kind === "scenario" ? 10 : kind === "mastery" ? 12 : 9;
    if (module.options.length < minimum) throw new Error(`CPD course ${course.id} Phase 5 ${kind} bank has only ${module.options.length} questions`);
    if (module.options.some(option => !parseEncoded(option))) throw new Error(`CPD course ${course.id} Phase 5 ${kind} contains invalid encoded assessment data`);
  });
}

export function auditCourseAssessmentPhase5(course: Course) {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`) && module.type === "quiz") as QuizModule[];
  const bankQuestions = modules.reduce((sum, module) => sum + module.options.length, 0);
  const uniquePrompts = new Set<string>();
  modules.forEach(module => module.options.forEach(option => {
    const parsed = parseEncoded(option);
    if (parsed) uniquePrompts.add(parsed.parts[0]);
  }));
  return {
    courseId: course.id,
    title: course.title,
    phase5Modules: modules.length,
    bankQuestions,
    uniqueQuestions: uniquePrompts.size,
    diagnosticReady: modules.some(module => module.id.endsWith("-diagnostic")),
    masteryGateReady: modules.some(module => module.id.endsWith("-mastery")) && modules.some(module => module.id.endsWith("-application")),
  };
}
