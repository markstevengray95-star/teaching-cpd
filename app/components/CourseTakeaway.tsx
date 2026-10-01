"use client";
import { useState } from "react";
import type { Course } from "@/lib/catalogue";
import { readTakeaway, takeawayText, toolkitKey, learningToolsVersion, type Takeaway } from "@/lib/courseLearningTools";

export default function CourseTakeaway({ course, saved, onSave }: { course: Course; saved?: string; onSave: (key: string, value: string) => Promise<void> }) {
  const [plan, setPlan] = useState(() => readTakeaway(saved));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const checklist = course.modules.find(m => m.type === "checklist");
  const fields: { key: keyof Takeaway; label: string }[] = [
    { key: "problem", label: "What specific need will I address?" },
    { key: "action", label: "What one course-informed action will I take?" },
    { key: "support", label: "What resource, colleague or designated support do I need?" },
    { key: "evidence", label: "What evidence will I look for, including reasons to adapt or stop?" },
  ];
  async function save() {
    if (!plan.action.trim() || !plan.evidence.trim() || !plan.reviewDate) { setMessage("Add an action, evidence and a review date before saving."); return; }
    setBusy(true); setMessage("");
    try { await onSave(toolkitKey, JSON.stringify({ version: learningToolsVersion, ...plan })); setMessage("Takeaway saved to your CPD record."); }
    catch { setMessage("Could not save. Your draft is still here; please retry."); }
    finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([takeawayText(course, plan)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = course.id + "-takeaway.txt"; link.click(); URL.revokeObjectURL(url);
  }
  return <section className="learningToolPanel" aria-label="Practical course takeaway">
    <span className="practiceEyebrow">USE IT IN PRACTICE · OPTIONAL</span><h3>A takeaway for {course.title}</h3>
    <p>Turn the course into one manageable action. This is a planning aid, not an extra completion requirement. Use fictional or non-identifiable examples only.</p>
    <details className="readingReference"><summary>Course objectives and implementation check</summary>
      <ul>{course.objectives.map(o => <li key={o}>{o}</li>)}</ul>
      {checklist?.type === "checklist" && <><h4>{checklist.title}</h4><ul>{checklist.items.map(item => <li key={item}>{item}</li>)}</ul></>}
    </details>
    {fields.map(({ key, label }) => <label className="practiceNoteLabel" key={key}>{label}<textarea value={plan[key]} onChange={e => { setPlan(p => ({ ...p, [key]: e.target.value })); setMessage(""); }}/></label>)}
    <label className="practiceNoteLabel">When will I review this action?<input type="date" value={plan.reviewDate} onChange={e => { setPlan(p => ({ ...p, reviewDate: e.target.value })); setMessage(""); }}/></label>
    <div className="practiceSave">{[7, 14].map(days => <button type="button" className="secondary" key={days} onClick={() => { const date = new Date(); date.setDate(date.getDate() + days); const reviewDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); setPlan(p => ({ ...p, reviewDate })); setMessage(""); }}>Review in {days} days</button>)}</div>
    <div className="practiceSave"><button type="button" className="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save practical takeaway"}</button><button type="button" className="secondary" onClick={download}>Download takeaway template</button></div>
    {message && <p role="status">{message}</p>}
  </section>;
}
