from pathlib import Path

p = Path('app/components/StaffTimetableHub.tsx')
s = p.read_text()

old_type = '''type LessonPlan = {\n  lessonDate: string;\n  topic: string;\n  vocabulary: string;\n  objectives: string;\n  sequence: string;\n  resources: string;\n  assessment: string;\n  teacherNotes: string;\n  curriculumStage: string;\n  curriculumSubject: string;\n  curriculumUnit: string;\n  curriculumSubtopic: string;\n  examBoard: string;\n  courseId: string;\n  sequencePosition: number;\n};'''
new_type = '''type LessonPlan = {\n  lessonDate: string;\n  topic: string;\n  vocabulary: string;\n  objectives: string;\n  sequence: string;\n  resources: string;\n  assessment: string;\n  teacherNotes: string;\n  curriculumStage: string;\n  curriculumSubject: string;\n  curriculumUnit: string;\n  curriculumSubtopic: string;\n  examBoard: string;\n  courseId: string;\n  sequencePosition: number;\n  planningMode: \"simple\" | \"detailed\";\n  priorKnowledge: string;\n  retrieval: string;\n  misconceptions: string;\n  teacherExplanation: string;\n  modelling: string;\n  guidedPractice: string;\n  independentPractice: string;\n  sendEalAdaptations: string;\n  stretchChallenge: string;\n  homeworkTask: string;\n  exitTicket: string;\n  reflection: string;\n};'''
if old_type not in s:
    raise SystemExit('LessonPlan type anchor not found')
s = s.replace(old_type, new_type, 1)

old_blank = '''function blankPlan(): LessonPlan {\n  return { lessonDate: \"\", topic: \"\", vocabulary: \"\", objectives: \"\", sequence: \"\", resources: \"\", assessment: \"\", teacherNotes: \"\", curriculumStage: \"\", curriculumSubject: \"\", curriculumUnit: \"\", curriculumSubtopic: \"\", examBoard: \"\", courseId: \"\", sequencePosition: -1 };\n}'''
new_blank = '''function blankPlan(): LessonPlan {\n  return {\n    lessonDate: \"\", topic: \"\", vocabulary: \"\", objectives: \"\", sequence: \"\", resources: \"\", assessment: \"\", teacherNotes: \"\",\n    curriculumStage: \"\", curriculumSubject: \"\", curriculumUnit: \"\", curriculumSubtopic: \"\", examBoard: \"\", courseId: \"\", sequencePosition: -1,\n    planningMode: \"simple\", priorKnowledge: \"\", retrieval: \"\", misconceptions: \"\", teacherExplanation: \"\", modelling: \"\", guidedPractice: \"\", independentPractice: \"\",\n    sendEalAdaptations: \"\", stretchChallenge: \"\", homeworkTask: \"\", exitTicket: \"\", reflection: \"\",\n  };\n}'''
if old_blank not in s:
    raise SystemExit('blankPlan anchor not found')
s = s.replace(old_blank, new_blank, 1)

