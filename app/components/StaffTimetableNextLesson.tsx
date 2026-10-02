"use client";

import { useMemo } from "react";
import { ClassCurriculumProfile, getCourseLessonSequence, inferClassCurriculumProfile } from "./staffTimetableCurriculumPhase1";
import { MediumTermPlan } from "./staffTimetableMediumTerm";
import { CurriculumAssessment } from "./StaffTimetableAssessments";
import "./StaffTimetableNextLesson.css";

export type NextLessonSuggestion = {
  className: string;
  targetLessonId: string;
  mode: "next" | "retrieval" | "reteach" | "continue";
  title: string;
  reason: string;
  warning: string;
  courseId: string;
  sequencePosition: number;
  unitTitle: string;
  subtopicTitle: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  assessment: string;
  retrieval: string;
  teacherNotes: string;
};

type IntelligentLesson = {
  id: string;
  className: string;
  subject: string;
  week: "W1" | "W2";
  day: string;
  period: number;
  plan: {
    lessonDate?: string;
    topic?: string;
    courseId?: string;
    sequencePosition?: number;
    curriculumUnit?: string;
    curriculumSubtopic?: string;
    vocabulary?: string;
    objectives?: string;
    sequence?: string;
    assessment?: string;
    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";
    reflectionNote?: string;
    reflectionUpdatedAt?: string;
  };
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function lessonOrder(a: IntelligentLesson, b: IntelligentLesson) {
  const dateA = a.plan.lessonDate || "9999-12-31";
  const dateB = b.plan.lessonDate || "9999-12-31";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return a.week.localeCompare(b.week) || DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.period - b.period;
}

export default function StaffTimetableNextLesson({
  className,
  lessons,
  profile,
  assessments,
  mediumTermPlans,
  today,
  readOnly,
  onApply,
}: {
  className: string;
  lessons: IntelligentLesson[];
  profile?: ClassCurriculumProfile;
  assessments: CurriculumAssessment[];
  mediumTermPlans: MediumTermPlan[];
  today: string;
  readOnly: boolean;
  onApply: (suggestion: NextLessonSuggestion) => void;
}) {
  const suggestion = useMemo<NextLessonSuggestion | null>(() => {
    const classLessons = lessons.filter((lesson) => lesson.className === className).slice().sort(lessonOrder);
    if (!classLessons.length) return null;
    const resolvedProfile = profile || inferClassCurriculumProfile(className, classLessons[0]?.subject || "Science");
    const curriculum = getCourseLessonSequence(resolvedProfile);
    if (!curriculum.length) return null;
    const medium = mediumTermPlans.find((plan) => plan.className === className && (!resolvedProfile.courseId || plan.courseId === resolvedProfile.courseId)) || mediumTermPlans.find((plan) => plan.className === className);
    const completed = new Set((medium?.sessions || []).filter((session) => session.status === "complete").map((session) => session.sequencePosition));
    const latestReflection = classLessons
      .filter((lesson) => lesson.plan.reflectionOutcome && lesson.plan.reflectionOutcome !== "went-well")
      .slice()
      .sort((a, b) => (b.plan.reflectionUpdatedAt || b.plan.lessonDate || "").localeCompare(a.plan.reflectionUpdatedAt || a.plan.lessonDate || ""))[0];
    const futureSession = (medium?.sessions || []).filter((session) => session.date >= today && session.status === "planned").sort((a, b) => a.date.localeCompare(b.date))[0];
    const target = (futureSession ? classLessons.find((lesson) => lesson.id === futureSession.sourceLessonId) : null)
      || classLessons.find((lesson) => !lesson.plan.topic)
      || classLessons.find((lesson) => (lesson.plan.lessonDate || "") >= today)
      || classLessons[0];
    if (!target) return null;

    const latestAssessment = assessments.filter((item) => item.className === className).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0];
    const weakest = latestAssessment?.topicResults
      .filter((topic) => topic.scorePercent !== null && Number(topic.scorePercent) < latestAssessment.thresholdPercent)
      .sort((a, b) => Number(a.scorePercent) - Number(b.scorePercent))[0];

    const lastCompletedPosition = completed.size ? Math.max(...Array.from(completed)) : -1;
    const plannedPositions = classLessons.map((lesson) => Number(lesson.plan.sequencePosition)).filter((position) => Number.isInteger(position) && position >= 0);
    const latestPlannedPosition = plannedPositions.length ? Math.max(...plannedPositions) : -1;
    const baseNextPosition = Math.max(lastCompletedPosition + 1, latestPlannedPosition >= 0 ? latestPlannedPosition + 1 : 0);
    const nextCurriculum = curriculum.find((item) => item.sequencePosition >= baseNextPosition) || curriculum.find((item) => !completed.has(item.sequencePosition)) || curriculum.at(-1)!;

    const futureSlots = (medium?.sessions || []).filter((session) => session.date >= today && session.status === "planned").length;
    const remaining = curriculum.filter((item) => !completed.has(item.sequencePosition)).length;
    const warning = medium && futureSlots < remaining ? `${remaining} curriculum lessons remain but the current dated plan has ${futureSlots} future teaching slots.` : "";

    if (latestReflection?.plan.reflectionOutcome === "not-completed") {
      const position = Number.isInteger(Number(latestReflection.plan.sequencePosition)) && Number(latestReflection.plan.sequencePosition) >= 0 ? Number(latestReflection.plan.sequencePosition) : nextCurriculum.sequencePosition;
      const item = curriculum.find((entry) => entry.sequencePosition === position) || nextCurriculum;
      return {
        className, targetLessonId: target.id, mode: "continue", title: `Continue: ${latestReflection.plan.topic || item.title}`,
        reason: `The most recent reflection says the lesson was not completed${latestReflection.plan.reflectionNote ? `: ${latestReflection.plan.reflectionNote}` : "."}`,
        warning, courseId: item.courseId, sequencePosition: item.sequencePosition, unitTitle: item.unitTitle, subtopicTitle: item.subtopicTitle,
        vocabulary: latestReflection.plan.vocabulary || item.vocabulary, objectives: latestReflection.plan.objectives || item.objectives,
        sequence: `Begin by checking what was completed last lesson. Continue the unfinished teaching and practice before moving on.\n\n${latestReflection.plan.sequence || item.sequence}`,
        assessment: latestReflection.plan.assessment || item.assessment,
        retrieval: `Quickly retrieve the part of ${latestReflection.plan.topic || item.title} already taught, then check readiness to continue.`,
        teacherNotes: `Automatic Phase 10 suggestion: continue unfinished learning from the previous lesson.${latestReflection.plan.reflectionNote ? ` Teacher reflection: ${latestReflection.plan.reflectionNote}` : ""}`,
      };
    }

    if (latestReflection?.plan.reflectionOutcome === "needs-revisiting") {
      const revisitTitle = latestReflection.plan.topic || "the previous lesson";
      return {
        className, targetLessonId: target.id, mode: "retrieval", title: nextCurriculum.title,
        reason: `The previous reflection flagged ${revisitTitle} for revisiting before the class moves on.`, warning,
        courseId: nextCurriculum.courseId, sequencePosition: nextCurriculum.sequencePosition, unitTitle: nextCurriculum.unitTitle, subtopicTitle: nextCurriculum.subtopicTitle,
        vocabulary: nextCurriculum.vocabulary, objectives: nextCurriculum.objectives, sequence: nextCurriculum.sequence, assessment: nextCurriculum.assessment,
        retrieval: `Start with 5–8 minutes of retrieval/reteach on ${revisitTitle}. Include one misconception check, one short application and a confidence check before beginning ${nextCurriculum.title}.`,
        teacherNotes: `Automatic Phase 10 suggestion: retrieval-first lesson because the previous reflection said learning needed revisiting.${latestReflection.plan.reflectionNote ? ` Teacher reflection: ${latestReflection.plan.reflectionNote}` : ""}`,
      };
    }

    if (weakest) {
      const weakItem = curriculum.find((item) => item.sequencePosition === weakest.sequencePosition);
      const gap = latestAssessment ? latestAssessment.thresholdPercent - Number(weakest.scorePercent) : 0;
      const fullReteach = gap >= 15;
      const item = fullReteach && weakItem ? weakItem : nextCurriculum;
      return {
        className, targetLessonId: target.id, mode: fullReteach ? "reteach" : "retrieval", title: fullReteach ? `Reteach: ${weakest.title}` : nextCurriculum.title,
        reason: `${latestAssessment?.title || "Latest assessment"} shows ${weakest.title} at ${weakest.scorePercent}% against a ${latestAssessment?.thresholdPercent}% threshold.`, warning,
        courseId: item.courseId, sequencePosition: item.sequencePosition, unitTitle: item.unitTitle, subtopicTitle: item.subtopicTitle,
        vocabulary: item.vocabulary, objectives: item.objectives,
        sequence: fullReteach ? `Diagnose the specific misconception in ${weakest.title}, re-model the key idea, then use guided and independent practice before rechecking understanding.\n\n${item.sequence}` : item.sequence,
        assessment: item.assessment,
        retrieval: fullReteach ? `Use a short diagnostic retrieval check on ${weakest.title} before reteaching.` : `Begin with targeted retrieval on ${weakest.title}, then move into ${nextCurriculum.title}.`,
        teacherNotes: `Automatic Phase 10 suggestion based on assessment evidence from ${latestAssessment?.title || "the latest assessment"}.`,
      };
    }

    return {
      className, targetLessonId: target.id, mode: "next", title: nextCurriculum.title,
      reason: "No unresolved reflection or assessment priority is currently stronger than the next curriculum step.", warning,
      courseId: nextCurriculum.courseId, sequencePosition: nextCurriculum.sequencePosition, unitTitle: nextCurriculum.unitTitle, subtopicTitle: nextCurriculum.subtopicTitle,
      vocabulary: nextCurriculum.vocabulary, objectives: nextCurriculum.objectives, sequence: nextCurriculum.sequence, assessment: nextCurriculum.assessment,
      retrieval: `Retrieve the prerequisite knowledge pupils need for ${nextCurriculum.title}.`,
      teacherNotes: "Automatic Phase 10 suggestion based on curriculum progression and current teaching evidence.",
    };
  }, [assessments, className, lessons, mediumTermPlans, profile, today]);

  if (!suggestion) return <section className="ttNextLesson"><div className="ttNextLessonEmpty"><strong>No automatic suggestion yet</strong><span>Set a curriculum profile and add class lessons first.</span></div></section>;

  const label = suggestion.mode === "continue" ? "Continue unfinished learning" : suggestion.mode === "reteach" ? "Reteach priority" : suggestion.mode === "retrieval" ? "Retrieval-first" : "Next curriculum lesson";

  return <section className={`ttNextLesson ${suggestion.mode}`}>
    <div className="ttNextLessonHead"><div><span>PHASE 10 · NEXT-LESSON INTELLIGENCE</span><h3>{suggestion.title}</h3><p>{suggestion.reason}</p></div><b>{label}</b></div>
    <div className="ttNextLessonSignals"><span>Curriculum #{suggestion.sequencePosition + 1}</span><span>{suggestion.unitTitle}</span><span>{suggestion.subtopicTitle}</span></div>
    {suggestion.warning && <div className="ttNextLessonWarning"><strong>Time pressure</strong><span>{suggestion.warning}</span></div>}
    <div className="ttNextLessonPreview"><div><small>Retrieval / response</small><p>{suggestion.retrieval}</p></div><div><small>Why this is next</small><p>{suggestion.teacherNotes}</p></div></div>
    <div className="ttNextLessonActions"><button type="button" className="ttButton primary" disabled={readOnly} onClick={() => onApply(suggestion)}>Plan suggested lesson</button></div>
  </section>;
}
