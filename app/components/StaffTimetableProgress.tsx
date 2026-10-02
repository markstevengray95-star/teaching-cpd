"use client";

import { useMemo, useState } from "react";
import {
  ClassCurriculumProfile,
  getCourseLessonSequence,
  getPhase1Course,
  inferClassCurriculumProfile,
  profileLabel,
} from "./staffTimetableCurriculumPhase1";
import { MediumTermPlan } from "./staffTimetableMediumTerm";
import "./StaffTimetableProgress.css";

type ProgressLesson = {
  className: string;
  subject: string;
  plan: {
    topic?: string;
    courseId?: string;
    sequencePosition?: number;
  };
};

type SequenceState = "complete" | "current" | "planned" | "not-taught";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function StaffTimetableProgress({
  lessons,
  profiles,
  mediumTermPlans,
  today,
  onOpenMediumTerm,
}: {
  lessons: ProgressLesson[];
  profiles: Record<string, ClassCurriculumProfile>;
  mediumTermPlans: MediumTermPlan[];
  today: string;
  onOpenMediumTerm?: (className: string) => void;
}) {
  const classes = useMemo(() => [...new Set(lessons.map((lesson) => lesson.className).filter(Boolean))].sort(), [lessons]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || "");
  const visibleClass = classes.includes(selectedClass) ? selectedClass : classes[0] || "";

  const rows = useMemo(() => classes.map((className) => {
    const classLessons = lessons.filter((lesson) => lesson.className === className);
    const profile = profiles[className] || inferClassCurriculumProfile(className, classLessons[0]?.subject || "Science");
    const sequence = getCourseLessonSequence(profile);
    const medium = mediumTermPlans.find((plan) => plan.className === className && (!profile.courseId || plan.courseId === profile.courseId)) || mediumTermPlans.find((plan) => plan.className === className);

    const completed = new Set<number>((medium?.sessions || []).filter((session) => session.status === "complete").map((session) => session.sequencePosition));
    const planned = new Set<number>([
      ...classLessons.map((lesson) => Number(lesson.plan.sequencePosition)).filter((position) => Number.isInteger(position) && position >= 0),
      ...(medium?.sessions || []).filter((session) => session.status === "planned" || session.status === "complete").map((session) => session.sequencePosition),
    ]);
    completed.forEach((position) => planned.add(position));

    let currentIndex = sequence.findIndex((item) => !completed.has(item.sequencePosition) && planned.has(item.sequencePosition));
    if (currentIndex < 0) currentIndex = sequence.findIndex((item) => !completed.has(item.sequencePosition));
    const currentPosition = currentIndex >= 0 ? sequence[currentIndex].sequencePosition : -1;

    const states = sequence.map((item): SequenceState => {
      if (completed.has(item.sequencePosition)) return "complete";
      if (item.sequencePosition === currentPosition) return "current";
      if (planned.has(item.sequencePosition)) return "planned";
      return "not-taught";
    });

    const completeCount = states.filter((state) => state === "complete").length;
    const plannedCount = states.filter((state) => state !== "not-taught").length;
    const remaining = Math.max(0, sequence.length - completeCount);
    const futureSlots = (medium?.sessions || []).filter((session) => session.date >= today && session.status === "planned").length;
    const shortfall = profile.stage !== "KS3" && medium ? Math.max(0, remaining - futureSlots) : 0;
    const unscheduled = states.filter((state) => state === "not-taught").length;

    return {
      className,
      profile,
      sequence,
      states,
      medium,
      completeCount,
      plannedCount,
      remaining,
      futureSlots,
      shortfall,
      unscheduled,
      coverage: sequence.length ? clampPercent(completeCount / sequence.length * 100) : 0,
      scheduledCoverage: sequence.length ? clampPercent(plannedCount / sequence.length * 100) : 0,
    };
  }), [classes, lessons, profiles, mediumTermPlans, today]);

  const selected = rows.find((row) => row.className === visibleClass) || rows[0];

  if (!classes.length) {
    return <section className="ttProgressShell"><div className="ttProgressEmpty"><strong>No classes yet</strong><span>Import or build your timetable first, then curriculum progression will appear here.</span></div></section>;
  }

  return <section className="ttProgressShell">
    <div className="ttProgressHero">
      <div><span>PHASE 6 · CURRICULUM PROGRESSION</span><h2>Course coverage & remaining lessons</h2><p>Progress updates from your lesson plans and medium-term plan. Completed sessions count as taught; planned sessions show what is scheduled next.</p></div>
      <label><span>Class</span><select value={visibleClass} onChange={(event) => setSelectedClass(event.target.value)}>{classes.map((className) => <option key={className}>{className}</option>)}</select></label>
    </div>

    <div className="ttProgressClassGrid">
      {rows.map((row) => <button type="button" key={row.className} className={row.className === visibleClass ? "active" : ""} onClick={() => setSelectedClass(row.className)}>
        <b>{row.className}</b><small>{getPhase1Course(row.profile.courseId)?.title || row.profile.subject}</small><div><i><em style={{ width: `${row.coverage}%` }} /></i><span>{row.coverage}% taught</span></div>{row.shortfall > 0 && <strong>{row.shortfall} lesson shortfall</strong>}
      </button>)}
    </div>

    {selected && <>
      <div className="ttProgressKpis">
        <div><small>Taught</small><strong>{selected.completeCount}/{selected.sequence.length}</strong><span>{selected.coverage}% complete</span></div>
        <div><small>Scheduled</small><strong>{selected.plannedCount}/{selected.sequence.length}</strong><span>{selected.scheduledCoverage}% covered by plans</span></div>
        <div><small>Unscheduled content</small><strong>{selected.unscheduled}</strong><span>Specification lessons not yet placed</span></div>
        <div className={selected.shortfall > 0 ? "warning" : ""}><small>Future timetable slots</small><strong>{selected.futureSlots}</strong><span>{selected.shortfall > 0 ? `${selected.shortfall} fewer than remaining content` : "Enough for currently mapped content"}</span></div>
      </div>

      <div className="ttProgressCourseHead">
        <div><h3>{selected.className}</h3><p>{profileLabel(selected.profile)}</p></div>
        <div>{selected.medium ? <><span>Medium-term plan: {selected.medium.startDate} → {selected.medium.endDate}</span>{onOpenMediumTerm && <button type="button" className="ttButton" onClick={() => onOpenMediumTerm(selected.className)}>Open medium-term plan</button>}</> : <><span>No dated medium-term plan yet.</span>{onOpenMediumTerm && <button type="button" className="ttButton primary" onClick={() => onOpenMediumTerm(selected.className)}>Build medium-term plan</button>}</>}</div>
      </div>

      {selected.shortfall > 0 && <div className="ttProgressWarning"><strong>Course completion warning</strong><span>There are {selected.remaining} curriculum lessons still not marked complete but only {selected.futureSlots} planned teaching sessions remaining in the current dated plan. Extend/reflow the medium-term plan, review lesson sequencing, or identify where content can be combined without dropping required learning.</span></div>}

      {selected.unscheduled > 0 && <div className="ttProgressNotice"><strong>{selected.unscheduled} curriculum lesson{selected.unscheduled === 1 ? " is" : "s are"} not scheduled.</strong><span>Use the medium-term planner to place them into real timetable dates. This tracker does not assume a topic is taught merely because its date has passed.</span></div>}

      <div className="ttProgressLegend"><span className="complete">Completed</span><span className="current">Current</span><span className="planned">Planned</span><span className="not-taught">Not yet taught</span></div>

      <div className="ttProgressSequence">
        {selected.sequence.map((item, index) => {
          const state = selected.states[index];
          return <article key={`${item.courseId}-${item.sequencePosition}`} className={state}>
            <div><span>{item.sequencePosition + 1}</span><i /></div>
            <section><small>{item.unitTitle} · {item.subtopicTitle}</small><strong>{item.title}</strong><p>{state === "complete" ? "Marked complete in the dated plan." : state === "current" ? "Next/current curriculum lesson." : state === "planned" ? "Already placed in lesson or medium-term planning." : "Not yet placed in a lesson."}</p></section>
          </article>;
        })}
      </div>
    </>}
  </section>;
}
