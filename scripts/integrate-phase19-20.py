from pathlib import Path

path = Path("app/components/StaffTimetableHub.tsx")
text = path.read_text()

old_import = 'import StaffTimetableWeeklyPlanning from "./StaffTimetableWeeklyPlanning";\n'
new_import = (
    'import StaffTimetableWeeklyPlanning from "./StaffTimetableWeeklyPlanning";\n'
    'import StaffTimetableSmartScheduler from "./StaffTimetableSmartScheduler";\n'
    'import StaffTimetableWeeklyReview from "./StaffTimetableWeeklyReview";\n'
)
if new_import not in text:
    if old_import not in text:
        raise SystemExit("Weekly planning import marker not found")
    text = text.replace(old_import, new_import, 1)

old_block = '''      {tab === "weekly" && <StaffTimetableWeeklyPlanning
        lessons={active.lessons}
        mediumTermPlans={active.mediumTermPlans}
        assessments={active.assessments}
        homework={active.homework}
        prep={active.prep}
        tasks={active.tasks}
        today={today}
        readOnly={demo}
        onOpenLesson={(lessonId) => { setPlanLessonId(lessonId); setTab("planning"); }}
        onOpenClass={(className) => { setClassSelection(className); setTab("classes"); }}
        onOpenMediumTerm={(className) => { setClassSelection(className); setTab("mediumterm"); }}
        onOpenHomework={() => setTab("homework")}
        onOpenAssessments={() => setTab("assessments")}
        onAddTask={() => setItemEditor({ kind: "task" })}
      />}
'''

new_block = '''      {tab === "weekly" && <div className="ttWorkspace">
        <StaffTimetableWeeklyPlanning
          lessons={active.lessons}
          mediumTermPlans={active.mediumTermPlans}
          assessments={active.assessments}
          homework={active.homework}
          prep={active.prep}
          tasks={active.tasks}
          today={today}
          readOnly={demo}
          onOpenLesson={(lessonId) => { setPlanLessonId(lessonId); setTab("planning"); }}
          onOpenClass={(className) => { setClassSelection(className); setTab("classes"); }}
          onOpenMediumTerm={(className) => { setClassSelection(className); setTab("mediumterm"); }}
          onOpenHomework={() => setTab("homework")}
          onOpenAssessments={() => setTab("assessments")}
          onAddTask={() => setItemEditor({ kind: "task" })}
        />
        <StaffTimetableSmartScheduler
          lessons={active.lessons}
          tasks={active.tasks}
          prep={active.prep}
          homework={active.homework}
          activities={active.activities}
          week={week}
          today={today}
          readOnly={demo}
          onScheduleTasks={(assignments) => mutate((current) => ({
            ...current,
            tasks: current.tasks.map((task) => {
              const assignment = assignments.find((item) => item.taskId === task.id);
              return assignment ? { ...task, date: assignment.date, period: `P${assignment.period}` } : task;
            }),
          }))}
          onCreateTask={(task) => mutate((current) => ({ ...current, tasks: [...current.tasks, { id: makeId("task"), ...task, status: "To do" }] }))}
          onMarkTaskDone={(taskId) => mutate((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, status: "Done" } : task) }))}
        />
        <StaffTimetableWeeklyReview
          lessons={active.lessons}
          mediumTermPlans={active.mediumTermPlans}
          tasks={active.tasks}
          prep={active.prep}
          homework={active.homework}
          today={today}
          readOnly={demo}
          onSessionStatus={markMediumTermSession}
          onReflowClass={(className) => {
            if (demo) return;
            mutate((current) => {
              const plan = current.mediumTermPlans.find((item) => item.className === className);
              if (!plan) return current;
              const fromDate = today > plan.startDate ? today : plan.startDate;
              const nextPlan = reflowMediumTermPlan(plan, {
                className: plan.className,
                profile: plan.profile,
                patternLessons: current.lessons,
                startDate: plan.startDate,
                endDate: plan.endDate,
                anchorWeek: plan.anchorWeek,
                planningBlocks: current.planningBlocks,
                keyDates: current.keyDates,
                changes: current.changes,
              }, fromDate);
              return { ...current, mediumTermPlans: current.mediumTermPlans.map((item) => item.id === plan.id ? nextPlan : item) };
            });
            setStatus(`Reflowed future ${className} lessons from today.`);
          }}
          onCarryTasks={(taskIds) => mutate((current) => ({
            ...current,
            tasks: current.tasks.map((task) => taskIds.includes(task.id) ? { ...task, date: shiftIsoDate(task.date, 7), period: "", status: "To do" } : task),
          }))}
          onOpenLesson={(lessonId) => { setPlanLessonId(lessonId); setTab("planning"); }}
          onOpenHomework={() => setTab("homework")}
          onOpenWorkload={() => setTab("workload")}
        />
      </div>}
'''

if new_block not in text:
    if old_block not in text:
        raise SystemExit("Weekly planning render block not found")
    text = text.replace(old_block, new_block, 1)

path.write_text(text)
