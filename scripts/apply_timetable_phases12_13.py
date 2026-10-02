from pathlib import Path

hub_path = Path("app/components/StaffTimetableHub.tsx")
hub = hub_path.read_text()
class_path = Path("app/components/StaffTimetableClassWorkspace.tsx")
classes = class_path.read_text()
css_path = Path("app/components/StaffTimetableHub.css")
css = css_path.read_text()


def once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# HUB imports and workspace types.
if 'StaffTimetableInclusionProfile' not in hub:
    hub = once(hub,
        'import { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport "./StaffTimetableHub.css";',
        'import { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport { buildClassSupportText, type ClassInclusionProfile } from "./StaffTimetableInclusionProfile";\nimport { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport "./StaffTimetableHub.css";',
        'hub phase12/13 imports')

if 'classInclusionProfiles:' not in hub:
    hub = once(hub,
        '  assessments: CurriculumAssessment[];\n};',
        '  assessments: CurriculumAssessment[];\n  classInclusionProfiles: Record<string, ClassInclusionProfile>;\n  departmentSchemeCopies: Record<string, DepartmentSchemeCopy>;\n};',
        'workspace phase12/13 fields')
    hub = once(hub,
        'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [], assessments: [] };',
        'return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [], assessments: [], classInclusionProfiles: {}, departmentSchemeCopies: {} };',
        'blank workspace phase12/13')

# Keep Phase 10 generated lessons aware of the generic class access profile.
if 'const classSupport = buildClassSupportText(current.classInclusionProfiles[suggestion.className]);' not in hub:
    old = '''  function applyNextLessonSuggestion(suggestion: NextLessonSuggestion) {
    if (demo) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === suggestion.targetLessonId ? { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: suggestion.title, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, retrieval: suggestion.retrieval, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${suggestion.teacherNotes}` } } : lesson) }));
    setPlanLessonId(suggestion.targetLessonId);
    setTab("planning");
    setStatus(`Prepared the Phase 10 next-lesson suggestion for ${suggestion.className}.`);
  }
'''
    new = '''  function applyNextLessonSuggestion(suggestion: NextLessonSuggestion) {
    if (demo) return;
    mutate((current) => {
      const classSupport = buildClassSupportText(current.classInclusionProfiles[suggestion.className]);
      return { ...current, lessons: current.lessons.map((lesson) => lesson.id === suggestion.targetLessonId ? { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: suggestion.title, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, retrieval: suggestion.retrieval, sendEalAdaptations: lesson.plan.sendEalAdaptations || classSupport, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${suggestion.teacherNotes}` } } : lesson) };
    });
    setPlanLessonId(suggestion.targetLessonId);
    setTab("planning");
    setStatus(`Prepared the Phase 10 next-lesson suggestion for ${suggestion.className}.`);
  }
'''
    hub = once(hub, old, new, 'phase10 inclusion integration')

# Phase 13 snapshot import handler.
if 'function importDepartmentScheme' not in hub:
    marker = '  function saveCurriculumSequence() {'
    handler = '''  function importDepartmentScheme(className: string, unit: DepartmentSchemeUnit, schemeLessons: DepartmentSchemeLesson[]) {
    if (demo || !className || !schemeLessons.length) return;
    const copy: DepartmentSchemeCopy = { unitId: unit.id, department: unit.department, subject: unit.subject, yearGroup: unit.year_group, title: unit.title, copiedAt: new Date().toISOString(), lessons: schemeLessons.map((item) => ({ ...item })) };
    mutate((current) => {
      const targets = current.lessons.filter((lesson) => lesson.className === className).slice().sort((a, b) => a.week.localeCompare(b.week) || DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
      const targetIndex = new Map(targets.map((lesson, index) => [lesson.id, index]));
      const nextLessons = current.lessons.map((lesson) => {
        const index = targetIndex.get(lesson.id);
        if (index === undefined || index >= schemeLessons.length || lesson.plan.topic) return lesson;
        const scheme = schemeLessons[index];
        const note = `Department scheme snapshot: ${unit.title}. This is a local copy; edits here do not change the department master.`;
        return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: scheme.title, vocabulary: lesson.plan.vocabulary || unit.vocabulary.join(", "), objectives: lesson.plan.objectives || (scheme.objectives.length ? scheme.objectives.join("\\n") : unit.objectives.join("\\n")), sequence: lesson.plan.sequence || scheme.lesson_outline || scheme.key_knowledge, assessment: lesson.plan.assessment || scheme.assessment || unit.assessment_notes, curriculumSubject: lesson.plan.curriculumSubject || unit.subject, curriculumUnit: unit.title, curriculumSubtopic: scheme.title, sequencePosition: lesson.plan.sequencePosition >= 0 ? lesson.plan.sequencePosition : index, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${note}` } };
      });
      return { ...current, lessons: nextLessons, curriculumSequences: { ...current.curriculumSequences, [className]: schemeLessons.map((item) => item.title) }, departmentSchemeCopies: { ...current.departmentSchemeCopies, [className]: copy } };
    });
    setStatus(`Copied ${unit.title} into ${className}. The department master remains unchanged.`);
  }
'''
    hub = once(hub, marker, handler + marker, 'department scheme import handler')

