from pathlib import Path

curriculum = Path("app/components/staffTimetableCurriculumPhase1.ts")
c = curriculum.read_text()
c = c.replace(
    'const ks3Science = course("ks3-science", "KS3", "National curriculum", "Science", "KS3", "KS3 Science", undefined, [] as never);',
    'const ks3Science = course("ks3-science", "KS3", "National curriculum", "Science", "KS3 Science", "KS3", []);',
)
curriculum.write_text(c)

p = Path("app/components/StaffTimetableHub.tsx")
s = p.read_text()

old_import = '''import {
  curriculumStages,
  getCurriculumLessons,
  getCurriculumSubjects,
  getCurriculumUnit,
  getCurriculumUnits,
  inferCurriculumStage,
  normaliseCurriculumSubject,
} from "./staffTimetableCurriculum";
'''
new_import = '''import {
  ClassCurriculumProfile,
  getCourseLessonSequence,
  getNextSuggestedLesson,
  getPhase1Course,
  getPhase1Courses,
  getPhase1ExamBoards,
  getPhase1Lessons,
  getPhase1Subjects,
  getPhase1Subtopics,
  getPhase1Units,
  inferClassCurriculumProfile,
  phase1Stages,
  profileLabel,
} from "./staffTimetableCurriculumPhase1";
'''
if old_import not in s:
    raise SystemExit("Old curriculum import block not found")
s = s.replace(old_import, new_import, 1)

s = s.replace(
    '''  curriculumStage: string;
  curriculumSubject: string;
  curriculumUnit: string;
  sequencePosition: number;
};''',
    '''  curriculumStage: string;
  curriculumSubject: string;
  curriculumUnit: string;
  curriculumSubtopic: string;
  examBoard: string;
  courseId: string;
  sequencePosition: number;
};''',
    1,
)
s = s.replace(
    '''  curriculumSequences: Record<string, string[]>;
};''',
    '''  curriculumSequences: Record<string, string[]>;
  classCurriculumProfiles: Record<string, ClassCurriculumProfile>;
};''',
    1,
)
s = s.replace(
    'return { lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", teacherNotes: "", curriculumStage: "", curriculumSubject: "", curriculumUnit: "", sequencePosition: -1 };',
    'return { lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", teacherNotes: "", curriculumStage: "", curriculumSubject: "", curriculumUnit: "", curriculumSubtopic: "", examBoard: "", courseId: "", sequencePosition: -1 };',
    1,
)
s = s.replace(
    'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {} };',
    'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {} };',
    1,
)

demo_anchor = '  base.curriculumSequences["Y13 Physics"] = ["Nuclear instability", "Radioactive decay", "Half-life calculations", "Nuclear radius", "Binding energy", "Fission and chain reactions"];\n'
if demo_anchor in s and 'base.classCurriculumProfiles["Y13 Physics"]' not in s:
    s = s.replace(
        demo_anchor,
        demo_anchor + '  base.classCurriculumProfiles["Y13 Physics"] = { stage: "A level", examBoard: "AQA", subject: "Physics", courseId: "aqa-alevel-physics-7408" };\n',
        1,
    )

selected_anchor = '  const selectedClassLessons = active.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);\n'
if selected_anchor not in s:
    raise SystemExit("Selected class anchor not found")
s = s.replace(
    selected_anchor,
    selected_anchor
    + '''  const inferredClassProfile = inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
  const currentClassProfile = active.classCurriculumProfiles[visibleClass] || inferredClassProfile;
  const profileBoards = getPhase1ExamBoards(currentClassProfile.stage);
  const profileSubjects = getPhase1Subjects(currentClassProfile.stage, currentClassProfile.examBoard);
  const profileCourses = getPhase1Courses(currentClassProfile.stage, currentClassProfile.examBoard, currentClassProfile.subject);
  const selectedProfileCourse = getPhase1Course(currentClassProfile.courseId) || profileCourses[0];
  const nextProfileLesson = getNextSuggestedLesson(currentClassProfile, selectedClassLessons.map((lesson) => lesson.plan.topic));
''',
    1,
)

export_anchor = "  function exportBackup() {"
if export_anchor not in s:
    raise SystemExit("exportBackup anchor not found")
