import React, { useMemo, useState } from 'react';
import AppV10 from './AppV10.jsx';
import IssuesScreen from './IssuesScreen.jsx';
import WorkloadScreen from './WorkloadScreen.jsx';
import PlanningScreen from './PlanningScreen.jsx';
import OptionsScreen from './OptionsScreen.jsx';
import CoverScreen from './CoverScreen.jsx';
import TodayScreen from './TodayScreen.jsx';
import StaffPortalScreen from './StaffPortalScreen.jsx';
import StudentPortalScreen from './StudentPortalScreen.jsx';
import DepartmentScreen from './DepartmentScreen.jsx';
import ExchangeScreen from './ExchangeScreen.jsx';
import { KEY, activeTimetable } from './timetableCore.js';

const screens = {
  issues: ['Timetable issues', IssuesScreen],
  workload: ['Staff workload', WorkloadScreen],
  planning: ['Curriculum planning', PlanningScreen],
  options: ['Option blocks', OptionsScreen],
  cover: ['Cover', CoverScreen],
  today: ['Today', TodayScreen],
  'staff-portal': ['Staff portal', StaffPortalScreen],
  'student-portal': ['Student timetable', StudentPortalScreen],
  departments: ['Departments', DepartmentScreen],
  exchange: ['Import & export', ExchangeScreen],
};

const baseGroups = [
  { id: 'build', label: 'Build', hint: 'Set up and create', pages: [['builder', 'Timetable builder'], ['planning', 'Curriculum planning'], ['options', 'Option blocks']] },
  { id: 'review', label: 'Review', hint: 'Check and balance', pages: [['issues', 'Issues'], ['workload', 'Workload']] },
  { id: 'daily', label: 'Daily', hint: 'Run the day', pages: [['today', 'Today'], ['cover', 'Cover']] },
  { id: 'people', label: 'People', hint: 'Staff and departments', pages: [['staff-portal', 'Staff portal'], ['student-portal', 'Student timetable'], ['departments', 'Departments']] },
  { id: 'data', label: 'Data', hint: 'Move information', pages: [['exchange', 'Import & export']] },
];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export default function OperationsApp({ serverSession, onSync, embedded = false }) {
  const groups = useMemo(() => embedded
    ? baseGroups.map((group) => group.id === 'people' ? { ...group, pages: group.pages.filter(([key]) => !['staff-portal', 'student-portal'].includes(key)) } : group).filter((group) => group.pages.length)
    : baseGroups, [embedded]);
  const [page, setPage] = useState('builder');
  const [data, setState] = useState(load);
  const [revision, setRevision] = useState(0);
  const [saveError, setSaveError] = useState('');

  function setData(update) {
    const next = typeof update === 'function' ? update(data) : update;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaveError('');
    } catch {
      setSaveError('Browser storage is full. Export a backup before closing.');
    }
    setState(next);
    if (onSync) onSync(next).catch((error) => setSaveError(error.message));
  }

  function navigate(next) {
    if (next !== 'builder') {
      const saved = load();
      setState(saved);
      if (onSync) onSync(saved).catch((error) => setSaveError(error.message));
    }
    if (next === 'builder') setRevision((value) => value + 1);
    setPage(next);
  }

  const activeGroup = useMemo(() => groups.find((group) => group.pages.some(([key]) => key === page)) || groups[0], [groups, page]);
  const current = screens[page];
  const Screen = current?.[1];
  const schoolName = data.school?.name || 'Set up your school';
  const timetableName = activeTimetable(data)?.name || 'No active timetable';

  return <div className="ops-shell">
    <header className="ops-header">
      <div className="ops-brand-block">
        <div className="ops-brand-mark">TM</div>
        <div><strong>School Timetable</strong><small>Teaching CPD</small></div>
      </div>
      <nav className="ops-primary-nav" aria-label="Main timetable areas">
        {groups.map((group) => <button key={group.id} className={activeGroup.id === group.id ? 'active' : ''} onClick={() => navigate(group.pages[0][0])}>
          <span>{group.label}</span><small>{group.hint}</small>
        </button>)}
      </nav>
      <div className="ops-school-state"><strong>{schoolName}</strong><small>{timetableName}</small></div>
    </header>

    {activeGroup.pages.length > 1 && <nav className="ops-subnav" aria-label={`${activeGroup.label} tools`}>
      {activeGroup.pages.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => navigate(key)}>{label}</button>)}
    </nav>}

    {page === 'builder'
      ? <AppV10 key={revision} />
      : <main className="ops-main">
          <div className="page-title"><div><h1>{current[0]}</h1><p>{schoolName} · {timetableName}</p></div></div>
          {saveError && <p role="alert" className="ops-error">{saveError}</p>}
          <Screen data={data} setData={setData} serverSession={serverSession} onSync={onSync} />
          <footer className="app-footer">{embedded ? 'School draft saves to Teaching CPD. Publish and sync from the school controls above.' : serverSession ? 'Connected school server' : 'School data saves in this browser.'}</footer>
        </main>}
  </div>;
}
