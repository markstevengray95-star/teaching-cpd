import type { Course, Module } from "./data";

const DEPTH_PREFIX = "depth-2026-";

type ContentModule = Extract<Module, { type: "content" }>;

type CategoryGuidance = {
  professionalLens: string;
  evidenceLens: string;
  inclusionLens: string;
  implementationRisk: string;
  leadershipLens: string;
};

const CATEGORY_GUIDANCE: Record<Course["category"], CategoryGuidance> = {
  "Teaching & Learning": {
    professionalLens: "Treat the approach as a teaching decision rather than a slogan. Start with the intended learning, identify the pupil thinking you need to see, choose the smallest useful teaching move and then check whether the response changed learning. Strong implementation is responsive: the same technique may need different timing, modelling, scaffolding or checking in different classes.",
    evidenceLens: "Look for evidence in pupil responses, work, participation patterns, error patterns and the amount of successful independent thinking. Avoid judging impact from whether the activity felt smooth or whether pupils appeared busy. The important question is whether the chosen approach improved access to the intended learning and helped the teacher make a better next decision.",
    inclusionLens: "Plan for access without automatically lowering the learning goal. Consider language load, working-memory demand, reading and recording demands, sensory load, predictability, processing time and the usefulness of models or examples. Use pupil-specific information where it exists and review whether support increases independence rather than creating permanent adult dependence.",
    implementationRisk: "A common implementation failure is using the visible technique without the reasoning behind it: more questions, more retrieval, more scaffolds or more activities do not automatically improve learning. Keep the purpose explicit, monitor unintended effects and stop or adapt routines that add workload without improving understanding.",
    leadershipLens: "For team implementation, define what the principle should look like in practice while allowing sensible subject and phase variation. Use work scrutiny, pupil responses, planning conversations and low-stakes observation evidence to diagnose barriers before adding new expectations.",
  },
  Safeguarding: {
    professionalLens: "Keep role boundaries, chronology and school procedure at the centre of professional judgement. Training should help staff notice concerns, respond safely, record accurately and pass information through the agreed safeguarding route; it should not encourage staff to investigate, diagnose or decide outcomes that belong to designated safeguarding professionals or external agencies.",
    evidenceLens: "Useful evidence is factual, timely and proportionate: what was observed, what was said, what action was taken, who was informed and when. Separate direct observation from interpretation. Follow the school's current safeguarding policy and DSL guidance whenever training examples differ from local procedure or updated statutory expectations.",
    inclusionLens: "Communication differences, disability, EAL, trauma responses and additional needs can affect how a concern is expressed or noticed. Avoid assuming that a pupil's presentation explains away a change in behaviour or communication. Use accessible communication, record the pupil's own words where appropriate and seek safeguarding advice when uncertainty remains.",
    implementationRisk: "Two opposite risks matter: delaying action until there is proof, and acting outside role boundaries by investigating independently. Secure practice is prompt, factual, calm and routed through the school's current procedure. Confidentiality must also be understood correctly: information is shared on a need-to-know basis, but staff should not promise secrecy they cannot keep.",
    leadershipLens: "Leaders should make reporting routes easy to access, induction explicit and refresher training connected to current policy. Review whether staff know who to contact, can find the procedure quickly and understand how to record concerns, rather than relying only on attendance at annual training.",
  },
  SEND: {
    professionalLens: "Begin with the learner and the barrier in the current task, not a label-based recipe. Maintain appropriately ambitious learning while adapting access, communication, representation, organisation or the route to independence. Useful support is specific enough to address the barrier and flexible enough to change when evidence shows it is no longer needed.",
    evidenceLens: "Look for whether the pupil can start, sustain and complete the intended thinking with less unnecessary friction. Useful evidence can include accuracy, independence, time taken, successful use of a scaffold, pupil feedback and whether support transfers across contexts. A strategy is not effective simply because it is commonly recommended for a diagnosis.",
    inclusionLens: "Use pupil-specific plans, specialist advice and pupil voice where available. Consider communication, sensory processing, executive-function demands, literacy, language, motor demands and predictability. Avoid making assumptions from a diagnosis or giving support that removes the important subject thinking the pupil needs to practise.",
    implementationRisk: "Common mistakes include lowering the learning goal before identifying the barrier, leaving scaffolds in place indefinitely, over-prompting, using the same strategy for every pupil with the same label and treating reasonable adjustment as exemption from all challenge. Build in a plan to review, fade, adapt or replace support.",
    leadershipLens: "Whole-school consistency should mean shared principles and reliable access to pupil information, not identical strategies in every classroom. Leaders should help staff understand provision, review implementation and create practical routes for teachers and support staff to share what is working.",
  },
  Leadership: {
    professionalLens: "Translate broad priorities into a small number of observable professional behaviours, clear support and proportionate follow-up. Strong leadership distinguishes between an implementation problem, a knowledge or skill gap, a system barrier and a motivation issue before deciding what action to take.",
    evidenceLens: "Use multiple sources of evidence: implementation checks, staff feedback, pupil or service-user evidence where appropriate, work quality, participation, workload indicators and progress against the agreed behaviour or process. Avoid treating a single observation, survey or outcome measure as a complete explanation.",
    inclusionLens: "Implementation should account for different roles, experience levels, working patterns and access needs. Make expectations and resources accessible, provide rehearsal or modelling where useful and avoid assuming that staff who need clarification are resistant to change. Psychological safety and role clarity support more accurate feedback about barriers.",
    implementationRisk: "Initiative overload, vague success criteria and monitoring before support are common failure modes. Adding another programme rarely fixes an unclear one. Keep the change small enough to understand, provide the conditions needed for success and use review points to decide what to continue, adapt or stop.",
    leadershipLens: "Leaders should model the expected practice, protect time for learning, coordinate messages and ensure accountability focuses on improvement rather than performance theatre. Sustainable implementation usually depends on routines, ownership and follow-up more than launch events.",
  },
  Wellbeing: {
    professionalLens: "Treat wellbeing as partly a system-design issue rather than placing the responsibility only on individuals. Identify controllable sources of friction, ambiguity, duplication, workload or poor workflow, then test proportionate changes while protecting important educational and safeguarding responsibilities.",
    evidenceLens: "Useful evidence includes workload patterns, repeated bottlenecks, staff feedback, time spent on recurring processes, clarity of responsibility, absence of duplication and whether changes preserve the quality of the underlying work. Short-term enjoyment of an initiative is not the same as sustainable improvement.",
    inclusionLens: "Different staff may experience workload, communication and environmental demands differently because of disability, caring responsibilities, working pattern, experience or role. Build flexibility and clarity into systems rather than expecting every person to cope in the same way.",
    implementationRisk: "Avoid adding wellbeing activities on top of unchanged workload systems, treating resilience as the only solution or removing essential processes without understanding their purpose. The aim is to remove avoidable friction while keeping important work reliable.",
    leadershipLens: "Leaders should examine policy, meeting, communication and administrative routines for unnecessary complexity. Make ownership clear, reduce duplicated requests and review the impact of new initiatives on workload before assuming capacity is available.",
  },
  "Digital Teaching": {
    professionalLens: "Begin with educational purpose, then decide whether technology improves the task. Professional judgement remains responsible for accuracy, privacy, safeguarding, accessibility and suitability. A polished digital output should never be treated as evidence that the underlying information or recommendation is correct.",
    evidenceLens: "Judge value through the quality of learning, reliability of output, time saved or added, error rates, accessibility and whether staff or pupils can explain and check what the tool produced. For AI-generated material, important factual claims and high-stakes decisions require independent verification.",
    inclusionLens: "Check device access, reading level, sensory load, keyboard or assistive-technology compatibility, language demands and whether digital features create new barriers. Provide a workable alternative where access is not equitable and avoid requiring unnecessary personal data.",
    implementationRisk: "Common risks include uploading sensitive information, accepting generated content without checking it, automating decisions that require professional judgement, adopting a tool because it is novel and allowing technical convenience to weaken safeguarding or data-protection practice.",
    leadershipLens: "Schools need clear expectations for approved tools, account security, data handling, staff checking and incident reporting. Trial technology in bounded contexts, gather evidence and scale only when the educational benefit and governance requirements are understood.",
  },
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function existingKnowledge(course: Course) {
  const ideas: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean.length < 18) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ideas.push(clean);
  };

  course.modules.forEach(module => {
    if (module.type === "content") {
      (module.keyPoints || []).forEach(add);
      const sentences = module.body.split(/(?<=[.!?])\s+/).filter(sentence => sentence.length >= 35);
      sentences.slice(0, 2).forEach(add);
    }
    if (module.type === "visual") module.items.forEach(item => add(`${item.heading}: ${item.text}`));
  });
  course.objectives.forEach(add);
  return ideas;
}

