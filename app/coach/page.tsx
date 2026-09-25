"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCoachPlan, type CoachRecommendation } from "@/lib/smartCoach";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Audit = { recommended_courses:string[]; priority_domains:string[]; summary:string };
type Target = { title:string; linked_course_id:string|null; review_date:string|null; status:string };
type Action = { title:string; review_date:string|null; status:string };
type Assignment = { title_snapshot:string; target_type:string; target_id:string; due_date:string|null; mandatory:boolean; status:string };
type SavedPlan = { id:string; title:string; summary:string; recommendations:CoachRecommendation[]; created_at:string };

export default function CoachPage(){
  const [userId,setUserId]=useState("");
  const [audit,setAudit]=useState<Audit|null>(null);
  const [targets,setTargets]=useState<Target[]>([]);
  const [actions,setActions]=useState<Action[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [completed,setCompleted]=useState<string[]>([]);
  const [savedPlans,setSavedPlans]=useState<SavedPlan[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    const client=getSupabaseBrowserClient(); if(!client){setLoading(false);return;} let alive=true;
    (async()=>{
      const {data:auth}=await client.auth.getUser(); if(!auth.user){window.location.href="/auth?next=/coach";return;} if(!alive)return; setUserId(auth.user.id);
      const [a,t,ap,as,p,sp]=await Promise.all([
        client.from("needs_audits").select("recommended_courses,priority_domains,summary").eq("user_id",auth.user.id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
        client.from("development_targets").select("title,linked_course_id,review_date,status").eq("user_id",auth.user.id),
        client.from("action_plans").select("title,review_date,status").eq("user_id",auth.user.id),
        client.from("cpd_assignments").select("title_snapshot,target_type,target_id,due_date,mandatory,status").eq("assigned_to",auth.user.id),
        client.from("course_progress").select("course_id,completed_at").eq("user_id",auth.user.id).not("completed_at","is",null),
        client.from("smart_coach_plans").select("id,title,summary,recommendations,created_at").eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(6)
      ]);
      const errors=[a.error,t.error,ap.error,as.error,p.error,sp.error].filter(Boolean); if(errors.length)setMessage(errors.map(e=>e?.message).join(" · "));
      setAudit((a.data as Audit)||null); setTargets((t.data||[]) as Target[]); setActions((ap.data||[]) as Action[]); setAssignments((as.data||[]) as Assignment[]); setCompleted((p.data||[]).map((x:{course_id:string})=>x.course_id)); setSavedPlans((sp.data||[]) as SavedPlan[]); setLoading(false);
    })(); return()=>{alive=false;};
  },[]);

  const plan=useMemo(()=>buildCoachPlan({auditCourseIds:audit?.recommended_courses||[],completedCourseIds:completed,targets,actions,assignments}),[audit,completed,targets,actions,assignments]);

  async function savePlan(){
    const client=getSupabaseBrowserClient(); if(!client||!userId)return;
    const {data,error}=await client.from("smart_coach_plans").insert({user_id:userId,title:`CPD plan · ${new Date().toLocaleDateString("en-GB")}`,summary:plan.summary,recommendations:plan.recommendations,source_snapshot:{audit_priorities:audit?.priority_domains||[],completed_count:completed.length,active_targets:targets.filter(t=>t.status==="active").length,open_assignments:assignments.filter(a=>!["completed","waived"].includes(a.status)).length}}).select("id,title,summary,recommendations,created_at").single();
    if(error){setMessage(error.message);return;} setSavedPlans(prev=>[data as SavedPlan,...prev].slice(0,6)); setMessage("Personal CPD plan saved.");
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Building your CPD Coach view…</div></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 9 · SMART CPD COACH</span><h1>A practical next-step coach that still works offline-first.</h1><p>The coach combines your audit, completed learning, active targets, implementation reviews and assigned training. It explains why each suggestion appears rather than hiding the logic behind a black box.</p><div className="stageHeroActions"><button className="primary" onClick={savePlan}>Save this plan</button><a className="secondary phaseLinkButton" href="/needs-audit">Update needs audit</a><a className="secondary phaseLinkButton" href="/coaching">Coaching cycles</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageGrid">
      <div className="stageCard stageSpan8"><span className="eyebrow">TODAY'S PLAN</span><h2>What to focus on next</h2><p>{plan.summary}</p><div className="coachRecommendations">{plan.recommendations.map((r,i)=><div className="coachRecommendation" key={`${r.type}-${r.title}-${i}`}><div className={`priorityStripe ${r.priority}`}></div><div><div className="coachMeta"><span className={`stageBadge ${r.priority==="high"?"bad":r.priority==="medium"?"warn":""}`}>{r.priority}</span><span>{r.type}</span></div><strong>{r.title}</strong><p>{r.reason}</p></div><a className="secondary phaseLinkButton" href={r.href}>Open</a></div>)}{!plan.recommendations.length&&<div className="emptyCompact">No recommendations are needed right now.</div>}</div></div>
      <aside className="stageCard stageSpan4"><span className="eyebrow">INPUTS</span><h2>What the coach used</h2><div className="stageList"><div className="stageRow"><div className="stageRowMain"><strong>Needs audit</strong><span>{audit?`${audit.priority_domains.length} priority areas identified`:"Not completed yet"}</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>Completed courses</strong><span>{completed.length} completions</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>Development targets</strong><span>{targets.filter(t=>t.status==="active").length} active</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>Implementation plans</strong><span>{actions.filter(a=>!["completed","abandoned"].includes(a.status)).length} open</span></div></div><div className="stageRow"><div className="stageRowMain"><strong>Assignments</strong><span>{assignments.filter(a=>!["completed","waived"].includes(a.status)).length} open</span></div></div></div></aside>
    </section>
    <section className="stageCard"><span className="eyebrow">SAVED PLANS</span><h2>Your recent CPD plans</h2><div className="stageList">{savedPlans.map(p=><div className="stageRow" key={p.id}><div className="stageRowMain"><strong>{p.title}</strong><span>{new Date(p.created_at).toLocaleString("en-GB")}</span><small>{p.summary}</small></div><span className="stageBadge">{(p.recommendations||[]).length} actions</span></div>)}{!savedPlans.length&&<div className="emptyCompact">Save the current plan to build a history of your professional-development priorities.</div>}</div></section>
  </main>;
}
