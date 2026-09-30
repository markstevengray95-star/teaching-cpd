import type { Course, Module } from "./data";

const PREFIX = "overhaul2-reading-";
const PROCESS_PREFIX = "overhaul2-process-";

export const PRESENTATION_OVERHAUL_PHASE2_VERSION = "2026.3";
export const PHASE2_READING_DEPTHS = ["quick", "core", "deep"] as const;
export type Phase2ReadingDepth = (typeof PHASE2_READING_DEPTHS)[number];
export type Phase2ReadingSection = 1 | 2 | 3;

export type Phase2GlossaryItem = { term: string; definition: string };
export type Phase2ReadingPack = {
  moduleId: string;
  section: Phase2ReadingSection;
  heading: string;
  strapline: string;
  quick: string[];
  core: string[];
  deep: string[];
  keyIdeas: string[];
  glossary: Phase2GlossaryItem[];
  pausePrompts: string[];
};

type ContentModule = Extract<Module, { type: "content" }>;
type ActivityModule = Extract<Module, { type: "activity" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function words(value: string) {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function trimWords(value: string, limit = 60) {
  const tokens = clean(value).split(/\s+/).filter(Boolean);
  return tokens.length <= limit ? tokens.join(" ") : `${tokens.slice(0, limit).join(" ")}…`;
}

function sentence(value: string) {
  const text = clean(value);
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return match?.[0]?.trim() || text;
}

function sourceKnowledge(course: Course) {
  return course.modules.filter((module): module is ContentModule => module.type === "content" && !module.id.startsWith(PREFIX));
}

function sourceForSection(course: Course, section: Phase2ReadingSection) {
  const content = sourceKnowledge(course);
  if (!content.length) return [] as ContentModule[];
  if (section === 1) return content.slice(0, Math.min(3, content.length));
  if (section === 2) {
    const start = Math.max(0, Math.floor(content.length / 2) - 1);
    return content.slice(start, start + Math.min(3, content.length));
  }
  return content.slice(Math.max(0, content.length - 3));
}

function categoryLens(course: Course) {
  if (course.category === "Safeguarding") return {
    principle: "Professional judgement must remain anchored to current school safeguarding policy, DSL guidance and statutory responsibilities. Training examples can develop recognition and reasoning, but they must never replace the reporting route or encourage staff to investigate concerns themselves.",
    evidence: "Useful evidence is factual, timely and proportionate. Distinguish what was observed or said from interpretation, record through the school's agreed system, and escalate uncertainty rather than attempting to prove or disprove a concern.",
    boundary: "The boundary matters: listening, recording and reporting are different from investigation. If a training example conflicts with current local procedure, the current policy and DSL direction take precedence.",
    inclusion: "Safeguarding practice should also account for communication differences, additional needs and barriers to disclosure without making assumptions about a pupil or group.",
  };
  if (course.category === "SEND") return {
    principle: "Strong inclusive practice starts with the actual barrier in the task, environment or communication rather than using a diagnostic label as a shortcut. The learning goal should remain ambitious while access, explanation, representation or scaffolding changes where needed.",
    evidence: "Evidence should show whether the adaptation improved access, participation, independence or learning. A support that looks helpful can still create dependency, reduce challenge or solve the wrong problem if it is not reviewed.",
    boundary: "Avoid turning a useful strategy into a fixed rule for every learner with a similar label. Individual needs, pupil voice, existing plans and the demands of the specific task all matter.",
    inclusion: "Make instructions, vocabulary, routines and success criteria explicit enough to reduce avoidable barriers while preserving dignity and meaningful participation.",
  };
  if (course.category === "Leadership") return {
    principle: "Leadership practice is more reliable when expectations are clear, the problem is diagnosed before action is chosen, and staff have the capability, capacity and support needed to implement the change. Monitoring cannot compensate for an unclear or overloaded implementation plan.",
    evidence: "Look for evidence of implementation as well as outcomes. A result can improve for reasons unrelated to the initiative, while a sensible change can initially look inconsistent because routines, resources or confidence are still developing.",
    boundary: "Do not confuse accountability with ranking. Development information is most useful when it identifies conditions, barriers and next actions rather than reducing professional work to a single score.",
    inclusion: "Build participation into implementation by making expectations visible, inviting challenge, checking workload and ensuring staff understand both the purpose and the practical routine.",
  };
  if (course.category === "Wellbeing") return {
    principle: "Wellbeing should not be reduced to individual resilience. Workload, role clarity, relationships, autonomy, duplication and organisational routines can all create or remove pressure, so improvement should examine systems as well as personal strategies.",
    evidence: "Use evidence that is close to the problem: workload patterns, repeated tasks, meeting load, role ambiguity, staff feedback and the sustainability of routines. A popular initiative is not automatically a useful one.",
    boundary: "Avoid requiring personal disclosure in CPD or implying that structural problems can be solved solely through coping techniques. Staff should be able to discuss hypothetical or team-level examples.",
    inclusion: "Different roles experience workload and support differently. Review whose work is made easier, whose work is shifted elsewhere and whether changes remain realistic over time.",
  };
  if (course.category === "Digital Teaching") return {
    principle: "Technology should be selected because it solves a defined learning or professional problem, not because it is new or fast. Staff remain responsible for educational suitability, privacy, accuracy, accessibility and the consequences of decisions supported by digital tools.",
    evidence: "Judge the tool by the intended outcome: quality of learning, access, accuracy, workload or communication. Engagement, novelty and speed are useful observations but are not sufficient evidence that practice has improved.",
    boundary: "Protect sensitive information, verify important outputs and maintain a non-digital route where appropriate. Automation should remove low-value work without outsourcing professional judgement.",
    inclusion: "Check accessibility, device assumptions, language load and whether the digital route creates a new barrier for any staff member or pupil.",
  };
  return {
    principle: "Teaching and learning strategies are strongest when the visible technique is connected to a clear learning problem and an explanation of why the technique should help. The aim is not to collect routines but to make better instructional decisions.",
    evidence: "Use evidence of pupil thinking, participation, success and error patterns rather than relying only on whether an activity felt engaging. Check the intended learning outcome and adjust teaching when the evidence does not match the expectation.",
    boundary: "A strategy that works in one subject, class or phase may need adapting elsewhere. Preserve the underlying principle while changing examples, scaffolds, timing, language or response routines to fit the context.",
    inclusion: "Consider vocabulary, prior knowledge, SEND/EAL barriers, participation routines and the cognitive demands of the task so access does not depend on speed, confidence or familiarity with hidden classroom conventions.",
  };
}

function glossaryFor(course: Course): Phase2GlossaryItem[] {
  const shared: Phase2GlossaryItem[] = [
    { term: "Principle", definition: "The underlying professional idea that explains why an approach should help, rather than the visible routine alone." },
    { term: "Implementation", definition: "The process of putting an agreed change into practice consistently enough to learn whether it is workable and useful." },
    { term: "Evidence", definition: "Information used to judge understanding, implementation or impact; evidence should be close to the outcome being claimed." },
    { term: "Adaptation", definition: "A deliberate change to the route, support or context while protecting the important purpose or learning goal." },
    { term: "Transfer", definition: "Using learning successfully in a new class, role, subject, team or situation rather than reproducing a training example unchanged." },
  ];
  if (course.category === "Safeguarding") shared.push({ term: "Professional curiosity", definition: "Noticing and responsibly exploring concerns through the correct safeguarding route without conducting an investigation yourself." });
  else if (course.category === "SEND") shared.push({ term: "Barrier", definition: "A feature of a task, environment, communication or routine that makes participation or learning unnecessarily difficult." });
  else if (course.category === "Leadership") shared.push({ term: "Implementation condition", definition: "A factor such as clarity, capability, capacity, support or follow-up that affects whether a change can be enacted as intended." });
  else if (course.category === "Wellbeing") shared.push({ term: "System factor", definition: "An organisational routine, expectation or condition that shapes workload or wellbeing beyond individual coping choices." });
  else if (course.category === "Digital Teaching") shared.push({ term: "Human oversight", definition: "The professional responsibility to check, interpret and remain accountable for outputs produced or supported by digital systems." });
  else shared.push({ term: "Responsive teaching", definition: "Adapting explanation, task or support in response to evidence of what pupils understand and can do." });
  return shared;
}

function excerpts(course: Course, section: Phase2ReadingSection) {
  const source = sourceForSection(course, section);
  return source.map(module => ({ title: module.title, text: trimWords(module.body, 55), points: module.keyPoints || [] }));
}

function quickParagraphs(course: Course, section: Phase2ReadingSection) {
  const objective = course.objectives[Math.min(section - 1, Math.max(0, course.objectives.length - 1))] || course.objectives[0] || course.summary;
  const lens = categoryLens(course);
  if (section === 1) return [
    `${course.title} is most useful when it is understood as a professional principle rather than a checklist of techniques. ${course.summary} The key question is what problem the approach is intended to solve and what staff would expect to notice if it were working.`,
    `${objective}. ${lens.principle} Keep the purpose visible as you move through examples so surface routines do not become detached from the reasoning behind them.`,
    `Before moving on, identify one assumption you are making about your own context. ${lens.boundary}`,
  ];
  if (section === 2) return [
    `Knowing the idea is not the same as being able to use it. In ${course.title}, professional learning becomes valuable when staff rehearse the decision, compare their attempt with a stronger model and make a second, more precise attempt.`,
    `${lens.evidence} Rehearsal should therefore include both the action and the evidence you would look for immediately afterwards.`,
    `Do not copy the model mechanically. ${lens.inclusion} Adapt wording, examples, scaffolds or timing while keeping the principle intact.`,
  ];
  return [
    `The final challenge in ${course.title} is transfer: using the learning in normal professional practice when the situation is less tidy than a training example. Start with one small, specific change rather than a broad intention.`,
    `${lens.evidence} Decide in advance what evidence would make you keep, adapt, fade, revisit or stop the approach.`,
    `Implementation is a learning process, not proof of compliance. ${lens.boundary} Review what happened, identify the barrier and decide the next useful action.`,
  ];
}

function coreParagraphs(course: Course, section: Phase2ReadingSection) {
  const lens = categoryLens(course);
  const source = excerpts(course, section);
  const sourceA = source[0] ? `One strand of the course frames this through “${source[0].title}”: ${source[0].text}` : `The course summary gives the starting point: ${course.summary}`;
  const sourceB = source[1] ? `A second strand, “${source[1].title}”, adds: ${source[1].text}` : `The next step is to connect the principle to ${course.objectives[1] || course.objectives[0] || "professional practice"}.`;
  const sourceC = source[2] ? `The section “${source[2].title}” also emphasises: ${source[2].text}` : `The learning should ultimately help staff ${course.objectives[2] || "review the effect of what they change"}.`;

  if (section === 1) return [
    `${course.title} should begin with a clear professional problem, not a technique in search of a use. ${course.summary} A useful reading of the course therefore asks three questions from the start: what is the intended outcome, what mechanism might make the approach helpful, and what evidence would show whether the response fitted the problem? This matters because routines can look polished while solving the wrong problem. If staff understand only the visible move, transfer is fragile; if they understand the principle, they can adapt the move without losing its purpose.`,
    `${sourceA}. ${sourceB} Read these ideas as connected rather than separate. The first provides the reason for acting, the second helps define what the action should protect or improve. ${lens.principle} This distinction between principle and technique is especially important in professional learning because staff work in different phases, subjects, teams and roles. A strong course should give enough knowledge to make a decision, but not pretend that every context can be reduced to the same script.`,
    `Professional reasoning also requires attention to boundaries and non-examples. ${lens.boundary} Ask what would make an apparently sensible response weak: perhaps it lowers the learning goal, relies on a label rather than a barrier, confuses monitoring with support, treats engagement as impact, or moves outside the staff member's professional responsibility. Non-examples are useful because they expose the point where a surface feature remains but the underlying principle has been lost.`,
    `${lens.inclusion} Inclusion belongs inside the main professional reasoning rather than being added as an afterthought. The relevant question is not simply “What adjustment can I add?” but “What feature of the current task, explanation, environment or routine is creating an avoidable barrier?” This keeps adaptation purposeful and reduces the risk of unnecessary simplification, over-support or inconsistent expectations.`,
    `As you finish this reading, return to the course objectives: ${course.objectives.slice(0, 3).join("; ")}. Treat these as decisions you should become better able to make, not statements to memorise. The next activities ask you to explain the principle in plain language, identify the problem it addresses and discuss a limitation. Those moves are deliberate: explaining, contrasting and challenging an idea are stronger tests of professional understanding than simply recognising familiar wording.`,
  ];

  if (section === 2) return [
    `Professional knowledge becomes usable through rehearsal. In ${course.title}, rehearsal should make the reasoning visible: identify the context, choose a response, explain why it fits and then review what evidence you would expect to see. This is different from role-play for its own sake. The purpose is to reduce the distance between understanding an idea and being able to enact it when time, uncertainty and competing demands are present.`,
    `${sourceA}. ${sourceB} These ideas suggest that a worked example is valuable only when staff can see why the example is strong. If the example is copied as a script, transfer will be brittle. Instead, notice the decision points: what was observed, what information mattered, which principle was selected, what alternative was rejected and what evidence would be checked next. This turns the worked example into a model of professional thinking rather than a model answer to memorise.`,
    `${lens.evidence} Evidence is part of the action, not something added at the end to justify a decision that has already been made. For example, a change intended to improve understanding should be checked against evidence of understanding; a change intended to reduce a barrier should be checked against access or independence; a leadership routine should be checked for implementation as well as eventual outcomes. Matching the evidence to the claim prevents weak conclusions based only on impressions.`,
    `${lens.inclusion} Rehearsal should therefore include adaptation. Change one feature of the context and ask whether the response should stay the same. A strategy might need different language, timing, modelling, scaffolding or follow-up for another subject, age group, role or pupil. What should remain stable is the underlying purpose. This is a useful test: if changing the visible technique destroys the whole approach, the principle probably has not yet been understood clearly enough.`,
    `${sourceC}. Use feedback to improve a second attempt rather than merely judging the first. A strong second attempt should be more precise about the problem, more proportionate in the action and clearer about what evidence will be reviewed. This cycle—attempt, compare, revise—is the bridge between reading and reliable practice, and it prepares you for the more ambiguous professional decisions that follow later in the course.`,
  ];

  return [
    `Transfer is the point at which professional learning either becomes useful or fades into a completed course record. ${course.title} should therefore finish with a change that is specific enough to try in normal work. “Improve practice” is too broad; a useful implementation commitment identifies the context, the action, the intended outcome, the evidence to collect and the point at which the response will be reviewed. Small, testable changes create better learning than ambitious promises with no clear feedback loop.`,
    `${sourceA}. ${sourceB} Together these ideas show why implementation is not the same as compliance. A staff member can follow a routine without understanding it, while a team can understand an idea but be unable to implement it because time, resources, clarity or support are missing. Reviewing implementation conditions helps separate a weak idea from a reasonable idea that has not yet been enacted consistently enough to evaluate.`,
    `${lens.evidence} Avoid claiming too much from one piece of evidence. A positive example can be encouraging without proving that the CPD caused the outcome; a difficult lesson does not automatically show that the approach failed. Look for patterns, compare against the intended outcome and note plausible alternative explanations. The purpose of evidence in professional development is to support a better next decision, not to manufacture certainty.`,
    `${lens.boundary} ${lens.inclusion} Sustainable implementation should remain proportionate to the role and context. A useful change should not create unnecessary workload, remove professional discretion or shift a barrier elsewhere. Where a policy, statutory duty, pupil plan or school procedure applies, that framework remains part of the decision and should be checked explicitly.`,
    `${sourceC}. The final review question is therefore practical: keep, adapt, fade, revisit or stop? “Keep” means the evidence is sufficiently positive and the routine remains workable. “Adapt” means the principle still looks useful but the current implementation needs changing. “Fade” may be appropriate when a scaffold has achieved its purpose. “Revisit” means knowledge or implementation is insecure. “Stop” is a legitimate professional conclusion when the response is ineffective, disproportionate or solving the wrong problem.`,
  ];
}

function deepExtensions(course: Course, section: Phase2ReadingSection) {
  const lens = categoryLens(course);
  if (section === 1) return [
    `Deep dive — mechanism and uncertainty. Professional learning improves when staff can explain not only what an approach is but the mechanism by which it might help. Mechanisms are useful because they generate predictions: if the explanation is correct, what should change first? They also expose uncertainty. The same visible result can have different causes, so avoid jumping from observation to explanation too quickly. Ask what else could account for what you see and what additional evidence would reduce that uncertainty.`,
    `Deep dive — evidence and values. School decisions are rarely technical only. They also involve priorities such as safety, inclusion, learning, dignity, workload and consistency. ${lens.principle} When two reasonable principles pull in different directions, make the trade-off explicit rather than pretending there is a context-free best answer. This is one reason professional judgement cannot be reduced to selecting a technique from a list.`,
  ];
  if (section === 2) return [
    `Deep dive — deliberate practice. Repetition alone does not guarantee improvement. Deliberate rehearsal isolates a manageable decision or behaviour, uses a clear model, gives timely feedback and allows another attempt. The target should be narrow enough to change, but meaningful enough to matter. If the task is too broad, feedback becomes vague; if it is too artificial, success in training may not transfer to real work.`,
    `Deep dive — adapting without dilution. Adaptation should preserve the function of the strategy. ${lens.inclusion} When you change the route, ask which feature is essential to the mechanism and which features are merely examples. This helps avoid two common errors: copying a model so rigidly that it does not fit the context, or changing so much that the approach no longer addresses the original problem.`,
  ];
  return [
    `Deep dive — implementation as inquiry. Treat implementation as a disciplined enquiry cycle rather than a one-off launch. Define the change, anticipate barriers, establish what “implemented” would look like, gather evidence near the intended outcome and review at a sensible interval. This makes it possible to distinguish implementation failure from theory failure and reduces the temptation to replace one initiative with another before enough has been learned.`,
    `Deep dive — avoiding causal overclaim. ${lens.evidence} Professional evidence is often messy: multiple changes occur at once, groups differ and outcomes fluctuate. Use cautious language such as “consistent with”, “suggests” or “we observed after” unless the evidence genuinely supports a stronger claim. The goal is not to prove that CPD caused an outcome; it is to make the next professional decision better informed than the previous one.`,
  ];
}

function ensureMinimum(paragraphs: string[], minimum: number, extras: string[]) {
  const result = [...paragraphs];
  let cursor = 0;
  while (words(result.join(" ")) < minimum && cursor < extras.length) result.push(extras[cursor++]);
  return result;
}

function pack(course: Course, section: Phase2ReadingSection): Phase2ReadingPack {
  const id = safeId(course.id);
  const headings = {
    1: ["Professional reading 1 · Understand the principle", "Why the idea works, what problem it addresses and where its boundaries sit."],
    2: ["Professional reading 2 · From knowledge to rehearsal", "Use worked examples, evidence and adaptation to make professional knowledge executable."],
    3: ["Professional reading 3 · Transfer, evidence and sustain", "Move from a training example to a testable change in normal professional practice."],
  } as const;
  const quick = quickParagraphs(course, section);
  const coreBase = coreParagraphs(course, section);
  const core = ensureMinimum(coreBase, 320, [
    `A final reading habit is to distinguish description from judgement. Describe what is actually happening, identify the professional principle that matters, then justify the next action. This sequence slows down premature conclusions and makes discussion with colleagues more productive because disagreement can be located: people may disagree about the evidence, the interpretation, the priority or the proposed response.`,
  ]);
  const deep = ensureMinimum([...core, ...deepExtensions(course, section)], 520, [
    `Deep dive — professional dialogue. Use disagreement as information. Ask which assumption differs, what evidence would change each person's view and whether the disagreement concerns the principle or its application. High-quality CPD should increase the precision of professional conversation, not simply produce agreement with the presenter.`,
  ]);
  const keyIdeas = section === 1
    ? ["Understand the principle before copying the technique.", "Name the problem and the evidence that would show improvement.", "Use non-examples and boundaries to test understanding."]
    : section === 2
      ? ["Rehearse decisions, not just wording.", "Compare a first attempt with a model and improve it.", "Adapt the visible move while protecting the underlying purpose."]
      : ["Implement one small, testable change.", "Match evidence to the outcome being claimed.", "Review whether to keep, adapt, fade, revisit or stop."];
  const pausePrompts = section === 1
    ? ["What is the central principle here in plain language?", "What problem is it intended to solve in your context?", "What would a convincing non-example or limitation look like?"]
    : section === 2
      ? ["Which decision in the worked example matters most?", "What would you change for your subject, role or phase?", "What evidence would you check immediately after using the response?"]
      : ["What exactly will you change in normal practice?", "Which evidence is close enough to the intended outcome to be useful?", "What result would make you adapt or stop the approach?"];
  return {
    moduleId: `${PREFIX}${id}-${section}`,
    section,
    heading: headings[section][0],
    strapline: headings[section][1],
    quick,
    core,
    deep,
    keyIdeas,
    glossary: glossaryFor(course),
    pausePrompts,
  };
}

function readingModule(course: Course, section: Phase2ReadingSection): ContentModule {
  const reading = pack(course, section);
  return {
    id: reading.moduleId,
    type: "content",
    title: reading.heading,
    body: reading.core.join("\n\n"),
    keyPoints: reading.keyIdeas,
  };
}

function processActivity(course: Course, section: Phase2ReadingSection): ActivityModule {
  const reading = pack(course, section);
  return {
    id: `${PROCESS_PREFIX}${safeId(course.id)}-${section}`,
    type: "activity",
    title: `Pause and process reading ${section}`,
    prompt: "Close the reading mentally and process the idea before continuing.",
    instructions: reading.pausePrompts,
    placeholder: "Main idea… Connection to my context… Limitation/question…",
    minimumCharacters: 90,
  };
}

function insertAfter(modules: Module[], id: string, additions: Module[]) {
  const index = modules.findIndex(module => module.id === id);
  const at = index >= 0 ? index + 1 : Math.min(4, modules.length);
  modules.splice(at, 0, ...additions);
}

export function applyProfessionalReadingPhase2(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`) && !module.id.startsWith(`${PROCESS_PREFIX}${id}-`));
  insertAfter(modules, `overhaul1-cycle-${id}-1`, [readingModule(course, 1), processActivity(course, 1)]);
  insertAfter(modules, `overhaul1-cycle-${id}-2`, [readingModule(course, 2), processActivity(course, 2)]);
  insertAfter(modules, `overhaul1-cycle-${id}-3`, [readingModule(course, 3), processActivity(course, 3)]);
  return { ...course, duration: course.duration + 27, modules };
}

export function isProfessionalReadingPhase2Module(module: Module | undefined) {
  return Boolean(module && module.type === "content" && module.id.startsWith(PREFIX));
}

export function getProfessionalReadingPhase2Pack(course: Course, moduleOrId: Module | string) {
  const id = typeof moduleOrId === "string" ? moduleOrId : moduleOrId.id;
  if (!id.startsWith(PREFIX)) return null;
  const section = Number(id.split("-").pop()) as Phase2ReadingSection;
  if (![1, 2, 3].includes(section)) return null;
  return pack(course, section);
}

export function countProfessionalReadingWords(paragraphs: string[]) {
  return words(paragraphs.join(" "));
}

export function auditProfessionalReadingPhase2(course: Course) {
  const id = safeId(course.id);
  const readings = [1, 2, 3].map(section => pack(course, section as Phase2ReadingSection));
  const processingActivities = course.modules.filter(module => module.id.startsWith(`${PROCESS_PREFIX}${id}-`)).length;
  const quickWords = readings.map(reading => words(reading.quick.join(" ")));
  const coreWords = readings.map(reading => words(reading.core.join(" ")));
  const deepWords = readings.map(reading => words(reading.deep.join(" ")));
  return {
    courseId: course.id,
    title: course.title,
    readingModules: course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`)).length,
    processingActivities,
    quickWords,
    coreWords,
    deepWords,
    totalCoreWords: coreWords.reduce((sum, value) => sum + value, 0),
    glossaryTerms: readings.reduce((sum, reading) => sum + reading.glossary.length, 0),
    pausePrompts: readings.reduce((sum, reading) => sum + reading.pausePrompts.length, 0),
  };
}

