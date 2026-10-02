"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import resources from "@/lib/senResources.json";

type TaskKey = keyof typeof resources.eal.tasks;
type StrandKey = "listening" | "speaking" | "reading" | "writing";
type Phase = "KS3" | "KS4" | "KS5";

type Responses = Record<StrandKey, string>;

const strands: { key: StrandKey; title: string; short: string }[] = [
  { key: "listening", title: "Listening & understanding", short: "Listening" },
  { key: "speaking", title: "Speaking & interaction", short: "Speaking" },
  { key: "reading", title: "Reading & viewing", short: "Reading" },
  { key: "writing", title: "Writing", short: "Writing" },
];

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "28px 22px 80px" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #dbe5f1", borderRadius: 18, padding: 20, boxShadow: "0 8px 28px rgba(23,32,51,.06)" };
const button: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: 0, borderRadius: 11, padding: "11px 15px", background: "#172033", color: "#fff", fontWeight: 800, cursor: "pointer", textDecoration: "none" };
const secondary: React.CSSProperties = { ...button, background: "#eef4fb", color: "#172033", border: "1px solid #cfdbeb" };
const label: React.CSSProperties = { display: "grid", gap: 6, fontWeight: 750, color: "#26364d" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #cbd7e6", borderRadius: 10, padding: "10px 11px", font: "inherit", background: "#fff", color: "#172033" };

function readingEstimate(scores: number[]) {
  const valid = scores.filter((v) => v >= 1 && v <= 5);
  if (valid.length < 3) return null;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (mean < 1.5) return { range: "7–9 years", mean };
  if (mean < 2.5) return { range: "9–11 years", mean };
  if (mean < 3.5) return { range: "11–13 years", mean };
  if (mean < 4.5) return { range: "13–15 years", mean };
  return { range: "15+ years", mean };
}

export default function TryEalTestPage() {
  const [task, setTask] = useState<TaskKey>("community");
  const [phase, setPhase] = useState<Phase>("KS3");
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showTeacherScript, setShowTeacherScript] = useState(false);
  const [responses, setResponses] = useState<Responses>({ listening: "", speaking: "", reading: "", writing: "" });
  const [readingScores, setReadingScores] = useState<number[]>([0, 0, 0, 0, 0]);

  const pack = resources.eal.tasks[task];
  const current = strands[step];
  const estimate = useMemo(() => readingEstimate(readingScores), [readingScores]);
  const answered = strands.filter((s) => responses[s.key].trim().length > 0).length;

  function reset() {
    setStep(0);
    setStarted(false);
    setFinished(false);
    setShowTeacherScript(false);
    setResponses({ listening: "", speaking: "", reading: "", writing: "" });
    setReadingScores([0, 0, 0, 0, 0]);
  }

  function next() {
    if (step < strands.length - 1) setStep((s) => s + 1);
    else setFinished(true);
  }

  return <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f8fc 0,#eef4fb 100%)" }}>
    <div style={shell}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".13em", color: "#56708f" }}>SEN → EAL → TEST LAB</div>
          <h1 style={{ margin: "5px 0 5px", fontSize: "clamp(28px,4vw,44px)", color: "#172033" }}>Try the EAL tests</h1>
          <p style={{ margin: 0, maxWidth: 780, color: "#617087", lineHeight: 1.55 }}>Run through the original EAL test packs exactly as a pupil/tester would. Nothing on this page is saved to a real pupil record.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/sen" style={secondary}>← SEN Hub</Link>
          <Link href="/sen/eal/full-tests" style={secondary}>Teacher scoring centre</Link>
        </div>
      </div>

      {!started && <section style={{ ...card, display: "grid", gap: 18 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#496888" }}>PRACTICE MODE</span>
          <h2 style={{ margin: "5px 0 6px", color: "#172033" }}>Choose a full test pack</h2>
          <p style={{ margin: 0, color: "#64748b" }}>You can switch pack or phase and repeat the test as many times as you like.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {Object.entries(resources.eal.tasks).map(([key, value]) => <button key={key} type="button" onClick={() => setTask(key as TaskKey)} style={{ ...card, textAlign: "left", cursor: "pointer", borderColor: task === key ? "#5b7eaa" : "#dbe5f1", background: task === key ? "#f1f6fd" : "#fff" }}>
            <strong style={{ display: "block", color: "#172033", fontSize: 16 }}>{value.name}</strong>
            <span style={{ display: "block", marginTop: 5, color: "#64748b", lineHeight: 1.45 }}>{value.theme}</span>
          </button>)}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ ...label, minWidth: 190 }}>Phase
            <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)} style={input}><option>KS3</option><option>KS4</option><option>KS5</option></select>
          </label>
          <button type="button" onClick={() => { setStarted(true); setFinished(false); setStep(0); }} style={button}>Start {pack.name} →</button>
        </div>
      </section>}

      {started && !finished && <>
        <section style={{ ...card, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div><span style={{ fontSize: 12, fontWeight: 900, color: "#56708f" }}>{pack.name.toUpperCase()} · {phase}</span><h2 style={{ margin: "5px 0 0", color: "#172033" }}>{current.title}</h2></div>
            <strong style={{ color: "#52657c" }}>Section {step + 1} of 4</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 16 }}>{strands.map((s, i) => <div key={s.key} style={{ height: 7, borderRadius: 20, background: i <= step ? "#426b98" : "#dbe5f1" }} />)}</div>
        </section>

        <section style={{ ...card, display: "grid", gap: 18 }}>
          {current.key === "listening" ? <>
            <div style={{ borderRadius: 14, background: "#f6f9fd", padding: 16, border: "1px solid #dbe5f1" }}>
              <strong style={{ display: "block", color: "#172033" }}>Listening test instructions</strong>
              <p style={{ margin: "7px 0 0", color: "#607086", lineHeight: 1.6 }}>In a real administration, the teacher reads the script aloud at a natural pace and the pupil answers without seeing the script. For testing the app, you can reveal it below.</p>
              <button type="button" style={{ ...secondary, marginTop: 12 }} onClick={() => setShowTeacherScript((v) => !v)}>{showTeacherScript ? "Hide teacher script" : "Reveal teacher script for testing"}</button>
              {showTeacherScript && <p style={{ margin: "14px 0 0", padding: 14, background: "#fff", borderRadius: 10, color: "#26364d", lineHeight: 1.65 }}>{pack.listening}</p>}
            </div>
          </> : <div style={{ borderRadius: 14, background: "#f6f9fd", padding: 16, border: "1px solid #dbe5f1" }}><strong style={{ display: "block", color: "#172033" }}>Task</strong><p style={{ margin: "7px 0 0", color: "#26364d", lineHeight: 1.65 }}>{pack[current.key]}</p></div>}

          <label style={label}>Your test response
            <textarea value={responses[current.key]} onChange={(e) => setResponses((r) => ({ ...r, [current.key]: e.target.value }))} rows={current.key === "writing" ? 12 : 7} placeholder={`Type a ${current.short.toLowerCase()} response here to test the workflow…`} style={{ ...input, resize: "vertical", lineHeight: 1.55 }} />
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} style={{ ...secondary, opacity: step === 0 ? .45 : 1 }}>← Previous</button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" onClick={reset} style={secondary}>Exit test</button><button type="button" onClick={next} style={button}>{step === 3 ? "Finish test" : "Save & next →"}</button></div>
          </div>
        </section>
      </>}

      {started && finished && <section style={{ display: "grid", gap: 14 }}>
        <article style={card}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#4d7096" }}>TEST COMPLETE</span>
          <h2 style={{ margin: "5px 0", color: "#172033" }}>{pack.name} · {phase}</h2>
          <p style={{ margin: 0, color: "#64748b" }}>You completed {answered}/4 response sections. This confirms the pupil-facing test flow, navigation and response capture are working in practice mode.</p>
        </article>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
          {strands.map((s) => <article key={s.key} style={card}><strong style={{ display: "block", color: "#172033" }}>{s.title}</strong><p style={{ color: "#64748b", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{responses[s.key].trim() || "No response entered."}</p></article>)}
        </div>

        <article style={card}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#4d7096" }}>READING-AGE ESTIMATOR CHECK</span>
          <h2 style={{ margin: "5px 0 6px", color: "#172033" }}>Try the automatic estimate</h2>
          <p style={{ margin: "0 0 14px", color: "#64748b", lineHeight: 1.55 }}>Score at least three of the five reading criteria from 1–5. This is an internal indicative estimate, not a standardised reading-age result.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 10 }}>
            {resources.eal.strands.reading.criteria.map((criterion, i) => <label key={criterion.name} style={label}>{criterion.name}
              <select value={readingScores[i] || ""} onChange={(e) => setReadingScores((old) => old.map((v, idx) => idx === i ? Number(e.target.value) : v))} style={input}><option value="">Not scored</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>
            </label>)}
          </div>
          <div style={{ marginTop: 14, borderRadius: 12, padding: 14, background: estimate ? "#edf7f1" : "#f6f9fd", border: "1px solid #d7e5dd" }}>
            {estimate ? <><strong style={{ color: "#183c2c" }}>Indicative reading-age range: {estimate.range}</strong><span style={{ display: "block", marginTop: 4, color: "#557064" }}>Reading criteria mean: {estimate.mean.toFixed(1)}/5. Use a school-approved standardised test for a formal age-equivalent score.</span></> : <span style={{ color: "#64748b" }}>Score at least three criteria to see the estimator respond.</span>}
          </div>
        </article>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><button type="button" onClick={reset} style={button}>Try another EAL test</button><Link href="/sen/eal/full-tests" style={secondary}>Open teacher scoring centre</Link><Link href="/sen/eal" style={secondary}>EAL Progress Hub</Link></div>
      </section>}
    </div>
  </main>;
}
