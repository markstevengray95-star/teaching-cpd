"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;department:string|null};
type Progress={course_id:string;completed_at:string|null;updated_at:string};
type Target={id:string;title:string;description:string;review_date:string|null;status:string;linked_course_id:string|null};
type Assignment={id:string;title_snapshot:string;due_date:string|null;mandatory:boolean;status:string;target_id:string};
type Review={id:string;source_id:string;source_title:string;review_stage:string;due_on:string;reviewed_at:string|null;implementation_status:string|null;evidence_type:string|null;impact_note:string|null};
type Pathway={id:string;role_focus:string;goal:string;selected_course_ids:string[];target_completion:string|null;status:string;updated_at:string};

export default function DashboardPage(){
  const [profile,setProfile]=useState<Profile|null>(null);const [progress,setProgress]=useState<Progress[]>([]);const [targets,setTargets]=useState<Target[]>([]);const [assignments,setAssignments]=useState<Assignment[]>([]);const [reviews,setReviews]=useState<Review[]>([]);const [pathways,setPathways]=useState<Pathway[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");
  useEffect(()=>{const client=getSupabaseBrowserClient();(async()=>{const {data:auth}=await client.auth.getUser();if(!auth.user){window.location.href="/auth?next=/dashboard";return;}const [p,pr,t,a,r,pa]=await Promise.all([
    client.from("staff_profiles").select("id,full_name,role,department").eq("id",auth.user.id).maybeSingle(),
    client.from("course_progress").select("course_id,completed_at,updated_at").eq("user_id",auth.user.id).order("updated_at",{ascending:false}),
    client.from("development_targets").select("id,title,description,review_date,status,linked_course_id").eq("user_id",auth.user.id).order("updated_at",{ascending:false}),
    client.from("cpd_assignments").select("id,title_snapshot,due_date,mandatory,status,target_id").eq("assigned_to",auth.user.id).order("due_date",{ascending:true}),
    client.from("cpd_impact_reviews").select("id,source_id,source_title,review_stage,due_on,reviewed_at,implementation_status,evidence_type,impact_note").eq("user_id",auth.user.id).order("due_on",{ascending:true}),
    client.from("personal_pathway_plans").select("id,role_focus,goal,selected_course_ids,target_completion,status,updated_at").eq("user_id",auth.user.id).order("updated_at",{ascending:false}).limit(3),
  ]);setProfile((p.data||null) as Profile|null);setProgress((pr.data||[]) as Progress[]);setTargets((t.data||[]) as Target[]);setAssignments((a.data||[]) as Assignment[]);setReviews((r.data||[]) as Review[]);setPathways((pa.data||[]) as Pathway[]);setMessage([p.error,pr.error,t.error,a.error,r.error,pa.error].filter(Boolean).map(x=>x!.message).join(" · "));setLoading(false);})();},[]);

  const completed=new Set(progress.filter(p=>p.completed_at).map(p=>p.course_id));
  const activePathway=pathways.find(p=>p.status==="active")||pathways[0];
  const pathwayCourses=(activePathway?.selected_course_ids||[]).map(id=>courses.find(c=>c.id===id)).filter(Boolean);
  const nextPathway=pathwayCourses.find(c=>c&&!completed.has(c.id));
  const openAssignments=assignments.filter(a=>!["completed","waived"].includes(a.status));
  const pendingReviews=reviews.filter(r=>!r.reviewed_at);
  const today=new Date().toISOString().slice(0,10);
  const dueReviews=pendingReviews.filter(r=>r.due_on<=today);
  const activeTargets=targets.filter(t=>t.status==="active");
  const recentEvidence=reviews.filter(r=>r.reviewed_at&&(r.evidence_type||r.impact_note)).slice(-4).reverse();
  const recommendation=useMemo(()=>{
    if(dueReviews[0])return {title:`Complete ${labelStage(dueReviews[0].review_stage)} review`,text:`${dueReviews[0].source_title} is due for implementation follow-up.`,href:"/impact"};
    if(openAssignments[0])return {title:`Continue ${openAssignments[0].title_snapshot}`,text:openAssignments[0].due_date?`Due ${formatDate(openAssignments[0].due_date)}.`:"This CPD has been assigned to you.",href:openAssignments[0].target_id?.startsWith("custom:")?"/training":"/"};
    if(nextPathway)return {title:`Next pathway course: ${nextPathway.title}`,text:activePathway?.goal||"Continue your personalised development pathway.",href:`/?course=${encodeURIComponent(nextPathway.id)}`};
    if(activeTargets[0])return {title:`Move your target forward: ${activeTargets[0].title}`,text:"Choose one small action and the evidence you will review afterwards.",href:"/actions"};
    return {title:"Choose your next development focus",text:"Build a personal pathway or ask the AI CPD Coach for a practical next step.",href:"/pathways/personal"};
  },[dueReviews,openAssignments,nextPathway,activeTargets,activePathway]);

  if(loading)return <main className="stagePage"><div className="stageCard">Building your staff-development dashboard…</div></main>;
  return <main className="stagePage aiPlatformPage">
    <section className="stageHero staffDashboardHero"><span className="eyebrow">STAFF DEVELOPMENT DASHBOARD</span><h1>{profile?.full_name?`${firstName(profile.full_name)}'s development workspace`:"Your development workspace"}</h1><p>One place for CPD, pathways, implementation, evidence and the next action that matters.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href={recommendation.href}>{recommendation.title}</a><a className="secondary phaseLinkButton" href="/ai-coach">Ask AI Coach</a><a className="secondary phaseLinkButton" href="/knowledge-base">School knowledge</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="dashboardStats"><div><strong>{progress.filter(p=>p.completed_at).length}</strong><span>completed CPD</span></div><div><strong>{openAssignments.length}</strong><span>open assignments</span></div><div><strong>{activeTargets.length}</strong><span>active targets</span></div><div><strong>{pendingReviews.length}</strong><span>follow-ups ahead</span></div></section>

    <section className="stageGrid"><article className="stageCard stageSpan7 dashboardNext"><span className="eyebrow">RECOMMENDED NEXT ACTION</span><h2>{recommendation.title}</h2><p>{recommendation.text}</p><a className="primary phaseLinkButton" href={recommendation.href}>Continue →</a></article><aside className="stageCard stageSpan5"><span className="eyebrow">YOUR PROFILE</span><h2>{profile?.role||"Staff"}</h2><p>{profile?.department||"Whole-school development"}</p><div className="phaseActions"><a className="secondary phaseLinkButton" href="/portfolio">Portfolio</a><a className="secondary phaseLinkButton" href="/certificates">Certificates</a></div></aside></section>

    <section className="stageGrid"><article className="stageCard stageSpan6"><span className="eyebrow">PERSONAL PATHWAY</span><h2>{activePathway?.goal||"No active personal pathway"}</h2>{activePathway?<><p>{activePathway.role_focus}{activePathway.target_completion?` · target ${formatDate(activePathway.target_completion)}`:""}</p><div className="dashboardCourseList">{pathwayCourses.slice(0,6).map(course=>course&&<div key={course.id} className={completed.has(course.id)?"done":""}><span>{completed.has(course.id)?"✓":"○"}</span><strong>{course.title}</strong></div>)}</div></>:<p>Create a pathway from your role, current goal and completed learning.</p>}<a className="secondary phaseLinkButton" href="/pathways/personal">{activePathway?"Update pathway":"Build pathway"}</a></article><article className="stageCard stageSpan6"><span className="eyebrow">ASSIGNED CPD</span><h2>{openAssignments.length} open</h2><div className="stageList">{openAssignments.slice(0,5).map(a=><div className="stageRow" key={a.id}><div className="stageRowMain"><strong>{a.title_snapshot}</strong><span>{a.mandatory?"Mandatory":"Recommended"}{a.due_date?` · due ${formatDate(a.due_date)}`:""}</span></div></div>)}{!openAssignments.length&&<div className="emptyCompact">No assigned CPD is waiting.</div>}</div><a className="secondary phaseLinkButton" href="/training">My training</a></article></section>

    <section className="stageGrid"><article className="stageCard stageSpan6"><span className="eyebrow">DEVELOPMENT TARGETS</span><h2>What you are working on</h2><div className="stageList">{activeTargets.slice(0,4).map(t=><div className="stageRow" key={t.id}><div className="stageRowMain"><strong>{t.title}</strong><span>{t.description||"Active target"}</span><small>{t.review_date?`Review ${formatDate(t.review_date)}`:"No review date set"}</small></div></div>)}{!activeTargets.length&&<div className="emptyCompact">No active development targets.</div>}</div><a className="secondary phaseLinkButton" href="/development">Development cycle</a></article><article className="stageCard stageSpan6"><span className="eyebrow">IMPLEMENTATION FOLLOW-UP</span><h2>{pendingReviews.length} reviews scheduled</h2><div className="stageList">{pendingReviews.slice(0,4).map(r=><div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.source_title}</strong><span>{labelStage(r.review_stage)}</span><small>{r.due_on<=today?"Due now":`Due ${formatDate(r.due_on)}`}</small></div><span className={`stageBadge ${r.due_on<=today?"warn":""}`}>{r.due_on<=today?"due":"scheduled"}</span></div>)}{!pendingReviews.length&&<div className="emptyCompact">No implementation reviews are waiting.</div>}</div><a className="secondary phaseLinkButton" href="/impact">Impact reviews</a></article></section>

    <section className="stageGrid"><article className="stageCard stageSpan7"><span className="eyebrow">RECENT EVIDENCE</span><h2>What your follow-up is showing</h2><div className="stageList">{recentEvidence.map(r=><div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.source_title}</strong><span>{r.evidence_type||"Reflection evidence"}</span><small>{r.impact_note||r.implementation_status||"Review completed"}</small></div></div>)}{!recentEvidence.length&&<div className="emptyCompact">Complete a Phase 6 review to start building an evidence trail.</div>}</div></article><aside className="stageCard stageSpan5"><span className="eyebrow">QUICK TOOLS</span><h2>Continue your development</h2><div className="dashboardQuickLinks"><a href="/ai-coach">AI CPD Coach</a><a href="/knowledge-base">School Knowledge</a><a href="/pathways/personal">Personal Pathway</a><a href="/actions">Action Plans</a><a href="/training">My Training</a><a href="/portfolio">Evidence Portfolio</a></div></aside></section>
  </main>;
}

function firstName(name:string){return name.trim().split(/\s+/)[0]||name;}
function formatDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}
function labelStage(stage:string){if(stage==="day_7")return "7-day transfer";if(stage==="day_30")return "30-day impact";if(stage==="day_90")return "90-day sustain";return stage.replaceAll("_"," ");}