s = s.replace(
    export_anchor,
    '''  function saveClassProfile(patch: Partial<ClassCurriculumProfile>) {
    if (!visibleClass || demo) return;
    const existing = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    let next: ClassCurriculumProfile = { ...existing, ...patch };
    if (patch.stage) {
      next.examBoard = getPhase1ExamBoards(next.stage)[0];
      next.subject = getPhase1Subjects(next.stage, next.examBoard)[0] || next.subject;
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    } else if (patch.examBoard) {
      next.subject = getPhase1Subjects(next.stage, next.examBoard)[0] || next.subject;
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    } else if (patch.subject) {
      next.courseId = getPhase1Courses(next.stage, next.examBoard, next.subject)[0]?.id || "";
    }
    mutate((current) => ({ ...current, classCurriculumProfiles: { ...current.classCurriculumProfiles, [visibleClass]: next } }));
  }
  function autoPopulateCourseSequence() {
    if (!visibleClass || demo) return;
    const profile = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    const sequence = getCourseLessonSequence(profile);
    if (!sequence.length) return;
    const targets = workspace.lessons.filter((lesson) => lesson.className === visibleClass).sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => {
      const index = targets.findIndex((target) => target.id === lesson.id);
      if (index < 0 || index >= sequence.length || lesson.plan.topic) return lesson;
      const suggestion = sequence[index];
      return { ...lesson, plan: { ...lesson.plan, topic: suggestion.title, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, curriculumStage: suggestion.stage, curriculumSubject: suggestion.subject, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, examBoard: suggestion.examBoard, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition } };
    }) }));
    setStatus(`Filled blank ${visibleClass} lesson plans from ${getPhase1Course(profile.courseId)?.title || profile.subject}.`);
  }
'''
    + export_anchor,
    1,
)

