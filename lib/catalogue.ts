import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";
import { expandedCourses } from "./courseExpansions";
import { expandedCoursesBatch2 } from "./courseExpansionBatch2";
import { additionalCourses } from "./additionalCourses";
import { schoolCoursesBatch1 } from "./schoolCoursesBatch1";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";

const seededCourses = [...coreCourses, ...phase3Courses];
const replacementMap = new Map(
  [...expandedCourses, ...expandedCoursesBatch2, ...additionalCourses, ...schoolCoursesBatch1].map(course => [course.id, course] as const),
);
const replacementIds = new Set(replacementMap.keys());
const replacements = [...replacementMap.values()];
export const courses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements];
