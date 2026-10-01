"use client";
import { useState } from "react";
type Card = { front: string; back: string };
export default function FlashcardPractice({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0), [revealed, setRevealed] = useState(false), [attempt, setAttempt] = useState("");
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const card = cards[index];
  function move(direction: number) { setIndex(i => (i + direction + cards.length) % cards.length); setRevealed(false); setAttempt(""); }
  if (!card) return <section className="labPanel"><h4>No retrieval cards available</h4><p>Use the course's knowledge checks instead.</p></section>;
  return <section className="labPanel retrievalPractice" aria-label="Question flashcards"><span className="labKicker">QUESTION FLASHCARDS</span><h4>Answer before you reveal</h4>
    <p className="retrievalQuestion">{card.front}</p>
    <label className="practiceNoteLabel">My recall attempt<textarea value={attempt} onChange={e => setAttempt(e.target.value)} placeholder="Recall an answer—or write what you are unsure of. This draft is not saved."/></label>
    <button type="button" className="primary" disabled={!attempt.trim()} aria-expanded={revealed} onClick={() => setRevealed(v => !v)}>{revealed ? "Hide model answer" : "Reveal model answer"}</button>
    {revealed && <div className="retrievalAnswer"><strong>Compare, then correct</strong>{card.back.split(/\n\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}<div className="practiceStepTabs">{["Practise again", "Secure for now"].map(value => <button type="button" className="secondary" aria-pressed={ratings[index] === value} key={value} onClick={() => setRatings(r => ({ ...r, [index]: value }))}>{value}</button>)}</div></div>}
    <div className="flashControls"><button type="button" className="secondary" disabled={cards.length < 2} onClick={() => move(-1)}>Previous question</button><span aria-live="polite">{index + 1} / {cards.length}</span><button type="button" className="secondary" disabled={cards.length < 2} onClick={() => move(1)}>Next question</button></div>
    <small>{Object.values(ratings).filter(v => v === "Practise again").length} marked for more practice in this session. Ratings are self-checks, not a competence assessment.</small>
  </section>;
}

