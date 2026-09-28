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

function buildDecisionScenario(course: Course): Extract<Module, { type: "scenario" }> {
  const focus = course.objectives[0] || course.summary;
  const variants: Record<Course["category"], { prompt: string; best: string; developing: string; weak: string; bestFeedback: string }> = {
    "Teaching & Learning": {
      prompt: `You are trying to apply ${focus.toLowerCase()} in a lesson, but the evidence from pupils is mixed. What is the strongest next move?`,
      best: "Use the evidence to make one focused adjustment, then check understanding again",
      developing: "Continue exactly as planned because changing course may waste time",
      weak: "Change several things at once without checking which problem you are solving",
      bestFeedback: "Strong teaching decisions use evidence, make a proportionate adjustment and then check whether it helped.",
    },
    Safeguarding: {
      prompt: `A situation raises a concern connected to ${focus.toLowerCase()}. You are not certain what has happened. What is the strongest professional response?`,
      best: "Use the course guidance and the school's agreed procedure promptly, staying within your role and seeking the appropriate safeguarding lead or advice",
      developing: "Wait until you can prove exactly what happened before sharing the concern",
      weak: "Investigate independently before using the school's procedure",
      bestFeedback: "Safeguarding practice should be prompt, proportionate and routed through the school's current procedures rather than delayed for proof or investigated independently.",
    },
    SEND: {
      prompt: `A pupil is finding part of the learning difficult and the issue may relate to ${focus.toLowerCase()}. What is the strongest first response?`,
      best: "Identify the specific barrier, use available pupil information and make a proportionate adjustment while keeping the intended learning appropriately ambitious",
      developing: "Assume the pupil's diagnosis tells you exactly which support will work",
      weak: "Lower the learning goal immediately without first identifying the barrier",
      bestFeedback: "Inclusive practice responds to the actual barrier and pupil-specific information rather than stereotypes or automatic reduction of challenge.",
    },
    Leadership: {
      prompt: `A team is implementing work connected to ${focus.toLowerCase()} inconsistently. What is the strongest leadership response?`,
      best: "Clarify the agreed practice, diagnose the barriers, provide focused support and review implementation evidence",
      developing: "Add another initiative so staff understand the issue is important",
      weak: "Assume inconsistency means staff are unwilling and move straight to judgement",
      bestFeedback: "Effective implementation combines clarity, diagnosis, support and follow-up rather than adding complexity or jumping to conclusions.",
    },
    Wellbeing: {
      prompt: `A recurring work pattern linked to ${focus.toLowerCase()} is creating unnecessary pressure. What is the strongest response?`,
      best: "Identify the controllable cause, test a practical system change and review whether it reduces pressure without weakening the work",
      developing: "Tell individuals to become more resilient without changing the system",
      weak: "Remove an important responsibility without considering consequences or alternatives",
      bestFeedback: "Sustainable wellbeing work looks for practical system changes while protecting important professional responsibilities.",
    },
    "Digital Teaching": {
      prompt: `You want to use a digital approach connected to ${focus.toLowerCase()}. What is the strongest professional starting point?`,
      best: "Check purpose, privacy, accuracy, safeguarding and school expectations before using the tool, then review the output",
      developing: "Use the tool first and check policy only if a problem appears",
      weak: "Assume a polished output is reliable and appropriate without verification",
      bestFeedback: "Digital tools should support professional judgement, not bypass privacy, safeguarding, accuracy or school governance checks.",
    },
  };
  const v = variants[course.category];
  return {
    id: `presentation-${safeId(course.id)}-decision`,
    type: "scenario",
    title: "Decision point: what would you do?",
    prompt: v.prompt,
    options: [
      { label: v.developing, feedback: "This response misses part of the evidence, procedure or implementation discipline emphasised in the course." },
      { label: v.best, feedback: v.bestFeedback },
      { label: v.weak, feedback: "This response risks acting too quickly, too broadly or outside the role and evidence available." },
    ],
  };
}

function buildKnowledgeCheck(course: Course): Extract<Module, { type: "quiz" }> {
  const objective = course.objectives[0] || "apply the course appropriately";
  return {
    id: `presentation-${safeId(course.id)}-knowledge`,
    type: "quiz",
    title: "Knowledge checkpoint",
    question: `Which approach best reflects secure understanding of ${course.title}?`,
    options: [
      "Use the headline idea as a fixed rule in every situation",
      `Use the course principles to ${objective.toLowerCase()}, while checking context, evidence and relevant school procedures`,
      "Rely on personal preference even when the course or school procedure points elsewhere",
      "Wait until the end of the year before reviewing whether the approach worked",
    ],
    answer: 1,
    feedback: "Secure professional learning means understanding the principle, applying it to context and checking impact rather than using a slogan mechanically.",
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

  if (!existingTypes.has("scenario")) {
    const scenario = buildDecisionScenario(course);
    if (!existingIds.has(scenario.id)) {
      const mapIndex = modules.findIndex(module => module.id === map.id);
      modules.splice(mapIndex >= 0 ? mapIndex + 1 : Math.min(2, modules.length), 0, scenario);
      addedMinutes += 6;
    }
  }

  if (!existingTypes.has("quiz")) {
    const quiz = buildKnowledgeCheck(course);
    if (!existingIds.has(quiz.id)) {
      modules.splice(findInsertBeforeReflection(modules), 0, quiz);
      addedMinutes += 5;
    }
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
