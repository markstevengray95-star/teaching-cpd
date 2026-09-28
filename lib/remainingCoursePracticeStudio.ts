import type { Course, Module } from "./data";

type ActivityModule = Extract<Module, { type: "activity" }>;
type VisualModule = Extract<Module, { type: "visual" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function objective(course: Course, index: number, fallback: string) {
  return course.objectives[index]?.trim() || fallback;
}

function buildPitfallVisual(course: Course): VisualModule {
  const focus = objective(course, 0, course.summary);
  const transfer = objective(course, 1, "apply the approach appropriately");

  const variants: Record<Course["category"], VisualModule["items"]> = {
    "Teaching & Learning": [
      { heading: "Technique without purpose", text: `Do not use ${focus.toLowerCase()} simply because it appears in the course. Link the move to the learning you need pupils to secure.`, icon: "!" },
      { heading: "Too many changes at once", text: "Make one focused adjustment where possible so the effect on pupil learning remains visible.", icon: "↔" },
      { heading: "No check afterwards", text: `After the change, gather evidence that pupils can ${transfer.toLowerCase()} rather than assuming the strategy worked.`, icon: "?" },
      { heading: "Routine becomes automatic", text: "Keep reviewing whether the approach still serves the learning goal and adapt when the evidence changes.", icon: "↻" },
    ],
    Safeguarding: [
      { heading: "Investigating yourself", text: "Staff should notice, listen, record and report within their role rather than trying to establish proof independently.", icon: "!" },
      { heading: "Waiting for certainty", text: `A concern linked to ${focus.toLowerCase()} should be passed through the school's current safeguarding route without requiring complete proof first.`, icon: "⏱" },
      { heading: "Over-promising confidentiality", text: "Do not promise secrecy that cannot be kept; explain that information may need to be shared with the appropriate safeguarding staff.", icon: "↗" },
      { heading: "Vague recording", text: "Record relevant facts accurately and promptly, following current school procedure and avoiding unnecessary interpretation.", icon: "✓" },
    ],
    SEND: [
      { heading: "Label-led support", text: `Start with the specific barrier to ${focus.toLowerCase()} rather than assuming every pupil with a similar label needs the same adjustment.`, icon: "!" },
      { heading: "Lowering ambition too early", text: "Adapt access before automatically reducing the important learning goal.", icon: "↑" },
      { heading: "Permanent scaffolding", text: `Support should help the pupil ${transfer.toLowerCase()} and, where appropriate, become less intrusive as independence grows.`, icon: "↘" },
      { heading: "No review of impact", text: "Check whether the adjustment removes the intended barrier rather than simply making the task easier to complete.", icon: "?" },
    ],
    Leadership: [
      { heading: "Initiative overload", text: `Do not respond to difficulty with ${focus.toLowerCase()} by automatically adding another initiative.`, icon: "+" },
      { heading: "Unclear expected practice", text: "Make the important behaviour or routine concrete enough that staff can understand, rehearse and discuss it.", icon: "◎" },
      { heading: "Monitoring before support", text: `Help colleagues ${transfer.toLowerCase()} through explanation, modelling, rehearsal or practical support before treating variation as a judgement issue.`, icon: "↗" },
      { heading: "No implementation review", text: "Use evidence to distinguish a weak idea from an implementation barrier and decide the next leadership move accordingly.", icon: "↻" },
    ],
    Wellbeing: [
      { heading: "Resilience-only response", text: `Do not reduce ${focus.toLowerCase()} to an individual's ability to cope when a recurring system cause can be improved.`, icon: "!" },
      { heading: "Removing every demand", text: "Reduce avoidable pressure while protecting responsibilities that remain important for pupils, staff or safety.", icon: "⚖" },
      { heading: "Vague good intentions", text: `Choose a concrete change that helps people ${transfer.toLowerCase()} and can actually be tested.`, icon: "→" },
      { heading: "No follow-up evidence", text: "Review whether the change improved the situation and whether it created any unintended costs elsewhere.", icon: "?" },
    ],
    "Digital Teaching": [
      { heading: "Tool before purpose", text: `Start with the educational or professional need linked to ${focus.toLowerCase()}, not with a tool looking for a use.`, icon: "!" },
      { heading: "Sensitive data by default", text: "Use only approved systems and protect personal or sensitive information in line with school expectations and data-protection requirements.", icon: "▣" },
      { heading: "Polished means accurate", text: `Verify important outputs before using them to help staff or pupils ${transfer.toLowerCase()}.`, icon: "?" },
      { heading: "Human review disappears", text: "Keep professional judgement, safeguarding and accountability with the member of staff rather than delegating consequential decisions to the tool.", icon: "✓" },
    ],
  };

  return {
    id: `remaining-studio-${safeId(course.id)}-pitfalls`,
    type: "visual",
    title: `${course.title}: common traps and stronger practice`,
    layout: "compare",
    caption: "Use these contrasts before the rehearsal task. The aim is not simply to remember the principle, but to recognise what weak implementation can look like in practice.",
    items: variants[course.category],
  };
}

function buildRehearsalActivity(course: Course): ActivityModule {
  const focus = objective(course, 0, course.summary);
  const second = objective(course, 1, "apply the approach appropriately");

  const variants: Record<Course["category"], Pick<ActivityModule, "prompt" | "instructions" | "placeholder">> = {
    "Teaching & Learning": {
      prompt: `Rehearse a small classroom move connected to ${focus}. Keep it narrow enough that you could try it in one lesson and see whether it helped pupils ${second.toLowerCase()}.`,
      instructions: [
        "Choose one specific moment in an upcoming lesson rather than redesigning the whole lesson.",
        "Write the exact teacher action, cue, question, explanation or routine you will use.",
        "State what pupils should be thinking or doing if the move is working.",
        "Identify one likely misconception or barrier and the response you will use if it appears.",
        "Write the quick evidence you will collect before deciding whether to keep or adapt the move.",
      ],
      placeholder: "Lesson moment…\nExact teacher move…\nExpected pupil response…\nLikely barrier and response…\nEvidence I will check…",
    },
    Safeguarding: {
      prompt: `Using a fictional or fully anonymised situation only, rehearse the professional response to a concern connected to ${focus}. Do not enter pupil-identifiable information.`,
      instructions: [
        "Write only the relevant observable facts or words from the fictional/anonymised situation.",
        "State the immediate response that keeps the member of staff within role.",
        "Identify the school's safeguarding route that should be followed and what should be recorded.",
        "Name one action that would cross the professional boundary, such as investigating independently or promising secrecy.",
        "State what local policy, DSL guidance or current procedure must be checked rather than relying on this training alone.",
      ],
      placeholder: "Fictional/anonymised facts…\nImmediate response…\nReporting/recording route…\nBoundary not to cross…\nSchool procedure to check…",
    },
    SEND: {
      prompt: `Choose one upcoming task and rehearse an adaptation that helps a pupil access ${focus.toLowerCase()} while preserving the important learning ambition.`,
      instructions: [
        "Describe the specific task demand and the barrier, without relying only on a diagnostic label.",
        "State what must remain ambitious or unchanged in the learning goal.",
        "Design one proportionate adjustment to instructions, representation, scaffolding, environment or practice.",
        "Explain how you will avoid over-support and, where appropriate, fade the scaffold.",
        "Identify the evidence that will show whether the pupil can increasingly ${second.toLowerCase()}.",
      ],
      placeholder: "Task and barrier…\nLearning that stays ambitious…\nAdjustment…\nHow support will avoid dependency…\nEvidence of improved access/independence…",
    },
    Leadership: {
      prompt: `Rehearse one leadership move linked to ${focus}. Use a real routine or priority, but do not enter sensitive staff information.`,
      instructions: [
        "Write the expected practice in one clear sentence that a colleague could act on.",
        "Identify one plausible implementation barrier before assuming unwillingness.",
        "Plan the explanation, model, rehearsal, resource or support that addresses that barrier.",
        "State what implementation evidence you will review without turning the process into unnecessary surveillance.",
        "Write the follow-up decision you would make if the evidence shows staff can now ${second.toLowerCase()} or if the barrier remains.",
      ],
      placeholder: "Expected practice…\nLikely barrier…\nSupport/rehearsal…\nEvidence to review…\nFollow-up decision…",
    },
    Wellbeing: {
      prompt: `Choose one recurring pressure connected to ${focus} and rehearse a small system change rather than relying only on individual coping.`,
      instructions: [
        "Describe the recurring process or pressure and the part that is realistically controllable.",
        "Identify what important responsibility must still be protected.",
        "Design one small change to remove duplication, ambiguity, delay or avoidable effort.",
        "State how the change should help people ${second.toLowerCase()} without moving the burden elsewhere.",
        "Choose one indicator to review after the change and decide what would make you keep, adapt or stop it.",
      ],
      placeholder: "Recurring pressure…\nResponsibility to protect…\nSmall system change…\nExpected benefit…\nIndicator and review decision…",
    },
    "Digital Teaching": {
      prompt: `Choose a low-risk professional task linked to ${focus} and rehearse a responsible digital workflow before using any tool with real data.`,
      instructions: [
        "State the educational or professional purpose before naming a tool.",
        "Identify what information is genuinely needed and what personal/sensitive data should be excluded or handled only in an approved system.",
        "Write how you will verify factual accuracy, bias, appropriateness and school-policy compliance.",
        "State the human review or professional judgement that must remain before the output is used.",
        "Define evidence that the workflow genuinely helps staff or pupils ${second.toLowerCase()} rather than merely producing faster output.",
      ],
      placeholder: "Purpose…\nData/privacy boundary…\nVerification checks…\nHuman review…\nEvidence of value…",
    },
  };

  const variant = variants[course.category];
  return {
    id: `remaining-studio-${safeId(course.id)}-rehearsal`,
    type: "activity",
    title: "Rehearsal studio: practise before you implement",
    prompt: variant.prompt,
    instructions: variant.instructions,
    placeholder: variant.placeholder,
    minimumCharacters: 180,
  };
}

function insertPracticePair(modules: Module[], visual: VisualModule, activity: ActivityModule) {
  const closingStart = Math.max(2, modules.length - 3);
  const target = Math.max(3, Math.min(closingStart, Math.floor(closingStart * 0.62)));
  modules.splice(target, 0, visual, activity);
}

export function addRemainingPracticeStudio(course: Course, index: number): Course {
  if (index < 30) return course;

  const modules = [...course.modules];
  const ids = new Set(modules.map(module => module.id));
  const visual = buildPitfallVisual(course);
  const activity = buildRehearsalActivity(course);
  let addedMinutes = 0;

  if (!ids.has(visual.id) && !ids.has(activity.id)) {
    insertPracticePair(modules, visual, activity);
    addedMinutes = 10;
  } else {
    const closingStart = Math.max(2, modules.length - 3);
    if (!ids.has(visual.id)) {
      modules.splice(Math.max(2, closingStart - 1), 0, visual);
      addedMinutes += 4;
    }
    if (!ids.has(activity.id)) {
      modules.splice(Math.max(2, modules.length - 3), 0, activity);
      addedMinutes += 6;
    }
  }

  return {
    ...course,
    duration: course.duration + addedMinutes,
    modules,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateRemainingPracticeStudio(course: Course, index: number) {
  if (index < 30) return;

  const id = safeId(course.id);
  const prefix = `Remaining-course rehearsal QA failed for ${course.id}:`;
  const visual = course.modules.find(module => module.id === `remaining-studio-${id}-pitfalls`);
  const activity = course.modules.find(module => module.id === `remaining-studio-${id}-rehearsal`);
  const activities = course.modules.filter(module => module.type === "activity");

  assert(visual?.type === "visual", `${prefix} missing common-traps visual`);
  assert(visual?.type === "visual" && visual.items.length >= 4, `${prefix} common-traps visual is incomplete`);
  assert(activity?.type === "activity", `${prefix} missing rehearsal activity`);
  assert(activity?.type === "activity" && activity.instructions.length >= 5, `${prefix} rehearsal activity needs at least five steps`);
  assert(activity?.type === "activity" && (activity.minimumCharacters ?? 0) >= 150, `${prefix} rehearsal response threshold is too low`);
  assert(activities.length >= 2, `${prefix} course needs at least two substantial practice activities`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} final application activity moved out of the closing sequence`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} readiness checklist moved out of the closing sequence`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final reflection moved out of the closing sequence`);
}
