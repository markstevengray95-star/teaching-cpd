"use client";

import { useEffect, useRef, useState } from "react";
import { courses, extendedCourses } from "@/lib/catalogue";
import type { Course, Module } from "@/lib/catalogue";
import { completedModuleCount } from "@/lib/conciseCourses";
import { courseSections, moduleLabels, slideReadingExtension } from "@/lib/presentationLearning";
import CourseReading from "./CourseReading";
import ReadingPractice from "./ReadingPractice";
import CourseLab from "./CourseLab";
import { shortCourseParents } from "@/lib/shortCourses";
import { isAssessmentBank } from "@/lib/assessmentQuestions";
import AssessmentPractice from "./AssessmentPractice";
import ActivityPractice from "./ActivityPractice";
import CourseTakeaway from "./CourseTakeaway";
import CoursePersonalisation from "./CoursePersonalisation";
import CourseFollowUp from "./CourseFollowUp";
import CourseSources from "./CourseSources";
import { followUpKey } from "@/lib/courseFollowUp";
import { parsePracticeOption } from "@/lib/practiceOptionParsing";
import { choiceFeedback, toolkitKey, personalisationKey } from "@/lib/courseLearningTools";

type ProgressItem = { completedModules: string[]; reflections: Record<string, string>; completedAt?: string };

