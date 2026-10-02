"use client";

import { useMemo, useState } from "react";
import { ClassCurriculumProfile, getCourseLessonSequence, getPhase1Course, inferClassCurriculumProfile, profileLabel } from "./staffTimetableCurriculumPhase1";
import { MediumTermPlan, MediumTermSession } from "./staffTimetableMediumTerm";
import { CurriculumAssessment } from "./StaffTimetableAssessments";
import { LessonLinkedHomework } from "./StaffTimetableLessonHomework";
import { TimetableAttachedResource } from "./StaffTimetableLessonResources";
import StaffTimetableNextLesson, { type NextLessonSuggestion } from "./StaffTimetableNextLesson";
import StaffTimetableInclusionProfile, { type ClassInclusionProfile } from "./StaffTimetableInclusionProfile";
import StaffTimetableDepartmentSchemes, { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";
import "./StaffTimetableClassWorkspace.css";

type ClassLesson = {
  id: string;
  week: "W1" | "W2";
  day: string;
  period: number;
  start: string;
  end: string;
  subject: string;
  className: string;
  room: string;
  plan: {
    lessonDate?: string;
    topic?: string;
    curriculumUnit?: string;
    curriculumSubtopic?: string;
    courseId?: string;
    sequencePosition?: number;
    planningMode?: string;
    generatedResources?: TimetableAttachedResource[];
    vocabulary?: string;
    objectives?: string;
    sequence?: string;
    assessment?: string;
    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";
    reflectionNote?: string;
    reflectionUpdatedAt?: string;
  };
};

type Section = "overview" | "lessons" | "support" | "schemes" | "homework" | "assessments" | "resources" | "notes";

type TimelineItem = {
  kind: "session" | "lesson";
  date: string;
  topic: string;
  meta: string;
  sourceLessonId?: string;
  session?: MediumTermSession;
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const sectionLabels: Record<Section, string> = { overview: "Overview", lessons: "Lesson plans", support: "SEND / EAL support", schemes: "Department schemes", homework: "Homework", assessments: "Assessments", resources: "Resources", notes: "Notes" };

function formatDate(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function homeworkOpen(item: LessonLinkedHomework) { return !["Marked", "Returned"].includes(item.status); }
function averageAssessment(item: CurriculumAssessment) {
  const scored = item.topicResults.filter((topic) => topic.scorePercent !== null);
  return scored.length ? Math.round(scored.reduce((sum, topic) => sum + Number(topic.scorePercent || 0), 0) / scored.length) : null;
}

export default function StaffTimetableClassWorkspace({
  classes,
  className,
  lessons,
  profile,
  homework,
  assessments,
  mediumTermPlans,
  notes,
  today,
  readOnly,
  onSelectClass,
  onOpenPlan,
  onOpenMediumTerm,
  onOpenAssessments,
  onOpenHomework,
  onApplyNextSuggestion,
  inclusionProfile,
  departmentSchemeCopy,
  onInclusionChange,
  onImportScheme,
  onNotesChange,
}: {
  classes: string[];
  className: string;
  lessons: ClassLesson[];
  profile?: ClassCurriculumProfile;
  homework: LessonLinkedHomework[];
  assessments: CurriculumAssessment[];
  mediumTermPlans: MediumTermPlan[];
  notes: string;
  today: string;
  readOnly: boolean;
  onSelectClass: (className: string) => void;
  onOpenPlan: (lessonId: string) => void;
  onOpenMediumTerm: () => void;
  onOpenAssessments: () => void;
  onOpenHomework: () => void;
  onApplyNextSuggestion: (suggestion: NextLessonSuggestion) => void;
  inclusionProfile?: ClassInclusionProfile;
  departmentSchemeCopy?: DepartmentSchemeCopy;
  onInclusionChange: (profile: ClassInclusionProfile) => void;
  onImportScheme: (unit: DepartmentSchemeUnit, lessons: DepartmentSchemeLesson[]) => void;
  onNotesChange: (value: string) => void;
}) {
  const [section, setSection] = useState<Section>("overview");
  const classLessons = useMemo(() => lessons.filter((lesson) => lesson.className === className), [lessons, className]);
  const inferred = profile || inferClassCurriculumProfile(className, classLessons[0]?.subject || "Science");
  const course = getPhase1Course(inferred.courseId);
  const sequence = getCourseLessonSequence(inferred);
  const medium = mediumTermPlans.find((plan) => plan.className === className && (!inferred.courseId || plan.courseId === inferred.courseId)) || mediumTermPlans.find((plan) => plan.className === className);
  const classHomework = homework.filter((item) => item.className === className).slice().sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const classAssessments = assessments.filter((item) => item.className === className).slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  const resources = classLessons.flatMap((lesson) => (lesson.plan.generatedResources || []).map((resource) => ({ ...resource, lessonId: lesson.id, lessonTopic: lesson.plan.topic || `${lesson.week} ${lesson.day} P${lesson.period}` })));
  const uniqueResources = Array.from(new Map(resources.map((resource) => [resource.id, resource])).values());

  const completed = new Set((medium?.sessions || []).filter((item) => item.status === "complete").map((item) => item.sequencePosition));
  const planned = new Set(classLessons.map((lesson) => Number(lesson.plan.sequencePosition)).filter((position) => Number.isInteger(position) && position >= 0));
  (medium?.sessions || []).forEach((item) => { if (item.status !== "missed") planned.add(item.sequencePosition); });
  const taughtCount = completed.size;
  const plannedCount = planned.size;
  const progressPercent = sequence.length ? Math.round((medium ? taughtCount : plannedCount) / sequence.length * 100) : 0;
  const openHomework = classHomework.filter(homeworkOpen);
  const overdueHomework = openHomework.filter((item) => item.dueDate && item.dueDate < today);
  const weakTopics = classAssessments.reduce((count, assessment) => count + assessment.topicResults.filter((topic) => topic.scorePercent !== null && Number(topic.scorePercent) < assessment.thresholdPercent).length, 0);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (medium?.sessions?.length) return medium.sessions.map((session) => ({ kind: "session", date: session.date, topic: session.topic, meta: `${session.week} · ${session.day} · P${session.period} · ${session.status}`, sourceLessonId: session.sourceLessonId, session }));
    return classLessons.filter((lesson) => lesson.plan.lessonDate).map((lesson) => ({ kind: "lesson", date: lesson.plan.lessonDate || "", topic: lesson.plan.topic || "Planned lesson", meta: `${lesson.week} · ${lesson.day} · P${lesson.period}`, sourceLessonId: lesson.id }));
  }, [medium, classLessons]);
  const orderedTimeline = timeline.slice().sort((a, b) => a.date.localeCompare(b.date));
  const last = orderedTimeline.filter((item) => item.date < today).at(-1) || null;
  const current = orderedTimeline.find((item) => item.date === today) || null;
  const next = orderedTimeline.find((item) => item.date > today) || null;

  const sortedTimetable = classLessons.slice().sort((a, b) => a.week.localeCompare(b.week) || DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.period - b.period);
  const latestAssessment = classAssessments[0] || null;
  const latestAverage = latestAssessment ? averageAssessment(latestAssessment) : null;
  const currentSequencePosition = next?.session?.sequencePosition ?? current?.session?.sequencePosition ?? Math.max(-1, ...Array.from(planned));
  const journeyStart = Math.max(0, currentSequencePosition - 2);
  const journey = sequence.slice(journeyStart, Math.min(sequence.length, journeyStart + 8));

  function openTimeline(item: TimelineItem | null) { if (item?.sourceLessonId) onOpenPlan(item.sourceLessonId); }

  return <div className="ttClassWorkspace">
    <div className="ttClassWorkspaceHero">
      <div><span>PHASES 9–10, 12–13 · CLASS-SPECIFIC PLANNING</span><h2>{className || "Class workspace"}</h2><p>{profileLabel(inferred)}{course?.code ? ` · ${course.code}` : ""}</p></div>
      <div className="ttClassWorkspaceHeroActions"><label><span>Class</span><select value={className} onChange={(event) => onSelectClass(event.target.value)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></label><button className="ttButton" onClick={onOpenMediumTerm}>Medium-term plan</button></div>
    </div>

    <div className="ttClassWorkspaceKpis">
      <div><small>{medium ? "Curriculum taught" : "Curriculum planned"}</small><strong>{progressPercent}%</strong><span>{medium ? `${taughtCount}/${sequence.length} complete` : `${plannedCount}/${sequence.length} placed`}</span></div>
      <div className={overdueHomework.length ? "warning" : ""}><small>Open homework</small><strong>{openHomework.length}</strong><span>{overdueHomework.length ? `${overdueHomework.length} overdue` : "No overdue work"}</span></div>
      <div><small>Assessments</small><strong>{classAssessments.length}</strong><span>{latestAverage === null ? "No scored assessment" : `Latest average ${latestAverage}%`}</span></div>
      <div className={weakTopics ? "warning" : ""}><small>Weak-topic flags</small><strong>{weakTopics}</strong><span>{weakTopics ? "Assessment follow-up available" : "No current flags"}</span></div>
      <div><small>Attached resources</small><strong>{uniqueResources.length}</strong><span>Across class lesson plans</span></div>
    </div>

    <div className="ttClassLessonNow">
      <button type="button" className="past" onClick={() => openTimeline(last)} disabled={!last}><small>LAST LESSON</small><strong>{last?.topic || "No dated previous lesson"}</strong><span>{last ? `${formatDate(last.date)} · ${last.meta}` : "Build a dated plan to see lesson history"}</span></button>
      <button type="button" className="today" onClick={() => openTimeline(current)} disabled={!current}><small>TODAY</small><strong>{current?.topic || "No class lesson today"}</strong><span>{current ? `${formatDate(current.date)} · ${current.meta}` : "Use the timetable or dated plan for context"}</span></button>
      <button type="button" className="next" onClick={() => openTimeline(next)} disabled={!next}><small>NEXT LESSON</small><strong>{next?.topic || "No next dated lesson yet"}</strong><span>{next ? `${formatDate(next.date)} · ${next.meta}` : "Extend the medium-term plan to schedule more"}</span></button>
    </div>

    <StaffTimetableNextLesson
      className={className}
      lessons={lessons}
      profile={profile}
      assessments={assessments}
      mediumTermPlans={mediumTermPlans}
      today={today}
      readOnly={readOnly}
      onApply={onApplyNextSuggestion}
    />

    <nav className="ttClassWorkspaceNav" aria-label={`${className} workspace sections`}>{(Object.keys(sectionLabels) as Section[]).map((item) => <button type="button" key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{sectionLabels[item]}{item === "homework" && openHomework.length ? <i>{openHomework.length}</i> : item === "assessments" && weakTopics ? <i>{weakTopics}</i> : item === "resources" && uniqueResources.length ? <i>{uniqueResources.length}</i> : null}</button>)}</nav>

    {section === "overview" && <div className="ttClassOverviewGrid">
      <article className="ttClassCard"><div className="ttClassCardHead"><div><span>CURRICULUM JOURNEY</span><h3>{course?.title || inferred.subject}</h3></div><button className="ttMiniLink" onClick={onOpenMediumTerm}>Open plan</button></div><div className="ttClassJourney">{journey.length ? journey.map((item) => { const state = completed.has(item.sequencePosition) ? "complete" : item.sequencePosition === currentSequencePosition ? "current" : planned.has(item.sequencePosition) ? "planned" : "future"; return <div key={item.sequencePosition} className={state}><span>{item.sequencePosition + 1}</span><div><small>{item.unitTitle} · {item.subtopicTitle}</small><strong>{item.title}</strong></div></div>; }) : <div className="ttClassEmpty">No curriculum sequence is configured for this class.</div>}</div></article>
      <article className="ttClassCard"><div className="ttClassCardHead"><div><span>TIMETABLE</span><h3>Two-week class pattern</h3></div></div><div className="ttClassPattern">{sortedTimetable.map((lesson) => <button type="button" key={lesson.id} onClick={() => onOpenPlan(lesson.id)}><b>{lesson.week} · {lesson.day.slice(0, 3)} · P{lesson.period}</b><span>{lesson.start}–{lesson.end}{lesson.room ? ` · ${lesson.room}` : ""}</span><small>{lesson.plan.topic || "Open to plan this lesson"}</small></button>)}</div></article>
      <article className="ttClassCard"><div className="ttClassCardHead"><div><span>HOMEWORK</span><h3>Current workload</h3></div><button className="ttMiniLink" onClick={onOpenHomework}>Open tracker</button></div><div className="ttClassMiniList">{classHomework.slice(0, 5).map((item) => <div key={item.id} className={item.dueDate < today && homeworkOpen(item) ? "urgent" : ""}><strong>{item.title}</strong><span>{item.status} · due {formatDate(item.dueDate)}{typeof item.completionPercent === "number" ? ` · ${item.completionPercent}% complete` : ""}</span></div>)}{!classHomework.length && <div className="ttClassEmpty">No homework recorded for this class.</div>}</div></article>
      <article className="ttClassCard"><div className="ttClassCardHead"><div><span>ASSESSMENT</span><h3>Latest evidence</h3></div><button className="ttMiniLink" onClick={onOpenAssessments}>Open assessments</button></div>{latestAssessment ? <div className="ttClassAssessmentSummary"><strong>{latestAssessment.title}</strong><span>{formatDate(latestAssessment.assessmentDate)} · {latestAverage === null ? "results not entered" : `${latestAverage}% average`}</span><p>{latestAssessment.topicResults.filter((topic) => topic.scorePercent !== null && Number(topic.scorePercent) < latestAssessment.thresholdPercent).length} weak-topic flag(s) at a {latestAssessment.thresholdPercent}% threshold.</p></div> : <div className="ttClassEmpty">No assessments recorded for this class.</div>}</article>
    </div>}

    {section === "lessons" && <div className="ttClassLessonList">{classLessons.map((lesson) => <article key={lesson.id}><div><small>{lesson.week} · {lesson.day} · P{lesson.period}{lesson.plan.lessonDate ? ` · ${formatDate(lesson.plan.lessonDate)}` : ""}</small><strong>{lesson.plan.topic || "Lesson not planned yet"}</strong><span>{[lesson.plan.curriculumUnit, lesson.plan.curriculumSubtopic].filter(Boolean).join(" · ") || `${lesson.subject} · ${lesson.room || "Room not set"}`}</span></div><div><span>{lesson.plan.planningMode === "detailed" ? "Detailed plan" : lesson.plan.topic ? "Simple plan" : "Not planned"}</span><button className="ttButton" onClick={() => onOpenPlan(lesson.id)}>{lesson.plan.topic ? "Open plan" : "Plan lesson"}</button></div></article>)}</div>}

    {section === "support" && <div className="ttClassSection"><StaffTimetableInclusionProfile className={className} profile={inclusionProfile} readOnly={readOnly} onChange={onInclusionChange} /></div>}

    {section === "schemes" && <div className="ttClassSection"><StaffTimetableDepartmentSchemes className={className} subject={inferred.subject} currentCopy={departmentSchemeCopy} readOnly={readOnly} onImport={onImportScheme} /></div>}

    {section === "homework" && <div className="ttClassSection"><div className="ttClassSectionHead"><div><h3>Homework for {className}</h3><p>Lesson-linked tasks, completion and follow-up in one class view.</p></div><button className="ttButton" onClick={onOpenHomework}>Open full homework tracker</button></div><div className="ttClassHomeworkTable">{classHomework.map((item) => <div key={item.id} className={item.dueDate < today && homeworkOpen(item) ? "urgent" : ""}><span><strong>{item.title}</strong><small>{item.sourceTopic || item.curriculumUnit || "Class homework"}</small></span><span>{formatDate(item.dueDate)}</span><span>{item.status}</span><span>{typeof item.completionPercent === "number" ? `${item.completionPercent}%` : "—"}</span><span>{item.followUp && item.followUp !== "None" ? item.followUp : "No follow-up"}</span>{item.sourceLessonId ? <button className="ttMiniLink" onClick={() => onOpenPlan(item.sourceLessonId!)}>Open lesson</button> : <span />}</div>)}</div>{!classHomework.length && <div className="ttClassEmpty">No homework has been set for this class.</div>}</div>}

    {section === "assessments" && <div className="ttClassSection"><div className="ttClassSectionHead"><div><h3>Assessment evidence</h3><p>Class-level curriculum checks and weak-topic signals.</p></div><button className="ttButton primary" onClick={onOpenAssessments}>Open assessment workspace</button></div><div className="ttClassAssessmentList">{classAssessments.map((assessment) => { const avg = averageAssessment(assessment); const weak = assessment.topicResults.filter((topic) => topic.scorePercent !== null && Number(topic.scorePercent) < assessment.thresholdPercent); return <article key={assessment.id}><div><small>{formatDate(assessment.assessmentDate)}</small><strong>{assessment.title}</strong><span>{assessment.topicResults.length} curriculum point(s)</span></div><div><b>{avg === null ? "—" : `${avg}%`}</b><span>class average</span></div><div className={weak.length ? "warning" : ""}><b>{weak.length}</b><span>weak topics</span></div></article>; })}</div>{!classAssessments.length && <div className="ttClassEmpty">No assessments recorded for this class.</div>}</div>}

    {section === "resources" && <div className="ttClassSection"><div className="ttClassSectionHead"><div><h3>Class resource library</h3><p>Resources generated and attached inside this class&apos;s lesson plans.</p></div></div><div className="ttClassResourceGrid">{uniqueResources.map((resource) => <button type="button" key={resource.id} onClick={() => onOpenPlan(resource.lessonId)}><span>{resource.kind.replace(/-/g, " ")}</span><strong>{resource.title}</strong><small>{resource.lessonTopic} · {resource.source === "ai" ? "AI draft" : "Built-in draft"}</small></button>)}</div>{!uniqueResources.length && <div className="ttClassEmpty">No generated resources are attached to this class yet. Open a lesson plan to create them.</div>}</div>}

    {section === "notes" && <div className="ttClassSection"><div className="ttClassSectionHead"><div><h3>Class planning notes</h3><p>Keep class-level teaching reminders, misconceptions and next steps here. Do not store sensitive pupil records in this field.</p></div></div><label className="ttClassNotes"><span>Progress, misconceptions and next steps</span><textarea disabled={readOnly} value={notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="e.g. revisit balancing equations before the next calculation lesson; retrieval needed on ionic charges…" /></label></div>}
  </div>;
}
