from pathlib import Path

path = Path("app/components/StaffTimetableHub.tsx")
s = path.read_text()

if 'StaffTimetableAssessments' in s and 'StaffTimetableLessonHomework' in s and 'assessments: CurriculumAssessment[]' in s:
    print('Phases 7-8 already integrated')
    raise SystemExit(0)

def replace_once(old: str, new: str, label: str):
    global s
    count = s.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    s = s.replace(old, new, 1)

replace_once(
    'import StaffTimetableProgress from "./StaffTimetableProgress";\nimport "./StaffTimetableHub.css";',
    'import StaffTimetableProgress from "./StaffTimetableProgress";\nimport StaffTimetableAssessments, { type AssessmentFollowUpAction, type CurriculumAssessment, type CurriculumAssessmentTopicResult } from "./StaffTimetableAssessments";\nimport StaffTimetableLessonHomework, { type LessonLinkedHomework } from "./StaffTimetableLessonHomework";\nimport "./StaffTimetableHub.css";',
    'phase imports',
)

replace_once(
    'type WorkspaceTab = "today" | "timetable" | "planning" | "mediumterm" | "classes" | "progress" | "homework" | "workload" | "changes" | "tools";',
    'type WorkspaceTab = "today" | "timetable" | "planning" | "mediumterm" | "classes" | "progress" | "assessments" | "homework" | "workload" | "changes" | "tools";',
    'workspace tab type',
)

homework_block = '''type Homework = {
  id: string;
  className: string;
  subject: string;
  title: string;
  setDate: string;
  dueDate: string;
  status: "To set" | "Set" | "Collected" | "Marked" | "Returned";
  priority: "Normal" | "High";
  notes: string;
};'''
replace_once(homework_block, 'type Homework = LessonLinkedHomework;', 'homework type')

replace_once(
    '  planningBlocks: PlanningBlock[];\n};',
    '  planningBlocks: PlanningBlock[];\n  assessments: CurriculumAssessment[];\n};',
    'workspace assessments field',
)

replace_once(
    'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [] };',
    'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [], assessments: [] };',
    'blank workspace',
)

replace_once(
    'function dateOffsetIso(days: number) {\n  const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}',
    'function dateOffsetIso(days: number) {\n  const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\nfunction shiftIsoDate(value: string, days: number) {\n  if (!value || !days) return value;\n  const date = new Date(`${value}T12:00:00`);\n  if (Number.isNaN(date.getTime())) return value;\n  date.setDate(date.getDate() + days);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\nfunction dateDeltaDays(from: string, to: string) {\n  if (!from || !to || from === to) return 0;\n  const a = new Date(`${from}T12:00:00`).getTime(); const b = new Date(`${to}T12:00:00`).getTime();\n  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;\n  return Math.round((b - a) / 86400000);\n}',
    'date shift helpers',
)

replace_once(
    '  const openTasks = active.tasks.filter((item) => item.status !== "Done");',
    '  const openTasks = active.tasks.filter((item) => item.status !== "Done");\n  const followUpHomework = active.homework.filter((item) => item.followUp && item.followUp !== "None" && item.status !== "Returned");',
    'homework followup metric',
)

old_save_plan = '''  function savePlan(nextPlan: LessonPlan) {
    if (!planLessonId) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === planLessonId ? { ...lesson, plan: nextPlan } : lesson) }));
    setPlanLessonId(null);
  }'''
