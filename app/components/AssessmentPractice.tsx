"use client";
import { useState } from "react";
import type { Module } from "@/lib/catalogue";
import { assessmentConfig, questionsForModule, selectAssessmentQuestions, scoreAssessment } from "@/lib/assessmentQuestions";
export default function AssessmentPractice({ module, onResult }: { module: Extract<Module, { type: "quiz" }>; onResult: (passed: boolean, record: string) => void }) {
  const [attempt, setAttempt] = useState(0), [answers, setAnswers] = useState<Record<number, number>>({}), [checked, setChecked] = useState(false), [message, setMessage] = useState("");
  const [bestPercent, setBestPercent] = useState(0);
  const bank = questionsForModule(module), questions = selectAssessmentQuestions(bank, module.id, attempt), config = assessmentConfig(module.id);
  const score = scoreAssessment(questions, answers);
  function check() {
    if (!score.complete) { setMessage("Answer every question before scoring this check."); return; }
    setChecked(true); setMessage("");
    const best = Math.max(bestPercent, score.percent);
    setBestPercent(best);
    onResult(score.percent >= config.threshold, JSON.stringify({ version: 1, attempts: attempt + 1, latestPercent: score.percent, bestPercent: best, latestScore: score.correct, latestTotal: questions.length, passed: score.percent >= config.threshold, weakTopics: questions.filter((q,i)=>answers[i]!==q.answer).map(q=>q.topic), updatedAt: new Date().toISOString() }));
  }
  return <section className="nativeAssessment" aria-label="Course assessment"><p className="practiceSetting">{config.label}. Answer the questions, compare the explanations, then use Complete module to save {config.threshold === 0 ? "your diagnostic result; this starting-point check has no pass mark" : "a passing result"}. Retry rotates the question set.</p>
    {questions.map((q, i) => <fieldset className="evidenceCard" key={q.topic + i}><legend>{i + 1}. {q.question}</legend>{q.options.map((option, n) => <label key={option}><input type="radio" name={`assessment-${module.id}-${i}`} checked={answers[i] === n} disabled={checked} onChange={() => setAnswers(a => ({ ...a, [i]: n }))}/>{option}</label>)}{checked && <div className="practiceFeedback"><strong>{answers[i] === q.answer ? "Correct" : "Review this idea"}</strong><p>{q.feedback}</p>{answers[i] !== q.answer && <p>{q.reteach}</p>}</div>}</fieldset>)}
    <button type="button" className="primary" disabled={checked || !questions.length} onClick={check}>Score assessment</button>
    {checked && <><p role="status">{score.correct}/{questions.length} · {score.percent}% · {score.percent >= config.threshold ? "Ready to save" : "Review and retry before completing"}</p><button type="button" className="secondary" onClick={() => { setAttempt(a=>a+1); setAnswers({}); setChecked(false); setMessage(""); onResult(false, ""); }}>Retry assessment</button></>}
    {message && <p role="status">{message}</p>}
    {!questions.length && <p role="alert">The question bank could not be read. Please report this course; it cannot be marked complete.</p>}
  </section>;
}
