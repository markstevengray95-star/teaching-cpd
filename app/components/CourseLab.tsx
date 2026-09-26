"use client";

import { useMemo, useState } from "react";
import type { Course, Module } from "@/lib/data";
import { buildCourseExperience, suggestedMode, type ExperienceMode } from "@/lib/courseExperience";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Props = {
  course: Course;
  allCourses: Course[];
  savedMeta: Record<string, string>;
  completedCount: number;
  totalModules: number;
  onSaveMeta: (key: string, value: string) => Promise<void>;
  onOpenCourse: (course: Course) => void;
};

type LabTab = "diagnose" | "explore" | "practise" | "apply" | "facilitate" | "review";

type BranchChoice = { label: string; feedback: string; quality: "strong" | "developing" | "weak" };

type BranchStep = { title: string; prompt: string; choices: BranchChoice[] };

const implementationOrder = [
  "Identify the specific problem or learning need",
  "Choose one small course-informed change",
  "Decide what evidence you will look for",
  "Try the change consistently in context",
  "Review evidence and keep, adapt or stop",
];

const hotspotPositions = ["hotspot-a", "hotspot-b", "hotspot-c", "hotspot-d"];
const subjects = ["Science", "Mathematics", "English", "Humanities", "Practical subjects"];
const phases = ["Primary", "KS3", "GCSE", "Post-16"];

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function dateFromNow(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function scoreLabel(score: number) {
  if (score >= 80) return "Secure starting point";
  if (score >= 55) return "Developing starting point";
  return "Guided starting point";
}

function rotate<T>(items: T[], amount: number) {
  if (!items.length) return items;
  const n = Math.abs(amount) % items.length;
  return [...items.slice(n), ...items.slice(0, n)];
}

function stableHash(text: string) {
  return [...text].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7);
}

function safeIndex(index: number, length: number) {
  return length ? Math.min(index, length - 1) : 0;
}

