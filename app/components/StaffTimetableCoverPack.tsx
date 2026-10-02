"use client";

import { useMemo, useState } from "react";
import { MediumTermPlan } from "./staffTimetableMediumTerm";
import { ClassInclusionProfile } from "./StaffTimetableInclusionProfile";
import { TimetableAttachedResource } from "./StaffTimetableLessonResources";
import "./StaffTimetablePlanningExtensions.css";

type CoverLesson = {
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
    vocabulary?: string;
    objectives?: string;
    sequence?: string;
    resources?: string;
    assessment?: string;
    teacherNotes?: string;
    retrieval?: string;
    teacherExplanation?: string;
    modelling?: string;
    guidedPractice?: string;
    independentPractice?: string;
    sendEalAdaptations?: string;
    stretchChallenge?: string;
    homeworkTask?: string;
    exitTicket?: string;
    generatedResources?: TimetableAttachedResource[];
  };
};

function formatDate(value: string) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function tidy(value?: string) { return (value || "").trim(); }

export default function StaffTimetableCoverPack({
  className,
  lessons,
  mediumTermPlan,
  inclusionProfile,
  today,
  onOpenPlan,
}: {
  className: string;
  lessons: CoverLesson[];
  mediumTermPlan?: MediumTermPlan;
  inclusionProfile?: ClassInclusionProfile;
  today: string;
  onOpenPlan: (lessonId: string) => void;
}) {
  const classLessons = lessons.filter((lesson) => lesson.className === className);
  const futureSessions = (mediumTermPlan?.sessions || []).filter((item) => item.date >= today && item.status === "planned").slice().sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
  const datedLessons = classLessons.filter((lesson) => tidy(lesson.plan.lessonDate) && String(lesson.plan.lessonDate) >= today).slice().sort((a, b) => String(a.plan.lessonDate).localeCompare(String(b.plan.lessonDate)) || a.period - b.period);
  const options = useMemo(() => {
    if (futureSessions.length) return futureSessions.map((session) => ({ key: session.id, lessonId: session.sourceLessonId, date: session.date, topic: session.topic, period: session.period }));
    return datedLessons.map((lesson) => ({ key: lesson.id, lessonId: lesson.id, date: lesson.plan.lessonDate || "", topic: lesson.plan.topic || "Planned lesson", period: lesson.period }));
  }, [futureSessions, datedLessons]);
  const [selectedKey, setSelectedKey] = useState("");
  const selected = options.find((item) => item.key === selectedKey) || options[0] || null;
  const lesson = selected ? classLessons.find((item) => item.id === selected.lessonId) || null : null;
  const session = selected ? futureSessions.find((item) => item.id === selected.key) || null : null;

  const topic = tidy(lesson?.plan.topic) || tidy(session?.topic) || "Lesson topic not yet set";
  const objectives = tidy(lesson?.plan.objectives) || tidy(session?.objectives);
  const vocabulary = tidy(lesson?.plan.vocabulary) || tidy(session?.vocabulary);
  const sequence = tidy(lesson?.plan.sequence) || tidy(session?.sequence);
  const assessment = tidy(lesson?.plan.assessment) || tidy(session?.assessment);
  const accessStrategies = inclusionProfile?.strategies || [];
  const resources = lesson?.plan.generatedResources || [];

  const packText = selected && lesson ? [
    `COVER LESSON: ${className}`,
    `${formatDate(selected.date)} · Period ${selected.period} · ${lesson.start}-${lesson.end} · ${lesson.room || "Room not set"}`,
    `Subject: ${lesson.subject}`,
    `Topic: ${topic}`,
    objectives ? `Objectives:\n${objectives}` : "",
    vocabulary ? `Key vocabulary:\n${vocabulary}` : "",
    tidy(lesson.plan.retrieval) ? `Starter / retrieval:\n${tidy(lesson.plan.retrieval)}` : "",
    tidy(lesson.plan.teacherExplanation) ? `Teacher explanation:\n${tidy(lesson.plan.teacherExplanation)}` : "",
    tidy(lesson.plan.modelling) ? `Modelling:\n${tidy(lesson.plan.modelling)}` : "",
    tidy(lesson.plan.guidedPractice) ? `Guided practice:\n${tidy(lesson.plan.guidedPractice)}` : "",
    tidy(lesson.plan.independentPractice) ? `Independent task:\n${tidy(lesson.plan.independentPractice)}` : sequence ? `Lesson sequence:\n${sequence}` : "",
    assessment ? `Assessment / check:\n${assessment}` : "",
    tidy(lesson.plan.exitTicket) ? `Exit ticket:\n${tidy(lesson.plan.exitTicket)}` : "",
    tidy(lesson.plan.homeworkTask) ? `Homework:\n${tidy(lesson.plan.homeworkTask)}` : "",
    accessStrategies.length || tidy(inclusionProfile?.notes) ? `Class access strategies:\n${[...accessStrategies.map((item) => `- ${item}`), tidy(inclusionProfile?.notes) ? `- ${tidy(inclusionProfile?.notes)}` : ""].filter(Boolean).join("\n")}` : "",
    resources.length ? `Attached resources:\n${resources.map((item) => `- ${item.title}`).join("\n")}` : tidy(lesson.plan.resources) ? `Resources:\n${tidy(lesson.plan.resources)}` : "",
    tidy(lesson.plan.teacherNotes) ? `Cover notes:\n${tidy(lesson.plan.teacherNotes)}` : "",
  ].filter(Boolean).join("\n\n") : "";

  const missing = selected && lesson ? [
    !objectives ? "objectives" : "",
    !sequence && !tidy(lesson.plan.independentPractice) ? "lesson sequence / independent task" : "",
    !assessment ? "assessment check" : "",
  ].filter(Boolean) : [];

  async function copyPack() {
    if (!packText) return;
    try { await navigator.clipboard.writeText(packText); }
    catch { /* Clipboard can be unavailable in restricted browser contexts. */ }
  }

  return <section className="ttPlanningExtension ttCoverPack">
    <div className="ttPlanningExtensionHead">
      <div><span>PHASE 17 · COVER-READY LESSONS</span><h3>Cover lesson pack</h3><p>Turn an upcoming planned lesson into a concise handover for another teacher without exposing individual pupil data.</p></div>
      <div className="ttCoverPackActions noPrint"><button type="button" className="ttButton" disabled={!packText} onClick={copyPack}>Copy pack</button><button type="button" className="ttButton primary" disabled={!packText} onClick={() => window.print()}>Print</button></div>
    </div>

    {!selected || !lesson ? <div className="ttPlanningExtensionEmpty"><strong>No upcoming dated lesson found</strong><span>Create or extend the medium-term plan, then this section will build the next cover pack automatically.</span></div> : <>
      <div className="ttCoverPackToolbar noPrint">
        <label><span>Upcoming lesson</span><select value={selected.key} onChange={(event) => setSelectedKey(event.target.value)}>{options.slice(0, 20).map((item) => <option key={item.key} value={item.key}>{formatDate(item.date)} · P{item.period} · {item.topic}</option>)}</select></label>
        <button type="button" className="ttButton" onClick={() => onOpenPlan(lesson.id)}>Edit full lesson plan</button>
      </div>

      {missing.length > 0 && <div className="ttCoverPackWarning"><strong>Cover-readiness check</strong><span>Add {missing.join(", ")} to make this handover clearer.</span></div>}

      <article className="ttCoverSheet">
        <header><div><span>COVER LESSON</span><h3>{className} · {lesson.subject}</h3><p>{formatDate(selected.date)} · Period {selected.period} · {lesson.start}–{lesson.end} · {lesson.room || "Room not set"}</p></div><div><small>Topic</small><strong>{topic}</strong></div></header>
        <div className="ttCoverSheetGrid">
          <section className="wide"><h4>Learning objectives</h4><p>{objectives || "Add objectives in the lesson plan."}</p></section>
          {vocabulary && <section><h4>Key vocabulary</h4><p>{vocabulary}</p></section>}
          {tidy(lesson.plan.retrieval) && <section><h4>Starter / retrieval</h4><p>{tidy(lesson.plan.retrieval)}</p></section>}
          {tidy(lesson.plan.teacherExplanation) && <section><h4>Teacher explanation</h4><p>{tidy(lesson.plan.teacherExplanation)}</p></section>}
          {tidy(lesson.plan.modelling) && <section><h4>Modelling</h4><p>{tidy(lesson.plan.modelling)}</p></section>}
          {tidy(lesson.plan.guidedPractice) && <section><h4>Guided practice</h4><p>{tidy(lesson.plan.guidedPractice)}</p></section>}
          <section className="wide"><h4>Main task / sequence</h4><p>{tidy(lesson.plan.independentPractice) || sequence || "Add the main task or lesson sequence in the full plan."}</p></section>
          <section><h4>Assessment / check</h4><p>{assessment || "Add an assessment check in the full lesson plan."}</p></section>
          {tidy(lesson.plan.exitTicket) && <section><h4>Exit ticket</h4><p>{tidy(lesson.plan.exitTicket)}</p></section>}
          {(accessStrategies.length > 0 || tidy(inclusionProfile?.notes)) && <section className="wide"><h4>Class access strategies</h4><ul>{accessStrategies.map((item) => <li key={item}>{item}</li>)}{tidy(inclusionProfile?.notes) && <li>{tidy(inclusionProfile?.notes)}</li>}</ul></section>}
          {(resources.length > 0 || tidy(lesson.plan.resources)) && <section><h4>Resources</h4>{resources.length ? <ul>{resources.map((item) => <li key={item.id}>{item.title}</li>)}</ul> : <p>{tidy(lesson.plan.resources)}</p>}</section>}
          {tidy(lesson.plan.homeworkTask) && <section><h4>Homework</h4><p>{tidy(lesson.plan.homeworkTask)}</p></section>}
          {tidy(lesson.plan.teacherNotes) && <section className="wide"><h4>Cover notes</h4><p>{tidy(lesson.plan.teacherNotes)}</p></section>}
        </div>
      </article>
    </>}
  </section>;
}
