from pathlib import Path

p = Path("app/components/StaffTimetableHub.tsx")
s = p.read_text()

phase1_import = '''} from "./staffTimetableCurriculumPhase1";\n'''
medium_import = '''} from "./staffTimetableCurriculumPhase1";\nimport {\n  MediumTermPlan,\n  MediumTermSession,\n  PlanningBlock,\n  generateMediumTermPlan,\n  mediumTermStats,\n  nextDate,\n  reflowMediumTermPlan,\n} from "./staffTimetableMediumTerm";\n'''
if 'from "./staffTimetableMediumTerm"' not in s:
    if phase1_import not in s:
        raise SystemExit("Phase 1 import anchor not found")
    s = s.replace(phase1_import, medium_import, 1)
if 'import "./StaffTimetableMediumTerm.css";' not in s:
    s = s.replace('import "./StaffTimetableHub.css";\n', 'import "./StaffTimetableHub.css";\nimport "./StaffTimetableMediumTerm.css";\n', 1)

s = s.replace(
    'type WorkspaceTab = "today" | "timetable" | "planning" | "classes" | "homework" | "workload" | "changes" | "tools";',
    'type WorkspaceTab = "today" | "timetable" | "planning" | "mediumterm" | "classes" | "homework" | "workload" | "changes" | "tools";',
    1,
)

workspace_anchor = '''  classCurriculumProfiles: Record<string, ClassCurriculumProfile>;\n};'''
workspace_replacement = '''  classCurriculumProfiles: Record<string, ClassCurriculumProfile>;\n  mediumTermPlans: MediumTermPlan[];\n  planningBlocks: PlanningBlock[];\n};'''
if workspace_anchor in s:
    s = s.replace(workspace_anchor, workspace_replacement, 1)
elif 'mediumTermPlans: MediumTermPlan[];' not in s:
    raise SystemExit("WorkspaceData anchor not found")

blank_anchor = '  return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {} };'
blank_replacement = '  return { lessons: [], homework: [], prep: [], tasks: [], changes: [], activities: [], keyDates: [], classNotes: {}, curriculumSequences: {}, classCurriculumProfiles: {}, mediumTermPlans: [], planningBlocks: [] };'
if blank_anchor in s:
    s = s.replace(blank_anchor, blank_replacement, 1)
elif 'mediumTermPlans: []' not in s:
    raise SystemExit("blankWorkspace anchor not found")

if 'function dateOffsetIso(' not in s:
    s = s.replace(
        'function todayIso() { return new Date().toISOString().slice(0, 10); }\n',
        '''function todayIso() { return new Date().toISOString().slice(0, 10); }\nfunction dateOffsetIso(days: number) {\n  const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\n''',
        1,
    )

profile_demo_anchor = '  base.classCurriculumProfiles["Y13 Physics"] = { stage: "A level", examBoard: "AQA", subject: "Physics", courseId: "aqa-alevel-physics-7408" };\n'
if profile_demo_anchor in s and 'base.mediumTermPlans = [generateMediumTermPlan' not in s:
    demo_extra = '''  base.mediumTermPlans = [generateMediumTermPlan({\n    className: "Y13 Physics",\n    profile: base.classCurriculumProfiles["Y13 Physics"],\n    patternLessons: base.lessons,\n    startDate: todayIso(),\n    endDate: dateOffsetIso(42),\n    anchorWeek: "W1",\n    planningBlocks: [],\n    keyDates: [],\n    changes: [],\n  })];\n'''
    s = s.replace(profile_demo_anchor, profile_demo_anchor + demo_extra, 1)

state_anchor = '  const [curriculumText, setCurriculumText] = useState("");\n'
if state_anchor in s and 'const [mediumStart' not in s:
    state_extra = '''  const [mediumStart, setMediumStart] = useState(todayIso());\n  const [mediumEnd, setMediumEnd] = useState(dateOffsetIso(84));\n  const [mediumAnchorWeek, setMediumAnchorWeek] = useState<WeekKey>("W1");\n  const [blockDraft, setBlockDraft] = useState<{ title: string; startDate: string; endDate: string; type: PlanningBlock["type"] }>({ title: "", startDate: "", endDate: "", type: "Holiday" });\n'''
    s = s.replace(state_anchor, state_anchor + state_extra, 1)

functions_anchor = '  function exportBackup() {'
if functions_anchor not in s:
    raise SystemExit("exportBackup anchor not found")
