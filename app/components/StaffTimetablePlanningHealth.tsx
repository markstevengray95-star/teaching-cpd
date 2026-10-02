"use client";

import { useMemo } from "react";
import { MediumTermPlan } from "./staffTimetableMediumTerm";
import { CurriculumAssessment } from "./StaffTimetableAssessments";
import { LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import "./StaffTimetablePlanningExtensions.css";

type PlanningHealthLesson = {
  id: string;
  className: string;
  plan: {
    lessonDate?: string;
    topic?: string;
    objectives?: string;
    sequence?: string;
    assessment?: string;
    sequencePosition?: number;
    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";
    reflectionNote?: string;
  };
};

type HealthAction = {
  id: string;
  tone: "good" | "watch" | "urgent";
  label: string;
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
};

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function StaffTimetablePlanningHealth({
  className,
  lessons,
  mediumTermPlan,
  assessments,
  homework,
  today,
  onOpenPlan,
  onOpenMediumTerm,
  onOpenAssessments,
  onOpenHomework,
}: {
  className: string;
  lessons: PlanningHealthLesson[];
  mediumTermPlan?: MediumTermPlan;
  assessments: CurriculumAssessment[];
  homework: LessonLinkedHomework[];
  today: string;
  onOpenPlan: (lessonId: string) => void;
  onOpenMediumTerm: () => void;
  onOpenAssessments: () => void;
  onOpenHomework: () => void;
}) {
  const classLessons = lessons.filter((lesson) => lesson.className === className);
  const classHomework = homework.filter((item) => item.className === className);
  const classAssessments = assessments.filter((item) => item.className === className).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  const horizon = addDays(today, 14);
  const sessions = mediumTermPlan?.sessions || [];
  const overdueSessions = sessions.filter((item) => item.date < today && item.status === "planned");
  const upcomingSessions = sessions.filter((item) => item.date >= today && item.date <= horizon && item.status === "planned");
  const openHomework = classHomework.filter((item) => !["Marked", "Returned"].includes(item.status));
  const overdueHomework = openHomework.filter((item) => item.dueDate && item.dueDate < today);
  const reflectionFollowUps = classLessons.filter((lesson) => ["needs-revisiting", "not-completed"].includes(lesson.plan.reflectionOutcome || ""));
  const latestAssessment = classAssessments[0] || null;
  const weakTopics = latestAssessment?.topicResults.filter((item) => item.scorePercent !== null && Number(item.scorePercent) < latestAssessment.thresholdPercent) || [];

  const incompleteUpcoming = useMemo(() => upcomingSessions.filter((session) => {
    const lesson = classLessons.find((item) => item.id === session.sourceLessonId);
    if (!lesson) return true;
    const objectives = lesson.plan.objectives || session.objectives;
    const sequence = lesson.plan.sequence || session.sequence;
    const assessment = lesson.plan.assessment || session.assessment;
    return !lesson.plan.topic || !objectives.trim() || !sequence.trim() || !assessment.trim();
  }), [upcomingSessions, classLessons]);

  const actions: HealthAction[] = [];
  if (!mediumTermPlan) actions.push({ id: "mtp", tone: "urgent", label: "Sequence", title: "No medium-term plan yet", detail: "Create a dated curriculum sequence so lesson dates, pacing and missed lessons can be managed automatically.", actionLabel: "Build medium-term plan", onAction: onOpenMediumTerm });
  if (overdueSessions.length) actions.push({ id: "past", tone: "urgent", label: "Pacing", title: `${overdueSessions.length} past lesson${overdueSessions.length === 1 ? "" : "s"} still marked as planned`, detail: "Update these as complete or missed so the remaining curriculum sequence stays accurate.", actionLabel: "Review plan", onAction: onOpenMediumTerm });
  if (incompleteUpcoming.length) {
    const first = incompleteUpcoming[0];
    actions.push({ id: "planning", tone: "watch", label: "Next 14 days", title: `${incompleteUpcoming.length} upcoming lesson${incompleteUpcoming.length === 1 ? "" : "s"} need more detail`, detail: "At least one upcoming lesson is missing a topic, objectives, sequence or assessment check.", actionLabel: "Open first lesson", onAction: () => onOpenPlan(first.sourceLessonId) });
  }
  if (reflectionFollowUps.length) actions.push({ id: "reflection", tone: "watch", label: "Reflection", title: `${reflectionFollowUps.length} lesson reflection${reflectionFollowUps.length === 1 ? "" : "s"} need follow-up`, detail: "Carry forward anything marked not completed or needing revisiting before the next related lesson.", actionLabel: "Open lesson", onAction: () => onOpenPlan(reflectionFollowUps[0].id) });
  if (weakTopics.length) actions.push({ id: "assessment", tone: "watch", label: "Assessment", title: `${weakTopics.length} weak topic${weakTopics.length === 1 ? "" : "s"} flagged`, detail: `Latest evidence is below the ${latestAssessment?.thresholdPercent ?? 60}% threshold for part of the taught curriculum.`, actionLabel: "Review assessment", onAction: onOpenAssessments });
  if (overdueHomework.length) actions.push({ id: "homework", tone: "watch", label: "Homework", title: `${overdueHomework.length} overdue homework item${overdueHomework.length === 1 ? "" : "s"}`, detail: "Review completion and decide whether a reminder, catch-up or intervention is needed.", actionLabel: "Open homework", onAction: onOpenHomework });
  if (!actions.length) actions.push({ id: "clear", tone: "good", label: "Planning health", title: "No immediate planning risks found", detail: "The class sequence, recent reflection, assessment flags and homework are currently clear." });

  const completedSessions = sessions.filter((item) => item.status === "complete").length;
  const scheduledSessions = sessions.filter((item) => item.status !== "missed").length;
  const readyUpcoming = Math.max(0, upcomingSessions.length - incompleteUpcoming.length);

  return <section className="ttPlanningExtension">
    <div className="ttPlanningExtensionHead">
      <div><span>PHASE 16 · PLANNING HEALTH</span><h3>Class planning health check</h3><p>A teacher-facing action list that brings together curriculum pace, upcoming lesson readiness, reflection, assessment and homework.</p></div>
      <div className="ttPlanningHealthScore"><strong>{actions.filter((item) => item.tone === "urgent").length ? "Needs action" : actions.some((item) => item.tone === "watch") ? "Review" : "On track"}</strong><small>{className}</small></div>
    </div>

    <div className="ttPlanningHealthKpis">
      <div><small>Curriculum sessions</small><strong>{completedSessions}/{scheduledSessions || 0}</strong><span>completed</span></div>
      <div><small>Next 14 days</small><strong>{readyUpcoming}/{upcomingSessions.length}</strong><span>lesson plans ready</span></div>
      <div className={weakTopics.length ? "warning" : ""}><small>Weak topics</small><strong>{weakTopics.length}</strong><span>latest assessment</span></div>
      <div className={overdueHomework.length ? "warning" : ""}><small>Overdue homework</small><strong>{overdueHomework.length}</strong><span>open items</span></div>
    </div>

    <div className="ttPlanningHealthActions">
      {actions.map((item) => <article key={item.id} className={item.tone}>
        <div className="ttPlanningHealthIcon">{item.tone === "good" ? "✓" : item.tone === "urgent" ? "!" : "•"}</div>
        <div><span>{item.label}</span><h4>{item.title}</h4><p>{item.detail}</p></div>
        {item.actionLabel && item.onAction && <button type="button" className="ttButton" onClick={item.onAction}>{item.actionLabel}</button>}
      </article>)}
    </div>
  </section>;
}
