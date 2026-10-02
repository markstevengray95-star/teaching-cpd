from pathlib import Path

hub_path = Path("app/components/StaffTimetableHub.tsx")
hub = hub_path.read_text()
class_path = Path("app/components/StaffTimetableClassWorkspace.tsx")
classes = class_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# HUB IMPORTS + TYPES
if 'StaffTimetableLessonReflection' not in hub:
    hub = replace_once(
        hub,
        'import StaffTimetableClassWorkspace from "./StaffTimetableClassWorkspace";\nimport "./StaffTimetableHub.css";',
        'import StaffTimetableClassWorkspace from "./StaffTimetableClassWorkspace";\nimport StaffTimetableLessonReflection, { type LessonReflectionOutcome } from "./StaffTimetableLessonReflection";\nimport { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport "./StaffTimetableHub.css";',
        'hub imports',
    )

if 'reflectionOutcome:' not in hub:
    hub = replace_once(
        hub,
        '  reflection: string;\n  generatedResources: TimetableAttachedResource[];',
        '  reflection: string;\n  reflectionOutcome: LessonReflectionOutcome;\n  reflectionNote: string;\n  reflectionUpdatedAt: string;\n  reflectionCarryAppliedAt: string;\n  generatedResources: TimetableAttachedResource[];',
        'lesson reflection fields',
    )
    hub = replace_once(
        hub,
        '    sendEalAdaptations: "", stretchChallenge: "", homeworkTask: "", exitTicket: "", reflection: "", generatedResources: [],',
        '    sendEalAdaptations: "", stretchChallenge: "", homeworkTask: "", exitTicket: "", reflection: "", reflectionOutcome: "", reflectionNote: "", reflectionUpdatedAt: "", reflectionCarryAppliedAt: "", generatedResources: [],',
        'blank reflection fields',
    )

# Replace savePlan with reflection carry-forward-aware version.
start = hub.find('  function savePlan(nextPlan: LessonPlan) {')
end = hub.find('  function assessmentFollowUp(', start)
if start < 0 or end < 0:
    raise RuntimeError('savePlan block not found')
