"use client";
import { useState } from "react";
import type { Course } from "@/lib/catalogue";
import { startingQuestions } from "@/lib/courseLearningTools";
import { followUpKey, followUpSchedule, readFollowUp, reviewCalendar, type FollowUpCheck } from "@/lib/courseFollowUp";

export default function CourseFollowUp({ course, completedAt, saved, onSave }: { course: Course; completedAt?: string; saved?: string; onSave: (key: string, value: string) => Promise<void> }) {
  const [record, setRecord] = useState(() => readFollowUp(saved));
  const [days, setDays] = useState<7 | 14>(7), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const startDate = record.startDate || completedAt?.slice(0,10) || "";
  const questions = startingQuestions(course), schedule = followUpSchedule(startDate, new Date().toISOString().slice(0,10));
  const check = record.checks.find(c => c.days === days);
  const current: FollowUpCheck = check && JSON.stringify(check.questionIds) === JSON.stringify(questions.map(q => q.question)) ? check : {days,recalls:questions.map(() => ""),reflection:"",questionIds:questions.map(q => q.question)};
  const [revealed, setRevealed] = useState(false);
  function edit(value: Partial<FollowUpCheck>) {
    setRecord(r => ({...r,checks:[...r.checks.filter(c => c.days !== days),{...current,...value,reviewedAt:undefined}]})); setMessage("");
  }
  async function save() {
    if (!startDate) { setMessage("Choose a follow-up starting date first."); return; }
    if (!revealed || !current.recalls.every(s => s.trim()) || current.reflection.trim().length < 10) { setMessage("Attempt each recall question, compare feedback and add an implementation reflection before saving."); return; }
    const next = {...record,startDate,checks:[...record.checks.filter(c => c.days !== days),{...current,reviewedAt:new Date().toISOString()}]};
    setBusy(true); setMessage("");
    try { await onSave(followUpKey,JSON.stringify(next)); setRecord(next); setMessage("Follow-up reflection saved. This is a self-review, not a competence certificate."); }
    catch { setMessage("Could not save. Your recall and reflection drafts are still here; retry."); }
    finally { setBusy(false); }
  }
  function download() {
    const contents = reviewCalendar(course,startDate); if (!contents) return;
    const url = URL.createObjectURL(new Blob([contents],{type:"text/calendar;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = course.id + "-follow-up.ics"; link.click(); URL.revokeObjectURL(url);
  }
  return <section className="learningToolPanel" aria-label="Course follow-up learning"><span className="practiceEyebrow">RECALL · TRY · REVIEW · OPTIONAL</span><h3>Return to the learning</h3>
    <p>Revisit the course after 7 and 14 days. These are suggested review points, not extra course time or a condition of certification. Fictional or non-identifiable examples only.</p>
    {startDate ? <><p>Follow-up starts from {startDate}{record.startDate ? " (your saved plan)" : " (course completion)"}. You may practise early.</p><ul>{schedule.map(item => <li key={item.days}>{item.days}-day review: {item.due} · {record.checks.find(c => c.days === item.days)?.reviewedAt ? "Self-review saved" : item.status}</li>)}</ul><button type="button" className="secondary" onClick={download}>Download 7- and 14-day calendar reminders</button><p><small>Import the downloaded file into your calendar. No email or background notification is sent by this app; your calendar controls reminders.</small></p></>
      : <><p>A schedule will use your course completion date. You can also plan a follow-up before completion.</p><button type="button" className="secondary" disabled={busy} onClick={async () => {const next = {...record,startDate:new Date().toISOString().slice(0,10)};setBusy(true);try {await onSave(followUpKey,JSON.stringify(next));setRecord(next);setMessage("Follow-up plan saved.");} catch {setMessage("Could not save the follow-up plan. Try again.");} finally {setBusy(false);}}}>Plan follow-up from today</button></>}
    <div className="practiceStepTabs" role="group" aria-label="Follow-up interval">{([7,14] as const).map(n => <button type="button" className="secondary" aria-pressed={days === n} key={n} onClick={() => {setDays(n);setRevealed(false);setMessage("");}}>{n}-day review</button>)}</div>
    <h4>Recall before checking</h4>
    <p>Recall and reflection drafts are saved only when you use Save follow-up self-review. Comparing feedback does not save them.</p>
    {questions.map((q,i) => <label className="practiceNoteLabel" key={days + q.question}>{q.question}<textarea value={current.recalls[i] || ""} onChange={e => {const recalls = [...current.recalls];recalls[i] = e.target.value;edit({recalls});setRevealed(false);}}/></label>)}
    <button type="button" className="secondary" disabled={!current.recalls.length || !current.recalls.every(s => s.trim())} onClick={() => setRevealed(v => !v)}>{revealed ? "Hide recall feedback" : "Compare recall with course feedback"}</button>
    {revealed && <div className="practiceFeedback">{questions.map(q => <div key={q.question}><strong>{q.options[q.answer]}</strong><p>{q.feedback}</p><p>{q.reteach}</p></div>)}<p>Correct your understanding before applying it. This text comparison does not automatically score your written response.</p></div>}
    <label className="practiceNoteLabel">What did I try, what evidence emerged, and what will I keep, adapt or stop?<textarea value={current.reflection} onChange={e => edit({reflection:e.target.value})}/></label>
    <button type="button" className="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save follow-up self-review"}</button>{message && <p role="status">{message}</p>}
  </section>;
}
