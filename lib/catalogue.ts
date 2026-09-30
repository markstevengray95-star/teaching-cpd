import { courses as coreCourses, categoryOrder } from "./data";
import { phase3Courses } from "./phase3Courses";
import { expandedCourses } from "./courseExpansions";
import { expandedCoursesBatch2 } from "./courseExpansionBatch2";
import { additionalCourses } from "./additionalCourses";
import { schoolCoursesBatch1 } from "./schoolCoursesBatch1";
import { schoolCoursesBatch2 } from "./schoolCoursesBatch2";
import { schoolCoursesBatch3 } from "./schoolCoursesBatch3";
import { schoolCoursesBatch4 } from "./schoolCoursesBatch4";
import { schoolCoursesBatch5 } from "./schoolCoursesBatch5";
import { deepTeachingCourses } from "./deepTeachingCourses";
import { deepTeachingCourses2 } from "./deepTeachingCourses2";
import { safeguardingIntegratedCourse } from "./safeguardingIntegratedCourse";
import { enrichCourseWithVisuals } from "./courseVisualEnrichment";
import { deepenSafeguarding2026 } from "./safeguardingDepth2026";
import { addAdvancedSafeguarding2026 } from "./safeguardingAdvanced2026";
import { addSafeguardingPractice2026 } from "./safeguardingPractice2026";
import { addSafeguardingGuidedStudy2026 } from "./safeguardingGuidedStudy2026";
import { addSafeguardingPresentationDepth2026 } from "./safeguardingPresentationDepth2026";
import { enhanceMainCourse } from "./mainCourseEnhancement";
import { addFlagshipFacilitatorPack } from "./mainCourseFacilitatorEnhancement";
import { structureFlagshipCourse } from "./flagshipCourseMaterials";
import { addCourseVisualDepth } from "./courseVisualDepth";
import { addCourseVisualStoryboards } from "./courseVisualStoryboards";
import { addCourseSpecificVisualStoryboards } from "./courseVisualStoryboards2";
import { addCourseDeepPractice } from "./courseDeepPractice";
import { addCourseDeepPractice2 } from "./courseDeepPractice2";
import { addCourseDeepPractice3 } from "./courseDeepPractice3";
import { structureCourseAsPresentation } from "./coursePresentationStructure";
import { boostCourseEngagement } from "./courseEngagementBoost";
import { openCourseWithPresentationOverview } from "./coursePresentationOrder";
import { qualityAssureFirstTenCourse, validateFirstTenCatalogueOrder, validateFirstTenCourseQuality } from "./firstTenCourseQuality";
import { polishFirstTenCourseFlow, validateFirstTenCourseFlow, validateFirstTenOrderAfterFlow } from "./firstTenCourseFlowAudit";
import { qualityAssureNextFiveCourse, validateNextFiveCatalogueOrder, validateNextFiveCourseQuality } from "./nextFiveCourseQuality";
import { qualityAssureCourses16To20, validateCourses16To20Order, validateCourses16To20Quality } from "./courses16To20Quality";
import { qualityAssureCourses21To25, validateCourses21To25Order, validateCourses21To25Quality } from "./courses21To25Quality";
import { qualityAssureCourses26To30, validateCourses26To30Order, validateCourses26To30Quality } from "./courses26To30Quality";
import { deepenRemainingCourse, validateRemainingCourseDepth } from "./remainingCourseDepth";
import { addRemainingPracticeStudio, validateRemainingPracticeStudio } from "./remainingCoursePracticeStudio";
import { qualityAssureRemainingCourse, validateRemainingCatalogue, validateRemainingCourseQuality } from "./remainingCourseQuality";
import { applyCourseTemplateFoundation, auditCatalogue, validateCourseAgainstQualityFramework } from "./courseQualityFramework";
import { deepenCourseContent2026, validateCourseContentDepth2026 } from "./courseContentDepth2026";
import { enhanceCoursePresentationPhase3, validateCoursePresentationPhase3, auditCoursePresentationPhase3 } from "./coursePresentationPhase3";
import { addAdvancedPracticePhase4, validateAdvancedPracticePhase4, auditAdvancedPracticePhase4 } from "./coursePracticePhase4";
import { addCourseAssessmentPhase5, validateCourseAssessmentPhase5, auditCourseAssessmentPhase5 } from "./courseAssessmentPhase5";
import { validateCourseFollowThroughPhase6, auditCourseFollowThroughPhase6 } from "./courseFollowThroughPhase6";
import { validateCourseFacilitatorPhase7, auditCourseFacilitatorPhase7 } from "./courseFacilitatorPhase7";
import { validateCourseFinalQaPhase8, auditCourseFinalQaPhase8, summarisePhase8Quality } from "./courseFinalQaPhase8";
import { applyPresentationOverhaulPhase1, validatePresentationOverhaulPhase1, auditPresentationOverhaulPhase1, PRESENTATION_LEARNING_CYCLE, PRESENTATION_OVERHAUL_PHASE1_VERSION } from "./courseLearningCycleOverhaulPhase1";
import { applyProfessionalReadingPhase2, validateProfessionalReadingPhase2, auditProfessionalReadingPhase2, getProfessionalReadingPhase2Pack, isProfessionalReadingPhase2Module, countProfessionalReadingWords, PHASE2_READING_DEPTHS, PRESENTATION_OVERHAUL_PHASE2_VERSION } from "./courseProfessionalReadingPhase2";
import { applyWorkshopActivityPhase3, auditWorkshopActivityPhase3, getWorkshopActivityPhase3Pack, isWorkshopActivityPhase3Module, PHASE3_WORKSHOP_KINDS, PRESENTATION_OVERHAUL_PHASE3_VERSION } from "./courseWorkshopActivityPhase3";
import { validateWorkshopActivityPhase3CycleAware } from "./courseWorkshopActivityPhase3Validation";
import { applyProgressiveCasePhase4, validateProgressiveCasePhase4, auditProgressiveCasePhase4, getProgressiveCasePhase4ModulePack, isProgressiveCasePhase4Module, PHASE4_CASE_STEPS, PRESENTATION_OVERHAUL_PHASE4_VERSION } from "./courseProgressiveCasePhase4";
import { validateLivePresenterPhase5, auditLivePresenterPhase5 } from "./courseLivePresenterPhase5";
import { repairPresentationEngagementPhase6, validatePresentationEngagementPhase6, auditPresentationEngagementPhase6, summarisePresentationEngagementPhase6, PRESENTATION_OVERHAUL_PHASE6_VERSION } from "./courseEngagementQaPhase6";
import { applyInstructionalVisualPhase7, applyAdaptivePathwayPhase8, applySynthesisPhase9, applyArchetypePolishPhase10, validateFinalPresentationPhases7to10, auditFinalPresentationPhases7to10, summariseFinalPresentationPhases7to10, getAdaptivePathwayPhase8Pack, isAdaptivePathwayPhase8Module, PRESENTATION_OVERHAUL_PHASE7_VERSION, PRESENTATION_OVERHAUL_PHASE8_VERSION, PRESENTATION_OVERHAUL_PHASE9_VERSION, PRESENTATION_OVERHAUL_PHASE10_VERSION } from "./coursePresentationFinishPhase7to10";
import { applyMissionPhase11, applySimulationPhase12, validateMissionSimulationPhases11to12, auditMissionSimulationPhases11to12, summariseMissionSimulationPhases11to12, getPhase11MissionPack, getPhase12SimulationPack, getPhase12SimulationModulePack, isPhase11MissionModule, isPhase12SimulationModule, PRESENTATION_OVERHAUL_PHASE11_VERSION, PRESENTATION_OVERHAUL_PHASE12_VERSION } from "./courseMissionSimulationPhase11to12";
import type { Course } from "./data";

