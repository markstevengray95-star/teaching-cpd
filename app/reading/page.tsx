"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { courseIdsWithReadings, readingsForCourse } from "@/lib/courseReadingIndex";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const readingCourseIds = new Set(courseIdsWithReadings());
const availableCourses = courses.filter(course => readingCourseIds.has(course.id));

type Answers = Record<string, number>;
type Checked = Record<string, boolean>;

export default function CourseReadingPage() {
  const [selectedId, setSelectedId] = useState(availableCourses[0]?.id || "");
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Checked>({});
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("course");
    if (requested && availableCourses.some(course => course.id === requested)) setSelectedId(requested);
  }, []);

  const course = useMemo(() => availableCourses.find(item => item.id === selectedId) || availableCourses[0], [selectedId]);
  const readings = useMemo(() => course ? readingsForCourse(course.id) : [], [course]);

  const totals = useMemo(() => {
    const all = readings.flatMap(reading => reading.questions.map((question, index) => ({ reading, question, key: `${reading.id}-${index}` })));
    const attempted = all.filter(item => checked[item.key]).length;
    const correct = all.filter(item => checked[item.key] && answers[item.key] === item.question.answer).length;
    return { total: all.length, attempted, correct };
  }, [readings, checked, answers]);

  useEffect(() => {
    if (!course || totals.total === 0 || totals.correct !== totals.total) return;
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user || !active) return;
      const { data: current } = await client.from("course_progress")
        .select("completed_modules,reflections,completed_at")
        .eq("user_id", auth.user.id)
        .eq("course_id", course.id)
        .maybeSingle();
      const reflections = {
        ...((current?.reflections || {}) as Record<string, string>),
        __reading_score: "100",
        __reading_correct: String(totals.correct),
        __reading_total: String(totals.total),
        __reading_completed_at: new Date().toISOString(),
      };
      const { error } = await client.from("course_progress").upsert({
        user_id: auth.user.id,
        course_id: course.id,
        completed_modules: current?.completed_modules || [],
        reflections,
        completed_at: current?.completed_at || null,
      }, { onConflict: "user_id,course_id" });
      if (!active) return;
      setSaveMessage(error ? "Your answers are correct, but the reading result could not be saved to your CPD record." : "Reading mastery saved to your CPD record.");
    })();
    return () => { active = false; };
  }, [course, totals.correct, totals.total]);

  if (!course) return <main className="stagePage"><div className="stageCard">No curated reading packs are available yet.</div></main>;

  function choose(key: string, value: number) {
    setAnswers(previous => ({ ...previous, [key]: value }));
    setChecked(previous => ({ ...previous, [key]: false }));
  }

  return <main className="stagePage readingHubPage">
    <section className="stageHero readingHero">
      <span className="eyebrow">COURSE READING · EVIDENCE TO PRACTICE</span>
      <h1>Read the source. Test the idea. Apply it.</h1>
      <p>Flagship courses include curated DfE and EEF reading. Open the original source first, use the focus prompts to read actively, then answer questions based directly on that source before connecting the learning to school practice.</p>
      <div className="readingHeroJourney" aria-label="Reading learning journey">
        <div><span>1</span><strong>Open</strong><small>original source</small></div>
        <i>→</i><div><span>2</span><strong>Focus</strong><small>key ideas</small></div>
        <i>→</i><div><span>3</span><strong>Check</strong><small>source questions</small></div>
        <i>→</i><div><span>4</span><strong>Connect</strong><small>school practice</small></div>
        <i>→</i><div><span>5</span><strong>Apply</strong><small>course action</small></div>
      </div>
    </section>

    <section className="stageCard readingCoursePicker">
      <label><span>Choose a flagship course</span><select value={course.id} onChange={event => { setSelectedId(event.target.value); setAnswers({}); setChecked({}); setSaveMessage(""); }}>{availableCourses.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <div><strong>{readings.length}</strong><span>curated reading{readings.length === 1 ? "" : "s"}</span></div>
      <div><strong>{readings.reduce((sum, item) => sum + item.readTime, 0)}</strong><span>approx. reading minutes</span></div>
      <div><strong>{totals.correct}/{totals.total}</strong><span>source questions correct</span></div>
    </section>

    {course.id === "safeguarding-essentials" && <section className="stageCard readingSafeguardingNotice">
      <span className="eyebrow">SAFEGUARDING READING REQUIREMENT</span>
      <h2>KCSIE Part One remains the required source</h2>
      <p>The KCSIE overview, this course and these questions are learning aids. They do not replace reading KCSIE 2026 Part One in full or following your school's current safeguarding policy, DSL arrangements and reporting procedures.</p>
      <div className="phaseActions"><a className="secondary phaseLinkButton" href="/safeguarding/documents">Open school safeguarding documents</a><a className="secondary phaseLinkButton" href="/?course=safeguarding-essentials">Return to safeguarding course</a></div>
    </section>}

    <div className="readingStack">
      {readings.map((reading, readingIndex) => {
        const readingCorrect = reading.questions.filter((question, questionIndex) => checked[`${reading.id}-${questionIndex}`] && answers[`${reading.id}-${questionIndex}`] === question.answer).length;
        return <article className="readingCard" key={reading.id}>
          <div className="readingCardTop">
            <div className="readingOrdinal">{String(readingIndex + 1).padStart(2, "0")}</div>
            <div><span className="eyebrow">{reading.publisher} · ~{reading.readTime} MIN</span><h2>{reading.title}</h2><p>{reading.summary}</p><small>{readingCorrect}/{reading.questions.length} linked questions correct</small></div>
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
                <div className="readingCheckRow"><button type="button" className="secondary" disabled={answer === undefined} onClick={() => setChecked(previous => ({ ...previous, [key]: true }))}>Check answer</button>{hasChecked && <p className={correct ? "readingFeedback correct" : "readingFeedback incorrect"}><strong>{correct ? "Correct." : "Review the source and try again."}</strong> {correct ? question.feedback : "Use the original reading and focus points, then choose another answer."}</p>}</div>
              </div>;
            })}
          </section>
        </article>;
      })}
    </div>

    <section className={`stageCard readingTransfer ${totals.total > 0 && totals.correct === totals.total ? "readingComplete" : ""}`}>
      <span className="eyebrow">TRANSFER TO PRACTICE</span>
      <h2>{totals.total > 0 && totals.correct === totals.total ? "Reading check complete — now transfer it to practice" : "Don't stop at reading"}</h2>
      <p>{totals.attempted} of {totals.total} questions checked · {totals.correct} correct.</p>
      {saveMessage && <div className="phaseNotice">{saveMessage}</div>}
      <div className="readingTransferGrid"><div><span>1</span><strong>Name one idea</strong><p>Choose the part of the reading that is most relevant to a real professional need.</p></div><div><span>2</span><strong>Connect it</strong><p>Link it to the full course, your school policy and the pupils or staff context.</p></div><div><span>3</span><strong>Test it</strong><p>Use one manageable change rather than trying to implement everything at once.</p></div><div><span>4</span><strong>Review</strong><p>Look for evidence and decide whether to keep, adapt, scale or revisit the change.</p></div></div>
      <div className="phaseActions"><a className="primary phaseLinkButton" href="/">Return to courses</a>{course.id === "safeguarding-essentials" && <a className="secondary phaseLinkButton" href="/safeguarding">Open safeguarding compliance</a>}</div>
    </section>
  </main>;
}
