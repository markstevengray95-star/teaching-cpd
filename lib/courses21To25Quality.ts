import type { Course } from "./data";

export function validateCourses21To25Order(courses: Course[]) {
  const actual = courses.slice(20, 25).map(course => course.id);
  throw new Error(`COURSES_21_25_PROBE: ${actual.join(", ")}`);
}
