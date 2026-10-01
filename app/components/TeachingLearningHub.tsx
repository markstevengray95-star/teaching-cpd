"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./TeachingLearningHub.css";

type Strategy = {
  id: string;
  title: string;
  category: string;
  summary: string;
  useWhen: string;
  example: string;
  implementation: string[];
  evidence: string;
  relatedCpd: string;
};

const strategies: Strategy[] = [
  {
    id: "retrieval",
    title: "Retrieval practice",
    category: "Memory & learning",
    summary: "Build durable knowledge by asking pupils to recall previously learned material without relying on notes.",
    useWhen: "At the start of a lesson, after a gap in teaching, or when key prior knowledge is needed for new learning.",
    example: "Begin with five questions that mix last lesson, last week and an older prerequisite. Review answers quickly and reteach only where needed.",
    implementation: ["Choose a small set of high-value knowledge.", "Mix recent and older content.", "Keep the stakes low and make correction immediate.", "Use patterns in responses to plan reteaching."],
    evidence: "Retrieval is most useful when it is spaced, effortful enough to require recall, and followed by accurate feedback.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "questioning",
    title: "Responsive questioning",
    category: "Assessment",
    summary: "Use questions to find out what the whole class understands before deciding what to teach next.",
    useWhen: "During explanations, worked examples, checks for understanding and before independent practice.",
    example: "Ask every pupil to answer the same hinge question on mini-whiteboards, then adapt the next explanation to the class response.",
    implementation: ["Plan the misconception you want to detect.", "Ask a question with diagnostic answer choices.", "Collect responses from everyone, not volunteers only.", "Respond to the evidence before moving on."],
    evidence: "Questions become formative when the answer changes what the teacher or learner does next.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "adaptive",
    title: "Adaptive teaching",
    category: "Inclusion",
    summary: "Keep ambitious curriculum goals while changing scaffolds, explanations, representations or support according to learner need.",
    useWhen: "When pupils need different routes into the same important curriculum goal.",
    example: "Keep the same core science explanation for the class, but provide a labelled diagram, vocabulary bank and partially completed model for pupils who need extra support.",
    implementation: ["Identify the essential learning goal.", "Anticipate likely barriers.", "Adapt the support rather than automatically reducing the goal.", "Remove scaffolds as pupils become more independent."],
    evidence: "Effective adaptation responds to barriers while preserving access to high-value curriculum content.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "explicit",
    title: "Explicit instruction & modelling",
    category: "Instruction",
    summary: "Make expert thinking visible through clear explanation, modelling, guided practice and gradual release.",
    useWhen: "When introducing unfamiliar procedures, concepts, writing structures or problem-solving approaches.",
    example: "Model a calculation aloud, annotate each decision, complete a second example with the class, then move to independent practice.",
    implementation: ["Break complex learning into manageable steps.", "Model both what to do and why.", "Check understanding during guided practice.", "Increase independence only when pupils are ready."],
    evidence: "Novices benefit from clear guidance and worked examples before they are expected to perform complex tasks independently.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "feedback",
    title: "Actionable feedback",
    category: "Assessment",
    summary: "Give feedback that helps pupils improve the current work or perform better next time, rather than simply explaining a score.",
    useWhen: "After practice, assessment, extended writing, practical work or a misconception-rich task.",
    example: "Instead of correcting every line, identify one high-impact improvement and give pupils time to act on it immediately.",
    implementation: ["Clarify what success looks like.", "Diagnose the most important gap.", "Give a manageable next action.", "Build lesson time for pupils to respond."],
    evidence: "Feedback has greatest value when pupils understand it and are given an opportunity to use it.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "behaviour",
    title: "Behaviour for learning",
    category: "Classroom climate",
    summary: "Use clear routines, predictable responses and positive relationships to maximise attention and learning time.",
    useWhen: "When establishing routines, improving transitions, reducing low-level disruption or increasing participation.",
    example: "Teach a precise entry routine, practise it explicitly, acknowledge success and respond consistently when the routine is not followed.",
    implementation: ["Define the routine in observable steps.", "Teach and rehearse it.", "Use calm, predictable reinforcement.", "Review whether the routine is helping pupils learn."],
    evidence: "Consistency and clarity reduce uncertainty and help pupils focus cognitive resources on learning.",
    relatedCpd: "/cpd",
  },
  {
    id: "literacy",
    title: "Disciplinary literacy",
    category: "Literacy & numeracy",
    summary: "Teach pupils how experts in a subject read, write, speak and use specialist vocabulary.",
    useWhen: "When pupils need to interpret subject texts, explain ideas precisely or use technical vocabulary accurately.",
    example: "Pre-teach a small set of essential terms, model how they are used in an expert explanation, then require pupils to use them in structured writing.",
    implementation: ["Select essential subject vocabulary.", "Teach meaning, morphology and examples.", "Model expert reading or writing choices.", "Give repeated opportunities for purposeful use."],
    evidence: "Literacy support is strongest when embedded in subject thinking rather than treated as a separate generic activity.",
    relatedCpd: "/subject-cpd",
  },
  {
    id: "metacognition",
    title: "Metacognition & self-regulation",
    category: "Memory & learning",
    summary: "Teach pupils to plan, monitor and evaluate how they approach demanding learning tasks.",
    useWhen: "During multi-step problems, extended writing, revision, practical planning or independent work.",
    example: "Before a task, ask pupils to choose a strategy and explain why; pause midway to check progress; finish by evaluating what they would change next time.",
    implementation: ["Model the thinking process aloud.", "Prompt pupils to choose a strategy.", "Use checkpoints during the task.", "Finish with reflection linked to future action."],
    evidence: "Metacognitive prompts are most effective when attached to real curriculum tasks and supported by strong subject knowledge.",
    relatedCpd: "/subject-cpd",
  },
];

