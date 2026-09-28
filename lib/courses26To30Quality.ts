import type { Course } from "./data";

export function validateCourses26To30Order(courses: Course[]) {
  const actual = courses.slice(25, 30).map(course => course.id);
  throw new Error(`COURSES_26_30_PROBE: ${actual.join(", ")}`);
}
