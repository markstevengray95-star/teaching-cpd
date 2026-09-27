import type { Course, Module } from "./data";

const advancedSafeguardingModules: Module[] = [
  {
    id: "sg26-advanced-kcsie-map",
    type: "visual",
    title: "KCSIE 2026: from statutory guidance to daily practice",
    layout: "timeline",
    caption: "All staff need Part One in full, but safe practice also depends on knowing the setting's live policy, people and reporting routes.",
    items: [
      { heading: "Read", text: "Read KCSIE 2026 Part One in full and use the overview only as a companion, not a replacement.", icon: "1" },
      { heading: "Locate", text: "Know where the current school safeguarding and child-protection policy is stored and which version is live.", icon: "2" },
      { heading: "Know people", text: "Know the DSL and deputy arrangements and the alternative route if the usual safeguarding contact is unavailable.", icon: "3" },
      { heading: "Know systems", text: "Know exactly how to record concerns, raise concerns about adults and use whistleblowing or escalation routes.", icon: "4" },
      { heading: "Act", text: "Respond promptly to genuine concerns, keeping the child's welfare central and staying within your professional role.", icon: "5" },
      { heading: "Refresh", text: "Use school updates and annual safeguarding learning to keep procedures current rather than relying on memory from previous years.", icon: "6" },
    ],
  },
  {
    id: "sg26-advanced-adults",
    type: "content",
    title: "Concerns about adults and low-level concerns",
    body: "Safeguarding systems must include a route for concerns about adults working with children. Staff should not privately decide that a concern is too small to mention or attempt to resolve an allegation themselves. The school's current policy should make clear where allegations, concerns about conduct and low-level concerns are reported, including an alternative route where the usual reporting person is involved in the concern.",
    keyPoints: [
      "Use the school's current allegations and low-level-concerns procedure",
      "Do not investigate the matter independently",
      "Record relevant facts and the action you took",
      "Know the alternative reporting route if the concern involves the usual person you would report to",
      "Whistleblowing arrangements provide an additional route where safeguarding concerns are not being addressed appropriately",
    ],
  },
  {
    id: "sg26-advanced-adult-scenario",
    type: "scenario",
    title: "Professional conduct concern",
    prompt: "You observe an adult interaction that concerns you, but you are unsure whether it meets a formal allegation threshold. What is the strongest response?",
    options: [
      { label: "Ignore it unless you can prove harm occurred", feedback: "Staff should use the school's concerns-about-adults or low-level-concerns route rather than setting their own proof threshold." },
      { label: "Record the relevant facts and use the school's agreed route for concerns about adults", feedback: "This allows the appropriate safeguarding lead to consider the concern within the school's procedures." },
      { label: "Question pupils and colleagues until you can decide what happened", feedback: "Independent investigation is not the ordinary staff member's role and can interfere with the correct process." },
    ],
  },
  {
    id: "sg26-advanced-child-on-child",
    type: "content",
    title: "Child-on-child safeguarding concerns",
    body: "Safeguarding concerns can arise between children as well as from adults. Behaviour should not be dismissed simply because the pupils involved are similar in age or because it is described as banter. Staff should follow the school's behaviour and safeguarding procedures when behaviour may be harmful, coercive, discriminatory, threatening, abusive or otherwise raises a safeguarding concern. The DSL considers the wider context, support needs and any further safeguarding action.",
    keyPoints: [
      "Do not normalise harmful behaviour as an inevitable part of growing up",
      "Respond consistently and avoid language that minimises a pupil's concern",
      "Record and report relevant safeguarding information through the approved route",
      "Consider the needs and safety of all children involved while following DSL guidance",
      "School behaviour procedures and safeguarding procedures may both be relevant",
    ],
  },
  {
    id: "sg26-advanced-child-on-child-check",
    type: "quiz",
    title: "Child-on-child safeguarding check",
    question: "Which statement best reflects a safeguarding approach to harmful behaviour between pupils?",
    options: [
      "It cannot be safeguarding if both pupils are children",
      "Staff should decide privately whether the behaviour was serious enough",
      "Potentially harmful behaviour should be taken seriously and handled through the school's safeguarding and behaviour procedures as appropriate",
      "Only physical incidents should ever be recorded",
    ],
    answer: 2,
    feedback: "Safeguarding concerns can arise between children. Staff should follow the school's procedures rather than minimising the concern or creating their own threshold.",
  },
  {
    id: "sg26-advanced-mental-health",
    type: "content",
    title: "Mental health, wellbeing and safeguarding",
    body: "Changes in a child's emotional wellbeing or behaviour can sometimes be relevant safeguarding information, but school staff should not infer a diagnosis or assume one cause from a single sign. Record what you observe, consider the school's pastoral and SEND information, and use safeguarding procedures where there is a concern about a child's safety or welfare. The DSL can help connect safeguarding, pastoral, attendance and external support where needed.",
    keyPoints: [
      "A change in wellbeing can be relevant information without proving a particular cause",
      "Use factual observations rather than diagnostic labels unless a diagnosis is already formally known",
      "Pastoral support does not replace safeguarding action where a safeguarding concern exists",
      "Share concerns through authorised school systems rather than informal personal records",
    ],
  },
  {
    id: "sg26-advanced-prevent",
    type: "visual",
    title: "Prevent within the safeguarding system",
    layout: "flow",
    caption: "Prevent is delivered through safeguarding approaches. Ordinary staff notice and report concerns; DSLs use their specialist training and local arrangements to decide the next safeguarding steps.",
    items: [
      { heading: "Notice", text: "A member of staff notices information that raises a genuine safeguarding concern about possible susceptibility to radicalising influences.", icon: "1" },
      { heading: "Record", text: "Record the relevant facts and context through the school's safeguarding system rather than labelling or diagnosing the pupil.", icon: "2" },
      { heading: "Report", text: "Share the concern promptly with the DSL or the setting's agreed safeguarding route.", icon: "3" },
      { heading: "DSL assessment", text: "The DSL considers the concern alongside other safeguarding information, current Prevent guidance and local support/referral arrangements.", icon: "4" },
      { heading: "Support", text: "Any onward action should remain proportionate, child-centred and connected to wider safeguarding support.", icon: "5" },
    ],
  },
  {
    id: "sg26-advanced-prevent-check",
    type: "quiz",
    title: "Prevent role check",
    question: "What is the strongest response for an ordinary member of staff who has a genuine Prevent-related safeguarding concern?",
    options: [
      "Carry out their own investigation before telling anyone",
      "Record the relevant concern and use the school's safeguarding route promptly",
      "Contact several other pupils to test the concern",
      "Wait until the next annual safeguarding update",
    ],
    answer: 1,
    feedback: "Prevent concerns sit within safeguarding. Staff should use the school's safeguarding route; specialist assessment and referral decisions sit with the appropriate safeguarding leads and local arrangements.",
  },
  {
    id: "sg26-advanced-info-duty",
    type: "content",
    title: "2026 information-sharing duty: what staff need to understand",
    body: "The statutory information-sharing guidance was updated in September 2026 as the new information-sharing duty comes into force. For school staff, the practical message remains to use authorised safeguarding systems, share relevant information for safeguarding purposes when appropriate, and seek DSL or data-protection advice when uncertain rather than assuming that confidentiality means information can never be shared.",
    keyPoints: [
      "Use the current statutory guidance and your school's approved safeguarding process",
      "Share information that is relevant and proportionate to the safeguarding purpose",
      "Know who needs the information rather than circulating it more widely",
      "Record decisions and actions in line with school procedure",
      "Seek appropriate advice when the lawful or proportionate route is unclear",
    ],
  },
  {
    id: "sg26-advanced-online-route",
    type: "scenario",
    title: "Filtering or monitoring concern",
    prompt: "During normal school use you notice that an online-safety control appears not to be working as expected. What should you do?",
    options: [
      { label: "Assume the technical team already knows and take no action", feedback: "Known control gaps should enter the school's agreed technical/safeguarding reporting route so they can be assessed." },
      { label: "Report the issue promptly through the school's agreed filtering, monitoring or safeguarding route and avoid circulating unnecessary material", feedback: "This keeps the response proportionate and allows the responsible staff to assess and address the gap." },
      { label: "Share examples widely with colleagues so everyone can test it", feedback: "Unnecessary sharing can increase risk. Use the approved reporting route instead." },
    ],
  },
  {
    id: "sg26-advanced-final-practice",
    type: "checklist",
    title: "Safeguarding readiness: can you act without searching for the process?",
    prompt: "Before treating this course as complete, check that you could use your own school's systems immediately if a concern arose tomorrow.",
    items: [
      "I have read KCSIE 2026 Part One in full, not only a summary",
      "I know the current school safeguarding/child-protection policy and where it is stored",
      "I know the DSL and deputy arrangements",
      "I know the exact concern-recording and reporting route",
      "I know the route for concerns about adults and low-level concerns",
      "I know the alternative/whistleblowing route if the normal reporting route is unavailable or inappropriate",
      "I know how child-on-child safeguarding concerns are reported",
      "I know how online-safety and filtering/monitoring concerns are reported",
      "I know where the school keeps current Prevent and information-sharing guidance",
    ],
    completionText: "Safeguarding readiness check complete. Keep these details current through school updates and policy refreshes.",
  },
];

