import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";
import { expandedCourses } from "./courseExpansions";
import { expandedCoursesBatch2 } from "./courseExpansionBatch2";
import { additionalCourses } from "./additionalCourses";
import { schoolCoursesBatch1 } from "./schoolCoursesBatch1";
import { schoolCoursesBatch2 } from "./schoolCoursesBatch2";
import { schoolCoursesBatch3 } from "./schoolCoursesBatch3";
import { schoolCoursesBatch4 } from "./schoolCoursesBatch4";
import { schoolCoursesBatch5 } from "./schoolCoursesBatch5";
import { deepTeachingCourses } from "./deepTeachingCourses";
import { deepTeachingCourses2 } from "./deepTeachingCourses2";
import { safeguardingIntegratedCourse } from "./safeguardingIntegratedCourse";
import { enrichCourseWithVisuals } from "./courseVisualEnrichment";
import { deepenSafeguarding2026 } from "./safeguardingDepth2026";
import { addAdvancedSafeguarding2026 } from "./safeguardingAdvanced2026";
import { addSafeguardingPractice2026 } from "./safeguardingPractice2026";
import { addSafeguardingGuidedStudy2026 } from "./safeguardingGuidedStudy2026";
import { addSafeguardingPresentationDepth2026 } from "./safeguardingPresentationDepth2026";
import { enhanceMainCourse } from "./mainCourseEnhancement";
import { addFlagshipFacilitatorPack } from "./mainCourseFacilitatorEnhancement";
import { structureFlagshipCourse } from "./flagshipCourseMaterials";
import { addCourseVisualDepth } from "./courseVisualDepth";
import { addCourseVisualStoryboards } from "./courseVisualStoryboards";
import { addCourseSpecificVisualStoryboards } from "./courseVisualStoryboards2";
import { addCourseDeepPractice } from "./courseDeepPractice";
import { addCourseDeepPractice2 } from "./courseDeepPractice2";
import { addCourseDeepPractice3 } from "./courseDeepPractice3";
import { structureCourseAsPresentation } from "./coursePresentationStructure";
import { boostCourseEngagement } from "./courseEngagementBoost";
import { openCourseWithPresentationOverview } from "./coursePresentationOrder";
import { qualityAssureFirstTenCourse, validateFirstTenCatalogueOrder, validateFirstTenCourseQuality } from "./firstTenCourseQuality";
import { polishFirstTenCourseFlow, validateFirstTenCourseFlow, validateFirstTenOrderAfterFlow } from "./firstTenCourseFlowAudit";
import { qualityAssureNextFiveCourse, validateNextFiveCatalogueOrder, validateNextFiveCourseQuality } from "./nextFiveCourseQuality";
import { qualityAssureCourses16To20, validateCourses16To20Order, validateCourses16To20Quality } from "./courses16To20Quality";
import { qualityAssureCourses21To25, validateCourses21To25Order, validateCourses21To25Quality } from "./courses21To25Quality";
import { qualityAssureCourses26To30, validateCourses26To30Order, validateCourses26To30Quality } from "./courses26To30Quality";
import { deepenRemainingCourse, validateRemainingCourseDepth } from "./remainingCourseDepth";
import { addRemainingPracticeStudio, validateRemainingPracticeStudio } from "./remainingCoursePracticeStudio";
import { qualityAssureRemainingCourse, validateRemainingCatalogue, validateRemainingCourseQuality } from "./remainingCourseQuality";
import { applyCourseTemplateFoundation, auditCatalogue, validateCourseAgainstQualityFramework } from "./courseQualityFramework";
import { deepenCourseContent2026, validateCourseContentDepth2026 } from "./courseContentDepth2026";
import { enhanceCoursePresentationPhase3, validateCoursePresentationPhase3, auditCoursePresentationPhase3 } from "./coursePresentationPhase3";
import { addAdvancedPracticePhase4, validateAdvancedPracticePhase4, auditAdvancedPracticePhase4 } from "./coursePracticePhase4";
import { addCourseAssessmentPhase5, validateCourseAssessmentPhase5, auditCourseAssessmentPhase5 } from "./courseAssessmentPhase5";
import { validateCourseFollowThroughPhase6, auditCourseFollowThroughPhase6 } from "./courseFollowThroughPhase6";
import type { Course } from "./data";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";
export { auditCourse, COURSE_TEMPLATE_STAGES, COURSE_TEMPLATE_VERSION } from "./courseQualityFramework";
export { auditCoursePresentationPhase3 } from "./coursePresentationPhase3";
export { auditAdvancedPracticePhase4 } from "./coursePracticePhase4";
export { auditCourseAssessmentPhase5 } from "./courseAssessmentPhase5";
export { auditCourseFollowThroughPhase6, getPhase6RetrievalQuestions, PHASE6_REVIEW_STAGES } from "./courseFollowThroughPhase6";

const seededCourses = [...coreCourses, ...phase3Courses];
const replacementMap = new Map(
  [
    ...expandedCourses,
    ...expandedCoursesBatch2,
    ...additionalCourses,
    ...schoolCoursesBatch1,
    ...schoolCoursesBatch2,
    ...schoolCoursesBatch3,
    ...schoolCoursesBatch4,
    ...schoolCoursesBatch5,
    ...deepTeachingCourses,
    ...deepTeachingCourses2,
    safeguardingIntegratedCourse,
  ].map(course => [course.id, course] as const),
);
const replacementIds = new Set(replacementMap.keys());
const replacements = [...replacementMap.values()];

