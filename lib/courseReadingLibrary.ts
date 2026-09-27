export type ReadingQuestion = {
  question: string;
  options: string[];
  answer: number;
  feedback: string;
};

export type CourseReading = {
  id: string;
  courseIds: string[];
  title: string;
  publisher: string;
  url: string;
  external?: boolean;
  readTime: number;
  summary: string;
  focusPoints: string[];
  questions: ReadingQuestion[];
};

export const courseReadings: CourseReading[] = [
  {
    id: "kcsie-2026-part-one",
    courseIds: ["safeguarding-essentials"],
    title: "Keeping children safe in education 2026: Part One",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/keeping-children-safe-in-education--2",
    external: true,
    readTime: 30,
    summary: "The core statutory safeguarding reading for all staff in schools and colleges in England. Use the full Part One document rather than the short overview as the required reading.",
    focusPoints: [
      "Safeguarding is everyone's responsibility and staff should take a child-centred approach.",
      "Know the school's safeguarding systems, DSL/deputy arrangements and reporting routes.",
      "Recognise that concerns may emerge through patterns such as changes in behaviour or attendance.",
      "Act promptly, record concerns and use the school's current procedures.",
      "Know the routes for concerns about adults, whistleblowing and escalation."
    ],
    questions: [
      {
        question: "What is the correct 2026 expectation for all staff?",
        options: ["Read only the short overview", "Read KCSIE Part One in full and follow the school's procedures", "Only the DSL needs to read KCSIE", "Read KCSIE only after a concern occurs"],
        answer: 1,
        feedback: "KCSIE 2026 states that all staff must read Part One in full; the overview complements it but does not replace it."
      },
      {
        question: "What should a member of staff do when a genuine safeguarding concern arises?",
        options: ["Wait until there is proof", "Investigate independently", "Use the school's safeguarding route promptly and record relevant facts", "Keep a private note until the next staff meeting"],
        answer: 2,
        feedback: "Staff should respond, record and report through the authorised safeguarding system rather than attempting their own investigation."
      }
    ]
  },
  {
    id: "working-together-2026",
    courseIds: ["safeguarding-essentials"],
    title: "Working together to safeguard children 2026",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/working-together-to-safeguard-children--2",
    external: true,
    readTime: 20,
    summary: "Statutory guidance on multi-agency working to help, support and protect children. It helps staff understand how the school fits into the wider safeguarding system.",
    focusPoints: [
      "Safeguarding is a shared responsibility across agencies.",
      "Help and protection should be child-centred and timely.",
      "Schools are part of wider arrangements involving local authorities, health and police.",
      "Early support and effective information sharing can prevent concerns escalating."
    ],
    questions: [
      {
        question: "Why is Working Together relevant to school staff?",
        options: ["It replaces the school safeguarding policy", "It explains how safeguarding works across agencies and why schools must contribute to that system", "It applies only to police", "It removes the role of the DSL"],
        answer: 1,
        feedback: "Schools sit within a wider multi-agency safeguarding system; local school procedures remain essential."
      }
    ]
  },
  {
    id: "information-sharing-2026",
    courseIds: ["safeguarding-essentials"],
    title: "Information sharing to safeguard children and young people",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/information-sharing-to-safeguard-children-and-young-people",
    external: true,
    readTime: 15,
    summary: "Current statutory information-sharing guidance. The 2026 version supports appropriate, necessary and proportionate sharing where safeguarding requires it.",
    focusPoints: [
      "Use professional judgement and the school's approved safeguarding process.",
      "Share relevant information with people who need it for safeguarding purposes.",
      "Record what was shared, with whom, and the safeguarding rationale where required by procedure.",
      "Seek DSL or data-protection advice when uncertain rather than simply withholding information."
    ],
    questions: [
      {
        question: "Which approach best reflects safeguarding information sharing?",
        options: ["Never share without parental consent", "Share everything with all colleagues", "Share relevant information through authorised channels when safeguarding requires it", "Keep all concerns in personal notes"],
        answer: 2,
        feedback: "Safeguarding information should be shared through appropriate authorised channels, with relevance and proportionality in mind."
      }
    ]
  },
  {
    id: "filtering-monitoring-2026",
    courseIds: ["safeguarding-essentials"],
    title: "Filtering and monitoring: core standard",
    publisher: "Department for Education",
    url: "https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/filtering-and-monitoring-core-standard",
    external: true,
    readTime: 12,
    summary: "DfE's current standard for appropriate filtering and monitoring arrangements in schools and colleges, updated in September 2026.",
    focusPoints: [
      "Online safety is part of the school's safeguarding responsibility.",
      "Technical filtering does not remove the need for staff supervision and professional judgement.",
      "Staff should know how to report filtering or monitoring concerns.",
      "Leadership should understand roles, review arrangements and respond to identified gaps."
    ],
    questions: [
      {
        question: "What should staff do if they discover a gap in filtering or monitoring?",
        options: ["Assume IT already knows", "Share the material widely", "Report it promptly through the school's agreed route", "Ignore it if no pupil has complained"],
        answer: 2,
        feedback: "Known control gaps should be reported through the school's safeguarding/IT process so they can be assessed and addressed."
      }
    ]
  },
  {
    id: "school-safeguarding-documents",
    courseIds: ["safeguarding-essentials"],
    title: "Your school's safeguarding documents",
    publisher: "Your school",
    url: "/safeguarding/documents",
    external: false,
    readTime: 15,
    summary: "Use the school's live policy centre to connect statutory guidance with the exact local procedures staff must follow.",
    focusPoints: [
      "Locate the current child protection/safeguarding policy and its version.",
      "Confirm the DSL and deputy arrangements.",
      "Know the exact concern-recording and reporting system.",
      "Know the alternative route for a concern about an adult or the usual reporting person.",
      "Know the whistleblowing and escalation arrangements."
    ],
    questions: [
      {
        question: "Which information is most important to confirm locally?",
        options: ["Only the school's logo", "The DSL/deputy, reporting route, adult-concern route and current policy", "A colleague's preferred process", "An old policy saved on a personal device"],
        answer: 1,
        feedback: "Safeguarding becomes actionable when staff know the live local policy, people and reporting systems."
      }
    ]
  },
  {
    id: "eef-cognitive-science",
    courseIds: ["rosenshine-principles", "retrieval-practice", "cognitive-load-theory"],
    title: "Cognitive science approaches in the classroom",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-science-approaches-in-the-classroom",
    external: true,
    readTime: 20,
    summary: "EEF's evidence review covering classroom approaches informed by cognitive science, including memory, retrieval and cognitive load.",
    focusPoints: [
      "Treat cognitive-science principles as evidence-informed tools rather than fixed lesson scripts.",
      "Prior knowledge changes the amount of support a learner needs.",
      "Retrieval is most useful when aligned to important curriculum knowledge and followed by feedback.",
      "Reduce avoidable cognitive demand without removing the important thinking."
    ],
    questions: [
      {
        question: "What is the strongest way to use cognitive-science evidence in teaching?",
        options: ["Use every strategy in every lesson", "Apply relevant principles to a specific learning problem and check their effect", "Replace subject knowledge with generic memory tasks", "Avoid adapting for prior knowledge"],
        answer: 1,
        feedback: "The evidence is most useful when applied responsively to curriculum, pupil knowledge and task demands."
      }
    ]
  },
  {
    id: "eef-formative-assessment",
    courseIds: ["effective-questioning"],
    title: "Embedding Formative Assessment",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/projects-and-evaluation/promising-programmes/embedding-formative-assessment",
    external: true,
    readTime: 12,
    summary: "EEF material on formative assessment, including the use of discussions, questions and tasks to gather evidence of learning and adapt teaching.",
    focusPoints: [
      "Questions are useful when they generate evidence that changes the next teaching decision.",
      "Whole-class response routines can make understanding more visible.",
      "Formative assessment is a process, not a particular worksheet or questioning trick."
    ],
    questions: [
      {
        question: "What makes a question formative?",
        options: ["It is difficult", "It produces useful evidence that informs what happens next", "Only volunteers answer it", "It is always written"],
        answer: 1,
        feedback: "The key feature is that the response produces evidence which informs teaching or learning."
      }
    ]
  },
  {
    id: "eef-behaviour",
    courseIds: ["behaviour-management", "regulation-support-academy"],
    title: "Improving Behaviour in Schools",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/behaviour",
    external: true,
    readTime: 18,
    summary: "Evidence-informed guidance for developing clear, consistent and supportive approaches to behaviour in schools.",
    focusPoints: [
      "Know pupils and the influences on behaviour.",
      "Teach and reinforce clear routines rather than relying only on correction.",
      "Consistency and supportive relationships matter.",
      "Review approaches in context rather than assuming one strategy works for every pupil."
    ],
    questions: [
      {
        question: "Which approach is most consistent with evidence-informed behaviour practice?",
        options: ["Use a different routine every lesson", "Teach predictable routines and respond consistently while understanding pupil context", "Rely only on sanctions", "Assume the same response is right for every pupil"],
        answer: 1,
        feedback: "Strong behaviour practice combines clear routines, consistency and knowledge of pupils and context."
      }
    ]
  },
  {
    id: "eef-feedback",
    courseIds: ["effective-feedback"],
    title: "Teacher Feedback to Improve Pupil Learning",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback",
    external: true,
    readTime: 18,
    summary: "EEF guidance on the principles of effective feedback and the importance of ensuring pupils can act on it.",
    focusPoints: [
      "Start from strong initial instruction and clear learning goals.",
      "Feedback should move learning forward rather than merely describe performance.",
      "Method matters less than whether feedback is timely, focused and usable.",
      "Plan time and support for pupils to respond."
    ],
    questions: [
      {
        question: "When is feedback most likely to support learning?",
        options: ["When it is as long as possible", "When it identifies a useful next step and pupils can act on it", "When it is only a grade", "When every error gets equal attention"],
        answer: 1,
        feedback: "Feedback needs to be usable and followed by an opportunity to improve or reattempt."
      }
    ]
  },
  {
    id: "eef-metacognition",
    courseIds: ["metacognition-self-regulation"],
    title: "Metacognition and Self-Regulated Learning",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition",
    external: true,
    readTime: 20,
    summary: "The updated EEF guidance on helping pupils plan, monitor and evaluate learning through explicit teaching, modelling and scaffolding.",
    focusPoints: [
      "Teach strategies explicitly within subject content.",
      "Model expert thinking and decision-making.",
      "Prompt pupils to plan, monitor and evaluate.",
      "Fade scaffolds as learners become increasingly independent."
    ],
    questions: [
      {
        question: "Where are metacognitive strategies most useful?",
        options: ["As generic activities separate from curriculum", "Embedded in subject learning and explicitly modelled", "Only at revision time", "Only for high-attaining pupils"],
        answer: 1,
        feedback: "EEF emphasises teaching and modelling metacognitive strategies within curriculum and subject contexts."
      }
    ]
  },
  {
    id: "eef-send",
    courseIds: ["adaptive-teaching", "send-inclusive-practice", "regulation-support-academy"],
    title: "Special Educational Needs in Mainstream Schools",
    publisher: "Education Endowment Foundation",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/send",
    external: true,
    readTime: 20,
    summary: "EEF guidance focused on high-quality teaching, understanding individual needs and using evidence-informed support for pupils with SEND.",
    focusPoints: [
      "Pupils with SEND benefit from excellent everyday teaching.",
      "Start with the pupil and the barrier rather than assuming a strategy from a label.",
      "Use targeted support where it adds value to strong classroom teaching.",
      "Review whether support improves participation, learning and independence."
    ],
    questions: [
      {
        question: "What is the strongest starting point for an adaptation?",
        options: ["The diagnostic label alone", "The intended learning, the individual pupil and the specific barrier", "A permanently easier objective", "A separate worksheet for every pupil"],
        answer: 1,
        feedback: "Good adaptation begins with ambitious learning and a precise understanding of the barrier and the pupil."
      }
    ]
  },
  {
    id: "dfe-health-safety-schools",
    courseIds: ["health-safety-essentials-schools"],
    title: "Health and safety: responsibilities and duties for schools",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/health-and-safety-advice-for-schools/responsibilities-and-duties-for-schools",
    external: true,
    readTime: 15,
    summary: "DfE guidance describing school health-and-safety responsibilities, proportionate risk management and the importance of local arrangements.",
    focusPoints: [
      "Health and safety should be managed proportionately and through the school's arrangements.",
      "Staff need information and training appropriate to their role.",
      "Risk assessment should support sensible activity rather than remove all risk.",
      "Local policies and competent advice remain essential."
    ],
    questions: [
      {
        question: "What is the purpose of proportionate school risk management?",
        options: ["Remove every possible risk", "Support safe activity by identifying significant risks and suitable controls", "Leave all decisions to individual staff", "Replace local policies"],
        answer: 1,
        feedback: "Proportionate risk management focuses on significant risks and practical controls while enabling normal school activity."
      }
    ]
  },
  {
    id: "dfe-allergy-safety-2026",
    courseIds: ["allergy-safety-schools-2026"],
    title: "Allergy safety in schools",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/allergy-safety-in-schools",
    external: true,
    readTime: 20,
    summary: "Statutory 2026 guidance on school allergy-safety policies, staff training, individual healthcare planning and learning from serious incidents and near misses.",
    focusPoints: [
      "Covered schools need an allergy-safety policy that is reviewed and publicised.",
      "Allergy-safety training should be put in place for staff.",
      "Individual Healthcare Plans are important for pupils who require them.",
      "Schools should learn from serious incidents and near misses."
    ],
    questions: [
      {
        question: "Which action is part of the 2026 allergy-safety approach?",
        options: ["Keep allergy arrangements informal", "Maintain and review a school allergy-safety policy and train staff", "Leave all responsibility to pupils", "Use one generic plan for every pupil"],
        answer: 1,
        feedback: "The statutory guidance emphasises a school policy, training and pupil-specific arrangements where needed."
      }
    ]
  }
];

export function readingsForCourse(courseId: string) {
  return courseReadings.filter(reading => reading.courseIds.includes(courseId));
}

export const courseIdsWithReadings = Array.from(new Set(courseReadings.flatMap(reading => reading.courseIds)));
