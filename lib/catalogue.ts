import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";
import { expandedCourses } from "./courseExpansions";
import { expandedCoursesBatch2 } from "./courseExpansionBatch2";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";

const seededCourses = [...coreCourses, ...phase3Courses];
const replacements = [...expandedCourses, ...expandedCoursesBatch2];
const replacementIds = new Set(replacements.map(course => course.id));
export const courses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements];
