import { courseReadings, type CourseReading } from "./courseReadingLibrary";
import { additionalCourseReadings, expandReadingQuestions } from "./courseReadingExpansion";
import { complianceReadingExpansion2026, expandReadingQuestions2026 } from "./courseReadingExpansion2";

const latest2026Readings: CourseReading[] = [
  {
    id: "safe-generative-ai-education-2026",
    courseIds: ["safeguarding-essentials", "ai-in-education"],
    title: "Safe use of generative AI in education: module 3",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/safe-use-of-generative-ai-in-education-module-3",
    external: true,
    readTime: 15,
    summary: "DfE support material updated for 2026 to 2027 on safeguarding, data, ethics and other risks when education staff use generative AI.",
    focusPoints: [
      "AI use should be planned and aligned with school safeguarding and data-protection arrangements.",
      "Staff remain responsible for professional decisions and checking outputs.",
      "Sensitive safeguarding or pupil information should only be handled through approved systems.",
      "Online-safety and safeguarding risks should be considered before a tool is introduced into practice.",
    ],
    questions: [
      {
        question: "What is the strongest approach when introducing a generative AI tool into school practice?",
        options: [
          "Use it first and consider safeguarding later",
          "Check the educational purpose, safeguarding, data and school-policy implications before use",
          "Assume a well-known tool is automatically approved",
          "Let the tool make safeguarding decisions independently",
        ],
        answer: 1,
        feedback: "DfE guidance emphasises planned, safe use aligned with safeguarding, data protection and school policy.",
      },
      {
        question: "Who remains responsible for the professional decision after an AI tool produces an answer?",
        options: ["The AI provider", "The pupil", "The member of staff or setting using the output", "Nobody if the tool is automated"],
        answer: 2,
        feedback: "AI can assist a task, but professional responsibility for checking and using the output remains with staff and the setting.",
      },
    ],
  },
];

export const allCourseReadings: CourseReading[] = [
  ...courseReadings,
  ...additionalCourseReadings,
  ...latest2026Readings,
  ...complianceReadingExpansion2026,
]
  .map(expandReadingQuestions)
  .map(expandReadingQuestions2026)
  .filter((reading, index, all) => all.findIndex(item => item.id === reading.id) === index);

export function readingsForCourse(courseId: string) {
  return allCourseReadings.filter(reading => reading.courseIds.includes(courseId));
}

export function courseIdsWithReadings() {
  return Array.from(new Set(allCourseReadings.flatMap(reading => reading.courseIds)));
}
