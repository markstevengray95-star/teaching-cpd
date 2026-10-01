"use client";
import { useState } from "react";
import type { Course, Module } from "@/lib/catalogue";
import { isSafetyCourse } from "@/lib/classroomPractice";

export default function ActivityPractice({ course, module, response, onChange }: { course: Course; module: Extract<Module, { type: "activity" }>; response: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(["", "", ""]);
  const [checks, setChecks] = useState<number[]>([]);
  const [compared, setCompared] = useState(false);
  const safe = isSafetyCourse(course) || course.category === "Safeguarding";
  const prompts = safe
    ? ["What facts are available, and what remains unknown?", "What is the next step within your role under current school arrangements?", "What would you record, check or take to the designated colleague?"]
    : ["What specific problem and course idea are you addressing?", "What will you do, and why does it fit this context?", "What evidence will you check, and when will you review or adapt?"];
  const criteria = safe
    ? ["Facts are separate from assumptions.", "The response follows current procedures and stays within my role.", "I identify unresolved questions and the appropriate support, without personal details."]
    : ["I identify a precise problem rather than name a technique.", "I explain a feasible action and why it fits.", "I name observable evidence and a review point, without personal details."];
  function useDraft() {
    const addition = draft.map((text, i) => text.trim() ? prompts[i] + "\n" + text.trim() : "").filter(Boolean).join("\n\n");
    if (addition) onChange([response.trim(), addition].filter(Boolean).join("\n\n"));
  }
  return <section className="interactiveBlock activityPractice" aria-label="Guided course activity">
    <p className="lead">{module.prompt}</p>
    <ol className="activitySteps">{module.instructions.map(step => <li key={step}>{step}</li>)}</ol>
    <details className="readingReference"><summary>Build a response in three steps (optional)</summary>
      <p>Use the course task above. This scaffold is a drafting aid, not a model answer. Fictional or non-identifiable examples only.</p>
      {prompts.map((prompt, i) => <label className="practiceNoteLabel" key={prompt}>{prompt}<textarea value={draft[i]} onChange={e => setDraft(d => d.map((v, n) => n === i ? e.target.value : v))}/></label>)}
      <button type="button" className="secondary" disabled={!draft.some(s => s.trim())} onClick={useDraft}>Append draft to my response</button>
    </details>
    <label className="practiceNoteLabel">My activity response<textarea className="reflectionBox" value={response} onChange={e => { onChange(e.target.value); setCompared(false); }} placeholder={module.placeholder || "Explain your response to this task…"}/></label>
    <small>{response.trim().length} characters · minimum {module.minimumCharacters ?? 30}. Length alone does not establish quality.</small>
    <details className="readingReference"><summary>Review the quality of my response</summary>
      <p>Self-review is optional and does not award a score or certify competence.</p>
      <div className="checklist">{criteria.map((criterion, i) => <label key={criterion}><input type="checkbox" checked={checks.includes(i)} onChange={() => { setChecks(c => c.includes(i) ? c.filter(n => n !== i) : [...c, i]); setCompared(false); }}/><span>{criterion}</span></label>)}</div>
      <button type="button" className="secondary" onClick={() => setCompared(true)}>Compare with the review criteria</button>
      {compared && <p role="status" className="practiceFeedback">{checks.length === criteria.length ? "You have checked each criterion. Re-read the actual task and revise anything your explanation does not support." : "Choose one unchecked criterion and make your response more precise before completing the task."} {safe ? "This practice does not replace current school procedures, specialist training or designated professional guidance." : "Look for evidence that could challenge your first interpretation, not only confirm it."}</p>}
    </details>
  </section>;
}
