"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Staff = { id: string; full_name: string; role: string };
type CourseRow = { id: string; slug: string; title: string; category: string; summary: string; duration_minutes: number; level: "Foundation" | "Developing" | "Advanced"; objectives: string[]; recommended_for: string[]; status: "draft" | "published" | "archived"; current_version_id: string | null; current_version_number: number };
type VersionRow = { id: string; course_id: string; version_number: number; title: string; summary: string; duration_minutes: number; level: "Foundation" | "Developing" | "Advanced"; objectives: string[]; recommended_for: string[]; status: "draft" | "published" | "superseded"; created_by: string; published_at: string | null };
type BlockType = "text" | "image" | "video" | "quiz" | "scenario" | "poll" | "reflection" | "action_plan" | "download";
type BlockRow = { id: string; version_id: string; sort_order: number; block_type: BlockType; title: string; content: Record<string, unknown>; required: boolean };

const palette: { type: BlockType; label: string }[] = [
  { type: "text", label: "Text" }, { type: "image", label: "Image" }, { type: "video", label: "Video" },
  { type: "quiz", label: "Quiz" }, { type: "scenario", label: "Scenario" }, { type: "poll", label: "Poll" },
  { type: "reflection", label: "Reflection" }, { type: "action_plan", label: "Action plan" }, { type: "download", label: "Download" },
];

