import type { Course, CourseCategory, Module } from "./data";

export const PRESENTATION_OVERHAUL_PHASE13_VERSION = "2026.14";

export type Phase13Choice = {
  id: string;
  label: string;
  feedback: string;
  correct: boolean;
};

export type Phase13ChoiceLock = {
  id: "evidence" | "misconception" | "vault";
  title: string;
  prompt: string;
  hint: string;
  clue: string;
  options: Phase13Choice[];
};

export type Phase13SequenceLock = {
  id: "sequence";
  title: string;
  prompt: string;
  hint: string;
  clue: string;
  items: { id: string; label: string }[];
  correctOrder: string[];
};

export type Phase13EscapePack = {
  courseId: string;
  title: string;
  subtitle: string;
  intro: string;
  successMessage: string;
  locks: [Phase13ChoiceLock, Phase13ChoiceLock, Phase13SequenceLock, Phase13ChoiceLock];
};

export type Phase13EscapeAudit = {
  courseId: string;
  title: string;
  locks: number;
  choiceOptions: number;
  sequenceItems: number;
  clues: number;
  ready: boolean;
  score: number;
};

function choice(id: string, label: string, feedback: string, correct = false): Phase13Choice {
  return { id, label, feedback, correct };
}

function categoryLens(category: CourseCategory) {
  if (category === "Safeguarding") return {
    title: "Safeguarding decision room",
    subtitle: "Unlock the case without stepping outside the staff role.",
    intro: "Four professional locks stand between the initial concern and a defensible safeguarding response. Work from facts, current school procedure and appropriate professional boundaries.",
    evidencePrompt: "Which evidence is strongest for the first lock?",
    evidence: [
      choice("factual", "A prompt factual record of what was observed or said, passed through the school's current safeguarding route.", "Correct. Factual recording and the current reporting route are the strongest professional evidence here.", true),
      choice("colleague", "An informal discussion about whether colleagues think the concern sounds serious.", "This can introduce interpretation and delay. Use the school's current safeguarding route instead."),
      choice("investigate", "A detailed account built by questioning several pupils so the story is complete.", "Investigation is not the classroom member of staff's role."),
    ],
    misconceptionPrompt: "Which statement must be rejected to open the second lock?",
    misconception: [
      choice("reject", "Staff should investigate enough to decide whether a concern is definitely true before reporting it.", "Correct. Staff recognise, record and report; they do not need to prove a concern before using the safeguarding route.", true),
      choice("policy", "Current school safeguarding policy and DSL guidance take precedence over generated training examples.", "This is a sound boundary, not the misconception."),
      choice("facts", "Records should distinguish factual information from assumption or interpretation.", "This is good practice, not the misconception."),
    ],
    sequence: [
      { id: "listen", label: "Listen and respond within the staff role" },
      { id: "record", label: "Record factual information promptly" },
      { id: "report", label: "Use the school's current safeguarding route" },
      { id: "follow", label: "Continue to follow policy and DSL guidance if new information appears" },
    ],
    finalPrompt: "New factual information appears later. Which response opens the final vault?",
    final: [
      choice("route", "Record the new information and use the current safeguarding route again without investigating.", "Vault open. The response is factual, timely and stays within professional boundaries.", true),
      choice("wait", "Wait for more information so the record is more complete before passing anything on.", "Delay can weaken safeguarding practice. Use the current procedure with the information available."),
      choice("question", "Question other pupils first so the DSL receives a complete explanation.", "That moves into investigation. Keep to factual recording and the school's reporting route."),
    ],
  };

  if (category === "SEND") return {
    title: "Barrier breaker room",
    subtitle: "Find the barrier, preserve ambition and escape over-support.",
    intro: "The room only opens when support is linked to the actual barrier rather than a label. Protect the learning goal, independence and meaningful participation.",
    evidencePrompt: "Which evidence best shows that an adaptation is actually helping?",
    evidence: [
      choice("access", "The learner accesses the same intended outcome with improving participation and independence.", "Correct. Access plus independence gives stronger evidence than task completion alone.", true),
      choice("finish", "The learner finishes more work when an adult stays beside them throughout.", "Completion alone does not show whether support is building independence."),
      choice("label", "The adaptation matches a common strategy associated with the learner's diagnosis.", "A diagnosis does not automatically identify the barrier in this specific task."),
    ],
    misconceptionPrompt: "Which statement is the misconception?",
    misconception: [
      choice("fixed", "Once a support strategy works, it should normally stay in place permanently so success is protected.", "Correct. Useful support may need fading or adapting as independence grows.", true),
      choice("barrier", "Support should respond to the actual barrier rather than assumptions about a label.", "This is a strong principle, not the misconception."),
      choice("ambition", "An adaptation can change the route while preserving an ambitious learning goal.", "This is a strong principle, not the misconception."),
    ],
    sequence: [
      { id: "identify", label: "Identify the actual barrier in the task or environment" },
      { id: "goal", label: "Protect the intended learning goal" },
      { id: "support", label: "Choose the smallest useful adaptation" },
      { id: "review", label: "Review access and independence, then adapt or fade support" },
    ],
    finalPrompt: "The learner now waits for adult prompts before starting work. What opens the final vault?",
    final: [
      choice("fade", "Use evidence of independence to fade or reshape the support while keeping the ambitious goal.", "Vault open. The support remains responsive rather than becoming permanent dependency.", true),
      choice("same", "Keep the current support unchanged because task completion has improved.", "This risks turning successful support into dependency."),
      choice("remove", "Remove all support immediately so independence increases faster.", "Abrupt removal may recreate the original barrier. Fade support responsively."),
    ],
  };

  if (category === "Leadership") return {
    title: "Implementation escape room",
    subtitle: "Diagnose the barrier before adding more monitoring.",
    intro: "A school improvement idea is trapped between intention and implementation. Escape by separating clarity, capability, capacity and follow-through rather than assuming one cause.",
    evidencePrompt: "Which evidence is most useful before deciding how to respond to inconsistent implementation?",
    evidence: [
      choice("barriers", "Evidence about what staff understand, can do, have capacity for and are actually implementing.", "Correct. This diagnoses the implementation problem before prescribing a response.", true),
      choice("ranking", "A league table of who appears to follow the routine most consistently.", "Ranking does not identify why implementation differs and can distort professional learning."),
      choice("visibility", "How often leaders have seen the routine during brief visits.", "Visibility alone is too narrow to diagnose clarity, capability or capacity."),
    ],
    misconceptionPrompt: "Which assumption should be rejected?",
    misconception: [
      choice("motivation", "If implementation is inconsistent, the main problem is usually staff motivation.", "Correct. Inconsistency may reflect clarity, capability, capacity, context or implementation design.", true),
      choice("clarity", "Teams need a clear description of the intended practice before monitoring is useful.", "This is a sound implementation principle."),
      choice("support", "Support should respond to diagnosed barriers rather than automatically increasing surveillance.", "This is a sound implementation principle."),
    ],
    sequence: [
      { id: "clarify", label: "Clarify the intended practice and purpose" },
      { id: "diagnose", label: "Diagnose clarity, capability and capacity barriers" },
      { id: "support", label: "Provide the smallest useful support or system change" },
      { id: "review", label: "Review implementation evidence and adapt" },
    ],
    finalPrompt: "Workload rises and different versions of the routine appear. What opens the final vault?",
    final: [
      choice("minimum", "Clarify the smallest non-negotiable practice, remove avoidable workload and review implementation evidence.", "Vault open. This protects purpose while responding to real implementation conditions.", true),
      choice("monitor", "Increase monitoring so everyone delivers the routine in exactly the same way.", "More monitoring does not solve unclear purpose, workload or contextual barriers."),
      choice("initiative", "Launch a second initiative to rebuild momentum.", "Adding another initiative usually increases implementation load rather than solving the first problem."),
    ],
  };

  if (category === "Wellbeing") return {
    title: "Workload friction room",
    subtitle: "Escape the cycle of treating system problems as individual resilience problems.",
    intro: "The challenge is to identify controllable organisational friction and test whether a change genuinely reduces workload or pressure.",
    evidencePrompt: "Which evidence most strongly shows that a wellbeing change is working?",
    evidence: [
      choice("friction", "The targeted duplication, delay or workload friction measurably reduces in normal practice.", "Correct. Evidence should connect to the problem the intervention was meant to change.", true),
      choice("liked", "Staff report that they enjoyed the wellbeing activity.", "Enjoyment may matter, but it does not show that the underlying workload problem changed."),
      choice("attendance", "Lots of staff attended the launch event.", "Attendance is implementation evidence, not evidence that workload or wellbeing improved."),
    ],
    misconceptionPrompt: "Which statement is the trap?",
    misconception: [
      choice("resilience", "When pressure rises, the most useful first response is normally to strengthen individual resilience.", "Correct. First identify controllable system and workload factors rather than defaulting to individual coping.", true),
      choice("systems", "Some wellbeing problems require changes to systems, deadlines or duplication.", "This is a sound principle."),
      choice("choice", "Individual support should be available without forcing personal disclosure.", "This is a sound principle."),
    ],
    sequence: [
      { id: "define", label: "Define the specific pressure or friction" },
      { id: "control", label: "Identify controllable system factors" },
      { id: "change", label: "Make one practical change" },
      { id: "measure", label: "Check whether workload or friction actually reduces" },
    ],
    finalPrompt: "Staff liked a wellbeing initiative, but duplication and deadlines are unchanged. What opens the final vault?",
    final: [
      choice("system", "Redesign the underlying workload process and then check whether the friction reduces.", "Vault open. The response returns to the cause rather than mistaking positive reaction for impact.", true),
      choice("keep", "Keep the initiative unchanged because the feedback was positive.", "Positive feedback does not show that the original workload problem changed."),
      choice("more", "Add another resilience activity alongside the existing initiative.", "This adds activity without addressing the system friction."),
    ],
  };

  if (category === "Digital Teaching") return {
    title: "Digital judgement vault",
    subtitle: "Unlock useful technology without surrendering verification or professional responsibility.",
    intro: "The vault opens only when educational purpose, privacy, accessibility, verification and human oversight remain intact.",
    evidencePrompt: "Which evidence best supports wider use of a digital or AI workflow?",
    evidence: [
      choice("benefit", "Verified improvement in the intended learning or workload outcome, with privacy and accessibility checks in place.", "Correct. Benefit must be demonstrated alongside safe-use conditions.", true),
      choice("speed", "The tool produces polished-looking output much faster than manual work.", "Speed alone does not establish accuracy, privacy, accessibility or educational value."),
      choice("popular", "Several colleagues say the tool is impressive and easy to use.", "Popularity is not enough evidence for safe or effective implementation."),
    ],
    misconceptionPrompt: "Which belief must be rejected?",
    misconception: [
      choice("confidence", "A confident, professional-looking AI response is usually reliable enough to use with only light checking.", "Correct. Fluent output still requires human verification.", true),
      choice("purpose", "The professional or educational purpose should be clear before choosing the tool.", "This is a strong principle."),
      choice("oversight", "A human remains responsible for the final professional decision.", "This is a strong principle."),
    ],
    sequence: [
      { id: "purpose", label: "Define the educational or professional purpose" },
      { id: "risk", label: "Check privacy, accessibility and data boundaries" },
      { id: "verify", label: "Verify important outputs with human judgement" },
      { id: "review", label: "Review whether the tool genuinely improves the intended outcome" },
    ],
    finalPrompt: "Early users report time savings and want school-wide use. What opens the final vault?",
    final: [
      choice("guardrails", "Set safe-use boundaries, verification expectations and accessibility checks before scaling.", "Vault open. Scaling follows demonstrated benefit and clear professional guardrails.", true),
      choice("scale", "Roll it out immediately because the first users saved time.", "Early time savings do not remove privacy, accuracy or accessibility risks."),
      choice("personal", "Let each member of staff decide independently what data and outputs are safe.", "School-wide use needs shared boundaries rather than inconsistent personal rules."),
    ],
  };

  return {
    title: "Learning evidence escape room",
    subtitle: "Escape busy-looking practice by finding evidence of pupil thinking.",
    intro: "The room opens when professional decisions are tied to the learning problem, useful evidence and a planned review rather than surface engagement alone.",
    evidencePrompt: "Which evidence gives the strongest basis for the next teaching move?",
    evidence: [
      choice("thinking", "A focused check that samples pupil thinking across the class and reveals what they understand or misunderstand.", "Correct. This gives actionable evidence for the next teaching decision.", true),
      choice("busy", "Most pupils are quiet, busy and appear to be following the task.", "Visible compliance does not necessarily reveal understanding."),
      choice("volunteer", "One confident volunteer gives a correct answer.", "One response is too narrow to represent whole-class understanding."),
    ],
    misconceptionPrompt: "Which statement is the misconception?",
    misconception: [
      choice("busy-learning", "If pupils are busy and engaged, the lesson is probably producing the intended learning.", "Correct. Engagement can support learning, but it is not evidence of learning by itself.", true),
      choice("check", "Teaching should adapt when useful evidence shows that pupil thinking differs from what was expected.", "This is a sound responsive-teaching principle."),
      choice("principle", "A useful technique should remain connected to the learning problem it is meant to solve.", "This is a sound principle."),
    ],
    sequence: [
      { id: "problem", label: "Define the learning problem precisely" },
      { id: "evidence", label: "Gather evidence of pupil thinking" },
      { id: "adapt", label: "Adapt the next teaching move" },
      { id: "review", label: "Review whether the change improved the intended outcome" },
    ],
    finalPrompt: "A strategy worked in one class but is weaker in another. What opens the final vault?",
    final: [
      choice("adapt", "Keep the underlying principle, adapt the surface routine and check pupil thinking again.", "Vault open. The response preserves the learning principle while remaining responsive to context.", true),
      choice("repeat", "Repeat the same routine more often because it worked in the first class.", "Repeating the surface routine does not address why the evidence differs."),
      choice("abandon", "Abandon the approach completely after the weaker lesson.", "One weaker implementation does not automatically invalidate the underlying principle."),
    ],
  };
}

