"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { courses, type Course, type Module } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id:string; full_name:string; role:"Staff"|"Department Lead"|"CPD Lead"|"Admin"; department:string };
type LiveSession = { id:string; join_code:string; exit_code:string; join_code_expires_at:string|null; exit_code_expires_at:string|null; join_code_rotated_at:string|null; exit_code_rotated_at:string|null; title:string; presenter_id:string; presenter_name:string; location:string; description:string; objectives:string[]; starts_at:string; ends_at:string|null; status:"draft"|"live"|"closed" };
type Participant = { session_id:string; user_id:string; display_name:string; status:string; checked_in_at:string; checked_out_at:string|null };
type Activity = { id:string; session_id:string; sort_order:number; activity_type:string; title:string; prompt:string; options:unknown; required:boolean; is_open:boolean; response_mode:"named"|"anonymous"; confidence_phase:"none"|"pre"|"post" };
type LiveResponse = { id:string; activity_id:string; user_id:string; response:{value?:string}; created_at:string };

export default function LiveCPDPage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [sessions,setSessions]=useState<LiveSession[]>([]);
  const [selected,setSelected]=useState<LiveSession|null>(null);
  const [participants,setParticipants]=useState<Participant[]>([]);
  const [activities,setActivities]=useState<Activity[]>([]);
  const [responses,setResponses]=useState<LiveResponse[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [showCreate,setShowCreate]=useState(false);
  const [showAddActivity,setShowAddActivity]=useState(false);
  const [coursePreset,setCoursePreset]=useState<Course|null>(null);

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient(); let alive=true;
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();
      if(!auth.user){window.location.href="/auth?next=/live";return;}
      const {data:p,error:profileError}=await supabase.from("staff_profiles").select("id,full_name,role,department").eq("id",auth.user.id).single();
      if(profileError||!p){if(alive){setMessage(profileError?.message||"Unable to load profile.");setLoading(false);}return;}
      if(alive){
        setProfile(p as Profile);
        const requestedCourseId=new URLSearchParams(window.location.search).get("course");
        const preset=requestedCourseId?courses.find(c=>c.id===requestedCourseId)||null:null;
        if(preset){
          setCoursePreset(preset);
          if(["Department Lead","CPD Lead","Admin"].includes((p as Profile).role))setShowCreate(true);
        }
      }
      const {data,error}=await supabase.from("live_sessions").select("*").eq("presenter_id",auth.user.id).order("starts_at",{ascending:false});
      if(alive){if(error)setMessage(error.message); else {const rows=(data||[]) as LiveSession[];setSessions(rows);if(rows.length)setSelected(rows[0]);}setLoading(false);}
    })();
    return()=>{alive=false;};
  },[]);

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();
    if(!selected){setParticipants([]);setActivities([]);setResponses([]);return;}
    let mounted=true;
    const refresh=async()=>{
      const [p,a,r,s]=await Promise.all([
        supabase.from("live_participants").select("*").eq("session_id",selected.id).order("checked_in_at"),
        supabase.from("live_activities").select("*").eq("session_id",selected.id).order("sort_order"),
        supabase.from("live_responses").select("id,activity_id,user_id,response,created_at").eq("session_id",selected.id).order("created_at"),
        supabase.from("live_sessions").select("*").eq("id",selected.id).single(),
      ]);
      if(!mounted)return;
      setParticipants((p.data||[]) as Participant[]);setActivities((a.data||[]) as Activity[]);setResponses((r.data||[]) as LiveResponse[]);
      if(s.data){const fresh=s.data as LiveSession;setSelected(fresh);setSessions(prev=>prev.map(x=>x.id===fresh.id?fresh:x));}
    };
    refresh();
    const channel=supabase.channel(`facilitator-${selected.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"live_participants",filter:`session_id=eq.${selected.id}`},refresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"live_activities",filter:`session_id=eq.${selected.id}`},refresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"live_responses",filter:`session_id=eq.${selected.id}`},refresh)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"live_sessions",filter:`id=eq.${selected.id}`},refresh)
      .subscribe();
    return()=>{mounted=false;supabase.removeChannel(channel);};
  },[selected?.id]);

  const leader=profile&&["Department Lead","CPD Lead","Admin"].includes(profile.role);
  const joinUrl=useMemo(()=>selected&&typeof window!=="undefined"?`${window.location.origin}/join/${selected.join_code}`:"",[selected]);
  const exitUrl=useMemo(()=>selected&&typeof window!=="undefined"?`${window.location.origin}/join/${selected.exit_code}`:"",[selected]);
  const participantNames=useMemo(()=>new Map(participants.map(p=>[p.user_id,p.display_name||"Staff member"])),[participants]);

  async function createSession(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!profile)return;const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();
    const starts=String(form.get("starts_at")||"");
    const payload={join_code:makeCode(),exit_code:makeCode(),title:String(form.get("title")||"Untitled CPD"),presenter_id:profile.id,presenter_name:profile.full_name,location:String(form.get("location")||""),description:String(form.get("description")||""),objectives:String(form.get("objectives")||"").split("\n").map(s=>s.trim()).filter(Boolean),starts_at:new Date(starts).toISOString(),status:"draft" as const};
    const {data,error}=await supabase.from("live_sessions").insert(payload).select().single();if(error){setMessage(error.message);return;}
    const session=data as LiveSession;
    const presetQuiz=coursePreset?.modules.find((m):m is Extract<Module,{type:"quiz"}=>m.type==="quiz");
    const presetScenario=coursePreset?.modules.find((m):m is Extract<Module,{type:"scenario"}=>m.type==="scenario");
    const seeded:Array<Record<string,unknown>>=[];let sortOrder=1;
    seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"rating",title:"Starting confidence",prompt:"How confident do you currently feel about this CPD topic?",options:["1","2","3","4","5"],required:true,is_open:false,response_mode:"anonymous",confidence_phase:"pre"});
    if(presetQuiz)seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"multiple_choice",title:presetQuiz.title,prompt:presetQuiz.question,options:presetQuiz.options,required:true,is_open:false,response_mode:"anonymous",confidence_phase:"none"});
    if(presetScenario)seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"scenario",title:presetScenario.title,prompt:presetScenario.prompt,options:presetScenario.options.map(o=>o.label),required:false,is_open:false,response_mode:"anonymous",confidence_phase:"none"});
    seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"short_answer",title:"Apply it",prompt:coursePreset?`What is one practical change from ${coursePreset.title} you could test in your own classroom?`:"What is one practical change you could test in your own classroom?",options:[],required:true,is_open:false,response_mode:"anonymous",confidence_phase:"none"});
    seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"rating",title:"Ending confidence",prompt:"How confident do you feel now?",options:["1","2","3","4","5"],required:true,is_open:false,response_mode:"anonymous",confidence_phase:"post"});
    seeded.push({session_id:session.id,sort_order:sortOrder++,activity_type:"exit_ticket",title:"Exit ticket",prompt:"What is the most important idea you are taking from this session?",options:[],required:true,is_open:false,response_mode:"anonymous",confidence_phase:"none"});
    const {error:activityError}=await supabase.from("live_activities").insert(seeded);
    if(activityError){setMessage(activityError.message);return;}
    setSessions(prev=>[session,...prev]);setSelected(session);setShowCreate(false);setCoursePreset(null);formEl.reset();setMessage("Session created with course-linked live activities. Start it when you are ready.");
  }

  async function changeStatus(session:LiveSession,status:LiveSession["status"]){
    const supabase=getSupabaseBrowserClient();let patch:Record<string,unknown>={status};
    if(status==="live"){
      patch={...patch,join_code:makeCode(),exit_code:makeCode(),join_code_expires_at:addMinutes(15),exit_code_expires_at:addMinutes(240),join_code_rotated_at:new Date().toISOString(),exit_code_rotated_at:new Date().toISOString()};
    }
    if(status==="closed"){
      await supabase.from("live_activities").update({is_open:false}).eq("session_id",session.id);
      patch={...patch,ends_at:new Date().toISOString(),join_code_expires_at:new Date().toISOString(),exit_code:makeCode(),exit_code_expires_at:addMinutes(60),exit_code_rotated_at:new Date().toISOString()};
    }
    const {data,error}=await supabase.from("live_sessions").update(patch).eq("id",session.id).select().single();if(error){setMessage(error.message);return;}
    if(status==="live"){
      const {data:first}=await supabase.from("live_activities").select("id").eq("session_id",session.id).order("sort_order").limit(1).maybeSingle();
      if(first?.id)await supabase.from("live_activities").update({is_open:true}).eq("id",first.id);
      setMessage("Session live. Join QR is valid for 15 minutes; rotate it whenever you need a fresh code.");
    }else if(status==="closed")setMessage("Session closed. A fresh exit code is valid for 60 minutes.");
    const updated=data as LiveSession;setSelected(updated);setSessions(prev=>prev.map(s=>s.id===updated.id?updated:s));
  }

  async function rotateCode(kind:"join"|"exit"){
    if(!selected)return;const supabase=getSupabaseBrowserClient();const now=new Date().toISOString();
    const patch=kind==="join"?{join_code:makeCode(),join_code_expires_at:addMinutes(15),join_code_rotated_at:now}:{exit_code:makeCode(),exit_code_expires_at:addMinutes(60),exit_code_rotated_at:now};
    const {data,error}=await supabase.from("live_sessions").update(patch).eq("id",selected.id).select().single();if(error){setMessage(error.message);return;}
    const updated=data as LiveSession;setSelected(updated);setSessions(prev=>prev.map(s=>s.id===updated.id?updated:s));setMessage(`${kind==="join"?"Join":"Exit"} QR rotated successfully.`);
  }

  async function openActivity(activity:Activity){
    if(!selected||selected.status!=="live")return;const supabase=getSupabaseBrowserClient();
    const {error:closeError}=await supabase.from("live_activities").update({is_open:false}).eq("session_id",selected.id);if(closeError){setMessage(closeError.message);return;}
    const {error}=await supabase.from("live_activities").update({is_open:true}).eq("id",activity.id);if(error){setMessage(error.message);return;}setMessage(`Opened: ${activity.title}`);
  }

  async function closeActivities(){if(!selected)return;const {error}=await getSupabaseBrowserClient().from("live_activities").update({is_open:false}).eq("session_id",selected.id);setMessage(error?error.message:"All live activities are paused.");}

  async function updateActivityPrivacy(activity:Activity,response_mode:Activity["response_mode"]){
    const {error}=await getSupabaseBrowserClient().from("live_activities").update({response_mode}).eq("id",activity.id);if(error)setMessage(error.message);else setActivities(prev=>prev.map(a=>a.id===activity.id?{...a,response_mode}:a));
  }

  async function addActivity(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return;const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();
    const type=String(form.get("activity_type")||"short_answer");const rawOptions=String(form.get("options")||"");
    const payload={session_id:selected.id,sort_order:(Math.max(0,...activities.map(a=>a.sort_order))+1),activity_type:type,title:String(form.get("title")||"New activity"),prompt:String(form.get("prompt")||""),options:rawOptions.split("\n").map(x=>x.trim()).filter(Boolean),required:Boolean(form.get("required")),is_open:false,response_mode:String(form.get("response_mode")||"anonymous"),confidence_phase:type==="rating"?String(form.get("confidence_phase")||"none"):"none"};
    const {data,error}=await supabase.from("live_activities").insert(payload).select().single();if(error){setMessage(error.message);return;}setActivities(prev=>[...prev,data as Activity].sort((a,b)=>a.sort_order-b.sort_order));formEl.reset();setShowAddActivity(false);setMessage("Activity added to the session.");
  }

  if(loading)return <main className="phasePage"><div className="phaseCard">Loading live CPD…</div></main>;
  return <main className="phasePage">
    <section className="phaseHero compactHero"><a className="phaseBack" href="/">← Teaching CPD</a><span className="eyebrow">STAGE 10 · ADVANCED LIVE CPD</span><h1>Secure, interactive staff-development sessions</h1><p>Rotate time-limited QR codes, push live activities, choose named or anonymous response display, compare confidence before and after, and review participation in real time.</p><div className="phaseActions">{leader&&<button className="primary" onClick={()=>{setCoursePreset(null);setShowCreate(true);}}>Create CPD session</button>}<a className="secondary phaseLinkButton" href="/auth">Account</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    {!leader&&<div className="phaseNotice">Staff accounts can join live CPD from a QR code. Department Lead, CPD Lead or Admin permission is required to facilitate sessions.</div>}

    {showCreate&&leader&&<form key={coursePreset?.id||"blank-live-session"} className="phaseCard createSessionCard" onSubmit={createSession}><div className="phaseCardHead"><div><span className="eyebrow">NEW SESSION</span><h2>{coursePreset?`Run ${coursePreset.title} live`:"Create live CPD"}</h2>{coursePreset&&<p className="muted">Course objectives and suitable quiz/scenario activities will seed this session automatically.</p>}</div><button type="button" className="iconButton" onClick={()=>{setShowCreate(false);setCoursePreset(null);}}>×</button></div><div className="phaseFormGrid"><label>Session title<input required name="title" defaultValue={coursePreset?.title||""} placeholder="e.g. Effective Questioning"/></label><label>Location<input name="location" placeholder="e.g. Main Hall"/></label><label>Start time<input required name="starts_at" type="datetime-local" defaultValue={localDateTime()}/></label><label className="span2">Description<textarea name="description" rows={3} defaultValue={coursePreset?.summary||""}/></label><label className="span2">Learning objectives<textarea name="objectives" rows={4} defaultValue={coursePreset?.objectives.join("\n")||""} placeholder={"One objective per line\nUnderstand...\nApply..."}/></label></div><button className="primary">Create session</button></form>}

    <section className="liveLayout"><div className="phaseCard liveList"><div className="phaseCardHead"><div><span className="eyebrow">YOUR SESSIONS</span><h2>{sessions.length} created</h2></div></div>{sessions.length===0?<p className="muted">No live CPD sessions yet.</p>:sessions.map(s=><button key={s.id} className={`liveSessionRow ${selected?.id===s.id?"selected":""}`} onClick={()=>setSelected(s)}><div><strong>{s.title}</strong><span>{new Date(s.starts_at).toLocaleString("en-GB")} · {s.location||"No location"}</span></div><b className={`statusPill ${s.status}`}>{s.status}</b></button>)}</div>

    <div className="phaseCard liveDetail">{!selected?<div className="emptyState"><div>QR</div><strong>Select a session</strong><p>Session controls and live attendance will appear here.</p></div>:<>
      <div className="phaseCardHead"><div><span className="eyebrow">{selected.status.toUpperCase()}</span><h2>{selected.title}</h2><p>{selected.location}</p></div><div className="phaseActions">{selected.status==="draft"&&<button className="primary" onClick={()=>changeStatus(selected,"live")}>Start session</button>}{selected.status==="live"&&<button className="danger" onClick={()=>changeStatus(selected,"closed")}>End session</button>}</div></div>
      <div className="sessionControlGrid"><div className="qrStack">
        <div className="qrPanel"><span className="eyebrow">JOIN QR</span><div className="qrWhite">{joinUrl&&<QRCode value={joinUrl} size={190}/>}</div><strong>{selected.join_code}</strong><span>{expiryText(selected.join_code_expires_at,"No active expiry")}</span>{joinUrl&&<button className="secondary full" onClick={()=>navigator.clipboard?.writeText(joinUrl)}>Copy join link</button>}{selected.status==="live"&&<button className="secondary full" onClick={()=>rotateCode("join")}>Rotate join QR</button>}</div>
        <div className="qrPanel exitQr"><span className="eyebrow">EXIT QR</span><div className="qrWhite">{exitUrl&&<QRCode value={exitUrl} size={150}/>}</div><strong>{selected.exit_code}</strong><span>{expiryText(selected.exit_code_expires_at,"Available when the session starts")}</span>{exitUrl&&<button className="secondary full" onClick={()=>navigator.clipboard?.writeText(exitUrl)}>Copy exit link</button>}{selected.status!=="draft"&&<button className="secondary full" onClick={()=>rotateCode("exit")}>Rotate exit QR</button>}</div>
      </div><div className="attendancePanel"><div className="attendanceStat"><strong>{participants.length}</strong><span>checked in</span></div><h3>Live attendance</h3>{participants.length===0?<p className="muted">Nobody has joined yet.</p>:<div className="participantList">{participants.map(p=><div key={p.user_id}><span className="participantAvatar">{initials(p.display_name)}</span><div><strong>{p.display_name||"Staff member"}</strong><small>{p.status.replaceAll("_"," ")}</small></div></div>)}</div>}</div></div>

      <section className="facilitatorActivities"><div className="phaseCardHead"><div><span className="eyebrow">FACILITATOR CONTROL</span><h3>Push activities to staff phones</h3></div><div className="phaseActions">{selected.status==="live"&&<button className="secondary" onClick={closeActivities}>Pause all</button>}<button className="secondary" onClick={()=>setShowAddActivity(v=>!v)}>Add activity</button></div></div>
      {showAddActivity&&<form className="stageForm liveActivityForm" onSubmit={addActivity}><div className="stageFormGrid"><label>Type<select name="activity_type" defaultValue="short_answer"><option value="poll">Poll</option><option value="multiple_choice">Multiple choice</option><option value="rating">Confidence/rating</option><option value="short_answer">Short answer</option><option value="scenario">Scenario</option><option value="reflection">Reflection</option><option value="exit_ticket">Exit ticket</option></select></label><label>Response display<select name="response_mode" defaultValue="anonymous"><option value="anonymous">Anonymous to facilitator view</option><option value="named">Named</option></select></label><label className="full">Title<input required name="title"/></label><label className="full">Prompt<textarea required name="prompt" rows={3}/></label><label className="full">Options<textarea name="options" rows={3} placeholder="One option per line for polls, ratings or multiple choice"/></label><label>Confidence phase<select name="confidence_phase" defaultValue="none"><option value="none">Not a confidence check</option><option value="pre">Before CPD</option><option value="post">After CPD</option></select></label><label><span>Completion</span><span><input name="required" type="checkbox" defaultChecked style={{width:"auto",marginRight:7}}/>Required</span></label></div><button className="primary">Add activity</button></form>}
      <div className="facilitatorActivityList">{activities.map((a,index)=><div key={a.id} className={`facilitatorActivity ${a.is_open?"open":""}`}><span className="activityIndex">{index+1}</span><div><strong>{a.title}</strong><small>{a.activity_type.replaceAll("_"," ")} · {a.required?"required":"optional"} · {a.confidence_phase!=="none"?`${a.confidence_phase}-confidence · `:""}{responses.filter(r=>r.activity_id===a.id).length} responses</small></div><select className="privacySelect" value={a.response_mode} onChange={e=>updateActivityPrivacy(a,e.target.value as Activity["response_mode"])}><option value="anonymous">Anonymous</option><option value="named">Named</option></select><span className={`statusPill ${a.is_open?"live":"draft"}`}>{a.is_open?"open":"closed"}</span><button className="secondary" disabled={selected.status!=="live"||a.is_open} onClick={()=>openActivity(a)}>{a.is_open?"Live now":"Open"}</button></div>)}</div></section>

      <section className="phaseCard liveRecap"><span className="eyebrow">LIVE RECAP</span><h3>Responses and confidence shift</h3><div className="recapGrid">{activities.map(a=><ActivityRecap key={a.id} activity={a} responses={responses.filter(r=>r.activity_id===a.id)} participantNames={participantNames}/>)}</div><ConfidenceShift activities={activities} responses={responses}/></section>
    </>}</div></section>
  </main>;
}

function ActivityRecap({activity,responses,participantNames}:{activity:Activity;responses:LiveResponse[];participantNames:Map<string,string>}){
  const values=responses.map(r=>String(r.response?.value??"")).filter(Boolean);const options=Array.isArray(activity.options)?activity.options.map(String):[];
  const counts=options.map(option=>({option,count:values.filter(v=>v===option).length}));
  return <div className="recapCard"><div><strong>{activity.title}</strong><span>{responses.length} responses · {activity.response_mode}</span></div>{counts.length>0?<div className="recapBars">{counts.map(x=><div key={x.option}><span>{x.option}</span><progress max={Math.max(1,responses.length)} value={x.count}/><b>{x.count}</b></div>)}</div>:<div className="recapText">{responses.slice(-5).map(r=><p key={r.id}><b>{activity.response_mode==="anonymous"?"Anonymous":participantNames.get(r.user_id)||"Staff"}:</b> {String(r.response?.value||"")}</p>)}{!responses.length&&<span className="muted">No responses yet.</span>}</div>}</div>;
}

function ConfidenceShift({activities,responses}:{activities:Activity[];responses:LiveResponse[]}){
  const average=(phase:"pre"|"post")=>{const ids=new Set(activities.filter(a=>a.confidence_phase===phase).map(a=>a.id));const vals=responses.filter(r=>ids.has(r.activity_id)).map(r=>Number(r.response?.value)).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;};
  const pre=average("pre"),post=average("post");
  return <div className="confidenceShift"><strong>Confidence shift</strong><span>Before: {pre===null?"—":pre.toFixed(1)} / 5</span><span>After: {post===null?"—":post.toFixed(1)} / 5</span><b>{pre!==null&&post!==null?`${post-pre>=0?"+":""}${(post-pre).toFixed(1)}`:"Complete pre/post checks"}</b></div>;
}

function makeCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let result="";const random=new Uint32Array(8);crypto.getRandomValues(random);for(const n of random)result+=chars[n%chars.length];return result;}
function addMinutes(minutes:number){return new Date(Date.now()+minutes*60000).toISOString();}
function expiryText(value:string|null,fallback:string){if(!value)return fallback;const ms=new Date(value).getTime()-Date.now();if(ms<=0)return"Expired — rotate to issue a fresh code";return`Expires ${new Date(value).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`;}
function localDateTime(){const d=new Date(Date.now()+15*60000);const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);}
function initials(name:string){return(name||"Staff").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();}
