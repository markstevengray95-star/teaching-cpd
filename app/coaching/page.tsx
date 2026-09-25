"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Target = { id:string; title:string; description:string; success_criteria:string; linked_course_id:string|null; linked_pathway_id:string|null; review_date:string|null; status:"active"|"review_due"|"completed"|"paused" };
type Cycle = { id:string; title:string; focus:string; coach_name:string; start_date:string; review_date:string|null; status:"active"|"completed"|"paused" };
type Checkin = { id:string; cycle_id:string; checkin_date:string; evidence:string; reflection:string; next_step:string; confidence:number|null };

export default function CoachingPage() {
  const [userId,setUserId] = useState("");
  const [targets,setTargets] = useState<Target[]>([]);
  const [cycles,setCycles] = useState<Cycle[]>([]);
  const [checkins,setCheckins] = useState<Checkin[]>([]);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const [openCycle,setOpenCycle] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient(); if (!supabase) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/coaching"; return; }
      if (!alive) return; setUserId(auth.user.id);
      const [t,c,k] = await Promise.all([
        supabase.from("development_targets").select("id,title,description,success_criteria,linked_course_id,linked_pathway_id,review_date,status").eq("user_id",auth.user.id).order("created_at",{ascending:false}),
        supabase.from("coaching_cycles").select("id,title,focus,coach_name,start_date,review_date,status").eq("user_id",auth.user.id).order("created_at",{ascending:false}),
        supabase.from("coaching_checkins").select("id,cycle_id,checkin_date,evidence,reflection,next_step,confidence").eq("user_id",auth.user.id).order("checkin_date",{ascending:false}),
      ]);
      const errors=[t.error,c.error,k.error].filter(Boolean); if(errors.length) setMessage(errors.map(e=>e?.message).join(" · "));
      setTargets((t.data||[]) as Target[]); setCycles((c.data||[]) as Cycle[]); setCheckins((k.data||[]) as Checkin[]); setLoading(false);
    })();
    return () => { alive=false; };
  },[]);

  const dueTargets = useMemo(() => targets.filter(t => t.status === "active" && t.review_date && new Date(t.review_date).getTime() <= Date.now()).length,[targets]);

  async function createTarget(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=new FormData(e.currentTarget); const client=getSupabaseBrowserClient(); if(!client||!userId)return;
    const {data,error}=await client.from("development_targets").insert({ user_id:userId, title:String(form.get("title")||""), description:String(form.get("description")||""), success_criteria:String(form.get("success_criteria")||""), linked_course_id:String(form.get("linked_course_id")||"")||null, linked_pathway_id:String(form.get("linked_pathway_id")||"")||null, review_date:String(form.get("review_date")||"")||null }).select("id,title,description,success_criteria,linked_course_id,linked_pathway_id,review_date,status").single();
    if(error){setMessage(error.message);return;} setTargets(prev=>[data as Target,...prev]); setMessage("Development target created."); e.currentTarget.reset();
  }

  async function setTargetStatus(id:string,status:Target["status"]) {
    const client=getSupabaseBrowserClient(); if(!client)return; const {error}=await client.from("development_targets").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)setMessage(error.message); else setTargets(prev=>prev.map(t=>t.id===id?{...t,status}:t));
  }

  async function createCycle(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=new FormData(e.currentTarget); const client=getSupabaseBrowserClient(); if(!client||!userId)return;
    const {data,error}=await client.from("coaching_cycles").insert({ user_id:userId, title:String(form.get("title")||""), focus:String(form.get("focus")||""), coach_name:String(form.get("coach_name")||""), start_date:String(form.get("start_date")||"")||new Date().toISOString().slice(0,10), review_date:String(form.get("review_date")||"")||null }).select("id,title,focus,coach_name,start_date,review_date,status").single();
    if(error){setMessage(error.message);return;} setCycles(prev=>[data as Cycle,...prev]); setOpenCycle((data as Cycle).id); setMessage("Coaching cycle started."); e.currentTarget.reset();
  }

  async function createCheckin(e:FormEvent<HTMLFormElement>,cycleId:string) {
    e.preventDefault(); const form=new FormData(e.currentTarget); const client=getSupabaseBrowserClient(); if(!client||!userId)return;
    const confidence=Number(form.get("confidence")||0)||null;
    const {data,error}=await client.from("coaching_checkins").insert({ cycle_id:cycleId,user_id:userId,checkin_date:String(form.get("checkin_date")||"")||new Date().toISOString().slice(0,10), evidence:String(form.get("evidence")||""), reflection:String(form.get("reflection")||""), next_step:String(form.get("next_step")||""), confidence }).select("id,cycle_id,checkin_date,evidence,reflection,next_step,confidence").single();
    if(error){setMessage(error.message);return;} setCheckins(prev=>[data as Checkin,...prev]); setMessage("Coaching check-in saved."); e.currentTarget.reset();
  }

  async function completeCycle(id:string) {
    const client=getSupabaseBrowserClient(); if(!client)return; const {error}=await client.from("coaching_cycles").update({status:"completed",updated_at:new Date().toISOString()}).eq("id",id);
    if(error)setMessage(error.message); else setCycles(prev=>prev.map(c=>c.id===id?{...c,status:"completed"}:c));
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading coaching and development…</div></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 8 · COACHING & DEVELOPMENT</span><h1>Turn CPD into a focused improvement cycle.</h1><p>Create clear development targets, define success, log coaching evidence and review progress over time. These notes are private to your account by default.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/needs-audit">Needs audit</a><a className="primary phaseLinkButton" href="/coach">Open CPD Coach</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{targets.filter(t=>t.status==="active").length}</strong><span>active targets</span></div><div className="stageStat"><strong>{dueTargets}</strong><span>reviews due</span></div><div className="stageStat"><strong>{cycles.filter(c=>c.status==="active").length}</strong><span>active coaching cycles</span></div><div className="stageStat"><strong>{checkins.length}</strong><span>saved check-ins</span></div></section>

    <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Create a development target</summary><form className="stageForm" onSubmit={createTarget}><div className="stageFormGrid"><label className="full">Target title<input required name="title" placeholder="e.g. Improve whole-class checking for understanding"/></label><label className="full">What will change?<textarea name="description" rows={3}/></label><label className="full">Success criteria<textarea name="success_criteria" rows={3} placeholder="What evidence would show improvement?"/></label><label>Linked course<select name="linked_course_id"><option value="">None</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Linked pathway<select name="linked_pathway_id"><option value="">None</option>{pathways.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label>Review date<input name="review_date" type="date"/></label></div><button className="primary">Create target</button></form></details></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">TARGETS</span><h2>Your development targets</h2><div className="stageList">{targets.map(t=><div className="stageRow" key={t.id}><div className="stageRowMain"><strong>{t.title}</strong><span>{t.description||"No description"}</span><small>{t.review_date?`Review ${new Date(t.review_date).toLocaleDateString("en-GB")}`:"No review date"}{t.success_criteria?` · Success: ${t.success_criteria}`:""}</small></div><div className="rowActions"><span className={`stageBadge ${t.status==="completed"?"good":(t.review_date&&new Date(t.review_date).getTime()<=Date.now()&&t.status==="active")?"warn":""}`}>{t.status}</span>{t.status!=="completed"&&<button className="smallButton" onClick={()=>setTargetStatus(t.id,"completed")}>Complete</button>}</div></div>)}{!targets.length&&<div className="emptyCompact">No development targets yet.</div>}</div></div>
    </section>

    <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Start a coaching cycle</summary><form className="stageForm" onSubmit={createCycle}><div className="stageFormGrid"><label className="full">Cycle title<input required name="title" placeholder="e.g. Questioning coaching cycle"/></label><label className="full">Focus<textarea name="focus" rows={3}/></label><label>Coach / colleague<input name="coach_name" placeholder="Optional name"/></label><label>Start date<input name="start_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label><label>Review date<input name="review_date" type="date"/></label></div><button className="primary">Start cycle</button></form></details></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">COACHING CYCLES</span><h2>Evidence → reflection → next step</h2><div className="stageList">{cycles.map(c=>{const items=checkins.filter(k=>k.cycle_id===c.id);return <div className="coachCycle" key={c.id}><button className="coachCycleHead" onClick={()=>setOpenCycle(openCycle===c.id?null:c.id)}><div><strong>{c.title}</strong><span>{c.coach_name?`With ${c.coach_name} · `:""}{items.length} check-ins · {c.status}</span></div><span>{openCycle===c.id?"−":"+"}</span></button>{openCycle===c.id&&<div className="coachCycleBody"><p>{c.focus||"No focus recorded."}</p><div className="stageList">{items.map(k=><div className="stageRow" key={k.id}><div className="stageRowMain"><strong>{new Date(k.checkin_date).toLocaleDateString("en-GB")} {k.confidence?`· confidence ${k.confidence}/5`:""}</strong><span>{k.reflection||k.evidence||"Check-in recorded"}</span><small>{k.next_step?`Next: ${k.next_step}`:""}</small></div></div>)}</div>{c.status==="active"&&<form className="stageForm compactForm" onSubmit={e=>createCheckin(e,c.id)}><div className="stageFormGrid"><label>Check-in date<input name="checkin_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label><label>Confidence<select name="confidence" defaultValue="3">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}/5</option>)}</select></label><label className="full">Evidence<textarea name="evidence" rows={2}/></label><label className="full">Reflection<textarea name="reflection" rows={2}/></label><label className="full">Next step<textarea name="next_step" rows={2}/></label></div><div className="rowActions"><button className="primary">Save check-in</button><button type="button" className="secondary" onClick={()=>completeCycle(c.id)}>Complete cycle</button></div></form>}</div>}</div>})}{!cycles.length&&<div className="emptyCompact">No coaching cycles yet.</div>}</div></div>
    </section>
  </main>;
}