if 'function generateMediumTermForClass()' not in s:
    functions = r'''  function generateMediumTermForClass() {
    if (!visibleClass || demo || !mediumStart || !mediumEnd || mediumEnd < mediumStart) return;
    const profile = workspace.classCurriculumProfiles[visibleClass] || inferClassCurriculumProfile(visibleClass, selectedClassLessons[0]?.subject || "Science");
    const sequence = getCourseLessonSequence(profile);
    const alreadyPlanned = new Set(workspace.lessons.filter((lesson) => lesson.className === visibleClass).map((lesson) => lesson.plan.topic).filter(Boolean));
    const firstUnused = sequence.findIndex((item) => !alreadyPlanned.has(item.title));
    const startSequencePosition = alreadyPlanned.size ? (firstUnused >= 0 ? firstUnused : sequence.length) : 0;
    const plan = generateMediumTermPlan({ className: visibleClass, profile, patternLessons: workspace.lessons, startDate: mediumStart, endDate: mediumEnd, anchorWeek: mediumAnchorWeek, planningBlocks: workspace.planningBlocks, keyDates: workspace.keyDates, changes: workspace.changes, startSequencePosition });
    mutate((current) => ({ ...current, mediumTermPlans: [...current.mediumTermPlans.filter((item) => item.className !== visibleClass), plan] }));
    setStatus(`Built a dated medium-term plan for ${visibleClass} with ${plan.sessions.length} teaching sessions.`);
  }
  function reflowSelectedMediumTerm() {
    if (!visibleClass || demo) return;
    mutate((current) => {
      const plan = current.mediumTermPlans.find((item) => item.className === visibleClass); if (!plan) return current;
      const fromDate = today > plan.startDate ? today : plan.startDate;
      const nextPlan = reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks: current.planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      return { ...current, mediumTermPlans: current.mediumTermPlans.map((item) => item.id === plan.id ? nextPlan : item) };
    });
    setStatus(`Reflowed future ${visibleClass} lessons around current non-teaching dates and cancellations.`);
  }
  function markMediumTermSession(planId: string, sessionId: string, status: MediumTermSession["status"]) {
    if (demo) return;
    mutate((current) => {
      const plan = current.mediumTermPlans.find((item) => item.id === planId); if (!plan) return current;
      const target = plan.sessions.find((item) => item.id === sessionId); if (!target) return current;
      let nextPlan: MediumTermPlan = { ...plan, sessions: plan.sessions.map((item) => item.id === sessionId ? { ...item, status } : item) };
      if (status === "missed") {
        nextPlan = reflowMediumTermPlan(nextPlan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks: current.planningBlocks, keyDates: current.keyDates, changes: current.changes }, nextDate(target.date));
      }
      return { ...current, mediumTermPlans: current.mediumTermPlans.map((item) => item.id === planId ? nextPlan : item) };
    });
  }
  function openMediumTermSession(session: MediumTermSession) {
    if (demo) return;
    const plan = workspace.mediumTermPlans.find((item) => item.className === visibleClass); if (!plan) return;
    mutate((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === session.sourceLessonId ? { ...lesson, plan: { ...lesson.plan, lessonDate: session.date, topic: session.topic, vocabulary: session.vocabulary, objectives: session.objectives, sequence: session.sequence, assessment: session.assessment, curriculumStage: plan.profile.stage, curriculumSubject: plan.profile.subject, curriculumUnit: session.unitTitle, curriculumSubtopic: session.subtopicTitle, examBoard: plan.profile.examBoard, courseId: plan.profile.courseId, sequencePosition: session.sequencePosition } } : lesson) }));
    setPlanLessonId(session.sourceLessonId); setTab("planning");
  }
  function savePlanningBlock() {
    if (demo) return;
    const startDate = blockDraft.startDate || mediumStart; const endDate = blockDraft.endDate || startDate;
    if (!startDate || !endDate || endDate < startDate) return;
    const block: PlanningBlock = { id: makeId("block"), title: blockDraft.title.trim() || blockDraft.type, startDate, endDate, type: blockDraft.type };
    mutate((current) => {
      const planningBlocks = [...current.planningBlocks, block];
      const mediumTermPlans = current.mediumTermPlans.map((plan) => {
        const fromDate = block.startDate > plan.startDate ? block.startDate : plan.startDate;
        return reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      });
      return { ...current, planningBlocks, mediumTermPlans };
    });
    setBlockDraft({ title: "", startDate: "", endDate: "", type: "Holiday" });
  }
  function removePlanningBlock(blockId: string) {
    if (demo) return;
    mutate((current) => {
      const removed = current.planningBlocks.find((item) => item.id === blockId); const planningBlocks = current.planningBlocks.filter((item) => item.id !== blockId);
      if (!removed) return { ...current, planningBlocks };
      const mediumTermPlans = current.mediumTermPlans.map((plan) => {
        const candidate = removed.startDate > today ? removed.startDate : today;
        const fromDate = candidate > plan.startDate ? candidate : plan.startDate;
        return reflowMediumTermPlan(plan, { className: plan.className, profile: plan.profile, patternLessons: current.lessons, startDate: plan.startDate, endDate: plan.endDate, anchorWeek: plan.anchorWeek, planningBlocks, keyDates: current.keyDates, changes: current.changes }, fromDate);
      });
      return { ...current, planningBlocks, mediumTermPlans };
    });
  }
  function clearMediumTermPlan() {
    if (!visibleClass || demo) return;
    mutate((current) => ({ ...current, mediumTermPlans: current.mediumTermPlans.filter((item) => item.className !== visibleClass) }));
  }
'''
    s = s.replace(functions_anchor, functions + functions_anchor, 1)

