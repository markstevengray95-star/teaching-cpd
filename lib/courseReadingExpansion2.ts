import type { CourseReading, ReadingQuestion } from "./courseReadingLibrary";

const extraQuestions: Record<string, ReadingQuestion[]> = {
  "dfe-allergy-safety-2026": [
    {
      question: "What should a school do with its allergy-safety policy?",
      options: [
        "Keep it informal and unpublished",
        "Create, publish and review it as part of the school's allergy-safety arrangements",
        "Replace every pupil-specific plan with the policy",
        "Use it only after an incident",
      ],
      answer: 1,
      feedback: "The 2026 statutory guidance expects covered schools to create, publish and review an allergy-safety policy alongside staff training and pupil-specific planning where needed.",
    },
    {
      question: "Why are near misses relevant to allergy safety?",
      options: [
        "They are only useful for insurance",
        "They can reveal weaknesses in arrangements before a more serious incident occurs",
        "They should never be recorded",
        "They replace Individual Healthcare Plans",
      ],
      answer: 1,
      feedback: "The statutory guidance explicitly includes learning from serious incidents and near misses so controls and communication can be improved.",
    },
  ],
};

export const complianceReadingExpansion2026: CourseReading[] = [
  {
    id: "attendance-statutory-guidance-2026",
    courseIds: ["safeguarding-essentials"],
    title: "Working together to improve school attendance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/working-together-to-improve-school-attendance",
    external: true,
    readTime: 18,
    summary: "Statutory attendance guidance updated in July 2026. For safeguarding CPD, the key learning is that attendance information can form part of a wider picture of need and should connect with the school's pastoral and safeguarding systems rather than being interpreted in isolation.",
    focusPoints: [
      "Attendance is a shared school, trust and local-authority responsibility with clear roles and records.",
      "Persistent or severe absence should prompt appropriate support rather than a single-cause assumption.",
      "Attendance information may contribute to a wider safeguarding picture when combined with other concerns.",
      "Staff should use the school's attendance, pastoral and safeguarding routes rather than diagnosing the reason for absence themselves.",
    ],
    questions: [
      {
        question: "What is the strongest response to a concerning pattern of absence alongside other welfare information?",
        options: [
          "Assume the cause from attendance alone",
          "Record and share the relevant information through the school's attendance/pastoral and safeguarding arrangements",
          "Wait until the pupil explains everything",
          "Keep a private record outside school systems",
        ],
        answer: 1,
        feedback: "Attendance can contribute to a wider professional picture. Staff should use authorised school systems and safeguarding routes rather than infer a cause from absence alone.",
      },
      {
        question: "Which statement best reflects the statutory attendance approach?",
        options: [
          "Attendance is only an administrative issue",
          "Schools should understand barriers, support pupils and families, and use the appropriate statutory and safeguarding processes",
          "Every absence has the same cause",
          "Classroom staff should investigate families independently",
        ],
        answer: 1,
        feedback: "The guidance combines clear attendance responsibilities with support and proportionate action. Safeguarding concerns should be handled through the school's safeguarding arrangements.",
      },
    ],
  },
  {
    id: "medical-conditions-statutory-guidance",
    courseIds: ["medical-conditions-schools"],
    title: "Supporting pupils with medical conditions at school",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/supporting-pupils-at-school-with-medical-conditions--3",
    external: true,
    readTime: 18,
    summary: "The statutory guidance that remains in force for supporting pupils with medical conditions. It focuses on policy, individual arrangements, staff responsibilities and enabling pupils to participate safely in school life.",
    focusPoints: [
      "Know the school's medical-conditions policy and the responsibilities relevant to your role.",
      "Individual Healthcare Plans can coordinate pupil-specific needs where they are required.",
      "Staff should only carry out medical tasks for which the school's arrangements and required training authorise them.",
      "Support should enable safe participation in education, trips and wider school activities.",
    ],
    questions: [
      {
        question: "What should a member of staff do if asked to perform a medical task outside their training or authorised role?",
        options: [
          "Attempt it anyway",
          "Use the school's escalation arrangements to obtain an appropriately trained or authorised response",
          "Ask another pupil to do it",
          "Ignore the pupil's plan",
        ],
        answer: 1,
        feedback: "Safe support depends on clear responsibilities, appropriate training and following the school's policy and individual arrangements.",
      },
      {
        question: "What is the purpose of an Individual Healthcare Plan where one is required?",
        options: [
          "To replace the school's policy",
          "To coordinate relevant pupil-specific support and responsibilities",
          "To publish private medical information to all staff",
          "To remove the pupil from normal school activities",
        ],
        answer: 1,
        feedback: "An IHP helps coordinate pupil-specific arrangements while information is shared appropriately and proportionately with those who need it.",
      },
    ],
  },
  {
    id: "school-security-guidance-2026",
    courseIds: ["school-security-emergency-awareness"],
    title: "School and college security guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-and-college-security/school-and-college-security",
    external: true,
    readTime: 18,
    summary: "DfE guidance updated in July 2026 on sensible, proportionate school security policies and plans. The training focus is staff awareness of local arrangements, communication and reporting rather than publishing sensitive site-specific operational detail.",
    focusPoints: [
      "Security policy should complement safeguarding and wider health-and-safety arrangements.",
      "Plans should be based on a realistic assessment of risks relevant to the individual setting.",
      "Staff should understand the local procedures and responsibilities that apply to them.",
      "Schools should review arrangements as circumstances, risks and lessons learned change.",
    ],
    questions: [
      {
        question: "How should school security arrangements be designed?",
        options: [
          "Use the same plan for every setting regardless of context",
          "Use a realistic, proportionate assessment of the setting's relevant risks and local procedures",
          "Leave security entirely to individual staff preference",
          "Keep staff unaware of all local procedures",
        ],
        answer: 1,
        feedback: "DfE guidance emphasises sensible, proportionate arrangements based on the individual setting and clear local responsibilities.",
      },
      {
        question: "How should security policy relate to safeguarding?",
        options: [
          "They should be completely separate",
          "Security arrangements should complement safeguarding and other safety policies",
          "Security replaces safeguarding",
          "Safeguarding applies only online",
        ],
        answer: 1,
        feedback: "The security guidance explicitly describes security arrangements as part of a wider suite of policies, including safeguarding and health and safety.",
      },
    ],
  },
];

export function expandReadingQuestions2026(reading: CourseReading): CourseReading {
  const additions = extraQuestions[reading.id] || [];
  if (!additions.length) return reading;
  return { ...reading, questions: [...reading.questions, ...additions] };
}
