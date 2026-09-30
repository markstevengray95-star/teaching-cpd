import type { Course } from "./data";
import { auditWorkshopActivityPhase3, PHASE3_WORKSHOP_KINDS } from "./courseWorkshopActivityPhase3";

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function indexOf(course: Course, id: string) {
  return course.modules.findIndex(module => module.id === id);
}

export function validateWorkshopActivityPhase3CycleAware(course: Course) {
  const audit = auditWorkshopActivityPhase3(course);
  if (audit.workshopActivities !== PHASE3_WORKSHOP_KINDS.length) throw new Error(`CPD course ${course.id} needs all ${PHASE3_WORKSHOP_KINDS.length} Phase 3 workshop activities`);
  if (audit.uniqueKinds !== PHASE3_WORKSHOP_KINDS.length) throw new Error(`CPD course ${course.id} needs all eight distinct Phase 3 interaction types`);
  if (audit.choicePoints < 30) throw new Error(`CPD course ${course.id} needs at least 30 meaningful Phase 3 choice points`);
  if (!audit.hasBranchingCase || !audit.hasEvidenceSort || !audit.hasCompareAndRank) throw new Error(`CPD course ${course.id} is missing a required Phase 3 workshop interaction family`);

  const id = safeId(course.id);
  const ids = PHASE3_WORKSHOP_KINDS.map(kind => `overhaul3-workshop-${id}-${kind}`);
  const positions = ids.map(moduleId => indexOf(course, moduleId));
  if (positions.some(position => position < 0)) throw new Error(`CPD course ${course.id} is missing one or more Phase 3 workshop modules`);
  if (!positions.every((position, i) => i === 0 || position > positions[i - 1])) throw new Error(`CPD course ${course.id} Phase 3 workshop activities are not distributed in the intended learning-cycle order`);

  const cycle2 = indexOf(course, `overhaul1-cycle-${id}-2`);
  const cycle3 = indexOf(course, `overhaul1-cycle-${id}-3`);
  const cycle4 = indexOf(course, `overhaul1-cycle-${id}-4`);
  if (cycle2 < 0 || cycle3 < 0 || cycle4 < 0) throw new Error(`CPD course ${course.id} is missing learning-cycle anchors required for Phase 3 distribution`);
  if (!(positions[0] < cycle2 && positions[1] < cycle2)) throw new Error(`CPD course ${course.id} needs misconception and matching work in learning cycle 1`);
  if (!(positions[2] < cycle3 && positions[3] < cycle3 && positions[2] > cycle2)) throw new Error(`CPD course ${course.id} needs sequencing and comparison work across learning cycle 2`);
  if (!(positions[4] > cycle3 && positions[5] > cycle3 && positions[5] < cycle4)) throw new Error(`CPD course ${course.id} needs evidence-sorting work between learning cycles 3 and 4`);
  if (!(positions[6] < cycle4 && positions[7] < cycle4 && positions[6] > positions[5])) throw new Error(`CPD course ${course.id} needs ranking and branching practice before the transfer cycle`);
}
