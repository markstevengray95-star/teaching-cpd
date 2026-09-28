import type { Course, Module } from "./data";

const safeguardingPracticeModules: Module[] = [
  {
    id: "sg26-practice-record-standard",
    type: "content",
    title: "What a strong safeguarding record needs to contain",
    body: "KCSIE 2026's all-staff overview makes recordkeeping unusually explicit. A safeguarding record should not be a vague note that a concern was 'passed on'. The authorised record should capture a clear summary of the concern, the actions taken, the decisions made, the rationale for those decisions where appropriate, and the outcomes. Ordinary staff should record what they know accurately and promptly through the school's approved system; the DSL then adds safeguarding decisions and outcomes according to the setting's procedure.",
    keyPoints: [
      "Record the concern or disclosure clearly and promptly",
      "Separate direct observation, the child's words and professional interpretation",
      "Include the action taken and who the concern was passed to",
      "Safeguarding systems should preserve decisions, rationale and outcomes for an authorised chronology",
      "Do not keep parallel notes on personal devices or informal messaging systems",
    ],
  },
  {
    id: "sg26-practice-record-visual",
    type: "visual",
    title: "From observation to safeguarding chronology",
    layout: "timeline",
    caption: "A useful chronology allows authorised safeguarding staff to understand what was known, what was done and what happened next.",
    items: [
      { heading: "Context", text: "Record when and where the information arose and the relevant factual context.", icon: "1" },
      { heading: "Concern", text: "Capture the relevant observation or the child's words accurately without strengthening or diagnosing them.", icon: "2" },
      { heading: "Immediate action", text: "Record what you did at the time, including any immediate safeguarding response.", icon: "3" },
      { heading: "Report", text: "Record the approved safeguarding route used and who received the concern.", icon: "4" },
      { heading: "Decision", text: "The authorised safeguarding record captures decisions and the rationale where appropriate.", icon: "5" },
      { heading: "Outcome", text: "The chronology preserves relevant outcomes and further action for safeguarding continuity.", icon: "6" },
    ],
  },
  {
    id: "sg26-practice-escalation",
    type: "scenario",
    title: "The DSL is unavailable",
    prompt: "You need to report a safeguarding concern promptly, but the DSL is unavailable. What is the strongest response?",
    options: [
      { label: "Wait until the DSL returns because only one person can receive a concern", feedback: "Safeguarding arrangements should include deputy or alternative routes so a genuine concern is not unnecessarily delayed." },
      { label: "Use the school's current deputy/alternative safeguarding route and follow the child-protection policy; use emergency arrangements where the situation requires them", feedback: "Staff need to know the live local route before a concern arises so they can act without delay." },
      { label: "Put the information in a personal note and mention it informally later", feedback: "Safeguarding information should enter the approved safeguarding system rather than a private parallel record." },
    ],
  },
  {
    id: "sg26-practice-child-voice",
    type: "content",
    title: "Child-centred practice and barriers to reporting",
    body: "A child-centred approach means considering what is best for the child while remaining within professional safeguarding procedures. Children may communicate concerns directly, indirectly, online, through a change in behaviour or attendance, or only after repeated opportunities to speak. Staff should listen calmly, take concerns seriously and avoid making the child responsible for proving what happened. Do not pressure a child to repeat sensitive information unnecessarily, promise secrecy, or carry out an investigation yourself.",
    keyPoints: [
      "Create safe opportunities for children to communicate without forcing disclosure",
      "Take partial or hesitant communication seriously without filling in gaps yourself",
      "Avoid leading questions and repeated retelling where this is not needed",
      "Explain sensitively that information may need to be shared to help keep them safe",
      "Use the safeguarding route even where the picture is incomplete",
    ],
  },
  {
    id: "sg26-practice-info-duty",
    type: "content",
    title: "Information sharing: the September 2026 change",
    body: "The Department for Education updated its statutory information-sharing guidance on 10 September 2026. It reflects the Information Sharing Duty under section 16LA of the Children Act 2004, which comes into force on 30 September 2026. For school staff, the practical discipline is to use current authorised safeguarding systems, share relevant information for safeguarding purposes when appropriate, and seek DSL or data-protection advice when unsure rather than assuming that data protection automatically prevents safeguarding information from being shared.",
    keyPoints: [
      "Use the current statutory guidance and the school's approved safeguarding process",
      "The new section 16LA duty comes into force on 30 September 2026",
      "Share information that is relevant to the safeguarding purpose through authorised routes",
      "Do not circulate safeguarding information more widely than necessary",
      "Record decisions and seek appropriate advice when the route is unclear",
    ],
  },
  {
    id: "sg26-practice-info-check",
    type: "quiz",
    title: "Information-sharing check",
    question: "Which statement best reflects current safeguarding information-sharing practice?",
    options: [
      "Data protection means safeguarding information can never be shared without consent",
      "Relevant safeguarding information should be handled through authorised processes, with appropriate professional judgement and advice where needed",
      "All information about a pupil should be sent to every member of staff",
      "If unsure, keep the information in a personal note and take no further action",
    ],
    answer: 1,
    feedback: "KCSIE and the statutory information-sharing guidance make clear that data protection is not a barrier to necessary safeguarding information sharing. Use authorised school processes and seek advice where needed.",
  },
  {
    id: "sg26-practice-ai-online",
    type: "visual",
    title: "AI and online safeguarding: a safe decision route",
    layout: "flow",
    caption: "DfE's 2026 AI safety materials emphasise that use of generative AI needs to be planned and aligned with safeguarding and data-protection arrangements.",
    items: [
      { heading: "Purpose", text: "Start with a legitimate educational purpose rather than using a tool simply because it is available.", icon: "1" },
      { heading: "Approval", text: "Check the setting's approved technology, AI, safeguarding and data-protection arrangements.", icon: "2" },
      { heading: "Minimise data", text: "Do not place identifiable or sensitive safeguarding information into an unapproved AI or online service.", icon: "3" },
      { heading: "Supervise", text: "Technical controls support, but do not replace, staff supervision and professional judgement.", icon: "4" },
      { heading: "Report", text: "Online harms, unsafe content or filtering/monitoring gaps should enter the school's agreed safeguarding or technical route.", icon: "5" },
      { heading: "Review", text: "Leaders should revisit tools and controls when risks, technology or DfE standards change.", icon: "6" },
    ],
  },
  {
    id: "sg26-practice-policy-audit",
    type: "activity",
    title: "Five-minute school safeguarding procedure audit",
    prompt: "Use your school's live policy/document centre. Without entering confidential pupil information, confirm the exact practical details you would need if a concern arose today.",
    instructions: [
      "Record the title/version or review date of the current child-protection/safeguarding policy.",
      "Record the DSL and deputy/alternative arrangements.",
      "Name the approved concern-recording system or route.",
      "Name the route for concerns or allegations about adults and low-level concerns.",
      "Locate the whistleblowing/escalation process.",
      "Locate the online-safety and filtering/monitoring reporting route.",
      "Check where KCSIE 2026 Part One and current DfE safeguarding guidance are stored for staff.",
      "Identify one detail that needs refreshing if your knowledge is out of date.",
    ],
    placeholder: "Policy/version…\nDSL/deputy…\nReporting route…\nAdult-concern route…\nWhistleblowing…\nOnline-safety route…\nOne detail to refresh…",
    minimumCharacters: 220,
  },
  {
    id: "sg26-practice-final-scenario",
    type: "scenario",
    title: "Putting the whole safeguarding system together",
    prompt: "You notice a pattern that concerns you, a pupil shares limited information, and the usual safeguarding contact is not immediately available. Which response best applies the course?",
    options: [
      { label: "Wait until you have proof and the usual DSL is back", feedback: "Staff should not delay a genuine concern while trying to prove the cause or waiting for one individual." },
      { label: "Listen calmly, avoid investigating, make an accurate record, use the school's deputy/alternative safeguarding route promptly and follow the current policy", feedback: "This combines child-centred response, factual recording, prompt reporting and the school's live safeguarding arrangements." },
      { label: "Ask other pupils for information and discuss the situation in a staff group chat", feedback: "Independent investigation and informal circulation are not appropriate safeguarding routes." },
    ],
  },
];