s = s.replace('JSON.stringify({ version: 2, week, workspace }, null, 2)', 'JSON.stringify({ version: 3, week, workspace }, null, 2)', 1)

selected_anchor = '  const nextProfileLesson = getNextSuggestedLesson(currentClassProfile, selectedClassLessons.map((lesson) => lesson.plan.topic));\n'
if selected_anchor in s and 'const selectedMediumTermPlan' not in s:
    selected_extra = '''  const selectedMediumTermPlan = active.mediumTermPlans.find((item) => item.className === visibleClass);\n  const selectedMediumStats = mediumTermStats(selectedMediumTermPlan);\n  const selectedCourseLength = getCourseLessonSequence(currentClassProfile).length;\n'''
    s = s.replace(selected_anchor, selected_anchor + selected_extra, 1)

old_nav = '(["today","timetable","planning","classes","homework","workload","changes","tools"] as WorkspaceTab[])'
new_nav = '(["today","timetable","planning","mediumterm","classes","homework","workload","changes","tools"] as WorkspaceTab[])'
s = s.replace(old_nav, new_nav, 1)
old_labels = '{today:"Today",timetable:"Timetable",planning:"Lesson planning",classes:"Classes",homework:"Homework",workload:"Prep & tasks",changes:"Changes",tools:"Tools"}'
new_labels = '{today:"Today",timetable:"Timetable",planning:"Lesson planning",mediumterm:"Medium-term",classes:"Classes",homework:"Homework",workload:"Prep & tasks",changes:"Changes",tools:"Tools"}'
s = s.replace(old_labels, new_labels, 1)

classes_anchor = '      {tab === "classes" && <section className="ttWorkspace">'
if classes_anchor not in s:
    raise SystemExit("Classes tab anchor not found")
