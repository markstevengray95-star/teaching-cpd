"use client";

import "./StaffTimetableInclusionProfile.css";

export type ClassInclusionProfile = {
  strategies: string[];
  notes: string;
  updatedAt: string;
};

export const EMPTY_INCLUSION_PROFILE: ClassInclusionProfile = { strategies: [], notes: "", updatedAt: "" };

const GROUPS = [
  { title: "Universal access", items: ["Chunk instructions", "Written + spoken instructions", "Visual sequencing", "Worked/modelled examples", "Processing and rehearsal time", "Reduce unnecessary copying", "Predictable routines", "Check understanding privately", "Explicit success criteria", "Scaffold then fade"] },
  { title: "Language & EAL", items: ["Pre-teach key vocabulary", "Visuals / dual coding", "Model academic language", "Sentence stems", "Structured talk and rehearsal", "Clarify command words", "Allow thinking time before response"] },
  { title: "Task & environment", items: ["One step at a time", "Accessible task layout", "Reduce extraneous cognitive load", "Break longer tasks into checkpoints", "Use examples before abstraction", "Offer a clear finished model"] },
] as const;

export function buildClassSupportText(profile?: ClassInclusionProfile | null) {
  if (!profile || (!profile.strategies.length && !profile.notes.trim())) return "";
  const parts = profile.strategies.map((item) => `• ${item}`);
  if (profile.notes.trim()) parts.push(`• Class planning note: ${profile.notes.trim()}`);
  return `Class access strategies\n${parts.join("\n")}`;
}

export default function StaffTimetableInclusionProfile({ className, profile, readOnly, onChange, onApplyToLesson }: { className: string; profile?: ClassInclusionProfile; readOnly: boolean; onChange: (profile: ClassInclusionProfile) => void; onApplyToLesson?: () => void }) {
  const value = profile || EMPTY_INCLUSION_PROFILE;
  function toggle(strategy: string) {
    if (readOnly) return;
    const exists = value.strategies.includes(strategy);
    onChange({ ...value, strategies: exists ? value.strategies.filter((item) => item !== strategy) : [...value.strategies, strategy], updatedAt: new Date().toISOString() });
  }
  return <section className="ttInclusionProfile">
    <div className="ttInclusionHead"><div><span>PHASE 12 · SEND / EAL-AWARE PLANNING</span><h3>Class access profile</h3><p>Choose generic strategies that help this class access the same core learning. These can then be added to individual lesson plans.</p></div><div><strong>{value.strategies.length}</strong><small>strategies</small></div></div>
    <div className="ttInclusionPrivacy"><strong>Keep this generic.</strong><span>Do not enter pupil names, diagnoses, medical information, EHCP details or individual case notes here. Use the school&apos;s approved SEND/MIS systems for sensitive records.</span></div>
    <div className="ttInclusionGroups">{GROUPS.map((group) => <div key={group.title}><h4>{group.title}</h4><div>{group.items.map((item) => <button type="button" key={item} disabled={readOnly} className={value.strategies.includes(item) ? "selected" : ""} onClick={() => toggle(item)}><span>{value.strategies.includes(item) ? "✓" : "+"}</span>{item}</button>)}</div></div>)}</div>
    <label className="ttInclusionNotes"><span>Optional class-level planning note</span><textarea disabled={readOnly} value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value, updatedAt: new Date().toISOString() })} placeholder="e.g. give vocabulary before extended reading; keep multi-step practical instructions visible on the board…" /></label>
    {onApplyToLesson && <div className="ttInclusionActions"><button type="button" className="ttButton primary" disabled={readOnly || (!value.strategies.length && !value.notes.trim())} onClick={onApplyToLesson}>Apply class support to this lesson</button></div>}
  </section>;
}
