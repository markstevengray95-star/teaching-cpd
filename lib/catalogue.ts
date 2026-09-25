import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";
export const courses = [...coreCourses, ...phase3Courses];
