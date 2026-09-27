import type { Course, Module } from "./data";

const flagshipIds = new Set([
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

function facilitatorGuide(course: Course): Module {
  const firstScenario = course.modules.find(module => module.type === "scenario");
  const scenarioPrompt = firstScenario?.type === "scenario" ? firstScenario.prompt : `What would strong implementation of ${course.title} look like in our setting?`;
  return {
    id: `fac-guide-${course.id}`,
    type: "content",
    title: "Facilitator pack: run this CPD with a team",
    body: `This course can be delivered flexibly without turning it into a lecture. Use the full course for individual study, or select the materials below for a department meeting, coaching session or INSET block. Keep the discussion anchored to the course objectives and a real implementation problem rather than trying to cover every slide or module.`,
    keyPoints: [
      `15-minute huddle: one visual → one question → one practical commitment.`,
      `30-minute department session: baseline question → key visual → scenario → paired discussion → implementation action.`,
      `60-minute workshop: baseline → two content chunks → scenario → rehearsal/activity → evidence plan → exit reflection.`,
      `90-minute/full INSET: use the complete course plus subject/phase examples, team planning, rehearsal and follow-up scheduling.`,
      `Core discussion scenario: ${scenarioPrompt}`,
      "Do not use confidential pupil/staff details in group examples; use anonymised or hypothetical scenarios.",
    ],
  };
}

function facilitatorActivity(course: Course): Module {
  return {
    id: `fac-plan-${course.id}`,
    type: "activity",
    title: "Build a department / INSET session plan",
    prompt: `Create a short facilitated session using ${course.title}.`,
    instructions: [
      "Choose the session length: 15, 30, 60 or 90 minutes.",
      "Write one outcome staff should leave able to explain, decide or do.",
      "Choose one visual or model from the course as the shared explanation.",
      "Choose one scenario or practice task that requires active professional thinking.",
      "Add one subject-, phase- or role-specific example relevant to the audience.",
      "Finish with one implementation commitment and one date/event for follow-up.",
      "State what evidence will be reviewed without creating unnecessary workload or staff ranking.",
    ],
    placeholder: "Length…\nAudience…\nOutcome…\nVisual/model…\nScenario/practice…\nContext example…\nImplementation action…\nFollow-up…\nEvidence…",
    minimumCharacters: 220,
  };
}

export function addFlagshipFacilitatorPack(course: Course): Course {
  if (!flagshipIds.has(course.id)) return course;
  if (course.modules.some(module => module.id === `fac-guide-${course.id}`)) return course;
  return { ...course, modules: [...course.modules, facilitatorGuide(course), facilitatorActivity(course)] };
}
