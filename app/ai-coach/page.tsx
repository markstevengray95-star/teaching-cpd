"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { buildCoachPlan } from "@/lib/smartCoach";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Message={role:"user"|"assistant";content:string};
type Conversation={id:string;title:string;goal:string;messages:Message[];updated_at:string};
type Target={title:string;linked_course_id:string|null;review_date:string|null;status:string};
type Action={title:string;review_date:string|null;status:string};
type Assignment={title_snapshot:string;target_type:string;target_id:string;due_date:string|null;mandatory:boolean;status:string};

export default function AiCoachPage(){
  const [userId,setUserId]=useState(""); const [goal,setGoal]=useState(""); const [messages,setMessages]=useState<Message[]>([]); const [history,setHistory]=useState<Conversation[]>([]); const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false); const [mode,setMode]=useState("smart-fallback"); const [message,setMessage]=useState("");
  const [context,setContext]=useState({completedCount:0,activeTargets:0,openActions:0,openAssignments:0,planSummary:"",planActions:[] as string[]});

  useEffect(()=>{const supabase=getSupabaseBrowserClient();(async()=>{const {data:auth}=await supabase.auth.getUser();if(!auth.user){window.location.href="/auth?next=/ai-coach";return;}setUserId(auth.user.id);const [audit,progress,targets,actions,assignments,conversations]=await Promise.all([
    supabase.from("needs_audits").select("recommended_courses").eq("user_id",auth.user.id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("course_progress").select("course_id,completed_at").eq("user_id",auth.user.id).not("completed_at","is",null),
    supabase.from("development_targets").select("title,linked_course_id,review_date,status").eq("user_id",auth.user.id),
    supabase.from("action_plans").select("title,review_date,status").eq("user_id",auth.user.id),
    supabase.from("cpd_assignments").select("title_snapshot,target_type,target_id,due_date,mandatory,status").eq("assigned_to",auth.user.id),
    supabase.from("cpd_coach_conversations").select("id,title,goal,messages,updated_at").eq("user_id",auth.user.id).order("updated_at",{ascending:false}).limit(8)
  ]);const completed=(progress.data||[]).map((r:{course_id:string})=>r.course_id);const t=(targets.data||[]) as Target[];const a=(actions.data||[]) as Action[];const as=(assignments.data||[]) as Assignment[];const plan=buildCoachPlan({auditCourseIds:(audit.data?.recommended_courses||[]) as string[],completedCourseIds:completed,targets:t,actions:a,assignments:as});setContext({completedCount:completed.length,activeTargets:t.filter(x=>x.status==="active").length,openActions:a.filter(x=>!["completed","abandoned"].includes(x.status)).length,openAssignments:as.filter(x=>!["completed","waived"].includes(x.status)).length,planSummary:plan.summary,planActions:plan.recommendations.map(r=>`${r.title}: ${r.reason}`)});setHistory((conversations.data||[]) as Conversation[]);setLoading(false);})();},[]);

  const canSend=useMemo(()=>goal.trim().length>3&&!sending,[goal,sending]);
  async function ask(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!canSend)return;const formEl=e.currentTarget;const form=new FormData(formEl);const text=String(form.get("prompt")||"").trim();if(!text)return;const next=[...messages,{role:"user",content:text} as Message];setMessages(next);setSending(true);const response=await authenticatedFetch("/api/ai-coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal,context,messages:next})});const data=await response.json().catch(()=>({text:"Unable to generate a response right now.",mode:"smart-fallback"}));if(response.status===401){setSending(false);setMessage("Your sign-in session has expired. Please sign in again.");return;}const reply={role:"assistant" as const,content:String(data.text||"Unable to generate a response right now.")};setMessages([...next,reply]);setMode(String(data.mode||"smart-fallback"));setSending(false);formEl.reset();}

  async function saveConversation(){if(!userId||!goal.trim()||!messages.length)return;const supabase=getSupabaseBrowserClient();const payload={user_id:userId,title:goal.slice(0,70),goal,messages,context_snapshot:context,updated_at:new Date().toISOString()};const {data,error}=await supabase.from("cpd_coach_conversations").insert(payload).select("id,title,goal,messages,updated_at").single();if(error){setMessage(error.message);return;}setHistory(prev=>[data as Conversation,...prev].slice(0,8));setMessage("Coach conversation saved to your account.");}

  const modeLabel=mode==="gemini"?"Gemini response":mode==="openai"?"OpenAI fallback":"Smart fallback";

  if(loading)return <main className="stagePage"><div className="stageCard">Preparing your CPD Coach…</div></main>;
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">AI CPD COACH</span><h1>Turn a professional-development goal into a practical next move.</h1><p>The coach combines your course history, active targets and implementation actions with your reflection. Gemini is used server-side when configured, and the key is never sent to the browser. The coach never ranks staff and should not be used for identifiable pupil information.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/coach">Open recommendation plan</a><a className="secondary phaseLinkButton" href="/pathways">Development pathways</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageGrid"><div className="stageCard stageSpan8"><span className="eyebrow">COACH CONVERSATION</span><label className="featureGoalLabel">What are you trying to improve?<input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. Improve the quality of whole-class checking for understanding"/></label><div className="featureChat">{messages.length?messages.map((m,i)=><div key={i} className={`featureBubble ${m.role}`}><strong>{m.role==="user"?"You":"Coach"}</strong><p>{m.content}</p></div>):<div className="emptyCompact">Set a goal, then ask the coach to help you diagnose the issue, choose a course, design a small trial or review evidence.</div>}</div><form className="featureChatComposer" onSubmit={ask}><textarea name="prompt" rows={3} placeholder="Ask a reflective question or describe what you have tried…"/><button className="primary" disabled={!canSend}>{sending?"Thinking…":"Ask coach"}</button></form><div className="phaseActions"><button className="secondary" onClick={saveConversation} disabled={!messages.length}>Save conversation</button><span className="stageBadge">{modeLabel}</span></div></div>
      <aside className="stageCard stageSpan4"><span className="eyebrow">CONTEXT</span><h2>What the coach can use</h2><div className="stageList"><div className="stageRow"><div className="stageRowMain"><strong>{context.completedCount}</strong><span>completed courses</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>{context.activeTargets}</strong><span>active targets</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>{context.openActions}</strong><span>implementation actions</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>{context.openAssignments}</strong><span>open assignments</span></div></div></div><p className="muted">Do not enter identifiable pupil information, safeguarding disclosures or confidential personnel details into the coach.</p></aside>
    </section>
    <section className="stageCard"><span className="eyebrow">SAVED COACHING</span><h2>Recent conversations</h2><div className="stageList">{history.map(c=><button className="stageRow featureHistoryButton" key={c.id} onClick={()=>{setGoal(c.goal);setMessages(c.messages||[]);}}><div className="stageRowMain"><strong>{c.title}</strong><span>{new Date(c.updated_at).toLocaleString("en-GB")}</span><small>{(c.messages||[]).length} messages</small></div></button>)}{!history.length&&<div className="emptyCompact">No saved coach conversations yet.</div>}</div></section>
  </main>;
}