# Replace current PlanEditor function wholesale.
start = s.index('function PlanEditor(')
end = s.index('function ItemEditor(', start)
new_editor = r'''function PlanEditor({ lesson, readOnly, onClose, onSave, classProfile }: { lesson: Lesson; readOnly: boolean; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile }) {
  const [plan, setPlan] = useState<LessonPlan>({ ...blankPlan(), ...lesson.plan, planningMode: lesson.plan?.planningMode || "simple" });
  const inferred = classProfile || inferClassCurriculumProfile(lesson.className, lesson.subject);
  const [stage, setStage] = useState<ClassCurriculumProfile["stage"]>((phase1Stages.includes(plan.curriculumStage as ClassCurriculumProfile["stage"]) ? plan.curriculumStage : inferred.stage) as ClassCurriculumProfile["stage"]);
  const initialBoard = (plan.examBoard || inferred.examBoard) as ClassCurriculumProfile["examBoard"];
  const [examBoard, setExamBoard] = useState<ClassCurriculumProfile["examBoard"]>(initialBoard);
  const initialSubject = (plan.curriculumSubject || inferred.subject) as ClassCurriculumProfile["subject"];
  const [subject, setSubject] = useState<ClassCurriculumProfile["subject"]>(initialSubject);
  const initialCourses = getPhase1Courses(stage, initialBoard, initialSubject);
  const [courseId, setCourseId] = useState(plan.courseId || inferred.courseId || initialCourses[0]?.id || "");
  const initialUnits = getPhase1Units(plan.courseId || inferred.courseId || initialCourses[0]?.id || "");
  const initialUnit = initialUnits.find((item) => item.title === plan.curriculumUnit) || initialUnits[0];
  const [unitId, setUnitId] = useState(initialUnit?.id || "");
  const initialSubtopics = getPhase1Subtopics(plan.courseId || inferred.courseId || initialCourses[0]?.id || "", initialUnit?.id || "");
  const initialSubtopic = initialSubtopics.find((item) => item.title === plan.curriculumSubtopic) || initialSubtopics[0];
  const [subtopicId, setSubtopicId] = useState(initialSubtopic?.id || "");
  const [lessonIndex, setLessonIndex] = useState(Math.max(0, plan.sequencePosition || 0));

  const boards = getPhase1ExamBoards(stage);
  const subjects = getPhase1Subjects(stage, examBoard);
  const courses = getPhase1Courses(stage, examBoard, subject);
  const units = getPhase1Units(courseId);
  const subtopics = getPhase1Subtopics(courseId, unitId);
  const lessons = getPhase1Lessons(courseId, unitId, subtopicId);
  const selectedCourse = getPhase1Course(courseId);
  const selectedUnit = units.find((item) => item.id === unitId);
  const selectedSubtopic = subtopics.find((item) => item.id === subtopicId);
  const selectedTemplate = lessons[Math.min(lessonIndex, Math.max(lessons.length - 1, 0))];
  const detailedKeys: (keyof LessonPlan)[] = ["priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","reflection"];
  const detailedComplete = detailedKeys.filter((key) => String(plan[key] || "").trim()).length;

  const field = (key: keyof LessonPlan, label: string, multiline = false, placeholder = "", className = "") => <label className={`${multiline ? "wide" : ""} ${className}`.trim()}><span>{label}</span>{multiline ? <textarea disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /> : <input disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />}</label>;

  function resetFor(nextStage: ClassCurriculumProfile["stage"], nextBoard: ClassCurriculumProfile["examBoard"], nextSubject: ClassCurriculumProfile["subject"]) {
    setStage(nextStage); setExamBoard(nextBoard); setSubject(nextSubject); const nextCourse = getPhase1Courses(nextStage, nextBoard, nextSubject)[0]; setCourseId(nextCourse?.id || ""); const nextUnit = nextCourse?.units[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0);
  }
  function changeStage(next: ClassCurriculumProfile["stage"]) { const board = getPhase1ExamBoards(next)[0]; resetFor(next, board, getPhase1Subjects(next, board)[0] || "Science"); }
  function changeBoard(next: ClassCurriculumProfile["examBoard"]) { resetFor(stage, next, getPhase1Subjects(stage, next)[0] || subject); }
  function changeSubject(next: ClassCurriculumProfile["subject"]) { resetFor(stage, examBoard, next); }
  function changeCourse(next: string) { setCourseId(next); const nextUnit = getPhase1Units(next)[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0); }
  function changeUnit(next: string) { setUnitId(next); setSubtopicId(getPhase1Subtopics(courseId, next)[0]?.id || ""); setLessonIndex(0); }
  function changeSubtopic(next: string) { setSubtopicId(next); setLessonIndex(0); }

  function detailedDefaults(topic: string, objectives: string, vocabulary: string) {
    const focus = topic || "the lesson focus";
    return {
      priorKnowledge: `Identify the prerequisite knowledge pupils need before ${focus}. Link back to the most relevant previous learning.`,
      retrieval: `3–5 short retrieval questions on prerequisite knowledge for ${focus}. Include one question that checks a likely prerequisite misconception.`,
      misconceptions: `Anticipate the most likely misconceptions about ${focus}. Plan one check that exposes each misconception before independent practice.`,
      teacherExplanation: objectives ? `Explicitly explain and chunk the core knowledge needed to meet: ${objectives}` : `Explicitly explain and chunk the core knowledge for ${focus}.`,
      modelling: `Model one high-quality example for ${focus}. Think aloud, make decisions visible and annotate the success criteria.`,
      guidedPractice: `Complete a scaffolded example together. Use targeted questioning, then gradually remove prompts as pupils become more secure.`,
      independentPractice: `Pupils apply ${focus} independently. Start with a core task, then increase challenge while checking for accuracy and understanding.`,
      sendEalAdaptations: `Reduce unnecessary language/cognitive load without reducing the core learning: chunk instructions, pre-teach key vocabulary${vocabulary ? ` (${vocabulary})` : ""}, provide a model/visual, allow processing time and check understanding discreetly.`,
      stretchChallenge: `Require deeper explanation, justification, comparison or transfer of ${focus} to an unfamiliar context rather than simply adding more work.`,
      homeworkTask: `Set a short task that consolidates ${focus} and includes retrieval from earlier learning.`,
      exitTicket: `Use 2–3 questions that directly test the lesson objectives for ${focus}, including one item that reveals the key misconception.`,
    };
  }

  function buildDetailedStructure() {
    const defaults = detailedDefaults(plan.topic || selectedTemplate?.title || "", plan.objectives || selectedTemplate?.objectives || "", plan.vocabulary || selectedTemplate?.vocabulary || "");
    setPlan((current) => ({
      ...current,
      planningMode: "detailed",
      priorKnowledge: current.priorKnowledge || defaults.priorKnowledge,
      retrieval: current.retrieval || defaults.retrieval,
      misconceptions: current.misconceptions || defaults.misconceptions,
      teacherExplanation: current.teacherExplanation || defaults.teacherExplanation,
      modelling: current.modelling || defaults.modelling,
      guidedPractice: current.guidedPractice || defaults.guidedPractice,
      independentPractice: current.independentPractice || defaults.independentPractice,
      sendEalAdaptations: current.sendEalAdaptations || defaults.sendEalAdaptations,
      stretchChallenge: current.stretchChallenge || defaults.stretchChallenge,
      homeworkTask: current.homeworkTask || defaults.homeworkTask,
      exitTicket: current.exitTicket || defaults.exitTicket,
    }));
  }

  function applySuggestedLesson() {
    if (!selectedTemplate || !selectedCourse || !selectedUnit || !selectedSubtopic) return;
    const courseSequence = getCourseLessonSequence({ stage, examBoard, subject, courseId });
    const sequencePosition = courseSequence.findIndex((item) => item.unitId === unitId && item.subtopicId === subtopicId && item.title === selectedTemplate.title);
    setPlan((current) => ({ ...current, curriculumStage: stage, curriculumSubject: subject, curriculumUnit: selectedUnit.title, curriculumSubtopic: selectedSubtopic.title, examBoard, courseId, sequencePosition, topic: selectedTemplate.title, vocabulary: selectedTemplate.vocabulary, objectives: selectedTemplate.objectives, sequence: selectedTemplate.sequence, assessment: selectedTemplate.assessment }));
  }

  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal ttPlanModal ttPhase3PlanModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">LESSON PLANNING · PHASE 3</span><h2>{lesson.subject} · {lesson.className}</h2><p>{lesson.week} · {lesson.day} · P{lesson.period} · {lesson.room}</p></div><button className="ttIconButton" onClick={onClose}>×</button></div>
    <div className="ttPlanModeBar"><div className="ttPlanModeSwitch"><button type="button" className={plan.planningMode === "simple" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "simple" }))}>Simple</button><button type="button" className={plan.planningMode === "detailed" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "detailed" }))}>Detailed</button></div><div className="ttPlanCompletion"><span>Detailed plan</span><b>{detailedComplete}/{detailedKeys.length}</b><i><em style={{ width: `${Math.round(detailedComplete / detailedKeys.length * 100)}%` }} /></i></div>{!readOnly && <button type="button" className="ttButton" onClick={buildDetailedStructure}>Build detailed structure</button>}</div>
    <section className="ttCurriculumPicker"><div className="ttCurriculumPickerHead"><div><strong>Curriculum lesson bank</strong><span>{classProfile ? `Class profile: ${profileLabel(classProfile)}. ` : ""}Choose the unit, sub-topic and lesson to pre-fill this plan.</span></div>{selectedTemplate && !readOnly && <button className="ttButton primary" onClick={applySuggestedLesson}>Use suggested lesson</button>}</div><div className="ttPhase1PickerGrid">
      <label><span>Key Stage</span><select disabled={readOnly} value={stage} onChange={(event) => changeStage(event.target.value as ClassCurriculumProfile["stage"])}>{phase1Stages.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Exam board</span><select disabled={readOnly} value={examBoard} onChange={(event) => changeBoard(event.target.value as ClassCurriculumProfile["examBoard"])}>{boards.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Subject</span><select disabled={readOnly} value={subject} onChange={(event) => changeSubject(event.target.value as ClassCurriculumProfile["subject"])}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Course</span><select disabled={readOnly} value={courseId} onChange={(event) => changeCourse(event.target.value)}>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}{item.code && item.code !== "KS3" ? ` · ${item.code}` : ""}</option>)}</select></label>
      <label><span>Unit</span><select disabled={readOnly} value={unitId} onChange={(event) => changeUnit(event.target.value)}>{units.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label><span>Sub-topic</span><select disabled={readOnly} value={subtopicId} onChange={(event) => changeSubtopic(event.target.value)}>{subtopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="wide"><span>Lesson sequence</span><select disabled={readOnly || !lessons.length} value={Math.min(lessonIndex, Math.max(lessons.length - 1, 0))} onChange={(event) => setLessonIndex(Number(event.target.value))}>{lessons.length ? lessons.map((item, index) => <option key={`${item.id}-${index}`} value={index}>{index + 1}. {item.title}</option>) : <option value={0}>No lessons in this selection</option>}</select></label>
    </div>{selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}</section>
    <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>1</span><div><h3>Core lesson</h3><p>The essentials shown in both planning modes.</p></div></div><div className="ttFormGrid"><label><span>Lesson date</span><input type="date" disabled={readOnly} value={plan.lessonDate} onChange={(event) => setPlan((current) => ({ ...current, lessonDate: event.target.value }))} /></label>{field("topic","Topic / lesson title")}{field("objectives","Learning objectives",true,"What should pupils know, understand or be able to do?")}{field("vocabulary","Key vocabulary",true,"Subject-specific language pupils need to understand and use")}{field("sequence","Lesson content / sequence",true,"Starter → explanation/model → practice → review")}{field("assessment","Checks for understanding",true,"Hinge questions, cold call, mini-whiteboards, exam question, exit ticket…")}{field("resources","Resources / links",true,"Slides, worksheet, textbook pages, equipment, links…")}{field("teacherNotes","Teacher notes",true,"Reminders, class-specific logistics or follow-up")}</div></section>
    {plan.planningMode === "detailed" && <div className="ttDetailedPlan">
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>2</span><div><h3>Connect to prior learning</h3><p>Make prerequisites and retrieval explicit before new learning.</p></div></div><div className="ttFormGrid">{field("priorKnowledge","Prior knowledge",true,"What must pupils already know or be able to do?")}{field("retrieval","Retrieval starter",true,"3–5 short questions or prompts")}{field("misconceptions","Likely misconceptions",true,"What wrong ideas or errors are most likely, and how will you expose them?")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>3</span><div><h3>Teach and model</h3><p>Plan the explanation and make expert thinking visible.</p></div></div><div className="ttFormGrid">{field("teacherExplanation","Teacher explanation",true,"Chunk the new knowledge and identify the key explanation points")}{field("modelling","Worked example / modelling",true,"What will you model and what thinking will you narrate?")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>4</span><div><h3>Practise and check</h3><p>Move from supported practice toward independent application.</p></div></div><div className="ttFormGrid">{field("guidedPractice","Guided practice",true,"Scaffolded examples, questioning and supported rehearsal")}{field("independentPractice","Independent practice",true,"What will pupils do independently to secure the learning?")}{field("exitTicket","Exit ticket",true,"2–3 final questions directly aligned to the objectives")}</div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>5</span><div><h3>Access and challenge</h3><p>Support access to the same core learning and plan purposeful stretch.</p></div></div><div className="ttFormGrid">{field("sendEalAdaptations","SEND / EAL adaptations",true,"Chunking, visuals, vocabulary, modelling, processing time, accessible task design…")}{field("stretchChallenge","Stretch / challenge",true,"Deeper explanation, evaluation, transfer or unfamiliar application")}</div><div className="ttInclusionNote"><b>Keep this lesson-focused.</b><span>Use approved school systems for individual pupil plans, medical information or sensitive records.</span></div></section>
      <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>6</span><div><h3>Consolidate and reflect</h3><p>Close the learning loop without creating unnecessary planning workload.</p></div></div><div className="ttFormGrid">{field("homeworkTask","Homework / consolidation",true,"A short consolidation or retrieval task linked to this lesson")}{field("reflection","Teacher reflection",true,"What worked? What needs revisiting? What should change next time?")}</div></section>
    </div>}
    <div className="ttModalActions ttStickyPlanActions"><button className="ttButton" onClick={onClose}>Close</button>{!readOnly && <button className="ttButton primary" onClick={() => onSave(plan)}>Save lesson plan</button>}</div></section></div>;
}

'''
s = s[:start] + new_editor + s[end:]