current_save = hub[start:end]
if 'reflectionCarryAppliedAt' not in current_save:
    new_save = '''  function savePlan(nextPlan: LessonPlan) {
    if (!planLessonId) return;
    mutate((current) => {
      const previous = current.lessons.find((lesson) => lesson.id === planLessonId);
      if (!previous) return current;
      const dayShift = dateDeltaDays(previous.plan.lessonDate || "", nextPlan.lessonDate || "");
      const homework = dayShift ? current.homework.map((item) => item.sourceLessonId === planLessonId && item.autoMoveWithLesson ? { ...item, setDate: shiftIsoDate(item.setDate, dayShift), dueDate: shiftIsoDate(item.dueDate, dayShift), sourceLessonDate: nextPlan.lessonDate } : item) : current.homework;
      const shouldCarry = Boolean(nextPlan.reflectionUpdatedAt) && nextPlan.reflectionUpdatedAt !== previous.plan.reflectionCarryAppliedAt && (nextPlan.reflectionOutcome === "needs-revisiting" || nextPlan.reflectionOutcome === "not-completed");
      const sourcePlan = shouldCarry ? { ...nextPlan, reflectionCarryAppliedAt: nextPlan.reflectionUpdatedAt } : nextPlan;
      let lessons = current.lessons.map((lesson) => lesson.id === planLessonId ? { ...lesson, plan: sourcePlan } : lesson);

      if (shouldCarry) {
        const order = (lesson: Lesson) => {
          if (lesson.plan.lessonDate) return `0-${lesson.plan.lessonDate}-${String(lesson.period).padStart(2, "0")}`;
          const sequence = Number.isInteger(lesson.plan.sequencePosition) && lesson.plan.sequencePosition >= 0 ? String(lesson.plan.sequencePosition).padStart(4, "0") : "9999";
          return `1-${sequence}-${lesson.week}-${String(DAYS.indexOf(lesson.day)).padStart(2, "0")}-${String(lesson.period).padStart(2, "0")}`;
        };
        const classmates = lessons.filter((lesson) => lesson.className === previous.className).slice().sort((a, b) => order(a).localeCompare(order(b)));
        const currentIndex = classmates.findIndex((lesson) => lesson.id === planLessonId);
        const target = classmates.slice(Math.max(0, currentIndex + 1)).find((lesson) => lesson.id !== planLessonId) || classmates.find((lesson) => lesson.id !== planLessonId && !lesson.plan.topic);
        if (target) {
          const marker = `[Reflection follow-up ${nextPlan.reflectionUpdatedAt}]`;
          lessons = lessons.map((lesson) => {
            if (lesson.id !== target.id || lesson.plan.teacherNotes.includes(marker)) return lesson;
            if (nextPlan.reflectionOutcome === "needs-revisiting") {
              const previousTopic = nextPlan.topic || previous.plan.topic || "the previous lesson";
              return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\\n\\n` : ""}Reflection follow-up: revisit ${previousTopic} with 4–6 retrieval questions, one misconception check and one short application before moving on.`, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${marker} Previous lesson marked Needs revisiting.${nextPlan.reflectionNote ? ` Note: ${nextPlan.reflectionNote}` : ""}` } };
            }
            const previousTopic = nextPlan.topic || previous.plan.topic || "previous learning";
            return { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: lesson.plan.topic || `Continue: ${previousTopic}`, vocabulary: lesson.plan.vocabulary || nextPlan.vocabulary, objectives: lesson.plan.objectives || nextPlan.objectives, sequence: lesson.plan.sequence || `Check what was completed previously, finish the unfinished teaching/practice from ${previousTopic}, then check readiness before moving on.`, assessment: lesson.plan.assessment || nextPlan.assessment, curriculumStage: lesson.plan.curriculumStage || nextPlan.curriculumStage, curriculumSubject: lesson.plan.curriculumSubject || nextPlan.curriculumSubject, curriculumUnit: lesson.plan.curriculumUnit || nextPlan.curriculumUnit, curriculumSubtopic: lesson.plan.curriculumSubtopic || nextPlan.curriculumSubtopic, examBoard: lesson.plan.examBoard || nextPlan.examBoard, courseId: lesson.plan.courseId || nextPlan.courseId, sequencePosition: lesson.plan.sequencePosition >= 0 ? lesson.plan.sequencePosition : nextPlan.sequencePosition, retrieval: `${lesson.plan.retrieval ? `${lesson.plan.retrieval}\\n\\n` : ""}Quickly retrieve what pupils completed in ${previousTopic}, then continue from the unfinished point.`, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${marker} Previous lesson marked Not completed.${nextPlan.reflectionNote ? ` Note: ${nextPlan.reflectionNote}` : ""}` } };
          });
        }
      }
      return { ...current, homework, lessons };
    });
    setPlanLessonId(null);
  }
'''
    hub = hub[:start] + new_save + hub[end:]

# Phase 10 suggestion application handler before saveCurriculumSequence.
if 'function applyNextLessonSuggestion' not in hub:
    marker = '  function saveCurriculumSequence() {'
    handler = '''  function applyNextLessonSuggestion(suggestion: NextLessonSuggestion) {
    if (demo) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === suggestion.targetLessonId ? { ...lesson, plan: { ...lesson.plan, planningMode: "detailed", topic: suggestion.title, courseId: suggestion.courseId, sequencePosition: suggestion.sequencePosition, curriculumUnit: suggestion.unitTitle, curriculumSubtopic: suggestion.subtopicTitle, vocabulary: suggestion.vocabulary, objectives: suggestion.objectives, sequence: suggestion.sequence, assessment: suggestion.assessment, retrieval: suggestion.retrieval, teacherNotes: `${lesson.plan.teacherNotes ? `${lesson.plan.teacherNotes}\\n\\n` : ""}${suggestion.teacherNotes}` } } : lesson) }));
    setPlanLessonId(suggestion.targetLessonId);
    setTab("planning");
    setStatus(`Prepared the Phase 10 next-lesson suggestion for ${suggestion.className}.`);
  }
'''
    hub = replace_once(hub, marker, handler + marker, 'Phase 10 application handler')

