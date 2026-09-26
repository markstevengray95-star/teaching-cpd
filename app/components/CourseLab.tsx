"use client";

import { useEffect, useMemo, useState } from "react";
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

const implementationOrder = [
  "Identify the specific problem or learning need",
  "Choose one small course-informed change",
  "Decide what evidence you will look for",
  "Try the change consistently in context",
  "Review evidence and keep, adapt or stop",
];

const observationMoments = [
  { title: "Entry", text: "The teacher launches the task immediately. Some pupils begin; others wait for clarification." },
  { title: "Model", text: "A worked example is shown. The teacher explains several decisions but does not yet check what pupils noticed." },
  { title: "Practice", text: "Pupils attempt the task. A common error appears across several responses." },
  { title: "Response", text: "The teacher pauses, samples responses and decides whether to re-model, scaffold or continue." },
];

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

export default function CourseLab({ course, allCourses, savedMeta, completedCount, totalModules, onSaveMeta, onOpenCourse }: Props) {
  const experience = useMemo(() => buildCourseExperience(course, allCourses), [course, allCourses]);
  const scenarioBank = useMemo(() => course.modules.filter((m): m is Extract<Module, { type: "scenario" }> => m.type === "scenario"), [course]);
  const [tab, setTab] = useState<LabTab>("diagnose");
  const [mode, setMode] = useState<ExperienceMode>((savedMeta.__experience_mode as ExperienceMode) || "Standard");
  const [confidenceStart, setConfidenceStart] = useState(Number(savedMeta.__confidence_start || 0));
  const [confidenceEnd, setConfidenceEnd] = useState(Number(savedMeta.__confidence_end || 0));
  const [diagAnswers, setDiagAnswers] = useState<Record<number, number>>({});
  const [diagScore, setDiagScore] = useState(Number(savedMeta.__diagnostic_score || -1));
  const [diagFeedback, setDiagFeedback] = useState<string[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashOpen, setFlashOpen] = useState(false);
  const [revealedMyths, setRevealedMyths] = useState<number[]>([]);
  const [sortItems, setSortItems] = useState(() => rotate(implementationOrder, (stableHash(course.id) % 4) + 1));
  const [sortMessage, setSortMessage] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioPath, setScenarioPath] = useState<string[]>([]);
  const [scenarioFeedback, setScenarioFeedback] = useState("");
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationPlaying, setSimulationPlaying] = useState(false);
  const [decisionSeconds, setDecisionSeconds] = useState(20);
  const [decisionActive, setDecisionActive] = useState(false);
  const [masterySeed, setMasterySeed] = useState(0);
  const [masteryAnswers, setMasteryAnswers] = useState<Record<number, number>>({});
  const [masteryScore, setMasteryScore] = useState(Number(savedMeta.__mastery_score || -1));
  const [lessonChallenge, setLessonChallenge] = useState(savedMeta.__lesson_challenge || "");
  const [midReflection, setMidReflection] = useState(savedMeta.__mid_reflection || "");
  const [rewriteResponse, setRewriteResponse] = useState(savedMeta.__rewrite_activity || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");

  const masteryQuestions = useMemo(() => rotate(experience.diagnostic, stableHash(course.id) + masterySeed), [experience.diagnostic, course.id, masterySeed]);
  const progress = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;
  const recommendedCourses = experience.recommendedNext.map(id => allCourses.find(c => c.id === id)).filter(Boolean) as Course[];

  useEffect(() => {
    if (!simulationPlaying) return;
    const timer = window.setInterval(() => setSimulationStep(step => {
      if (step >= observationMoments.length - 1) {
        setSimulationPlaying(false);
        return step;
      }
      return step + 1;
    }), 2300);
    return () => window.clearInterval(timer);
  }, [simulationPlaying]);

  useEffect(() => {
    if (!decisionActive) return;
    if (decisionSeconds <= 0) {
      setDecisionActive(false);
      return;
    }
    const timer = window.setTimeout(() => setDecisionSeconds(v => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [decisionActive, decisionSeconds]);

  async function saveMode(next: ExperienceMode) {
    setMode(next);
    await onSaveMeta("__experience_mode", next);
  }

  async function saveConfidence(kind: "start" | "end", value: number) {
    if (kind === "start") setConfidenceStart(value); else setConfidenceEnd(value);
    await onSaveMeta(kind === "start" ? "__confidence_start" : "__confidence_end", String(value));
  }

  async function submitDiagnostic() {
    const questions = experience.diagnostic;
    if (Object.keys(diagAnswers).length < questions.length) {
      setMessage("Answer every diagnostic question first.");
      return;
    }
    let correct = 0;
    const misconceptions: string[] = [];
    questions.forEach((q, i) => {
      if (diagAnswers[i] === q.answer) correct += 1;
      else misconceptions.push(`${q.question} — ${q.feedback}`);
    });
    const score = Math.round((correct / questions.length) * 100);
    const nextMode = suggestedMode(score);
    setDiagScore(score);
    setDiagFeedback(misconceptions);
    setMode(nextMode);
    await Promise.all([
      onSaveMeta("__diagnostic_score", String(score)),
      onSaveMeta("__experience_mode", nextMode),
    ]);
    setMessage(`Diagnostic complete: ${score}%. Suggested route: ${nextMode}.`);
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
    setSortMessage(correct ? "Correct — the sequence moves from diagnosis to implementation evidence and review." : "Not quite. Start by identifying the problem, then plan, implement, collect evidence and review.");
  }

  function chooseScenario(optionIndex: number) {
    const scenario = scenarioBank[scenarioIndex];
    if (!scenario) return;
    const option = scenario.options[optionIndex];
    setScenarioFeedback(option.feedback);
    setScenarioPath(path => [...path, option.label]);
  }

  function nextScenario() {
    if (!scenarioBank.length) return;
    setScenarioIndex(i => (i + 1) % scenarioBank.length);
    setScenarioFeedback("");
  }

  function startDecisionChallenge() {
    setDecisionSeconds(20);
    setDecisionActive(true);
    setScenarioFeedback("");
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
    setMessage(score >= 80 ? `Mastery check: ${score}%. Strong result.` : `Mastery check: ${score}%. Revisit the missed ideas, then retry with a reshuffled set.`);
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

  async function scheduleFollowup(days: number, label: string) {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("action_plans").insert({
      user_id: auth.user.id,
      title: `${course.title}: ${label}`,
      action: days <= 7 ? "Revisit the key ideas and retake the mastery check from memory." : "Review what you implemented, what evidence you saw and what you will keep, adapt or stop.",
      context: "Spaced CPD follow-up",
      intended_outcome: days <= 7 ? "Strengthen retrieval of the course's key ideas." : "Evaluate whether the professional learning changed practice in a useful way.",
      evidence_plan: days <= 7 ? "Mastery score and notes on forgotten ideas." : "Professional reflection, work samples or other proportionate non-identifiable evidence.",
      course_id: course.id,
      start_date: today(),
      review_date: dateFromNow(days),
      status: "planned",
    });
    setMessage(error ? error.message : `${label} added to your implementation tracker.`);
  }

  async function uploadEvidence() {
    if (!evidenceFile) {
      setMessage("Choose a PDF or image first.");
      return;
    }
    if (evidenceFile.size > 10 * 1024 * 1024) {
      setMessage("Evidence files must be 10 MB or smaller.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setBusy(true);
    const id = crypto.randomUUID();
    const safeName = evidenceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${auth.user.id}/portfolio/${id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("cpd-evidence").upload(path, evidenceFile, { upsert: false });
    if (uploadError) {
      setBusy(false);
      setMessage(uploadError.message);
      return;
    }
    const { error } = await supabase.from("portfolio_entries").insert({
      user_id: auth.user.id,
      title: `${course.title}: classroom evidence`,
      description: evidenceNote.trim() || "Evidence uploaded from the course implementation activity.",
      evidence_type: "classroom_evidence",
      course_id: course.id,
      cpd_hours: 0,
      occurred_on: today(),
      evidence_path: path,
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from("cpd-evidence").remove([path]);
      setMessage(error.message);
      return;
    }
    setEvidenceFile(null);
    setEvidenceNote("");
    setMessage("Private evidence uploaded and added to your CPD portfolio.");
  }

  function downloadToolkit() {
    const text = [
      course.title,
      "=".repeat(course.title.length),
      "",
      course.summary,
      "",
      "Learning objectives",
      ...course.objectives.map(x => `- ${x}`),
      "",
      "Implementation checklist",
      ...experience.implementationChecklist.map(x => `- ${x}`),
      "",
      "Discussion prompts",
      ...experience.discussionPrompts.map(x => `- ${x}`),
      "",
      "Coaching prompts",
      ...experience.coachingPrompts.map(x => `- ${x}`),
      "",
      "Leadership extension",
      ...experience.leadershipPrompts.map(x => `- ${x}`),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.id}-toolkit.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printSummary() {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!popup) {
      setMessage("Allow pop-ups to print the course summary.");
      return;
    }
    const body = `${course.summary}<h2>Objectives</h2><ul>${course.objectives.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul><h2>Implementation checklist</h2><ol>${experience.implementationChecklist.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ol><h2>Key research-informed reminders</h2>${experience.research.map(x => `<h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.body)}</p>`).join("")}`;
    popup.document.write(`<html><head><title>${escapeHtml(course.title)}</title><style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;line-height:1.55;color:#17212b}h1{font-size:28px}h2{margin-top:28px}li{margin:7px 0}.meta{color:#667085}</style></head><body><div class="meta">Teaching CPD Hub · ${course.duration} minutes · ${escapeHtml(course.category)}</div><h1>${escapeHtml(course.title)}</h1>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
  }

  const stages = [
    { label: "Understand", complete: progress >= 20 },
    { label: "Practise", complete: progress >= 45 },
    { label: "Apply", complete: progress >= 70 },
    { label: "Review", complete: progress >= 100 && Boolean(masteryScore >= 0) },
  ];

  return <section className="courseLab">
    <div className="courseLabHead">
      <div><span className="eyebrow">COURSE LAB</span><h3>Practise, apply and revisit this course.</h3><p>These tools are generated from this course's objectives, checks and scenarios. Your written responses stay private to your CPD account.</p></div>
      <div className="courseModeSwitch" aria-label="Course support mode">{(["ECT", "Standard", "Challenge"] as ExperienceMode[]).map(item => <button type="button" key={item} className={mode === item ? "active" : ""} onClick={() => saveMode(item)}>{item}</button>)}</div>
    </div>

    <div className="courseStageBadges">{stages.map(stage => <span key={stage.label} className={stage.complete ? "done" : ""}>{stage.complete ? "✓ " : "○ "}{stage.label}</span>)}</div>
    {message && <div className="courseLabMessage">{message}</div>}

    <nav className="courseLabTabs">{([
      ["diagnose", "Diagnose"], ["explore", "Explore"], ["practise", "Practise"], ["apply", "Apply"], ["facilitate", "Facilitate"], ["review", "Review"],
    ] as [LabTab, string][]).map(([value, label]) => <button type="button" key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}</nav>

    {tab === "diagnose" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">BEFORE YOU START</span><h4>Confidence check</h4><p>How confident are you applying the ideas in this course now?</p><div className="confidenceScale">{[1,2,3,4,5].map(n => <button type="button" key={n} className={confidenceStart === n ? "selected" : ""} onClick={() => saveConfidence("start", n)}>{n}</button>)}</div><small>1 = very unsure · 5 = very confident</small></div>
        <div className="labPanel"><span className="labKicker">ADAPTIVE ROUTE</span><h4>{mode} mode</h4><p>{mode === "ECT" ? "Use the extra guidance, worked examples and implementation checklist before moving to independent application." : mode === "Challenge" ? "Prioritise critique, transfer, leadership implications and evidence of impact rather than basic recall." : "Work through the standard sequence: understand, practise, apply and review."}</p></div>
      </div>
      <div className="labPanel"><span className="labKicker">PRE-COURSE DIAGNOSTIC</span><h4>{scoreLabel(diagScore < 0 ? 0 : diagScore)}</h4>{experience.diagnostic.map((q, qi) => <div className="diagnosticQuestion" key={`${q.question}-${qi}`}><strong>{qi + 1}. {q.question}</strong><div className="labOptions">{q.options.map((option, oi) => <button type="button" key={option} className={diagAnswers[qi] === oi ? "selected" : ""} onClick={() => setDiagAnswers(prev => ({ ...prev, [qi]: oi }))}>{option}</button>)}</div></div>)}<button type="button" className="primary" onClick={submitDiagnostic}>Score diagnostic</button>{diagScore >= 0 && <div className="diagnosticResult"><strong>{diagScore}%</strong><span>{scoreLabel(diagScore)} · suggested {suggestedMode(diagScore)} route</span></div>}{diagFeedback.length > 0 && <div className="misconceptionList"><strong>Ideas worth revisiting</strong>{diagFeedback.map(item => <p key={item}>{item}</p>)}</div>}</div>
      <div className="labPanel knowledgeMap"><span className="labKicker">VISUAL KNOWLEDGE MAP</span><h4>How the course fits together</h4><div className="knowledgeNodes">{course.objectives.map((objective, i) => <div key={objective} className="knowledgeNode"><span>{i + 1}</span><p>{objective}</p></div>)}</div></div>
    </div>}

    {tab === "explore" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">KEY-TERM FLASHCARDS</span><h4>Retrieve before you reveal</h4>{experience.flashcards.length > 0 && <button type="button" className={flashOpen ? "flashcard open" : "flashcard"} onClick={() => setFlashOpen(v => !v)}><span>{flashOpen ? experience.flashcards[flashIndex].back : experience.flashcards[flashIndex].front}</span><small>{flashOpen ? "Tap to hide" : "Think first, then tap to reveal"}</small></button>}<div className="flashControls"><button type="button" className="secondary" onClick={() => { setFlashIndex(i => (i - 1 + experience.flashcards.length) % experience.flashcards.length); setFlashOpen(false); }}>Previous</button><span>{flashIndex + 1}/{experience.flashcards.length}</span><button type="button" className="secondary" onClick={() => { setFlashIndex(i => (i + 1) % experience.flashcards.length); setFlashOpen(false); }}>Next</button></div></div>
        <div className="labPanel"><span className="labKicker">MYTH OR EVIDENCE?</span><h4>Reveal the explanation</h4><div className="revealCards">{experience.myths.map((card, i) => <button type="button" key={card.title} className={revealedMyths.includes(i) ? "revealCard open" : "revealCard"} onClick={() => setRevealedMyths(prev => prev.includes(i) ? prev.filter(n => n !== i) : [...prev, i])}><strong>{card.title}</strong>{revealedMyths.includes(i) && <span>{card.body}</span>}</button>)}</div></div>
      </div>
      <div className="labPanel"><span className="labKicker">RESEARCH-INFORMED SUMMARY</span><h4>What the evidence is useful for</h4><div className="evidenceCards">{experience.research.map(card => <article key={card.title}><span className={`evidenceStrength strength-${(card.strength || "Context-dependent").toLowerCase().replace(/[^a-z]+/g,"-")}`}>{card.strength}</span><h5>{card.title}</h5><p>{card.body}</p></article>)}</div></div>
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">BEFORE / AFTER</span><h4>Compare implementation</h4>{experience.beforeAfter.map(pair => <div className="beforeAfter" key={pair.before}><div><strong>Before</strong><p>{pair.before}</p></div><div><strong>After</strong><p>{pair.after}</p></div></div>)}</div><div className="labPanel"><span className="labKicker">COMMON MISTAKES</span><h4>Spot the problem</h4>{experience.mistakes.map(m => <article className="mistakeCard" key={m.title}><strong>{m.title}</strong><p>{m.body}</p></article>)}</div></div>
      <div className="labPanel"><span className="labKicker">ANNOTATED EXEMPLAR</span><h4>A small implementation cycle</h4><ol className="annotatedSteps">{experience.annotatedExample.map(step => <li key={step}>{step}</li>)}</ol></div>
    </div>}

    {tab === "practise" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">DRAG / REORDER</span><h4>Put the implementation cycle in order</h4><div className="sortList">{sortItems.map((item, i) => <div key={item} draggable onDragStart={() => setDragIndex(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIndex !== null) moveSort(dragIndex, i); setDragIndex(null); }} className="sortItem"><span className="sortHandle">↕</span><span>{item}</span><div><button type="button" onClick={() => moveSort(i, i - 1)} aria-label="Move up">↑</button><button type="button" onClick={() => moveSort(i, i + 1)} aria-label="Move down">↓</button></div></div>)}</div><button type="button" className="secondary" onClick={checkSort}>Check order</button>{sortMessage && <p className="labFeedback">{sortMessage}</p>}</div>
        <div className="labPanel"><span className="labKicker">BRANCHING SCENARIO BANK</span><h4>{scenarioBank.length ? scenarioBank[scenarioIndex].title : "Professional judgement challenge"}</h4>{scenarioBank.length ? <><p className="scenarioPrompt">{scenarioBank[scenarioIndex].prompt}</p><div className="labOptions">{scenarioBank[scenarioIndex].options.map((option, i) => <button type="button" key={option.label} onClick={() => chooseScenario(i)}>{option.label}</button>)}</div>{scenarioFeedback && <div className="labFeedback">{scenarioFeedback}</div>}<div className="scenarioPath"><small>Decision path: {scenarioPath.length ? scenarioPath.join(" → ") : "No decisions yet"}</small></div><button type="button" className="secondary" onClick={nextScenario}>Next scenario</button></> : <p>No authored scenario is available in this course yet. Use the implementation and observation challenges instead.</p>}</div>
      </div>
      {course.category !== "Safeguarding" && scenarioBank.length > 0 && <div className="labPanel timedDecision"><span className="labKicker">TIMED DECISION CHALLENGE</span><h4>Make a quick instructional decision</h4><p>Use this only as practice in noticing your first response; real professional decisions should use appropriate evidence and time.</p><div className="decisionClock">{decisionSeconds}s</div><button type="button" className="primary" onClick={startDecisionChallenge}>{decisionActive ? "Restart timer" : "Start 20-second challenge"}</button></div>}
      <div className="labPanel observationSim"><span className="labKicker">ANIMATED OBSERVATION TASK</span><h4>Watch the lesson sequence unfold</h4><div className="observationTimeline">{observationMoments.map((moment, i) => <div className={`${i <= simulationStep ? "active" : ""} observationMoment`} key={moment.title}><span>{i + 1}</span><div><strong>{moment.title}</strong><p>{moment.text}</p></div></div>)}</div><div className="labActions"><button type="button" className="primary" onClick={() => { setSimulationStep(0); setSimulationPlaying(true); }}>Play simulation</button><button type="button" className="secondary" onClick={() => setSimulationStep(step => Math.min(observationMoments.length - 1, step + 1))}>Next moment</button></div><p className="pausePrompt">Pause and discuss: what would you notice, what evidence would you collect, and what would you do next through the lens of <strong>{course.title}</strong>?</p></div>
      <div className="labPanel"><span className="labKicker">WHAT WOULD YOU CHANGE?</span><h4>Improve a weak implementation</h4><p className="leadSmall">A colleague says: “I used the strategy once, the lesson felt good, so I know it works.” Rewrite this into a stronger evidence-informed implementation plan.</p><textarea rows={5} value={rewriteResponse} onChange={e => setRewriteResponse(e.target.value)} placeholder="Rewrite the plan…"/><button type="button" className="primary" disabled={busy} onClick={() => saveTextMeta("__rewrite_activity", rewriteResponse, "Practice response saved.")}>Save response</button></div>
      <div className="labGrid three exampleVariants"><ExampleSwitcher title="Subject examples" items={experience.subjectExamples}/><ExampleSwitcher title="Role examples" items={experience.roleExamples}/><ExampleSwitcher title="Age-phase variants" items={experience.phaseExamples}/></div>
    </div>}

    {tab === "apply" && <div className="courseLabSection">
      <div className="labGrid two">
        <div className="labPanel"><span className="labKicker">LESSON-PLANNING CHALLENGE</span><h4>Apply this to an upcoming lesson</h4><p>Choose one lesson and explain where the course idea will appear, what pupils will do, and how you will know whether it helped.</p><textarea rows={6} value={lessonChallenge} onChange={e => setLessonChallenge(e.target.value)} placeholder="Lesson / class / strategy / evidence…"/><button type="button" className="primary" disabled={busy} onClick={() => saveTextMeta("__lesson_challenge", lessonChallenge, "Lesson-planning challenge saved.")}>Save challenge</button></div>
        <div className="labPanel"><span className="labKicker">IMPLEMENTATION CHECKLIST</span><h4>Before you try it</h4><ul className="implementationChecklist">{experience.implementationChecklist.map(item => <li key={item}>✓ {item}</li>)}</ul></div>
      </div>
      <div className="labPanel"><span className="labKicker">MID-COURSE REFLECTION</span><h4>What has changed in your thinking?</h4><textarea rows={5} value={midReflection} onChange={e => setMidReflection(e.target.value)} placeholder="One idea I understand differently now is…"/><button type="button" className="secondary" disabled={busy} onClick={() => saveTextMeta("__mid_reflection", midReflection, "Reflection saved.")}>Save reflection</button></div>
      <div className="labPanel"><span className="labKicker">ACTION-PLAN BUILDER</span><h4>Turn learning into one testable change</h4><form className="courseActionForm" onSubmit={e => { e.preventDefault(); createActionPlan(e.currentTarget); }}><label>Plan title<input name="title" defaultValue={`${course.title}: classroom implementation`}/></label><label>Review date<input type="date" name="review_date" defaultValue={dateFromNow(21)}/></label><label className="span2">Action to test<textarea required name="action" rows={3} placeholder="What exactly will you do differently?"/></label><label>Context<textarea name="context" rows={3} placeholder="Class, routine or situation — no pupil-identifiable information"/></label><label>Intended outcome<textarea name="outcome" rows={3} placeholder="What would you hope to improve or understand?"/></label><label className="span2">Evidence plan<textarea name="evidence" rows={3} placeholder="What evidence will help you judge the change?"/></label><div className="span2"><button className="primary" disabled={busy}>Save action plan</button></div></form></div>
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">SPACED FOLLOW-UP</span><h4>Plan retrieval and impact review</h4><p>Schedule follow-up through the existing implementation tracker.</p><div className="labActions"><button type="button" className="secondary" onClick={() => scheduleFollowup(7, "1-week retrieval review")}>Add 1-week review</button><button type="button" className="secondary" onClick={() => scheduleFollowup(28, "4-week impact review")}>Add 4-week review</button><a className="textButton" href="/actions">Open impact tracker →</a></div></div><div className="labPanel"><span className="labKicker">PRIVATE EVIDENCE</span><h4>Add implementation evidence to your portfolio</h4><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => setEvidenceFile(e.target.files?.[0] || null)}/><textarea rows={3} value={evidenceNote} onChange={e => setEvidenceNote(e.target.value)} placeholder="Short evidence note — do not include confidential pupil-identifiable information."/><button type="button" className="primary" disabled={busy || !evidenceFile} onClick={uploadEvidence}>Upload evidence</button></div></div>
      <div className="labPanel toolkitPanel"><span className="labKicker">CLASSROOM TOOLKIT</span><h4>Take the course into practice</h4><div className="labActions"><button type="button" className="secondary" onClick={downloadToolkit}>Download course toolkit</button><button type="button" className="secondary" onClick={printSummary}>Print one-page summary</button><a className="textButton" href="/portfolio">Open portfolio →</a></div></div>
    </div>}

    {tab === "facilitate" && <div className="courseLabSection">
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">FACILITATOR NOTES</span><h4>Run this as live CPD</h4>{experience.facilitatorNotes.map(note => <p key={note}>• {note}</p>)}<div className="labActions"><a className="primary phaseLinkButton" href={`/live?course=${encodeURIComponent(course.id)}`}>Open live CPD mode</a></div></div><div className="labPanel"><span className="labKicker">GROUP DISCUSSION</span><h4>Ready-to-use prompts</h4>{experience.discussionPrompts.map((prompt, i) => <div className="discussionPrompt" key={prompt}><span>{i + 1}</span><p>{prompt}</p></div>)}</div></div>
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">PAUSE POINTS</span><h4>Build discussion into the course</h4>{experience.pausePoints.map(point => <div className="pauseCard" key={point}>⏸ {point}</div>)}</div><div className="labPanel"><span className="labKicker">COACHING EXTENSION</span><h4>Use after the course</h4>{experience.coachingPrompts.map(p => <p key={p}>• {p}</p>)}</div></div>
      <div className="labPanel"><span className="labKicker">LEADERSHIP EXTENSION</span><h4>Move from individual learning to implementation</h4>{experience.leadershipPrompts.map(p => <p key={p}>• {p}</p>)}</div>
    </div>}

    {tab === "review" && <div className="courseLabSection">
      <div className="labGrid two"><div className="labPanel"><span className="labKicker">END-OF-COURSE MASTERY</span><h4>Randomised question bank</h4>{masteryQuestions.map((q, qi) => <div className="diagnosticQuestion" key={`${q.question}-${masterySeed}-${qi}`}><strong>{qi + 1}. {q.question}</strong><div className="labOptions">{q.options.map((option, oi) => <button type="button" key={option} className={masteryAnswers[qi] === oi ? "selected" : ""} onClick={() => setMasteryAnswers(prev => ({ ...prev, [qi]: oi }))}>{option}</button>)}</div></div>)}<div className="labActions"><button type="button" className="primary" onClick={submitMastery}>Score mastery</button><button type="button" className="secondary" onClick={() => { setMasterySeed(v => v + 1); setMasteryAnswers({}); setMasteryScore(-1); }}>Shuffle / retry</button></div>{masteryScore >= 0 && <div className="diagnosticResult"><strong>{masteryScore}%</strong><span>{masteryScore >= 80 ? "Mastery threshold reached" : "Revisit and retry"}</span></div>}</div><div className="labPanel"><span className="labKicker">CONFIDENCE AFTER LEARNING</span><h4>Compare confidence with knowledge</h4><div className="confidenceScale">{[1,2,3,4,5].map(n => <button type="button" key={n} className={confidenceEnd === n ? "selected" : ""} onClick={() => saveConfidence("end", n)}>{n}</button>)}</div><div className="confidenceCompare"><div><strong>{confidenceStart || "–"}/5</strong><span>before</span></div><div><strong>{confidenceEnd || "–"}/5</strong><span>after</span></div><div><strong>{diagScore >= 0 ? `${diagScore}%` : "–"}</strong><span>diagnostic</span></div><div><strong>{masteryScore >= 0 ? `${masteryScore}%` : "–"}</strong><span>mastery</span></div></div>{confidenceEnd && masteryScore >= 0 && <p className="labFeedback">{confidenceEnd >= 4 && masteryScore < 60 ? "Your confidence is currently higher than the mastery score. Revisit missed concepts before relying on fluency alone." : confidenceEnd <= 2 && masteryScore >= 80 ? "Your mastery score is stronger than your confidence suggests. Use the result as evidence when you apply the strategy." : "Confidence and knowledge evidence are now visible together; use both when choosing your next step."}</p>}</div></div>
      <div className="labPanel recapAnimation"><span className="labKicker">ANIMATED COURSE RECAP</span><h4>From understanding to impact</h4><div className="recapCycle">{course.objectives.slice(0,5).map((objective, i) => <div key={objective}><span>{i + 1}</span><p>{objective}</p></div>)}</div></div>
      <div className="labPanel"><span className="labKicker">RECOMMENDED NEXT</span><h4>Continue the pathway</h4><div className="recommendedCourseGrid">{recommendedCourses.map(next => <button type="button" key={next.id} onClick={() => onOpenCourse(next)}><strong>{next.title}</strong><span>{next.category} · {next.duration} min</span><p>{next.summary}</p></button>)}</div></div>
    </div>}
  </section>;
}

function ExampleSwitcher({ title, items }: { title: string; items: { label: string; body: string }[] }) {
  const [index, setIndex] = useState(0);
  return <div className="labPanel examplePanel"><span className="labKicker">VARIANTS</span><h4>{title}</h4><div className="variantChips">{items.map((item, i) => <button type="button" key={item.label} className={index === i ? "active" : ""} onClick={() => setIndex(i)}>{item.label}</button>)}</div><p>{items[index]?.body}</p></div>;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}