class_start = s.index('      {tab === "classes" && <section className="ttWorkspace">')
class_end = s.index('      {tab === "homework" &&', class_start)
class_block = '''      {tab === "classes" && <section className="ttWorkspace"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">CLASS DASHBOARD · PHASE 1</span><h2>Classes & curriculum profile</h2><p className="ttMuted">Set each class once. The timetable then filters out irrelevant courses and suggests the next lesson from that specification.</p></div><div className="ttWorkspaceActions"><select className="ttSelect" value={visibleClass} onChange={(event) => { setClassSelection(event.target.value); setCurriculumText(active.curriculumSequences[event.target.value]?.join("\\n") || ""); }}>{classes.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        {!visibleClass ? <div className="ttBlankState"><h3>No classes yet</h3><p>Add or upload timetable lessons first.</p></div> : <div className="ttClassGrid"><article className="ttPanel"><div className="ttKpiGrid compact"><div><small>Lessons / cycle</small><strong>{selectedClassLessons.length}</strong></div><div><small>Open homework</small><strong>{active.homework.filter((item) => item.className === visibleClass && isOpenHomework(item)).length}</strong></div><div><small>Open prep</small><strong>{active.prep.filter((item) => item.className === visibleClass && item.status !== "Done").length}</strong></div><div><small>Planned lessons</small><strong>{selectedClassLessons.filter((item) => item.plan.topic).length}</strong></div></div><label className="ttField"><span>Class progress / next steps</span><textarea value={active.classNotes[visibleClass] || ""} disabled={demo} onChange={(event) => mutate((current) => ({ ...current, classNotes: { ...current.classNotes, [visibleClass]: event.target.value } }))} placeholder="Misconceptions, progress, follow-up or planning notes…" /></label><div className="ttStackList">{selectedClassLessons.map((lesson) => <button className="ttAgendaRow" key={lesson.id} onClick={() => { setPlanLessonId(lesson.id); setTab("planning"); }}><b>{lesson.week} · {lesson.day} · P{lesson.period}</b><span>{lesson.room || "Room not set"}</span><small>{lesson.plan.topic || "No lesson topic planned"}</small></button>)}</div></article>
          <article className="ttPanel ttCurriculumProfilePanel"><div className="ttPanelHeader"><div><h2>Curriculum profile</h2><p>Key Stage → exam board → subject → course. Once chosen, unrelated courses disappear from lesson planning.</p></div></div><div className="ttProfileSummary"><strong>{profileLabel(currentClassProfile)}</strong><span>{selectedProfileCourse ? `${selectedProfileCourse.units.length} units · ${getCourseLessonSequence(currentClassProfile).length} suggested lessons` : "Choose a course"}</span></div><div className="ttProfileGrid">
            <label><span>Key Stage</span><select disabled={demo} value={currentClassProfile.stage} onChange={(event) => saveClassProfile({ stage: event.target.value as ClassCurriculumProfile["stage"] })}>{phase1Stages.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Exam board</span><select disabled={demo} value={currentClassProfile.examBoard} onChange={(event) => saveClassProfile({ examBoard: event.target.value as ClassCurriculumProfile["examBoard"] })}>{profileBoards.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Subject</span><select disabled={demo} value={currentClassProfile.subject} onChange={(event) => saveClassProfile({ subject: event.target.value as ClassCurriculumProfile["subject"] })}>{profileSubjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Course / specification</span><select disabled={demo} value={currentClassProfile.courseId} onChange={(event) => saveClassProfile({ courseId: event.target.value })}>{profileCourses.map((item) => <option key={item.id} value={item.id}>{item.title}{item.code && item.code !== "KS3" ? ` · ${item.code}` : ""}</option>)}</select></label>
          </div>{nextProfileLesson ? <div className="ttNextLesson"><small>NEXT SUGGESTED LESSON</small><strong>{nextProfileLesson.title}</strong><span>{nextProfileLesson.unitTitle} · {nextProfileLesson.subtopicTitle}</span><button className="ttButton primary" disabled={demo} onClick={() => { const nextBlank = selectedClassLessons.find((item) => !item.plan.topic); if (nextBlank) { setPlanLessonId(nextBlank.id); setTab("planning"); } }}>Plan next lesson</button></div> : <div className="ttEmptyPreview"><strong>Sequence complete or not configured</strong><span>Choose the class course above or review already planned lessons.</span></div>}<div className="ttButtonRow"><button className="ttButton primary" disabled={demo || !selectedProfileCourse} onClick={autoPopulateCourseSequence}>Auto-fill blank lessons from course</button></div><details className="ttCustomSequence"><summary>Custom sequence override</summary><p>Use this only when your department teaches a different order.</p><textarea className="ttSequenceBox" value={curriculumText || active.curriculumSequences[visibleClass]?.join("\\n") || ""} disabled={demo} onChange={(event) => setCurriculumText(event.target.value)} placeholder={'Lesson 1\\nLesson 2\\nLesson 3'} /><div className="ttButtonRow"><button className="ttButton" disabled={demo} onClick={saveCurriculumSequence}>Save custom sequence</button><button className="ttButton" disabled={demo} onClick={autoPopulateSequence}>Use custom sequence</button></div></details><div className="ttIntegrationLinks"><Link href="/curriculum">Open full curriculum hub</Link><Link href="/teaching-learning">Teaching & Learning Hub</Link><Link href="/resource-generator">Create resources</Link></div></article></div>}
      </section>}

'''
s = s[:class_start] + class_block + s[class_end:]

