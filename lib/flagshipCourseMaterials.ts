import type { Course, Module } from "./data";

type Concept = { term: string; definition: string };
type Mastery = { question: string; options: string[]; answer: number; feedback: string };

type FlagshipMaterial = {
  concepts: Concept[];
  practicePrompt: string;
  practiceSteps: string[];
  mastery: Mastery;
};

const materials: Record<string, FlagshipMaterial> = {
  "rosenshine-principles": {
    concepts: [
      { term: "Review", definition: "Purposeful retrieval of prerequisite or previously learned knowledge that supports current learning." },
      { term: "Small steps", definition: "Manageable chunks of unfamiliar learning, sized according to pupils' prior knowledge and task complexity." },
      { term: "Guided practice", definition: "Pupil practice while prompts, checking, correction and teacher support are still available." },
      { term: "Scaffold", definition: "Temporary support that enables successful thinking or performance and can be reduced as expertise grows." },
      { term: "Checking for understanding", definition: "Gathering evidence that changes the teacher's next instructional decision." },
      { term: "Independent practice", definition: "Practice after pupils can perform the process with enough success that reduced support is productive." },
    ],
    practicePrompt: "Rebuild one difficult lesson around support, checking and gradual independence.",
    practiceSteps: ["Name the prerequisite knowledge.", "Write the first model or worked example.", "Add a whole-class check that exposes a likely misconception.", "Plan guided practice and the prompts available.", "State the evidence that would allow support to fade.", "Schedule one later review."],
    mastery: { question: "Which statement best captures strong use of Rosenshine's principles?", options: ["Every lesson must contain all ten principles in a fixed order", "Teachers use the principles responsively to connect prior knowledge, modelling, practice, checking and increasing independence", "The principles remove the need for teacher judgement", "Independent work should always come before modelling"], answer: 1, feedback: "The principles are connected instructional ideas, not a mandatory ten-stage lesson script." },
  },
  "effective-questioning": {
    concepts: [
      { term: "Hinge question", definition: "A question designed to reveal whether pupils are ready to move on or need further teaching." },
      { term: "Wait time", definition: "Deliberate thinking time between asking a question and sampling responses." },
      { term: "Sampling", definition: "Gathering responses broadly enough to avoid relying only on confident volunteers." },
      { term: "Distractor", definition: "A plausible wrong answer that helps expose a specific misconception in a multiple-choice question." },
      { term: "Probe", definition: "A follow-up question that asks for reasoning, evidence, clarification or connection." },
      { term: "Response routine", definition: "A predictable way for all pupils to think and show an answer." },
    ],
    practicePrompt: "Design a diagnostic questioning sequence for one important misconception.",
    practiceSteps: ["Name the concept and likely misconception.", "Write one hinge question.", "Create plausible wrong answers where useful.", "Choose how every pupil will respond.", "Plan one probe for a correct answer and one for a misconception.", "State what you will do for each response pattern."],
    mastery: { question: "What makes a classroom question genuinely diagnostic?", options: ["It is difficult", "It produces evidence that helps the teacher decide what to do next", "Only high-attaining pupils can answer it", "It has a long written answer"], answer: 1, feedback: "Diagnostic questions are designed around an instructional decision, not simply difficulty." },
  },
  "cognitive-load-theory": {
    concepts: [
      { term: "Working memory", definition: "The limited system used to hold and process unfamiliar information during a task." },
      { term: "Long-term memory", definition: "Stored knowledge that can make complex thinking easier when it is well organised and accessible." },
      { term: "Intrinsic complexity", definition: "The complexity inherent in what must be learned, relative to what the learner already knows." },
      { term: "Extraneous load", definition: "Avoidable demand created by poor explanation, layout, split attention or irrelevant information." },
      { term: "Worked example", definition: "A completed or partly completed model that makes the structure and decisions in a task visible." },
      { term: "Expertise reversal", definition: "The possibility that support useful for novices becomes redundant or obstructive for more knowledgeable learners." },
    ],
    practicePrompt: "Redesign one explanation or resource to reduce avoidable cognitive demand while preserving the important thinking.",
    practiceSteps: ["Identify what is genuinely difficult in the content.", "Identify what pupils must already know.", "Remove one irrelevant or duplicated source of information.", "Integrate information that pupils currently have to mentally combine.", "Add or improve a worked example for novice learners.", "State when the support should be reduced."],
    mastery: { question: "Which change most directly reduces avoidable cognitive load?", options: ["Adding decorative information", "Integrating essential labels with the diagram they explain", "Giving several unfamiliar representations at once", "Removing all challenging thinking"], answer: 1, feedback: "Reducing split attention can free working memory for the learning itself without lowering the intellectual goal." },
  },
  "behaviour-management": {
    concepts: [
      { term: "Routine", definition: "A taught and rehearsed sequence that makes expected behaviour predictable." },
      { term: "Cue", definition: "A concise signal that prompts pupils to begin an established routine." },
      { term: "Active supervision", definition: "Intentional scanning, movement and timely response while pupils are working or transitioning." },
      { term: "Pre-correction", definition: "Reminding or rehearsing an expectation immediately before a situation where it is likely to be needed." },
      { term: "Calm correction", definition: "Brief, proportionate response that redirects behaviour without unnecessary escalation." },
      { term: "Repair", definition: "A professional follow-up that restores expectations and relationships after difficulty." },
    ],
    practicePrompt: "Rebuild one high-friction classroom routine so expectations are explicitly taught rather than repeatedly corrected.",
    practiceSteps: ["Choose one transition or routine where learning time is commonly lost.", "Describe exactly what successful behaviour looks and sounds like.", "Write the cue staff will use.", "Plan how it will be taught and rehearsed.", "Choose how staff will respond to minor deviation consistently.", "Set a date to review whether the routine is becoming more independent."],
    mastery: { question: "Which approach is most likely to create a sustainable classroom routine?", options: ["Correct pupils differently each time", "Teach, cue, rehearse and reinforce a clear routine consistently", "Assume pupils already know the routine", "Add a new consequence every week"], answer: 1, feedback: "Predictable routines depend on explicit teaching, cues, rehearsal and consistent follow-through." },
  },
  "retrieval-practice": {
    concepts: [
      { term: "Retrieval", definition: "Attempting to bring learned information to mind before seeing the answer." },
      { term: "Spacing", definition: "Returning to important knowledge after increasing intervals rather than massing review together." },
      { term: "Interleaving", definition: "Mixing related material when learners benefit from practising how to discriminate between problem types or concepts." },
      { term: "Feedback", definition: "Information that corrects errors or strengthens the intended response after a retrieval attempt." },
      { term: "Cumulative review", definition: "Revisiting high-value knowledge from previous lessons, units and time periods." },
      { term: "Desirable difficulty", definition: "Effort that supports learning rather than difficulty added for its own sake." },
    ],
    practicePrompt: "Build a one-month cumulative retrieval routine linked directly to your curriculum.",
    practiceSteps: ["List six to ten pieces of high-value knowledge.", "Identify prerequisite items needed later.", "Schedule short retrieval tomorrow, next week and later in the month.", "Use at least two retrieval formats.", "Plan how pupils will check and correct responses.", "Add one application task that combines several items."],
    mastery: { question: "Which description best matches effective retrieval practice?", options: ["Rereading the same notes each day", "Attempting to recall important knowledge over time and then receiving useful feedback", "Frequent high-stakes grading", "Using only yesterday's content"], answer: 1, feedback: "Retrieval is the act of recalling; spacing and feedback make the practice more useful over time." },
  },
  "adaptive-teaching": {
    concepts: [
      { term: "Shared learning goal", definition: "The important knowledge or skill pupils are working towards, retained where appropriate while support varies." },
      { term: "Barrier", definition: "A specific demand in the task, explanation or environment that limits access or participation." },
      { term: "Scaffold", definition: "Temporary structure or prompt that supports access while keeping important thinking with the pupil." },
      { term: "Representation", definition: "A model, diagram, example, concrete resource or language structure used to make an idea accessible." },
      { term: "Formative evidence", definition: "Information from responses, work or observation used to change teaching or support." },
      { term: "Fading", definition: "Deliberately reducing support when evidence shows the learner can succeed with less." },
    ],
    practicePrompt: "Redesign one task around an ambitious shared goal and a specific access barrier.",
    practiceSteps: ["State the important learning goal.", "Identify the precise barrier rather than a broad label.", "Choose one strong universal support.", "Add one targeted scaffold only if needed.", "Write a quick check that shows whether the adaptation is helping.", "Define the evidence that would allow the support to fade."],
    mastery: { question: "Which example best represents adaptive teaching?", options: ["Automatically lower the objective for any pupil who struggles", "Use evidence to identify a barrier, adapt support while preserving important learning, then review and fade support where possible", "Give every pupil a separate worksheet", "Keep all scaffolds permanently"], answer: 1, feedback: "Adaptive teaching is evidence-responsive and aims to maintain ambitious learning while varying access and support." },
  },
  "effective-feedback": {
    concepts: [
      { term: "Learning goal", definition: "The intended knowledge, skill or quality against which current performance is considered." },
      { term: "Task feedback", definition: "Information about accuracy, completeness or a feature of the current work." },
      { term: "Process feedback", definition: "Information about the strategy, reasoning or method used to complete the task." },
      { term: "Self-regulation feedback", definition: "Information that helps learners monitor, check and improve their own work." },
      { term: "Actionable feedback", definition: "Feedback that gives the learner a realistic next action they have time and support to complete." },
      { term: "Response opportunity", definition: "Protected time for pupils to correct, redraft, reattempt or otherwise use the feedback." },
    ],
    practicePrompt: "Redesign one feedback routine so pupils actually do something useful with the information.",
    practiceSteps: ["Name the learning goal.", "Identify the highest-value gap in current performance.", "Write a focused next step rather than correcting everything.", "Plan the pupil response task.", "Protect time for that response.", "Decide how you will check whether performance improved."],
    mastery: { question: "When is feedback most likely to influence learning?", options: ["When it is as long as possible", "When it focuses attention on a useful next step and pupils have an opportunity to act on it", "When it is only a grade", "When every error receives equal commentary"], answer: 1, feedback: "Feedback has more value when it is usable and followed by pupil action." },
  },
  "metacognition-self-regulation": {
    concepts: [
      { term: "Metacognitive knowledge", definition: "Knowledge about tasks, strategies and oneself as a learner that can inform choices." },
      { term: "Plan", definition: "Clarify the goal, task demands and strategy before starting." },
      { term: "Monitor", definition: "Check progress and understanding while carrying out the task." },
      { term: "Adjust", definition: "Change strategy or effort when monitoring shows the current approach is not working." },
      { term: "Evaluate", definition: "Review the outcome and strategy after the task to inform future choices." },
      { term: "Think-aloud", definition: "A model in which an expert makes otherwise hidden planning, monitoring and decision-making visible." },
    ],
    practicePrompt: "Make the hidden planning and monitoring in one subject task visible to pupils.",
    practiceSteps: ["Choose a task where novices often do not know how to start.", "List the expert decisions you make automatically.", "Write a short think-aloud for planning the task.", "Add a monitoring question pupils can use mid-task.", "Add an adjustment strategy for a common difficulty.", "Finish with an evaluation prompt that can transfer to a future task."],
    mastery: { question: "What is the main purpose of explicitly teaching metacognitive strategies?", options: ["Give pupils a generic checklist for every task", "Help pupils choose, monitor and adapt strategies increasingly independently", "Replace subject knowledge", "Make all tasks feel easy"], answer: 1, feedback: "Metacognition supports increasingly independent strategy selection and self-regulation alongside strong subject knowledge." },
  },
  "send-inclusive-practice": {
    concepts: [
      { term: "High-quality teaching", definition: "Strong everyday instruction designed to make important learning accessible to the class while maintaining ambition." },
      { term: "Reasonable adjustment", definition: "A change that reduces a disadvantage for a disabled pupil in line with relevant duties and individual circumstances." },
      { term: "Barrier analysis", definition: "Identifying the specific task or environmental demand that prevents access or participation." },
      { term: "Scaffold", definition: "Targeted temporary support selected for a real barrier, not simply because a pupil has a label." },
      { term: "Independence", definition: "The pupil's increasing ability to participate and think without unnecessary adult or material support." },
      { term: "Review", definition: "Checking whether support is working and deciding whether to keep, change or fade it." },
    ],
    practicePrompt: "Use a barrier-to-independence analysis on one genuine classroom task.",
    practiceSteps: ["State the learning goal that should remain ambitious.", "Identify the exact barrier created by the task or environment.", "Record what strong universal teaching already provides.", "Choose one additional adjustment or scaffold if needed.", "Decide how the pupil will remain responsible for the important thinking.", "Plan how and when the support will be reviewed."],
    mastery: { question: "Which principle best supports inclusive teaching?", options: ["Start with a diagnostic label and select a standard strategy", "Start with the learning goal and specific barrier, use pupil-specific information, then review the impact of support", "Always lower the goal", "Keep successful scaffolds permanently"], answer: 1, feedback: "Inclusive support should be barrier-specific, ambitious and reviewed for impact and independence." },
  },
  "safeguarding-essentials": {
    concepts: [
      { term: "Professional curiosity", definition: "Noticing and sharing concerns without jumping to conclusions or conducting an investigation oneself." },
      { term: "Disclosure", definition: "Information a child shares that may raise a safeguarding concern and requires an appropriate professional response." },
      { term: "Factual record", definition: "A timely record that distinguishes what was observed, what was said and what action was taken." },
      { term: "DSL", definition: "The Designated Safeguarding Lead who takes lead responsibility for safeguarding and child protection arrangements in the school." },
      { term: "Low-level concern", definition: "A concern about an adult's behaviour that may not meet the harm threshold but should be handled through the school's current procedure." },
      { term: "Whistleblowing", definition: "A route for raising concerns about unsafe practice or wrongdoing when normal processes are inappropriate or ineffective." },
    ],
    practicePrompt: "Build a local safeguarding readiness card without recording confidential pupil information.",
    practiceSteps: ["Record where the current safeguarding policy is found.", "Record how to contact the DSL/deputy through the school's approved route.", "State how a concern is recorded and submitted.", "State the alternative route for a concern about an adult or the usual reporting person.", "Record the whistleblowing/escalation route.", "Identify one part of current procedure you need to refresh with the DSL."],
    mastery: { question: "What is the strongest all-staff response to a safeguarding concern?", options: ["Investigate until you are certain", "Respond appropriately, record facts and report promptly through the school's safeguarding route", "Keep the concern private unless a second member of staff agrees", "Store a note on a personal device"], answer: 1, feedback: "All staff need to know how to respond, record and report; investigation belongs to the appropriate safeguarding process." },
  },
  "health-safety-essentials-schools": {
    concepts: [
      { term: "Hazard", definition: "Something with the potential to cause harm." },
      { term: "Risk", definition: "The likelihood and potential consequence of harm in the actual situation." },
      { term: "Control measure", definition: "A sensible action or arrangement that reduces the likelihood or consequence of harm." },
      { term: "Risk assessment", definition: "A proportionate process for identifying significant hazards, who may be affected and suitable controls." },
      { term: "Near miss", definition: "An event that did not cause harm but could provide useful information about a weakness in controls." },
      { term: "Competent advice", definition: "Appropriate health-and-safety support from a person with sufficient skills, knowledge and experience for the issue." },
    ],
    practicePrompt: "Create a local all-staff safety readiness card for one school site or role.",
    practiceSteps: ["Record the school's health-and-safety lead/contact route.", "Record how hazards, accidents and near misses are reported.", "Identify the emergency/evacuation information staff must know locally.", "Name one role-specific risk assessment you regularly depend on.", "Identify additional training or authorisation your role requires.", "Choose one control or procedure that needs review because conditions have changed."],
    mastery: { question: "What should staff do when conditions materially change from an existing risk assessment?", options: ["Continue because the activity was assessed once", "Pause and use the school's process to review whether controls remain suitable", "Ask pupils to decide", "Ignore it unless an accident occurs"], answer: 1, feedback: "Risk controls need to remain suitable for the actual conditions; material changes should trigger review or advice." },
  },
  "allergy-safety-schools-2026": {
    concepts: [
      { term: "Allergy safety policy", definition: "The school's current arrangements for reducing allergy risk, communicating responsibilities and responding through approved procedures." },
      { term: "Individual healthcare plan", definition: "A pupil-specific plan used where appropriate to record agreed medical support and responsibilities." },
      { term: "Risk reduction", definition: "Practical controls designed to reduce foreseeable exposure and make agreed responses accessible." },
      { term: "Training boundary", definition: "Staff should follow the training and authorisation required for their role rather than relying on generic CPD for clinical instruction." },
      { term: "Near miss", definition: "An event that did not result in harm but may reveal a weakness in allergy-safety arrangements." },
      { term: "Whole-school awareness", definition: "Consistent understanding of policy, communication and emergency routes across relevant school staff." },
    ],
    practicePrompt: "Audit the accessibility of your school's allergy-safety arrangements without recording pupil medical details here.",
    practiceSteps: ["Locate the current school allergy-safety policy.", "Identify where staff find the pupil-specific information they are authorised to know.", "Identify the local emergency escalation route.", "Check how relevant information is communicated for trips, catering and changes of routine.", "Identify how incidents and near misses feed into review.", "Record any role-specific training that must be completed outside this awareness module."],
    mastery: { question: "What is the correct relationship between this CPD and pupil-specific allergy support?", options: ["This course replaces healthcare plans and practical training", "This course supports awareness; staff must still follow current school policy, pupil-specific plans and any required role-specific training", "Generic online training is enough for every medical task", "Staff should create their own response procedure"], answer: 1, feedback: "Awareness CPD supports consistent understanding but does not replace local plans, authorised procedures or required practical training." },
  },
  "regulation-support-academy": {
    concepts: [
      { term: "Regulation", definition: "The process of noticing current state and using appropriate support or strategies to reconnect with safety, wellbeing or learning." },
      { term: "Co-regulation", definition: "Calm adult/environmental support that helps a pupil regain the capacity to regulate rather than simply demanding immediate compliance." },
      { term: "Body signal", definition: "An observable or self-reported physical cue that may help a pupil notice their current state." },
      { term: "Strategy", definition: "A context-appropriate action a pupil can choose or learn to use to support regulation." },
      { term: "Student voice", definition: "The pupil's own view of what they notice, what helps and how support feels." },
      { term: "Implementation fidelity", definition: "Whether an agreed support was actually delivered as intended before judging its effect." },
    ],
    practicePrompt: "Design one consistent regulation-support routine for a real school context without turning zones into a behaviour score.",
    practiceSteps: ["Choose a context such as lesson entry, transition, assessment or practical work.", "Identify the signals pupils might be supported to notice.", "Write neutral, non-judgemental adult language.", "Offer a small number of realistic strategies that preserve curriculum access where possible.", "Include student voice in deciding whether the support helped.", "State the boundary that sends safeguarding, medical or emergency concerns to the normal school procedure."],
    mastery: { question: "Which principle best fits the regulation-support approach used in this course?", options: ["Green is the good zone and should be rewarded", "All states can be valid; the aim is to notice needs, choose appropriate support and reconnect with safety, wellbeing or learning", "Staff should diagnose pupils from zone choices", "Regulation support replaces safeguarding procedures"], answer: 1, feedback: "The approach is non-diagnostic and does not rank emotional states; safeguarding, medical and emergency processes remain separate." },
  },
};

