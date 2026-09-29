import type { Course, Module } from "./data";

const PREFIX = "phase3-present-";

type VisualModule = Extract<Module, { type: "visual" }>;

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function findFirstScenario(course: Course) {
  return course.modules.find((module): module is Extract<Module, { type: "scenario" }> => module.type === "scenario");
}

function findFirstQuiz(course: Course) {
  return course.modules.find((module): module is Extract<Module, { type: "quiz" }> => module.type === "quiz");
}

function openingHook(course: Course): VisualModule {
  const scenario = findFirstScenario(course);
  const quiz = findFirstQuiz(course);
  const challenge = scenario?.prompt || quiz?.question || course.summary;
  return {
    id: `${PREFIX}${safeId(course.id)}-hook`,
    type: "visual",
    title: "Opening challenge: what would good practice look like?",
    layout: "flow",
    caption: challenge,
    items: [
      { heading: "Notice", text: "What evidence, barrier, behaviour or professional problem is actually visible before you act?", icon: "1" },
      { heading: "Interpret", text: `Which principle from ${course.title} is most relevant, and what assumptions still need checking?`, icon: "2" },
      { heading: "Act", text: "Choose one proportionate response that protects the intended learning, safety or professional outcome.", icon: "3" },
      { heading: "Review", text: "Decide what evidence would make you keep, adapt, fade or stop the response.", icon: "4" },
    ],
  };
}

function sectionDivider(course: Course, section: "understand" | "practise" | "transfer"): VisualModule {
  const objective = course.objectives[0] || course.summary;
  if (section === "understand") return {
    id: `${PREFIX}${safeId(course.id)}-section-understand`,
    type: "visual",
    title: "Section 1 · Understand the idea before using the technique",
    layout: "compare",
    caption: "The presentation separates professional reasoning from the visible routine so staff understand why an approach works, not just what it looks like.",
    items: [
      { heading: "Core purpose", text: objective, icon: "A" },
      { heading: "Professional lens", text: "Link every technique to the problem it is intended to solve and the evidence that would justify using it.", icon: "B" },
    ],
  };
  if (section === "practise") return {
    id: `${PREFIX}${safeId(course.id)}-section-practise`,
    type: "visual",
    title: "Section 2 · Rehearse the decision, not just the wording",
    layout: "flow",
    caption: "Move from understanding to realistic professional judgement.",
    items: [
      { heading: "Context", text: "Choose a realistic lesson, team, safeguarding, SEND, wellbeing or digital context.", icon: "1" },
      { heading: "Decision", text: "Select the smallest useful professional move and explain why it fits.", icon: "2" },
      { heading: "Evidence", text: "Name what you would look for immediately after the action.", icon: "3" },
    ],
  };
  return {
    id: `${PREFIX}${safeId(course.id)}-section-transfer`,
    type: "visual",
    title: "Section 3 · Transfer the learning into practice",
    layout: "timeline",
    caption: "CPD is only useful when the learning survives beyond the presentation.",
    items: [
      { heading: "Try", text: "Use one specific course principle in a defined context.", icon: "1" },
      { heading: "Notice", text: "Collect a small amount of evidence close to the intended outcome.", icon: "2" },
      { heading: "Review", text: "Decide whether the response should be kept, adapted, faded or stopped.", icon: "3" },
    ],
  };
}

function workedExample(course: Course): VisualModule {
  const scenario = findFirstScenario(course);
  const prompt = scenario?.prompt || course.summary;
  const best = scenario?.options.find(option => !/not|risk|miss|unhelp|weak|outside|avoid|delay|remove/i.test(option.feedback));
  return {
    id: `${PREFIX}${safeId(course.id)}-worked-model`,
    type: "visual",
    title: "Worked example: make the reasoning visible",
    layout: "flow",
    caption: prompt,
    items: [
      { heading: "1 · Define the problem", text: "Describe what is observable and separate evidence from assumptions.", icon: "1" },
      { heading: "2 · Select the principle", text: course.objectives[0] || "Choose the relevant course principle.", icon: "2" },
      { heading: "3 · Model the response", text: best?.label || "Use one proportionate action linked directly to the intended outcome.", icon: "3" },
      { heading: "4 · Check impact", text: "Look for the expected evidence, then change course if the response did not help.", icon: "4" },
    ],
  };
}

function recap(course: Course): VisualModule {
  const objectives = course.objectives.slice(0, 4);
  return {
    id: `${PREFIX}${safeId(course.id)}-recap`,
    type: "visual",
    title: "Course recap: explain it, apply it, review it",
    layout: "ladder",
    caption: "Use this as the final presenter recap before staff make their implementation commitment.",
    items: objectives.map((objective, index) => ({
      heading: `${index + 1} · ${["Explain", "Apply", "Check", "Transfer"][index] || "Review"}`,
      text: objective,
      icon: String(index + 1),
    })),
  };
}

