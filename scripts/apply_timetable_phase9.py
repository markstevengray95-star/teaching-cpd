from pathlib import Path

hub_path = Path("app/components/StaffTimetableHub.tsx")
hub = hub_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

if 'StaffTimetableClassWorkspace' not in hub:
    hub = replace_once(
        hub,
        'import StaffTimetableLessonHomework, { type LessonLinkedHomework } from "./StaffTimetableLessonHomework";\nimport "./StaffTimetableHub.css";',
        'import StaffTimetableLessonHomework, { type LessonLinkedHomework } from "./StaffTimetableLessonHomework";\nimport StaffTimetableClassWorkspace from "./StaffTimetableClassWorkspace";\nimport "./StaffTimetableHub.css";',
        'Phase 9 import',
    )

if '<StaffTimetableClassWorkspace' not in hub:
    marker = '{tab === "classes" && <section className="ttWorkspace"><div className="ttWorkspaceTop">'
    replacement = '''{tab === "classes" && <section className="ttWorkspace"><StaffTimetableClassWorkspace
        classes={classes}
        className={visibleClass}
        lessons={active.lessons}
        profile={active.classCurriculumProfiles[visibleClass]}
        homework={active.homework}
        assessments={active.assessments}
        mediumTermPlans={active.mediumTermPlans}
        notes={active.classNotes[visibleClass] || ""}
        today={today}
        readOnly={demo}
        onSelectClass={(nextClass) => { setClassSelection(nextClass); setCurriculumText(active.curriculumSequences[nextClass]?.join("\\n") || ""); }}
        onOpenPlan={(lessonId) => setPlanLessonId(lessonId)}
        onOpenMediumTerm={() => setTab("mediumterm")}
        onOpenAssessments={() => setTab("assessments")}
        onOpenHomework={() => setTab("homework")}
        onNotesChange={(value) => mutate((current) => ({ ...current, classNotes: { ...current.classNotes, [visibleClass]: value } }))}
      /><div className="ttWorkspaceTop">'''
    hub = replace_once(hub, marker, replacement, 'Phase 9 class workspace mount')

hub = hub.replace('CLASS DASHBOARD · PHASE 1</span><h2>Classes & curriculum profile</h2><p className="ttMuted">Set each class once. The timetable then filters out irrelevant courses and suggests the next lesson from that specification.</p>', 'CURRICULUM SETUP · PHASE 1</span><h2>Curriculum profile & setup</h2><p className="ttMuted">The Phase 9 class workspace above brings day-to-day planning together. Use this area when you need to change the class curriculum profile or sequence.</p>', 1)

assessment_mount = '''      {tab === "assessments" && <StaffTimetableAssessments
        lessons={active.lessons}
        profiles={active.classCurriculumProfiles}
        assessments={active.assessments}
        today={today}'''
if assessment_mount in hub and 'initialClass={visibleClass}' not in hub:
    hub = hub.replace(assessment_mount, assessment_mount + '\n        initialClass={visibleClass}', 1)

hub_path.write_text(hub)

assessment_path = Path("app/components/StaffTimetableAssessments.tsx")
a = assessment_path.read_text()
if 'initialClass,' not in a:
    a = replace_once(
        a,
        '  assessments,\n  today,\n  readOnly,',
        '  assessments,\n  today,\n  initialClass,\n  readOnly,',
        'assessment initialClass destructure',
    )
    a = replace_once(
        a,
        '  assessments: CurriculumAssessment[];\n  today: string;\n  readOnly: boolean;',
        '  assessments: CurriculumAssessment[];\n  today: string;\n  initialClass?: string;\n  readOnly: boolean;',
        'assessment initialClass type',
    )
    a = replace_once(
        a,
        '  const [selectedClass, setSelectedClass] = useState(classes[0] || "");',
        '  const [selectedClass, setSelectedClass] = useState(classes.includes(initialClass || "") ? (initialClass || "") : classes[0] || "");',
        'assessment initialClass state',
    )
assessment_path.write_text(a)

print("Integrated timetable Phase 9 class-specific planning workspace")