# Pass new Phase 12/13 props into class workspace.
if 'inclusionProfile={active.classInclusionProfiles[visibleClass]}' not in hub:
    hub = once(hub,
        '        onApplyNextSuggestion={applyNextLessonSuggestion}\n        onNotesChange=',
        '        onApplyNextSuggestion={applyNextLessonSuggestion}\n        inclusionProfile={active.classInclusionProfiles[visibleClass]}\n        departmentSchemeCopy={active.departmentSchemeCopies[visibleClass]}\n        onInclusionChange={(profile) => mutate((current) => ({ ...current, classInclusionProfiles: { ...current.classInclusionProfiles, [visibleClass]: profile } }))}\n        onImportScheme={(unit, schemeLessons) => importDepartmentScheme(visibleClass, unit, schemeLessons)}\n        onNotesChange=',
        'class workspace phase12/13 props')

# Pass generic class access profile into lesson editor.
old_call = '{activePlanLesson && <PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} homework={active.homework} readOnly={demo} onHomeworkChange={(homework) => mutate((current) => ({ ...current, homework }))} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}'
if old_call in hub:
    hub = hub.replace(old_call, '{activePlanLesson && <PlanEditor lesson={activePlanLesson} classProfile={active.classCurriculumProfiles[activePlanLesson.className]} inclusionProfile={active.classInclusionProfiles[activePlanLesson.className]} homework={active.homework} readOnly={demo} onHomeworkChange={(homework) => mutate((current) => ({ ...current, homework }))} onClose={() => setPlanLessonId(null)} onSave={savePlan} />}', 1)
elif 'inclusionProfile={active.classInclusionProfiles[activePlanLesson.className]}' not in hub:
    raise RuntimeError('PlanEditor call not found')

old_sig = 'function PlanEditor({ lesson, homework, readOnly, onHomeworkChange, onClose, onSave, classProfile }: { lesson: Lesson; homework: Homework[]; readOnly: boolean; onHomeworkChange: (homework: Homework[]) => void; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile }) {'
if old_sig in hub:
    hub = hub.replace(old_sig, 'function PlanEditor({ lesson, homework, readOnly, onHomeworkChange, onClose, onSave, classProfile, inclusionProfile }: { lesson: Lesson; homework: Homework[]; readOnly: boolean; onHomeworkChange: (homework: Homework[]) => void; onClose: () => void; onSave: (plan: LessonPlan) => void; classProfile?: ClassCurriculumProfile; inclusionProfile?: ClassInclusionProfile }) {', 1)
elif 'inclusionProfile?: ClassInclusionProfile' not in hub:
    raise RuntimeError('PlanEditor signature not found')

# Lesson-level application button: generic class support is never forced over teacher edits.
if 'ttLessonClassSupport' not in hub:
    anchor = '    <StaffTimetableLessonReflection\n'
    support = '''    {buildClassSupportText(inclusionProfile) && <section className="ttLessonClassSupport"><div><span>PHASE 12 · CLASS ACCESS</span><strong>Generic class support is available</strong><small>Apply the class profile to SEND / EAL adaptations without storing individual pupil information here.</small></div><button type="button" className="ttButton" disabled={readOnly} onClick={() => { const support = buildClassSupportText(inclusionProfile); setPlan((current) => ({ ...current, planningMode: "detailed", sendEalAdaptations: current.sendEalAdaptations.includes(support) ? current.sendEalAdaptations : [current.sendEalAdaptations, support].filter(Boolean).join("\\n\\n") })); }}>Apply class support</button></section>}\n'''
    hub = once(hub, anchor, support + anchor, 'lesson class support mount')

