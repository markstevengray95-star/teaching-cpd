"use client";

import { useMemo, useState } from "react";
import { type MediumTermPlan, type MediumTermSession } from "./staffTimetableMediumTerm";
import "./StaffTimetablePlanningCalendar.css";

type CurriculumPayload = Pick<MediumTermSession, "sequencePosition" | "topic" | "unitTitle" | "subtopicTitle" | "vocabulary" | "objectives" | "sequence" | "assessment">;

const payloadKeys: (keyof CurriculumPayload)[] = ["sequencePosition", "topic", "unitTitle", "subtopicTitle", "vocabulary", "objectives", "sequence", "assessment"];

function payloadOf(session: MediumTermSession): CurriculumPayload {
  return {
    sequencePosition: session.sequencePosition,
    topic: session.topic,
    unitTitle: session.unitTitle,
    subtopicTitle: session.subtopicTitle,
    vocabulary: session.vocabulary,
    objectives: session.objectives,
    sequence: session.sequence,
    assessment: session.assessment,
  };
}

function applyPayload(session: MediumTermSession, payload: CurriculumPayload): MediumTermSession {
  const next = { ...session };
  payloadKeys.forEach((key) => {
    (next as unknown as Record<string, unknown>)[key] = payload[key];
  });
  return next;
}

export function reorderMediumTermPlanSessions(plan: MediumTermPlan, sourceId: string, targetId: string, shiftRemaining: boolean): MediumTermPlan {
  if (!sourceId || !targetId || sourceId === targetId) return plan;
  const ordered = plan.sessions.slice().sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
  const source = ordered.find((session) => session.id === sourceId);
  const target = ordered.find((session) => session.id === targetId);
  if (!source || !target || source.status === "complete" || target.status === "complete") return plan;

  const editable = ordered.filter((session) => session.status !== "complete");
  const sourceIndex = editable.findIndex((session) => session.id === sourceId);
  const targetIndex = editable.findIndex((session) => session.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return plan;

  const payloads = editable.map(payloadOf);
  if (shiftRemaining) {
    const [moved] = payloads.splice(sourceIndex, 1);
    payloads.splice(targetIndex, 0, moved);
  } else {
    [payloads[sourceIndex], payloads[targetIndex]] = [payloads[targetIndex], payloads[sourceIndex]];
  }

  const replacements = new Map(editable.map((session, index) => [session.id, applyPayload(session, payloads[index])]));
  return {
    ...plan,
    generatedAt: new Date().toISOString(),
    sessions: plan.sessions.map((session) => replacements.get(session.id) || session),
  };
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function mondayKey(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function StaffTimetablePlanningCalendar({ plan, readOnly, onMove, onOpenLesson }: {
  plan?: MediumTermPlan;
  readOnly: boolean;
  onMove: (sourceId: string, targetId: string, shiftRemaining: boolean) => void;
  onOpenLesson?: (lessonId: string) => void;
}) {
  const [dragging, setDragging] = useState("");
  const [shiftRemaining, setShiftRemaining] = useState(true);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");

  const ordered = useMemo(() => (plan?.sessions || []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period), [plan]);
  const movable = ordered.filter((session) => session.status !== "complete");
  const weeks = useMemo(() => {
    const groups = new Map<string, MediumTermSession[]>();
    ordered.forEach((session) => {
      const key = mondayKey(session.date);
      groups.set(key, [...(groups.get(key) || []), session]);
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ordered]);

  function move(sourceId: string, targetId: string) {
    if (readOnly || !sourceId || !targetId || sourceId === targetId) return;
    onMove(sourceId, targetId, shiftRemaining);
    setDragging("");
    setSelectedSource("");
    setSelectedTarget("");
  }

  if (!plan) return <section className="ttPlanningCalendar empty"><span>PHASE 15 · PLANNING CALENDAR</span><h3>Create a medium-term plan first</h3><p>The drag-and-drop calendar uses the real dated teaching slots from the class medium-term plan.</p></section>;

  return <section className="ttPlanningCalendar">
    <div className="ttPlanningCalendarHead">
      <div><span>PHASE 15 · DRAG-AND-DROP PLANNING</span><h3>Planning calendar</h3><p>Move curriculum lessons between real timetable dates. Completed lessons are locked so taught history cannot be accidentally reordered.</p></div>
      <label className="ttCalendarMode"><input type="checkbox" checked={shiftRemaining} onChange={(event) => setShiftRemaining(event.target.checked)} disabled={readOnly} /><span><strong>Shift remaining sequence</strong><small>{shiftRemaining ? "Insert the lesson at the new point and move the intervening sequence." : "Swap only the two selected lesson contents."}</small></span></label>
    </div>

    <div className="ttCalendarAccessibleMove">
      <label><span>Move lesson</span><select disabled={readOnly || !movable.length} value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}><option value="">Choose lesson…</option>{movable.map((session) => <option key={session.id} value={session.id}>{formatDate(session.date)} · P{session.period} · {session.topic}</option>)}</select></label>
      <label><span>To timetable slot</span><select disabled={readOnly || !selectedSource} value={selectedTarget} onChange={(event) => setSelectedTarget(event.target.value)}><option value="">Choose destination…</option>{movable.filter((session) => session.id !== selectedSource).map((session) => <option key={session.id} value={session.id}>{formatDate(session.date)} · P{session.period} · {session.topic}</option>)}</select></label>
      <button type="button" className="ttButton primary" disabled={readOnly || !selectedSource || !selectedTarget} onClick={() => move(selectedSource, selectedTarget)}>Move lesson</button>
    </div>

    <div className="ttCalendarLegend"><span><i className="planned" /> Planned</span><span><i className="complete" /> Completed / locked</span><span><i className="missed" /> Missed / movable</span></div>

    <div className="ttPlanningWeeks">{weeks.map(([weekStart, sessions]) => <article key={weekStart} className="ttPlanningWeek">
      <header><strong>Week of {formatDate(weekStart)}</strong><span>{sessions.length} lesson slot(s)</span></header>
      <div>{sessions.map((session) => {
        const locked = readOnly || session.status === "complete";
        return <div
          key={session.id}
          className={`ttPlanningSlot ${session.status} ${dragging === session.id ? "dragging" : ""}`}
          draggable={!locked}
          onDragStart={(event) => { if (locked) return; setDragging(session.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", session.id); }}
          onDragEnd={() => setDragging("")}
          onDragOver={(event) => { if (!locked && dragging && dragging !== session.id) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
          onDrop={(event) => { event.preventDefault(); const sourceId = event.dataTransfer.getData("text/plain") || dragging; move(sourceId, session.id); }}
        >
          <div className="ttPlanningSlotDate"><strong>{formatDate(session.date)}</strong><span>{session.week} · P{session.period} · {session.start}</span></div>
          <div className="ttPlanningSlotTopic"><small>{session.unitTitle}{session.subtopicTitle ? ` · ${session.subtopicTitle}` : ""}</small><strong>{session.topic}</strong><span>Sequence {session.sequencePosition + 1}</span></div>
          <div className="ttPlanningSlotActions"><span>{session.status === "complete" ? "Locked" : session.status === "missed" ? "Missed" : "Drag to move"}</span>{session.sourceLessonId && onOpenLesson && <button type="button" className="ttMiniLink" onClick={() => onOpenLesson(session.sourceLessonId)}>Open lesson</button>}</div>
        </div>;
      })}</div>
    </article>)}</div>
  </section>;
}
