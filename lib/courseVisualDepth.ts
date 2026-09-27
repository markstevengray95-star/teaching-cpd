import type { Course, Module } from "./data";

function journeyItems(course: Course) {
  const objectives = course.objectives.slice(0, 6);
  const labels = ["Understand", "Notice", "Practise", "Apply", "Check", "Review"];
  return objectives.map((objective, index) => ({
    heading: labels[index] || `Focus ${index + 1}`,
    text: objective,
    icon: String(index + 1),
  }));
}

const transferCycle: Module = {
  id: "__template__",
  type: "visual",
  title: "From CPD to classroom impact",
  layout: "cycle",
  caption: "Professional learning becomes more useful when staff deliberately test a small change, gather evidence and revisit the decision.",
  items: [
    { heading: "Choose", text: "Select one high-value idea connected to a real need in your context.", icon: "1" },
    { heading: "Plan", text: "Define what the change will look like and the evidence you will notice.", icon: "2" },
    { heading: "Try", text: "Use the approach consistently enough to learn from it.", icon: "3" },
    { heading: "Notice", text: "Gather manageable evidence from pupil responses, work or professional observation.", icon: "4" },
    { heading: "Adapt", text: "Keep, refine, fade or stop the approach according to the evidence.", icon: "5" },
    { heading: "Revisit", text: "Return later to check whether the improvement has become secure and sustainable.", icon: "6" },
  ],
};

function evidenceRoute(course: Course): Module {
  return {
    id: `visual-evidence-${course.id}`,
    type: "visual",
    title: "Evidence-to-action decision route",
    layout: "flow",
    caption: "Use evidence to move from an interesting CPD idea to a disciplined professional decision rather than assuming that completion alone changes practice.",
    items: [
      { heading: "Problem", text: "Name the precise pupil, curriculum, team or system problem you are trying to improve.", icon: "1" },
      { heading: "Principle", text: `Choose the part of ${course.title} that best fits that problem.`, icon: "2" },
      { heading: "Action", text: "Turn the principle into one observable professional action or routine.", icon: "3" },
      { heading: "Evidence", text: "Decide what pupil response, work, behaviour, participation or implementation evidence would be useful.", icon: "4" },
      { heading: "Decision", text: "Keep, adapt, scale or stop the approach according to the evidence and context.", icon: "5" },
    ],
  };
}

