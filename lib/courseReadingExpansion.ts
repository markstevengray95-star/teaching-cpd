import type { CourseReading, ReadingQuestion } from "./courseReadingLibrary";

const extraQuestions: Record<string, ReadingQuestion[]> = {
  "kcsie-2026-part-one": [
    {
      question: "Which statement best describes the relationship between KCSIE and a school's own safeguarding policy?",
      options: [
        "KCSIE replaces the need for a school policy",
        "The school policy replaces KCSIE",
        "Staff need the national statutory guidance and must also follow their setting's live safeguarding procedures",
        "Staff can choose whichever document is shorter",
      ],
      answer: 2,
      feedback: "KCSIE sets national statutory expectations while the setting's policy tells staff how those expectations are implemented locally.",
    },
    {
      question: "What should staff do if they are unsure whether a pattern of information is significant?",
      options: [
        "Keep it private until they are certain",
        "Use the school's safeguarding route or seek DSL advice rather than waiting for proof",
        "Investigate the family themselves",
        "Ask other pupils to confirm the concern",
      ],
      answer: 1,
      feedback: "Staff do not need to prove harm. Genuine concerns and patterns should enter the school's safeguarding system promptly.",
    },
    {
      question: "Which approach is most child-centred when a pupil begins to share a concern?",
      options: [
        "Promise complete secrecy",
        "Listen calmly, avoid leading questions and explain that relevant information may need to be shared to help keep them safe",
        "Ask for every possible detail before reporting",
        "Tell the pupil to return only when they have evidence",
      ],
      answer: 1,
      feedback: "A calm, non-leading response supports the child while keeping the member of staff within the safeguarding process.",
    },
  ],
  "working-together-2026": [
    {
      question: "What is the strongest reason for schools to understand multi-agency safeguarding arrangements?",
      options: [
        "So teachers can replace children's social care",
        "So the school can contribute relevant information and support at the right time within the wider safeguarding system",
        "So every concern is handled outside school",
        "So the DSL no longer needs local procedures",
      ],
      answer: 1,
      feedback: "Schools are part of the wider safeguarding system and may contribute important information, support and professional observations.",
    },
    {
      question: "What should happen when needs might be helped before they escalate?",
      options: [
        "Nothing until a formal child-protection threshold is definitely met",
        "Consider timely early help or other support through the setting's safeguarding arrangements",
        "The class teacher should create a private investigation",
        "Wait for the pupil to request a specific service",
      ],
      answer: 1,
      feedback: "Timely support and early help can be important parts of a child-centred safeguarding system.",
    },
  ],
  "information-sharing-2026": [
    {
      question: "What changed in September 2026?",
      options: [
        "Safeguarding information can no longer be shared",
        "The guidance became statutory in preparation for the new information-sharing duty coming into force on 30 September 2026",
        "Only police may share safeguarding information",
        "Schools are exempt from information-sharing expectations",
      ],
      answer: 1,
      feedback: "The updated statutory guidance reflects the new information-sharing duty under section 16LA of the Children Act 2004, coming into force on 30 September 2026.",
    },
    {
      question: "Which is the strongest approach when you are uncertain about sharing safeguarding information?",
      options: [
        "Automatically withhold everything",
        "Share it publicly so someone can decide",
        "Use the school's safeguarding process and seek appropriate DSL or data-protection advice",
        "Store it in personal notes until the end of term",
      ],
      answer: 2,
      feedback: "Uncertainty should trigger appropriate professional advice and use of authorised systems, not automatic withholding or informal sharing.",
    },
  ],
  "filtering-monitoring-2026": [
    {
      question: "Why are filtering and monitoring not only an IT issue?",
      options: [
        "Because technical controls replace staff supervision",
        "Because keeping pupils safe online is part of the school's wider safeguarding responsibility",
        "Because only classroom teachers configure network systems",
        "Because safeguarding policy does not apply online",
      ],
      answer: 1,
      feedback: "DfE's standard connects filtering and monitoring directly to the school's statutory responsibility to safeguard pupils online as well as offline.",
    },
    {
      question: "Which combination best supports effective filtering and monitoring arrangements?",
      options: [
        "A technical product with no review process",
        "Leadership, DSL, technical responsibility, staff awareness and regular review",
        "Teachers individually choosing which controls to disable",
        "Only an annual pupil survey",
      ],
      answer: 1,
      feedback: "Effective arrangements combine technical controls with clear responsibilities, safeguarding leadership, reporting and review.",
    },
  ],
  "school-safeguarding-documents": [
    {
      question: "Which local procedure should staff know before a concern arises?",
      options: [
        "Only who teaches the pupil next",
        "The exact reporting/recording route and the DSL/deputy arrangements",
        "The school's social media password",
        "A colleague's informal preference",
      ],
      answer: 1,
      feedback: "Safeguarding training becomes actionable when staff know the live local process and who is responsible for safeguarding leadership.",
    },
    {
      question: "Why should staff know an alternative route for concerns about adults?",
      options: [
        "So concerns can be discussed informally first",
        "Because the concern could involve the person normally used in the reporting route",
        "Because low-level concerns never need recording",
        "Because national guidance does not cover adults",
      ],
      answer: 1,
      feedback: "A safe system must provide a route when the usual reporting person is involved or the normal route is otherwise inappropriate.",
    },
  ],
  "eef-cognitive-science": [
    {
      question: "Why should retrieval or worked examples not be used as fixed scripts?",
      options: [
        "Because cognitive science has no classroom relevance",
        "Because strategy choice and support should respond to curriculum, prior knowledge and the learning problem",
        "Because pupils should choose every activity",
        "Because all classes have identical prior knowledge",
      ],
      answer: 1,
      feedback: "Evidence-informed principles are most useful when applied to a clear learning problem and adapted to curriculum and prior knowledge.",
    },
  ],
  "eef-formative-assessment": [
    {
      question: "What should a teacher do after a hinge question exposes a misconception?",
      options: [
        "Ignore it and continue with the original plan",
        "Use the evidence to decide the next explanation, example, question or practice step",
        "Record a grade only",
        "Ask only the pupils who were correct to explain",
      ],
      answer: 1,
      feedback: "Assessment becomes formative when the evidence changes what teaching or learning does next.",
    },
  ],
  "eef-behaviour": [
    {
      question: "Why is explicitly teaching routines important?",
      options: [
        "It reduces ambiguity and helps pupils understand what successful participation looks like",
        "It means relationships no longer matter",
        "It removes the need to understand pupil context",
        "It guarantees every pupil responds identically",
      ],
      answer: 0,
      feedback: "Clear, explicitly taught routines can make expectations predictable while still requiring responsive professional judgement.",
    },
  ],
  "eef-feedback": [
    {
      question: "What should happen after useful feedback is given?",
      options: [
        "Nothing; receiving comments is enough",
        "Pupils should have a meaningful opportunity to use the feedback in subsequent thinking or work",
        "The teacher should rewrite the work",
        "Every piece of work should receive the same amount of feedback",
      ],
      answer: 1,
      feedback: "Feedback is more useful when pupils can act on it, with enough support and time to improve learning.",
    },
  ],
  "eef-metacognition": [
    {
      question: "What is a useful way to develop self-regulation?",
      options: [
        "Tell pupils to be independent without modelling strategies",
        "Model planning, monitoring and evaluation within real subject tasks and gradually reduce support",
        "Keep scaffolds permanent",
        "Teach generic study slogans without curriculum content",
      ],
      answer: 1,
      feedback: "Metacognitive strategies are strongest when modelled explicitly in subject learning and support is faded as pupils become more independent.",
    },
  ],
  "eef-send": [
    {
      question: "How should staff decide whether an adaptation is working?",
      options: [
        "Assume it works because it was recommended for a diagnostic label",
        "Check whether it improves access, learning, participation or independence for the pupil",
        "Keep it permanently once introduced",
        "Judge only whether the task became easier",
      ],
      answer: 1,
      feedback: "Support should respond to an identified barrier and be reviewed against meaningful pupil outcomes and independence.",
    },
  ],
};

