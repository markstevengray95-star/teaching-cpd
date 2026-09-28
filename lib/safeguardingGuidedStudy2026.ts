import type { Course, Module } from "./data";

const guidedSafeguardingModules: Module[] = [
  {
    id: "sg26-guided-source-map",
    type: "visual",
    title: "The 2026 safeguarding source map",
    layout: "flow",
    caption: "The course is strongest when staff connect national guidance to the school's live procedures rather than learning documents in isolation.",
    items: [
      { heading: "KCSIE 2026", text: "All-staff safeguarding expectations and the required Part One reading.", icon: "1" },
      { heading: "Working Together", text: "How schools fit into the wider multi-agency safeguarding system.", icon: "2" },
      { heading: "Information sharing", text: "Current statutory principles for sharing relevant safeguarding information through authorised routes.", icon: "3" },
      { heading: "Attendance", text: "Attendance information and support can contribute to the wider picture of a child's needs and welfare.", icon: "4" },
      { heading: "Online safeguards", text: "Filtering, monitoring and safe digital/AI use sit within the school's wider safeguarding arrangements.", icon: "5" },
      { heading: "Your school", text: "The live policy, DSL/deputy, recording system, adult-concern route and escalation arrangements turn guidance into action.", icon: "6" },
    ],
  },
  {
    id: "sg26-guided-attendance",
    type: "content",
    title: "Attendance can be part of the safeguarding picture",
    body: "Attendance should not be treated as proof of a safeguarding problem, but patterns of absence can be important professional information when considered alongside other observations or concerns. The July 2026 statutory attendance guidance emphasises clear responsibilities and support for pupils who are persistently or severely absent or at risk of becoming so. Staff should use the school's attendance, pastoral and safeguarding systems so relevant information can be considered together rather than creating private explanations or investigations.",
    keyPoints: [
      "Do not infer the cause of absence from attendance data alone",
      "Notice changes and patterns alongside other relevant professional information",
      "Use the school's attendance and safeguarding routes rather than a private record",
      "Share relevant concerns with the people responsible for the next safeguarding or attendance decision",
      "Keep the response child-centred and proportionate",
    ],
  },
  {
    id: "sg26-guided-attendance-scenario",
    type: "scenario",
    title: "Attendance pattern and a separate concern",
    prompt: "A pupil's attendance has deteriorated and you have also noticed a separate change that concerns you. You do not know the reason. What is the strongest response?",
    options: [
      { label: "Decide what is causing the absence and question the family yourself", feedback: "Attendance information should not be used to diagnose a cause or start an independent investigation." },
      { label: "Record the relevant observations and use the school's attendance/pastoral and safeguarding arrangements so the information can be considered together", feedback: "This connects evidence without making unsupported assumptions and allows the appropriate staff to decide what support or safeguarding action is needed." },
      { label: "Wait until you have proof that the absence is caused by a safeguarding issue", feedback: "Staff do not need proof before sharing a genuine concern through the authorised safeguarding route." },
    ],
  },
  {
    id: "sg26-guided-multi-agency",
    type: "content",
    title: "Early help, multi-agency working and the staff boundary",
    body: "Working Together to Safeguard Children 2026 explains a wider system in which schools work with local authorities, health, police and other partners. Ordinary staff contribute by noticing relevant information, supporting the child appropriately and passing concerns through school systems. Staff are not expected to decide complex thresholds or coordinate external safeguarding activity alone. The DSL and other authorised professionals use the information available to consider early help, referral, escalation and multi-agency action.",
    keyPoints: [
      "Schools are part of a wider safeguarding system",
      "Timely support may be useful before concerns escalate",
      "Ordinary staff contribute relevant observations and records",
      "DSLs and authorised professionals coordinate next safeguarding steps",
      "Do not make a child repeat sensitive information unnecessarily simply to build a stronger case",
    ],
  },
  {
    id: "sg26-guided-information-visual",
    type: "visual",
    title: "Information sharing: a professional decision route",
    layout: "flow",
    caption: "The September 2026 statutory guidance reinforces that safeguarding information should move through authorised, purposeful routes rather than be automatically withheld or widely circulated.",
    items: [
      { heading: "Purpose", text: "Identify the safeguarding purpose for sharing the information.", icon: "1" },
      { heading: "Relevant", text: "Use information that is relevant to that purpose rather than sharing everything available.", icon: "2" },
      { heading: "Authorised route", text: "Use the school's approved safeguarding system and the appropriate people.", icon: "3" },
      { heading: "Advice", text: "Seek DSL or appropriate data-protection advice when the route is unclear.", icon: "4" },
      { heading: "Record", text: "Follow local procedure for recording what was shared and the action taken.", icon: "5" },
    ],
  },
  {
    id: "sg26-guided-after-reporting",
    type: "content",
    title: "What staff do after a concern is reported",
    body: "Reporting a concern is not the end of a staff member's professional responsibility, but it does change the role. Continue to provide normal, appropriate support and remain alert to further relevant information while following DSL guidance. Do not seek confidential case details simply to satisfy curiosity, carry out a parallel investigation or discuss the matter outside authorised channels. If new information arises, record and report it through the same safeguarding system. If you believe a concern is not being addressed, use the school's escalation or whistleblowing arrangements.",
    keyPoints: [
      "Continue ordinary professional support without investigating",
      "Record and report genuinely new information",
      "Respect need-to-know boundaries",
      "Follow DSL instructions and the current school procedure",
      "Use escalation or whistleblowing routes if a safeguarding concern remains unresolved",
    ],
  },
  {
    id: "sg26-guided-digital",
    type: "visual",
    title: "Online and AI safeguarding decision gate",
    layout: "cycle",
    caption: "Filtering and monitoring support safeguarding, but technical systems do not replace supervision, school policy or professional judgement.",
    items: [
      { heading: "Purpose", text: "Is there a legitimate educational or operational reason for using the digital tool?", icon: "1" },
      { heading: "Approval", text: "Does use fit the school's approved technology, safeguarding and data-protection arrangements?", icon: "2" },
      { heading: "Data", text: "Minimise personal data and never place sensitive safeguarding information into an unapproved service.", icon: "3" },
      { heading: "Supervision", text: "Keep appropriate staff oversight and do not delegate safeguarding judgement to software.", icon: "4" },
      { heading: "Report", text: "Use the agreed route for unsafe content, online concerns or filtering/monitoring gaps.", icon: "5" },
      { heading: "Review", text: "Revisit arrangements when technology, risks or DfE standards change.", icon: "6" },
    ],
  },
  {
    id: "sg26-guided-local-transfer",
    type: "activity",
    title: "Translate the guidance into your school's exact route",
    prompt: "Use the official Course Reading area and your school's Safeguarding Documents centre. Without entering confidential pupil information, turn the national guidance into the practical steps you would use in your setting today.",
    instructions: [
      "Open KCSIE 2026 Part One and identify the all-staff action that matters most for your role.",
      "Open the school's current safeguarding/child-protection policy and confirm its version or review date.",
      "Identify the DSL, deputy/alternative safeguarding contact and exact recording system.",
      "Locate the attendance/pastoral route and note how it connects to safeguarding where concerns overlap.",
      "Locate the procedure for concerns about adults, low-level concerns and the alternative reporting route.",
      "Locate the online-safety/filtering-and-monitoring reporting route.",
      "Write the escalation or whistleblowing route you would use if a concern were not being addressed.",
      "Choose one piece of knowledge you need to refresh with your DSL or line manager.",
    ],
    placeholder: "KCSIE action…\nPolicy/version…\nDSL/deputy and reporting system…\nAttendance/pastoral connection…\nAdult-concern route…\nOnline-safety route…\nEscalation route…\nOne point to refresh…",
    minimumCharacters: 260,
  },
  {
    id: "sg26-guided-final-check",
    type: "quiz",
    title: "Guided-study knowledge check",
    question: "Which statement best connects the 2026 national guidance to day-to-day staff practice?",
    options: [
      "Staff should memorise national documents but use whichever local process feels convenient",
      "Staff should understand the national expectations and be able to use the school's current policy, people, recording route and escalation arrangements without delay",
      "Only the DSL needs to understand safeguarding procedures",
      "Attendance, online safety and information sharing are separate from safeguarding",
    ],
    answer: 1,
    feedback: "Effective safeguarding CPD connects current statutory guidance with the exact local systems staff need to use. Staff notice, respond, record, report and escalate through authorised routes rather than investigating themselves.",
  },
];

export function addSafeguardingGuidedStudy2026(course: Course): Course {
  if (course.id !== "safeguarding-essentials") return course;
  const existing = new Set(course.modules.map(module => module.id));
  const additions = guidedSafeguardingModules.filter(module => !existing.has(module.id));
  if (!additions.length) return course;
  const reflectionIndex = course.modules.findIndex(module => module.id === "sg26-17");
  const insertAt = reflectionIndex >= 0 ? reflectionIndex : course.modules.length;
  return {
    ...course,
    duration: Math.max(course.duration, 285),
    objectives: Array.from(new Set([
      ...course.objectives,
      "Recognise when attendance information contributes to a wider safeguarding picture without assuming a cause",
      "Understand the staff role within early-help and multi-agency safeguarding arrangements",
      "Apply current information-sharing principles through authorised school systems",
      "Know what appropriate professional support looks like after a safeguarding concern has been reported",
    ])),
    modules: [
      ...course.modules.slice(0, insertAt),
      ...additions,
      ...course.modules.slice(insertAt),
    ],
  };
}
