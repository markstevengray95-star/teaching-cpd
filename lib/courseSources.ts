import type { Course } from "./data";
import { isSafetyCourse } from "./classroomPractice";
export const learningToolsUpdated = "2026-10-01";
export const sourceDirectoryChecked = "2026-10-01";
type Source = { title: string; url: string; purpose: string };
const pd: Source = {title:"EEF — Effective Professional Development",url:"https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/effective-professional-development",purpose:"Background for the design of learning, practice and follow-up; not verification of every course statement."};
const implementation: Source = {title:"EEF — A School's Guide to Implementation",url:"https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/implementation",purpose:"Implementation planning and review background."};
export function courseSources(course: Course): Source[] {
  const sources: Source[] = [];
  if (/medical|allergy|first-aid/.test(course.id)) sources.push({title:"DfE — Supporting pupils with medical conditions at school",url:"https://www.gov.uk/government/publications/supporting-pupils-at-school-with-medical-conditions--3",purpose:"School medical-support arrangements. Individual plans, designated clinical advice and role-specific training remain essential."});
  if (isSafetyCourse(course)) sources.push({title:"HSE — Schools and education",url:"https://www.hse.gov.uk/education/",purpose:"School health and safety guidance and specialist topic links; use current local risk assessments and competent support."});
  else if (course.category === "Safeguarding") sources.push({title:"DfE — Keeping children safe in education",url:"https://www.gov.uk/government/publications/keeping-children-safe-in-education--2",purpose:"Current England statutory guidance; follow the applicable guidance and school safeguarding arrangements."});
  if (/gdpr|data-handling|data-protection/.test(course.id)) sources.push({title:"ICO — UK GDPR guidance and resources",url:"https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/",purpose:"Data protection reference. Use approved school data-handling and incident procedures."});
  if (course.category === "SEND" || /adaptive/.test(course.id)) sources.push({title:"EEF — Special Educational Needs in Mainstream Schools",url:"https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/send",purpose:"Evidence-informed inclusive teaching background."},{title:"DfE — SEND code of practice: 0 to 25 years",url:"https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",purpose:"England SEND statutory guidance; check applicability to your setting."});
  if (/retrieval|cognitive-load/.test(course.id)) sources.push({title:"EEF — Cognitive science approaches in the classroom",url:"https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-science-approaches-in-the-classroom",purpose:"Evidence review background for memory and classroom learning."});
  if (course.category === "Wellbeing") sources.push({title:"HSE — Stress and mental health at work",url:"https://www.hse.gov.uk/stress/",purpose:"Workplace stress reference; this course is not clinical advice."});
  if (course.category === "Digital Teaching") sources.push({title:"NCSC — Cyber Security for Schools",url:"https://www.ncsc.gov.uk/section/education-skills/cyber-security-schools",purpose:"School cyber-security guidance; a supporting reference, not a source for every teaching-tool claim."});
  return [...sources,pd,implementation];
}