export const additionalCourseReadings: CourseReading[] = [
  {
    id: "prevent-dsl-practical-2026",
    courseIds: ["safeguarding-essentials"],
    title: "The Prevent duty: practical guidance for designated safeguarding leads",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/the-prevent-duty-safeguarding-learners-susceptible-to-radicalisation/the-prevent-duty-practical-guidance-for-designated-safeguarding-leads",
    external: true,
    readTime: 15,
    summary: "Updated September 2026 guidance for DSLs on using safeguarding approaches to identify and support learners who may be susceptible to radicalising influences. For ordinary staff, the key connection is knowing how to recognise a genuine concern and use the school's safeguarding route.",
    focusPoints: [
      "Prevent sits within safeguarding rather than being a separate investigation carried out by classroom staff.",
      "Ordinary staff should recognise concerns, record relevant information and use the school's safeguarding route.",
      "DSLs use their specialist training, current guidance and local arrangements to consider referral and support.",
      "Avoid labels or assumptions based on one behaviour or characteristic.",
    ],
    questions: [
      {
        question: "Where should an ordinary member of staff take a genuine Prevent-related concern?",
        options: ["To the school's safeguarding/DSL route", "To a public social-media group", "To other pupils for confirmation", "Nowhere until they can prove radicalisation"],
        answer: 0,
        feedback: "Prevent concerns are safeguarding concerns. Staff should use the setting's safeguarding route promptly.",
      },
      {
        question: "Who normally makes the specialist safeguarding assessment about the next Prevent steps in school?",
        options: ["Any pupil who saw the concern", "The DSL or appropriate safeguarding lead using current guidance and local arrangements", "The first member of staff to hear about it, acting alone", "A parent group chat"],
        answer: 1,
        feedback: "Specialist assessment and referral decisions sit with the appropriate safeguarding leads and local arrangements, not an individual classroom member of staff acting alone.",
      },
      {
        question: "Which approach best avoids unfair assumptions?",
        options: ["Treat one characteristic as proof of risk", "Record the relevant safeguarding concern and context without labelling the learner", "Ask other pupils to investigate", "Ignore all concerns to avoid making a judgement"],
        answer: 1,
        feedback: "A safeguarding response focuses on relevant evidence and context while avoiding stereotypes or unsupported conclusions.",
      },
    ],
  },
  {
    id: "kcsie-2026-overview-companion",
    courseIds: ["safeguarding-essentials"],
    title: "KCSIE 2026 Part One overview for all staff",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/keeping-children-safe-in-education--2/part-one-overview-for-all-staff",
    external: true,
    readTime: 10,
    summary: "A concise companion to KCSIE Part One, updated for 2026. It is useful for retrieval and staff briefing but explicitly does not replace reading Part One in full.",
    focusPoints: [
      "Safeguarding is everyone's responsibility and staff should take a child-centred approach.",
      "Staff need to know their setting's systems, policy and DSL arrangements.",
      "The overview highlights information sharing, recordkeeping, concerns about adults and whistleblowing.",
      "Use it to refresh key actions after completing the full Part One reading.",
    ],
    questions: [
      {
        question: "Can the KCSIE overview replace Part One for staff?",
        options: ["Yes", "Only for experienced teachers", "No; it complements Part One and all staff must read Part One in full", "Only if the DSL approves"],
        answer: 2,
        feedback: "DfE states that the overview complements, but does not replace, KCSIE Part One.",
      },
      {
        question: "Which group of actions is highlighted in the overview?",
        options: ["Recordkeeping, information sharing, concerns about staff and whistleblowing", "School finance and procurement", "Examination entry procedures", "Only curriculum planning"],
        answer: 0,
        feedback: "These are among the core all-staff safeguarding processes highlighted in the 2026 overview.",
      },
    ],
  },
];

export function expandReadingQuestions(reading: CourseReading): CourseReading {
  const additions = extraQuestions[reading.id] || [];
  if (!additions.length) return reading;
  return { ...reading, questions: [...reading.questions, ...additions] };
}

export function additionalReadingsForCourse(courseId: string) {
  return additionalCourseReadings.filter(reading => reading.courseIds.includes(courseId));
}
