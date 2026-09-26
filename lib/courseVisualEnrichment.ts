import type { Course, CourseCategory, Module } from "./data";

type Blueprint = {
  title: string;
  body: string;
  keyPoints: string[];
  steps: { heading: string; text: string; icon: string }[];
};

const blueprints: Record<CourseCategory, Blueprint> = {
  "Teaching & Learning": {
    title: "From principle to classroom practice",
    body: "Strong teaching CPD should move beyond knowing a strategy by name. The practical sequence is to clarify the learning goal, identify what pupils need to think or do, select an approach that fits that goal, make pupil thinking visible, respond to the evidence and revisit the learning after a delay. The same principle can look different across subjects because disciplinary knowledge, representations and success criteria differ.",
    keyPoints: [
      "Start with the intended learning rather than the activity",
      "Connect new practice to prior knowledge and curriculum sequence",
      "Use modelling and examples to make hidden thinking visible",
      "Gather evidence from more than volunteers",
      "Adapt teaching when the evidence shows pupils need something different",
      "Plan when important learning will be revisited"
    ],
    steps: [
      { heading: "Clarify", text: "Define the knowledge, skill or understanding pupils should develop.", icon: "1" },
      { heading: "Model", text: "Make the important process, example or decision visible.", icon: "2" },
      { heading: "Practise", text: "Give pupils structured opportunities to do the thinking.", icon: "3" },
      { heading: "Check", text: "Gather evidence of what pupils understand now.", icon: "4" },
      { heading: "Adapt", text: "Re-explain, scaffold, extend or fade support in response.", icon: "5" },
      { heading: "Revisit", text: "Return to important learning later so it becomes durable.", icon: "6" }
    ]
  },
  Safeguarding: {
    title: "Professional safeguarding lens",
    body: "Safeguarding CPD should strengthen professional awareness and help staff use the school's current procedures confidently. Training cannot replace local policy, DSL advice or statutory guidance. Staff should notice concerns, respond calmly, record factual information and pass concerns through the agreed route rather than investigating for themselves.",
    keyPoints: [
      "Know the current school safeguarding policy and reporting route",
      "Listen without promising secrecy or conducting an investigation",
      "Record facts and relevant words accurately",
      "Pass concerns to the DSL or agreed safeguarding route promptly",
      "Do not use training scenarios to diagnose or label pupils",
      "When in doubt, seek safeguarding advice rather than handling a concern alone"
    ],
    steps: [
      { heading: "Notice", text: "Recognise a concern, disclosure or change that may matter.", icon: "1" },
      { heading: "Respond", text: "Stay calm, listen appropriately and avoid leading questions.", icon: "2" },
      { heading: "Record", text: "Write factual information using the school's agreed system.", icon: "3" },
      { heading: "Report", text: "Pass the concern through the safeguarding route promptly.", icon: "4" },
      { heading: "Follow up", text: "Continue normal professional support and follow DSL guidance.", icon: "5" }
    ]
  },
  SEND: {
    title: "Inclusive practice deep dive",
    body: "Inclusive teaching begins with ambitious learning and careful analysis of barriers. A diagnosis or broad area of need does not automatically prescribe a strategy. Teachers should combine pupil-specific information with strong universal teaching, then add proportionate support where a task, explanation or environment creates a barrier. Support should be reviewed so it develops participation and independence rather than becoming automatic dependency.",
    keyPoints: [
      "Start with the pupil and the intended learning, not a label",
      "Identify the precise barrier created by the task or environment",
      "Use clear explanations, routines and vocabulary as strong universal provision",
      "Add targeted scaffolds or adjustments where evidence shows they are needed",
      "Keep the important thinking with the pupil wherever possible",
      "Review whether support is working and whether it can be reduced"
    ],
    steps: [
      { heading: "Goal", text: "Be clear about the important learning to preserve.", icon: "1" },
      { heading: "Barrier", text: "Identify what is preventing access or participation.", icon: "2" },
      { heading: "Adapt", text: "Change support, representation, language, routine or environment.", icon: "3" },
      { heading: "Check", text: "Gather evidence that the adaptation is helping.", icon: "4" },
      { heading: "Review", text: "Keep, change or fade support as needs and independence change.", icon: "5" }
    ]
  },
  Leadership: {
    title: "Leadership implementation deep dive",
    body: "Professional learning has more impact when leaders define the problem precisely, limit competing priorities, make the desired practice concrete and provide time, modelling and follow-up. Monitoring is most useful when it helps leaders understand implementation barriers and improve support, rather than simply checking whether staff complied with a launch message.",
    keyPoints: [
      "Diagnose the problem before selecting an initiative",
      "Prioritise a small number of high-leverage changes",
      "Specify what the desired practice looks like",
      "Provide resources, modelling, rehearsal and protected time",
      "Use evidence to understand implementation barriers",
      "Review impact and stop or adapt low-value routines"
    ],
    steps: [
      { heading: "Diagnose", text: "Define the problem using evidence rather than assumption.", icon: "1" },
      { heading: "Prioritise", text: "Choose the smallest number of changes that matter most.", icon: "2" },
      { heading: "Prepare", text: "Clarify practice and provide training, tools and time.", icon: "3" },
      { heading: "Implement", text: "Support staff as the new routine is established.", icon: "4" },
      { heading: "Review", text: "Use implementation and pupil evidence to refine the approach.", icon: "5" }
    ]
  },
  Wellbeing: {
    title: "Supportive practice without overstepping role",
    body: "Wellbeing CPD is most useful when it helps staff create predictable, respectful environments and recognise when a pupil or colleague may need additional support. Classroom staff should avoid diagnosing causes from limited observations. The professional response is to notice changes, maintain appropriate expectations and support, use pastoral or safeguarding systems where needed and review what is within the school's control.",
    keyPoints: [
      "Use observation and evidence rather than assumptions about cause",
      "Create predictable, respectful and psychologically safe routines",
      "Maintain appropriate ambition alongside reasonable support",
      "Know the boundary between classroom support and specialist intervention",
      "Use pastoral, SEND or safeguarding routes when concerns require them",
      "Review environmental and workload factors the school can realistically change"
    ],
    steps: [
      { heading: "Notice", text: "Pay attention to changes, barriers or patterns without diagnosing.", icon: "1" },
      { heading: "Support", text: "Use calm, proportionate classroom or workplace support.", icon: "2" },
      { heading: "Connect", text: "Use pastoral, SEND, safeguarding or line-management systems where needed.", icon: "3" },
      { heading: "Review", text: "Check whether the support or environmental change helped.", icon: "4" }
    ]
  },
  "Digital Teaching": {
    title: "Safe digital practice deep dive",
    body: "Digital tools should be selected because they improve a clear educational or operational goal, not because they are novel. Staff remain responsible for checking accuracy, protecting personal data, considering accessibility and ensuring technology does not remove the thinking pupils need to do. Higher-risk uses require stronger verification and clearer boundaries.",
    keyPoints: [
      "Start with the educational purpose before choosing a tool",
      "Minimise personal and sensitive data",
      "Check important outputs rather than treating software as an authority",
      "Consider accessibility, bias and unequal access",
      "Keep professional judgement and safeguarding decisions with staff",
      "Review whether the technology improved learning or merely added activity"
    ],
    steps: [
      { heading: "Purpose", text: "Define the problem or learning goal first.", icon: "1" },
      { heading: "Protect", text: "Minimise data and follow school-approved systems.", icon: "2" },
      { heading: "Verify", text: "Check accuracy, bias, suitability and accessibility.", icon: "3" },
      { heading: "Use", text: "Keep pupils and staff doing the important thinking.", icon: "4" },
      { heading: "Review", text: "Decide whether the tool added genuine value.", icon: "5" }
    ]
  }
};

