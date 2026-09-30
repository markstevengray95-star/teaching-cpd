import type { Course } from "./data";
import { getPhase16AdventurePack } from "./courseBranchingAdventurePhase16";

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function phase16AdventureAnchorId(course: Course) {
  return `overhaul9-synthesis-${safeId(course.id)}-commit`;
}

export function validateBranchingAdventurePhase16Runtime(course: Course) {
  const pack = getPhase16AdventurePack(course);
  const anchor = phase16AdventureAnchorId(course);
  if (!course.modules.some(module => module.id === anchor)) throw new Error(`Phase 16 ${course.id}: final professional commitment anchor is missing`);
  if (pack.states.length < 11) throw new Error(`Phase 16 ${course.id}: adventure graph is too small`);
  const start = pack.states.find(state => state.id === "start");
  if (!start || start.choices.length !== 3 || new Set(start.choices.map(item => item.next)).size !== 3) throw new Error(`Phase 16 ${course.id}: opening must create three genuine branches`);
  const consequenceStates = pack.states.filter(state => state.chapter === 2);
  if (consequenceStates.length !== 3 || consequenceStates.some(state => state.choices.length !== 3 || new Set(state.choices.map(item => item.next)).size !== 3)) throw new Error(`Phase 16 ${course.id}: each consequence route must branch again`);
  const pressureStates = pack.states.filter(state => state.chapter === 3);
  if (pressureStates.length !== 3 || pressureStates.some(state => state.choices.length !== 3)) throw new Error(`Phase 16 ${course.id}: pressure routes are incomplete`);
  const endings = pack.states.filter(state => state.chapter === 4);
  if (endings.length !== 4 || endings.some(state => state.choices.length)) throw new Error(`Phase 16 ${course.id}: four terminal endings are required`);
  const stateIds = new Set(pack.states.map(state => state.id));
  for (const state of pack.states) for (const item of state.choices) {
    if (!stateIds.has(item.next)) throw new Error(`Phase 16 ${course.id}: ${state.id}/${item.id} has a broken next-state link`);
    if (!item.feedback.trim() || !item.consequence.trim()) throw new Error(`Phase 16 ${course.id}: ${state.id}/${item.id} needs feedback and a persistent consequence`);
  }
  return true;
}

export function auditBranchingAdventurePhase16Runtime(course: Course) {
  const pack = getPhase16AdventurePack(course);
  let ready = true;
  try { validateBranchingAdventurePhase16Runtime(course); } catch { ready = false; }
  const choices = pack.states.reduce((sum, state) => sum + state.choices.length, 0);
  const start = pack.states.find(state => state.id === "start");
  const distinctFirstBranches = start ? new Set(start.choices.map(item => item.next)).size : 0;
  const consequenceBranches = pack.states.filter(state => state.chapter === 2 && new Set(state.choices.map(item => item.next)).size === 3).length;
  const endings = pack.states.filter(state => state.chapter === 4).length;
  const score = Math.min(100,
    (course.modules.some(module => module.id === phase16AdventureAnchorId(course)) ? 20 : 0) +
    (pack.states.length >= 11 ? 15 : 0) +
    (choices >= 21 ? 15 : 0) +
    (distinctFirstBranches === 3 ? 15 : 0) +
    (consequenceBranches === 3 ? 15 : 0) +
    (endings === 4 ? 10 : 0) +
    (ready ? 10 : 0)
  );
  return { courseId: course.id, title: course.title, states: pack.states.length, choices, distinctFirstBranches, consequenceBranches, endings, ready, score };
}

export function summariseBranchingAdventurePhase16Runtime(courses: Course[]) {
  const reports = courses.map(auditBranchingAdventurePhase16Runtime);
  return {
    courseCount: reports.length,
    ready: reports.filter(report => report.ready).length,
    totalAdventures: reports.length,
    totalStates: reports.reduce((sum, report) => sum + report.states, 0),
    totalChoices: reports.reduce((sum, report) => sum + report.choices, 0),
    totalEndings: reports.reduce((sum, report) => sum + report.endings, 0),
    averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    reports,
  };
}
