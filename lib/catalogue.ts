import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";
import { expandedCourses } from "./courseExpansions";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";

const seededCourses = [...coreCourses, ...phase3Courses];
const replacementIds = new Set(expandedCourses.map(course => course.id));
export const courses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...expandedCourses];
