import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE26_VERSION = "2026.28";

export type Phase26Frame = {
  id: string;
  label: string;
  narration: string;
  visualCue: string;
};

export type Phase26Decision = {
  prompt: string;
  options: { id: string; label: string; best: boolean }[];
  rationale: string;
};

export type Phase26Scenario = {
  id: string;
  title: string;
  durationSeconds: number;
  frames: Phase26Frame[];
  decision: Phase26Decision;
  transferPrompt: string;
};

export type Phase26Pack = {
  id: string;
  title: string;
  subtitle: string;
  scenarios: Phase26Scenario[];
};

export type Phase26Audit = {
  courseId: string;
  title: string;
  scenarios: number;
  frames: number;
  decisions: number;
  ready: boolean;
  score: number;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function options(labels: string[], best: number) {
  return labels.map((label, index) => ({ id: String.fromCharCode(65 + index), label, best: index === best }));
}

type Lens = {
  first: { title: string; frames: string[][]; prompt: string; options: string[]; best: number; rationale: string; transfer: string };
  second: { title: string; frames: string[][]; prompt: string; options: string[]; best: number; rationale: string; transfer: string };
};

function lens(category: CourseCategory, course: Course): Lens {
  if (category === "Safeguarding") return {
    first: {
      title: "The interrupted disclosure",
      frames: [
        ["00:00", "A pupil asks to speak briefly after a lesson and says something has been worrying them.", "Quiet classroom · end of lesson"],
        ["00:12", "They share one concerning detail, then stop and ask you not to tell anybody.", "Conversation pauses · staff member listening"],
        ["00:24", "You have another class arriving and the information is incomplete.", "Corridor movement begins · decision point approaching"],
      ],
      prompt: "What should the member of staff do next?",
      options: ["Listen calmly, explain the safeguarding boundary, record factually and use the current school route promptly", "Ask detailed questions until the whole story is clear", "Promise confidentiality so the pupil continues", "Wait until there is more evidence"],
      best: 0,
      rationale: "The safest professional response stays factual, avoids investigation and uses the school's current safeguarding process even when information is incomplete.",
      transfer: "Which part of your school's reporting route should every member of staff be able to find immediately?",
    },
    second: {
      title: "The colleague request",
      frames: [
        ["00:00", "After reporting a concern through the correct route, a colleague asks what happened.", "Staff workroom · informal conversation"],
        ["00:12", "The colleague teaches the pupil tomorrow and says knowing the full story would help them look out for signs.", "Concerned colleague · request for detail"],
        ["00:24", "You need to decide how to respond without undermining confidentiality or appropriate safeguarding information-sharing.", "Conversation pauses · decision point"],
      ],
      prompt: "What is the strongest response?",
      options: ["Keep information to the appropriate need-to-know safeguarding process and direct uncertainty to the designated safeguarding route", "Give the colleague the full account informally", "Ask the pupil whether you may share everything", "Tell several colleagues so they can compare observations"],
      best: 0,
      rationale: "Relevant information-sharing should happen through the appropriate safeguarding process rather than informal circulation of confidential details.",
      transfer: "How would you explain 'need to know' to a colleague without making them feel excluded from safeguarding responsibility?",
    },
  };
  if (category === "SEND") return {
    first: {
      title: "The learner who can explain but cannot start",
      frames: [
        ["00:00", "A learner gives an accurate verbal explanation during questioning.", "Class discussion · accurate oral response"],
        ["00:12", "When the class begins a multi-step written task, the learner waits and does not begin independently.", "Worksheet open · blank first section"],
        ["00:24", "An adult offers to prompt every step so the work gets completed.", "Adult support offered · decision point"],
      ],
      prompt: "What should happen first?",
      options: ["Identify the specific task barrier and test a small scaffold while keeping the learning goal", "Lower the learning goal immediately", "Use adult prompting for every step from now on", "Replace the task with unrelated easier work"],
      best: 0,
      rationale: "The evidence suggests an access or task-organisation barrier rather than absence of the core idea. Support should target that barrier and preserve independence.",
      transfer: "Which current classroom scaffold could be reduced once pupils can start more independently?",
    },
    second: {
      title: "When support becomes dependence",
      frames: [
        ["00:00", "A visual scaffold has improved task completion over several lessons.", "Completed work · scaffold visible"],
        ["00:12", "The learner now waits for the scaffold even on familiar tasks they previously attempted independently.", "Pause before starting · familiar task"],
        ["00:24", "The team must decide whether success means the scaffold should stay unchanged.", "Support review meeting · decision point"],
      ],
      prompt: "What is the strongest next move?",
      options: ["Review accuracy and independence, then fade or adapt the scaffold if evidence supports it", "Keep the scaffold permanently because completion improved", "Add more adult prompting", "Lower all future task demands"],
      best: 0,
      rationale: "Effective support should be reviewed against access, learning and independence rather than completion alone.",
      transfer: "What evidence would tell you a scaffold is ready to be faded?",
    },
  };
  if (category === "Leadership") return {
    first: {
      title: "The inconsistent implementation meeting",
      frames: [
        ["00:00", "A new agreed practice is being implemented differently across teams.", "Implementation dashboard · visible variation"],
        ["00:12", "Senior leaders suggest weekly monitoring because they believe expectations are already clear.", "Leadership meeting · monitoring proposal"],
        ["00:24", "Several staff say the examples are unclear and the routine adds work at the busiest point of the week.", "Staff feedback · decision point"],
      ],
      prompt: "What should leadership do next?",
      options: ["Diagnose clarity, capability and capacity before increasing monitoring", "Publish team comparisons immediately", "Increase monitoring and assume variation means resistance", "Add another reporting requirement"],
      best: 0,
      rationale: "Monitoring can describe variation but cannot fix unclear expectations, capability gaps or capacity barriers by itself.",
      transfer: "Which implementation barrier in your context would be easiest to mislabel as poor motivation?",
    },
    second: {
      title: "Compliance without purpose",
      frames: [
        ["00:00", "Monitoring data improve quickly after leaders increase checks.", "Green implementation chart"],
        ["00:12", "Staff explain that they are optimising the visible evidence rather than improving the underlying practice.", "Staff discussion · performative compliance"],
        ["00:24", "Leaders must decide whether the improved monitoring score demonstrates successful implementation.", "Dashboard highlighted · decision point"],
      ],
      prompt: "What is the strongest leadership response?",
      options: ["Re-centre the intended practice, clarify quality and review whether monitoring is distorting behaviour", "Celebrate the score and increase checks", "Rank individual staff", "Ignore staff feedback because the metric improved"],
      best: 0,
      rationale: "Implementation evidence is useful only when it remains connected to the professional practice and intended outcome it is meant to represent.",
      transfer: "What evidence in your setting could show quality rather than simple compliance?",
    },
  };
  if (category === "Wellbeing") return {
    first: {
      title: "The popular wellbeing initiative",
      frames: [
        ["00:00", "A wellbeing event receives very positive staff feedback.", "Positive survey comments"],
        ["00:12", "The following month, staff still report duplicated processes and clustered deadlines as their main pressure.", "Workload timeline · duplicated tasks"],
        ["00:24", "Leaders are considering running the same event more often.", "Planning meeting · decision point"],
      ],
      prompt: "What should happen next?",
      options: ["Keep appropriate wellbeing support but address a controllable workload source and measure the effect", "Repeat the event and treat popularity as proof the workload problem improved", "Tell staff to manage time better", "Add another initiative without removing anything"],
      best: 0,
      rationale: "A valued wellbeing activity can coexist with unresolved system pressure. Evidence should match the outcome being claimed.",
      transfer: "Which recurring workload pressure in your team is most controllable?",
    },
    second: {
      title: "Workload moved, not removed",
      frames: [
        ["00:00", "A new process reduces administration for one department.", "Department A · time saved"],
        ["00:12", "Another team now has to re-enter the information manually each week.", "Department B · extra admin"],
        ["00:24", "The original team reports the change as a successful workload reduction.", "Success report · decision point"],
      ],
      prompt: "What is the strongest review decision?",
      options: ["Review the whole workflow and redesign the transfer point so workload is not simply displaced", "Keep the change unchanged because one team saved time", "Ask the second team to work faster", "Add a wellbeing activity for the second team"],
      best: 0,
      rationale: "System improvement should check where burden moves as well as where it disappears.",
      transfer: "Where might a current efficiency in your setting be shifting hidden work elsewhere?",
    },
  };
  if (category === "Digital Teaching") return {
    first: {
      title: "The polished AI output",
      frames: [
        ["00:00", "A new AI-supported tool creates a pupil resource in seconds.", "Generated resource · polished layout"],
        ["00:12", "The resource reads fluently and looks professional.", "Confident wording · attractive formatting"],
        ["00:24", "A teacher notices one subtle factual error in a key explanation.", "Highlighted sentence · decision point"],
      ],
      prompt: "What is the strongest response before wider use?",
      options: ["Set a verification step appropriate to the risk and keep human approval of pupil-facing material", "Assume future outputs will be accurate because most of this one was", "Use the tool only when nobody has time to check", "Judge quality from presentation rather than content"],
      best: 0,
      rationale: "Fluency and presentation are not evidence of factual reliability. Verification should match the consequence of an error.",
      transfer: "Which digital task in your work needs a clearer verification standard?",
    },
    second: {
      title: "The data shortcut",
      frames: [
        ["00:00", "A tool could save significant time by analysing staff-entered information.", "Time-saving workflow proposal"],
        ["00:12", "The quickest method would involve entering sensitive school information into a service not approved for that data.", "Data field highlighted · warning"],
        ["00:24", "The team needs to decide whether the productivity gain justifies using the shortcut.", "Workflow paused · decision point"],
      ],
      prompt: "What should happen?",
      options: ["Keep the task purpose but use approved data-handling boundaries or redesign the workflow", "Use the shortcut because the time saving is large", "Let each staff member decide individually", "Remove only a first name and assume all other data are safe"],
      best: 0,
      rationale: "A useful digital purpose does not override organisational data-handling boundaries. The workflow should be redesigned to fit approved use.",
      transfer: "Which part of your school's digital guidance should staff be able to check quickly before using a new tool?",
    },
  };
  return {
    first: {
      title: `The apparently successful ${course.title} lesson`,
      frames: [
        ["00:00", "Pupils are engaged and complete the planned activity successfully.", "Busy classroom · high participation"],
        ["00:12", "A later independent check reveals the same misconception across a sizeable group.", "Independent responses · repeated error pattern"],
        ["00:24", "The teacher must decide whether to continue because the lesson itself felt successful.", "Planning screen · decision point"],
      ],
      prompt: "What is the strongest next teaching move?",
      options: ["Diagnose the misconception, respond precisely and check independent transfer again", "Repeat the same activity because pupils enjoyed it", "Move on because work completion was high", "Lower the learning goal for the whole class"],
      best: 0,
      rationale: "Evidence of pupil thinking is more informative about learning than surface activity or completion alone.",
      transfer: "Which independent check would reveal whether pupils can use this idea without support?",
    },
    second: {
      title: "The strong guided answer",
      frames: [
        ["00:00", "During guided practice, most pupils produce an accurate answer with teacher prompts.", "Worked example · guided success"],
        ["00:12", "When the prompt is removed, accuracy drops sharply on a similar problem.", "Independent attempt · mixed responses"],
        ["00:24", "The teacher is deciding whether more guided practice or a different response is needed.", "Teacher reviewing evidence · decision point"],
      ],
      prompt: "What should drive the decision?",
      options: ["The specific gap revealed by the independent responses and the support pupils still require", "How confident pupils sounded during guided practice", "How many examples were completed", "Whether the lesson stayed on schedule"],
      best: 0,
      rationale: "Independent evidence helps identify whether pupils have learned the idea or are still relying on the support structure.",
      transfer: "Where in your teaching could guided success currently be hiding weak independent transfer?",
    },
  };
}

function makeScenario(id: string, source: Lens["first"]): Phase26Scenario {
  return {
    id,
    title: source.title,
    durationSeconds: 36,
    frames: source.frames.map((frame, index) => ({ id: `f${index + 1}`, label: frame[0], narration: frame[1], visualCue: frame[2] })),
    decision: { prompt: source.prompt, options: options(source.options, source.best), rationale: source.rationale },
    transferPrompt: source.transfer,
  };
}

export function getPhase26Pack(course: Course): Phase26Pack {
  const source = lens(course.category, course);
  return {
    id: `phase26-${safeId(course.id)}`,
    title: `Video Decision Points · ${course.title}`,
    subtitle: "Two short animated scenario clips pause at the professional decision point. Commit to what should happen next before the rationale is revealed.",
    scenarios: [makeScenario("scenario-1", source.first), makeScenario("scenario-2", source.second)],
  };
}

export function validateVideoDecisionPhase26(course: Course) {
  const pack = getPhase26Pack(course);
  if (pack.scenarios.length !== 2) throw new Error(`Phase 26 ${course.id}: requires two decision clips`);
  if (pack.scenarios.some(scenario => scenario.frames.length !== 3)) throw new Error(`Phase 26 ${course.id}: each clip requires three frames`);
  if (pack.scenarios.some(scenario => scenario.decision.options.length < 3 || scenario.decision.options.filter(option => option.best).length !== 1)) throw new Error(`Phase 26 ${course.id}: each clip requires one strongest decision`);
  if (pack.scenarios.some(scenario => !scenario.transferPrompt.trim())) throw new Error(`Phase 26 ${course.id}: each clip needs a transfer prompt`);
  return true;
}

export function auditVideoDecisionPhase26(course: Course): Phase26Audit {
  const pack = getPhase26Pack(course);
  let ready = true;
  try { validateVideoDecisionPhase26(course); } catch { ready = false; }
  const frames = pack.scenarios.reduce((sum, scenario) => sum + scenario.frames.length, 0);
  const decisions = pack.scenarios.length;
  const score = Math.min(100, (pack.scenarios.length === 2 ? 30 : 0) + (frames === 6 ? 25 : 0) + (decisions === 2 ? 20 : 0) + (pack.scenarios.every(scenario => Boolean(scenario.transferPrompt)) ? 15 : 0) + (ready ? 10 : 0));
  return { courseId: course.id, title: course.title, scenarios: pack.scenarios.length, frames, decisions, ready, score };
}

export function summariseVideoDecisionPhase26(courses: Course[]) {
  const reports = courses.map(auditVideoDecisionPhase26);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalScenarios: reports.reduce((sum, report) => sum + report.scenarios, 0),
    totalFrames: reports.reduce((sum, report) => sum + report.frames, 0),
    totalDecisions: reports.reduce((sum, report) => sum + report.decisions, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
