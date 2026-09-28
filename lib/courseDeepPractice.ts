import type { Course, Module } from "./data";

type CourseBoost = {
  visual: Extract<Module, { type: "visual" }>;
  activity: Extract<Module, { type: "activity" }>;
};

const boosts: Record<string, CourseBoost> = {
  "rosenshine-principles": {
    visual: {
      id: "deep-practice-rosenshine-cycle",
      type: "visual",
      title: "Rosenshine as a responsive teaching cycle",
      layout: "cycle",
      caption: "Use the principles as connected professional decisions rather than a fixed ten-step lesson script.",
      items: [
        { heading: "Activate", text: "Retrieve the prerequisite knowledge pupils need for the new learning.", icon: "1" },
        { heading: "Explain + model", text: "Make unfamiliar content and expert decision-making visible in manageable steps.", icon: "2" },
        { heading: "Elicit", text: "Use questions and short checks to make pupil thinking visible across the class.", icon: "3" },
        { heading: "Respond", text: "Re-model, prompt, scaffold or move on according to the evidence you gathered.", icon: "4" },
        { heading: "Release", text: "Fade support as success becomes more secure and move towards independent practice.", icon: "5" },
        { heading: "Revisit", text: "Return to important learning after a delay so it remains accessible and usable.", icon: "6" },
      ],
    },
    activity: {
      id: "deep-practice-rosenshine-rehearsal",
      type: "activity",
      title: "Rehearse one difficult teaching sequence",
      prompt: "Build a short teach-check-respond sequence for something pupils often find difficult in your subject.",
      instructions: [
        "Name the precise prerequisite knowledge pupils need.",
        "Write one concise model or worked example and identify the expert decision you will make visible.",
        "Create one whole-class check that could expose a likely misconception.",
        "Write what you will do if most pupils are secure, if roughly half are secure, and if very few are secure.",
        "State what support you will fade first once pupils show readiness.",
      ],
      placeholder: "Topic / prerequisite / model / check / response if secure / response if mixed / response if insecure / support to fade…",
      minimumCharacters: 240,
    },
  },
  "maslow-needs": {
    visual: {
      id: "deep-practice-maslow-evidence-lens",
      type: "visual",
      title: "From observation to responsible support",
      layout: "flow",
      caption: "Maslow can prompt curiosity about classroom conditions, but evidence and school systems should guide decisions about individual pupils.",
      items: [
        { heading: "Observe", text: "Describe what you can actually see or hear without assigning a cause.", icon: "1" },
        { heading: "Consider barriers", text: "Ask whether safety, belonging, clarity, access or confidence could be affecting participation.", icon: "2" },
        { heading: "Check evidence", text: "Use pupil voice, existing plans, colleagues and appropriate school information rather than assumption.", icon: "3" },
        { heading: "Adjust", text: "Make a proportionate classroom change while keeping learning expectations appropriately ambitious.", icon: "4" },
        { heading: "Escalate when needed", text: "Use pastoral, SEND, medical or safeguarding systems where the concern sits beyond normal classroom adjustment.", icon: "5" },
      ],
    },
    activity: {
      id: "deep-practice-maslow-case-analysis",
      type: "activity",
      title: "Separate observation from assumption",
      prompt: "Use a fictional or fully anonymised classroom situation to practise cautious professional reasoning.",
      instructions: [
        "Write only the observable behaviour or classroom difficulty first.",
        "List two or three possible barriers without deciding that any one of them is the cause.",
        "Identify what additional evidence or school information would help.",
        "Choose one low-risk classroom adjustment that preserves ambition.",
        "State the point at which you would involve an appropriate pastoral, SEND or safeguarding route.",
      ],
      placeholder: "Observation…\nPossible barriers…\nEvidence needed…\nClassroom adjustment…\nWhen I would involve another school system…",
      minimumCharacters: 220,
    },
  },
  "effective-questioning": {
    visual: {
      id: "deep-practice-questioning-decision-loop",
      type: "visual",
      title: "Questioning as a decision loop",
      layout: "cycle",
      caption: "The purpose of a question is not simply participation; it is to reveal thinking and improve the teacher's next decision.",
      items: [
        { heading: "Plan", text: "Choose a question that reveals something important about the learning goal.", icon: "1" },
        { heading: "Think", text: "Give enough processing time for pupils to construct an answer.", icon: "2" },
        { heading: "Sample", text: "Collect responses broadly rather than relying on volunteers or one confident pupil.", icon: "3" },
        { heading: "Interpret", text: "Look for the pattern: secure understanding, misconception, guessing or partial knowledge.", icon: "4" },
        { heading: "Respond", text: "Move on, probe, re-model or adapt the task according to what the responses show.", icon: "5" },
      ],
    },
    activity: {
      id: "deep-practice-questioning-hinge-builder",
      type: "activity",
      title: "Build a hinge question",
      prompt: "Design one question that could genuinely change what you do next in a lesson.",
      instructions: [
        "Name the concept or decision the question is testing.",
        "Write one correct answer and at least three plausible wrong answers linked to real misconceptions.",
        "Decide how every pupil will respond at the same time.",
        "Write your response to three possible class patterns: mostly correct, mixed, mostly incorrect.",
      ],
      placeholder: "Concept…\nQuestion…\nCorrect answer…\nMisconception answers…\nWhole-class response method…\nIf mostly correct…\nIf mixed…\nIf mostly incorrect…",
      minimumCharacters: 220,
    },
  },
  "retrieval-practice": {
    visual: {
      id: "deep-practice-retrieval-design",
      type: "visual",
      title: "Design retrieval for durable learning",
      layout: "flow",
      caption: "Retrieval is strongest when it deliberately reconnects important curriculum knowledge over time and is followed by useful feedback.",
      items: [
        { heading: "Select", text: "Choose knowledge pupils will need again, not trivia that is easy to quiz.", icon: "1" },
        { heading: "Retrieve", text: "Ask pupils to bring the knowledge to mind before showing the answer.", icon: "2" },
        { heading: "Mix", text: "Combine recent learning with carefully chosen older material where useful.", icon: "3" },
        { heading: "Correct", text: "Give feedback so inaccurate retrieval is not repeatedly rehearsed.", icon: "4" },
        { heading: "Return", text: "Schedule another retrieval opportunity after a meaningful delay.", icon: "5" },
      ],
    },
    activity: {
      id: "deep-practice-retrieval-calendar",
      type: "activity",
      title: "Build a four-week retrieval thread",
      prompt: "Choose one important strand of curriculum knowledge and plan how pupils will retrieve it repeatedly without turning every lesson into a test.",
      instructions: [
        "List five to eight important items pupils should retain.",
        "Create one short retrieval prompt for each item.",
        "Place the prompts across four weeks with increasing spacing where appropriate.",
        "Plan how answers will be checked and corrected quickly.",
        "Add one transfer question that asks pupils to use the knowledge in a different context.",
      ],
      placeholder: "Knowledge to retain…\nWeek 1…\nWeek 2…\nWeek 3…\nWeek 4…\nFeedback routine…\nTransfer question…",
      minimumCharacters: 220,
    },
  },
  "adaptive-teaching": {
    visual: {
      id: "deep-practice-adaptive-route",
      type: "visual",
      title: "Keep the goal, adapt the route",
      layout: "flow",
      caption: "Adaptive teaching responds to evidence while protecting the core learning goal wherever that remains appropriate.",
      items: [
        { heading: "Shared goal", text: "Be clear about the essential learning all pupils are working towards.", icon: "1" },
        { heading: "Notice the barrier", text: "Identify what is preventing access: prior knowledge, vocabulary, representation, memory load or task structure.", icon: "2" },
        { heading: "Choose support", text: "Add the smallest useful scaffold, model, prompt or representation that addresses that barrier.", icon: "3" },
        { heading: "Check access", text: "Gather evidence that the adjustment is helping pupils do more of the intended thinking.", icon: "4" },
        { heading: "Fade or refine", text: "Remove support as independence grows, or alter it if the evidence shows the barrier remains.", icon: "5" },
      ],
    },
    activity: {
      id: "deep-practice-adaptive-scaffold-audit",
      type: "activity",
      title: "Audit one scaffold before you use it",
      prompt: "Take one scaffold you regularly use and decide whether it improves access or accidentally removes too much thinking.",
      instructions: [
        "State the original learning goal.",
        "Name the specific barrier the scaffold is intended to address.",
        "Identify the thinking pupils must still do for themselves.",
        "Write the evidence that would show the scaffold is helping.",
        "Describe how and when you could fade the scaffold.",
      ],
      placeholder: "Learning goal…\nBarrier…\nScaffold…\nThinking pupils still do…\nEvidence of impact…\nFade when…",
      minimumCharacters: 200,
    },
  },
};

export function addCourseDeepPractice(course: Course): Course {
  const boost = boosts[course.id];
  if (!boost) return course;

  const existing = new Set(course.modules.map(module => module.id));
  const additions = [boost.visual, boost.activity].filter(module => !existing.has(module.id));
  if (!additions.length) return course;

  const modules = [...course.modules];
  const visualPosition = Math.min(modules.length, Math.max(2, Math.floor(modules.length * 0.42)));
  if (!existing.has(boost.visual.id)) modules.splice(visualPosition, 0, boost.visual);

  if (!existing.has(boost.activity.id)) {
    const activityPosition = Math.min(modules.length, Math.max(visualPosition + 2, Math.floor(modules.length * 0.78)));
    modules.splice(activityPosition, 0, boost.activity);
  }

  return { ...course, modules };
}