plan_start = s.index("function PlanEditor(")
plan_end = s.index("function ItemEditor(", plan_start)
plan_editor = r'''function PlanEditor({ lesson, classProfile, readOnly, onClose, onSave }: { lesson: Lesson; classProfile?: ClassCurriculumProfile; readOnly: boolean; onClose: () => void; onSave: (plan: LessonPlan) => void }) {
  const [plan, setPlan] = useState<LessonPlan>({ ...blankPlan(), ...lesson.plan });
  const inferred = classProfile || inferClassCurriculumProfile(lesson.className, lesson.subject);
  const [stage, setStage] = useState<ClassCurriculumProfile["stage"]>(inferred.stage);
  const [examBoard, setExamBoard] = useState<ClassCurriculumProfile["examBoard"]>(inferred.examBoard);
  const [subject, setSubject] = useState<ClassCurriculumProfile["subject"]>(inferred.subject);
  const initialCourses = getPhase1Courses(inferred.stage, inferred.examBoard, inferred.subject);
  const [courseId, setCourseId] = useState(inferred.courseId || initialCourses[0]?.id || "");
  const initialUnits = getPhase1Units(inferred.courseId || initialCourses[0]?.id || "");
  const initialUnit = initialUnits.find((item) => item.title === plan.curriculumUnit) || initialUnits[0];
  const [unitId, setUnitId] = useState(initialUnit?.id || "");
  const initialSubtopics = getPhase1Subtopics(inferred.courseId || initialCourses[0]?.id || "", initialUnit?.id || "");
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

  const field = (key: keyof LessonPlan, label: string, multiline = false, placeholder = "") => <label className={multiline ? "wide" : ""}><span>{label}</span>{multiline ? <textarea disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /> : <input disabled={readOnly} value={String(plan[key] ?? "")} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />}</label>;

  function resetFor(nextStage: ClassCurriculumProfile["stage"], nextBoard: ClassCurriculumProfile["examBoard"], nextSubject: ClassCurriculumProfile["subject"]) {
    setStage(nextStage); setExamBoard(nextBoard); setSubject(nextSubject); const nextCourse = getPhase1Courses(nextStage, nextBoard, nextSubject)[0]; setCourseId(nextCourse?.id || ""); const nextUnit = nextCourse?.units[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0);
  }
  function changeStage(next: ClassCurriculumProfile["stage"]) { const board = getPhase1ExamBoards(next)[0]; resetFor(next, board, getPhase1Subjects(next, board)[0] || "Science"); }
  function changeBoard(next: ClassCurriculumProfile["examBoard"]) { resetFor(stage, next, getPhase1Subjects(stage, next)[0] || subject); }
  function changeSubject(next: ClassCurriculumProfile["subject"]) { resetFor(stage, examBoard, next); }
  function changeCourse(next: string) { setCourseId(next); const nextUnit = getPhase1Units(next)[0]; setUnitId(nextUnit?.id || ""); setSubtopicId(nextUnit?.subtopics[0]?.id || ""); setLessonIndex(0); }
  function changeUnit(next: string) { setUnitId(next); setSubtopicId(getPhase1Subtopics(courseId, next)[0]?.id || ""); setLessonIndex(0); }
  function changeSubtopic(next: string) { setSubtopicId(next); setLessonIndex(0); }
  function applySuggestedLesson() {
    if (!selectedTemplate || !selectedCourse || !selectedUnit || !selectedSubtopic) return;
    const courseSequence = getCourseLessonSequence({ stage, examBoard, subject, courseId });
    const sequencePosition = courseSequence.findIndex((item) => item.unitId === unitId && item.subtopicId === subtopicId && item.title === selectedTemplate.title);
    setPlan((current) => ({ ...current, curriculumStage: stage, curriculumSubject: subject, curriculumUnit: selectedUnit.title, curriculumSubtopic: selectedSubtopic.title, examBoard, courseId, sequencePosition, topic: selectedTemplate.title, vocabulary: selectedTemplate.vocabulary, objectives: selectedTemplate.objectives, sequence: selectedTemplate.sequence, assessment: selectedTemplate.assessment }));
  }

  return <div className="ttModalBackdrop noPrint" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ttModal ttPlanModal"><div className="ttModalHeader"><div><span className="staffTimetableEyebrow">LESSON PLANNING · PHASE 1</span><h2>{lesson.subject} · {lesson.className}</h2><p>{lesson.week} · {lesson.day} · P{lesson.period} · {lesson.room}</p></div><button className="ttIconButton" onClick={onClose}>×</button></div>
    <section className="ttCurriculumPicker"><div className="ttCurriculumPickerHead"><div><strong>Curriculum lesson bank</strong><span>{classProfile ? `Class profile: ${profileLabel(classProfile)}. ` : ""}Choose the unit, sub-topic and lesson to pre-fill this plan.</span></div>{selectedTemplate && !readOnly && <button className="ttButton primary" onClick={applySuggestedLesson}>Use suggested lesson</button>}</div><div className="ttPhase1PickerGrid">
      <label><span>Key Stage</span><select disabled={readOnly} value={stage} onChange={(event) => changeStage(event.target.value as ClassCurriculumProfile["stage"])}>{phase1Stages.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Exam board</span><select disabled={readOnly} value={examBoard} onChange={(event) => changeBoard(event.target.value as ClassCurriculumProfile["examBoard"])}>{boards.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Subject</span><select disabled={readOnly} value={subject} onChange={(event) => changeSubject(event.target.value as ClassCurriculumProfile["subject"])}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Course</span><select disabled={readOnly} value={courseId} onChange={(event) => changeCourse(event.target.value)}>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}{item.code && item.code !== "KS3" ? ` · ${item.code}` : ""}</option>)}</select></label>
      <label><span>Unit</span><select disabled={readOnly} value={unitId} onChange={(event) => changeUnit(event.target.value)}>{units.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label><span>Sub-topic</span><select disabled={readOnly} value={subtopicId} onChange={(event) => changeSubtopic(event.target.value)}>{subtopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="wide"><span>Lesson sequence</span><select disabled={readOnly || !lessons.length} value={Math.min(lessonIndex, Math.max(lessons.length - 1, 0))} onChange={(event) => setLessonIndex(Number(event.target.value))}>{lessons.length ? lessons.map((item, index) => <option key={`${item.id}-${index}`} value={index}>{index + 1}. {item.title}</option>) : <option value={0}>No lessons in this selection</option>}</select></label>
    </div>{selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}</section>
    <div className="ttFormGrid"><label><span>Lesson date</span><input type="date" disabled={readOnly} value={plan.lessonDate} onChange={(event) => setPlan((current) => ({ ...current, lessonDate: event.target.value }))} /></label>{field("topic","Topic / lesson title")}{field("curriculumStage","Curriculum stage")}{field("examBoard","Exam board")}{field("curriculumSubject","Curriculum subject")}{field("curriculumUnit","Curriculum unit")}{field("curriculumSubtopic","Curriculum sub-topic")}{field("vocabulary","Key vocabulary")}{field("objectives","Learning objectives",true)}{field("sequence","Lesson content / teaching sequence",true)}{field("resources","Resources / links",true)}{field("assessment","Assessment / checks for understanding",true)}{field("teacherNotes","Teacher notes",true)}</div><div className="ttModalActions"><button className="ttButton" onClick={onClose}>Close</button>{!readOnly && <button className="ttButton primary" onClick={() => onSave(plan)}>Save lesson plan</button>}</div></section></div>;
}

'''
s = s[:plan_start] + plan_editor + s[plan_end:]

