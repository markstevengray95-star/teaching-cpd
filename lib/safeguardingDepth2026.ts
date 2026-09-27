import type { Course, Module } from "./data";

const extraSafeguardingModules: Module[] = [
  {
    id: "sg26-depth-early-help",
    type: "content",
    title: "Early help, patterns and professional curiosity",
    body: "Safeguarding concerns do not always arrive as one clear event. Staff may notice a pattern across attendance, behaviour, presentation, relationships, online activity or changes in engagement. KCSIE expects staff to know which children may benefit from early help and to act on concerns rather than wait for certainty. Professional curiosity means noticing and sharing relevant information without deciding the cause yourself.",
    keyPoints: [
      "A pattern of smaller observations can be important even when no single observation proves harm",
      "Changes in attendance or behaviour can be relevant safeguarding information",
      "Early help can support children and families before needs escalate",
      "Staff should record what they observed rather than diagnose a cause",
      "Use the school's safeguarding route and seek DSL advice when unsure",
    ],
  },
  {
    id: "sg26-depth-child-centred",
    type: "visual",
    title: "A child-centred safeguarding lens",
    layout: "cycle",
    caption: "The strongest response keeps the child's welfare central while staff stay within their professional role.",
    items: [
      { heading: "Notice", text: "Pay attention to what the child says, what you observe and patterns over time.", icon: "1" },
      { heading: "Listen", text: "Respond calmly and give the child space to communicate without leading them.", icon: "2" },
      { heading: "Explain", text: "Be clear that relevant information may need to be shared to help keep them safe.", icon: "3" },
      { heading: "Record", text: "Capture the relevant facts, actions and words accurately through the approved system.", icon: "4" },
      { heading: "Report", text: "Pass the concern promptly through the school's safeguarding route.", icon: "5" },
      { heading: "Continue", text: "Maintain appropriate support and follow DSL guidance without independently investigating.", icon: "6" },
    ],
  },
  {
    id: "sg26-depth-attendance",
    type: "scenario",
    title: "A developing pattern of concern",
    prompt: "Over several weeks you notice a pupil's attendance has become less regular and their engagement has changed. You do not know the reason. What is the strongest professional response?",
    options: [
      { label: "Wait until you know exactly what is happening", feedback: "Staff do not need certainty before sharing a genuine concern or pattern through the safeguarding route." },
      { label: "Record the relevant observations factually and share the pattern through the school's safeguarding process", feedback: "This keeps the response evidence-based and allows the DSL to consider the wider picture." },
      { label: "Question several classmates to find out the cause", feedback: "Independent investigation can create additional risk and is not the ordinary staff member's role." },
    ],
  },
  {
    id: "sg26-depth-info-sharing",
    type: "visual",
    title: "Information sharing: a professional decision route",
    layout: "flow",
    caption: "Use the school's approved safeguarding systems and current statutory guidance rather than informal channels.",
    items: [
      { heading: "Purpose", text: "Be clear why the information matters for helping or safeguarding a child.", icon: "1" },
      { heading: "Relevant", text: "Share information that is relevant to the safeguarding purpose rather than everything known about the child.", icon: "2" },
      { heading: "Authorised", text: "Use the DSL, safeguarding system or other approved route for the setting.", icon: "3" },
      { heading: "Accurate", text: "Separate fact, direct report, observation and professional interpretation.", icon: "4" },
      { heading: "Record", text: "Follow the school's requirements for recording what was shared and the action taken.", icon: "5" },
      { heading: "Seek advice", text: "If uncertain, obtain DSL or appropriate data-protection advice rather than simply withholding a concern.", icon: "6" },
    ],
  },
  {
    id: "sg26-depth-recording",
    type: "activity",
    title: "Practise a high-quality safeguarding record",
    prompt: "Without using a real pupil or confidential information, practise turning an observation into a concise professional safeguarding record.",
    instructions: [
      "Write the date/time and the context in which the concern arose.",
      "Separate what you directly observed from what another person said.",
      "Where relevant, use the child's own wording rather than rewriting it into stronger language.",
      "Record the action you took and who the concern was passed to through the approved route.",
      "Remove speculation, diagnosis and unnecessary personal opinion.",
      "Check that the record would make sense to an authorised safeguarding colleague who was not present.",
    ],
    placeholder: "Example only — do not enter real pupil information here.\nContext…\nWhat I observed/heard…\nAction taken…\nReporting route used…",
    minimumCharacters: 180,
  },
  {
    id: "sg26-depth-record-check",
    type: "quiz",
    title: "Recording quality check",
    question: "Which wording is most appropriate for a safeguarding record?",
    options: [
      "The pupil was obviously being dishonest",
      "At 10:20 the pupil said [relevant words]; I recorded the concern and passed it through the school's safeguarding system",
      "I am certain I know what caused the change",
      "Several colleagues think the family is probably responsible",
    ],
    answer: 1,
    feedback: "A useful safeguarding record distinguishes the relevant words or observations from interpretation and records the action taken.",
  },
  {
    id: "sg26-depth-online-system",
    type: "visual",
    title: "Online safeguarding is a whole-school system",
    layout: "pyramid",
    caption: "Filtering and monitoring matter, but technology works alongside policy, staff awareness, reporting and leadership review.",
    items: [
      { heading: "Culture", text: "Pupils and staff know how to raise online-safety concerns and are taken seriously.", icon: "1" },
      { heading: "Teaching & supervision", text: "Staff teach safe practice and maintain professional supervision appropriate to the activity.", icon: "2" },
      { heading: "Reporting", text: "Concerns and control failures enter the school's safeguarding or technical reporting route promptly.", icon: "3" },
      { heading: "Filtering & monitoring", text: "Appropriate technical controls support the school's online-safety arrangements.", icon: "4" },
      { heading: "Leadership review", text: "Leaders understand responsibilities, review effectiveness and act on identified gaps or new risks.", icon: "5" },
    ],
  },
  {
    id: "sg26-depth-school-link",
    type: "checklist",
    title: "Connect the course to your school before completion",
    prompt: "Use the Safeguarding Documents & Policy Centre and confirm that the national learning in this course is connected to your setting.",
    items: [
      "I know where the live safeguarding/child-protection policy is stored",
      "I know the DSL/deputy arrangements and what to do if the usual contact is unavailable",
      "I know the exact digital or paper route used to record and report a concern",
      "I know the route for concerns or allegations about adults and low-level concerns",
      "I know the school's whistleblowing/escalation route",
      "I know how online-safety and filtering/monitoring concerns are reported",
      "I know where to find KCSIE 2026 Part One and current national safeguarding guidance",
    ],
    completionText: "National guidance and school procedures linked successfully.",
  },
];

