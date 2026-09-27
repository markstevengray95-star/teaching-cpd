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
import { enhanceMainCourse } from "./mainCourseEnhancement";
import { addFlagshipFacilitatorPack } from "./mainCourseFacilitatorEnhancement";
import { structureFlagshipCourse } from "./flagshipCourseMaterials";
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
}

export const courses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements]
  .map(enrichCourseWithVisuals)
  .map(enhanceMainCourse)
  .map(addFlagshipFacilitatorPack)
  .map(structureFlagshipCourse);

courses.forEach(validateCourse);