# Make medium-term -> lesson-plan transfer retain any new fields by merging into blank plan (existing code already spreads current plan).
# Add richer chips to planning cards if not already present.
old_chip = '''<div className="ttChipRow">{lesson.plan.curriculumStage && <span>{lesson.plan.curriculumStage}</span>}{lesson.plan.curriculumUnit && <span>{lesson.plan.curriculumUnit}</span>}{lesson.plan.lessonDate && <span>{formatDate(lesson.plan.lessonDate)}</span>}</div>'''
new_chip = '''<div className="ttChipRow">{lesson.plan.curriculumStage && <span>{lesson.plan.curriculumStage}</span>}{lesson.plan.curriculumUnit && <span>{lesson.plan.curriculumUnit}</span>}{lesson.plan.lessonDate && <span>{formatDate(lesson.plan.lessonDate)}</span>}{lesson.plan.planningMode === "detailed" && <span>Detailed</span>}{lesson.plan.exitTicket && <span>Exit ticket ready</span>}</div>'''
if old_chip in s:
    s = s.replace(old_chip, new_chip, 1)

p.write_text(s)

css = Path('app/components/StaffTimetableHub.css')
c = css.read_text()
if '.ttPlanModeBar{' not in c:
    c += '''\n/* Phase 3 enhanced lesson planning */\n.ttPhase3PlanModal{width:min(1040px,100%);max-height:94vh}.ttPlanModeBar{position:sticky;top:-18px;z-index:5;display:grid;grid-template-columns:auto minmax(180px,1fr) auto;gap:14px;align-items:center;margin:-2px 0 14px;padding:12px;border:1px solid #e0e6ef;border-radius:14px;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);box-shadow:0 8px 20px rgba(31,45,72,.05)}.ttPlanModeSwitch{display:flex;padding:3px;border-radius:10px;background:#edf1f7}.ttPlanModeSwitch button{border:0;border-radius:8px;background:transparent;color:#66748a;padding:8px 13px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}.ttPlanModeSwitch button.active{background:#fff;color:#2949b8;box-shadow:0 2px 7px rgba(31,45,72,.12)}.ttPlanCompletion{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:7px;min-width:0;color:#708097;font-size:10px;font-weight:800}.ttPlanCompletion b{color:#30405a}.ttPlanCompletion i{display:block;overflow:hidden;height:5px;border-radius:999px;background:#e5eaf2}.ttPlanCompletion em{display:block;height:100%;border-radius:inherit;background:#5873da}.ttPlanSection{margin-top:14px;padding:16px;border:1px solid #e0e6ef;border-radius:15px;background:#fff}.ttPlanSectionHead{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}.ttPlanSectionHead>span{flex:0 0 26px;height:26px;display:grid;place-items:center;border-radius:8px;background:#eaf0ff;color:#3653bf;font-size:10px;font-weight:900}.ttPlanSectionHead h3{margin:1px 0 2px;font-size:14px;color:#293a57}.ttPlanSectionHead p{margin:0;color:#7a8799;font-size:10px}.ttDetailedPlan{display:grid;gap:0}.ttDetailedPlan .ttFormGrid textarea{min-height:92px}.ttInclusionNote{display:flex;gap:7px;align-items:flex-start;margin-top:11px;padding:10px;border-radius:10px;background:#f7f9fc;color:#69778b;font-size:10px;line-height:1.45}.ttInclusionNote b{color:#3b4b64;white-space:nowrap}.ttStickyPlanActions{position:sticky;bottom:-18px;z-index:6;margin-top:16px;padding:12px 0 2px;background:linear-gradient(180deg,rgba(255,255,255,0),#fff 32%)}@media(max-width:760px){.ttPlanModeBar{grid-template-columns:1fr;top:-12px}.ttPlanModeSwitch{width:100%}.ttPlanModeSwitch button{flex:1}.ttPlanCompletion{grid-template-columns:auto auto 1fr}.ttPhase3PlanModal{max-height:96vh}.ttInclusionNote{display:grid}.ttInclusionNote b{white-space:normal}}\n'''
    css.write_text(c)
