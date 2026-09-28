import type { Course, Module } from "./data";

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function buildCourseMap(course: Course): Extract<Module, { type: "visual" }> {
  const objectives = course.objectives.slice(0, 6);
  return {
    id: `presentation-${safeId(course.id)}-map`,
    type: "visual",
    title: "Your learning journey",
    layout: "flow",
    caption: `Work through ${course.title} one section at a time. Each stage builds towards confident application rather than passive completion.`,
    items: objectives.map((objective, index) => ({
      heading: `Stage ${index + 1}`,
      text: objective,
      icon: String(index + 1),
    })),
  };
}

function buildPractice(course: Course): Extract<Module, { type: "activity" }> {
  const objectives = course.objectives.slice(0, 4);
  const focus = objectives[0] || course.summary;
  const categoryPrompt: Record<Course["category"], string> = {
    "Teaching & Learning": "Use an upcoming lesson, class routine or piece of teaching as your practice context.",
    Safeguarding: "Use a fictional or fully anonymised professional situation. Do not enter pupil-identifiable or confidential safeguarding information.",
    SEND: "Use an upcoming lesson or classroom routine and focus on removing a specific barrier without making assumptions about an individual pupil.",
    Leadership: "Use a real team routine or improvement priority, but avoid entering sensitive staff information.",
    Wellbeing: "Use a recurring work routine or team process and focus on a practical, proportionate change.",
    "Digital Teaching": "Use a realistic professional task and include the checks needed for privacy, accuracy, safety and professional judgement.",
  };
  return {
    id: `presentation-${safeId(course.id)}-practice`,
    type: "activity",
    title: "Practice studio: turn the idea into action",
    prompt: `${categoryPrompt[course.category]} Your main focus is: ${focus}`,
    instructions: [
      `Choose one course objective to practise: ${objectives.join(" | ") || course.summary}`,
      "Describe the specific context in which you will use it.",
      "Write the action or professional decision you would make.",
      "Identify one likely difficulty, misconception, barrier or implementation risk.",
      "State what evidence would tell you whether your response was effective.",
      "Write what you would keep, adapt or stop after reviewing that evidence.",
    ],
    placeholder: "Context…\nCourse idea…\nAction or decision…\nLikely difficulty/barrier…\nEvidence…\nWhat I would keep/adapt/stop…",
    minimumCharacters: 180,
  };
}

function buildImplementationCheck(course: Course): Extract<Module, { type: "checklist" }> {
  const objectiveChecks = course.objectives.slice(0, 5).map(objective => `I can explain or apply: ${objective}`);
  return {
    id: `presentation-${safeId(course.id)}-check`,
    type: "checklist",
    title: "Ready to apply this course?",
    prompt: "Use this check before moving into the final review. The aim is confident, responsible application rather than simply reaching the end of the slides.",
    items: [
      ...objectiveChecks,
      "I can identify at least one realistic situation where this learning is useful",
      "I know what evidence I would use to judge whether the approach is working",
      "I know when I would need to seek advice, use school policy or involve an appropriate colleague rather than act alone",
    ],
    completionText: `${course.title} implementation readiness check complete.`,
  };
}

function findInsertBeforeReflection(modules: Module[]) {
  const lastReflection = modules.map(module => module.type).lastIndexOf("reflection");
  return lastReflection >= 0 ? lastReflection : modules.length;
}

export function structureCourseAsPresentation(course: Course): Course {
  const existingIds = new Set(course.modules.map(module => module.id));
  const existingTypes = new Set(course.modules.map(module => module.type));
  const modules = [...course.modules];
  let addedMinutes = 0;

  const map = buildCourseMap(course);
  if (!existingIds.has(map.id)) {
    const firstContent = modules.findIndex(module => module.type === "content");
    const insertAt = firstContent >= 0 ? Math.min(firstContent + 1, modules.length) : 0;
    modules.splice(insertAt, 0, map);
    addedMinutes += 6;
  }

  if (!existingTypes.has("activity")) {
    const activity = buildPractice(course);
    if (!existingIds.has(activity.id)) {
      modules.splice(findInsertBeforeReflection(modules), 0, activity);
      addedMinutes += 10;
    }
  }

  if (!existingTypes.has("checklist")) {
    const checklist = buildImplementationCheck(course);
    if (!existingIds.has(checklist.id)) {
      modules.splice(findInsertBeforeReflection(modules), 0, checklist);
      addedMinutes += 6;
    }
  }

  return {
    ...course,
    duration: course.duration + addedMinutes,
    modules,
  };
}
