from pathlib import Path

path = Path("app/components/StaffTimetableHub.tsx")
s = path.read_text()

if 'StaffTimetableLessonResources' in s and 'StaffTimetableProgress' in s:
    print('Phases 5-6 already integrated')
    raise SystemExit(0)

def replace_once(old: str, new: str, label: str):
    global s
    count = s.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    s = s.replace(old, new, 1)

replace_once(
    'import "./StaffTimetableHub.css";\nimport "./StaffTimetableMediumTerm.css";',
    'import StaffTimetableLessonResources, { type TimetableAttachedResource } from "./StaffTimetableLessonResources";\nimport StaffTimetableProgress from "./StaffTimetableProgress";\nimport "./StaffTimetableHub.css";\nimport "./StaffTimetableMediumTerm.css";',
    'component imports',
)

replace_once(
    'type WorkspaceTab = "today" | "timetable" | "planning" | "mediumterm" | "classes" | "homework" | "workload" | "changes" | "tools";',
    'type WorkspaceTab = "today" | "timetable" | "planning" | "mediumterm" | "classes" | "progress" | "homework" | "workload" | "changes" | "tools";',
    'workspace tab type',
)

replace_once(
    '  reflection: string;\n};',
    '  reflection: string;\n  generatedResources: TimetableAttachedResource[];\n};',
    'lesson plan resource field',
)

replace_once(
    '    sendEalAdaptations: "", stretchChallenge: "", homeworkTask: "", exitTicket: "", reflection: "",\n',
    '    sendEalAdaptations: "", stretchChallenge: "", homeworkTask: "", exitTicket: "", reflection: "", generatedResources: [],\n',
    'blank plan resources',
)

replace_once(
    '["today","timetable","planning","mediumterm","classes","homework","workload","changes","tools"] as WorkspaceTab[]',
    '["today","timetable","planning","mediumterm","classes","progress","homework","workload","changes","tools"] as WorkspaceTab[]',
    'workspace nav order',
)

replace_once(
    'classes:"Classes",homework:"Homework",workload:"Prep & tasks"',
    'classes:"Classes",progress:"Progress",homework:"Homework",workload:"Prep & tasks"',
    'workspace nav labels',
)

progress_block = '''      {tab === "progress" && <StaffTimetableProgress
        lessons={active.lessons}
        profiles={active.classCurriculumProfiles}
        mediumTermPlans={active.mediumTermPlans}
        today={today}
        onOpenMediumTerm={(className) => { setClassSelection(className); setTab("mediumterm"); }}
      />}\n\n'''
replace_once(
    '      {tab === "homework" && <section',
    progress_block + '      {tab === "homework" && <section',
    'progress tab render',
)

resource_anchor = '    </div>{selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}</section>\n    <section className="ttPlanSection">'
resource_block = '''    </div>{selectedUnit?.note && <p className="ttCurriculumNote">{selectedUnit.note}</p>}</section>
    <StaffTimetableLessonResources
      context={{
        subject: lesson.subject || subject,
        className: lesson.className,
        stage,
        examBoard,
        course: selectedCourse?.title || courseId,
        unit: selectedUnit?.title || plan.curriculumUnit,
        subtopic: selectedSubtopic?.title || plan.curriculumSubtopic,
        topic: plan.topic || selectedTemplate?.title || "",
        objectives: plan.objectives || selectedTemplate?.objectives || "",
        vocabulary: plan.vocabulary || selectedTemplate?.vocabulary || "",
        sequence: plan.sequence || selectedTemplate?.sequence || "",
        assessment: plan.assessment || selectedTemplate?.assessment || "",
        retrieval: plan.retrieval,
        misconceptions: plan.misconceptions,
        examPractice: plan.examPractice,
      }}
      resources={plan.generatedResources || []}
      readOnly={readOnly}
      onChange={(generatedResources) => setPlan((current) => ({ ...current, generatedResources }))}
    />
    <section className="ttPlanSection">'''
replace_once(resource_anchor, resource_block, 'resource pack render')

replace_once(
    '<span className="staffTimetableEyebrow">LESSON PLANNING · PHASE 4</span>',
    '<span className="staffTimetableEyebrow">LESSON PLANNING · PHASES 4–5</span>',
    'lesson planner phase label',
)

replace_once(
    'JSON.stringify({ version: 3, week, workspace }, null, 2)',
    'JSON.stringify({ version: 5, week, workspace }, null, 2)',
    'backup version',
)

path.write_text(s)
print('Integrated timetable phases 5 and 6')