function pacingBreak(course: Course, index: number, previous: Module[]): VisualModule {
  const recent = previous.filter(module => module.type === "content").slice(-3);
  const ideas = recent.map(module => module.title).slice(0, 3);
  return {
    id: `${PREFIX}${safeId(course.id)}-pace-${index}`,
    type: "visual",
    title: "Pause and process: connect the learning",
    layout: "flow",
    caption: "Before adding more information, make the previous ideas usable.",
    items: [
      { heading: "Explain", text: ideas[0] ? `Summarise the main idea from “${ideas[0]}” in one sentence.` : "Summarise the strongest idea so far.", icon: "1" },
      { heading: "Connect", text: ideas[1] ? `Explain how “${ideas[1]}” connects to the course purpose.` : "Connect the idea to the course purpose.", icon: "2" },
      { heading: "Test", text: ideas[2] ? `Give a situation where “${ideas[2]}” would need adapting rather than copying directly.` : "Name a situation where the approach would need adapting.", icon: "3" },
    ],
  };
}

function addPacingBreaks(course: Course, modules: Module[]) {
  const paced: Module[] = [];
  let contentRun = 0;
  let breakNumber = 1;
  modules.forEach(module => {
    if (module.type === "content") {
      if (contentRun >= 3) {
        paced.push(pacingBreak(course, breakNumber++, paced));
        contentRun = 0;
      }
      paced.push(module);
      contentRun += 1;
    } else {
      paced.push(module);
      contentRun = 0;
    }
  });
  return paced;
}

export function enhanceCoursePresentationPhase3(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));
  const mapIndex = modules.findIndex(module => module.id.startsWith("presentation-") && module.id.endsWith("-map"));
  modules.splice(mapIndex >= 0 ? mapIndex + 1 : 0, 0, openingHook(course));

  const baselineIndex = modules.findIndex(module => module.id.includes("-baseline"));
  modules.splice(baselineIndex >= 0 ? baselineIndex + 1 : Math.min(3, modules.length), 0, sectionDivider(course, "understand"));

  const misconceptionsIndex = modules.findIndex(module => module.id.endsWith("-misconceptions") && module.id.startsWith("depth-2026-"));
  modules.splice(misconceptionsIndex >= 0 ? misconceptionsIndex + 1 : Math.min(6, modules.length), 0, workedExample(course));

  const firstPracticeIndex = modules.findIndex(module => module.type === "activity" || module.type === "scenario");
  if (firstPracticeIndex >= 0) modules.splice(firstPracticeIndex, 0, sectionDivider(course, "practise"));

  const commitmentIndex = modules.findIndex(module => module.id.includes("implementation-commitment"));
  const transferAt = commitmentIndex >= 0 ? commitmentIndex : modules.length;
  modules.splice(transferAt, 0, sectionDivider(course, "transfer"), recap(course));

  const pacedModules = addPacingBreaks(course, modules);
  return { ...course, duration: course.duration + 12 + Math.max(0, pacedModules.length - modules.length) * 2, modules: pacedModules };
}

export function validateCoursePresentationPhase3(course: Course) {
  const id = safeId(course.id);
  const required = ["hook", "section-understand", "section-practise", "section-transfer", "worked-model", "recap"]
    .map(suffix => `${PREFIX}${id}-${suffix}`);
  required.forEach(moduleId => {
    if (!course.modules.some(module => module.id === moduleId)) throw new Error(`CPD course ${course.id} is missing Phase 3 presentation module ${moduleId}`);
  });
  if (course.modules[1]?.id !== `${PREFIX}${id}-hook`) throw new Error(`CPD course ${course.id} must open Phase 3 with its presentation hook after the journey map`);
  const visualCount = course.modules.filter(module => module.type === "visual").length;
  if (visualCount < 6) throw new Error(`CPD course ${course.id} needs at least six visual presentation slides in Phase 3`);
  let longestContentRun = 0;
  let current = 0;
  course.modules.forEach(module => {
    current = module.type === "content" ? current + 1 : 0;
    longestContentRun = Math.max(longestContentRun, current);
  });
  if (longestContentRun > 3) throw new Error(`CPD course ${course.id} still contains ${longestContentRun} consecutive text-heavy content slides`);
}

export function auditCoursePresentationPhase3(course: Course) {
  const id = safeId(course.id);
  const phase3Slides = course.modules.filter(module => module.id.startsWith(`${PREFIX}${id}-`)).length;
  const visualSlides = course.modules.filter(module => module.type === "visual").length;
  const interactiveSlides = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  return { courseId: course.id, title: course.title, phase3Slides, visualSlides, interactiveSlides, totalSlides: course.modules.length };
}