export function CourseWorkspace({ course: concise, state, onClose, onComplete, onSaveMeta, onOpenCourse }: { course: Course; state?: ProgressItem; onClose: () => void; onComplete: (course: Course, module: Module, reflection?: string) => Promise<void>; onSaveMeta: (key: string, value: string) => Promise<void>; onOpenCourse: (course: Course) => void }) {
  const [extended, setExtended] = useState(false);
  const course = extended ? extendedCourses.find(item => item.id === concise.id) || concise : concise;
  const completed = state?.completedModules || [];
  const firstIncomplete = course.modules.findIndex((module) => !completed.includes(module.id));
  const [index, setIndex] = useState(firstIncomplete < 0 ? 0 : firstIncomplete);
  const [showLab, setShowLab] = useState(false);
  const [showTakeaway, setShowTakeaway] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false), [showSources, setShowSources] = useState(false);
  function selectTool(tool: "start" | "takeaway" | "followup" | "sources") {
    setShowLab(false);
    setShowStart(tool === "start" && !showStart); setShowTakeaway(tool === "takeaway" && !showTakeaway);
    setShowFollowUp(tool === "followup" && !showFollowUp); setShowSources(tool === "sources" && !showSources);
  }
  const [presenting, setPresenting] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const module = course.modules[index];
  const done = completedModuleCount(course, completed);
  const percent = !extended && state?.completedAt ? 100 : Math.round((done / course.modules.length) * 100);
  const sections = courseSections(course);
  const section = sections.find(item => index >= item.start && index < item.end) || sections[0];
  const stage = moduleLabels[module.type];
  const isShort = Boolean(shortCourseParents[course.id]);
  const related = isShort ? courses.filter(c => c.id === shortCourseParents[course.id]) : courses.filter(c => shortCourseParents[c.id] === course.id);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalRef.current?.querySelector<HTMLButtonElement>(".courseClose")?.focus();
    return () => previous?.focus();
  }, []);

  function handleKeys(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") { event.preventDefault(); presenting ? setPresenting(false) : onClose(); return; }
    if (event.key === "Tab") {
      const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,summary,a[href],[tabindex="0"]') || []).filter(element => element.getClientRects().length);
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    if ((event.target as HTMLElement).closest("input,textarea,select,button,summary,[contenteditable=true]")) return;
    if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); setIndex(value => value - 1); }
    if (event.key === "ArrowRight" && index < course.modules.length - 1) { event.preventDefault(); setIndex(value => value + 1); }
  }

  function toggleExtended() {
    const nextCourse = extended ? concise : extendedCourses.find(item => item.id === concise.id) || concise;
    const nextIndex = nextCourse.modules.findIndex(item => item.id === module.id);
    setIndex(nextIndex < 0 ? 0 : nextIndex);
    setExtended(value => !value);
  }

  return <div className="modalBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="course-title" onKeyDown={handleKeys} className={`courseModal academyPresentation ${isShort ? "shortCoursePresentation" : ""} ${showLab ? "labMode" : ""} ${presenting ? "presentationFocus" : ""}`}>
      <header className="courseModalHead"><div><span className="eyebrow">{course.category} · {course.level} · {course.duration} MIN ESTIMATE · {isShort ? "SHORT COURSE" : extended ? "EXTENDED" : "CORE COURSE"}</span><h2 id="course-title">{course.title}</h2></div><div className="courseModalHeadActions"><button className="secondary" aria-pressed={presenting} onClick={() => setPresenting(value => !value)}>{presenting ? "Exit presentation" : "Present"}</button><details className="courseMoreTools"><summary>Course tools</summary><div>{!isShort && <button className="secondary" aria-pressed={extended} onClick={toggleExtended}>{extended ? "Return to concise course" : "Extended practice (optional)"}</button>}<button className={showLab ? "primary courseLabToggle" : "secondary courseLabToggle"} onClick={() => { setShowLab((value) => !value); setShowTakeaway(false); setShowStart(false); setShowFollowUp(false); setShowSources(false); }}>{showLab ? "Back to modules" : "Open Course Lab"}</button></div></details><button className="iconButton courseClose" aria-label="Close course" onClick={onClose}>×</button></div></header>
      {related.length > 0 && <div className="relatedCourseStrip"><span>{isShort ? "Continue with the key course:" : "Linked short courses:"}</span>{related.map(c => <button className="textButton" key={c.id} onClick={() => onOpenCourse(c)}>{c.title} · {c.duration} min</button>)}</div>}
      <div className="courseProgress"><div><span>{done} of {course.modules.length} modules complete</span><strong>{percent}%</strong></div><div className="progress"><span style={{ width: `${percent}%` }} /></div></div>
      <nav className="learningToolBar" aria-label="Optional course learning tools"><button type="button" className="secondary" aria-pressed={showStart} onClick={() => selectTool("start")}>{showStart ? "Back to course modules" : "Find my focus"}</button><button type="button" className="secondary" aria-pressed={showTakeaway} onClick={() => selectTool("takeaway")}>{showTakeaway ? "Back to course modules" : "Practical takeaway"}</button><button type="button" className="secondary" aria-pressed={showFollowUp} onClick={() => selectTool("followup")}>{showFollowUp ? "Back to course modules" : "Follow-up learning"}</button><button type="button" className="secondary" aria-pressed={showSources} onClick={() => selectTool("sources")}>{showSources ? "Back to course modules" : "Sources & access"}</button></nav>
      <div className="courseLabViewport" hidden={!showStart}><CoursePersonalisation key={course.id} course={course} saved={state?.reflections[personalisationKey]} onSave={onSaveMeta} onSelectModule={id => { const target = course.modules.findIndex(m => m.id === id); if (target >= 0) { setIndex(target); setShowStart(false); } }}/></div>
      <div className="courseLabViewport" hidden={!showTakeaway}><CourseTakeaway key={course.id} course={course} saved={state?.reflections[toolkitKey]} onSave={onSaveMeta}/></div>
      <div className="courseLabViewport" hidden={!showFollowUp}><CourseFollowUp key={course.id} course={course} completedAt={state?.completedAt} saved={state?.reflections[followUpKey]} onSave={onSaveMeta}/></div>
      <div className="courseLabViewport" hidden={!showSources}><CourseSources course={course}/></div>
      {showLab && <div className="courseLabViewport"><CourseLab course={course} allCourses={courses} savedMeta={state?.reflections || {}} completedCount={done} totalModules={course.modules.length} onSaveMeta={onSaveMeta} onOpenCourse={item => { const target = courses.find(candidate => candidate.id === item.id); if (target) onOpenCourse(target); }} /></div>}
      <div className="moduleLayout" hidden={showTakeaway || showLab || showStart || showFollowUp || showSources}>
        <aside className="moduleNav" aria-label="Course sections"><div className="courseMapTitle">Your learning path<small>{isShort ? "Three steps · 15–20 minute practice" : "Five sections · one practical outcome"}</small></div>{sections.map((group, groupIndex) => <details key={group.id} className="courseSection" open={group.id === section.id}><summary><span>{groupIndex + 1}</span><div><strong>{group.title}</strong><small>{completedModuleCount({ ...course, modules: course.modules.slice(group.start, group.end) }, completed)} / {group.end - group.start} complete</small></div></summary>{course.modules.slice(group.start, group.end).map((item, offset) => { const itemIndex = group.start + offset; return <button key={item.id} aria-current={itemIndex === index ? "step" : undefined} className={`${itemIndex === index ? "current" : ""} ${completed.includes(item.id) ? "done" : ""}`} onClick={() => setIndex(itemIndex)}><span>{completed.includes(item.id) ? "✓" : itemIndex + 1}</span><div><strong>{item.title}</strong><small>{moduleLabels[item.type]}</small></div></button>; })}</details>)}</aside>
        <div className="academySlideViewport"><div className="learningSectionBanner"><span>{section.title}</span><p>{section.purpose}</p><small>{index - section.start + 1} / {section.end - section.start} in this section · planned {(module.minutes ?? 1).toFixed(1)} min</small></div>
        <ModuleViewer key={module.id} course={course} module={module} stage={stage} completed={completed.includes(module.id)} savedResponse={state?.reflections[module.id] || ""} savedPractice={state?.reflections[`presentation:${module.id}:practice`] || ""} onSavePractice={value => onSaveMeta(`presentation:${module.id}:practice`, value)} onComplete={onComplete} onPrevious={() => setIndex((value) => Math.max(0, value - 1))} onNext={() => setIndex((value) => Math.min(course.modules.length - 1, value + 1))} index={index} total={course.modules.length} />
        </div>
      </div>
    </section>
  </div>;
}