function misconceptionEvidence(course: Course) {
  const items: string[] = [];
  const add = (value: string) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean.length >= 15 && !items.includes(clean)) items.push(clean);
  };
  course.modules.forEach(module => {
    if (module.type === "quiz") {
      module.options.forEach((option, index) => {
        if (index !== module.answer) add(`Non-example: ${option}. ${module.feedback}`);
      });
    }
    if (module.type === "scenario") {
      module.options.forEach(option => {
        if (/not|risk|miss|unhelp|outside|too |remove|delay|avoid|unlikely|weak|does not/i.test(option.feedback)) {
          add(`Boundary case: ${option.label}. ${option.feedback}`);
        }
      });
    }
  });
  return items;
}

function objectiveConnections(course: Course) {
  const objectives = course.objectives.slice(0, 5);
  return objectives.map((objective, index) => {
    const next = objectives[index + 1];
    return next
      ? `${objective}. Connect this with “${next}” so the course is applied as a sequence of professional decisions rather than isolated techniques.`
      : `${objective}. Translate this into an observable action, identify the evidence you expect to see and decide in advance what would make you adapt the approach.`;
  });
}

function buildConnections(course: Course, guidance: CategoryGuidance): ContentModule {
  const ideas = existingKnowledge(course).slice(0, 6);
  const objectives = course.objectives.slice(0, 4).join("; ");
  return {
    id: `${DEPTH_PREFIX}${safeId(course.id)}-connections`,
    type: "content",
    title: "Deep knowledge: connect the core ideas",
    body: `${course.summary} The aim in this section is to move beyond remembering individual tips and understand how the main ideas fit together. ${guidance.professionalLens} In this course, keep returning to these intended outcomes: ${objectives}. A useful professional test is whether you can explain why a strategy fits the specific context, what problem it is intended to solve, what evidence you would expect if it is working and what you would change if the evidence is weak. That reasoning matters because techniques can look identical on the surface while serving very different purposes. Build the habit of linking each action to the learning, safeguarding, inclusion, leadership, wellbeing or digital purpose that justifies it.`,
    keyPoints: ideas.length >= 4 ? ideas : objectiveConnections(course).slice(0, 5),
  };
}