# Pass callback into Phase 9 class workspace.
if 'onApplyNextSuggestion={applyNextLessonSuggestion}' not in hub:
    hub = replace_once(
        hub,
        '        onOpenHomework={() => setTab("homework")}\n        onNotesChange=',
        '        onOpenHomework={() => setTab("homework")}\n        onApplyNextSuggestion={applyNextLessonSuggestion}\n        onNotesChange=',
        'Phase 10 workspace callback',
    )

# Insert reflection UI into PlanEditor, immediately before actions.
if '<StaffTimetableLessonReflection' not in hub:
    reflection_mount = '''    <StaffTimetableLessonReflection
      outcome={plan.reflectionOutcome}
      note={plan.reflectionNote}
      updatedAt={plan.reflectionUpdatedAt}
      readOnly={readOnly}
      onChange={({ outcome, note, updatedAt }) => setPlan((current) => ({ ...current, reflectionOutcome: outcome, reflectionNote: note, reflectionUpdatedAt: updatedAt, reflection: note || current.reflection }))}
    />
'''
    hub = replace_once(hub, '    <div className="ttModalActions">', reflection_mount + '    <div className="ttModalActions">', 'Phase 11 reflection mount')

hub = hub.replace('LESSON PLANNING · PHASES 4–5 & 8', 'LESSON PLANNING · PHASES 4–5, 8 & 11', 1)
hub = hub.replace('JSON.stringify({ version: 8, week, workspace }, null, 2)', 'JSON.stringify({ version: 11, week, workspace }, null, 2)', 1)
hub_path.write_text(hub)

# CLASS WORKSPACE integration.
if 'StaffTimetableNextLesson' not in classes:
    classes = replace_once(
        classes,
        'import { TimetableAttachedResource } from "./StaffTimetableLessonResources";\nimport "./StaffTimetableClassWorkspace.css";',
        'import { TimetableAttachedResource } from "./StaffTimetableLessonResources";\nimport StaffTimetableNextLesson, { type NextLessonSuggestion } from "./StaffTimetableNextLesson";\nimport "./StaffTimetableClassWorkspace.css";',
        'next lesson import',
    )

if 'reflectionOutcome?:' not in classes:
    classes = replace_once(
        classes,
        '    generatedResources?: TimetableAttachedResource[];\n  };',
        '    generatedResources?: TimetableAttachedResource[];\n    vocabulary?: string;\n    objectives?: string;\n    sequence?: string;\n    assessment?: string;\n    reflectionOutcome?: "" | "went-well" | "needs-revisiting" | "not-completed";\n    reflectionNote?: string;\n    reflectionUpdatedAt?: string;\n  };',
        'class workspace reflection fields',
    )

if 'onApplyNextSuggestion,' not in classes:
    classes = replace_once(
        classes,
        '  onOpenHomework,\n  onNotesChange,',
        '  onOpenHomework,\n  onApplyNextSuggestion,\n  onNotesChange,',
        'callback destructure',
    )
    classes = replace_once(
        classes,
        '  onOpenHomework: () => void;\n  onNotesChange: (value: string) => void;',
        '  onOpenHomework: () => void;\n  onApplyNextSuggestion: (suggestion: NextLessonSuggestion) => void;\n  onNotesChange: (value: string) => void;',
        'callback type',
    )

if '<StaffTimetableNextLesson' not in classes:
    mount = '''    <StaffTimetableNextLesson
      className={className}
      lessons={lessons}
      profile={profile}
      assessments={assessments}
      mediumTermPlans={mediumTermPlans}
      today={today}
      readOnly={readOnly}
      onApply={onApplyNextSuggestion}
    />

'''
    classes = replace_once(classes, '    <nav className="ttClassWorkspaceNav"', mount + '    <nav className="ttClassWorkspaceNav"', 'Phase 10 mount')

classes = classes.replace('PHASE 9 · CLASS-SPECIFIC PLANNING', 'PHASES 9–10 · CLASS-SPECIFIC PLANNING', 1)
class_path.write_text(classes)

print("Integrated timetable Phases 10 and 11")