function ModuleViewer({ course, module, stage, completed, savedResponse, savedPractice, onSavePractice, onComplete, onPrevious, onNext, index, total }: { course: Course; module: Module; stage: string; completed: boolean; savedResponse: string; savedPractice: string; onSavePractice: (value: string) => Promise<void>; onComplete: (course: Course, module: Module, reflection?: string) => Promise<void>; onPrevious: () => void; onNext: () => void; index: number; total: number }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [response, setResponse] = useState(savedResponse);
  const [checks, setChecks] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  const [assessmentRecord, setAssessmentRecord] = useState("");
  const bankAssessment = isAssessmentBank(module);
  const extension = slideReadingExtension(course, module);

  async function finish() {
    if (bankAssessment && !assessmentPassed) { setFeedback("Score and pass the assessment before completing this module."); return; }
    if (module.type === "quiz" && !bankAssessment && choice !== module.answer) { setFeedback("Choose the correct answer before completing this knowledge check."); return; }
    if (module.type === "scenario" && choice === null) { setFeedback("Choose a response before continuing."); return; }
    if (module.type === "checklist" && checks.length !== module.items.length) { setFeedback("Work through every checklist item before completing this module."); return; }
    if (module.type === "reflection" && response.trim().length < 10) { setFeedback("Add a little more detail so this reflection is useful when you revisit it."); return; }
    if (module.type === "activity" && response.trim().length < (module.minimumCharacters ?? 30)) { setFeedback(`Add at least ${module.minimumCharacters ?? 30} characters before completing this activity.`); return; }
    setBusy(true);
    try {
      await onComplete(course, module, bankAssessment ? assessmentRecord : module.type === "reflection" || module.type === "activity" ? response.trim() : undefined);
      setFeedback("Saved to your CPD record.");
    } catch { setFeedback("The module could not be saved. Your response is still here; try again."); }
    finally { setBusy(false); }
  }

  return <article className="moduleContent presentationSlide academySlide" data-presentation-stage={stage === "Read" ? "Learn" : stage} data-module-type={module.type} tabIndex={0} aria-label={`Slide ${index + 1}: ${module.title}`}>
    <div className="presentationSlideMeta"><span className="presentationStageBadge">{stage}</span><span className="presentationSlideCounter">Slide {index + 1} / {total}</span><span className="presentationKeyboardHint">← / → to explore · Escape to close</span></div>
    <span className={`moduleType ${module.type}`}>{module.type.toUpperCase()}</span><h2>{module.title}</h2>
    {module.type === "content" ? <CourseReading key={module.id} course={course} module={module} /> : null}
    {module.type === "quiz" && !bankAssessment && <div className="interactiveBlock"><p className="lead">{module.question}</p><div className="optionList">{module.options.map((option, optionIndex) => <button key={option} aria-pressed={choice === optionIndex} className={choice === optionIndex ? "option selected" : "option"} onClick={() => { setChoice(optionIndex); const result = choiceFeedback(module, optionIndex); setFeedback((result.correct ? "Correct. " : "Review this distinction. ") + "Your choice: " + result.selected + "\nCourse response: " + result.model + "\nWhy: " + result.explanation + "\nNext: " + result.next); }}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>{feedback && <div className="feedback" role="status" style={{ whiteSpace: "pre-line" }}>{feedback}</div>}</div>}
    {module.type === "quiz" && bankAssessment && <><AssessmentPractice module={module} onResult={(passed, record) => { setAssessmentPassed(passed); setAssessmentRecord(record); setFeedback(""); }} />{feedback && <div className="feedback" role="status">{feedback}</div>}</>}
    {module.type === "scenario" && <div className="interactiveBlock"><p className="lead">{module.prompt}</p><div className="optionList">{module.options.map((option, optionIndex) => <button key={option.label} data-practice-tag={parsePracticeOption(option.label).tag || undefined} aria-pressed={choice === optionIndex} className={choice === optionIndex ? "option selected" : "option"} onClick={() => { setChoice(optionIndex); setFeedback(option.feedback); }}><span aria-hidden="true">{optionIndex + 1}</span>{parsePracticeOption(option.label).label}</button>)}</div>{feedback && <div className="feedback" role="status">{feedback}</div>}</div>}
    {module.type === "reflection" && <div className="interactiveBlock"><p className="lead">{module.prompt}</p><textarea aria-label={module.title + " response"} className="reflectionBox" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Record your professional reflection…" />{feedback && <div className="feedback">{feedback}</div>}</div>}
    {module.type === "activity" && <><ActivityPractice course={course} module={module} response={response} onChange={setResponse}/>{feedback && <div className="feedback" role="status">{feedback}</div>}</>}
    {module.type === "checklist" && <div className="interactiveBlock"><p className="lead">{module.prompt}</p><div className="checklist">{module.items.map((item, itemIndex) => <label key={item}><input type="checkbox" checked={checks.includes(itemIndex)} onChange={() => setChecks((current) => current.includes(itemIndex) ? current.filter((value) => value !== itemIndex) : [...current, itemIndex])} /><span>{item}</span></label>)}</div>{feedback && <div className="feedback">{feedback}</div>}</div>}
    {module.type === "visual" && <div className={`visualModule ${module.layout}`}><p className="lead">{module.caption}</p><div className="visualItems">{module.items.map((item, itemIndex) => <div className="visualItem" key={`${item.heading}-${itemIndex}`}><span className="visualIcon">{item.icon || itemIndex + 1}</span><h3>{item.heading}</h3><p>{item.text}</p></div>)}</div>{feedback && <div className="feedback">{feedback}</div>}</div>}
    {extension ? <ReadingPractice key={module.id} pack={extension} saved={savedPractice} onSave={onSavePractice} /> : null}
    {module.type === "content" && feedback ? <div className="feedback" role="status">{feedback}</div> : null}
    <div className="moduleFooter moduleActions"><button className="secondary" disabled={index === 0 || busy} onClick={onPrevious}>← Previous</button><button className={completed ? "secondary" : "primary"} disabled={busy} onClick={finish}>{busy ? "Saving…" : completed ? "Save / revisit" : "Complete module"}</button><button className="secondary" disabled={index === total - 1 || busy} onClick={onNext}>Next →</button></div>
  </article>;
}
