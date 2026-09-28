import type { Course, Module } from "./data";
import { FIRST_TEN_COURSE_IDS } from "./firstTenCourseQuality";

const firstTen = new Set<string>(FIRST_TEN_COURSE_IDS);
const isLearningSlide = (module: Module) => ["content", "visual", "quiz", "scenario"].includes(module.type);

function insertAfter<T>(items: T[], index: number, value: T) {
  const target = Math.max(0, Math.min(items.length, index + 1));
  items.splice(target, 0, value);
}

/**
 * The first QA pass removes filler and chooses strong course-specific interactions.
 * This pass makes the resulting deck feel like a coherent presentation rather
 * than a block of reading followed by a block of activities.
 */
export function polishFirstTenCourseFlow(course: Course): Course {
  if (!firstTen.has(course.id)) return course;

  const overview = course.modules[0];
  const reflection = course.modules.at(-1);
  if (!overview || !reflection) return course;

  const middle = course.modules.slice(1, -1);
  const learning = middle.filter(isLearningSlide);
  const activities = middle.filter(module => module.type === "activity");
  const checklists = middle.filter(module => module.type === "checklist");

  const firstContent = learning.findIndex(module => module.type === "content");
  if (firstContent > 0) {
    const [content] = learning.splice(firstContent, 1);
    learning.unshift(content);
  }

  const journey = [...learning];
  const finalActivity = activities.at(-1);
  const earlierActivities = finalActivity ? activities.slice(0, -1) : activities;
  const generatedChecklistId = `presentation-${course.id}-check`;
  const finalChecklist = checklists.find(module => module.id === generatedChecklistId) || checklists.at(-1);
  const earlierChecklists = finalChecklist ? checklists.filter(module => module !== finalChecklist) : checklists;

  earlierActivities.forEach((activity, activityIndex) => {
    const fraction = earlierActivities.length === 1 ? 0.58 : 0.5 + (activityIndex / Math.max(1, earlierActivities.length - 1)) * 0.24;
    const anchor = Math.max(1, Math.floor(Math.max(1, journey.length - 1) * fraction));
    insertAfter(journey, anchor, activity);
  });

  earlierChecklists.forEach((checklist, checklistIndex) => {
    const fraction = 0.72 + (checklistIndex / Math.max(1, earlierChecklists.length)) * 0.12;
    const anchor = Math.max(1, Math.floor(Math.max(1, journey.length - 1) * fraction));
    insertAfter(journey, anchor, checklist);
  });

  return {
    ...course,
    modules: [
      overview,
      ...journey,
      ...(finalActivity ? [finalActivity] : []),
      ...(finalChecklist ? [finalChecklist] : []),
      reflection,
    ],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateModuleInteraction(course: Course, module: Module) {
  const prefix = `First-ten interaction QA failed for ${course.id}/${module.id}:`;

  assert(module.id.trim().length > 0 && module.title.trim().length > 0, `${prefix} missing id or title`);

  if (module.type === "quiz") {
    assert(module.options.length >= 3, `${prefix} quiz needs at least three options`);
    assert(Number.isInteger(module.answer) && module.answer >= 0 && module.answer < module.options.length, `${prefix} answer index is invalid`);
    assert(module.options.every(option => option.trim().length > 0), `${prefix} quiz has an empty option`);
    assert(new Set(module.options.map(option => option.trim().toLowerCase())).size === module.options.length, `${prefix} quiz options are duplicated`);
    assert(module.feedback.trim().length >= 10, `${prefix} quiz feedback is too thin`);
  }

  if (module.type === "scenario") {
    assert(module.prompt.trim().length >= 20, `${prefix} scenario prompt is too thin`);
    assert(module.options.length >= 3, `${prefix} scenario needs at least three choices`);
    assert(module.options.every(option => option.label.trim().length >= 3 && option.feedback.trim().length >= 10), `${prefix} scenario choice or feedback is incomplete`);
    assert(new Set(module.options.map(option => option.label.trim().toLowerCase())).size === module.options.length, `${prefix} scenario choices are duplicated`);
  }

  if (module.type === "activity") {
    const threshold = module.minimumCharacters ?? 30;
    assert(module.prompt.trim().length >= 20, `${prefix} activity prompt is too thin`);
    assert(module.instructions.length >= 3 && module.instructions.every(step => step.trim().length >= 5), `${prefix} activity steps are incomplete`);
    assert(threshold >= 30 && threshold <= 500, `${prefix} response threshold would make the interaction too weak or impractical`);
  }

  if (module.type === "checklist") {
    assert(module.items.length >= 4, `${prefix} checklist needs at least four items`);
    assert(module.items.every(item => item.trim().length >= 5), `${prefix} checklist has an incomplete item`);
    assert(new Set(module.items.map(item => item.trim().toLowerCase())).size === module.items.length, `${prefix} checklist contains duplicate items`);
  }

  if (module.type === "visual") {
    assert(module.items.length >= 2, `${prefix} visual has too few items`);
    assert(module.items.every(item => item.heading.trim().length > 0 && item.text.trim().length > 0), `${prefix} visual contains an incomplete card`);
  }

  if (module.type === "content") assert(module.body.trim().length >= 30, `${prefix} content slide is too thin`);
  if (module.type === "reflection") assert(module.prompt.trim().length >= 20, `${prefix} reflection prompt is too thin`);
}

export function validateFirstTenCourseFlow(course: Course) {
  if (!firstTen.has(course.id)) return;
  const prefix = `First-ten flow QA failed for ${course.id}:`;
  const ids = course.modules.map(module => module.id);

  assert(new Set(ids).size === ids.length, `${prefix} duplicate slide ids`);
  assert(course.modules[0]?.type === "visual" && course.modules[0].id.endsWith("-map"), `${prefix} slide 1 must be the presentation overview`);
  assert(course.modules[1]?.type === "content", `${prefix} slide 2 must teach core content before testing decisions`);
  assert(course.modules.at(-1)?.type === "reflection", `${prefix} final slide must be reflection`);
  assert(course.modules.at(-2)?.type === "checklist", `${prefix} penultimate slide must be the final readiness check`);
  assert(course.modules.at(-3)?.type === "activity", `${prefix} the final practice activity must come before readiness and reflection`);

  const firstInteraction = course.modules.findIndex((module, index) => index > 1 && ["quiz", "scenario"].includes(module.type));
  assert(firstInteraction >= 2 && firstInteraction <= 7, `${prefix} learners go too long before the first decision/knowledge interaction`);

  let passiveRun = 0;
  let activityRun = 0;
  let checklistRun = 0;
  for (const module of course.modules) {
    validateModuleInteraction(course, module);
    passiveRun = ["content", "visual"].includes(module.type) ? passiveRun + 1 : 0;
    activityRun = module.type === "activity" ? activityRun + 1 : 0;
    checklistRun = module.type === "checklist" ? checklistRun + 1 : 0;
    assert(passiveRun <= 6, `${prefix} more than six passive slides appear consecutively near ${module.id}`);
    assert(activityRun <= 1, `${prefix} activities are bunched together near ${module.id}`);
    assert(checklistRun <= 1, `${prefix} checklists are bunched together near ${module.id}`);
  }

  const interactiveCount = course.modules.filter(module => ["quiz", "scenario", "activity", "checklist", "reflection"].includes(module.type)).length;
  assert(interactiveCount >= 5, `${prefix} presentation needs at least five active/reflection moments`);
}

export function validateFirstTenOrderAfterFlow(courses: Course[]) {
  const actual = courses.slice(0, 10).map(course => course.id);
  assert(actual.join("|") === FIRST_TEN_COURSE_IDS.join("|"), `First-ten order changed after flow QA: ${actual.join(", ")}`);
}
