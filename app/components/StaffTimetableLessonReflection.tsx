"use client";

import "./StaffTimetableLessonReflection.css";

export type LessonReflectionOutcome = "" | "went-well" | "needs-revisiting" | "not-completed";

export default function StaffTimetableLessonReflection({
  outcome,
  note,
  updatedAt,
  readOnly,
  onChange,
}: {
  outcome: LessonReflectionOutcome;
  note: string;
  updatedAt?: string;
  readOnly: boolean;
  onChange: (next: { outcome: LessonReflectionOutcome; note: string; updatedAt: string }) => void;
}) {
  function setOutcome(next: LessonReflectionOutcome) {
    if (readOnly) return;
    onChange({ outcome: next, note, updatedAt: new Date().toISOString() });
  }
  function setNote(next: string) {
    if (readOnly) return;
    onChange({ outcome, note: next, updatedAt: new Date().toISOString() });
  }

  return <section className="ttReflection">
    <div className="ttReflectionHead"><div><span>PHASE 11 · QUICK REFLECTION</span><h3>How did the lesson go?</h3><p>One click is enough. Add a short note only when useful.</p></div>{updatedAt && <small>Updated {new Date(updatedAt).toLocaleString("en-GB")}</small>}</div>
    <div className="ttReflectionChoices">
      <button type="button" disabled={readOnly} className={outcome === "went-well" ? "active good" : "good"} onClick={() => setOutcome("went-well")}><strong>Went well</strong><span>Keep moving through the planned sequence.</span></button>
      <button type="button" disabled={readOnly} className={outcome === "needs-revisiting" ? "active revisit" : "revisit"} onClick={() => setOutcome("needs-revisiting")}><strong>Needs revisiting</strong><span>Add retrieval/reteach before the class moves on.</span></button>
      <button type="button" disabled={readOnly} className={outcome === "not-completed" ? "active incomplete" : "incomplete"} onClick={() => setOutcome("not-completed")}><strong>Lesson not completed</strong><span>Carry unfinished learning into the next lesson.</span></button>
    </div>
    <label><span>Optional note</span><textarea disabled={readOnly} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. most pupils confused mass and weight; practical took longer than expected; ready to move on…" /></label>
    {outcome === "needs-revisiting" && <div className="ttReflectionAutomation">When this plan is saved, the next class lesson will receive a retrieval/reteach prompt automatically.</div>}
    {outcome === "not-completed" && <div className="ttReflectionAutomation">When this plan is saved, the next class lesson will be flagged to continue the unfinished content.</div>}
  </section>;
}