hub = hub.replace('LESSON PLANNING · PHASES 4–5, 8 & 11', 'LESSON PLANNING · PHASES 4–5, 8, 11–13', 1)
hub = hub.replace('JSON.stringify({ version: 11, week, workspace }, null, 2)', 'JSON.stringify({ version: 13, week, workspace }, null, 2)', 1)
hub_path.write_text(hub)

# CLASS WORKSPACE imports, sections and props.
if 'StaffTimetableInclusionProfile' not in classes:
    classes = once(classes,
        'import StaffTimetableNextLesson, { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport "./StaffTimetableClassWorkspace.css";',
        'import StaffTimetableNextLesson, { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport StaffTimetableInclusionProfile, { type ClassInclusionProfile } from "./StaffTimetableInclusionProfile";\nimport StaffTimetableDepartmentSchemes, { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport "./StaffTimetableClassWorkspace.css";',
        'class workspace phase12/13 imports')

classes = classes.replace('type Section = "overview" | "lessons" | "homework" | "assessments" | "resources" | "notes";', 'type Section = "overview" | "lessons" | "support" | "schemes" | "homework" | "assessments" | "resources" | "notes";', 1)
classes = classes.replace('const sectionLabels: Record<Section, string> = { overview: "Overview", lessons: "Lesson plans", homework: "Homework", assessments: "Assessments", resources: "Resources", notes: "Notes" };', 'const sectionLabels: Record<Section, string> = { overview: "Overview", lessons: "Lesson plans", support: "SEND / EAL support", schemes: "Department schemes", homework: "Homework", assessments: "Assessments", resources: "Resources", notes: "Notes" };', 1)

if 'inclusionProfile,' not in classes:
    classes = once(classes,
        '  onApplyNextSuggestion,\n  onNotesChange,',
        '  onApplyNextSuggestion,\n  inclusionProfile,\n  departmentSchemeCopy,\n  onInclusionChange,\n  onImportScheme,\n  onNotesChange,',
        'class workspace new prop destructure')
    classes = once(classes,
        '  onApplyNextSuggestion: (suggestion: NextLessonSuggestion) => void;\n  onNotesChange: (value: string) => void;',
        '  onApplyNextSuggestion: (suggestion: NextLessonSuggestion) => void;\n  inclusionProfile?: ClassInclusionProfile;\n  departmentSchemeCopy?: DepartmentSchemeCopy;\n  onInclusionChange: (profile: ClassInclusionProfile) => void;\n  onImportScheme: (unit: DepartmentSchemeUnit, lessons: DepartmentSchemeLesson[]) => void;\n  onNotesChange: (value: string) => void;',
        'class workspace new prop types')

if 'section === "support"' not in classes:
    anchor = '    {section === "homework" && '
    mounts = '''    {section === "support" && <div className="ttClassSection"><StaffTimetableInclusionProfile className={className} profile={inclusionProfile} readOnly={readOnly} onChange={onInclusionChange} /></div>}\n\n    {section === "schemes" && <div className="ttClassSection"><StaffTimetableDepartmentSchemes className={className} subject={inferred.subject} currentCopy={departmentSchemeCopy} readOnly={readOnly} onImport={onImportScheme} /></div>}\n\n'''
    classes = once(classes, anchor, mounts + anchor, 'class workspace support/schemes mounts')

classes = classes.replace('PHASES 9–10 · CLASS-SPECIFIC PLANNING', 'PHASES 9–10, 12–13 · CLASS-SPECIFIC PLANNING', 1)
class_path.write_text(classes)

# Minimal lesson modal styling for the class-support shortcut.
if '.ttLessonClassSupport{' not in css:
    css += '\n.ttLessonClassSupport{display:flex;justify-content:space-between;gap:14px;align-items:center;margin:14px 0;padding:12px 14px;border:1px solid #cfe1d6;border-radius:13px;background:#f4fbf7}.ttLessonClassSupport>div{display:grid;gap:2px}.ttLessonClassSupport span{font-size:9px;font-weight:900;letter-spacing:.09em;color:#387256}.ttLessonClassSupport strong{font-size:12px}.ttLessonClassSupport small{font-size:10px;color:#708177}@media(max-width:650px){.ttLessonClassSupport{align-items:stretch;flex-direction:column}.ttLessonClassSupport .ttButton{width:100%}}\n'
    css_path.write_text(css)

print('Integrated timetable Phases 12 and 13')