const categories = ["All", ...Array.from(new Set(strategies.map((item) => item.category)))];

export default function TeachingLearningHub() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>("retrieval");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return strategies.filter((strategy) => {
      const matchesCategory = category === "All" || strategy.category === category;
      const haystack = `${strategy.title} ${strategy.category} ${strategy.summary} ${strategy.useWhen} ${strategy.example}`.toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [category, query]);

  return (
    <main className="tlHub">
      <header className="tlTopbar">
        <Link href="/teach" className="tlBack">← Teach</Link>
        <div><span>PHASE 31</span><strong>Teaching & Learning Hub</strong></div>
        <Link href="/resource-generator" className="tlGeneratorLink">Create a resource →</Link>
      </header>

      <section className="tlHero">
        <div>
          <span className="tlEyebrow">WHOLE-SCHOOL TEACHING</span>
          <h1>Practical teaching strategies in one place.</h1>
          <p>Find a strategy, see exactly when to use it, how to implement it and where to continue the related professional learning.</p>
        </div>
        <div className="tlHeroStats">
          <span><strong>{strategies.length}</strong><small>core strategies</small></span>
          <span><strong>{categories.length - 1}</strong><small>practice areas</small></span>
          <span><strong>1</strong><small>resource generator</small></span>
        </div>
      </section>

      <section className="tlControls">
        <label><span>Search practice</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. retrieval, feedback, SEND..." /></label>
        <div className="tlChips" aria-label="Teaching strategy categories">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>

      <section className="tlLayout">
        <aside className="tlStrategyList">
          {visible.map((strategy) => (
            <button key={strategy.id} className={openId === strategy.id ? "active" : ""} onClick={() => setOpenId(strategy.id)}>
              <span>{strategy.category}</span>
              <strong>{strategy.title}</strong>
              <small>{strategy.summary}</small>
            </button>
          ))}
          {visible.length === 0 && <div className="tlEmpty">No strategies match that search yet.</div>}
        </aside>

        <section className="tlDetail">
          {(() => {
            const strategy = strategies.find((item) => item.id === openId) || visible[0] || strategies[0];
            return <>
              <div className="tlDetailHeading"><div><span>{strategy.category}</span><h2>{strategy.title}</h2></div><Link href="/resource-generator">Build a classroom resource</Link></div>
              <p className="tlLead">{strategy.summary}</p>
              <div className="tlDetailGrid">
                <article><span>WHEN TO USE IT</span><p>{strategy.useWhen}</p></article>
                <article><span>CLASSROOM EXAMPLE</span><p>{strategy.example}</p></article>
                <article className="wide"><span>IMPLEMENTATION STEPS</span><ol>{strategy.implementation.map((step) => <li key={step}>{step}</li>)}</ol></article>
                <article className="wide"><span>EVIDENCE-INFORMED PRINCIPLE</span><p>{strategy.evidence}</p></article>
              </div>
              <div className="tlActions"><Link href={strategy.relatedCpd}>Open related CPD</Link><Link href="/ai-coach">Discuss with AI CPD Tutor</Link><Link href="/resource-generator">Turn this into a resource</Link></div>
            </>;
          })()}
        </section>
      </section>
    </main>
  );
}