function buildMisconceptions(course: Course, guidance: CategoryGuidance): ContentModule {
  const mined = misconceptionEvidence(course).slice(0, 5);
  const fallbacks = [
    `Do not treat ${course.title} as a fixed script. The course principles still need professional judgement, context and review.`,
    `Avoid confusing visible activity with impact. A strategy can be completed correctly and still fail to improve the intended outcome.`,
    `Do not keep adding support or complexity when the evidence suggests a simpler adjustment would address the barrier more directly.`,
    `Avoid using one successful example as proof that the same response will work for every class, pupil, team or situation.`,
  ];
  return {
    id: `${DEPTH_PREFIX}${safeId(course.id)}-misconceptions`,
    type: "content",
    title: "Misconceptions, limits and non-examples",
    body: `Secure professional learning includes knowing when not to use an idea. ${guidance.implementationRisk} For ${course.title}, separate the underlying principle from the visible routine. Ask what the approach assumes, what information you still need and what would count as evidence that it is not working. When a strategy becomes automatic, staff can unintentionally preserve a routine after its purpose has disappeared. The strongest practice is therefore conditional: use the principle when the context supports it, make the smallest proportionate change, check the outcome and be willing to stop or adapt. Non-examples are particularly useful because they expose the boundary between following a procedure and exercising professional judgement.`,
    keyPoints: [...mined, ...fallbacks].slice(0, 6),
  };
}

function buildWorkedApplication(course: Course, guidance: CategoryGuidance): ContentModule {
  const objectives = course.objectives.slice(0, 4);
  const keyPoints = objectiveConnections(course).slice(0, 5);
  return {
    id: `${DEPTH_PREFIX}${safeId(course.id)}-application`,
    type: "content",
    title: "Worked application: from principle to practice",
    body: `Use a five-step reasoning cycle when applying ${course.title}. First, define the intended outcome in precise terms rather than starting with the activity. Second, identify the current evidence or barrier: what can you actually observe, and what are you only assuming? Third, choose one proportionate action linked to the course principle. Fourth, make the action observable enough that you or a colleague could recognise whether it happened. Fifth, review the evidence and decide whether to keep, adapt, fade or stop the response. ${guidance.evidenceLens} This turns professional learning into an improvement cycle rather than a one-off training event. For the course objectives—${objectives.join("; ")}—the practical standard is not “I have heard of this idea”; it is “I can select, explain, apply and review it in a realistic context.”`,
    keyPoints,
  };
}