export { categoryOrder };
export type { Course, Module, Role, CourseCategory } from "./data";
export { auditCourse, COURSE_TEMPLATE_STAGES, COURSE_TEMPLATE_VERSION } from "./courseQualityFramework";
export { auditCoursePresentationPhase3 } from "./coursePresentationPhase3";
export { auditAdvancedPracticePhase4 } from "./coursePracticePhase4";
export { auditCourseAssessmentPhase5 } from "./courseAssessmentPhase5";
export { auditCourseFollowThroughPhase6, getPhase6RetrievalQuestions, PHASE6_REVIEW_STAGES } from "./courseFollowThroughPhase6";
export { auditCourseFacilitatorPhase7, getPhase7FacilitatorPlan, getPhase7SlideGuide, PHASE7_SESSION_ROUTES } from "./courseFacilitatorPhase7";
export type { Phase7FacilitatorPlan, Phase7SlideGuide, Phase7RouteMinutes } from "./courseFacilitatorPhase7";
export { auditCourseFinalQaPhase8, summarisePhase8Quality } from "./courseFinalQaPhase8";
export type { Phase8Check, Phase8CourseAudit } from "./courseFinalQaPhase8";
export { auditPresentationOverhaulPhase1, PRESENTATION_LEARNING_CYCLE, PRESENTATION_OVERHAUL_PHASE1_VERSION } from "./courseLearningCycleOverhaulPhase1";
export { auditProfessionalReadingPhase2, getProfessionalReadingPhase2Pack, isProfessionalReadingPhase2Module, countProfessionalReadingWords, PHASE2_READING_DEPTHS, PRESENTATION_OVERHAUL_PHASE2_VERSION } from "./courseProfessionalReadingPhase2";
export type { Phase2ReadingDepth, Phase2ReadingPack, Phase2GlossaryItem, Phase2ReadingSection } from "./courseProfessionalReadingPhase2";
export { auditWorkshopActivityPhase3, getWorkshopActivityPhase3Pack, isWorkshopActivityPhase3Module, PHASE3_WORKSHOP_KINDS, PRESENTATION_OVERHAUL_PHASE3_VERSION } from "./courseWorkshopActivityPhase3";
export type { Phase3WorkshopKind, Phase3WorkshopPack, Phase3WorkshopOption, Phase3BranchStage } from "./courseWorkshopActivityPhase3";
export { auditProgressiveCasePhase4, getProgressiveCasePhase4ModulePack, isProgressiveCasePhase4Module, PHASE4_CASE_STEPS, PRESENTATION_OVERHAUL_PHASE4_VERSION } from "./courseProgressiveCasePhase4";
export type { Phase4ProgressiveCasePack, Phase4ProgressiveCaseModulePack, Phase4CaseStep, Phase4CaseNumber, Phase4RoleLens, Phase4Choice } from "./courseProgressiveCasePhase4";
export { auditLivePresenterPhase5, getCourseLivePresenterPhase5Moments, getLivePresenterPhase5MomentForModule, getNextLivePresenterPhase5Moment, phase5LiveMomentActivityType, PHASE5_LIVE_MOMENT_KINDS, PRESENTATION_OVERHAUL_PHASE5_VERSION } from "./courseLivePresenterPhase5";
export type { Phase5LiveMoment, Phase5LiveMomentKind } from "./courseLivePresenterPhase5";
export { auditPresentationEngagementPhase6, summarisePresentationEngagementPhase6, PRESENTATION_OVERHAUL_PHASE6_VERSION } from "./courseEngagementQaPhase6";
export type { Phase6EngagementAudit, Phase6EngagementCheck } from "./courseEngagementQaPhase6";
export { auditFinalPresentationPhases7to10, summariseFinalPresentationPhases7to10, getAdaptivePathwayPhase8Pack, isAdaptivePathwayPhase8Module, PRESENTATION_OVERHAUL_PHASE7_VERSION, PRESENTATION_OVERHAUL_PHASE8_VERSION, PRESENTATION_OVERHAUL_PHASE9_VERSION, PRESENTATION_OVERHAUL_PHASE10_VERSION } from "./coursePresentationFinishPhase7to10";
export type { Phase8PathRoute, Phase8AdaptivePack, FinalPresentationAudit } from "./coursePresentationFinishPhase7to10";
export { auditMissionSimulationPhases11to12, summariseMissionSimulationPhases11to12, getPhase11MissionPack, getPhase12SimulationPack, getPhase12SimulationModulePack, isPhase11MissionModule, isPhase12SimulationModule, PRESENTATION_OVERHAUL_PHASE11_VERSION, PRESENTATION_OVERHAUL_PHASE12_VERSION } from "./courseMissionSimulationPhase11to12";
export type { Phase11MissionStage, Phase11MissionPack, Phase12MeterEffects, Phase12SimulationChoice, Phase12SimulationState, Phase12SimulationPack, Phase11to12Audit } from "./courseMissionSimulationPhase11to12";