export function validateProfessionalReadingPhase2(course: Course) {
  const audit = auditProfessionalReadingPhase2(course);
  if (audit.readingModules !== 3) throw new Error(`CPD course ${course.id} needs three Phase 2 professional reading passages`);
  if (audit.processingActivities !== 3) throw new Error(`CPD course ${course.id} needs three Phase 2 pause-and-process activities`);
  audit.quickWords.forEach((count, index) => {
    if (count < 90 || count > 220) throw new Error(`CPD course ${course.id} Phase 2 quick reading ${index + 1} is ${count} words; expected 90–220`);
  });
  audit.coreWords.forEach((count, index) => {
    if (count < 300 || count > 700) throw new Error(`CPD course ${course.id} Phase 2 core reading ${index + 1} is ${count} words; expected 300–700`);
  });
  audit.deepWords.forEach((count, index) => {
    if (count < 500 || count > 900) throw new Error(`CPD course ${course.id} Phase 2 deep reading ${index + 1} is ${count} words; expected 500–900`);
  });
  if (audit.totalCoreWords < 900) throw new Error(`CPD course ${course.id} needs at least 900 words of substantive Phase 2 core reading`);
  if (audit.glossaryTerms < 15) throw new Error(`CPD course ${course.id} needs a full Phase 2 glossary across its readings`);
  if (audit.pausePrompts < 9) throw new Error(`CPD course ${course.id} needs embedded Phase 2 pause-and-process prompts`);
}
