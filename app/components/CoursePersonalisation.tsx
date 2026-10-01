"use client";
import { useState } from "react";
import type { Course } from "@/lib/catalogue";
import { startingQuestions, recommendedFocus, roleExample, practiceRoles, practicePhases, personalisationKey, readStartingPoint, type PracticeRole, type PracticePhase } from "@/lib/courseLearningTools";
import { scoreAssessment } from "@/lib/assessmentQuestions";

export default function CoursePersonalisation({ course, saved, onSave, onSelectModule }: { course: Course; saved?: string; onSave: (key: string, value: string) => Promise<void>; onSelectModule: (id: string) => void }) {
  const [initial] = useState(() => readStartingPoint(course, saved));
  const [role, setRole] = useState<PracticeRole>(initial.role), [phase, setPhase] = useState<PracticePhase>(initial.phase);
  const [answers, setAnswers] = useState<Record<number, number>>(initial.answers);
  const [checked, setChecked] = useState(initial.checked), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const questions = startingQuestions(course), score = scoreAssessment(questions, answers);
  const weakTopics = questions.filter((q, i) => answers[i] !== q.answer).map(q => q.topic);
  const focus = recommendedFocus(course, score.percent, weakTopics), example = roleExample(course, role, phase);
  async function save() {
    setBusy(true); setMessage("");
    try { await onSave(personalisationKey, JSON.stringify({version:1,role,phase,answers,questionIds:questions.map(q => q.question),percent:score.percent,weakTopics,questionCount:questions.length,completedAt:new Date().toISOString()})); setMessage("Starting-point recommendation saved. Required tasks are unchanged."); }
    catch { setMessage("Could not save your recommendation. Your answers remain here; retry when ready."); }
    finally { setBusy(false); }
  }
  return <section className="learningToolPanel" aria-label="Personalised course starting point">
    <span className="practiceEyebrow">START WITH YOUR CONTEXT · OPTIONAL</span><h3>Find your focus</h3>
    <p>Up to three starting questions suggest where to spend more attention. They do not award completion, exemption or professional competence.</p>
    <div className="contextChoices"><label>My practice role<select value={role} onChange={e => { setRole(e.target.value as PracticeRole); setMessage(""); }}>{practiceRoles.map(r => <option key={r}>{r}</option>)}</select></label><label>My teaching phase<select value={phase} onChange={e => { setPhase(e.target.value as PracticePhase); setMessage(""); }}>{practicePhases.map(p => <option key={p}>{p}</option>)}</select></label></div>
    <details className="readingReference" open><summary>A {role.toLowerCase()} example for {phase}</summary>
      <p><strong>Course focus:</strong> {example.objective}</p><p><strong>Fictional course case:</strong> {example.case}</p>
      <p><strong>Rehearse in your role:</strong> {example.roleTask}</p><p><strong>Adapt to the phase:</strong> {example.phaseTask}</p>
      <p>Use this as a discussion prompt, not a substitute for individual plans, current policy or designated guidance.</p>
    </details>
    {questions.map((q, i) => <fieldset className="evidenceCard" key={q.question}><legend>{i + 1}. {q.question}</legend>{q.options.map((o, n) => <label key={o}><input type="radio" name={"starting-" + course.id + "-" + i} checked={answers[i] === n} disabled={checked} onChange={() => { setAnswers(a => ({...a,[i]:n})); setMessage(""); }}/>{o}</label>)}{checked && <div className="practiceFeedback"><strong>{answers[i] === q.answer ? "Correct" : "Revisit this distinction"}</strong><p>Course response: {q.options[q.answer]}</p><p>{q.feedback}</p>{answers[i] !== q.answer && <p>{q.reteach}</p>}</div>}</fieldset>)}
    {!checked ? <button type="button" className="primary" onClick={() => { if (!score.complete) { setMessage("Answer each starting question first."); return; } setChecked(true); setMessage(""); }}>Show my recommended focus</button>
      : <><div className="practiceFeedback"><h4>{focus.label}</h4><p>{score.correct}/{questions.length} starting questions · {focus.explanation}</p><p>Recommended focus points in your course:</p>{focus.moduleIds.map(id => <button type="button" className="secondary" key={id} onClick={() => onSelectModule(id)}>Open: {course.modules.find(m => m.id === id)?.title}</button>)}</div><div className="practiceSave"><button type="button" className="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save starting-point recommendation"}</button><button type="button" className="secondary" onClick={() => {setAnswers({});setChecked(false);setMessage("");}}>Try starting questions again</button></div></>}
    {message && <p role="status">{message}</p>}
  </section>;
}
