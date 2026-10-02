from pathlib import Path

hub_path = Path("app/components/StaffTimetableHub.tsx")
class_path = Path("app/components/StaffTimetableClassWorkspace.tsx")
roles_path = Path("lib/rolePermissions.ts")

hub = hub_path.read_text()
classes = class_path.read_text()
roles = roles_path.read_text()


def once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# Hub imports.
if 'StaffTimetableLeadershipSync' not in hub:
    hub = once(
        hub,
        'import { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport "./StaffTimetableHub.css";',
        'import { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport StaffTimetableLeadershipSync from "./StaffTimetableLeadershipSync";\nimport StaffTimetableLeadershipLink from "./StaffTimetableLeadershipLink";\nimport { reorderMediumTermPlanSessions } from "./StaffTimetablePlanningCalendar";\nimport "./StaffTimetableHub.css";',
        'hub phase14/15 imports',
    )

# Phase 15 move handler.
if 'function movePlannedLesson(' not in hub:
    marker = '  function saveCurriculumSequence() {'
    handler = '''  function movePlannedLesson(className: string, sourceId: string, targetId: string, shiftRemaining: boolean) {
    if (demo || !className || !sourceId || !targetId) return;
    mutate((current) => ({
      ...current,
      mediumTermPlans: current.mediumTermPlans.map((plan) => plan.className === className ? reorderMediumTermPlanSessions(plan, sourceId, targetId, shiftRemaining) : plan),
    }));
    setStatus(`${shiftRemaining ? "Shifted" : "Swapped"} the planned curriculum lesson for ${className}. Completed lessons were left unchanged.`);
  }
'''
    hub = once(hub, marker, handler + marker, 'phase15 move handler')

# Phase 14 summary sync and leadership link.
if '<StaffTimetableLeadershipSync' not in hub:
    hub = once(
        hub,
        '    <main className="staffTimetablePage">\n      <section className="staffTimetableHero">',
        '    <main className="staffTimetablePage">\n      <StaffTimetableLeadershipSync lessons={workspace.lessons} classCurriculumProfiles={workspace.classCurriculumProfiles} mediumTermPlans={workspace.mediumTermPlans} assessments={workspace.assessments} disabled={demo} />\n      <section className="staffTimetableHero">',
        'phase14 sync mount',
    )

if '<StaffTimetableLeadershipLink />' not in hub:
    hub = once(
        hub,
        '<div className="staffTimetableHeroActions noPrint"><button className={demo ? "ttButton demo active" : "ttButton demo"}',
        '<div className="staffTimetableHeroActions noPrint"><StaffTimetableLeadershipLink /><button className={demo ? "ttButton demo active" : "ttButton demo"}',
        'phase14 leadership link',
    )

# Phase 15 callback into class workspace.
if 'onMovePlannedLesson={movePlannedLesson}' not in hub:
    hub = once(
        hub,
        '        onImportScheme={(unit, schemeLessons) => importDepartmentScheme(visibleClass, unit, schemeLessons)}\n        onNotesChange=',
        '        onImportScheme={(unit, schemeLessons) => importDepartmentScheme(visibleClass, unit, schemeLessons)}\n        onMovePlannedLesson={movePlannedLesson}\n        onNotesChange=',
        'class workspace phase15 callback',
    )

hub = hub.replace('JSON.stringify({ version: 13, week, workspace }, null, 2)', 'JSON.stringify({ version: 15, week, workspace }, null, 2)', 1)
hub_path.write_text(hub)

# Class workspace Phase 15 calendar section.
if 'StaffTimetablePlanningCalendar' not in classes:
    classes = once(
        classes,
        'import StaffTimetableDepartmentSchemes, { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport "./StaffTimetableClassWorkspace.css";',
        'import StaffTimetableDepartmentSchemes, { type DepartmentSchemeCopy, type DepartmentSchemeLesson, type DepartmentSchemeUnit } from "./StaffTimetableDepartmentSchemes";\nimport StaffTimetablePlanningCalendar from "./StaffTimetablePlanningCalendar";\nimport "./StaffTimetableClassWorkspace.css";',
        'class phase15 import',
    )

classes = classes.replace(
    'type Section = "overview" | "lessons" | "support" | "schemes" | "homework" | "assessments" | "resources" | "notes";',
    'type Section = "overview" | "lessons" | "calendar" | "support" | "schemes" | "homework" | "assessments" | "resources" | "notes";',
    1,
)
classes = classes.replace(
    'const sectionLabels: Record<Section, string> = { overview: "Overview", lessons: "Lesson plans", support: "SEND / EAL support", schemes: "Department schemes", homework: "Homework", assessments: "Assessments", resources: "Resources", notes: "Notes" };',
    'const sectionLabels: Record<Section, string> = { overview: "Overview", lessons: "Lesson plans", calendar: "Planning calendar", support: "SEND / EAL support", schemes: "Department schemes", homework: "Homework", assessments: "Assessments", resources: "Resources", notes: "Notes" };',
    1,
)

if 'onMovePlannedLesson,' not in classes:
    classes = once(
        classes,
        '  onImportScheme,\n  onNotesChange,',
        '  onImportScheme,\n  onMovePlannedLesson,\n  onNotesChange,',
        'class phase15 destructure',
    )
    classes = once(
        classes,
        '  onImportScheme: (unit: DepartmentSchemeUnit, lessons: DepartmentSchemeLesson[]) => void;\n  onNotesChange: (value: string) => void;',
        '  onImportScheme: (unit: DepartmentSchemeUnit, lessons: DepartmentSchemeLesson[]) => void;\n  onMovePlannedLesson: (className: string, sourceId: string, targetId: string, shiftRemaining: boolean) => void;\n  onNotesChange: (value: string) => void;',
        'class phase15 prop type',
    )

if 'section === "calendar"' not in classes:
    classes = once(
        classes,
        '    {section === "support" && <div className="ttClassSection"><StaffTimetableInclusionProfile',
        '    {section === "calendar" && <div className="ttClassSection"><StaffTimetablePlanningCalendar plan={medium} readOnly={readOnly} onMove={(sourceId, targetId, shiftRemaining) => onMovePlannedLesson(className, sourceId, targetId, shiftRemaining)} onOpenLesson={onOpenPlan} /></div>}\n\n    {section === "support" && <div className="ttClassSection"><StaffTimetableInclusionProfile',
        'class phase15 mount',
    )

classes = classes.replace('PHASES 9–10, 12–13 · CLASS-SPECIFIC PLANNING', 'PHASES 9–10, 12–15 · CLASS-SPECIFIC PLANNING', 1)
class_path.write_text(classes)

# More-specific leadership route must be protected before the generic timetable route.
if '["/staff-timetable/leadership", "school:view"]' not in roles:
    roles = once(
        roles,
        '  ["/live-presenter", "cpd:manage"],\n  ["/staff-timetable", "develop:view"],',
        '  ["/live-presenter", "cpd:manage"],\n  ["/staff-timetable/leadership", "school:view"],\n  ["/staff-timetable", "develop:view"],',
        'phase14 leadership permission',
    )
roles_path.write_text(roles)

print('Integrated timetable Phases 14 and 15')