export function addAdvancedSafeguarding2026(course: Course): Course {
  if (course.id !== "safeguarding-essentials") return course;
  const existing = new Set(course.modules.map(module => module.id));
  const additions = advancedSafeguardingModules.filter(module => !existing.has(module.id));
  if (!additions.length) return course;
  const finalReflectionIndex = course.modules.findIndex(module => module.type === "reflection");
  const insertAt = finalReflectionIndex >= 0 ? finalReflectionIndex : course.modules.length;
  return {
    ...course,
    duration: Math.max(course.duration, 210),
    summary: "A detailed KCSIE 2026 and school-integrated safeguarding programme covering staff responsibilities, school procedures, early help, child-centred practice, child-on-child concerns, concerns about adults, information sharing, Prevent, online safety, recording, escalation and practical readiness.",
    objectives: Array.from(new Set([
      ...course.objectives,
      "Apply the school's procedures for concerns about adults, low-level concerns and whistleblowing",
      "Recognise and report child-on-child safeguarding concerns without minimising harmful behaviour",
      "Understand how Prevent, online safety and information sharing connect to the wider safeguarding system",
      "Demonstrate practical readiness to use the school's live safeguarding routes without relying on generic training alone",
    ])),
    modules: [
      ...course.modules.slice(0, insertAt),
      ...additions,
      ...course.modules.slice(insertAt),
    ],
  };
}
