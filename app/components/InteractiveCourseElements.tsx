"use client";

import { useMemo, useState } from "react";

type VisualItem = { heading: string; text: string; icon?: string };
type VisualLayout = "flow" | "cycle" | "ladder" | "pyramid" | "compare" | "timeline";

export function InteractiveKeyPoints({ points }: { points: string[] }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const allRevealed = points.length > 0 && revealed.length === points.length;

  function toggle(index: number) {
    setRevealed(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  }

  return <div className="interactiveKnowledge">
    <div className="interactiveKnowledgeHead">
      <div><span className="interactionKicker">CLICK TO EXPLORE</span><strong>Key ideas</strong></div>
      <span>{revealed.length}/{points.length} opened</span>
    </div>
    <div className="revealPointGrid">
      {points.map((point, index) => {
        const open = revealed.includes(index);
        return <button type="button" key={`${point}-${index}`} className={open ? "revealPoint open" : "revealPoint"} onClick={() => toggle(index)} aria-expanded={open}>
          <span className="revealPointNumber">{open ? "✓" : index + 1}</span>
          <span>{open ? point : "Reveal key idea"}</span>
          <b>{open ? "−" : "+"}</b>
        </button>;
      })}
    </div>
    {allRevealed && <div className="confidencePulse">
      <span>How confident are you with this idea now?</span>
      <div>{[1,2,3,4].map(n => <button type="button" key={n} className={confidence === n ? "active" : ""} onClick={() => setConfidence(n)}>{n}</button>)}</div>
      {confidence !== null && <small>{confidence < 3 ? "Keep the key ideas visible and revisit the examples before moving on." : "Good. Use the next activity to test whether you can apply it."}</small>}
    </div>}
  </div>;
}

export function InteractiveVisual({ caption, layout, items }: { caption?: string; layout: VisualLayout; items: VisualItem[] }) {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([0]);
  const [challenge, setChallenge] = useState(false);
  const [challengeOrder, setChallengeOrder] = useState<number[]>([]);
  const [guess, setGuess] = useState<number[]>([]);

  const sequenceEligible = ["flow", "cycle", "timeline", "ladder"].includes(layout) && items.length >= 3;
  const challengeComplete = challenge && guess.length === items.length;
  const challengeCorrect = challengeComplete && guess.every((value, index) => value === index);

  const displayOrder = useMemo(() => challenge && challengeOrder.length === items.length ? challengeOrder : items.map((_, index) => index), [challenge, challengeOrder, items]);

  function select(index: number) {
    setSelected(index);
    setRevealed(prev => prev.includes(index) ? prev : [...prev, index]);
  }

  function startChallenge() {
    const order = items.map((_, index) => index);
    // Rotate and reverse alternating positions to create a predictable client-side shuffle without hydration randomness.
    const rotated = order.length > 2 ? [...order.slice(1), order[0]] : order;
    const mixed = rotated.map((value, index, arr) => index % 2 === 0 && index + 1 < arr.length ? arr[index + 1] : index % 2 === 1 ? arr[index - 1] : value);
    setChallengeOrder(mixed);
    setGuess([]);
    setChallenge(true);
  }

  function chooseSequence(index: number) {
    if (guess.includes(index) || challengeComplete) return;
    setGuess(prev => [...prev, index]);
  }

  return <div className={`interactiveVisual visual-${layout}`}>
    {caption && <p className="interactiveVisualCaption">{caption}</p>}
    <div className="interactiveVisualToolbar">
      <span className="interactionKicker">INTERACTIVE VISUAL</span>
      <span>{revealed.length}/{items.length} explored</span>
      {sequenceEligible && !challenge && <button type="button" onClick={startChallenge}>Try sequence challenge</button>}
      {challenge && <button type="button" onClick={() => { setChallenge(false); setGuess([]); }}>Back to visual</button>}
    </div>

    {!challenge ? <>
      <div className={`clickVisualMap ${layout}`}>
        {items.map((item, index) => {
          const active = selected === index;
          const seen = revealed.includes(index);
          return <button type="button" className={`clickVisualNode ${active ? "active" : ""} ${seen ? "seen" : ""}`} key={`${item.heading}-${index}`} onClick={() => select(index)} aria-pressed={active}>
            <span className="clickVisualIcon">{item.icon || index + 1}</span>
            <span><strong>{item.heading}</strong><small>{active ? "Selected" : "Click to explore"}</small></span>
          </button>;
        })}
      </div>
      <div className="visualDetailPanel" aria-live="polite">
        <div className="visualDetailIcon">{items[selected]?.icon || selected + 1}</div>
        <div><span>STEP {selected + 1} OF {items.length}</span><h3>{items[selected]?.heading}</h3><p>{items[selected]?.text}</p></div>
      </div>
      {layout === "compare" && items.length > 1 && <div className="compareSelector" aria-label="Compare visual ideas">
        {items.map((item,index) => <button type="button" key={`${item.heading}-compare`} className={selected === index ? "active" : ""} onClick={() => select(index)}>{item.heading}</button>)}
      </div>}
    </> : <div className="sequenceChallenge">
      <div className="sequenceChallengeHead"><div><strong>Put the ideas in the correct order</strong><span>Click the cards from first to last.</span></div><b>{guess.length}/{items.length}</b></div>
      <div className="sequencePool">
        {displayOrder.map(index => <button type="button" key={`challenge-${index}`} disabled={guess.includes(index)} onClick={() => chooseSequence(index)}>
          <span>{guess.includes(index) ? guess.indexOf(index) + 1 : "?"}</span><strong>{items[index].heading}</strong>
        </button>)}
      </div>
      {challengeComplete && <div className={challengeCorrect ? "sequenceFeedback good" : "sequenceFeedback retry"}>
        <strong>{challengeCorrect ? "Correct sequence." : "Nearly — compare your order with the visual and try again."}</strong>
        <p>{challengeCorrect ? "You have reconstructed the process in the intended order." : "The sequence matters because each stage prepares the conditions for the next."}</p>
        {!challengeCorrect && <button type="button" onClick={() => setGuess([])}>Try again</button>}
      </div>}
    </div>}
  </div>;
}

export function InteractiveActivity({ instructions, response, onResponseChange, placeholder }: { instructions: string[]; response: string; onResponseChange: (value: string) => void; placeholder?: string }) {
  const [checked, setChecked] = useState<number[]>([]);
  const [showScaffold, setShowScaffold] = useState(false);

  function toggle(index: number) {
    setChecked(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  }

  function insertScaffold() {
    const scaffold = instructions.map((step, index) => `${index + 1}. ${step}\n`).join("\n");
    if (!response.trim()) onResponseChange(scaffold);
    setShowScaffold(true);
  }

  return <div className="interactivePractice">
    <div className="interactivePracticeHead"><div><span className="interactionKicker">BUILD YOUR RESPONSE</span><strong>Work through the activity</strong></div><span>{checked.length}/{instructions.length} steps checked</span></div>
    <div className="activityStepGrid">
      {instructions.map((step,index) => {
        const done = checked.includes(index);
        return <button type="button" key={`${step}-${index}`} className={done ? "activityStep done" : "activityStep"} onClick={() => toggle(index)} aria-pressed={done}>
          <span>{done ? "✓" : index + 1}</span><strong>{step}</strong><b>{done ? "Done" : "Check"}</b>
        </button>;
      })}
    </div>
    <div className="activityTools">
      <button type="button" className="secondary" onClick={insertScaffold}>Add step-by-step scaffold</button>
      <button type="button" className="secondary" onClick={() => setShowScaffold(v => !v)}>{showScaffold ? "Hide planning prompts" : "Show planning prompts"}</button>
    </div>
    {showScaffold && <div className="planningPromptGrid">
      <button type="button" onClick={() => onResponseChange(`${response}${response ? "\n\n" : ""}Evidence I would look for: `)}>+ Evidence</button>
      <button type="button" onClick={() => onResponseChange(`${response}${response ? "\n\n" : ""}A likely barrier is: `)}>+ Barrier</button>
      <button type="button" onClick={() => onResponseChange(`${response}${response ? "\n\n" : ""}My next adjustment would be: `)}>+ Next adjustment</button>
      <button type="button" onClick={() => onResponseChange(`${response}${response ? "\n\n" : ""}I would know this worked if: `)}>+ Success indicator</button>
    </div>}
    <textarea className="activityResponse interactiveActivityResponse" rows={8} placeholder={placeholder || "Write your response…"} value={response} onChange={e => onResponseChange(e.target.value)} />
  </div>;
}
