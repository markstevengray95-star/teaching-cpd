"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Course = { id: string; slug: string; title: string; category: string; summary: string; duration_minutes: number; level: string; objectives: string[]; recommended_for: string[]; current_version_id: string; current_version_number: number };
type Version = { id: string; version_number: number; title: string; summary: string; duration_minutes: number; level: string; objectives: string[]; recommended_for: string[] };
type BlockType = "text" | "image" | "video" | "quiz" | "scenario" | "poll" | "reflection" | "action_plan" | "download";
type Block = { id: string; sort_order: number; block_type: BlockType; title: string; content: Record<string, unknown>; required: boolean };
type Reflections = Record<string, string>;

type AnswerState = Record<string, number | string>;

export default function CustomCoursePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const [userId, setUserId] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [reflections, setReflections] = useState<Reflections>({});
  const [drafts, setDrafts] = useState<Reflections>({});
  const [outcomes, setOutcomes] = useState<Reflections>({});
  const [answers, setAnswers] = useState<AnswerState>({});
  const [feedback, setFeedback] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient(); if (!client) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.href = `/auth?next=${encodeURIComponent(`/custom/${slug}`)}`; return; }
      const { data: c, error } = await client.from("custom_courses").select("id,slug,title,category,summary,duration_minutes,level,objectives,recommended_for,current_version_id,current_version_number").eq("slug", slug).eq("status", "published").maybeSingle();
      if (!active) return;
      if (error || !c) { setMessage(error?.message || "This school CPD course is not currently available."); setLoading(false); return; }
      const [v, b, p] = await Promise.all([
        client.from("custom_course_versions").select("id,version_number,title,summary,duration_minutes,level,objectives,recommended_for").eq("id", c.current_version_id).eq("status", "published").single(),
        client.from("custom_course_blocks").select("id,sort_order,block_type,title,content,required").eq("version_id", c.current_version_id).order("sort_order"),
        client.from("course_progress").select("completed_modules,reflections,completed_at").eq("user_id", auth.user.id).eq("course_id", `custom:${c.id}`).maybeSingle(),
      ]);
      if (!active) return;
      if (v.error || b.error || p.error) setMessage([v.error?.message,b.error?.message,p.error?.message].filter(Boolean).join(" · "));
      setUserId(auth.user.id); setCourse(c as Course); setVersion(v.data as Version); setBlocks((b.data || []) as Block[]);
      const refs = ((p.data?.reflections || {}) as Reflections); setCompleted(p.data?.completed_modules || []); setReflections(refs); setDrafts(refs); setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  const required = useMemo(() => blocks.filter(b => b.required), [blocks]);
  const requiredDone = required.filter(b => completed.includes(b.id)).length;
  const percent = required.length ? Math.round(requiredDone / required.length * 100) : blocks.length ? 100 : 0;
  const courseComplete = required.length ? requiredDone === required.length : blocks.length > 0;

  async function completeBlock(block: Block, reflectionValue?: string) {
    if (!course || !userId) return;
    const client = getSupabaseBrowserClient(); if (!client) return;
    const nextCompleted = completed.includes(block.id) ? completed : [...completed, block.id];
    const nextReflections = reflectionValue !== undefined ? { ...reflections, [block.id]: reflectionValue } : reflections;
    const allRequired = blocks.filter(b => b.required).every(b => nextCompleted.includes(b.id));
    setCompleted(nextCompleted); setReflections(nextReflections); setSaving(true);
    const { error } = await client.from("course_progress").upsert({ user_id: userId, course_id: `custom:${course.id}`, completed_modules: nextCompleted, reflections: nextReflections, completed_at: allRequired ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "user_id,course_id" });
    setSaving(false); if (error) setMessage(error.message); else setMessage(allRequired ? "Course completed and added to your CPD record." : "Progress saved.");
  }

  async function saveActionPlan(block: Block) {
    if (!course || !userId) return;
    const text = (drafts[block.id] || "").trim(); if (text.length < 10) { setFeedback(prev => ({...prev,[block.id]:"Add a little more detail to make the action useful."})); return; }
    const client = getSupabaseBrowserClient(); if (!client) return;
    const { error } = await client.from("action_plans").insert({ user_id: userId, title: `${course.title}: implementation action`, action: text, intended_outcome: (outcomes[block.id] || "").trim(), course_id: `custom:${course.id}`, start_date: new Date().toISOString().slice(0,10), status: "planned" });
    if (error) { setFeedback(prev => ({...prev,[block.id]:error.message})); return; }
    await completeBlock(block, text); setFeedback(prev => ({...prev,[block.id]:"Action saved to your implementation tracker."}));
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Loading school CPD course…</div></main>;
  if (!course || !version) return <main className="stagePage"><section className="stageCard"><h1>Course unavailable</h1><p>{message || "This course is not published."}</p><a className="secondary phaseLinkButton" href="/training">Back to My Training</a></section></main>;

  return <main className="stagePage learnerShell">
    <section className="stageHero"><span className="eyebrow">SCHOOL-CREATED CPD · VERSION {version.version_number}</span><h1>{version.title}</h1><p>{version.summary}</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/training">My training</a><a className="secondary phaseLinkButton" href="/actions">Action plans</a></div></section>
    {message && <div className={courseComplete ? "noticeGood" : "phaseNotice"}>{message}</div>}
    <div className="learnerProgress"><div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:11,fontWeight:800}}><span>{requiredDone} of {required.length} required blocks complete</span><span>{percent}%</span></div><div className="progress" style={{marginTop:8}}><span style={{width:`${percent}%`}} /></div>{courseComplete && <div className="noticeGood" style={{marginTop:10}}>✓ Course complete — this version is recorded in your CPD progress.</div>}</div>

    <section className="stageCard" style={{marginBottom:14}}><div className="stageGrid"><div className="stageSpan6"><span className="eyebrow">OBJECTIVES</span>{version.objectives.length ? version.objectives.map(x => <p key={x}>✓ {x}</p>) : <p>Work through the learning blocks and record how you will apply the ideas.</p>}</div><div className="stageSpan6"><span className="eyebrow">COURSE DETAILS</span><p>{course.category} · {version.level} · {version.duration_minutes} minutes</p>{version.recommended_for.length > 0 && <p>Recommended for: {version.recommended_for.join(", ")}</p>}</div></div></section>

    {blocks.map((block,index) => <article className={`learnerBlock ${completed.includes(block.id) ? "done" : ""}`} key={block.id}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span className="eyebrow">{index+1}. {block.block_type.replaceAll("_"," ")}</span>{completed.includes(block.id) && <span className="stageBadge good">completed</span>}</div><h2>{block.title}</h2><BlockContent block={block} answer={answers[block.id]} draft={drafts[block.id] || ""} outcome={outcomes[block.id] || ""} feedback={feedback[block.id] || ""} onAnswer={value => setAnswers(prev => ({...prev,[block.id]:value}))} onDraft={value => setDrafts(prev => ({...prev,[block.id]:value}))} onOutcome={value => setOutcomes(prev => ({...prev,[block.id]:value}))} setFeedback={value => setFeedback(prev => ({...prev,[block.id]:value}))} complete={() => completeBlock(block)} completeReflection={() => { const value=(drafts[block.id]||"").trim(); if(value.length<10){setFeedback(prev=>({...prev,[block.id]:"Add a little more detail before saving."}));return;} completeBlock(block,value); }} saveAction={() => saveActionPlan(block)} />
      {block.required && !completed.includes(block.id) && <small className="muted">Required for course completion</small>}
    </article>)}
    {!blocks.length && <div className="stageCard"><div className="emptyCompact">This published version has no content blocks.</div></div>}
    <div style={{height:40}} />
  </main>;
}

