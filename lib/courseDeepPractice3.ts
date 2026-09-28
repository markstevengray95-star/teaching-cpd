import type { Course, Module } from "./data";

type Boost = {
  visual: Extract<Module, { type: "visual" }>;
  activity: Extract<Module, { type: "activity" }>;
};

const boosts: Record<string, Boost> = {
  "worked-examples-and-modelling": {
    visual: {
      id: "deep3-modelling-fade-cycle",
      type: "visual",
      title: "Model, practise, fade",
      layout: "flow",
      caption: "Strong modelling makes expert decisions visible, then deliberately transfers more of the thinking to pupils.",
      items: [
        { heading: "Name the goal", text: "Be clear about the process, concept or quality pupils are learning to produce.", icon: "1" },
        { heading: "Expose decisions", text: "Model the choices, checks and reasoning an expert makes rather than only displaying a finished answer.", icon: "2" },
        { heading: "Pause for pupils", text: "Ask pupils to predict, explain or complete parts of the model so they process the reasoning actively.", icon: "3" },
        { heading: "Guided attempt", text: "Move to a similar task while prompts, examples or teacher feedback remain available.", icon: "4" },
        { heading: "Fade support", text: "Remove parts of the scaffold only when checks show pupils can carry more of the process themselves.", icon: "5" },
      ],
    },
    activity: {
      id: "deep3-modelling-script",
      type: "activity",
      title: "Script a think-aloud that teaches decisions",
      prompt: "Choose one process pupils often copy without understanding and plan a concise model that reveals the important thinking.",
      instructions: [
        "State the task and the expert decision pupils usually miss.",
        "Write the first modelled step and the sentence you will say aloud to explain the decision.",
        "Add one pause where pupils predict or explain the next move.",
        "Design one partially completed follow-up example for guided practice.",
        "State the evidence that would make you remove another layer of support.",
      ],
      placeholder: "Task…\nHidden expert decision…\nThink-aloud line…\nPupil prediction point…\nGuided example…\nFade support when…",
      minimumCharacters: 220,
    },
  },
  "checking-for-understanding": {
    visual: {
      id: "deep3-cfu-evidence-loop",
      type: "visual",
      title: "Checking for understanding: evidence before moving on",
      layout: "cycle",
      caption: "A check is useful when it reduces uncertainty about pupil understanding and changes the next teaching move.",
      items: [
        { heading: "Target", text: "Choose one important idea or misconception you need evidence about.", icon: "1" },
        { heading: "Elicit", text: "Use a question or short task that makes every pupil commit to an observable response where possible.", icon: "2" },
        { heading: "Scan", text: "Look for the distribution of responses across the class rather than one confident answer.", icon: "3" },
        { heading: "Interpret", text: "Decide whether the pattern shows secure understanding, partial knowledge or a shared misconception.", icon: "4" },
        { heading: "Respond", text: "Move on, probe, contrast, re-model or add practice based on the evidence.", icon: "5" },
        { heading: "Recheck", text: "Use a second brief check to confirm whether the teaching response resolved the difficulty.", icon: "6" },
      ],
    },
    activity: {
      id: "deep3-cfu-hinge-lab",
      type: "activity",
      title: "Build and stress-test a hinge question",
      prompt: "Create one decision-point question that you could actually use to decide whether a class is ready to move on.",
      instructions: [
        "Write the concept the hinge question is intended to diagnose.",
        "Create one correct answer and at least three distractors tied to plausible misconceptions.",
        "Choose how every pupil will respond within about a minute.",
        "Set your action threshold for mostly correct, mixed and mostly incorrect responses.",
        "Write a second check that would confirm your response worked.",
      ],
      placeholder: "Concept…\nQuestion…\nCorrect answer…\nDistractors and misconceptions…\nResponse method…\nIf mostly correct…\nIf mixed…\nIf mostly incorrect…\nRecheck…",
      minimumCharacters: 230,
    },
  },
  "effective-explanations": {
    visual: {
      id: "deep3-explanation-architecture",
      type: "visual",
      title: "Architecture of a clear explanation",
      layout: "flow",
      caption: "Clear explanations foreground the essential relationship, connect to relevant prior knowledge and use examples deliberately.",
      items: [
        { heading: "Destination", text: "Decide what pupils should understand or be able to explain when the explanation ends.", icon: "1" },
        { heading: "Prior knowledge", text: "Activate only the prerequisite knowledge that helps pupils interpret the new idea.", icon: "2" },
        { heading: "Core idea", text: "State the essential relationship before adding detail, exceptions or enrichment.", icon: "3" },
        { heading: "Representation", text: "Choose an example, diagram, demonstration or analogy that exposes the structure rather than decorating it.", icon: "4" },
        { heading: "Boundary", text: "Use a contrast or non-example where pupils are likely to overgeneralise the idea.", icon: "5" },
        { heading: "Check", text: "Ask pupils to use the idea so you can see whether the explanation produced the intended understanding.", icon: "6" },
      ],
    },
    activity: {
      id: "deep3-explanation-redesign",
      type: "activity",
      title: "Redesign an explanation in six moves",
      prompt: "Take one explanation you give often and rebuild it so each part has a clear instructional purpose.",
      instructions: [
        "Write the one-sentence understanding pupils should leave with.",
        "List the minimum prior knowledge they need.",
        "Choose one strong example or representation and explain why it helps.",
        "Add one non-example or contrast that reveals the concept boundary.",
        "Remove one detail that is interesting but not essential at this point.",
        "Write an immediate check that requires application rather than repetition of the definition.",
      ],
      placeholder: "Intended understanding…\nPrior knowledge…\nExample/representation…\nContrast/non-example…\nDetail to remove…\nImmediate application check…",
      minimumCharacters: 230,
    },
  },
  "memory-study-strategies": {
    visual: {
      id: "deep3-study-strategy-loop",
      type: "visual",
      title: "Study for access, not familiarity",
      layout: "cycle",
      caption: "Effective study repeatedly asks pupils to retrieve, check, space and apply important knowledge rather than simply make it look familiar.",
      items: [
        { heading: "Select", text: "Choose important knowledge and processes with future curriculum or assessment value.", icon: "1" },
        { heading: "Retrieve", text: "Attempt to recall, explain or use the knowledge before looking at the answer.", icon: "2" },
        { heading: "Check", text: "Compare with a reliable source and correct errors rather than rehearsing them.", icon: "3" },
        { heading: "Space", text: "Return after a delay so retrieval requires reconstruction rather than immediate repetition.", icon: "4" },
        { heading: "Mix", text: "Combine related material when pupils are ready to practise choosing between ideas or methods.", icon: "5" },
        { heading: "Apply", text: "Use the knowledge in a new question, explanation or context to test whether it is genuinely accessible.", icon: "6" },
      ],
    },
    activity: {
      id: "deep3-study-plan-rebuild",
      type: "activity",
      title: "Convert a weak revision plan into a durable one",
      prompt: "Take a typical revision plan built around rereading or long blocks and redesign it around retrieval, spacing and feedback.",
      instructions: [
        "Choose one topic and list five to eight items that genuinely need to be retrievable.",
        "Write short retrieval prompts for the first study session.",
        "Schedule at least three later returns with increasing gaps.",
        "Add a correction routine for forgotten or inaccurate answers.",
        "Include one mixed or application task that requires pupils to choose and use the knowledge rather than simply recognise it.",
      ],
      placeholder: "Topic…\nKnowledge to retrieve…\nSession 1…\nLater return 1…\nLater return 2…\nLater return 3…\nCorrection routine…\nApplication task…",
      minimumCharacters: 230,
    },
  },
};

export function addCourseDeepPractice3(course: Course): Course {
  const boost = boosts[course.id];
  if (!boost) return course;
  const existing = new Set(course.modules.map(module => module.id));
  const modules = [...course.modules];

  if (!existing.has(boost.visual.id)) {
    const position = Math.min(modules.length, Math.max(2, Math.floor(modules.length * 0.48)));
    modules.splice(position, 0, boost.visual);
  }

  if (!existing.has(boost.activity.id)) {
    const position = Math.min(modules.length, Math.max(3, Math.floor(modules.length * 0.84)));
    modules.splice(position, 0, boost.activity);
  }

  return { ...course, modules };
}
