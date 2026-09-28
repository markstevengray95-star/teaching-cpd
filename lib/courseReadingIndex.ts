import { courseReadings, type CourseReading } from "./courseReadingLibrary";
import { additionalCourseReadings, expandReadingQuestions } from "./courseReadingExpansion";

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
  {
    id: "kcsie-2026-all-staff-overview",
    courseIds: ["safeguarding-essentials"],
    title: "KCSIE 2026: Part One overview for all staff",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/keeping-children-safe-in-education--2/part-one-overview-for-all-staff",
    external: true,
    readTime: 10,
    summary: "The DfE quick-reference overview covering core principles, immediate action, information sharing, recordkeeping, concerns about adults and whistleblowing. It complements but does not replace Part One.",
    focusPoints: [
      "All staff must still read KCSIE 2026 Part One in full.",
      "Act immediately on a safeguarding concern and follow the setting's child-protection policy.",
      "Safeguarding records should capture the concern, actions, decisions, rationale and outcomes.",
      "Use the setting's procedure for concerns about adults and know the whistleblowing route.",
    ],
    questions: [
      {
        question: "What does DfE say about the relationship between this overview and KCSIE Part One?",
        options: ["The overview replaces Part One", "Only DSLs need Part One", "The overview complements Part One but does not replace it", "Schools can choose either one"],
        answer: 2,
        feedback: "DfE is explicit that the overview is a companion quick reference; all staff must read Part One in full.",
      },
      {
        question: "Which set of details should a safeguarding record include according to the 2026 overview?",
        options: [
          "Only the pupil's name and date",
          "A summary, actions, decisions, rationale and outcomes",
          "Only the staff member's opinion",
          "Only information confirmed by an external agency",
        ],
        answer: 1,
        feedback: "The overview highlights a clear record of the concern, actions, decisions, rationale and outcomes.",
      },
    ],
  },
];

export const allCourseReadings: CourseReading[] = [...courseReadings, ...additionalCourseReadings, ...latest2026Readings]
  .map(expandReadingQuestions)
  .filter((reading, index, all) => all.findIndex(item => item.id === reading.id) === index);

export function readingsForCourse(courseId: string) {
  return allCourseReadings.filter(reading => reading.courseIds.includes(courseId));
}

export function courseIdsWithReadings() {
  return Array.from(new Set(allCourseReadings.flatMap(reading => reading.courseIds)));
}