export function getPhase13EscapePack(course: Course): Phase13EscapePack {
  const lens = categoryLens(course.category);
  return {
    courseId: course.id,
    title: lens.title,
    subtitle: lens.subtitle,
    intro: `${lens.intro} Use the learning from ${course.title} to clear all four locks.`,
    successMessage: "Escape complete. You have unlocked the final synthesis stage. Carry the clues forward: evidence, boundary, order and transfer.",
    locks: [
      { id: "evidence", title: "Lock 1 · Evidence", prompt: lens.evidencePrompt, hint: "Choose the evidence that would genuinely change or justify the next professional decision.", clue: "EVIDENCE", options: lens.evidence },
      { id: "misconception", title: "Lock 2 · Misconception", prompt: lens.misconceptionPrompt, hint: "Find the statement that sounds plausible but breaks the course principle or professional boundary.", clue: "BOUNDARY", options: lens.misconception },
      { id: "sequence", title: "Lock 3 · Sequence", prompt: "Put the professional response into the strongest order.", hint: "Start with defining or recognising the problem before acting; finish by reviewing what the evidence says.", clue: "ORDER", items: lens.sequence, correctOrder: lens.sequence.map(item => item.id) },
      { id: "vault", title: "Lock 4 · Final case vault", prompt: lens.finalPrompt, hint: "Choose the response that keeps the principle, respects the boundary and creates useful evidence for review.", clue: "TRANSFER", options: lens.final },
    ],
  };
}

