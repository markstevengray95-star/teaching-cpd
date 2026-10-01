"use client";

import { useState } from "react";
import { getProfessionalReadingPhase2Pack, type Course, type Module, type Phase2ReadingDepth } from "@/lib/catalogue";
import { readingParagraphs } from "@/lib/presentationLearning";

export default function CourseReading({ course, module }: { course: Course; module: Extract<Module, { type: "content" }> }) {
  const [depth, setDepth] = useState<Phase2ReadingDepth>("core");
  const pack = getProfessionalReadingPhase2Pack(course, module);
  const paragraphs = pack ? pack[depth] : readingParagraphs(module.body);
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return <section className="courseReading" aria-label="Course reading">
    <div className="readingByline"><span>{pack ? "Professional reading" : "The idea in practice"}</span><span>{Math.max(1, Math.ceil(words / 210))} min read · {words} words</span></div>
    {pack ? <><p className="readingStrapline">{pack.strapline}</p><div className="readingDepthChoice" role="group" aria-label="Reading depth">
      {(["quick", "core", "deep"] as const).map(value => <button type="button" key={value} aria-pressed={depth === value} onClick={() => setDepth(value)}>{({ quick: "Quick read", core: "Core passage", deep: "Deeper reading" })[value]}</button>)}
    </div></> : null}
    <div className="readingProse">{paragraphs.map((paragraph, index) => <p key={index} className={index === 0 ? "lead readingParagraph" : "readingParagraph"}>{paragraph}</p>)}</div>
    {pack ? <aside className="readingQuestion"><span>Read with a question</span><p>{pack.pausePrompts[0]}</p></aside> : null}
    {(module.keyPoints?.length || pack?.glossary.length) ? <details className="readingReference"><summary>Key ideas{pack ? " and vocabulary" : ""}</summary>
      {module.keyPoints?.length ? <ul>{module.keyPoints.map(point => <li key={point}>{point}</li>)}</ul> : null}
      {pack ? <dl>{pack.glossary.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl> : null}
    </details> : null}
  </section>;
}

