"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import "./CoachingHub.css";

type Target = { id:string; title:string; description:string; success_criteria:string; review_date:string|null; status:string };
type Cycle = { id:string; title:string; focus:string; coach_name:string; start_date:string; review_date:string|null; status:"active"|"completed"|"paused"; cycle_type:string; success_criteria:string; linked_target_id:string|null; linked_course_id:string|null; linked_pathway_id:string|null; completion_summary:string };
type Checkin = { id:string; cycle_id:string; checkin_date:string; evidence:string; reflection:string; next_step:string; confidence:number|null; agenda:string; wins:string; barriers:string; action_commitment:string; progress:number|null };

type View = "active" | "completed" | "all";

export default function CoachingHub() {
  const [userId,setUserId] = useState("");
  const [targets,setTargets] = useState<Target[]>([]);
  const [cycles,setCycles] = useState<Cycle[]>([]);
  const [checkins,setCheckins] = useState<Checkin[]>([]);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const [openCycle,setOpenCycle] = useState<string|null>(null);
  const [showNew,setShowNew] = useState(false);
  const [view,setView] = useState<View>("active");
  const [completionId,setCompletionId] = useState<string|null>(null);

  useEffect(() => {
    let alive = true;
    const client = getSupabaseBrowserClient();
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.replace("/auth?next=/coaching"); return; }
      if (!alive) return;
      setUserId(auth.user.id);
      const [t,c,k] = await Promise.all([
        client.from("development_targets").select("id,title,description,success_criteria,review_date,status").eq("user_id",auth.user.id).order("created_at",{ascending:false}),
        client.from("coaching_cycles").select("id,title,focus,coach_name,start_date,review_date,status,cycle_type,success_criteria,linked_target_id,linked_course_id,linked_pathway_id,completion_summary").eq("user_id",auth.user.id).order("created_at",{ascending:false}),
        client.from("coaching_checkins").select("id,cycle_id,checkin_date,evidence,reflection,next_step,confidence,agenda,wins,barriers,action_commitment,progress").eq("user_id",auth.user.id).order("checkin_date",{ascending:false}),
      ]);
      if (!alive) return;
      const errors=[t.error,c.error,k.error].filter(Boolean); if(errors.length) setMessage(errors.map(e=>e?.message).join(" · "));
      setTargets((t.data||[]) as Target[]); setCycles((c.data||[]) as Cycle[]); setCheckins((k.data||[]) as Checkin[]); setLoading(false);
    })().catch((error)=>{console.error(error);if(alive){setMessage("Coaching could not be loaded.");setLoading(false);}});
    return () => { alive=false; };
  },[]);

  const targetMap = useMemo(()=>new Map(targets.map(t=>[t.id,t])),[targets]);
  const courseMap = useMemo(()=>new Map(courses.map(c=>[c.id,c])),[]);
  const pathwayMap = useMemo(()=>new Map(pathways.map(p=>[p.id,p])),[]);
  const dueCycles = cycles.filter(c=>c.status==="active" && c.review_date && new Date(`${c.review_date}T23:59:59`).getTime()<=Date.now()).length;
  const activeCycles = cycles.filter(c=>c.status==="active").length;
  const avgConfidence = checkins.filter(k=>k.confidence).length ? (checkins.reduce((sum,k)=>sum+(k.confidence||0),0)/checkins.filter(k=>k.confidence).length).toFixed(1) : "–";
  const visibleCycles = cycles.filter(c=>view==="all" || c.status===view);

  async function createCycle(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!userId)return;
    const formEl=event.currentTarget; const form=new FormData(formEl); const client=getSupabaseBrowserClient();
    const payload={
      user_id:userId,
      title:String(form.get("title")||"").trim(),
      focus:String(form.get("focus")||"").trim(),
      coach_name:String(form.get("coach_name")||"").trim(),
      start_date:String(form.get("start_date")||today()),
      review_date:String(form.get("review_date")||"")||null,
      cycle_type:String(form.get("cycle_type")||"coaching"),
      success_criteria:String(form.get("success_criteria")||"").trim(),
      linked_target_id:String(form.get("linked_target_id")||"")||null,
      linked_course_id:String(form.get("linked_course_id")||"")||null,
      linked_pathway_id:String(form.get("linked_pathway_id")||"")||null,
    };
    const {data,error}=await client.from("coaching_cycles").insert(payload).select("id,title,focus,coach_name,start_date,review_date,status,cycle_type,success_criteria,linked_target_id,linked_course_id,linked_pathway_id,completion_summary").single();
    if(error){setMessage(error.message);return;}
    setCycles(prev=>[data as Cycle,...prev]); setOpenCycle((data as Cycle).id); setShowNew(false); setMessage("Coaching cycle started."); formEl.reset();
  }

  async function createCheckin(event:FormEvent<HTMLFormElement>,cycleId:string) {
    event.preventDefault(); if(!userId)return;
    const formEl=event.currentTarget; const form=new FormData(formEl); const client=getSupabaseBrowserClient();
    const payload={ cycle_id:cycleId,user_id:userId,checkin_date:String(form.get("checkin_date")||today()),agenda:String(form.get("agenda")||"").trim(),wins:String(form.get("wins")||"").trim(),evidence:String(form.get("evidence")||"").trim(),reflection:String(form.get("reflection")||"").trim(),barriers:String(form.get("barriers")||"").trim(),next_step:String(form.get("next_step")||"").trim(),action_commitment:String(form.get("action_commitment")||"").trim(),confidence:Number(form.get("confidence")||0)||null,progress:Number(form.get("progress")||0)||null };
    const {data,error}=await client.from("coaching_checkins").insert(payload).select("id,cycle_id,checkin_date,evidence,reflection,next_step,confidence,agenda,wins,barriers,action_commitment,progress").single();
    if(error){setMessage(error.message);return;}
    setCheckins(prev=>[data as Checkin,...prev]); setMessage("Coaching check-in saved."); formEl.reset();
  }

  async function setCycleStatus(id:string,status:"active"|"paused") {
    const client=getSupabaseBrowserClient(); const {error}=await client.from("coaching_cycles").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",userId);
    if(error){setMessage(error.message);return;} setCycles(prev=>prev.map(c=>c.id===id?{...c,status}:c));
  }

  async function completeCycle(event:FormEvent<HTMLFormElement>,cycle:Cycle) {
    event.preventDefault(); const form=new FormData(event.currentTarget); const summary=String(form.get("completion_summary")||"").trim(); const client=getSupabaseBrowserClient();
    const {error}=await client.from("coaching_cycles").update({status:"completed",completion_summary:summary,updated_at:new Date().toISOString()}).eq("id",cycle.id).eq("user_id",userId);
    if(error){setMessage(error.message);return;}
    setCycles(prev=>prev.map(c=>c.id===cycle.id?{...c,status:"completed",completion_summary:summary}:c));
    const { data: existing } = await client.from("portfolio_entries").select("id").eq("user_id",userId).eq("related_coaching_cycle_id",cycle.id).limit(1).maybeSingle();
    if(!existing){
      await client.from("portfolio_entries").insert({user_id:userId,title:`Coaching: ${cycle.title}`,description:cycle.focus,evidence_type:"coaching",cpd_hours:0,occurred_on:today(),impact_summary:summary,next_step:"",standards:[],related_coaching_cycle_id:cycle.id});
    }
    setCompletionId(null); setMessage("Coaching cycle completed and added to your professional portfolio.");
  }

  if(loading)return <main className="chPage"><div className="chLoading">Opening coaching…</div></main>;

  return <main className="chPage">
    <header className="chTopbar"><Link href="/develop">← Develop</Link><div><span>PHASE 41</span><strong>Coaching</strong></div><button onClick={()=>setShowNew(v=>!v)}>{showNew?"Close":"+ Start cycle"}</button></header>

    <section className="chHero"><div><span className="chEyebrow">FOCUSED PROFESSIONAL CONVERSATIONS</span><h1>Turn reflection into deliberate improvement.</h1><p>Set a clear focus, link it to your development goals or CPD, capture evidence and leave every coaching conversation with an agreed next action.</p><div className="chHeroActions"><button className="primary" onClick={()=>setShowNew(true)}>Start a coaching cycle</button><Link href="/professional-learning">Professional learning</Link><Link href="/portfolio">Portfolio</Link><Link href="/ai-coach">AI CPD Tutor</Link></div></div><aside><strong>{activeCycles}</strong><span>active cycles</span><small>{dueCycles ? `${dueCycles} review${dueCycles===1?"":"s"} due` : "No overdue reviews"}</small></aside></section>

    {message&&<div className="chNotice" role="status">{message}</div>}
    <div className="chPrivacy">Coaching notes are private to your account. Keep confidential pupil information and safeguarding disclosures in the school’s approved systems.</div>

    <section className="chStats"><article><strong>{activeCycles}</strong><span>active cycles</span></article><article className={dueCycles?"attention":""}><strong>{dueCycles}</strong><span>reviews due</span></article><article><strong>{checkins.length}</strong><span>check-ins</span></article><article><strong>{avgConfidence}</strong><span>average confidence /5</span></article><article><strong>{cycles.filter(c=>c.status==="completed").length}</strong><span>completed cycles</span></article></section>

    {showNew&&<section className="chFormCard"><div className="chSectionHead"><div><span className="chEyebrow">NEW CYCLE</span><h2>Define the improvement focus</h2></div><button onClick={()=>setShowNew(false)}>Close</button></div><form className="chForm" onSubmit={createCycle}>
      <label>Cycle title<input required name="title" placeholder="e.g. Responsive questioning coaching cycle"/></label>
      <label>Type<select name="cycle_type" defaultValue="coaching"><option value="coaching">Coaching</option><option value="mentoring">Mentoring</option><option value="peer">Peer development</option><option value="instructional">Instructional coaching</option><option value="leadership">Leadership coaching</option></select></label>
      <label>Coach / colleague<input name="coach_name" placeholder="Optional"/></label>
      <label>Review date<input name="review_date" type="date"/></label>
      <label className="wide">Focus<textarea required name="focus" rows={3} placeholder="What aspect of practice will you investigate or improve?"/></label>
      <label className="wide">Success criteria<textarea name="success_criteria" rows={3} placeholder="What evidence would show that the cycle has made a difference?"/></label>
      <label>Linked development target<select name="linked_target_id"><option value="">None</option>{targets.filter(t=>t.status!=="completed").map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <label>Linked course<select name="linked_course_id"><option value="">None</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <label>Linked pathway<select name="linked_pathway_id"><option value="">None</option>{pathways.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <label>Start date<input name="start_date" type="date" defaultValue={today()}/></label>
      <div className="wide"><button className="primary">Start cycle</button></div>
    </form></section>}

    <section className="chToolbar"><div>{(["active","completed","all"] as View[]).map(item=><button key={item} onClick={()=>setView(item)} className={view===item?"active":""}>{item[0].toUpperCase()+item.slice(1)}</button>)}</div><Link href="/professional-learning">Manage development targets →</Link></section>

    <section className="chCycles">{visibleCycles.map(cycle=>{const items=checkins.filter(k=>k.cycle_id===cycle.id);const target=cycle.linked_target_id?targetMap.get(cycle.linked_target_id):null;const course=cycle.linked_course_id?courseMap.get(cycle.linked_course_id):null;const pathway=cycle.linked_pathway_id?pathwayMap.get(cycle.linked_pathway_id):null;return <article className="chCycle" key={cycle.id}>
      <button className="chCycleHead" onClick={()=>setOpenCycle(openCycle===cycle.id?null:cycle.id)}><div><div className="chMeta"><span>{cycle.cycle_type.replace("_"," ")}</span><span>{cycle.status}</span>{cycle.review_date&&<span className={cycle.status==="active"&&new Date(`${cycle.review_date}T23:59:59`).getTime()<=Date.now()?"due":""}>Review {formatDate(cycle.review_date)}</span>}</div><h2>{cycle.title}</h2><p>{cycle.focus}</p></div><strong>{openCycle===cycle.id?"−":"+"}</strong></button>
      <div className="chCycleSummary"><span>{cycle.coach_name||"Self/peer coaching"}</span><span>{items.length} check-ins</span>{target&&<span>Target: {target.title}</span>}{course&&<span>CPD: {course.title}</span>}{pathway&&<span>Pathway: {pathway.title}</span>}</div>
      {openCycle===cycle.id&&<div className="chCycleBody">
        {cycle.success_criteria&&<div className="chFocus"><strong>Success criteria</strong><p>{cycle.success_criteria}</p></div>}
        <div className="chTimeline">{items.map((item,index)=><div className="chCheckin" key={item.id}><div className="chCheckinDate"><strong>{formatDate(item.checkin_date)}</strong>{item.progress&&<span>Progress {item.progress}/5</span>}{item.confidence&&<span>Confidence {item.confidence}/5</span>}</div><div>{item.agenda&&<p><b>Focus:</b> {item.agenda}</p>}{item.wins&&<p><b>What is working:</b> {item.wins}</p>}{item.evidence&&<p><b>Evidence:</b> {item.evidence}</p>}{item.reflection&&<p><b>Reflection:</b> {item.reflection}</p>}{item.barriers&&<p><b>Barrier:</b> {item.barriers}</p>}{item.next_step&&<p><b>Next step:</b> {item.next_step}</p>}{item.action_commitment&&<div className="chCommitment">Commitment: {item.action_commitment}</div>}</div>{index<items.length-1&&<span className="chLine"/>}</div>)}{!items.length&&<div className="chEmpty">No check-ins yet. Use the form below after your first coaching conversation.</div>}</div>
        {cycle.status!=="completed"&&<form className="chCheckinForm" onSubmit={e=>createCheckin(e,cycle.id)}><div className="chSectionHead"><div><span className="chEyebrow">CHECK-IN</span><h3>Evidence → reflection → action</h3></div></div><div className="chForm small"><label>Date<input type="date" name="checkin_date" defaultValue={today()}/></label><label>Progress<select name="progress" defaultValue="3">{[1,2,3,4,5].map(n=><option value={n} key={n}>{n}/5</option>)}</select></label><label>Confidence<select name="confidence" defaultValue="3">{[1,2,3,4,5].map(n=><option value={n} key={n}>{n}/5</option>)}</select></label><label className="wide">Conversation focus<input name="agenda" placeholder="What did you explore today?"/></label><label className="wide">What is working?<textarea name="wins" rows={2}/></label><label className="wide">Evidence discussed<textarea name="evidence" rows={2}/></label><label className="wide">Reflection<textarea name="reflection" rows={2}/></label><label className="wide">Barriers / challenge<textarea name="barriers" rows={2}/></label><label className="wide">Next step<textarea name="next_step" rows={2}/></label><label className="wide">Agreed action commitment<input name="action_commitment" placeholder="Before the next check-in I will…"/></label><div className="wide chActions"><button className="primary">Save check-in</button>{cycle.status==="active"?<button type="button" onClick={()=>setCycleStatus(cycle.id,"paused")}>Pause cycle</button>:<button type="button" onClick={()=>setCycleStatus(cycle.id,"active")}>Resume cycle</button>}<button type="button" onClick={()=>setCompletionId(completionId===cycle.id?null:cycle.id)}>Complete cycle</button></div></div></form>}
        {completionId===cycle.id&&cycle.status!=="completed"&&<form className="chComplete" onSubmit={e=>completeCycle(e,cycle)}><label>Completion reflection<textarea required name="completion_summary" rows={4} placeholder="What changed? What evidence supports that? What will you sustain or refine next?"/></label><button className="primary">Complete and add to portfolio</button></form>}
        {cycle.status==="completed"&&cycle.completion_summary&&<div className="chCompletion"><strong>Completion reflection</strong><p>{cycle.completion_summary}</p><Link href="/portfolio">View in portfolio →</Link></div>}
      </div>}
    </article>})}{!visibleCycles.length&&<div className="chEmpty large">No coaching cycles in this view.</div>}</section>
  </main>;
}

function today(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function formatDate(value:string){if(!value)return"";const d=value.length===10?new Date(`${value}T12:00:00`):new Date(value);return Number.isNaN(d.getTime())?value:d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