const specialVisuals: Record<string, Module> = {
  "rosenshine-principles": {
    id: "vx-special-rosenshine-principles",
    type: "visual",
    title: "Rosenshine: responsive instruction, not a checklist",
    layout: "compare",
    caption: "Use the principles as connected decisions around learning, not ten boxes to force into every lesson.",
    items: [
      { heading: "Weak interpretation", text: "Every lesson must contain all ten principles in the same sequence.", icon: "×" },
      { heading: "Stronger interpretation", text: "Teachers emphasise different principles according to content, prior knowledge and evidence of pupil understanding.", icon: "✓" },
      { heading: "Weak interpretation", text: "Independent work begins because the lesson plan says it is time.", icon: "×" },
      { heading: "Stronger interpretation", text: "Support fades when checks show pupils can succeed with less help.", icon: "✓" }
    ]
  },
  "maslow-needs": {
    id: "vx-special-maslow-needs",
    type: "visual",
    title: "Maslow: useful lens vs common misuse",
    layout: "compare",
    caption: "The framework can prompt professional curiosity, but it should not be treated as a diagnostic law.",
    items: [
      { heading: "Useful", text: "Ask whether classroom conditions support safety, belonging, competence and growth.", icon: "✓" },
      { heading: "Misuse", text: "Assume a pupil cannot learn until every lower need is fully satisfied.", icon: "×" },
      { heading: "Useful", text: "Combine observations with pupil-specific pastoral, SEND and safeguarding information.", icon: "✓" },
      { heading: "Misuse", text: "Infer a pupil's home circumstances from one behaviour or low engagement.", icon: "×" }
    ]
  },
  "effective-questioning": {
    id: "vx-special-effective-questioning",
    type: "visual",
    title: "The diagnostic questioning loop",
    layout: "flow",
    items: [
      { heading: "Plan", text: "Choose a question that reveals an important idea or misconception.", icon: "1" },
      { heading: "Think", text: "Give enough processing time before sampling answers.", icon: "2" },
      { heading: "Sample", text: "Gather responses broadly rather than relying on volunteers.", icon: "3" },
      { heading: "Probe", text: "Ask why, how or what evidence supports the response.", icon: "4" },
      { heading: "Adapt", text: "Move on, re-model, scaffold or extend using the evidence.", icon: "5" }
    ]
  },
  "cognitive-load-theory": {
    id: "vx-special-cognitive-load-theory",
    type: "visual",
    title: "Where cognitive load comes from",
    layout: "compare",
    items: [
      { heading: "Task complexity", text: "Some difficulty is inherent in the material and depends on what the learner already knows.", icon: "1" },
      { heading: "Avoidable load", text: "Poor layout, split attention, unnecessary information and unclear instructions consume working memory without helping learning.", icon: "2" },
      { heading: "Useful processing", text: "Attention spent understanding structure, examples and relationships contributes directly to learning.", icon: "3" },
      { heading: "Expertise matters", text: "Support that helps a novice may become redundant once knowledge is secure.", icon: "4" }
    ]
  },
  "behaviour-management": {
    id: "vx-special-behaviour-management",
    type: "visual",
    title: "Behaviour support across a lesson",
    layout: "timeline",
    items: [
      { heading: "Before", text: "Teach routines, prepare resources and remove predictable ambiguity.", icon: "1" },
      { heading: "Entry", text: "Use clear cues and a predictable start so pupils know what successful behaviour looks like.", icon: "2" },
      { heading: "During", text: "Actively supervise, narrate expectations and correct calmly and proportionately.", icon: "3" },
      { heading: "Transition", text: "Re-cue and rehearse routines where learning time is usually lost.", icon: "4" },
      { heading: "After", text: "Record patterns, repair relationships where needed and use pastoral/SEND systems appropriately.", icon: "5" }
    ]
  },
  "send-inclusive-practice": {
    id: "vx-special-send-inclusive-practice",
    type: "visual",
    title: "Barrier-to-independence pathway",
    layout: "ladder",
    items: [
      { heading: "Identify the goal", text: "What important learning should remain ambitious?", icon: "1" },
      { heading: "Locate the barrier", text: "Is the difficulty language, memory, sensory, motor, routine, prior knowledge or another demand?", icon: "2" },
      { heading: "Select support", text: "Choose the smallest useful adjustment or scaffold.", icon: "3" },
      { heading: "Check impact", text: "Is participation, accuracy or independence improving?", icon: "4" },
      { heading: "Build independence", text: "Fade or change support when evidence shows the pupil is ready.", icon: "5" }
    ]
  },
  "effective-feedback": {
    id: "vx-special-effective-feedback",
    type: "visual",
    title: "Feedback only works when something happens next",
    layout: "flow",
    items: [
      { heading: "Goal", text: "Be clear about the intended learning or quality.", icon: "1" },
      { heading: "Evidence", text: "Identify the most important gap in current performance.", icon: "2" },
      { heading: "Next step", text: "Give focused information the pupil can actually use.", icon: "3" },
      { heading: "Action", text: "Protect time for correction, redrafting or reattempt.", icon: "4" },
      { heading: "Check", text: "Confirm whether the response improved performance.", icon: "5" }
    ]
  },
  "metacognition-self-regulation": {
    id: "vx-special-metacognition-self-regulation",
    type: "visual",
    title: "The self-regulation cycle",
    layout: "cycle",
    items: [
      { heading: "Plan", text: "Clarify the goal and select a strategy.", icon: "1" },
      { heading: "Monitor", text: "Check whether the strategy is working while the task is underway.", icon: "2" },
      { heading: "Adjust", text: "Change strategy or effort when evidence shows a problem.", icon: "3" },
      { heading: "Evaluate", text: "Judge the outcome and explain what should change next time.", icon: "4" }
    ]
  }
};

