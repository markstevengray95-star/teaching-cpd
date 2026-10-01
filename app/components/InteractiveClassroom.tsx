"use client";
import { useState } from "react";
import type { Course } from "@/lib/catalogue";
import { classroomCase, classroomScore } from "@/lib/classroomPractice";

type Draft = { evidence: string[]; decision: number | null; rationale: string; review: string };
function readDraft(saved: string): Draft {
  const empty = { evidence: ["", "", "", ""], decision: null, rationale: "", review: "" };
  try { const d = JSON.parse(saved); return { evidence: Array.isArray(d.evidence) && d.evidence.length === 4 ? d.evidence : empty.evidence, decision: Number.isInteger(d.decision) && d.decision >= 0 && d.decision < 3 ? d.decision : null, rationale: typeof d.rationale === "string" ? d.rationale : "", review: typeof d.review === "string" ? d.review : "" }; } catch { return empty; }
}

export default function InteractiveClassroom({ course, saved, onSave }: { course: Course; saved: string; onSave: (value: string) => Promise<void> }) {
  const practice = classroomCase(course);
  const [draft, setDraft] = useState(() => readDraft(saved));
  const [stage, setStage] = useState(0);
  const [hotspot, setHotspot] = useState(0);
  const [checked, setChecked] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const statements = [...practice.observations, practice.inference];
  const result = classroomScore(practice, draft.evidence, draft.decision);
  async function save() {
    if (!checked || !reviewed || draft.rationale.trim().length < 20 || draft.review.trim().length < 20) { setMessage("Complete both reasoning steps before saving. Use at least 20 characters in each response."); return; }
    setBusy(true);
    try { await onSave(JSON.stringify(draft)); setMessage("Practice saved to your course notes. This is rehearsal, not proof of real-world competence."); }
    catch { setMessage("Practice could not be saved. Your responses are still here; retry when ready."); }
    finally { setBusy(false); }
  }
  return <section className="classroomPractice labPanel" aria-label="Interactive professional situation">
    <span className="labKicker">OBSERVE · DECIDE · REVIEW</span>
    <h4>{course.category === "Safeguarding" ? "Rehearse a professional response" : "Use the classroom evidence"}</h4>
    <p>Course lens: <strong>{course.objectives[0]}</strong>. This category-based fictional rehearsal connects that lens to evidence, a decision and follow-up—not a diagnosis or a real pupil record.</p>
    <nav aria-label="Practice steps" className="practiceStepTabs">{["1 Observe", "2 Decide", "3 Review"].map((label, i) => <button type="button" key={label} className="secondary" aria-pressed={stage === i} onClick={() => setStage(i)}>{label}</button>)}</nav>
    <p className="practiceSetting">{practice.setting}</p>
    {stage === 0 && <>
      <div className="evidenceScene" role="group" aria-label="Evidence hotspots">{["Pupil / team voice", "Task / environment", "Support / next clue"].map((label, i) => <button type="button" key={label} aria-pressed={hotspot === i} onClick={() => setHotspot(i)}><span>{i + 1}</span>{label}</button>)}</div>
      <div className="practiceFeedback" role="status"><strong>Observed information</strong><p>{practice.observations[hotspot]}</p><small>What does this tell you—and what does it not establish?</small></div>
      <h5>Separate evidence from interpretation</h5>
      {statements.map((statement, i) => <fieldset key={statement} className="evidenceCard"><legend>{statement}</legend>{["observation", "inference"].map(value => <label key={value}><input type="radio" name={`classroom-${course.id}-${i}`} checked={draft.evidence[i] === value} onChange={() => { setChecked(false); setDraft(d => ({ ...d, evidence: d.evidence.map((e, n) => n === i ? value : e) })); }}/>{value === "observation" ? "Observation / reported fact" : "Interpretation / assumption"}</label>)}</fieldset>)}
      <button type="button" className="primary" onClick={() => { if (draft.evidence.some(e => !e)) { setMessage("Classify all four statements first."); return; } setChecked(true); setMessage(""); }}>Check evidence</button>
      {checked && <p role="status" className="practiceFeedback">{result.evidence}/4 correct. The first three describe reported or observed information; the fourth adds an explanation that those facts do not establish.</p>}
      <button type="button" className="secondary" onClick={() => setStage(1)}>Continue to decision →</button>
    </>}
    {stage === 1 && <>
      <h5>{practice.question}</h5><div className="decisionChoices">{practice.options.map((option, i) => <button type="button" key={option} aria-pressed={draft.decision === i} onClick={() => { setReviewed(false); setDraft(d => ({ ...d, decision: i })); }}>{option}</button>)}</div>
      <label className="practiceNoteLabel">My decision and evidence<textarea value={draft.rationale} onChange={e => setDraft(d => ({ ...d, rationale: e.target.value }))} placeholder="Explain which evidence supports your response and what remains uncertain. No personal information."/></label>
      <button type="button" className="primary" onClick={() => { if (draft.decision === null || draft.rationale.trim().length < 20) { setMessage("Choose a response and explain your reasoning before comparing."); return; } setReviewed(true); setMessage(""); }}>Compare my decision</button>
      {reviewed && <div className="practiceFeedback" role="status"><strong>{result.decision ? "Evidence-aligned response" : "Reconsider your response"}</strong><p>{practice.feedback}</p></div>}
      <button type="button" className="secondary" onClick={() => setStage(2)}>See the follow-up →</button>
    </>}
    {stage === 2 && <>
      <h5>New information</h5><p>{practice.followUp}</p>
      <label className="practiceNoteLabel">What would I keep, change or escalate?<textarea value={draft.review} onChange={e => setDraft(d => ({ ...d, review: e.target.value }))} placeholder="Explain your next move and what you would check. Use only this fictional example."/></label>
      <details className="readingReference"><summary>Compare with the review note</summary><p>{practice.review}</p></details>
      <button type="button" className="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save classroom practice"}</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => { setDraft(readDraft("")); setStage(0); setChecked(false); setReviewed(false); setMessage("Practice reset. A previously saved record is not deleted."); }}>Reset rehearsal</button>
    </>}
    {message && <p role="status" className="practiceSaveMessage">{message}</p>}
  </section>;
}