const flagshipIds = new Set(Object.keys(materials));

function chapter(course: Course, key: string, title: string, body: string, items: { heading: string; text: string; icon: string }[]): Module {
  return { id: `chapter-${key}-${course.id}`, type: "visual", title, caption: body, layout: "flow", items };
}

function routeGuide(course: Course): Module {
  return {
    id: `route-guide-${course.id}`,
    type: "content",
    title: "Choose your learning route",
    body: "The core concepts and required school procedures matter for everyone, but the depth of practice can vary. Choose the route that best matches your experience while still completing mandatory or policy-critical elements.",
    keyPoints: [
      "ECT / new-to-role: prioritise explanations, visuals, worked examples, scenarios and the implementation tool; discuss difficult decisions with a mentor or lead.",
      "Standard: complete the full core sequence, then use the practice tool and evidence plan in a real context.",
      "Challenge / leadership: critique limitations and implementation risks, adapt examples for different contexts, facilitate discussion and plan follow-up evidence.",
      "Mandatory/safety-critical content is not optional because of experience level; current policy and role requirements still apply.",
    ],
  };
}

function glossary(course: Course): Module {
  return {
    id: `glossary-${course.id}`,
    type: "content",
    title: "Key vocabulary and concepts",
    body: "Use these terms consistently through the course. Being precise about the language makes professional discussion, coaching and implementation much clearer.",
    keyPoints: materials[course.id].concepts.map(item => `${item.term} — ${item.definition}`),
  };
}