export function isPhase13EscapeAnchor(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith("overhaul9-synthesis-") && module.id.endsWith("-brief"));
}

export function validateEscapePhase13(course: Course) {
  const pack = getPhase13EscapePack(course);
  if (pack.locks.length !== 4) throw new Error(`Phase 13 ${course.id}: requires four escape locks`);
  const [evidence, misconception, sequence, vault] = pack.locks;
  for (const lock of [evidence, misconception, vault]) {
    if (lock.options.length < 3) throw new Error(`Phase 13 ${course.id}: ${lock.id} requires at least three options`);
    if (lock.options.filter(option => option.correct).length !== 1) throw new Error(`Phase 13 ${course.id}: ${lock.id} requires exactly one correct option`);
    if (!lock.clue.trim() || !lock.hint.trim()) throw new Error(`Phase 13 ${course.id}: ${lock.id} needs a clue and hint`);
  }
  if (sequence.items.length !== 4 || sequence.correctOrder.length !== 4) throw new Error(`Phase 13 ${course.id}: sequence lock requires four ordered actions`);
  if (new Set(sequence.correctOrder).size !== 4) throw new Error(`Phase 13 ${course.id}: sequence order must contain four unique actions`);
  if (!course.modules.some(isPhase13EscapeAnchor)) throw new Error(`Phase 13 ${course.id}: final synthesis anchor is missing`);
  return true;
}

