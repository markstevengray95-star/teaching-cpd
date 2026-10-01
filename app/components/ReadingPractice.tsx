"use client";

import { useState } from "react";
import type { ReadingExtension } from "@/lib/presentationLearning";

type PracticeState = { version: 1; kind: ReadingExtension["kind"]; choices: Record<number, string>; order: number[]; decision: number | null; note: string };
function initialState(pack: ReadingExtension, saved: string): PracticeState {
  const empty: PracticeState = { version: 1, kind: pack.kind, choices: {}, order: [2, 0, 3, 1], decision: null, note: "" };
  try {
    const value = JSON.parse(saved) as PracticeState;
    if (value.version !== 1 || value.kind !== pack.kind) return empty;
    return { ...empty, choices: value.choices && typeof value.choices === "object" ? value.choices : {},
      order: Array.isArray(value.order) && value.order.length === 4 && new Set(value.order).size === 4 && value.order.every(index => [0, 1, 2, 3].includes(index)) ? value.order : empty.order,
      decision: Number.isInteger(value.decision) && value.decision! >= 0 && value.decision! < (pack.scenario?.options.length || 0) ? value.decision : null,
      note: typeof value.note === "string" ? value.note : "" };
  } catch { return empty; }
}

export default function ReadingPractice({ pack, saved = "", onSave }: { pack: ReadingExtension; saved?: string; onSave: (value: string) => Promise<void> }) {
  const [draft, setDraft] = useState(() => initialState(pack, saved));
  const [feedback, setFeedback] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  function move(position: number, direction: -1 | 1) {
    setDraft(current => {
      const order = [...current.order];
      const next = position + direction;
      if (next < 0 || next >= order.length) return current;
      [order[position], order[next]] = [order[next], order[position]];
      return { ...current, order };
    });
    setFeedback(""); setSaveMessage("");
  }
  function checkEvidence() {
    if (Object.keys(draft.choices).length !== pack.evidence.length) { setFeedback("Classify each statement first, then compare your reasoning."); return; }
    const correct = pack.evidence.reduce((sum, _, index) => sum + (draft.choices[index] === (index === 1 ? "interpretation" : "observation") ? 1 : 0), 0);
    setFeedback(`${correct} of ${pack.evidence.length} correct. Observations describe what was seen, said or recorded. Interpretations add an explanation that needs checking.`);
  }
  async function save() {
    setSaving(true); setSaveMessage("");
    try { await onSave(JSON.stringify(draft)); setSaveMessage("Practice notes saved to your course record."); }
    catch { setSaveMessage("Your notes could not be saved. They are still here; try saving again."); }
    finally { setSaving(false); }
  }

  return <details className="readingExtension">
    <summary><span><small>Read & try · optional</small><strong>{pack.title}</strong></span><span className="extensionHint">Open passage + activity</span></summary>
    <div className="extensionBody">
      <div className="readingProse">{pack.paragraphs.map((paragraph, index) => <p className="readingParagraph" key={index}>{paragraph}</p>)}</div>
      <aside className="readingQuestion"><span>Think before you act</span><p>{pack.prompt}</p></aside>
      <section className="practiceLab" aria-label="Reading activity">
        <span className="practiceEyebrow">Fictional practice · 3–5 minutes</span>
        <h3>{pack.kind === "evidence" ? "Evidence or interpretation?" : pack.kind === "sequence" ? "Build the response" : "Predict, then compare"}</h3>
        {pack.kind === "evidence" ? <>
          <p>Classify each statement. Which ones describe evidence, and which add an assumption?</p>
          {pack.evidence.map((statement, index) => <fieldset className="evidenceCard" key={statement}><legend>{statement}</legend>
            {(["observation", "interpretation"] as const).map(value => <label key={value}><input type="radio" name={`evidence-${index}`} checked={draft.choices[index] === value} onChange={() => { setDraft(current => ({ ...current, choices: { ...current.choices, [index]: value } })); setFeedback(""); setSaveMessage(""); }} />{value === "observation" ? "Observation / reported fact" : "Interpretation / assumption"}</label>)}
          </fieldset>)}
          <button type="button" className="secondary" onClick={checkEvidence}>Check my reasoning</button>
        </> : pack.kind === "sequence" ? <>
          <p>Put these planning moves in a sensible order. Use the arrow buttons; no dragging is needed.</p>
          <ol className="sequenceCards">{draft.order.map((step, position) => <li key={step}><span className="sequenceNumber">{position + 1}</span><p>{pack.sequence[step]}</p><div>
            <button type="button" disabled={position === 0} aria-label={`Move step ${position + 1} up: ${pack.sequence[step]}`} onClick={() => move(position, -1)}>↑</button>
            <button type="button" disabled={position === draft.order.length - 1} aria-label={`Move step ${position + 1} down: ${pack.sequence[step]}`} onClick={() => move(position, 1)}>↓</button>
          </div></li>)}</ol>
          <button type="button" className="secondary" onClick={() => setFeedback(draft.order.every((value, index) => value === index) ? "That sequence starts with the problem, plans a proportionate response and finishes with review. Explain why those dependencies matter." : "Try again: start by identifying the problem, then plan and check the response before reviewing its effect. This is a practice planning sequence; follow your setting's procedures in real situations.")}>Check my sequence</button>
        </> : pack.scenario ? <>
          <p className="decisionSituation">{pack.scenario.prompt}</p>
          <p>Commit to a response and explain why before revealing the course's feedback.</p>
          <div className="decisionChoices">{pack.scenario.options.map((option, index) => <button type="button" key={index} aria-pressed={draft.decision === index} onClick={() => { setDraft(current => ({ ...current, decision: index })); setRevealed(false); setSaveMessage(""); }}>{option.label}</button>)}</div>
          <button type="button" className="secondary" disabled={draft.decision === null || !draft.note.trim()} onClick={() => setRevealed(true)}>Reveal and compare</button>
          {revealed && draft.decision !== null ? <div className="practiceFeedback" role="status">{pack.scenario.options[draft.decision].feedback}</div> : null}
        </> : <p>Explain one response you would try, the reason behind it and the evidence you would need before deciding whether it worked.</p>}
        {feedback ? <div className="practiceFeedback" role="status">{feedback}</div> : null}
        <label className="practiceNoteLabel">{pack.kind === "decision" ? "My prediction and reasoning" : "My reasoning and next step"}<textarea value={draft.note} onChange={event => { setDraft(current => ({ ...current, note: event.target.value })); setSaveMessage(""); setRevealed(false); }} placeholder="Use a fictional or general example. Explain the evidence, your response and what you would review." /></label>
        <div className="practiceSave"><button type="button" className="secondary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save practice notes"}</button><small>Optional practice does not add to the course completion requirements.</small></div>
        {saveMessage ? <p role="status" className="practiceSaveMessage">{saveMessage}</p> : null}
      </section>
    </div>
  </details>;
}

