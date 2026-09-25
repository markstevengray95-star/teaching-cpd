import { courses as coreCourses, categoryOrder } from "@/lib/data";
import { phase3Courses } from "@/lib/phase3Courses";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "@/lib/data";
export const courses = [...coreCourses, ...phase3Courses];