export function auditEscapePhase13(course: Course): Phase13EscapeAudit {
  const pack = getPhase13EscapePack(course);
  let ready = true;
  try { validateEscapePhase13(course); } catch { ready = false; }
  const choiceLocks = pack.locks.filter(lock => lock.id !== "sequence") as Phase13ChoiceLock[];
  const sequence = pack.locks[2];
  const choiceOptions = choiceLocks.reduce((sum, lock) => sum + lock.options.length, 0);
  const clues = pack.locks.filter(lock => Boolean(lock.clue.trim())).length;
  const score = Math.min(100,
    (pack.locks.length === 4 ? 30 : 0) +
    (choiceOptions >= 9 ? 20 : 0) +
    (sequence.items.length === 4 ? 20 : 0) +
    (clues === 4 ? 15 : 0) +
    (ready ? 15 : 0)
  );
  return { courseId: course.id, title: course.title, locks: pack.locks.length, choiceOptions, sequenceItems: sequence.items.length, clues, ready, score };
}

export function summariseEscapePhase13(courses: Course[]) {
  const reports = courses.map(auditEscapePhase13);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalLocks: reports.reduce((sum, report) => sum + report.locks, 0),
    totalChoiceOptions: reports.reduce((sum, report) => sum + report.choiceOptions, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