export default function CourseLab({ course, allCourses, savedMeta, completedCount, totalModules, onSaveMeta, onOpenCourse }: Props) {
  const experience = useMemo(() => buildCourseExperience(course, allCourses), [course, allCourses]);
  const scenarioBank = useMemo(() => course.modules.filter((m): m is Extract<Module, { type: "scenario" }> => m.type === "scenario"), [course]);
  const visualModules = useMemo(() => course.modules.filter((m): m is Extract<Module, { type: "visual" }> => m.type === "visual"), [course]);
  const [tab, setTab] = useState<LabTab>("diagnose");
  const [mode, setMode] = useState<ExperienceMode>((savedMeta.__experience_mode as ExperienceMode) || "Standard");
  const [confidenceStart, setConfidenceStart] = useState(Number(savedMeta.__confidence_start || 0));
  const [confidenceEnd, setConfidenceEnd] = useState(Number(savedMeta.__confidence_end || 0));
  const [diagAnswers, setDiagAnswers] = useState<Record<number, number>>({});
  const [diagScore, setDiagScore] = useState(Number(savedMeta.__diagnostic_score || -1));
  const [missedDiagnostic, setMissedDiagnostic] = useState<number[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashOpen, setFlashOpen] = useState(false);
  const [revealedMyths, setRevealedMyths] = useState<number[]>([]);
  const [hotspotOpen, setHotspotOpen] = useState(0);
  const [compareValue, setCompareValue] = useState(50);
  const [mistakeOpen, setMistakeOpen] = useState<number[]>([]);
  const [sortItems, setSortItems] = useState(() => rotate(implementationOrder, (stableHash(course.id) % 4) + 1));
  const [sortMessage, setSortMessage] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [branchStep, setBranchStep] = useState(0);
  const [branchHistory, setBranchHistory] = useState<BranchChoice[]>([]);
  const [branchFeedback, setBranchFeedback] = useState("");
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [lessonChallenge, setLessonChallenge] = useState(savedMeta.__lesson_challenge || "");
  const [tryTomorrow, setTryTomorrow] = useState(savedMeta.__try_tomorrow || "");
  const [masterySeed, setMasterySeed] = useState(0);
  const [masteryAnswers, setMasteryAnswers] = useState<Record<number, number>>({});
  const [masteryScore, setMasteryScore] = useState(Number(savedMeta.__mastery_score || -1));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);

  const progress = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;
  const masteryQuestions = useMemo(() => rotate(experience.diagnostic, stableHash(course.id) + masterySeed), [experience.diagnostic, course.id, masterySeed]);
  const recommendedCourses = experience.recommendedNext.map(id => allCourses.find(c => c.id === id)).filter(Boolean) as Course[];
  const subjectExample = experience.subjectExamples[safeIndex(subjectIndex, experience.subjectExamples.length)];
  const phaseExample = experience.phaseExamples[safeIndex(phaseIndex, experience.phaseExamples.length)];
  const pair = experience.beforeAfter[0] || { before: "Use the idea mechanically.", after: "Use the idea deliberately and check impact." };
  const hotspots = course.objectives.slice(0, 4).map((objective, i) => ({
    title: ["Teacher explanation", "Pupil thinking", "Evidence check", "Next response"][i] || `Focus ${i + 1}`,
    body: objective,
    position: hotspotPositions[i] || hotspotPositions[0],
  }));

  const branchSteps: BranchStep[] = useMemo(() => {
    const firstScenario = scenarioBank[0];
    const firstChoices: BranchChoice[] = firstScenario?.options.slice(0, 3).map((option, i) => ({
      label: option.label,
      feedback: option.feedback,
      quality: i === 0 ? "strong" : i === 1 ? "developing" : "weak",
    })) || [
      { label: "Pause and gather evidence", feedback: "A useful first move is to make the problem visible before changing the plan.", quality: "strong" },
      { label: "Continue exactly as planned", feedback: "This may miss evidence that pupils need a different response.", quality: "developing" },
      { label: "Change several things immediately", feedback: "Changing too much at once makes it hard to know what helped.", quality: "weak" },
    ];
    return [
      { title: "Step 1 · Notice", prompt: firstScenario?.prompt || `You are trying to apply ${course.title}, but pupil responses suggest the lesson is not going as expected. What do you do first?`, choices: firstChoices },
      { title: "Step 2 · Respond", prompt: "Your first decision gives you more information. A pattern is now visible across several pupils. What is the strongest next move?", choices: [
        { label: "Use one focused adjustment and check again", feedback: "This keeps the response proportionate and makes the effect easier to evaluate.", quality: "strong" },
        { label: "Explain everything again from the beginning", feedback: "Repetition may help, but only if it addresses the actual barrier you identified.", quality: "developing" },
        { label: "Lower the learning goal for everyone", feedback: "Support should normally improve access without automatically reducing ambition.", quality: "weak" },
      ] },
      { title: "Step 3 · Review", prompt: "The adjustment appears to help some pupils. How should you decide what happens next?", choices: [
        { label: "Compare evidence, keep what helped and adapt what did not", feedback: "This closes the implementation loop with evidence rather than impression.", quality: "strong" },
        { label: "Assume it worked because the lesson felt smoother", feedback: "A smoother lesson is useful information, but not enough on its own to judge learning or impact.", quality: "developing" },
        { label: "Use the same response in every future lesson", feedback: "Professional strategies should remain responsive to context and pupil need.", quality: "weak" },
      ] },
    ];
  }, [course.title, scenarioBank]);

  const deckSlides = useMemo(() => [
    { kicker: "WELCOME", title: course.title, body: course.summary },
    { kicker: "WHY THIS MATTERS", title: "Learning objectives", bullets: course.objectives.slice(0, 6) },
    { kicker: "VISUAL MODEL", title: visualModules[0]?.title || "How the ideas connect", bullets: visualModules[0]?.items.map(item => `${item.heading}: ${item.text}`).slice(0, 6) || course.objectives.slice(0, 5) },
    { kicker: "DISCUSS", title: "Professional discussion", bullets: experience.discussionPrompts.slice(0, 4) },
    { kicker: "APPLY", title: "One change worth testing", bullets: experience.implementationChecklist.slice(0, 5) },
    { kicker: "EXIT", title: "What will you do next?", body: `Choose one idea from ${course.title}, decide where you will use it, and name the evidence that will tell you whether it helped.` },
  ], [course, experience, visualModules]);

  const progressStages = [
    { label: "Diagnose", detail: diagScore >= 0 ? `${diagScore}%` : "Start", complete: diagScore >= 0 },
    { label: "Learn", detail: `${Math.min(progress, 100)}%`, complete: progress >= 35 },
    { label: "Practise", detail: branchHistory.length ? `${branchHistory.length}/3` : "Try", complete: branchHistory.length >= 2 },
    { label: "Apply", detail: tryTomorrow ? "Ready" : "Plan", complete: Boolean(tryTomorrow) },
    { label: "Review", detail: masteryScore >= 0 ? `${masteryScore}%` : "Check", complete: masteryScore >= 80 },
  ];

  async function saveMode(next: ExperienceMode) {
    setMode(next);
    await onSaveMeta("__experience_mode", next);
  }

  async function saveConfidence(kind: "start" | "end", value: number) {
    if (kind === "start") setConfidenceStart(value); else setConfidenceEnd(value);
    await onSaveMeta(kind === "start" ? "__confidence_start" : "__confidence_end", String(value));
  }

  async function submitDiagnostic() {
    if (Object.keys(diagAnswers).length < experience.diagnostic.length) {
      setMessage("Answer every diagnostic question first.");
      return;
    }
    const missed: number[] = [];
    const correct = experience.diagnostic.reduce((sum, q, i) => {
      if (diagAnswers[i] === q.answer) return sum + 1;
      missed.push(i);
      return sum;
    }, 0);
    const score = Math.round((correct / experience.diagnostic.length) * 100);
    const nextMode = suggestedMode(score);
    setDiagScore(score);
    setMissedDiagnostic(missed);
    setMode(nextMode);
    await Promise.all([onSaveMeta("__diagnostic_score", String(score)), onSaveMeta("__experience_mode", nextMode)]);
    setMessage(`Diagnostic complete: ${score}%. ${missed.length ? "Targeted review cards are ready below." : "Strong starting point — move into the challenge activities."}`);
  }

  function moveSort(from: number, to: number) {
    if (to < 0 || to >= sortItems.length || from === to) return;
    setSortItems(items => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSortMessage("");
  }

  function checkSort() {
    const correct = sortItems.every((item, i) => item === implementationOrder[i]);
    setSortMessage(correct ? "Correct — diagnose, plan, gather evidence, implement and review." : "Not quite. Start with the problem, then choose and test one change before reviewing evidence.");
  }

  function chooseBranch(choice: BranchChoice) {
    const next = [...branchHistory.slice(0, branchStep), choice];
    setBranchHistory(next);
    setBranchFeedback(choice.feedback);
    if (branchStep < branchSteps.length - 1) window.setTimeout(() => { setBranchStep(v => v + 1); setBranchFeedback(""); }, 550);
  }

  async function saveTextMeta(key: string, value: string, success: string) {
    if (value.trim().length < 20) {
      setMessage("Add a little more detail before saving.");
      return;
    }
    setBusy(true);
    await onSaveMeta(key, value.trim());
    setBusy(false);
    setMessage(success);
  }

  async function createActionPlan(form: HTMLFormElement) {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const data = new FormData(form);
    setBusy(true);
    const { error } = await supabase.from("action_plans").insert({
      user_id: auth.user.id,
      title: String(data.get("title") || `${course.title}: implementation plan`).trim(),
      action: String(data.get("action") || "").trim(),
      context: String(data.get("context") || "").trim(),
      intended_outcome: String(data.get("outcome") || "").trim(),
      evidence_plan: String(data.get("evidence") || "").trim(),
      course_id: course.id,
      start_date: today(),
      review_date: String(data.get("review_date") || dateFromNow(21)),
      status: "planned",
    });
    setBusy(false);
    setMessage(error ? error.message : "Action plan saved to your implementation tracker.");
    if (!error) form.reset();
  }

  async function submitMastery() {
    if (Object.keys(masteryAnswers).length < masteryQuestions.length) {
      setMessage("Complete every mastery question first.");
      return;
    }
    const correct = masteryQuestions.reduce((sum, q, i) => sum + (masteryAnswers[i] === q.answer ? 1 : 0), 0);
    const score = Math.round((correct / masteryQuestions.length) * 100);
    setMasteryScore(score);
    await onSaveMeta("__mastery_score", String(score));
    setMessage(score >= 80 ? `Mastery check: ${score}%. Strong result.` : `Mastery check: ${score}%. Adaptive review is recommended before retrying.`);
  }

  function downloadToolkit() {
    const text = [course.title, "=".repeat(course.title.length), "", course.summary, "", "Learning objectives", ...course.objectives.map(x => `- ${x}`), "", "Try it tomorrow", tryTomorrow || "Not set yet", "", "Implementation checklist", ...experience.implementationChecklist.map(x => `- ${x}`)].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.id}-toolkit.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <section className="courseLab">
    <div className="courseLabHead">
      <div><span className="eyebrow">COURSE LAB</span><h3>Learn it, practise it, use it.</h3><p>Interactive tools are built from this course's objectives, scenarios and checks. Your written responses stay private to your CPD account.</p></div>
      <div className="courseModeSwitch">{(["ECT", "Standard", "Challenge"] as ExperienceMode[]).map(item => <button type="button" key={item} className={mode === item ? "active" : ""} onClick={() => saveMode(item)}>{item}</button>)}</div>
    </div>

    <div className="courseJourneyMap">{progressStages.map((stage, i) => <button type="button" key={stage.label} className={stage.complete ? "journeyStage done" : "journeyStage"} onClick={() => setTab((["diagnose","explore","practise","apply","review"] as LabTab[])[i])}><span>{stage.complete ? "✓" : i + 1}</span><div><strong>{stage.label}</strong><small>{stage.detail}</small></div>{i < progressStages.length - 1 && <i>→</i>}</button>)}</div>
    {message && <div className="courseLabMessage">{message}</div>}

    <nav className="courseLabTabs">{([["diagnose","Diagnose"],["explore","Explore"],["practise","Practise"],["apply","Apply"],["facilitate","Facilitate"],["review","Review"]] as [LabTab,string][]).map(([value,label]) => <button type="button" key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}</nav>

    {tab === "diagnose" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">CONFIDENCE BEFORE</span><h4>How ready do you feel?</h4><div className="confidenceScale">{[1,2,3,4,5].map(n => <button type="button" key={n} className={confidenceStart === n ? "selected" : ""} onClick={() => saveConfidence("start", n)}>{n}</button>)}</div><p>{mode === "ECT" ? "ECT mode adds more guidance and examples." : mode === "Challenge" ? "Challenge mode prioritises critique and transfer." : "Standard mode balances explanation, practice and application."}</p></div>
        <div className="labPanel"><span className="labKicker">ADAPTIVE ROUTE</span><h4>{mode} pathway</h4><p>{diagScore < 0 ? "Complete the diagnostic and the course will suggest the amount of support to use." : `${scoreLabel(diagScore)}. The course has suggested ${suggestedMode(diagScore)} mode based on your answers.`}</p></div>
      </div>
      <div className="labPanel"><span className="labKicker">PRE-COURSE DIAGNOSTIC</span><h4>Find the ideas worth focusing on</h4>{experience.diagnostic.map((q, qi) => <div className="diagnosticQuestion" key={`${q.question}-${qi}`}><strong>{qi + 1}. {q.question}</strong><div className="labOptions">{q.options.map((option, oi) => <button type="button" key={option} className={diagAnswers[qi] === oi ? "selected" : ""} onClick={() => setDiagAnswers(prev => ({ ...prev, [qi]: oi }))}>{option}</button>)}</div></div>)}<button type="button" className="primary" onClick={submitDiagnostic}>Score diagnostic</button>{diagScore >= 0 && <div className="diagnosticResult"><strong>{diagScore}%</strong><span>{scoreLabel(diagScore)}</span></div>}</div>
      {diagScore >= 0 && missedDiagnostic.length > 0 && <div className="labPanel remediationPanel"><span className="labKicker">ADAPTIVE REMEDIATION</span><h4>Review these before moving on</h4><div className="remediationGrid">{missedDiagnostic.map((qIndex, i) => { const q = experience.diagnostic[qIndex]; return <article key={q.question}><span>{i + 1}</span><div><strong>{course.objectives[qIndex % course.objectives.length] || "Key course idea"}</strong><p>{q.feedback}</p><button type="button" className="textButton" onClick={() => setTab("explore")}>Review in Explore →</button></div></article>; })}</div></div>}
      <div className="labPanel knowledgeMap"><span className="labKicker">VISUAL KNOWLEDGE MAP</span><h4>How the course fits together</h4><div className="knowledgeNodes">{course.objectives.map((objective, i) => <div key={objective} className="knowledgeNode"><span>{i + 1}</span><p>{objective}</p></div>)}</div></div>
    </div>}

    {tab === "explore" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">INTERACTIVE HOTSPOTS</span><h4>Explore a classroom through this CPD lens</h4><div className="hotspotScene"><div className="sceneBoard">Learning goal</div><div className="sceneTeacher">Teacher</div><div className="scenePupils">Pupil responses</div>{hotspots.map((hotspot, i) => <button type="button" key={hotspot.title} className={`hotspotButton ${hotspot.position} ${hotspotOpen === i ? "active" : ""}`} onClick={() => setHotspotOpen(i)} aria-label={`Open ${hotspot.title}`}>{i + 1}</button>)}</div>{hotspots[hotspotOpen] && <div className="hotspotReveal"><strong>{hotspots[hotspotOpen].title}</strong><p>{hotspots[hotspotOpen].body}</p></div>}</div>
        <div className="labPanel"><span className="labKicker">KEY-TERM FLASHCARDS</span><h4>Retrieve before you reveal</h4>{experience.flashcards.length > 0 && <button type="button" className={flashOpen ? "flashcard open" : "flashcard"} onClick={() => setFlashOpen(v => !v)}><span>{flashOpen ? experience.flashcards[flashIndex].back : experience.flashcards[flashIndex].front}</span><small>{flashOpen ? "Tap to hide" : "Think first, then reveal"}</small></button>}<div className="flashControls"><button type="button" className="secondary" onClick={() => { setFlashIndex(i => (i - 1 + experience.flashcards.length) % experience.flashcards.length); setFlashOpen(false); }}>Previous</button><span>{flashIndex + 1}/{experience.flashcards.length}</span><button type="button" className="secondary" onClick={() => { setFlashIndex(i => (i + 1) % experience.flashcards.length); setFlashOpen(false); }}>Next</button></div></div>
      </div>

      <div className="labPanel compareSliderPanel"><span className="labKicker">BEFORE / AFTER SLIDER</span><h4>Reveal the stronger implementation</h4><div className="comparisonStage"><div className="comparisonLayer beforeLayer"><span>BEFORE</span><p>{pair.before}</p></div><div className="comparisonLayer afterLayer" style={{ clipPath: `inset(0 0 0 ${compareValue}%)` }}><span>AFTER</span><p>{pair.after}</p></div><div className="comparisonDivider" style={{ left: `${compareValue}%` }} /></div><input className="comparisonRange" aria-label="Reveal stronger implementation" type="range" min="5" max="95" value={compareValue} onChange={e => setCompareValue(Number(e.target.value))}/></div>

      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">SPOT THE MISTAKE</span><h4>Diagnose weak implementation</h4><p>Open each problem, explain what is wrong in your own words, then reveal the course explanation.</p><div className="mistakeChallenge">{experience.mistakes.map((m, i) => <button type="button" key={m.title} className={mistakeOpen.includes(i) ? "mistakeSpot open" : "mistakeSpot"} onClick={() => setMistakeOpen(prev => prev.includes(i) ? prev.filter(n => n !== i) : [...prev, i])}><span>{mistakeOpen.includes(i) ? "✓" : "?"}</span><div><strong>{m.title}</strong>{mistakeOpen.includes(i) && <p>{m.body}</p>}</div></button>)}</div></div>
        <div className="labPanel"><span className="labKicker">MYTH OR EVIDENCE?</span><h4>Reveal the explanation</h4><div className="revealCards">{experience.myths.map((card, i) => <button type="button" key={card.title} className={revealedMyths.includes(i) ? "revealCard open" : "revealCard"} onClick={() => setRevealedMyths(prev => prev.includes(i) ? prev.filter(n => n !== i) : [...prev, i])}><strong>{card.title}</strong>{revealedMyths.includes(i) && <span>{card.body}</span>}</button>)}</div></div>
      </div>

      <div className="labPanel"><span className="labKicker">SUBJECT + PHASE MODE</span><h4>See the same principle in a different classroom</h4><div className="contextSelectors"><label>Subject<select value={subjectIndex} onChange={e => setSubjectIndex(Number(e.target.value))}>{subjects.map((subject, i) => <option key={subject} value={i}>{subject}</option>)}</select></label><label>Phase<select value={phaseIndex} onChange={e => setPhaseIndex(Number(e.target.value))}>{phases.map((phase, i) => <option key={phase} value={i}>{phase}</option>)}</select></label></div><div className="contextExample"><div><span>SUBJECT</span><strong>{subjectExample?.label}</strong><p>{subjectExample?.body}</p></div><div><span>PHASE</span><strong>{phaseExample?.label}</strong><p>{phaseExample?.body}</p></div></div></div>

      <div className="labPanel"><span className="labKicker">RESEARCH-INFORMED SUMMARY</span><h4>What the evidence is useful for</h4><div className="evidenceCards">{experience.research.map(card => <article key={card.title}><span className={`evidenceStrength strength-${(card.strength || "Context-dependent").toLowerCase().replace(/[^a-z]+/g,"-")}`}>{card.strength}</span><h5>{card.title}</h5><p>{card.body}</p></article>)}</div></div>
    </div>}

    {tab === "practise" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">DRAG-AND-DROP CHALLENGE</span><h4>Build the implementation sequence</h4><div className="sortList">{sortItems.map((item, i) => <div key={item} draggable onDragStart={() => setDragIndex(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIndex !== null) moveSort(dragIndex, i); setDragIndex(null); }} className="sortItem"><span className="sortHandle">↕</span><span>{item}</span><div><button type="button" onClick={() => moveSort(i, i - 1)}>↑</button><button type="button" onClick={() => moveSort(i, i + 1)}>↓</button></div></div>)}</div><button type="button" className="secondary" onClick={checkSort}>Check order</button>{sortMessage && <p className="labFeedback">{sortMessage}</p>}</div>
        <div className="labPanel branchPanel"><span className="labKicker">MULTI-STEP BRANCHING SIMULATION</span><h4>{branchSteps[branchStep].title}</h4><div className="branchProgress">{branchSteps.map((_, i) => <span key={i} className={i < branchStep ? "done" : i === branchStep ? "current" : ""}>{i + 1}</span>)}</div><p className="scenarioPrompt">{branchSteps[branchStep].prompt}</p><div className="labOptions">{branchSteps[branchStep].choices.map(choice => <button type="button" key={choice.label} onClick={() => chooseBranch(choice)}>{choice.label}</button>)}</div>{branchFeedback && <div className="labFeedback">{branchFeedback}</div>}{branchHistory.length === branchSteps.length && <div className="branchOutcome"><strong>Simulation complete</strong><p>{branchHistory.filter(choice => choice.quality === "strong").length >= 2 ? "Your path stayed evidence-informed and proportionate. Now compare it with how you normally respond in practice." : "Your path exposed useful decision points. Revisit the feedback, reset and try a more evidence-informed route."}</p><button type="button" className="secondary" onClick={() => { setBranchStep(0); setBranchHistory([]); setBranchFeedback(""); }}>Reset simulation</button></div>}</div>
      </div>
      <div className="labPanel"><span className="labKicker">ANNOTATED EXEMPLAR</span><h4>A strong implementation cycle</h4><ol className="annotatedSteps">{experience.annotatedExample.map(step => <li key={step}>{step}</li>)}</ol></div>
    </div>}

    {tab === "apply" && <div className="courseLabSection">
      <div className="labPanel tomorrowCard"><span className="labKicker">TRY IT TOMORROW</span><h4>Choose one action small enough to actually use</h4><p>Write one precise action you can test in your next suitable lesson or professional situation.</p><textarea rows={4} value={tryTomorrow} onChange={e => setTryTomorrow(e.target.value)} placeholder={`Tomorrow I will use one idea from ${course.title} by…`}/><div className="labActions"><button type="button" className="primary" disabled={busy} onClick={() => saveTextMeta("__try_tomorrow", tryTomorrow, "Tomorrow action saved. It now appears in your course journey map.")}>Save tomorrow action</button></div></div>
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">LESSON-PLANNING CHALLENGE</span><h4>Apply this to an upcoming lesson</h4><p>Explain where the course idea will appear, what pupils will do, and how you will know whether it helped.</p><textarea rows={6} value={lessonChallenge} onChange={e => setLessonChallenge(e.target.value)} placeholder="Lesson / class / strategy / evidence…"/><button type="button" className="primary" disabled={busy} onClick={() => saveTextMeta("__lesson_challenge", lessonChallenge, "Lesson-planning challenge saved.")}>Save challenge</button></div>
        <div className="labPanel"><span className="labKicker">IMPLEMENTATION CHECKLIST</span><h4>Before you try it</h4><ul className="implementationChecklist">{experience.implementationChecklist.map(item => <li key={item}>✓ {item}</li>)}</ul></div>
      </div>
      <div className="labPanel"><span className="labKicker">ACTION-PLAN BUILDER</span><h4>Turn learning into one testable change</h4><form className="courseActionForm" onSubmit={e => { e.preventDefault(); createActionPlan(e.currentTarget); }}><label>Plan title<input name="title" defaultValue={`${course.title}: classroom implementation`}/></label><label>Review date<input type="date" name="review_date" defaultValue={dateFromNow(21)}/></label><label className="span2">Action to test<textarea required name="action" rows={3} defaultValue={tryTomorrow}/></label><label>Context<textarea name="context" rows={3} placeholder="Class, routine or situation — no pupil-identifiable information"/></label><label>Intended outcome<textarea name="outcome" rows={3}/></label><label className="span2">Evidence plan<textarea name="evidence" rows={3}/></label><div className="span2"><button className="primary" disabled={busy}>Save action plan</button></div></form></div>
      <div className="labPanel toolkitPanel"><span className="labKicker">CLASSROOM TOOLKIT</span><h4>Take the course into practice</h4><button type="button" className="secondary" onClick={downloadToolkit}>Download course toolkit</button></div>
    </div>}

    {tab === "facilitate" && <div className="courseLabSection">
      <div className="labGrid two"><div className="labPanel deckLauncher"><span className="labKicker">FACILITATOR DECK MODE</span><h4>Turn this course into a presentation</h4><p>Launch a six-slide, full-screen deck built automatically from the course objectives, visual model, discussion prompts and implementation steps.</p><div className="labActions"><button type="button" className="primary" onClick={() => { setDeckIndex(0); setDeckOpen(true); }}>Launch presentation deck</button><a className="secondary phaseLinkButton" href={`/live?course=${encodeURIComponent(course.id)}`}>Open Live CPD</a></div></div><div className="labPanel"><span className="labKicker">FACILITATOR NOTES</span><h4>Run this as staff CPD</h4>{experience.facilitatorNotes.map(note => <p key={note}>• {note}</p>)}</div></div>
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">DISCUSSION PROMPTS</span><h4>Pause and involve the room</h4>{experience.discussionPrompts.map((prompt, i) => <div className="discussionPrompt" key={prompt}><span>{i + 1}</span><p>{prompt}</p></div>)}</div><div className="labPanel"><span className="labKicker">COACHING EXTENSION</span><h4>Use after the session</h4>{experience.coachingPrompts.map(p => <p key={p}>• {p}</p>)}</div></div>
    </div>}

    {tab === "review" && <div className="courseLabSection">
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">END-OF-COURSE MASTERY</span><h4>Randomised knowledge check</h4>{masteryQuestions.map((q, qi) => <div className="diagnosticQuestion" key={`${q.question}-${masterySeed}-${qi}`}><strong>{qi + 1}. {q.question}</strong><div className="labOptions">{q.options.map((option, oi) => <button type="button" key={option} className={masteryAnswers[qi] === oi ? "selected" : ""} onClick={() => setMasteryAnswers(prev => ({ ...prev, [qi]: oi }))}>{option}</button>)}</div></div>)}<div className="labActions"><button type="button" className="primary" onClick={submitMastery}>Score mastery</button><button type="button" className="secondary" onClick={() => { setMasterySeed(v => v + 1); setMasteryAnswers({}); setMasteryScore(-1); }}>Shuffle / retry</button></div>{masteryScore >= 0 && <div className="diagnosticResult"><strong>{masteryScore}%</strong><span>{masteryScore >= 80 ? "Mastery threshold reached" : "Revisit adaptive review and retry"}</span></div>}</div><div className="labPanel"><span className="labKicker">CONFIDENCE AFTER</span><h4>Compare confidence with knowledge</h4><div className="confidenceScale">{[1,2,3,4,5].map(n => <button type="button" key={n} className={confidenceEnd === n ? "selected" : ""} onClick={() => saveConfidence("end", n)}>{n}</button>)}</div><div className="confidenceCompare"><div><strong>{confidenceStart || "–"}/5</strong><span>before</span></div><div><strong>{confidenceEnd || "–"}/5</strong><span>after</span></div><div><strong>{diagScore >= 0 ? `${diagScore}%` : "–"}</strong><span>diagnostic</span></div><div><strong>{masteryScore >= 0 ? `${masteryScore}%` : "–"}</strong><span>mastery</span></div></div></div></div>
      {masteryScore >= 0 && masteryScore < 80 && <div className="labPanel remediationPanel"><span className="labKicker">ADAPTIVE REVIEW</span><h4>Target the next retry</h4><div className="remediationGrid">{experience.diagnostic.slice(0, 3).map((q, i) => <article key={q.question}><span>{i + 1}</span><div><strong>{course.objectives[i % course.objectives.length] || "Key idea"}</strong><p>{q.feedback}</p></div></article>)}</div></div>}
      <div className="labPanel"><span className="labKicker">RECOMMENDED NEXT</span><h4>Continue the pathway</h4><div className="recommendedCourseGrid">{recommendedCourses.map(next => <button type="button" key={next.id} onClick={() => onOpenCourse(next)}><strong>{next.title}</strong><span>{next.category} · {next.duration} min</span><p>{next.summary}</p></button>)}</div></div>
    </div>}

    {deckOpen && <div className="facilitatorDeck" role="dialog" aria-modal="true" aria-label={`${course.title} facilitator deck`}><div className="deckChrome"><span>{deckIndex + 1} / {deckSlides.length}</span><button type="button" onClick={() => setDeckOpen(false)}>Close ×</button></div><article className="deckSlide"><span className="deckKicker">{deckSlides[deckIndex].kicker}</span><h2>{deckSlides[deckIndex].title}</h2>{deckSlides[deckIndex].body && <p>{deckSlides[deckIndex].body}</p>}{deckSlides[deckIndex].bullets && <div className="deckBullets">{deckSlides[deckIndex].bullets?.map((bullet, i) => <div key={bullet}><span>{i + 1}</span><p>{bullet}</p></div>)}</div>}<div className="deckNav"><button type="button" className="secondary" disabled={deckIndex === 0} onClick={() => setDeckIndex(i => Math.max(0, i - 1))}>← Previous</button><div className="deckDots">{deckSlides.map((_, i) => <button type="button" aria-label={`Go to slide ${i + 1}`} key={i} className={i === deckIndex ? "active" : ""} onClick={() => setDeckIndex(i)} />)}</div><button type="button" className="primary" disabled={deckIndex === deckSlides.length - 1} onClick={() => setDeckIndex(i => Math.min(deckSlides.length - 1, i + 1))}>Next →</button></div></article></div>}
  </section>;
}