new_save_plan = '''  function savePlan(nextPlan: LessonPlan) {
    if (!planLessonId) return;
    mutate((current) => {
      const previous = current.lessons.find((lesson) => lesson.id === planLessonId);
      const dayShift = dateDeltaDays(previous?.plan.lessonDate || "", nextPlan.lessonDate || "");
      const homework = dayShift ? current.homework.map((item) => item.sourceLessonId === planLessonId && item.autoMoveWithLesson ? { ...item, setDate: shiftIsoDate(item.setDate, dayShift), dueDate: shiftIsoDate(item.dueDate, dayShift), sourceLessonDate: nextPlan.lessonDate } : item) : current.homework;
      return { ...current, homework, lessons: current.lessons.map((lesson) => lesson.id === planLessonId ? { ...lesson, plan: nextPlan } : lesson) };
    });
    setPlanLessonId(null);
  }
  function assessmentFollowUp(action: AssessmentFollowUpAction, assessment: CurriculumAssessment, topic: CurriculumAssessmentTopicResult) {
    if (demo) return;
    if (action === "homework") {
      const homework: Homework = { id: makeId("assessment_hw"), className: assessment.className, subject: assessment.subject, title: `Assessment follow-up: ${topic.title}`, setDate: today, dueDate: dateOffsetIso(7), status: "To set", priority: "Normal", notes: `Created from ${assessment.title}. Class topic score: ${topic.scorePercent ?? "—"}% (threshold ${assessment.thresholdPercent}%).`, sourceAssessmentId: assessment.id, sourceTopic: topic.title, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle, completionPercent: 0, followUp: "None" };
      mutate((current) => ({ ...current, homework: [...current.homework, homework] })); setTab("homework"); setStatus(`Created homework for ${assessment.className}: ${topic.title}.`); return;
    }
    if (action === "intervention") {
      const task: TeacherTask = { id: makeId("assessment_intervention"), title: `Intervention follow-up: ${assessment.className} · ${topic.title}`, type: "Planning", status: "To do", date: today, period: "", notes: `Class-level assessment flag from ${assessment.title}: ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold. Use the intervention area for individual pupil records.` };
      mutate((current) => ({ ...current, tasks: [...current.tasks, task] })); setTab("workload"); setStatus(`Added intervention follow-up task for ${topic.title}.`); return;
    }
    const candidates = workspace.lessons.filter((lesson) => lesson.className === assessment.className);
    const target = candidates.find((lesson) => !lesson.plan.topic) || null;
    if (!target) {
      const label = action === "reteach" ? "reteach" : action === "retrieval" ? "retrieval" : "revision";
      const task: TeacherTask = { id: makeId("assessment_plan"), title: `Plan ${label}: ${assessment.className} · ${topic.title}`, type: "Planning", status: "To do", date: today, period: "", notes: `No blank timetable lesson was available. Assessment: ${assessment.title}; score ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold.` };
      mutate((current) => ({ ...current, tasks: [...current.tasks, task] })); setTab("workload"); setStatus(`No blank ${assessment.className} lesson was available, so a planning task was added.`); return;
    }
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => {
      if (lesson.id !== target.id) return lesson;
      if (action === "retrieval") return { ...lesson, plan: { ...lesson.plan, retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\\n\\n` : ""}Assessment-responsive retrieval: write 4–6 short questions revisiting ${topic.title}, including one misconception check and one application question.`, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle } };
      const prefix = action === "reteach" ? "Reteach" : "Revision";
      return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: `${prefix}: ${topic.title}`, courseId: assessment.courseId, sequencePosition: topic.sequencePosition, curriculumUnit: topic.unitTitle, curriculumSubtopic: topic.subtopicTitle, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}Assessment response from ${assessment.title}: ${topic.scorePercent ?? "—"}% against ${assessment.thresholdPercent}% threshold.`, retrieval: lesson.plan.retrieval || `Retrieve prerequisite knowledge for ${topic.title} before ${prefix.toLowerCase()}ing.`, homeworkTask: lesson.plan.homeworkTask || `Consolidate ${topic.title} after the responsive lesson.` } };
    }) }));
    setPlanLessonId(target.id); setTab("planning"); setStatus(`Prepared a ${action} response for ${assessment.className}: ${topic.title}.`);
  }'''
replace_once(old_save_plan, new_save_plan, 'save plan and assessment actions')

replace_once(
    '["today","timetable","planning","mediumterm","classes","progress","homework","workload","changes","tools"] as WorkspaceTab[]',
    '["today","timetable","planning","mediumterm","classes","progress","assessments","homework","workload","changes","tools"] as WorkspaceTab[]',
    'nav order',
)
replace_once(
    'classes:"Classes",progress:"Progress",homework:"Homework",workload:"Prep & tasks"',
    'classes:"Classes",progress:"Progress",assessments:"Assessments",homework:"Homework",workload:"Prep & tasks"',
    'nav labels',
)