const seededCourses = [...coreCourses, ...phase3Courses];
const replacementMap = new Map([
  ...expandedCourses,
  ...expandedCoursesBatch2,
  ...additionalCourses,
  ...schoolCoursesBatch1,
  ...schoolCoursesBatch2,
  ...schoolCoursesBatch3,
  ...schoolCoursesBatch4,
  ...schoolCoursesBatch5,
  ...deepTeachingCourses,
  ...deepTeachingCourses2,
  safeguardingIntegratedCourse,
].map(course => [course.id, course] as const));
const replacementIds = new Set(replacementMap.keys());
const replacements = [...replacementMap.values()];

function validateCourse(course: Course) {
  if (!course.id.trim() || !course.title.trim()) throw new Error("CPD course is missing an id or title");
  if (!course.modules.length) throw new Error(`CPD course ${course.id} has no modules`);
  const moduleIds = course.modules.map(module => module.id);
  if (new Set(moduleIds).size !== moduleIds.length) throw new Error(`CPD course ${course.id} contains duplicate module ids`);
  const interactiveTypes = new Set(["quiz", "scenario", "reflection", "checklist", "activity"]);
  if (!course.modules.some(module => interactiveTypes.has(module.type))) throw new Error(`CPD course ${course.id} needs at least one interactive or reflective module`);
  if (!course.modules.some(module => module.type === "visual")) throw new Error(`CPD course ${course.id} needs at least one visual explainer`);
  if (!(course.modules[0].id.startsWith("presentation-") && course.modules[0].id.endsWith("-map"))) throw new Error(`CPD course ${course.id} must open with its presentation overview`);
}

