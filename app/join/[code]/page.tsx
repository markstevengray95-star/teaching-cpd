"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Session = { id:string; title:string; presenter_name:string; location:string; description:string; objectives:string[]; starts_at:string; status:"draft"|"live"|"closed"; exit_code?:string; exit_code_expires_at?:string|null };
type Activity = { id:string; session_id:string; sort_order:number; activity_type:string; title:string; prompt:string; options:unknown; required:boolean; is_open:boolean; response_mode:"named"|"anonymous"; confidence_phase:"none"|"pre"|"post" };
type Profile = { id:string; full_name:string; department:string };
type AnswerMap = Record<string,string>;

export default function JoinSessionPage(){
  const params=useParams<{code:string}>();const code=String(params?.code||"").toUpperCase();
  const [session,setSession]=useState<Session|null>(null);const [profile,setProfile]=useState<Profile|null>(null);const [activities,setActivities]=useState<Activity[]>([]);const [answers,setAnswers]=useState<AnswerMap>({});const [joined,setJoined]=useState(false);const [exitMode,setExitMode]=useState(false);const [message,setMessage]=useState("");const [loading,setLoading]=useState(true);const [exitReflection,setExitReflection]=useState("");

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();let mounted=true;
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();if(!auth.user){window.location.href=`/auth?next=${encodeURIComponent(`/join/${code}`)}`;return;}
      const {data:p,error:profileError}=await supabase.from("staff_profiles").select("id,full_name,department").eq("id",auth.user.id).single();if(profileError||!p){if(mounted){setMessage(profileError?.message||"Your staff profile could not be loaded.");setLoading(false);}return;}
      const staff=p as Profile;if(mounted)setProfile(staff);

      const {data:joinData,error:joinError}=await supabase.rpc("check_in_live_session",{p_code:code,p_display_name:staff.full_name});
      let loaded:Session|null=null;let isExit=false;
      if(!joinError&&Array.isArray(joinData)&&joinData[0]){
        loaded=joinData[0] as Session;if(mounted){setJoined(true);setMessage("You are checked in. The facilitator will push activities to this screen.");}
      }else{
        const {data:s}=await supabase.from("live_sessions").select("id,title,presenter_name,location,description,objectives,starts_at,status,exit_code,exit_code_expires_at").eq("exit_code",code).maybeSingle();
        if(s){loaded=s as Session;isExit=true;const {data:participant}=await supabase.from("live_participants").select("session_id,final_reflection").eq("session_id",s.id).eq("user_id",auth.user.id).maybeSingle();if(participant){if(mounted){setJoined(true);setExitReflection(String(participant.final_reflection||""));}}}
      }
      if(!loaded){if(mounted){setMessage(joinError?.message||"This CPD code is invalid, expired or not available to this account.");setLoading(false);}return;}
      if(mounted){setSession(loaded);setExitMode(isExit);}
      const [{data:a},{data:existing},{data:participant}]=await Promise.all([
        supabase.from("live_activities").select("*").eq("session_id",loaded.id).order("sort_order"),
        supabase.from("live_responses").select("activity_id,response").eq("session_id",loaded.id).eq("user_id",auth.user.id),
        supabase.from("live_participants").select("session_id,final_reflection").eq("session_id",loaded.id).eq("user_id",auth.user.id).maybeSingle(),
      ]);
      if(mounted){setActivities((a||[]) as Activity[]);setJoined(Boolean(participant)||!isExit);setExitReflection(String(participant?.final_reflection||""));const map:AnswerMap={};(existing||[]).forEach((r:{activity_id:string;response:{value?:string}})=>{map[r.activity_id]=String(r.response?.value??"");});setAnswers(map);setLoading(false);}
    })();return()=>{mounted=false;};
  },[code]);

  useEffect(()=>{
    if(!session)return;const supabase=getSupabaseBrowserClient();let mounted=true;
    const refresh=async()=>{const [{data:a},{data:s}]=await Promise.all([supabase.from("live_activities").select("*").eq("session_id",session.id).order("sort_order"),supabase.from("live_sessions").select("id,title,presenter_name,location,description,objectives,starts_at,status,exit_code,exit_code_expires_at").eq("id",session.id).maybeSingle()]);if(mounted){setActivities((a||[]) as Activity[]);if(s)setSession(s as Session);}};
    const channel=supabase.channel(`staff-session-${session.id}`).on("postgres_changes",{event:"*",schema:"public",table:"live_activities",filter:`session_id=eq.${session.id}`},refresh).on("postgres_changes",{event:"UPDATE",schema:"public",table:"live_sessions",filter:`id=eq.${session.id}`},refresh).subscribe();
    return()=>{mounted=false;supabase.removeChannel(channel);};
  },[session?.id]);

  async function saveAnswer(activity:Activity,value:string){
    const supabase=getSupabaseBrowserClient();if(!session||!profile||!joined)return;if(!activity.is_open){setMessage("That activity has closed. Wait for the facilitator to open the next one.");return;}
    const {error}=await supabase.from("live_responses").upsert({session_id:session.id,activity_id:activity.id,user_id:profile.id,response:{value}},{onConflict:"activity_id,user_id"});if(error){setMessage(error.message);return;}
    const next={...answers,[activity.id]:value};setAnswers(next);const required=activities.filter(a=>a.required).map(a=>a.id);const complete=required.filter(id=>Boolean(next[id])).length;
    await supabase.from("live_participants").update({status:required.length>0&&complete>=required.length?"activities_complete":"participated"}).eq("session_id",session.id).eq("user_id",profile.id);setMessage(activity.response_mode==="anonymous"?"Response saved. It will be shown anonymously in the facilitator recap.":"Response saved.");
  }

  async function completeExit(){
    if(!session||!joined){setMessage("You need to have checked in before completing the exit reflection.");return;}if(exitReflection.trim().length<10){setMessage("Add a short reflection before completing the session.");return;}
    const {error}=await getSupabaseBrowserClient().rpc("complete_live_session_exit",{p_code:code,p_reflection:exitReflection.trim()});if(error){setMessage(error.message);return;}setMessage("CPD completed. Your participation and reflection have been recorded.");
  }

  const visibleActivities=useMemo(()=>activities.filter(a=>a.is_open||Boolean(answers[a.id])),[activities,answers]);const openCount=activities.filter(a=>a.is_open).length;
  if(loading)return <main className="joinPage"><div className="joinCard">Loading CPD session…</div></main>;
  if(!session)return <main className="joinPage"><div className="joinCard"><span className="eyebrow">LIVE CPD</span><h1>Session unavailable</h1><p>{message||"This code is not active or you do not have access to it."}</p><a className="secondary phaseLinkButton" href="/">Back to CPD Hub</a></div></main>;

  return <main className="joinPage"><section className="joinCard joinHeaderCard"><span className="eyebrow">{exitMode?"EXIT REFLECTION":"LIVE CPD SESSION"}</span><h1>{session.title}</h1><p>{session.description}</p><div className="joinMeta"><span>Presenter: {session.presenter_name||"CPD Lead"}</span><span>{session.location||"School CPD"}</span><span className={`statusPill ${session.status}`}>{session.status}</span></div>{message&&<div className="feedback">{message}</div>}</section>

    {joined&&!exitMode&&<section className="joinActivities">{openCount===0&&session.status==="live"&&<div className="joinCard waitingCard"><span className="waitingPulse"/><div><strong>Waiting for the facilitator</strong><p>The next activity will appear here automatically.</p></div></div>}{visibleActivities.map((a,index)=><ActivityCard key={a.id} activity={a} index={index} value={answers[a.id]||""} onSave={value=>saveAnswer(a,value)}/>)}{session.status==="closed"&&<div className="joinCard"><strong>Session closed</strong><p>The live activities have finished. Use the facilitator’s exit QR to record your final reflection.</p></div>}</section>}

    {exitMode&&<section className="joinCard"><span className="eyebrow">FINAL STEP</span><h2>Reflect and complete</h2>{!joined?<p>This account has not checked into this session, so it cannot be marked complete.</p>:<><p>What will you take away from this CPD, and what will you try in your own practice?</p><textarea className="reflectionBox" rows={7} value={exitReflection} onChange={e=>setExitReflection(e.target.value)} placeholder="Record a useful professional reflection…"/><button className="primary full bigAction" onClick={completeExit}>Complete CPD</button></>}</section>}
  </main>;
}

