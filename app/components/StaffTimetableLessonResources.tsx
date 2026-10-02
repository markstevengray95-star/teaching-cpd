"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import "./StaffTimetableLessonResources.css";

export type TimetableResourceKind =
  | "presentation"
  | "worksheet"
  | "quiz"
  | "retrieval"
  | "homework"
  | "exam-practice"
  | "knowledge-organiser";

export type TimetableAttachedResource = {
  id: string;
  kind: TimetableResourceKind;
  title: string;
  content: string;
  source: "ai" | "template";
  generatedAt: string;
};

type LessonContext = {
  subject: string;
  className: string;
  stage: string;
  examBoard: string;
  course: string;
  unit: string;
  subtopic: string;
  topic: string;
  objectives: string;
  vocabulary: string;
  sequence: string;
  assessment: string;
  retrieval: string;
  misconceptions: string;
  examPractice: string;
};

type ApiResource = Pick<TimetableAttachedResource, "kind" | "title" | "content">;

const OPTIONS: Array<{ kind: TimetableResourceKind; label: string; short: string }> = [
  { kind: "presentation", label: "Presentation", short: "Numbered slide content" },
  { kind: "worksheet", label: "Worksheet", short: "Tasks plus answer guide" },
  { kind: "quiz", label: "Quiz", short: "Low-stakes questions + answers" },
  { kind: "retrieval", label: "Retrieval starter", short: "Prerequisite + spaced recall" },
  { kind: "homework", label: "Homework", short: "Proportionate consolidation" },
  { kind: "exam-practice", label: "Exam practice", short: "Teacher-created exam-style tasks" },
  { kind: "knowledge-organiser", label: "Knowledge organiser", short: "Core knowledge + vocabulary" },
];

function fileName(title: string, kind: TimetableResourceKind) {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || kind;
  return `${safe}.txt`;
}

export default function StaffTimetableLessonResources({
  context,
  resources,
  readOnly,
  onChange,
}: {
  context: LessonContext;
  resources: TimetableAttachedResource[];
  readOnly: boolean;
  onChange: (resources: TimetableAttachedResource[]) => void;
}) {
  const [selected, setSelected] = useState<TimetableResourceKind[]>(["presentation", "worksheet", "quiz", "retrieval"]);
  const [requirements, setRequirements] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Choose the resources you want attached to this lesson.");
  const [openId, setOpenId] = useState<string | null>(resources[0]?.id || null);

  const byKind = useMemo(() => new Map(resources.map((item) => [item.kind, item])), [resources]);

  function toggle(kind: TimetableResourceKind) {
    setSelected((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]);
  }

  async function generate(kinds: TimetableResourceKind[]) {
    if (readOnly || busy || !kinds.length || !context.topic.trim()) return;
    setBusy(true);
    setStatus("Generating lesson resources…");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in again before generating resources.");

      const response = await fetch("/api/timetable-resource-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...context, kinds, teacherRequirements: requirements }),
      });
      const payload = await response.json().catch(() => ({})) as { resources?: ApiResource[]; source?: "ai" | "template"; error?: string };
      if (!response.ok || !Array.isArray(payload.resources)) throw new Error(payload.error || "The resource pack could not be generated.");

      const source = payload.source === "ai" ? "ai" : "template";
      const now = new Date().toISOString();
      const generated: TimetableAttachedResource[] = payload.resources.map((item) => ({
        id: `resource_${item.kind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: item.kind,
        title: item.title,
        content: item.content,
        source,
        generatedAt: now,
      }));
      const generatedKinds = new Set(generated.map((item) => item.kind));
      const next = [...resources.filter((item) => !generatedKinds.has(item.kind)), ...generated];
      onChange(next);
      setOpenId(generated[0]?.id || null);
      setStatus(source === "ai" ? `Generated ${generated.length} resource${generated.length === 1 ? "" : "s"} with AI.` : `Generated ${generated.length} resource${generated.length === 1 ? "" : "s"} using the built-in fallback.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Resources could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  function updateResource(id: string, patch: Partial<TimetableAttachedResource>) {
    onChange(resources.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function remove(id: string) {
    const next = resources.filter((item) => item.id !== id);
    onChange(next);
    if (openId === id) setOpenId(next[0]?.id || null);
  }

  async function copy(item: TimetableAttachedResource) {
    await navigator.clipboard.writeText(`${item.title}\n\n${item.content}`);
    setStatus(`${item.title} copied.`);
  }

  function download(item: TimetableAttachedResource) {
    const blob = new Blob([`${item.title}\n\n${item.content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName(item.title, item.kind);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const openResource = resources.find((item) => item.id === openId) || null;

  return (
    <section className="ttResourcePack">
      <div className="ttResourcePackHead">
        <div>
          <span>PHASE 5 · LESSON RESOURCES</span>
          <h3>Generate & attach resources</h3>
          <p>Create resources from this exact lesson plan. They stay attached when the lesson is saved and reopened.</p>
        </div>
        <div className="ttResourceCount"><strong>{resources.length}</strong><small>attached</small></div>
      </div>

      <div className="ttResourceOptions">
        {OPTIONS.map((option) => {
          const attached = byKind.has(option.kind);
          const checked = selected.includes(option.kind);
          return <button type="button" key={option.kind} disabled={readOnly} className={`${checked ? "selected" : ""} ${attached ? "attached" : ""}`} onClick={() => toggle(option.kind)}>
            <span>{checked ? "✓" : "+"}</span><div><b>{option.label}</b><small>{option.short}</small></div>{attached && <em>Attached</em>}
          </button>;
        })}
      </div>

      {!readOnly && <div className="ttResourceControls">
        <label><span>Optional resource requirements</span><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="e.g. worksheet should be accessible on one A4 page; quiz should focus on misconceptions; homework about 20 minutes…" /></label>
        <div className="ttResourceButtons">
          <button type="button" className="ttButton primary" disabled={busy || !selected.length || !context.topic.trim()} onClick={() => generate(selected)}>{busy ? "Generating…" : `Generate selected (${selected.length})`}</button>
          <button type="button" className="ttButton" disabled={busy || !context.topic.trim()} onClick={() => generate(OPTIONS.map((item) => item.kind))}>Generate full pack</button>
        </div>
      </div>}

      <div className="ttResourceStatus">{status}</div>

      {resources.length > 0 && <div className="ttResourceLibrary">
        <div className="ttResourceTabs">
          {resources.map((item) => <button type="button" key={item.id} className={openId === item.id ? "active" : ""} onClick={() => setOpenId(item.id)}>{OPTIONS.find((option) => option.kind === item.kind)?.label || item.kind}<small>{item.source === "ai" ? "AI" : "Fallback"}</small></button>)}
        </div>
        {openResource && <div className="ttResourceEditor">
          <div className="ttResourceEditorTop">
            <input disabled={readOnly} value={openResource.title} onChange={(event) => updateResource(openResource.id, { title: event.target.value })} />
            <div><button type="button" className="ttButton" onClick={() => copy(openResource)}>Copy</button><button type="button" className="ttButton" onClick={() => download(openResource)}>Download</button>{!readOnly && <button type="button" className="ttButton danger" onClick={() => remove(openResource.id)}>Remove</button>}</div>
          </div>
          <textarea disabled={readOnly} className="ttResourceContent" value={openResource.content} onChange={(event) => updateResource(openResource.id, { content: event.target.value })} />
          <small>Generated {new Date(openResource.generatedAt).toLocaleString("en-GB")} · {openResource.source === "ai" ? "AI generated" : "Built-in fallback"}. Review before classroom use.</small>
        </div>}
      </div>}
    </section>
  );
}
