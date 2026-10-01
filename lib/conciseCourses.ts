import type { Course } from "./data";

// Keep the teaching and assessment intact. Repeated scaffolding and the second
// practice sequence remain available in the extended version, with original IDs.
export function conciseCourse(course: Course): Course {
  const id = course.id.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const optionalIds = new Set([
    `phase3-present-${id}-hook`,
    `overhaul1-cycle-${id}-overview`,
    `overhaul10-archetype-${id}-identity`,
    `overhaul11-mission-${id}`,
    `overhaul2-process-${id}-1`,
    `overhaul2-process-${id}-2`,
    `overhaul2-process-${id}-3`,
    `overhaul3-workshop-${id}-match`,
    `overhaul3-workshop-${id}-rank`,
    `overhaul1-cycle-${id}-2-activity`,
    `overhaul1-cycle-${id}-4-activity`,
    `overhaul12-sim-${id}-2`,
    `overhaul9-synthesis-${id}-brief`,
    `overhaul9-synthesis-${id}-commit`,
  ]);
  const modules = course.modules.filter(module =>
    !optionalIds.has(module.id)
    && !module.id.startsWith(`overhaul1-checkpoint-${id}-`)
    && !module.id.startsWith(`overhaul6-engagement-${id}-`)
    && !module.id.startsWith(`overhaul4-case-${id}-2-`)
  );
  if (modules.length === course.modules.length) return course;
  return {
    ...course,
    modules,
    duration: Math.max(1, Math.round(course.duration * modules.length / course.modules.length)),
  };
}

export function completedModuleCount(course: Course, completedIds: readonly string[]): number {
  const completed = new Set(completedIds);
  return course.modules.filter(module => completed.has(module.id)).length;
}