function standardiseCourseObjectives(course: Course): Course {
  const objectives: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const clean = value.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key) || objectives.length >= 6) return;
    seen.add(key);
    objectives.push(clean);
  };
  course.objectives.forEach(add);
  [
    `Apply the core principles of ${course.title} to a realistic school context`,
    "Identify appropriate evidence to judge whether the approach is working",
    "Plan a specific next step and review whether it should be kept, adapted or stopped",
  ].forEach(add);
  return { ...course, objectives: objectives.slice(0, Math.max(3, Math.min(6, objectives.length))) };
}

const qualityAssuredCourses = [...seededCourses.filter(course => !replacementIds.has(course.id)), ...replacements]
  .map(enrichCourseWithVisuals)
  .map(deepenSafeguarding2026)
  .map(addAdvancedSafeguarding2026)
  .map(addSafeguardingPractice2026)
  .map(addSafeguardingGuidedStudy2026)
  .map(addSafeguardingPresentationDepth2026)
  .map(enhanceMainCourse)
  .map(addFlagshipFacilitatorPack)
  .map(structureFlagshipCourse)
  .map(addCourseVisualDepth)
  .map(addCourseVisualStoryboards)
  .map(addCourseSpecificVisualStoryboards)
  .map(addCourseDeepPractice)
  .map(addCourseDeepPractice2)
  .map(addCourseDeepPractice3)
  .map(structureCourseAsPresentation)
  .map(boostCourseEngagement)
  .map(openCourseWithPresentationOverview)
  .map(qualityAssureFirstTenCourse)
  .map(polishFirstTenCourseFlow)
  .map(qualityAssureNextFiveCourse)
  .map(qualityAssureCourses16To20)
  .map(qualityAssureCourses21To25)
  .map(qualityAssureCourses26To30)
  .map(qualityAssureRemainingCourse)
  .map(deepenRemainingCourse)
  .map(addRemainingPracticeStudio);

