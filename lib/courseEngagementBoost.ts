import type { Course, Module } from "./data";

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function buildQuickDecision(course: Course): Extract<Module, { type: "scenario" }> {
  const focus = course.objectives[1] || course.objectives[0] || course.summary;
  const variants: Record<Course["category"], { prompt: string; options: { label: string; feedback: string }[] }> = {
    "Teaching & Learning": {
      prompt: `30-second challenge: you want to improve ${focus.toLowerCase()}, but pupils respond differently from what you expected. What would you do first?`,
      options: [
        { label: "Pause, gather a little more evidence, make one focused adjustment and check again", feedback: "Strong choice. This keeps the response evidence-led and makes it easier to judge whether the adjustment helped." },
        { label: "Change several routines at once so something is likely to work", feedback: "Too many simultaneous changes make it hard to know what actually helped." },
        { label: "Ignore the evidence and complete the original plan exactly as written", feedback: "Plans matter, but responsive teaching uses evidence from pupils to decide what happens next." },
      ],
    },
    Safeguarding: {
      prompt: `30-second challenge: a concern relates to ${focus.toLowerCase()}, but you are unsure how serious it is. What is the safest professional next step?`,
      options: [
        { label: "Use the school's safeguarding route promptly and seek DSL/deputy advice while staying within your role", feedback: "Correct direction. Staff should share concerns promptly through the authorised safeguarding system rather than waiting for certainty." },
        { label: "Wait for stronger evidence before telling anyone", feedback: "Safeguarding concerns do not need to be proved before they are shared through the proper route." },
        { label: "Investigate the concern yourself before reporting it", feedback: "Ordinary staff should not run their own safeguarding investigation." },
      ],
    },
    SEND: {
      prompt: `30-second challenge: a learner is struggling with something connected to ${focus.toLowerCase()}. Which response best keeps support individual and ambitious?`,
      options: [
        { label: "Identify the precise barrier, use pupil-specific information and adapt the route while keeping the learning goal appropriately ambitious", feedback: "Good choice. Effective adaptive practice responds to the actual barrier rather than assumptions about a label." },
        { label: "Use the same adjustment for every pupil with the same diagnosis", feedback: "A diagnosis does not tell you exactly what support an individual learner needs in every context." },
        { label: "Reduce the learning goal immediately", feedback: "Support should first remove barriers to access before unnecessarily lowering ambition." },
      ],
    },
    Leadership: {
      prompt: `30-second challenge: your team is inconsistent in an area linked to ${focus.toLowerCase()}. What is the strongest first move?`,
      options: [
        { label: "Clarify the expected practice, find out what is getting in the way, support rehearsal and then review evidence", feedback: "Strong implementation combines clarity, diagnosis, support and follow-up." },
        { label: "Launch another initiative so the team sees the issue is important", feedback: "Adding more change can increase overload without fixing the implementation barrier." },
        { label: "Assume inconsistency means a lack of commitment", feedback: "Effective leadership diagnoses barriers before making judgements about motive." },
      ],
    },
    Wellbeing: {
      prompt: `30-second challenge: a recurring process connected to ${focus.toLowerCase()} is creating avoidable pressure. What should happen first?`,
      options: [
        { label: "Identify the controllable cause and test one practical system change", feedback: "Good choice. Sustainable improvement starts with the work system rather than adding another personal coping task." },
        { label: "Add another wellbeing activity without changing the process", feedback: "Extra activities may not address the workload or system creating the pressure." },
        { label: "Remove the responsibility entirely without considering its purpose", feedback: "The goal is to reduce avoidable pressure while protecting work that still matters." },
      ],
    },
    "Digital Teaching": {
      prompt: `30-second challenge: you are about to use a digital tool for ${focus.toLowerCase()}. What should you check before committing to it?`,
      options: [
        { label: "Purpose, privacy, safeguarding, accuracy, accessibility and the school's expectations", feedback: "Strong choice. Useful technology still needs professional checking and appropriate governance." },
        { label: "Only whether the tool looks polished and saves time", feedback: "Ease and appearance are not enough to establish that a tool is safe or educationally appropriate." },
        { label: "Nothing if another teacher has already used it", feedback: "Professional responsibility still includes checking suitability for your context." },
      ],
    },
  };
  const v = variants[course.category];
  return {
    id: `engagement-${safeId(course.id)}-quick-decision`,
    type: "scenario",
    title: "30-second decision challenge",
    prompt: v.prompt,
    options: v.options,
  };
}

function buildPredictionCheck(course: Course): Extract<Module, { type: "quiz" }> {
  const objective = course.objectives[course.objectives.length > 2 ? 2 : 0] || course.summary;
  return {
    id: `engagement-${safeId(course.id)}-prediction`,
    type: "quiz",
    title: "Predict before you reveal",
    question: `Which response is most likely to show that someone can genuinely apply this course idea: ${objective}?`,
    options: [
      "Repeat the headline phrase from the course",
      "Apply the idea exactly the same way in every context",
      "Explain the reasoning, adapt it to the situation and identify evidence that would show whether it worked",
      "Wait until the end of the year before deciding whether anything changed",
    ],
    answer: 2,
    feedback: "Application is stronger than recall alone: secure professional learning combines reasoning, context and evidence of impact.",
  };
}

export function boostCourseEngagement(course: Course): Course {
  const modules = [...course.modules];
  const ids = new Set(modules.map(module => module.id));
  const scenarioCount = modules.filter(module => module.type === "scenario").length;
  const quizCount = modules.filter(module => module.type === "quiz").length;
  const interactiveCount = modules.filter(module => ["scenario", "quiz", "activity", "checklist"].includes(module.type)).length;
  let addedMinutes = 0;

  if (interactiveCount < 6 && scenarioCount < 2) {
    const challenge = buildQuickDecision(course);
    if (!ids.has(challenge.id)) {
      const insertAt = Math.max(2, Math.min(modules.length - 1, Math.round(modules.length * 0.42)));
      modules.splice(insertAt, 0, challenge);
      ids.add(challenge.id);
      addedMinutes += 4;
    }
  }

  if (interactiveCount < 6 && quizCount < 2) {
    const prediction = buildPredictionCheck(course);
    if (!ids.has(prediction.id)) {
      const insertAt = Math.max(3, Math.min(modules.length - 1, Math.round(modules.length * 0.68)));
      modules.splice(insertAt, 0, prediction);
      addedMinutes += 4;
    }
  }

  return {
    ...course,
    duration: course.duration + addedMinutes,
    modules,
  };
}
