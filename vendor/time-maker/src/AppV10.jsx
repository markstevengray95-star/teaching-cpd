import { saveSchool } from './schoolStorage.js';
import React, { useEffect, useState } from 'react';
import AppV6 from './AppV6.jsx';
import AssistantManager from './AssistantManager.jsx';
import GeneratorManager from './GeneratorManager.jsx';
import ReviewManager from './ReviewManager.jsx';
import EditorManager from './EditorManager.jsx';
import { buildDemoData as buildBaseDemoData } from './demoData.js';
import { demoStaff26 } from './demoData26.js';
import { KEY } from './timetableCore.js';

function loadData() {
  try { const saved = localStorage.getItem(KEY); return saved ? JSON.parse(saved) : {}; }
  catch { return {}; }
}

const toolComponents = { assistant: AssistantManager, generator: GeneratorManager, review: ReviewManager, editor: EditorManager };
const DEMOS = [
  { id: 'small', label: 'Small school', staff: 18, pupils: '300–500', note: 'Compact staffing model' },
  { id: 'medium', label: 'Medium school', staff: 40, pupils: '600–900', note: 'Typical secondary scale' },
  { id: 'large', label: 'Large school', staff: 75, pupils: '1,000–1,500', note: 'Large departments & specialists' },
  { id: 'very-large', label: 'Very large school', staff: 120, pupils: '1,500+', note: 'High-volume stress test' },
];
const DEPTS = [
  ['Science',['Science','Biology','Chemistry','Physics']],['Mathematics',['Mathematics','Maths']],['English',['English']],
  ['Humanities',['History','Geography']],['Languages',['French','Spanish']],['PE',['PE']],['Arts',['Art','Music','Drama']],
  ['Technology',['Design Technology','Computing']],['SEND',['SEND','Learning Support']],['Sixth Form',['Psychology','PSHE']],
];
const PATTERNS = [
  [1,24,{mon:true,tue:true,wed:true,thu:true,fri:true},'Full time'],
  [.8,19,{mon:true,tue:true,wed:true,thu:true,fri:false},'Part time · 4 days'],
  [.8,19,{mon:false,tue:true,wed:true,thu:true,fri:true},'Part time · 4 days'],
  [.6,15,{mon:true,tue:true,wed:true,thu:false,fri:false},'Part time · 3 days'],
  [.6,15,{mon:false,tue:false,wed:true,thu:true,fri:true},'Part time · 3 days'],
  [.4,10,{mon:true,tue:true,wed:false,thu:false,fri:false},'Part time · 2 days'],
];

function scaledStaff(count) {
  const people = demoStaff26.map((person) => ({ ...person, subjects: [...(person.subjects || [])], availability: { ...(person.availability || {}) } }));
  while (people.length < count) {
    const index = people.length - demoStaff26.length;
    const number = people.length + 1;
    const [department, subjects] = DEPTS[index % DEPTS.length];
    const [fte, maxPeriods, availability, note] = PATTERNS[index % PATTERNS.length];
    people.push({
      id: `demo-scale-${number}`, name: `Demo Teacher ${number}`, initials: `D${number}`, department, subjects: subjects.slice(0,2), fte, maxPeriods,
      ppaPeriods: fte >= 1 ? 4 : fte >= .8 ? 3 : fte >= .6 ? 2 : 1, leadershipPeriods: index % 15 === 0 ? 2 : 0,
      maxDaily: 5, maxConsecutive: 4, availability: { ...availability }, notes: `${note}${index % 15 === 0 ? ' · Department responsibility' : ''}`,
    });
  }
  return people.slice(0,count);
}

function buildScaledDemo(profile) {
  const base = buildBaseDemoData();
  return { ...base, school: { ...base.school, name: `Oakfield Academy · ${profile.label} Demo` }, staff: scaledStaff(profile.staff), demoProfile: { ...profile, fictional: true } };
}

function ToolScreen({ mode, onBack }) {
  const [data, setData] = useState(loadData);
  const Tool = toolComponents[mode];
  useEffect(() => { saveSchool(data); }, [data]);
  return <Tool data={data} setData={setData} onBack={onBack} />;
}

export default function AppV10() {
  const [mode, setMode] = useState('builder');
  const [revision, setRevision] = useState(0);
  const [showDemos, setShowDemos] = useState(false);

  function returnToBuilder() { setMode('builder'); setRevision((value) => value + 1); }
  function loadDemo(profile) {
    const current = loadData();
    const hasCurrent = Boolean(current.school?.name || current.staff?.length || current.classes?.length || current.curriculumRequirements?.length);
    if (hasCurrent && !window.confirm(`Load the ${profile.label.toLowerCase()} demo? This replaces the timetable draft currently saved for this school.`)) return;
    saveSchool(buildScaledDemo(profile));
    setShowDemos(false);
    setRevision((value) => value + 1);
  }

  if (mode !== 'builder') return <ToolScreen mode={mode} onBack={returnToBuilder} />;

  return <div className="builder-workspace">
    <section className="builder-tool-strip" aria-label="Timetable build tools">
      <div className="builder-tool-intro"><span>BUILD TOOLS</span><strong>Create, check and improve your timetable</strong><small>Complete the setup on the left, then generate, review or edit when ready.</small></div>
      <div className="builder-tool-actions">
        <button className="primary" onClick={() => setMode('generator')}>Generate timetable</button>
        <button className="secondary" onClick={() => setMode('review')}>Review & optimise</button>
        <button className="secondary" onClick={() => setMode('editor')}>Visual editor</button>
        <button className="secondary" onClick={() => setMode('assistant')}>AI assistant</button>
        <button className="text-button builder-demo-link" onClick={() => setShowDemos((value) => !value)}>Try a demo school ▾</button>
      </div>
    </section>
    {showDemos && <section className="builder-demo-picker" aria-label="Demo school sizes">
      <div><span className="eyebrow">FICTIONAL DEMO DATA</span><h2>Choose a school size</h2><p>Load a realistic staffing dataset without using any real staff or pupil information.</p></div>
      <div className="builder-demo-grid">{DEMOS.map((profile) => <button key={profile.id} className="builder-demo-card" onClick={() => loadDemo(profile)}>
        <strong>{profile.label}</strong><span>{profile.staff} staff · {profile.pupils} pupils</span><small>{profile.note}</small>
      </button>)}</div>
    </section>}
    <AppV6 key={revision} />
  </div>;
}