export default function BuilderPage() {
  const [me, setMe] = useState<Staff | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [version, setVersion] = useState<VersionRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient(); if (!client) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/builder"; return; }
      const { data: profile, error } = await client.from("staff_profiles").select("id,full_name,role").eq("id", auth.user.id).single();
      if (!active) return;
      if (error || !profile) { setMessage(error?.message || "Unable to load profile."); setLoading(false); return; }
      setMe(profile as Staff);
      if (!["CPD Lead","Admin"].includes(profile.role)) { setLoading(false); return; }
      const { data, error: courseError } = await client.from("custom_courses").select("id,slug,title,category,summary,duration_minutes,level,objectives,recommended_for,status,current_version_id,current_version_number").order("updated_at", { ascending: false });
      if (!active) return;
      if (courseError) setMessage(courseError.message);
      setCourses((data || []) as CourseRow[]); setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  async function chooseCourse(course: CourseRow) {
    setSelectedCourse(course); setMessage(""); setVersion(null); setBlocks([]);
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { data, error } = await client.from("custom_course_versions").select("id,course_id,version_number,title,summary,duration_minutes,level,objectives,recommended_for,status,created_by,published_at").eq("course_id", course.id).order("version_number", { ascending: false });
    if (error) { setMessage(error.message); return; }
    const rows = (data || []) as VersionRow[]; setVersions(rows);
    const preferred = rows.find(v => v.status === "draft") || rows[0] || null;
    if (preferred) await chooseVersion(preferred, rows);
  }

  async function chooseVersion(next: VersionRow, knownVersions = versions) {
    setVersions(knownVersions); setVersion(next);
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { data, error } = await client.from("custom_course_blocks").select("id,version_id,sort_order,block_type,title,content,required").eq("version_id", next.id).order("sort_order");
    if (error) setMessage(error.message); else setBlocks((data || []) as BlockRow[]);
  }

  async function createCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!me) return;
    const client = getSupabaseBrowserClient(); if (!client) return;
    const form = new FormData(e.currentTarget); const title = String(form.get("title") || "").trim();
    const slug = slugify(String(form.get("slug") || "") || title);
    const base = { title, summary: String(form.get("summary") || ""), duration_minutes: Number(form.get("duration_minutes") || 30), level: String(form.get("level") || "Foundation"), objectives: lines(String(form.get("objectives") || "")), recommended_for: lines(String(form.get("recommended_for") || "")) };
    setSaving(true);
    const { data: course, error } = await client.from("custom_courses").insert({ slug, category: String(form.get("category") || "Teaching & Learning"), ...base, created_by: me.id }).select("id,slug,title,category,summary,duration_minutes,level,objectives,recommended_for,status,current_version_id,current_version_number").single();
    if (error || !course) { setSaving(false); setMessage(error?.message || "Course could not be created."); return; }
    const { data: v, error: versionError } = await client.from("custom_course_versions").insert({ course_id: course.id, version_number: 1, ...base, created_by: me.id }).select("id,course_id,version_number,title,summary,duration_minutes,level,objectives,recommended_for,status,created_by,published_at").single();
    setSaving(false);
    if (versionError || !v) { setMessage(versionError?.message || "Initial version could not be created."); return; }
    const c = course as CourseRow; const vr = v as VersionRow; setCourses(prev => [c, ...prev]); setSelectedCourse(c); setVersions([vr]); setVersion(vr); setBlocks([]); setShowCreate(false); setMessage("Draft course created. Add content blocks, then publish when ready.");
  }

  async function saveVersionMetadata(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!version) return;
    const client = getSupabaseBrowserClient(); if (!client) return; const form = new FormData(e.currentTarget);
    const patch = { title: String(form.get("title") || ""), summary: String(form.get("summary") || ""), duration_minutes: Number(form.get("duration_minutes") || 30), level: String(form.get("level") || "Foundation"), objectives: lines(String(form.get("objectives") || "")), recommended_for: lines(String(form.get("recommended_for") || "")) };
    setSaving(true); const { data, error } = await client.from("custom_course_versions").update(patch).eq("id", version.id).select("id,course_id,version_number,title,summary,duration_minutes,level,objectives,recommended_for,status,created_by,published_at").single(); setSaving(false);
    if (error || !data) { setMessage(error?.message || "Could not save course details."); return; }
    const updated = data as VersionRow; setVersion(updated); setVersions(prev => prev.map(v => v.id === updated.id ? updated : v)); setMessage("Draft details saved.");
  }

  async function addBlock(type: BlockType) {
    if (!version || version.status !== "draft") { setMessage("Create or select a draft version before editing blocks."); return; }
    const client = getSupabaseBrowserClient(); if (!client) return;
    const content = defaultContent(type); const title = palette.find(p => p.type === type)?.label || "Block";
    const { data, error } = await client.from("custom_course_blocks").insert({ version_id: version.id, sort_order: blocks.length, block_type: type, title, content, required: true }).select("id,version_id,sort_order,block_type,title,content,required").single();
    if (error || !data) setMessage(error?.message || "Could not add block."); else setBlocks(prev => [...prev, data as BlockRow]);
  }

  function patchBlock(id: string, patch: Partial<BlockRow>) { setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function patchContent(id: string, key: string, value: unknown) { setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b)); }

  async function saveBlock(block: BlockRow) {
    const client = getSupabaseBrowserClient(); if (!client) return; setSaving(true);
    const { error } = await client.from("custom_course_blocks").update({ title: block.title, content: block.content, required: block.required, updated_at: new Date().toISOString() }).eq("id", block.id); setSaving(false);
    setMessage(error ? error.message : `${block.title || "Block"} saved.`);
  }

  async function deleteBlock(block: BlockRow) {
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { error } = await client.from("custom_course_blocks").delete().eq("id", block.id);
    if (error) { setMessage(error.message); return; }
    const remaining = blocks.filter(b => b.id !== block.id).map((b,i) => ({ ...b, sort_order: i })); setBlocks(remaining);
    await Promise.all(remaining.map(b => client.from("custom_course_blocks").update({ sort_order: b.sort_order }).eq("id", b.id)));
  }

  async function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction; if (target < 0 || target >= blocks.length) return;
    const client = getSupabaseBrowserClient(); if (!client) return;
    const next = [...blocks]; const a = next[index]; const b = next[target]; next[index] = { ...b, sort_order: index }; next[target] = { ...a, sort_order: target }; setBlocks(next);
    await Promise.all([client.from("custom_course_blocks").update({ sort_order: target }).eq("id", a.id), client.from("custom_course_blocks").update({ sort_order: index }).eq("id", b.id)]);
  }

  async function newVersion() {
    if (!me || !selectedCourse || !version) return;
    const client = getSupabaseBrowserClient(); if (!client) return;
    const number = Math.max(...versions.map(v => v.version_number), 0) + 1;
    const { data, error } = await client.from("custom_course_versions").insert({ course_id: selectedCourse.id, version_number: number, title: version.title, summary: version.summary, duration_minutes: version.duration_minutes, level: version.level, objectives: version.objectives, recommended_for: version.recommended_for, created_by: me.id }).select("id,course_id,version_number,title,summary,duration_minutes,level,objectives,recommended_for,status,created_by,published_at").single();
    if (error || !data) { setMessage(error?.message || "Could not create version."); return; }
    const nextVersion = data as VersionRow;
    let copied: BlockRow[] = [];
    if (blocks.length) {
      const rows = blocks.map((b,i) => ({ version_id: nextVersion.id, sort_order: i, block_type: b.block_type, title: b.title, content: b.content, required: b.required }));
      const { data: blockData, error: blockError } = await client.from("custom_course_blocks").insert(rows).select("id,version_id,sort_order,block_type,title,content,required");
      if (blockError) { setMessage(blockError.message); return; } copied = (blockData || []) as BlockRow[];
    }
    setVersions(prev => [nextVersion, ...prev]); setVersion(nextVersion); setBlocks(copied.sort((x,y) => x.sort_order-y.sort_order)); setMessage(`Version ${number} created as a draft.`);
  }

  async function publish() {
    if (!selectedCourse || !version) return; if (!blocks.length) { setMessage("Add at least one content block before publishing."); return; }
    const client = getSupabaseBrowserClient(); if (!client) return; setSaving(true);
    const { error } = await client.rpc("publish_custom_course", { p_course_id: selectedCourse.id, p_version_id: version.id }); setSaving(false);
    if (error) { setMessage(error.message); return; }
    const nextCourse: CourseRow = { ...selectedCourse, title: version.title, summary: version.summary, duration_minutes: version.duration_minutes, level: version.level, objectives: version.objectives, recommended_for: version.recommended_for, status: "published", current_version_id: version.id, current_version_number: version.version_number };
    const nextVersion: VersionRow = { ...version, status: "published", published_at: version.published_at || new Date().toISOString() };
    setSelectedCourse(nextCourse); setCourses(prev => prev.map(c => c.id === nextCourse.id ? nextCourse : c)); setVersion(nextVersion); setVersions(prev => prev.map(v => v.id === nextVersion.id ? nextVersion : v.status === "published" ? { ...v, status: "superseded" } : v)); setMessage(`Version ${version.version_number} published. Staff can now open the course.`);
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Loading course creator…</div></main>;
  if (!me || !["CPD Lead","Admin"].includes(me.role)) return <main className="stagePage"><section className="stageCard"><h1>CPD Lead or Admin access required</h1><p>Only authorised CPD staff can create or publish school courses.</p></section></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">VISUAL COURSE CREATOR</span><h1>Build school CPD without editing code.</h1><p>Create a draft, add reusable learning blocks, preview the structure, then publish a version when it is ready. Publishing never edits the previous version in place.</p><div className="stageHeroActions"><button className="primary" onClick={() => setShowCreate(true)}>New course</button><a href="/admin" className="secondary phaseLinkButton">CPD administration</a>{selectedCourse?.status === "published" && <a href={`/custom/${selectedCourse.slug}`} className="secondary phaseLinkButton">Open published course</a>}</div></section>
    {message && <div className="phaseNotice">{message}</div>}
    {showCreate && <details className="stageDetails" open><summary>Create a new school course</summary><form className="stageForm" onSubmit={createCourse}><div className="stageFormGrid"><label>Title<input required name="title" /></label><label>URL slug<input name="slug" placeholder="Generated from title if blank" /></label><label>Category<input name="category" defaultValue="Teaching & Learning" /></label><label>Level<select name="level"><option>Foundation</option><option>Developing</option><option>Advanced</option></select></label><label>Duration (minutes)<input name="duration_minutes" type="number" min="1" defaultValue="30" /></label><label className="full">Summary<textarea name="summary" rows={3} /></label><label className="full">Objectives<textarea name="objectives" rows={4} placeholder="One objective per line" /></label><label className="full">Recommended for<textarea name="recommended_for" rows={3} placeholder="One audience per line" /></label></div><div className="phaseActions"><button className="primary" disabled={saving}>Create draft</button><button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button></div></form></details>}

    <section className="builderLayout">
      <aside className="stageCard builderSidebar"><span className="eyebrow">SCHOOL COURSES</span><h2>{courses.length} courses</h2>{courses.map(c => <button key={c.id} className={`builderCourseButton ${selectedCourse?.id === c.id ? "active" : ""}`} onClick={() => chooseCourse(c)}><strong>{c.title}</strong><span>{c.status} · v{c.current_version_number}</span></button>)}{!courses.length && <div className="emptyCompact">Create your first school course.</div>}</aside>
      <div>
        {!selectedCourse || !version ? <div className="stageCard"><div className="emptyCompact">Select a course or create a new one to start editing.</div></div> : <>
          <div className="stageCard">
            <div className="builderToolbar"><div><span className="stageBadge info">Course: {selectedCourse.status}</span><span className={`stageBadge ${version.status === "published" ? "good" : version.status === "draft" ? "warn" : "info"}`}>Version {version.version_number}: {version.status}</span></div><div>{version.status !== "draft" && <button className="secondary" onClick={newVersion}>Create new version</button>}{version.status === "draft" && <button className="primary" disabled={saving} onClick={publish}>Publish version</button>}</div></div>
            <div className="stageTabs">{versions.map(v => <button key={v.id} className={version.id === v.id ? "active" : ""} onClick={() => chooseVersion(v)}>v{v.version_number} · {v.status}</button>)}</div>
            <form className="stageForm" onSubmit={saveVersionMetadata}><div className="stageFormGrid"><label>Title<input name="title" defaultValue={version.title} disabled={version.status !== "draft"} /></label><label>Level<select name="level" defaultValue={version.level} disabled={version.status !== "draft"}><option>Foundation</option><option>Developing</option><option>Advanced</option></select></label><label>Duration (minutes)<input name="duration_minutes" type="number" min="1" defaultValue={version.duration_minutes} disabled={version.status !== "draft"} /></label><label className="full">Summary<textarea name="summary" rows={3} defaultValue={version.summary} disabled={version.status !== "draft"} /></label><label className="full">Objectives<textarea name="objectives" rows={4} defaultValue={version.objectives.join("\n")} disabled={version.status !== "draft"} /></label><label className="full">Recommended for<textarea name="recommended_for" rows={3} defaultValue={version.recommended_for.join("\n")} disabled={version.status !== "draft"} /></label></div>{version.status === "draft" && <button className="secondary" disabled={saving}>Save course details</button>}</form>
          </div>

          <div className="stageCard" style={{marginTop:16}}><div className="builderToolbar"><div><span className="eyebrow">CONTENT BLOCKS</span><strong>{blocks.length} blocks</strong></div></div>{version.status === "draft" && <div className="blockPalette">{palette.map(p => <button key={p.type} onClick={() => addBlock(p.type)}>+ {p.label}</button>)}</div>}{blocks.map((block,index) => <BlockEditor key={block.id} block={block} index={index} editable={version.status === "draft"} onPatch={patchBlock} onContent={patchContent} onSave={saveBlock} onDelete={deleteBlock} onMove={moveBlock} />)}{!blocks.length && <div className="emptyCompact">Add a text, quiz, scenario, reflection or other block to begin building the course.</div>}</div>
        </>}
      </div>
    </section>
  </main>;
}