function BlockContent({ block, answer, draft, outcome, feedback, onAnswer, onDraft, onOutcome, setFeedback, complete, completeReflection, saveAction }: { block: Block; answer: number|string|undefined; draft: string; outcome: string; feedback: string; onAnswer:(v:number|string)=>void; onDraft:(v:string)=>void; onOutcome:(v:string)=>void; setFeedback:(v:string)=>void; complete:()=>void; completeReflection:()=>void; saveAction:()=>void }) {
  const c = block.content; const options = arr(c.options);
  if (block.block_type === "text") return <><p>{str(c.body)}</p><button className="primary" onClick={complete}>Mark section complete</button></>;
  if (block.block_type === "image") return <><>{str(c.url) && <img className="learnerMedia" src={str(c.url)} alt={str(c.alt) || block.title} />}</><p>{str(c.caption)}</p><button className="primary" onClick={complete}>Mark viewed</button></>;
  if (block.block_type === "video") return <><p>{str(c.caption)}</p>{str(c.url) && <a className="secondary phaseLinkButton" target="_blank" rel="noreferrer" href={str(c.url)}>Open video/resource ↗</a>}<div style={{marginTop:10}}><button className="primary" onClick={complete}>Mark viewed</button></div></>;
  if (block.block_type === "quiz") {
    const selected = typeof answer === "number" ? answer : -1; const correct = selected === Number(c.answer ?? 0);
    return <><p>{str(c.question)}</p><div className="learnerOptions">{options.map((opt,i) => <button key={`${opt}-${i}`} className={selected===i?"selected":""} onClick={() => { onAnswer(i); setFeedback(i===Number(c.answer??0) ? `Correct. ${str(c.feedback)}` : "Not quite. Try again."); }}>{opt}</button>)}</div>{feedback && <div className={correct?"noticeGood":"noticeWarn"}>{feedback}</div>}<button className="primary" disabled={!correct} onClick={complete}>Complete knowledge check</button></>;
  }
  if (block.block_type === "scenario") {
    const choices = scenarioOptions(c.options); const selected = typeof answer === "number" ? answer : -1;
    return <><p>{str(c.prompt)}</p><div className="learnerOptions">{choices.map((opt,i) => <button key={`${opt.label}-${i}`} className={selected===i?"selected":""} onClick={() => { onAnswer(i); setFeedback(opt.feedback); }}>{opt.label}</button>)}</div>{feedback && <div className="phaseNotice">{feedback}</div>}<button className="primary" disabled={selected<0} onClick={complete}>Complete scenario</button></>;
  }
  if (block.block_type === "poll") return <><p>{str(c.prompt)}</p><div className="learnerOptions">{options.map((opt,i) => <button key={`${opt}-${i}`} className={answer===opt?"selected":""} onClick={() => onAnswer(opt)}>{opt}</button>)}</div><button className="primary" disabled={!answer} onClick={complete}>Submit response</button></>;
  if (block.block_type === "reflection") return <><p>{str(c.prompt)}</p><textarea className="reflectionBox" rows={6} value={draft} onChange={e => onDraft(e.target.value)} placeholder="Record a professional reflection…" />{feedback && <div className="noticeWarn">{feedback}</div>}<button className="primary" onClick={completeReflection}>Save reflection</button></>;
  if (block.block_type === "action_plan") return <><p>{str(c.prompt)}</p><textarea className="reflectionBox" rows={5} value={draft} onChange={e => onDraft(e.target.value)} placeholder="What will you try?" /><p><strong>{str(c.outcomePrompt) || "What outcome are you hoping to see?"}</strong></p><textarea className="reflectionBox" rows={3} value={outcome} onChange={e => onOutcome(e.target.value)} placeholder="Intended outcome…" />{feedback && <div className="phaseNotice">{feedback}</div>}<button className="primary" onClick={saveAction}>Save to action plans</button></>;
  return <><p>{str(c.label) || "Course resource"}</p>{str(c.url) && <a className="secondary phaseLinkButton" href={str(c.url)} target="_blank" rel="noreferrer">{str(c.label) || "Open resource"} ↗</a>}<div style={{marginTop:10}}><button className="primary" onClick={complete}>Mark resource complete</button></div></>;
}

function str(value: unknown) { return typeof value === "string" ? value : ""; }
function arr(value: unknown) { return Array.isArray(value) ? value.map(String) : []; }
function scenarioOptions(value: unknown) { return Array.isArray(value) ? value.map(v => { const x=v as {label?:string;feedback?:string}; return {label:x.label||"Choice",feedback:x.feedback||""}; }) : []; }