function buildInclusiveApplication(course: Course, guidance: CategoryGuidance): ContentModule {
  return {
    id: `${DEPTH_PREFIX}${safeId(course.id)}-inclusion`,
    type: "content",
    title: "Inclusive application: SEND, EAL and access",
    body: `Every professional-development idea needs an access check. ${guidance.inclusionLens} In ${course.title}, begin by separating the core outcome from the incidental demands around it. Keep the important learning, safety or professional expectation clear, then ask whether language, memory, literacy, communication, sensory load, organisation, technology, prior knowledge or uncertainty is making access unnecessarily difficult. For EAL learners, clarify essential vocabulary and meaning without assuming lower conceptual capability. For pupils or staff with additional needs, use individual information where available rather than diagnosis-based stereotypes. When support is introduced, decide how you will know whether it is increasing successful participation and independence. Inclusion is strongest when the adjustment removes an avoidable barrier while preserving meaningful thinking, responsibility and dignity.`,
    keyPoints: [
      "Keep the core learning, safety or professional outcome explicit before adapting access.",
      "Identify the specific barrier in this context rather than choosing support from a label alone.",
      "Reduce unnecessary language, memory, sensory or organisational load where it blocks the intended task.",
      "Use pupil-specific or staff-specific information and voice where available.",
      "Review whether the adjustment improves participation and independence; adapt or fade it when evidence changes.",
    ],
  };
}

function buildEvidenceAndLeadership(course: Course, guidance: CategoryGuidance): ContentModule {
  return {
    id: `${DEPTH_PREFIX}${safeId(course.id)}-evidence`,
    type: "content",
    title: "Evidence, implementation and whole-school follow-through",
    body: `The value of ${course.title} depends on what happens after the presentation. ${guidance.evidenceLens} Decide in advance which evidence is close enough to the intended outcome to be useful, and distinguish implementation evidence from impact evidence. Implementation evidence asks whether the agreed action actually happened and whether staff had the conditions to do it. Impact evidence asks whether the intended pupil, staff or organisational outcome changed. ${guidance.leadershipLens} Avoid collecting evidence simply because it is easy to count. Use a small number of meaningful indicators, include qualitative evidence where it explains the numbers and build in a review point. If implementation is weak, improve clarity, modelling, resources or conditions before concluding that the underlying idea is ineffective. If implementation is secure but impact remains weak, reconsider the strategy rather than increasing monitoring.`,
    keyPoints: [
      "Define the intended outcome before choosing an evidence source.",
      "Separate implementation evidence from impact evidence.",
      "Use more than one source when a single measure could be misleading.",
      "Diagnose barriers before increasing monitoring or adding another initiative.",
      "At the review point, make an explicit keep / adapt / fade / stop decision.",
    ],
  };
}

function contentWords(course: Course) {
  return course.modules
    .filter((module): module is ContentModule => module.type === "content")
    .reduce((sum, module) => sum + wordCount(module.body) + (module.keyPoints || []).reduce((n, item) => n + wordCount(item), 0), 0);
}

export function deepenCourseContent2026(course: Course): Course {
  const guidance = CATEGORY_GUIDANCE[course.category];
  const depthIds = new Set([
    `${DEPTH_PREFIX}${safeId(course.id)}-connections`,
    `${DEPTH_PREFIX}${safeId(course.id)}-misconceptions`,
    `${DEPTH_PREFIX}${safeId(course.id)}-application`,
    `${DEPTH_PREFIX}${safeId(course.id)}-inclusion`,
    `${DEPTH_PREFIX}${safeId(course.id)}-evidence`,
  ]);
  const modules = course.modules.filter(module => !depthIds.has(module.id));
  const depthModules = [
    buildConnections(course, guidance),
    buildMisconceptions(course, guidance),
    buildWorkedApplication(course, guidance),
    buildInclusiveApplication(course, guidance),
    buildEvidenceAndLeadership(course, guidance),
  ];

  const baselineIndex = modules.findIndex(module => module.id.includes("-baseline"));
  const insertAt = baselineIndex >= 0 ? baselineIndex + 1 : Math.min(3, modules.length);
  modules.splice(insertAt, 0, ...depthModules);

  return {
    ...course,
    duration: course.duration + 30,
    modules,
  };
}

export function validateCourseContentDepth2026(course: Course) {
  const depthModules = course.modules.filter(module => module.id.startsWith(`${DEPTH_PREFIX}${safeId(course.id)}-`));
  if (depthModules.length !== 5) throw new Error(`CPD course ${course.id} does not contain all five Phase 2 depth sections`);
  const words = contentWords(course);
  if (words < 700) throw new Error(`CPD course ${course.id} needs deeper Phase 2 knowledge content (${words} words)`);
  const requiredTitles = ["Deep knowledge", "Misconceptions", "Worked application", "Inclusive application", "Evidence, implementation"];
  requiredTitles.forEach(title => {
    if (!depthModules.some(module => module.title.startsWith(title))) throw new Error(`CPD course ${course.id} is missing Phase 2 section: ${title}`);
  });
}
