import type { Course, Module } from "./data";

/** Only identified template material is edited. Assessments and authored passages
 * are never selected by a keyword, category or a word-count target. */
export function isTemplateReading(module: Module): boolean {
  return module.type === "content" && /^(overhaul2-reading-|depth-2026-)/.test(module.id);
}

const wrapper = /^(quality-.+-course-brief$|mc-start-|route-guide-|glossary-|mc-misconceptions-|mc-resource-|fac-guide-)/;

export function editCourseContent(course: Course): Course {
  if (course.id.startsWith("short-")) return course;
  const modules = course.modules.flatMap(module => {
    // These five depth slides and three reading packs repeat category-level
    // advice, often padded to a minimum length. The course's authored readings,
    // subject examples, cases, checks and implementation tasks remain.
    if (isTemplateReading(module)) return [];
    if (module.type !== "content" || !wrapper.test(module.id) || module.title.startsWith("Reference · ")) return [module];
    // Preserve the useful vocabulary / course-specific resource points, but
    // remove the shared introduction which adds no teaching substance.
    const points = module.keyPoints?.filter(point => point.trim()) || [];
    if (!points.length) return [];
    return [{ ...module, title: "Reference · " + module.title, body: points.join("\n\n"), keyPoints: undefined }];
  });
  return { ...course, modules };
}