assessment_render = '''      {tab === "assessments" && <StaffTimetableAssessments
        lessons={active.lessons}
        profiles={active.classCurriculumProfiles}
        assessments={active.assessments}
        today={today}
        readOnly={demo}
        onChange={(assessments) => mutate((current) => ({ ...current, assessments }))}
        onFollowUp={assessmentFollowUp}
      />}\n\n'''
replace_once('      {tab === "homework" && <section', assessment_render + '      {tab === "homework" && <section', 'assessment tab render')

replace_once(
    '{activePlanLesson && <PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} readOnly={demo} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}',
    '{activePlanLesson && <PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} homework={active.homework} readOnly={demo} onHomeworkChange={(homework) => mutate((current) => ({ ...current, homework }))} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}',
    'plan editor call',
)

replace_once(
    'function PlanEditor({ lesson, readOnly, onClose, onSave, classProfile }: { lesson: Lesson; readOnly: boolean; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile }) {',
    'function PlanEditor({ lesson, homework, readOnly, onHomeworkChange, onClose, onSave, classProfile }: { lesson: Lesson; homework: Homework[]; readOnly: boolean; onHomeworkChange: (homework: Homework[]) => void; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile }) {',
    'plan editor props',
)

homework_widget = '''    <StaffTimetableLessonHomework
      lesson={{ id: lesson.id, className: lesson.className, subject: lesson.subject, lessonDate: plan.lessonDate, topic: plan.topic || selectedTemplate?.title || "", homeworkTask: plan.homeworkTask, courseId: plan.courseId || courseId, sequencePosition: plan.sequencePosition, curriculumUnit: plan.curriculumUnit || selectedUnit?.title || "", curriculumSubtopic: plan.curriculumSubtopic || selectedSubtopic?.title || "" }}
      homework={homework}
      readOnly={readOnly}
      onChange={onHomeworkChange}
    />
'''
replace_once('    <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>1</span>', homework_widget + '    <section className="ttPlanSection"><div className="ttPlanSectionHead"><span>1</span>', 'lesson homework widget')

replace_once(
    '<span className="staffTimetableEyebrow">LESSON PLANNING · PHASES 4–5</span>',
    '<span className="staffTimetableEyebrow">LESSON PLANNING · PHASES 4–5 & 8</span>',
    'plan phase label',
)

old_homework_row = '''<button key={item.id} className={`ttDataRow ${item.dueDate < today && isOpenHomework(item) ? "urgent" : ""}`} onClick={() => !demo && setItemEditor({ kind: "homework", id: item.id })}><div><b>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</b><small>{item.status}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.subject}{item.priority === "High" ? " · High priority" : ""}</span></div><span className="ttRowAction">{demo ? "Demo" : "Edit"}</span></button>'''
new_homework_row = '''<button key={item.id} className={`ttDataRow ${item.dueDate < today && isOpenHomework(item) ? "urgent" : ""}`} onClick={() => { if (demo) return; if (item.sourceLessonId) { setPlanLessonId(item.sourceLessonId); setTab("planning"); } else setItemEditor({ kind: "homework", id: item.id }); }}><div><b>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</b><small>{item.status}{typeof item.completionPercent === "number" ? ` · ${item.completionPercent}% complete` : ""}</small></div><div><strong>{item.title}</strong><span>{item.className} · {item.subject}{item.sourceTopic ? ` · ${item.sourceTopic}` : ""}{item.followUp && item.followUp !== "None" ? ` · Follow-up: ${item.followUp}` : ""}{item.priority === "High" ? " · High priority" : ""}</span></div><span className="ttRowAction">{demo ? "Demo" : item.sourceLessonId ? "Open lesson" : "Edit"}</span></button>'''
replace_once(old_homework_row, new_homework_row, 'homework row')

replace_once(
    '<div><small>Open tasks</small><strong>{openTasks.length}</strong></div><div><small>Next free slot</small>',
    '<div><small>Open tasks</small><strong>{openTasks.length}</strong></div><div><small>Homework follow-up</small><strong>{followUpHomework.length}</strong></div><div><small>Next free slot</small>',
    'workload homework metric',
)

replace_once(
    'JSON.stringify({ version: 5, week, workspace }, null, 2)',
    'JSON.stringify({ version: 8, week, workspace }, null, 2)',
    'backup version',
)

path.write_text(s)
print('Integrated timetable phases 7 and 8')
