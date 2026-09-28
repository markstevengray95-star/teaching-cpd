import type { Course } from "./data";

export function openCourseWithPresentationOverview(course: Course): Course {
  const presentationIndex = course.modules.findIndex(module => module.id.startsWith("presentation-") && module.id.endsWith("-map"));
  if (presentationIndex <= 0) return course;
  const modules = [...course.modules];
  const [overview] = modules.splice(presentationIndex, 1);
  modules.unshift(overview);
  return { ...course, modules };
}