export function deepenSafeguarding2026(course: Course): Course {
  if (course.id !== "safeguarding-essentials") return course;
  const existing = new Set(course.modules.map(module => module.id));
  const additions = extraSafeguardingModules.filter(module => !existing.has(module.id));
  if (!additions.length) return course;

  const finalReflectionIndex = course.modules.findIndex(module => module.id === "sg26-17");
  const insertAt = finalReflectionIndex >= 0 ? finalReflectionIndex : course.modules.length;
  return {
    ...course,
    duration: Math.max(course.duration, 165),
    summary: "A detailed, school-integrated safeguarding course aligned to KCSIE 2026. Staff connect statutory guidance to their own policy, DSL arrangements, early-help awareness, recording and information sharing, online safeguarding, concerns about adults and local reporting routes.",
    objectives: Array.from(new Set([
      ...course.objectives,
      "Recognise when patterns, attendance changes or other information may require safeguarding action or early help",
      "Create timely factual safeguarding records that distinguish observation, direct report and interpretation",
      "Apply current information-sharing principles through the school's approved safeguarding systems",
      "Understand how filtering, monitoring, online safety and staff supervision form one safeguarding system",
    ])),
    modules: [
      ...course.modules.slice(0, insertAt),
      ...additions,
      ...course.modules.slice(insertAt),
    ],
  };
}
