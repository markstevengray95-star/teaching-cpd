import { courses } from "./catalogue";
import { pathways } from "./pathways";

export type AuditDomain = {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  pathwayIds: string[];
};

export const auditDomains: AuditDomain[] = [
  { id: "teaching", title: "Teaching & explanation", description: "Modelling, explanations, questioning and checking for understanding.", courseIds: ["effective-questioning","cognitive-load-theory","rosenshine-principles"], pathwayIds: ["excellent-teaching"] },
  { id: "memory", title: "Memory & retrieval", description: "Retrieval, spacing, practice and durable learning.", courseIds: ["retrieval-practice","metacognition-self-regulation"], pathwayIds: ["excellent-teaching"] },
  { id: "assessment", title: "Assessment & feedback", description: "Responsive assessment, feedback and adapting next steps.", courseIds: ["assessment-for-learning","effective-feedback"], pathwayIds: ["excellent-teaching"] },
  { id: "behaviour", title: "Behaviour & routines", description: "Calm routines, prevention, de-escalation and consistency.", courseIds: ["behaviour-routines","behaviour-management","de-escalation"], pathwayIds: ["ect-new-teacher","pastoral-development"] },
  { id: "send", title: "SEND & adaptive teaching", description: "Removing barriers while keeping ambitious learning goals.", courseIds: ["adaptive-teaching","send-inclusive-practice","autism-inclusive-classroom","adhd-classroom-strategies","dyslexia-classroom-support"], pathwayIds: ["send-champion"] },
  { id: "literacy", title: "Literacy & language", description: "Disciplinary literacy, EAL and explicit subject language.", courseIds: ["disciplinary-literacy","eal-inclusive-teaching","dyslexia-classroom-support"], pathwayIds: ["literacy-language"] },
  { id: "pastoral", title: "Pastoral & wellbeing", description: "Tutoring, pupil support, anxiety, safeguarding and communication.", courseIds: ["supporting-anxious-pupils","effective-tutoring","parent-communication","safeguarding-essentials"], pathwayIds: ["pastoral-development"] },
  { id: "leadership", title: "Leadership & coaching", description: "Leading teams, coaching, difficult conversations and curriculum coherence.", courseIds: ["middle-leadership","instructional-coaching","difficult-conversations","curriculum-sequencing"], pathwayIds: ["aspiring-middle-leader"] },
  { id: "digital", title: "Digital & AI practice", description: "Safe, purposeful use of technology and AI in professional work.", courseIds: ["ai-in-education","online-safety"], pathwayIds: ["digital-ai"] },
  { id: "challenge", title: "Challenge & high attainment", description: "Stretch, independence and maintaining appropriate cognitive challenge.", courseIds: ["supporting-high-attainers","metacognition-self-regulation"], pathwayIds: ["excellent-teaching"] }
];

export type AuditResult = {
  scores: Record<string, number>;
  priorities: AuditDomain[];
  courseIds: string[];
  pathwayIds: string[];
  summary: string;
};

export function calculateAudit(scores: Record<string, number>): AuditResult {
  const priorities = auditDomains
    .slice()
    .sort((a, b) => (scores[a.id] || 3) - (scores[b.id] || 3))
    .slice(0, 3);
  const validCourseIds = new Set(courses.map(c => c.id));
  const validPathwayIds = new Set(pathways.map(p => p.id));
  const courseIds = [...new Set(priorities.flatMap(p => p.courseIds))].filter(id => validCourseIds.has(id)).slice(0, 6);
  const pathwayIds = [...new Set(priorities.flatMap(p => p.pathwayIds))].filter(id => validPathwayIds.has(id)).slice(0, 3);
  const summary = priorities.length
    ? `Your strongest development opportunities are ${priorities.map(p => p.title).join(", ")}. Start with one manageable priority, complete relevant CPD, then test one change in practice and review its impact.`
    : "Complete the audit to generate a personal development focus.";
  return { scores, priorities, courseIds, pathwayIds, summary };
}
