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
import type { Course } from "./data";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";

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

export const courses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements]
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
  .map(qualityAssureCourses26To30);

courses.forEach(validateCourse);
courses.forEach(validateFirstTenCourseQuality);
courses.forEach(validateFirstTenCourseFlow);
courses.forEach(validateNextFiveCourseQuality);
courses.forEach(validateCourses16To20Quality);
courses.forEach(validateCourses21To25Quality);
courses.forEach(validateCourses26To30Quality);
validateFirstTenCatalogueOrder(courses);
validateFirstTenOrderAfterFlow(courses);
validateNextFiveCatalogueOrder(courses);
validateCourses16To20Order(courses);
validateCourses21To25Order(courses);
validateCourses26To30Order(courses);