function BlockEditor({ block, index, editable, onPatch, onContent, onSave, onDelete, onMove }: { block: BlockRow; index: number; editable: boolean; onPatch: (id:string, patch:Partial<BlockRow>) => void; onContent: (id:string,key:string,value:unknown) => void; onSave:(b:BlockRow)=>void; onDelete:(b:BlockRow)=>void; onMove:(i:number,d:-1|1)=>void }) {
  const c = block.content;
  return <article className="blockEditor"><div className="blockEditorHead"><div><span className="blockNumber">{index+1}</span><span className="stageBadge info">{block.block_type.replaceAll("_"," ")}</span></div>{editable && <div className="blockActions"><button onClick={() => onMove(index,-1)} disabled={index===0}>↑</button><button onClick={() => onMove(index,1)}>↓</button><button className="dangerText" onClick={() => onDelete(block)}>Delete</button></div>}</div><div className="blockEditorGrid"><label className="full">Block title<input value={block.title} disabled={!editable} onChange={e => onPatch(block.id,{title:e.target.value})} /></label>{block.block_type === "text" && <label className="full">Teaching content<textarea rows={7} disabled={!editable} value={str(c.body)} onChange={e => onContent(block.id,"body",e.target.value)} /></label>}{block.block_type === "image" && <><label>Image URL<input disabled={!editable} value={str(c.url)} onChange={e => onContent(block.id,"url",e.target.value)} /></label><label>Alt text<input disabled={!editable} value={str(c.alt)} onChange={e => onContent(block.id,"alt",e.target.value)} /></label><label className="full">Caption<input disabled={!editable} value={str(c.caption)} onChange={e => onContent(block.id,"caption",e.target.value)} /></label></>}{block.block_type === "video" && <><label className="full">Video/resource URL<input disabled={!editable} value={str(c.url)} onChange={e => onContent(block.id,"url",e.target.value)} /></label><label className="full">Caption<input disabled={!editable} value={str(c.caption)} onChange={e => onContent(block.id,"caption",e.target.value)} /></label></>}{block.block_type === "quiz" && <><label className="full">Question<textarea rows={3} disabled={!editable} value={str(c.question)} onChange={e => onContent(block.id,"question",e.target.value)} /></label><label className="full">Options — one per line<textarea rows={5} disabled={!editable} value={arr(c.options).join("\n")} onChange={e => onContent(block.id,"options",lines(e.target.value))} /></label><label>Correct option number<input type="number" min="1" disabled={!editable} value={Number(c.answer ?? 0)+1} onChange={e => onContent(block.id,"answer",Math.max(0,Number(e.target.value)-1))} /></label><label>Feedback<input disabled={!editable} value={str(c.feedback)} onChange={e => onContent(block.id,"feedback",e.target.value)} /></label></>}{block.block_type === "scenario" && <><label className="full">Scenario<textarea rows={4} disabled={!editable} value={str(c.prompt)} onChange={e => onContent(block.id,"prompt",e.target.value)} /></label><label className="full">Choices — use Choice | Feedback, one per line<textarea rows={6} disabled={!editable} value={scenarioLines(c.options).join("\n")} onChange={e => onContent(block.id,"options",parseScenario(e.target.value))} /></label></>}{block.block_type === "poll" && <><label className="full">Poll question<textarea rows={3} disabled={!editable} value={str(c.prompt)} onChange={e => onContent(block.id,"prompt",e.target.value)} /></label><label className="full">Options — one per line<textarea rows={5} disabled={!editable} value={arr(c.options).join("\n")} onChange={e => onContent(block.id,"options",lines(e.target.value))} /></label></>}{block.block_type === "reflection" && <label className="full">Reflection prompt<textarea rows={4} disabled={!editable} value={str(c.prompt)} onChange={e => onContent(block.id,"prompt",e.target.value)} /></label>}{block.block_type === "action_plan" && <><label className="full">Action prompt<textarea rows={3} disabled={!editable} value={str(c.prompt)} onChange={e => onContent(block.id,"prompt",e.target.value)} /></label><label className="full">Intended-outcome prompt<input disabled={!editable} value={str(c.outcomePrompt)} onChange={e => onContent(block.id,"outcomePrompt",e.target.value)} /></label></>}{block.block_type === "download" && <><label>Resource URL<input disabled={!editable} value={str(c.url)} onChange={e => onContent(block.id,"url",e.target.value)} /></label><label>Button label<input disabled={!editable} value={str(c.label)} onChange={e => onContent(block.id,"label",e.target.value)} /></label></>}<label><span><input type="checkbox" style={{width:"auto",marginRight:7}} checked={block.required} disabled={!editable} onChange={e => onPatch(block.id,{required:e.target.checked})} />Required for completion</span></label></div>{editable && <button className="secondary" onClick={() => onSave(block)}>Save block</button>}</article>;
}

