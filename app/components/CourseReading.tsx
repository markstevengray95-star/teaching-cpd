"use client";

import { useState } from "react";
import { getProfessionalReadingPhase2Pack, type Course, type Module, type Phase2ReadingDepth } from "@/lib/catalogue";
import { readingParagraphs } from "@/lib/presentationLearning";

export default function CourseReading({ course, module }: { course: Course; module: Extract<Module, { type: "content" }> }) {
  const [depth, setDepth] = useState<Phase2ReadingDepth>("core");
  const [part, setPart] = useState(0), [full, setFull] = useState(false);
  const [pauseNote, setPauseNote] = useState("");
  const pack = getProfessionalReadingPhase2Pack(course, module);
  const paragraphs = pack ? pack[depth] : readingParagraphs(module.body);
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const parts = Math.ceil(paragraphs.length / 2), current = Math.min(part, Math.max(0, parts - 1));
  const visible = full ? paragraphs : paragraphs.slice(current * 2, current * 2 + 2);
  return <section className="courseReading" aria-label="Course reading">
    <div className="readingByline"><span>{pack ? "Professional reading" : "The idea in practice"}</span><span>{Math.max(1, Math.ceil(words / 210))} min read · {words} words</span></div>
    {pack ? <><p className="readingStrapline">{pack.strapline}</p><div className="readingDepthChoice" role="group" aria-label="Reading depth">
      {(["quick", "core", "deep"] as const).map(value => <button type="button" key={value} aria-pressed={depth === value} onClick={() => { setDepth(value); setPart(0); }}>{({ quick: "Quick read", core: "Core passage", deep: "Deeper reading" })[value]}</button>)}
    </div></> : null}
    {parts > 1 && <div className="readingPaceControls"><button type="button" className="secondary" aria-pressed={full} onClick={() => setFull(v => !v)}>{full ? "Read in short sections" : "Show the full passage"}</button><span role="status">{full ? "Full passage" : "Reading section " + (current + 1) + " of " + parts}</span></div>}
    <div className="readingProse">{visible.map((paragraph, index) => <p key={current + "-" + index} className={index === 0 && (full || current === 0) ? "lead readingParagraph" : "readingParagraph"}>{paragraph}</p>)}</div>
    {!full && parts > 1 && <><aside className="readingQuestion"><strong>Pause and connect</strong><p>{pack?.pausePrompts[current % pack.pausePrompts.length] || "How does this passage help you with: " + course.objectives[0] + "?"}</p><label className="practiceNoteLabel">My reading pause note (optional, not saved)<textarea value={pauseNote} onChange={e => setPauseNote(e.target.value)}/></label></aside><div className="practiceSave"><button type="button" className="secondary" disabled={current === 0} onClick={() => setPart(p => p - 1)}>Previous reading section</button><button type="button" className="secondary" disabled={current === parts - 1} onClick={() => setPart(p => p + 1)}>Next reading section</button></div></>}
    {pack ? <aside className="readingQuestion"><span>Read with a question</span><p>{pack.pausePrompts[0]}</p></aside> : null}
    {(module.keyPoints?.length || pack?.glossary.length) ? <details className="readingReference"><summary>Key ideas{pack ? " and vocabulary" : ""}</summary>
      {module.keyPoints?.length ? <ul>{module.keyPoints.map(point => <li key={point}>{point}</li>)}</ul> : null}
      {pack ? <dl>{pack.glossary.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl> : null}
    </details> : null}
  </section>;
}