function objectiveMap(course: Course): Module {
  return {
    id: `vx-map-${course.id}`,
    type: "visual",
    title: "Visual knowledge map",
    layout: course.objectives.length > 4 ? "flow" : "ladder",
    caption: `The main ideas this ${course.title} course is designed to connect.`,
    items: course.objectives.slice(0, 6).map((objective, index) => ({
      heading: `Focus ${index + 1}`,
      text: objective,
      icon: String(index + 1)
    }))
  };
}

function categoryVisual(course: Course): Module {
  const blueprint = blueprints[course.category];
  return {
    id: `vx-practice-${course.id}`,
    type: "visual",
    title: blueprint.title,
    layout: "flow",
    caption: `A practical implementation sequence to use alongside the specific ideas in ${course.title}.`,
    items: blueprint.steps
  };
}

function deepDive(course: Course): Module {
  const blueprint = blueprints[course.category];
  const objectiveText = course.objectives.slice(0, 3).join("; ");
  return {
    id: `vx-info-${course.id}`,
    type: "content",
    title: "Professional practice deep dive",
    body: `${blueprint.body} In this course, keep returning to three questions: what is the intended outcome, what evidence would show improvement, and what would make you adapt the approach? The core priorities here are: ${objectiveText}.`,
    keyPoints: blueprint.keyPoints
  };
}

export function enrichCourseWithVisuals(course: Course): Course {
  const existing = new Set(course.modules.map(module => module.id));
  const extras: Module[] = [objectiveMap(course), deepDive(course), categoryVisual(course)];
  const special = specialVisuals[course.id];
  if (special) extras.push(special);
  return {
    ...course,
    modules: [...course.modules, ...extras.filter(module => !existing.has(module.id))]
  };
}