qualityAssuredCourses.forEach(validateCourse);
qualityAssuredCourses.forEach(validateFirstTenCourseQuality);
qualityAssuredCourses.forEach(validateFirstTenCourseFlow);
qualityAssuredCourses.forEach(validateNextFiveCourseQuality);
qualityAssuredCourses.forEach(validateCourses16To20Quality);
qualityAssuredCourses.forEach(validateCourses21To25Quality);
qualityAssuredCourses.forEach(validateCourses26To30Quality);
qualityAssuredCourses.forEach(validateRemainingCourseDepth);
qualityAssuredCourses.forEach(validateRemainingPracticeStudio);
qualityAssuredCourses.forEach(validateRemainingCourseQuality);
validateFirstTenCatalogueOrder(qualityAssuredCourses);
validateFirstTenOrderAfterFlow(qualityAssuredCourses);
validateNextFiveCatalogueOrder(qualityAssuredCourses);
validateCourses16To20Order(qualityAssuredCourses);
validateCourses21To25Order(qualityAssuredCourses);
validateCourses26To30Order(qualityAssuredCourses);
validateRemainingCatalogue(qualityAssuredCourses);

export const courses = qualityAssuredCourses
  .map(standardiseCourseObjectives)
  .map(applyCourseTemplateFoundation)
  .map(deepenCourseContent2026)
  .map(enhanceCoursePresentationPhase3)
  .map(addAdvancedPracticePhase4)
  .map(addCourseAssessmentPhase5)
  .map(applyPresentationOverhaulPhase1)
  .map(applyProfessionalReadingPhase2)
  .map(applyWorkshopActivityPhase3)
  .map(applyProgressiveCasePhase4)
  .map(applyInstructionalVisualPhase7)
  .map(applyAdaptivePathwayPhase8)
  .map(applySynthesisPhase9)
  .map(applyArchetypePolishPhase10)
  .map(applyMissionPhase11)
  .map(applySimulationPhase12)
  .map(repairPresentationEngagementPhase6);

courses.forEach(validateCourse);
courses.forEach(validateCourseAgainstQualityFramework);
courses.forEach(validateCourseContentDepth2026);
courses.forEach(validateCoursePresentationPhase3);
courses.forEach(validateAdvancedPracticePhase4);
courses.forEach(validateCourseAssessmentPhase5);
courses.forEach(validateCourseFollowThroughPhase6);
courses.forEach(validateCourseFacilitatorPhase7);
courses.forEach(validateCourseFinalQaPhase8);
courses.forEach(validatePresentationOverhaulPhase1);
courses.forEach(validateProfessionalReadingPhase2);
courses.forEach(validateWorkshopActivityPhase3CycleAware);
courses.forEach(validateProgressiveCasePhase4);
courses.forEach(validateLivePresenterPhase5);
courses.forEach(validatePresentationEngagementPhase6);
courses.forEach(validateFinalPresentationPhases7to10);
courses.forEach(validateMissionSimulationPhases11to12);

export const courseQualityAudit = auditCatalogue(courses);
export const coursePresentationAudit = courses.map(auditCoursePresentationPhase3);
export const coursePracticeAudit = courses.map(auditAdvancedPracticePhase4);
export const courseAssessmentAudit = courses.map(auditCourseAssessmentPhase5);
export const courseFollowThroughAudit = courses.map(auditCourseFollowThroughPhase6);
export const courseFacilitatorAudit = courses.map(auditCourseFacilitatorPhase7);
export const courseFinalQaAudit = courses.map(auditCourseFinalQaPhase8);
export const courseFinalQaSummary = summarisePhase8Quality(courses);
export const coursePresentationOverhaulPhase1Audit = courses.map(auditPresentationOverhaulPhase1);
export const courseProfessionalReadingPhase2Audit = courses.map(auditProfessionalReadingPhase2);
export const courseWorkshopActivityPhase3Audit = courses.map(auditWorkshopActivityPhase3);
export const courseProgressiveCasePhase4Audit = courses.map(auditProgressiveCasePhase4);
export const courseLivePresenterPhase5Audit = courses.map(auditLivePresenterPhase5);
export const coursePresentationEngagementPhase6Audit = courses.map(auditPresentationEngagementPhase6);
export const coursePresentationEngagementPhase6Summary = summarisePresentationEngagementPhase6(courses);
export const courseFinalPresentationPhases7to10Audit = courses.map(auditFinalPresentationPhases7to10);
export const courseFinalPresentationPhases7to10Summary = summariseFinalPresentationPhases7to10(courses);
export const courseMissionSimulationPhases11to12Audit = courses.map(auditMissionSimulationPhases11to12);
export const courseMissionSimulationPhases11to12Summary = summariseMissionSimulationPhases11to12(courses);