function defaultContent(type: BlockType): Record<string, unknown> {
  if (type === "text") return { body: "Add the key professional learning here." };
  if (type === "image") return { url: "", alt: "", caption: "" };
  if (type === "video") return { url: "", caption: "" };
  if (type === "quiz") return { question: "", options: ["Option 1","Option 2"], answer: 0, feedback: "" };
  if (type === "scenario") return { prompt: "", options: [{label:"Choice 1",feedback:""},{label:"Choice 2",feedback:""}] };
  if (type === "poll") return { prompt: "", options: ["Option 1","Option 2"] };
  if (type === "reflection") return { prompt: "How will this influence your practice?" };
  if (type === "action_plan") return { prompt: "What will you try in practice?", outcomePrompt: "What outcome are you hoping to see?" };
  return { url: "", label: "Open resource" };
}
function str(value: unknown) { return typeof value === "string" ? value : ""; }
function arr(value: unknown) { return Array.isArray(value) ? value.map(String) : []; }
function lines(value: string) { return value.split("\n").map(x => x.trim()).filter(Boolean); }
function scenarioLines(value: unknown) { return Array.isArray(value) ? value.map(v => { const item = v as {label?:string;feedback?:string}; return `${item.label || ""} | ${item.feedback || ""}`.trim(); }) : []; }
function parseScenario(value: string) { return lines(value).map(line => { const [label,...rest] = line.split("|"); return { label: label.trim(), feedback: rest.join("|").trim() }; }); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80) || `course-${Date.now()}`; }