export function addSafeguardingPractice2026(course: Course): Course {
  if (course.id !== "safeguarding-essentials") return course;
  const existing = new Set(course.modules.map(module => module.id));
  const additions = safeguardingPracticeModules.filter(module => !existing.has(module.id));
  if (!additions.length) return course;
  const finalReflectionIndex = course.modules.findIndex(module => module.id === "sg26-17");
  const insertAt = finalReflectionIndex >= 0 ? finalReflectionIndex : course.modules.length;
  return {
    ...course,
    duration: Math.max(course.duration, 240),
    summary: "A detailed KCSIE 2026 and school-integrated safeguarding programme covering all-staff responsibilities, child-centred response, school procedures, early help, record quality, information sharing, concerns about adults, child-on-child concerns, Prevent, online and AI safeguarding, filtering and monitoring, escalation and practical readiness.",
    objectives: Array.from(new Set([
      ...course.objectives,
      "Create safeguarding records that support a clear authorised chronology of concern, action, decision, rationale and outcome",
      "Use deputy, alternative and escalation routes when the normal safeguarding route is unavailable or inappropriate",
      "Apply the September 2026 statutory information-sharing guidance through authorised school systems",
      "Connect online safety and generative AI use to school safeguarding, data-protection and filtering/monitoring arrangements",
    ])),
    modules: [
      ...course.modules.slice(0, insertAt),
      ...additions,
      ...course.modules.slice(insertAt),
    ],
  };
}