if 'tab === "mediumterm"' not in s:
    medium_ui = r'''      {tab === "mediumterm" && <section className="ttWorkspace ttMtpShell"><div className="ttWorkspaceTop"><div><span className="staffTimetableEyebrow">PHASE 2 · MEDIUM-TERM PLANNING</span><h2>Automatic curriculum map</h2><p className="ttMuted">Turn the repeating W1/W2 timetable into dated lessons across a term. Holidays, INSET, assessment blocks, trips and cancellations are skipped, while missed lessons can roll forward automatically.</p></div><div className="ttMtpToolbar"><div className="ttMtpToolbarLeft"><select value={visibleClass} onChange={(event) => setClassSelection(event.target.value)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></div></div></div>
        {!visibleClass ? <div className="ttMtpEmpty"><strong>No classes yet</strong><span>Upload or build the timetable first.</span></div> : <>
          <div className="ttMtpSetup"><article className="ttPanel"><div className="ttPanelHeader"><div><h2>Build the teaching sequence</h2></div></div><div className="ttMtpCourseLine"><span>{profileLabel(currentClassProfile)}</span>{selectedProfileCourse?.code && <span>{selectedProfileCourse.code}</span>}<span>{selectedCourseLength} curriculum lessons</span></div><div className="ttMtpForm"><label><span>Start date</span><input type="date" disabled={demo} value={mediumStart} onChange={(event) => setMediumStart(event.target.value)} /></label><label><span>End date</span><input type="date" disabled={demo} value={mediumEnd} onChange={(event) => setMediumEnd(event.target.value)} /></label><label><span>Starting cycle</span><select disabled={demo} value={mediumAnchorWeek} onChange={(event) => setMediumAnchorWeek(event.target.value as WeekKey)}><option value="W1">Week 1</option><option value="W2">Week 2</option></select></label><label><span>Class</span><input value={visibleClass} disabled /></label></div><div className="ttButtonRow"><button className="ttButton primary" disabled={demo || !selectedProfileCourse} onClick={generateMediumTermForClass}>{selectedMediumTermPlan ? "Rebuild dated plan" : "Build dated plan"}</button>{selectedMediumTermPlan && <button className="ttButton" disabled={demo} onClick={reflowSelectedMediumTerm}>Reflow future lessons</button>}{selectedMediumTermPlan && <button className="ttButton danger" disabled={demo} onClick={clearMediumTermPlan}>Clear plan</button>}</div><div className="ttMtpHint">The first calendar week in this date range is treated as <strong>{mediumAnchorWeek === "W1" ? "Week 1" : "Week 2"}</strong>. The planner then alternates the cycle automatically and only schedules dates where this class actually appears on the timetable.</div>{selectedMediumTermPlan && <><div className="ttMtpStats"><div><small>Scheduled</small><strong>{selectedMediumStats.total}</strong></div><div><small>Complete</small><strong>{selectedMediumStats.complete}</strong></div><div><small>Missed</small><strong>{selectedMediumStats.missed}</strong></div><div><small>Still planned</small><strong>{selectedMediumStats.planned}</strong></div></div><div className="ttMtpProgress"><span style={{ width: `${selectedMediumStats.total ? Math.round(selectedMediumStats.complete / selectedMediumStats.total * 100) : 0}%` }} /></div></>}</article>
            <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Non-teaching dates</h2><p>Adding or removing a block automatically reflows affected medium-term plans.</p></div></div><div className="ttMtpBlockForm"><label className="wide"><span>Reason</span><input disabled={demo} value={blockDraft.title} onChange={(event) => setBlockDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. October half term" /></label><label><span>Type</span><select disabled={demo} value={blockDraft.type} onChange={(event) => setBlockDraft((current) => ({ ...current, type: event.target.value as PlanningBlock["type"] }))}>{["Holiday","INSET","Assessment week","Trip","Other"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>From</span><input type="date" disabled={demo} value={blockDraft.startDate} onChange={(event) => setBlockDraft((current) => ({ ...current, startDate: event.target.value }))} /></label><label><span>To</span><input type="date" disabled={demo} value={blockDraft.endDate} onChange={(event) => setBlockDraft((current) => ({ ...current, endDate: event.target.value }))} /></label><div className="wide"><button className="ttButton" disabled={demo} onClick={savePlanningBlock}>+ Add non-teaching block</button></div></div><div className="ttMtpBlocks">{active.planningBlocks.map((block) => <div className="ttMtpBlock" key={block.id}><div><strong>{block.title}</strong><span>{block.type} · {formatDate(block.startDate)}{block.endDate !== block.startDate ? ` – ${formatDate(block.endDate)}` : ""}</span></div>{!demo && <button className="ttMiniLink" onClick={() => removePlanningBlock(block.id)}>Remove</button>}</div>)}{!active.planningBlocks.length && <div className="ttMtpNotice">Holiday and Training items already saved under Key dates are skipped automatically. Use these blocks for date ranges such as half term, assessment week or a class trip.</div>}</div></article></div>
          {selectedMediumTermPlan ? <article className="ttPanel"><div className="ttPanelHeader"><div><h2>Dated teaching sequence</h2><p>{formatDate(selectedMediumTermPlan.startDate)} to {formatDate(selectedMediumTermPlan.endDate)} · generated from the class timetable and {selectedProfileCourse?.title || currentClassProfile.subject}.</p></div></div><div className="ttMtpTimeline">{selectedMediumTermPlan.sessions.map((session) => <div className={`ttMtpSession ${session.status}`} key={session.id}><div className="ttMtpDate"><strong>{formatDate(session.date)}</strong><span>{session.week} · {session.day.slice(0,3)} · P{session.period}</span></div><div className="ttMtpLesson"><strong>{session.topic}</strong><span>{session.unitTitle} · {session.subtopicTitle}</span><small>{session.start}–{session.end}{session.room ? ` · ${session.room}` : ""}</small></div><div className="ttMtpActions"><span className="ttMtpStatus">{session.status}</span><button className="ttMiniLink" onClick={() => openMediumTermSession(session)}>Open plan</button>{session.status !== "complete" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "complete")}>Complete</button>}{session.status !== "missed" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "missed")}>Missed</button>}{session.status !== "planned" && <button className="ttMiniLink" disabled={demo} onClick={() => markMediumTermSession(selectedMediumTermPlan.id, session.id, "planned")}>Reset</button>}</div></div>)}</div>{!selectedMediumTermPlan.sessions.length && <div className="ttMtpEmpty"><strong>No schedulable lessons in this range</strong><span>Check the class timetable, date range, W1/W2 starting cycle and non-teaching blocks.</span></div>}</article> : <div className="ttMtpEmpty"><strong>No medium-term plan for {visibleClass}</strong><span>Choose the date range above and build the plan. It will distribute the next curriculum lessons across the class’s real timetable slots.</span></div>}
        </>}
      </section>}

'''
    s = s.replace(classes_anchor, medium_ui + classes_anchor, 1)

p.write_text(s)