function ActivityCard({activity,index,value,onSave}:{activity:Activity;index:number;value:string;onSave:(value:string)=>void}){
  const options=Array.isArray(activity.options)?activity.options.map(String):[];const choice=["poll","multiple_choice","rating","scenario"].includes(activity.activity_type)&&options.length>0;const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);
  return <article className={`joinCard activityCard ${activity.is_open?"activityOpen":"activityClosed"}`}><div className="activityNumber">{index+1}</div><div className="activityBody"><span className="eyebrow">{activity.activity_type.replaceAll("_"," ")}{activity.confidence_phase!=="none"?` · ${activity.confidence_phase}`:""}</span><h2>{activity.title}</h2><p>{activity.prompt}</p>{activity.response_mode==="anonymous"&&<div className="anonymousNote">Your response is shown anonymously in the facilitator recap.</div>}{!activity.is_open&&value?<div className="savedResponse">✓ Response saved · facilitator has moved on</div>:choice?<div className="joinOptions">{options.map(opt=><button key={opt} className={value===opt?"option selected":"option"} onClick={()=>onSave(opt)}>{opt}</button>)}</div>:<><textarea className="reflectionBox" rows={4} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type your response…"/><button className="primary" disabled={!draft.trim()} onClick={()=>onSave(draft.trim())}>{value?"Update response":"Submit response"}</button></>}{activity.is_open&&value&&<div className="savedResponse">✓ Response saved</div>}</div></article>;
}
