import type { Course, Module } from "./data";

type Boost = {
  visual: Extract<Module, { type: "visual" }>;
  activity: Extract<Module, { type: "activity" }>;
};

const boosts: Record<string, Boost> = {
  "autism-inclusive-classroom": {
    visual: {
      id: "deep2-autism-barrier-cycle",
      type: "visual",
      title: "Autism support: understand the individual barrier",
      layout: "flow",
      caption: "Inclusive practice starts with the individual pupil, the task and the environment rather than assumptions based on a diagnosis.",
      items: [
        { heading: "Know", text: "Use pupil-specific information, plans and trusted communication about what helps this learner.", icon: "1" },
        { heading: "Notice", text: "Identify the precise classroom demand that may be creating difficulty: language, unpredictability, sensory load, transitions or task structure.", icon: "2" },
        { heading: "Clarify", text: "Make routines, instructions, changes and expectations explicit where that improves access.", icon: "3" },
        { heading: "Support", text: "Use proportionate environmental or communication adjustments without automatically lowering the learning goal.", icon: "4" },
        { heading: "Review", text: "Check the pupil's access and independence, then keep, adapt or fade the support with appropriate input.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-autism-routine-redesign",
      type: "activity",
      title: "Redesign one unpredictable routine",
      prompt: "Choose one ordinary classroom routine that could create unnecessary uncertainty and make it more explicit without over-supporting pupils.",
      instructions: [
        "Describe the routine as pupils currently experience it.",
        "Identify the moments that depend on inference, rapid language or unexpected change.",
        "Write a clearer visual, verbal or written cue for those moments.",
        "State which parts of the routine should remain independent.",
        "Name the evidence that would show the adjustment improved access.",
      ],
      placeholder: "Routine…\nPossible barrier…\nClearer cue or structure…\nIndependence pupils keep…\nEvidence to review…",
      minimumCharacters: 220,
    },
  },
  "adhd-classroom-strategies": {
    visual: {
      id: "deep2-adhd-executive-load",
      type: "visual",
      title: "Reduce unnecessary executive-function load",
      layout: "flow",
      caption: "The aim is not to remove challenge; it is to make the task structure clearer so pupils can direct more attention to the learning itself.",
      items: [
        { heading: "Start", text: "Make the first action obvious so pupils do not need to infer how to begin.", icon: "1" },
        { heading: "Chunk", text: "Break long sequences into visible, meaningful steps that can be completed and checked.", icon: "2" },
        { heading: "Externalise", text: "Use checklists, timers, models or visual reminders where working memory would otherwise carry the whole routine.", icon: "3" },
        { heading: "Cue", text: "Use brief, consistent prompts that direct attention back to the task rather than adding more language.", icon: "4" },
        { heading: "Build independence", text: "Teach pupils to use the supports themselves and reduce prompting when they can manage the sequence.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-adhd-task-load-audit",
      type: "activity",
      title: "Audit the executive demands of a task",
      prompt: "Take a real classroom task and separate the intended learning from the organisational demands pupils must manage around it.",
      instructions: [
        "State the learning pupils are meant to practise.",
        "List every organisational demand: remembering steps, switching resources, waiting, copying, tracking time or holding instructions in mind.",
        "Identify which demands are essential to the learning and which are incidental.",
        "Choose one support that reduces an incidental demand.",
        "Write how you will encourage the pupil to use the support independently.",
      ],
      placeholder: "Learning goal…\nExecutive demands…\nEssential demands…\nIncidental demands…\nSupport…\nIndependence plan…",
      minimumCharacters: 220,
    },
  },
  "middle-leadership": {
    visual: {
      id: "deep2-leadership-implementation-loop",
      type: "visual",
      title: "From priority to sustained team practice",
      layout: "cycle",
      caption: "Middle leadership is strongest when monitoring sits inside a support-and-improvement cycle rather than becoming the purpose of the work.",
      items: [
        { heading: "Clarify", text: "Define a small number of priorities and what the agreed practice looks like in observable terms.", icon: "1" },
        { heading: "Enable", text: "Provide the knowledge, examples, resources, time or rehearsal staff need to implement it.", icon: "2" },
        { heading: "Check", text: "Gather proportionate evidence about implementation and barriers rather than simply counting compliance.", icon: "3" },
        { heading: "Support", text: "Respond to the barrier with coaching, modelling, clarification or workload adjustment.", icon: "4" },
        { heading: "Review", text: "Decide what to sustain, simplify, adapt or stop based on evidence and staff experience.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-leadership-priority-map",
      type: "activity",
      title: "Turn a broad priority into an implementable routine",
      prompt: "Choose one current departmental or team priority and reduce it to something staff can understand, practise and review.",
      instructions: [
        "Write the priority in one clear sentence.",
        "Describe the smallest set of observable behaviours that would show it is happening.",
        "List likely barriers for staff.",
        "Choose support for each major barrier before deciding how you will monitor.",
        "Write one review question that would help you decide whether to continue, adapt or stop the approach.",
      ],
      placeholder: "Priority…\nObservable practice…\nLikely barriers…\nSupport…\nMonitoring evidence…\nReview question…",
      minimumCharacters: 240,
    },
  },
  "instructional-coaching": {
    visual: {
      id: "deep2-coaching-rehearsal-cycle",
      type: "visual",
      title: "Instructional coaching: narrow goal to rehearsal",
      layout: "cycle",
      caption: "Coaching becomes practical when a broad development need is translated into one small behaviour that can be modelled, rehearsed and revisited.",
      items: [
        { heading: "Identify", text: "Choose a high-leverage part of practice grounded in evidence from the teacher's context.", icon: "1" },
        { heading: "Specify", text: "Translate the goal into a behaviour that is clear enough to see, model and practise.", icon: "2" },
        { heading: "Model", text: "Show or describe what successful execution looks and sounds like in context.", icon: "3" },
        { heading: "Rehearse", text: "Practise the move away from the pressure of a real lesson and refine it with precise feedback.", icon: "4" },
        { heading: "Use + review", text: "Try it in practice, collect evidence and decide the next small step rather than jumping to a new broad target.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-coaching-step-builder",
      type: "activity",
      title: "Convert a broad goal into a coachable step",
      prompt: "Take a goal such as improve questioning, explanations or behaviour and make it precise enough to rehearse.",
      instructions: [
        "Write the broad development goal.",
        "Describe one pupil-facing or teacher-facing behaviour that would improve it.",
        "Write a short model of what the behaviour looks or sounds like.",
        "Create a two-minute rehearsal with a clear success criterion.",
        "Write one feedback sentence focused on the behaviour rather than the person.",
      ],
      placeholder: "Broad goal…\nSmall behaviour…\nModel…\nRehearsal…\nSuccess criterion…\nFeedback sentence…",
      minimumCharacters: 220,
    },
  },
  "staff-wellbeing": {
    visual: {
      id: "deep2-wellbeing-workload-system",
      type: "visual",
      title: "Workload improvement: change the system before adding coping tasks",
      layout: "flow",
      caption: "Sustainable wellbeing work should examine controllable organisational causes as well as the support available to individuals.",
      items: [
        { heading: "Identify friction", text: "Find recurring tasks, duplication, unclear expectations or bottlenecks that consume time without enough value.", icon: "1" },
        { heading: "Test value", text: "Ask what educational, safeguarding or operational purpose the task actually serves.", icon: "2" },
        { heading: "Simplify", text: "Remove, automate, combine, standardise or share work where the purpose can still be achieved.", icon: "3" },
        { heading: "Protect clarity", text: "Make ownership, deadlines and acceptable standards explicit so staff do not compensate for ambiguity with extra work.", icon: "4" },
        { heading: "Review impact", text: "Check whether the change genuinely reduces workload without shifting the burden elsewhere or reducing important quality.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-wellbeing-workload-audit",
      type: "activity",
      title: "Remove one avoidable workload loop",
      prompt: "Choose one recurring task or process and redesign it so staff spend less time without losing its important purpose.",
      instructions: [
        "Describe the task and how often it happens.",
        "State the purpose it is supposed to achieve.",
        "Identify duplication, waiting, re-entry, unnecessary formatting or unclear ownership.",
        "Design a simpler version and name what can be removed.",
        "Write the evidence you would use after a few weeks to judge whether workload and quality improved.",
      ],
      placeholder: "Task…\nPurpose…\nCurrent friction…\nSimplified process…\nWhat can stop…\nEvidence of improvement…",
      minimumCharacters: 220,
    },
  },
  "ai-in-education": {
    visual: {
      id: "deep2-ai-professional-check",
      type: "visual",
      title: "AI output: the professional checking chain",
      layout: "flow",
      caption: "A useful AI workflow keeps staff responsible for purpose, privacy, verification and the final professional decision.",
      items: [
        { heading: "Purpose", text: "Start with the educational or workload task, not with a desire to use AI for its own sake.", icon: "1" },
        { heading: "Data", text: "Use approved systems and minimise information so sensitive or identifiable pupil data is protected.", icon: "2" },
        { heading: "Generate", text: "Treat the output as a draft or suggestion rather than an authoritative answer.", icon: "3" },
        { heading: "Verify", text: "Check important factual claims, bias, safeguarding, accessibility, age-appropriateness and curriculum fit.", icon: "4" },
        { heading: "Own the decision", text: "Edit, reject or use the output according to professional judgement and school policy.", icon: "5" },
      ],
    },
    activity: {
      id: "deep2-ai-output-audit",
      type: "activity",
      title: "Audit an AI-assisted task before using it",
      prompt: "Choose a low-risk professional task where AI could help and design the checks you would apply before the output reaches pupils or colleagues.",
      instructions: [
        "State the task and why AI may be useful.",
        "List the information the tool genuinely needs and what should be removed or anonymised.",
        "Name the factual, curriculum, safeguarding and accessibility checks required.",
        "Describe one likely failure mode or bias you would actively look for.",
        "Write the final human decision you remain responsible for making.",
      ],
      placeholder: "Task…\nMinimum data needed…\nChecks…\nLikely failure mode…\nProfessional decision I retain…",
      minimumCharacters: 220,
    },
  },
  "behaviour-routines": {
    visual: {
      id: "deep2-behaviour-routine-cycle",
      type: "visual",
      title: "Build routines by teaching, not merely reminding",
      layout: "cycle",
      caption: "Reliable routines usually come from clarity, rehearsal, consistent cues and re-teaching when the routine weakens.",
      items: [
        { heading: "Define", text: "Specify exactly what pupils should do and what successful completion looks like.", icon: "1" },
        { heading: "Explain", text: "Teach the purpose and the sequence rather than assuming pupils infer the routine.", icon: "2" },
        { heading: "Model", text: "Show the expected routine, including common points where it tends to break down.", icon: "3" },
        { heading: "Rehearse", text: "Practise until pupils can complete the sequence with fewer prompts.", icon: "4" },
        { heading: "Cue consistently", text: "Use predictable signals and language so pupils do not have to decode changing expectations.", icon: "5" },
        { heading: "Re-teach", text: "When the routine drifts, diagnose and practise the weak step rather than relying only on repeated correction.", icon: "6" },
      ],
    },
    activity: {
      id: "deep2-behaviour-routine-script",
      type: "activity",
      title: "Script and rehearse one classroom routine",
      prompt: "Choose one transition that regularly loses learning time and make the expected sequence teachable.",
      instructions: [
        "Write the trigger or cue that starts the routine.",
        "List no more than five observable pupil actions in order.",
        "Write the teacher language used to introduce and practise the routine.",
        "Identify the step most likely to fail and how you will re-teach it.",
        "State how you will know the routine is becoming independent rather than merely compliant when prompted.",
      ],
      placeholder: "Routine…\nCue…\n1…\n2…\n3…\nTeacher language…\nLikely failure point…\nEvidence of independence…",
      minimumCharacters: 220,
    },
  },
  "assessment-for-learning": {
    visual: {
      id: "deep2-afl-decision-cycle",
      type: "visual",
      title: "Formative assessment is a teaching decision cycle",
      layout: "cycle",
      caption: "Evidence becomes formative when it changes what the teacher or pupils do next.",
      items: [
        { heading: "Clarify", text: "Identify the learning or misconception you need evidence about.", icon: "1" },
        { heading: "Elicit", text: "Use a task, question, explanation or sample of work that can reveal that thinking efficiently.", icon: "2" },
        { heading: "Sample", text: "Gather enough responses to avoid basing a whole-class decision on a few volunteers.", icon: "3" },
        { heading: "Interpret", text: "Look for the pattern and distinguish slips, partial knowledge and systematic misconception.", icon: "4" },
        { heading: "Act", text: "Move on, re-model, add practice, change representation, give feedback or create a pupil action from the evidence.", icon: "5" },
        { heading: "Check again", text: "Use a second short check to see whether the response actually improved understanding.", icon: "6" },
      ],
    },
    activity: {
      id: "deep2-afl-response-plan",
      type: "activity",
      title: "Plan the response before you collect the evidence",
      prompt: "Design one formative check and pre-plan what you will do with the likely response patterns.",
      instructions: [
        "State the exact understanding the check is intended to reveal.",
        "Write the question or task and one common incorrect response you expect.",
        "Choose a response method that gives you evidence from most or all pupils.",
        "Plan your action if understanding is secure, mixed or weak.",
        "Write a second check that confirms whether your response worked.",
      ],
      placeholder: "Learning to reveal…\nCheck…\nLikely misconception…\nWhole-class response method…\nIf secure…\nIf mixed…\nIf weak…\nSecond check…",
      minimumCharacters: 230,
    },
  },
};

export function addCourseDeepPractice2(course: Course): Course {
  const boost = boosts[course.id];
  if (!boost) return course;
  const existing = new Set(course.modules.map(module => module.id));
  const modules = [...course.modules];

  if (!existing.has(boost.visual.id)) {
    const visualPosition = Math.min(modules.length, Math.max(2, Math.floor(modules.length * 0.46)));
    modules.splice(visualPosition, 0, boost.visual);
  }

  if (!existing.has(boost.activity.id)) {
    const activityPosition = Math.min(modules.length, Math.max(3, Math.floor(modules.length * 0.82)));
    modules.splice(activityPosition, 0, boost.activity);
  }

  return { ...course, modules };
}
