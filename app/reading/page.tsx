"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { courseIdsWithReadings, readingsForCourse } from "@/lib/courseReadingLibrary";

const availableCourses = courses.filter(course => courseIdsWithReadings.includes(course.id));

type Answers = Record<string, number>;
type Checked = Record<string, boolean>;

export default function CourseReadingPage() {
  const [selectedId, setSelectedId] = useState(availableCourses[0]?.id || "");
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Checked>({});

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("course");
    if (requested && availableCourses.some(course => course.id === requested)) setSelectedId(requested);
  }, []);

  const course = useMemo(() => availableCourses.find(item => item.id === selectedId) || availableCourses[0], [selectedId]);
  const readings = useMemo(() => course ? readingsForCourse(course.id) : [], [course]);

  if (!course) return <main className="stagePage"><div className="stageCard">No curated reading packs are available yet.</div></main>;

  function choose(key: string, value: number) {
    setAnswers(previous => ({ ...previous, [key]: value }));
    setChecked(previous => ({ ...previous, [key]: false }));
  }

  return <main className="stagePage readingHubPage">
    <section className="stageHero readingHero">
      <span className="eyebrow">COURSE READING · EVIDENCE TO PRACTICE</span>
      <h1>Read the source. Test the idea. Apply it.</h1>
      <p>Flagship courses now include curated DfE and EEF reading. Open the source first, use the focus prompts to read actively, then answer the linked questions. The summaries and questions support professional learning but do not replace the original guidance.</p>
      <div className="readingHeroJourney" aria-label="Reading learning journey">
        <div><span>1</span><strong>Open</strong><small>original source</small></div>
        <i>→</i><div><span>2</span><strong>Focus</strong><small>key ideas</small></div>
        <i>→</i><div><span>3</span><strong>Check</strong><small>questions</small></div>
        <i>→</i><div><span>4</span><strong>Connect</strong><small>school practice</small></div>
      </div>
    </section>

    <section className="stageCard readingCoursePicker">
      <label><span>Choose a flagship course</span><select value={course.id} onChange={event => { setSelectedId(event.target.value); setAnswers({}); setChecked({}); }}>{availableCourses.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <div><strong>{readings.length}</strong><span>curated reading{readings.length === 1 ? "" : "s"}</span></div>
      <div><strong>{readings.reduce((sum, item) => sum + item.readTime, 0)}</strong><span>approx. reading minutes</span></div>
    </section>

    {course.id === "safeguarding-essentials" && <section className="stageCard readingSafeguardingNotice">
      <span className="eyebrow">SAFEGUARDING READING REQUIREMENT</span>
      <h2>KCSIE Part One remains the required source</h2>
      <p>The short KCSIE overview, this course and these questions are learning aids. They do not replace reading KCSIE 2026 Part One in full or following your school's current safeguarding policy and DSL procedures.</p>
      <a className="secondary phaseLinkButton" href="/safeguarding/documents">Open school safeguarding documents</a>
    </section>}

    <div className="readingStack">
      {readings.map((reading, readingIndex) => <article className="readingCard" key={reading.id}>
        <div className="readingCardTop">
          <div className="readingOrdinal">{String(readingIndex + 1).padStart(2, "0")}</div>
          <div><span className="eyebrow">{reading.publisher} · ~{reading.readTime} MIN</span><h2>{reading.title}</h2><p>{reading.summary}</p></div>
          <a className="primary readingOpen" href={reading.url} target={reading.external === false ? undefined : "_blank"} rel={reading.external === false ? undefined : "noreferrer"}>{reading.external === false ? "Open school reading" : "Open original reading ↗"}</a>
        </div>

        <div className="readingFocusPanel">
          <div className="readingPulse" aria-hidden="true"><span/><span/><span/></div>
          <div><strong>Read with these questions in mind</strong><ul>{reading.focusPoints.map(point => <li key={point}>{point}</li>)}</ul></div>
        </div>

        <section className="readingQuestions">
          <div className="readingSectionTitle"><span>KNOWLEDGE CHECK</span><strong>Questions based on this reading</strong></div>
          {reading.questions.map((question, questionIndex) => {
            const key = `${reading.id}-${questionIndex}`;
            const answer = answers[key];
            const hasChecked = checked[key];
            const correct = answer === question.answer;
            return <div className="readingQuestion" key={key}>
              <h3>{questionIndex + 1}. {question.question}</h3>
              <div className="readingOptions">{question.options.map((option, optionIndex) => <button type="button" className={`${answer === optionIndex ? "selected" : ""} ${hasChecked && answer === optionIndex ? (correct ? "correct" : "incorrect") : ""}`} onClick={() => choose(key, optionIndex)} key={option}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
              <div className="readingCheckRow"><button type="button" className="secondary" disabled={answer === undefined} onClick={() => setChecked(previous => ({ ...previous, [key]: true }))}>Check answer</button>{hasChecked && <p className={correct ? "readingFeedback correct" : "readingFeedback incorrect"}><strong>{correct ? "Correct." : "Review and try again."}</strong> {correct ? question.feedback : "Re-open the source or focus points, then choose another answer."}</p>}</div>
            </div>;
          })}
        </section>
      </article>)}
    </div>

    <section className="stageCard readingTransfer">
      <span className="eyebrow">TRANSFER TO PRACTICE</span>
      <h2>Don't stop at reading</h2>
      <div className="readingTransferGrid"><div><span>1</span><strong>Name one idea</strong><p>Choose the part of the reading that is most relevant to a real professional need.</p></div><div><span>2</span><strong>Connect it</strong><p>Link it to the full course, your school policy and the pupils or staff context.</p></div><div><span>3</span><strong>Test it</strong><p>Use one manageable change rather than trying to implement everything at once.</p></div><div><span>4</span><strong>Review</strong><p>Look for evidence and decide whether to keep, adapt, scale or revisit the change.</p></div></div>
    </section>
  </main>;
}