old_call = '<PlanEditor lesson={activePlanLesson} readOnly={demo} onClose={() => setPlanLessonId(null)} onSave={savePlan} />'
new_call = '<PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} readOnly={demo} onClose={() => setPlanLessonId(null)} onSave={savePlan} />'
if old_call not in s:
    raise SystemExit("PlanEditor call not found")
s = s.replace(old_call, new_call, 1)

p.write_text(s)

css = Path("app/components/StaffTimetableHub.css")
styles = css.read_text()
if ".ttProfileGrid{" not in styles:
    styles += '''
.ttCurriculumProfilePanel{align-self:start}.ttProfileSummary{display:grid;gap:4px;padding:13px 14px;margin:0 0 13px;border-radius:12px;background:#f4f8ff;border:1px solid #dce7fa}.ttProfileSummary strong{font-size:13px;color:#263d68}.ttProfileSummary span{font-size:11px;color:#718097}.ttProfileGrid,.ttPhase1PickerGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ttProfileGrid label,.ttPhase1PickerGrid label{display:grid;gap:5px}.ttProfileGrid label>span,.ttPhase1PickerGrid label>span{font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.05em;color:#66748a}.ttProfileGrid select,.ttPhase1PickerGrid select{min-width:0;border:1px solid #d5dce7;border-radius:9px;background:#fff;color:#26344d;padding:9px 10px;font:inherit}.ttPhase1PickerGrid .wide{grid-column:1/-1}.ttNextLesson{display:grid;gap:5px;margin:14px 0;padding:14px;border:1px solid #cfe2ff;border-radius:12px;background:#f7fbff}.ttNextLesson small{font-size:9px;font-weight:900;letter-spacing:.08em;color:#4d6f9f}.ttNextLesson strong{font-size:14px;color:#21395f}.ttNextLesson span{font-size:11px;color:#6d7b90}.ttNextLesson .ttButton{margin-top:4px;justify-self:start}.ttCustomSequence{margin-top:14px;border-top:1px solid #e5e9f1;padding-top:12px}.ttCustomSequence summary{cursor:pointer;font-size:12px;font-weight:850;color:#40557a}.ttCustomSequence p{font-size:11px;color:#758197}@media(max-width:760px){.ttProfileGrid,.ttPhase1PickerGrid{grid-template-columns:1fr}.ttPhase1PickerGrid .wide{grid-column:auto}.ttNextLesson .ttButton{width:100%}}
'''
    css.write_text(styles)