function validateCourse(course: Course) {
  if (!course.id.trim() || !course.title.trim()) throw new Error("CPD course is missing an id or title");
  if (!course.modules.length) throw new Error(`CPD course ${course.id} has no modules`);
  const moduleIds = course.modules.map(module => module.id);
  if (new Set(moduleIds).size !== moduleIds.length) throw new Error(`CPD course ${course.id} contains duplicate module ids`);
  const interactiveTypes = new Set(["quiz", "scenario", "reflection", "checklist", "activity"]);
  if (!course.modules.some(module => interactiveTypes.has(module.type))) throw new Error(`CPD course ${course.id} needs at least one interactive or reflective module`);
  if (!course.modules.some(module => module.type === "visual")) throw new Error(`CPD course ${course.id} needs at least one visual explainer`);
  if (!(course.modules[0].id.startsWith("presentation-") && course.modules[0].id.endsWith("-map"))) throw new Error(`CPD course ${course.id} must open with its presentation overview`);
}

function standardiseCourseObjectives(course: Course): Course {
  const objectives: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const clean = value.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key) || objectives.length >= 6) return;
    seen.add(key);
    objectives.push(clean);
  };
  course.objectives.forEach(add);
  [
    `Apply the core principles of ${course.title} to a realistic school context`,
    "Identify appropriate evidence to judge whether the approach is working",
    "Plan a specific next step and review whether it should be kept, adapted or stopped",
  ].forEach(add);
  return { ...course, objectives: objectives.slice(0, Math.max(3, Math.min(6, objectives.length))) };
}

const qualityAssuredCourses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements]
  .map(enrichCourseWithVisuals)
  .map(deepenSafeguarding2026)
  .map(addAdvancedSafeguarding2026)
  .map(addSafeguardingPractice2026)
  .map(addSafeguardingGuidedStudy2026)
  .map(addSafeguardingPresentationDepth2026)
  .map(enhanceMainCourse)
  .map(addFlagshipFacilitatorPack)
  .map(structureFlagshipCourse)
  .map(addCourseVisualDepth)
  .map(addCourseVisualStoryboards)
  .map(addCourseSpecificVisualStoryboards)
  .map(addCourseDeepPractice)
  .map(addCourseDeepPractice2)
  .map(addCourseDeepPractice3)
  .map(structureCourseAsPresentation)
  .map(boostCourseEngagement)
  .map(openCourseWithPresentationOverview)
  .map(qualityAssureFirstTenCourse)
  .map(polishFirstTenCourseFlow)
  .map(qualityAssureNextFiveCourse)
  .map(qualityAssureCourses16To20)
  .map(qualityAssureCourses21To25)
  .map(qualityAssureCourses26To30)
  .map(qualityAssureRemainingCourse)
  .map(deepenRemainingCourse)
  .map(addRemainingPracticeStudio);

qualityAssuredCourses.forEach(validateCourse);
qualityAssuredCourses.forEach(validateFirstTenCourseQuality);
qualityAssuredCourses.forEach(validateFirstTenCourseFlow);
qualityAssuredCourses.forEach(validateNextFiveCourseQuality);
qualityAssuredCourses.forEach(validateCourses16To20Quality);
qualityAssuredCourses.forEach(validateCourses21To25Quality);
qualityAssuredCourses.forEach(validateCourses26To30Quality);
qualityAssuredCourses.forEach(validateRemainingCourseDepth);
qualityAssuredCourses.forEach(validateRemainingPracticeStudio);
qualityAssuredCourses.forEach(validateRemainingCourseQuality);
validateFirstTenCatalogueOrder(qualityAssuredCourses);
validateFirstTenOrderAfterFlow(qualityAssuredCourses);
validateNextFiveCatalogueOrder(qualityAssuredCourses);
validateCourses16To20Order(qualityAssuredCourses);
validateCourses21To25Order(qualityAssuredCourses);
validateCourses26To30Order(qualityAssuredCourses);
validateRemainingCatalogue(qualityAssuredCourses);

export const courses = qualityAssuredCourses
  .map(standardiseCourseObjectives)
  .map(applyCourseTemplateFoundation)
  .map(deepenCourseContent2026)
  .map(enhanceCoursePresentationPhase3)
  .map(addAdvancedPracticePhase4)
  .map(addCourseAssessmentPhase5);

courses.forEach(validateCourse);
courses.forEach(validateCourseAgainstQualityFramework);
courses.forEach(validateCourseContentDepth2026);
courses.forEach(validateCoursePresentationPhase3);
courses.forEach(validateAdvancedPracticePhase4);
courses.forEach(validateCourseAssessmentPhase5);
courses.forEach(validateCourseFollowThroughPhase6);

export const courseQualityAudit = auditCatalogue(courses);
export const coursePresentationAudit = courses.map(auditCoursePresentationPhase3);
export const coursePracticeAudit = courses.map(auditAdvancedPracticePhase4);
export const courseAssessmentAudit = courses.map(auditCourseAssessmentPhase5);
export const courseFollowThroughAudit = courses.map(auditCourseFollowThroughPhase6);
