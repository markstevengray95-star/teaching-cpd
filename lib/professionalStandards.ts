export type ProfessionalStandard = {
  code: string;
  framework: string;
  title: string;
  summary: string;
  courseIds: string[];
};

export const professionalStandards: ProfessionalStandard[] = [
  { code: "TS1", framework: "Teachers' Standards (England)", title: "High expectations", summary: "Create a safe, purposeful climate with ambitious expectations for pupils.", courseIds: ["behaviour-routines","behaviour-management","supporting-high-attainers","adaptive-teaching"] },
  { code: "TS2", framework: "Teachers' Standards (England)", title: "Promote pupil progress", summary: "Use prior learning, challenge and evidence to help pupils make progress over time.", courseIds: ["retrieval-practice","assessment-for-learning","metacognition-self-regulation","curriculum-sequencing"] },
  { code: "TS3", framework: "Teachers' Standards (England)", title: "Subject and curriculum knowledge", summary: "Develop secure subject knowledge, curriculum understanding and disciplinary literacy.", courseIds: ["disciplinary-literacy","curriculum-sequencing","effective-explanations","worked-examples-modelling"] },
  { code: "TS4", framework: "Teachers' Standards (England)", title: "Well-structured lessons", summary: "Plan coherent learning, explanations, modelling, practice and review.", courseIds: ["rosenshine-principles","worked-examples-modelling","effective-explanations","retrieval-practice"] },
  { code: "TS5", framework: "Teachers' Standards (England)", title: "Adapt teaching", summary: "Identify barriers and adapt access while maintaining appropriate ambition.", courseIds: ["adaptive-teaching","send-inclusive-practice","autism-inclusive-classroom","adhd-classroom-strategies","dyslexia-classroom-support","eal-inclusive-teaching"] },
  { code: "TS6", framework: "Teachers' Standards (England)", title: "Use assessment effectively", summary: "Elicit useful evidence, interpret responses and adapt teaching or feedback accordingly.", courseIds: ["assessment-for-learning","checking-for-understanding","effective-questioning","effective-feedback"] },
  { code: "TS7", framework: "Teachers' Standards (England)", title: "Manage behaviour effectively", summary: "Teach routines, respond consistently and protect a calm climate for learning.", courseIds: ["behaviour-routines","behaviour-management","de-escalation","trauma-informed-practice"] },
  { code: "TS8", framework: "Teachers' Standards (England)", title: "Wider professional responsibilities", summary: "Work constructively with colleagues, families and professional development processes.", courseIds: ["parent-communication","instructional-coaching","effective-feedback","middle-leadership","difficult-conversations"] },
  { code: "TS-P2", framework: "Teachers' Standards (England)", title: "Personal and professional conduct", summary: "Maintain professional boundaries, safeguarding responsibilities and appropriate conduct.", courseIds: ["safeguarding-essentials","online-safety","ai-in-education","effective-tutoring"] },
];

export const teachersStandardsSource = {
  title: "Teachers' Standards",
  url: "https://www.gov.uk/government/publications/teachers-standards",
  note: "Alignment is a professional-development aid, not a formal judgement against the Standards.",
};

export function standardsForCourse(courseId: string) {
  return professionalStandards.filter(standard => standard.courseIds.includes(courseId));
}