function workedPractice(course: Course): Module {
  const material = materials[course.id];
  return {
    id: `worked-practice-${course.id}`,
    type: "activity",
    title: "Worked practice: create something usable",
    prompt: material.practicePrompt,
    instructions: material.practiceSteps,
    placeholder: "Context…\nCurrent problem / goal…\nPlan…\nEvidence…\nReview point…",
    minimumCharacters: 220,
  };
}

function mastery(course: Course): Module {
  const item = materials[course.id].mastery;
  return { id: `mastery-${course.id}`, type: "quiz", title: "Final mastery check", ...item };
}

export function structureFlagshipCourse(course: Course): Course {
  if (!flagshipIds.has(course.id)) return course;
  if (course.modules.some(module => module.id === `chapter-orient-${course.id}`)) return course;

  const orientation = course.modules.filter(module => module.id.startsWith("mc-start-") || module.id.startsWith("mc-baseline-") || module.id.startsWith("mc-route-"));
  const implementation = course.modules.filter(module => module.id.startsWith("mc-misconceptions-") || module.id.startsWith("mc-resource-") || module.id.startsWith("mc-practice-") || module.id.startsWith("mc-evidence-") || module.id.startsWith("mc-followup-") || module.id.startsWith("mc-reflect-"));
  const facilitation = course.modules.filter(module => module.id.startsWith("fac-guide-") || module.id.startsWith("fac-plan-"));
  const reserved = new Set([...orientation, ...implementation, ...facilitation].map(module => module.id));
  const core = course.modules.filter(module => !reserved.has(module.id));

  return {
    ...course,
    modules: [
      chapter(course, "orient", "Chapter 1 · Orientation and starting point", "Understand why the course matters, establish your starting point and choose the right level of support.", [
        { heading: "Purpose", text: "Connect the course to a real professional problem.", icon: "1" },
        { heading: "Baseline", text: "Retrieve what you already know before the main learning.", icon: "2" },
        { heading: "Route", text: "Choose the depth and support appropriate to your experience.", icon: "3" },
      ]),
      ...orientation,
      routeGuide(course),
      chapter(course, "core", "Chapter 2 · Core knowledge and professional judgement", "Build the concepts, vocabulary and decision-making that underpin strong practice.", [
        { heading: "Know", text: "Learn the precise concepts and principles.", icon: "1" },
        { heading: "See", text: "Use visuals, examples and contrasts to make practice concrete.", icon: "2" },
        { heading: "Decide", text: "Test judgement through scenarios and knowledge checks.", icon: "3" },
        { heading: "Connect", text: "Apply the ideas to subject, phase, role or school context.", icon: "4" },
      ]),
      glossary(course),
      ...core,
      workedPractice(course),
      mastery(course),
      chapter(course, "implementation", "Chapter 3 · Implementation and impact", "Turn the learning into a small, observable change and review proportionate evidence over time.", [
        { heading: "Avoid", text: "Check the common implementation mistakes.", icon: "1" },
        { heading: "Plan", text: "Build one usable action or professional tool.", icon: "2" },
        { heading: "Evidence", text: "Choose low-workload evidence before implementation.", icon: "3" },
        { heading: "Review", text: "Use the 30-day cycle to keep, adapt, scale or stop.", icon: "4" },
      ]),
      ...implementation,
      chapter(course, "facilitate", "Chapter 4 · Facilitate and sustain", "Use the same materials with a department, coaching pair or whole-school group and build in follow-up.", [
        { heading: "Select", text: "Choose only the materials needed for the audience and time available.", icon: "1" },
        { heading: "Discuss", text: "Use scenarios and examples to make staff thinking visible.", icon: "2" },
        { heading: "Commit", text: "Finish with a specific implementation action.", icon: "3" },
        { heading: "Follow up", text: "Return to evidence and implementation barriers after the session.", icon: "4" },
      ]),
      ...facilitation,
    ],
  };
}