function categorySystemMap(course: Course): Module {
  const maps: Record<Course["category"], { title: string; caption: string; items: { heading: string; text: string; icon: string }[] }> = {
    "Teaching & Learning": {
      title: "The teaching-learning feedback loop",
      caption: "Strong classroom practice repeatedly connects curriculum intent, teacher action, pupil thinking and responsive adjustment.",
      items: [
        { heading: "Goal", text: "Clarify the important knowledge, skill or disciplinary thinking pupils should develop.", icon: "1" },
        { heading: "Model", text: "Make expert thinking, examples and success criteria visible enough for pupils to enter the task.", icon: "2" },
        { heading: "Elicit", text: "Use questions, tasks and observation to reveal what pupils currently understand.", icon: "3" },
        { heading: "Respond", text: "Adapt explanation, practice, scaffold or feedback to the evidence rather than the plan alone.", icon: "4" },
        { heading: "Secure", text: "Revisit and practise important learning so it becomes increasingly fluent and independent.", icon: "5" },
      ],
    },
    Safeguarding: {
      title: "Safeguarding is a connected school system",
      caption: "Individual staff action sits inside school policy, DSL leadership, recording, information sharing and wider multi-agency arrangements.",
      items: [
        { heading: "Notice", text: "Staff notice concerns, patterns, disclosures or changes without needing to prove a cause.", icon: "1" },
        { heading: "Respond", text: "The immediate response is calm, child-centred and within the member of staff's role.", icon: "2" },
        { heading: "Record", text: "Relevant facts, words, observations and actions are recorded through the approved system.", icon: "3" },
        { heading: "Report", text: "Concerns reach the DSL or the school's authorised safeguarding route promptly.", icon: "4" },
        { heading: "Coordinate", text: "The DSL and leaders connect local action with policy, early help and wider agencies where appropriate.", icon: "5" },
      ],
    },
    SEND: {
      title: "Barrier-to-independence cycle",
      caption: "Adaptation works best when staff identify a real barrier, preserve ambition and review whether support is increasing access and independence.",
      items: [
        { heading: "Goal", text: "Keep the important learning goal clear and ambitious.", icon: "1" },
        { heading: "Barrier", text: "Identify the specific feature of the task, language, environment or routine creating difficulty.", icon: "2" },
        { heading: "Adapt", text: "Choose a scaffold, representation, routine or support that directly addresses the barrier.", icon: "3" },
        { heading: "Observe", text: "Check participation, understanding and independence rather than assuming the support helped.", icon: "4" },
        { heading: "Fade or refine", text: "Reduce, change or retain support according to the pupil's response and plan.", icon: "5" },
      ],
    },
    Leadership: {
      title: "Implementation architecture",
      caption: "Sustainable improvement needs clarity, support, manageable monitoring and repeated follow-up rather than one-off launch activity.",
      items: [
        { heading: "Priority", text: "Define a small number of high-value improvement priorities.", icon: "1" },
        { heading: "Clarity", text: "Show what the intended practice looks like and why it matters.", icon: "2" },
        { heading: "Enable", text: "Provide modelling, rehearsal, time, resources and problem-solving support.", icon: "3" },
        { heading: "Learn", text: "Use implementation evidence to identify patterns and barriers rather than rank staff.", icon: "4" },
        { heading: "Sustain", text: "Revisit, refine and stop competing initiatives so the important practice can become routine.", icon: "5" },
      ],
    },
    Wellbeing: {
      title: "Wellbeing through systems and support",
      caption: "Wellbeing is influenced by interacting personal, relational and organisational factors, so improvement should not be reduced to individual resilience.",
      items: [
        { heading: "Notice", text: "Identify workload, clarity, relationship, environment and support factors rather than one assumed cause.", icon: "1" },
        { heading: "Prioritise", text: "Separate high-value work from avoidable duplication and low-value demand.", icon: "2" },
        { heading: "Support", text: "Use appropriate line-management, pastoral, occupational or safeguarding routes when concerns need more than self-management.", icon: "3" },
        { heading: "Change systems", text: "Improve routines, communication and expectations where organisational factors are contributing.", icon: "4" },
        { heading: "Review", text: "Check whether the change is sustainable and whether further support is required.", icon: "5" },
      ],
    },
    "Digital Teaching": {
      title: "Responsible digital decision loop",
      caption: "Technology should solve a real educational problem while keeping professional judgement, privacy and verification visible.",
      items: [
        { heading: "Purpose", text: "Start with the learning or workload problem rather than the tool itself.", icon: "1" },
        { heading: "Minimise data", text: "Use only the information needed and follow approved school systems and policy.", icon: "2" },
        { heading: "Generate or use", text: "Use the tool within a clearly bounded professional task.", icon: "3" },
        { heading: "Verify", text: "Check accuracy, suitability, bias, privacy and safeguarding implications before use.", icon: "4" },
        { heading: "Evaluate", text: "Decide whether the tool genuinely improved learning, access or workload enough to justify continued use.", icon: "5" },
      ],
    },
  };
  const map = maps[course.category];
  return { id: `visual-system-${course.id}`, type: "visual", layout: "timeline", title: map.title, caption: map.caption, items: map.items };
}

export function addCourseVisualDepth(course: Course): Course {
  const visualCount = course.modules.filter(module => module.type === "visual").length;
  const additions: Module[] = [];

  if (visualCount < 2) {
    additions.push({
      id: `visual-journey-${course.id}`,
      type: "visual",
      title: `${course.title}: learning journey`,
      layout: "timeline",
      caption: "Use this animated map to connect the course objectives before working through the detailed content.",
      items: journeyItems(course),
    });
  }

  if (course.duration >= 45 && visualCount + additions.length < 3) additions.push(categorySystemMap(course));
  if (course.duration >= 55 && visualCount + additions.length < 4) additions.push({ ...transferCycle, id: `visual-transfer-${course.id}` });
  if (course.duration >= 75 && visualCount + additions.length < 5) additions.push(evidenceRoute(course));

  if (!additions.length) return course;
  const insertionPoint = Math.min(3, course.modules.length);
  const middlePoint = Math.max(insertionPoint + additions.length, Math.floor(course.modules.length * 0.55));
  const early = additions.slice(0, 2);
  const later = additions.slice(2);
  const withEarly = [
    ...course.modules.slice(0, insertionPoint),
    ...early,
    ...course.modules.slice(insertionPoint),
  ];
  if (!later.length) return { ...course, modules: withEarly };
  const laterInsert = Math.min(middlePoint, withEarly.length);
  return {
    ...course,
    modules: [
      ...withEarly.slice(0, laterInsert),
      ...later,
      ...withEarly.slice(laterInsert),
    ],
  };
}
