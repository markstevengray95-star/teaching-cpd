import { saveSchool } from './schoolStorage.js';
import React, { useEffect, useState } from 'react';
import AppV6 from './AppV6.jsx';
import AssistantManager from './AssistantManager.jsx';
import GeneratorManager from './GeneratorManager.jsx';
import ReviewManager from './ReviewManager.jsx';
import EditorManager from './EditorManager.jsx';
import { buildDemoData26 } from './demoData26.js';
import { KEY } from './timetableCore.js';

function loadData() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

const toolComponents = {
  assistant: AssistantManager,
  generator: GeneratorManager,
  review: ReviewManager,
  editor: EditorManager,
};

function ToolScreen({ mode, onBack }) {
  const [data, setData] = useState(loadData);
  const Tool = toolComponents[mode];
  useEffect(() => { saveSchool(data); }, [data]);
  return <Tool data={data} setData={setData} onBack={onBack} />;
}

export default function AppV10() {
  const [mode, setMode] = useState('builder');
  const [revision, setRevision] = useState(0);

  function returnToBuilder() {
    setMode('builder');
    setRevision((value) => value + 1);
  }

  function loadDemo() {
    const current = loadData();
    const hasCurrent = Boolean(current.school?.name || current.staff?.length || current.classes?.length || current.curriculumRequirements?.length);
    if (hasCurrent && !window.confirm('Load the demo school? This replaces the timetable draft currently saved for this school.')) return;
    saveSchool(buildDemoData26());
    setRevision((value) => value + 1);
  }

  if (mode !== 'builder') return <ToolScreen mode={mode} onBack={returnToBuilder} />;

  return <div className="builder-workspace">
    <section className="builder-tool-strip" aria-label="Timetable build tools">
      <div className="builder-tool-intro">
        <span>BUILD TOOLS</span>
        <strong>Create, check and improve your timetable</strong>
        <small>Complete the setup on the left, then generate, review or edit when ready.</small>
      </div>
      <div className="builder-tool-actions">
        <button className="primary" onClick={() => setMode('generator')}>Generate timetable</button>
        <button className="secondary" onClick={() => setMode('review')}>Review & optimise</button>
        <button className="secondary" onClick={() => setMode('editor')}>Visual editor</button>
        <button className="secondary" onClick={() => setMode('assistant')}>AI assistant</button>
        <button className="text-button builder-demo-link" onClick={loadDemo}>Load 26-staff demo school</button>
      </div>
    </section>
    <AppV6 key={revision} />
  </div>;
}
