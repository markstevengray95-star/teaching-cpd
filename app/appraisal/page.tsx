"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatWorkflowDate } from "@/lib/schoolWorkflows";

type Profile={id:string;full_name:string;role:string;department:string;organisation_id:string|null};
type Objective={id:string;organisation_id:string;user_id:string;title:string;description:string;success_criteria:string;linked_course_ids:string[];review_date:string|null;status:string;shared_with_leadership:boolean;created_at:string};
type Evidence={id:string;objective_id:string;user_id:string;evidence_type:string;evidence_reference:string|null;note:string;shared_with_leadership:boolean;created_at:string};
type Review={id:string;organisation_id:string;user_id:string;reviewer_id:string|null;cycle_label:string;review_type:string;scheduled_on:string|null;status:string;employee_reflection:string;reviewer_summary:string;agreed_actions:unknown[];next_review_date:string|null;shared_with_leadership:boolean;created_at:string};
type Progress={course_id:string;completed_at:string|null};

const EMPTY_OBJECTIVE={title:"",description:"",successCriteria:"",reviewDate:"",courseId:"",share:true};

export default function AppraisalPage(){
  const [me,setMe]=useState<Profile|null>(null);const [staff,setStaff]=useState<Profile[]>([]);const [objectives,setObjectives]=useState<Objective[]>([]);const [evidence,setEvidence]=useState<Evidence[]>([]);const [reviews,setReviews]=useState<Review[]>([]);const [progress,setProgress]=useState<Progress[]>([]);const [loading,setLoading]=useState(true);const [notice,setNotice]=useState("");
  const [objectiveForm,setObjectiveForm]=useState(EMPTY_OBJECTIVE);const [evidenceObjective,setEvidenceObjective]=useState("");const [evidenceType,setEvidenceType]=useState("Reflection");const [evidenceNote,setEvidenceNote]=useState("");const [evidenceRef,setEvidenceRef]=useState("");
  const [reviewUser,setReviewUser]=useState("");const [reviewType,setReviewType]=useState("mid_year");const [reviewDate,setReviewDate]=useState("");const [cycleLabel,setCycleLabel]=useState("2026/27");const [reflection,setReflection]=useState("");
  const isAdmin=Boolean(me&&["CPD Lead","Admin"].includes(me.role));

  async function load(){
    const client=getSupabaseBrowserClient();const {data:auth}=await client.auth.getUser();if(!auth.user){window.location.href="/auth?next=/appraisal";return;}
    const {data:profile,error:profileError}=await client.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("id",auth.user.id).maybeSingle();
    const p=(profile||null) as Profile|null;setMe(p);setReviewUser(auth.user.id);
    const [o,e,r,pr,s]=await Promise.all([
      client.from("appraisal_objectives").select("*").order("updated_at",{ascending:false}),
      client.from("appraisal_evidence").select("*").order("created_at",{ascending:false}),
      client.from("appraisal_reviews").select("*").order("scheduled_on",{ascending:false}),
      client.from("staff_development_course_progress").select("course_id,completed_at").eq("user_id",auth.user.id),
      p&&["CPD Lead","Admin"].includes(p.role)&&p.organisation_id?client.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("organisation_id",p.organisation_id).order("full_name"):Promise.resolve({data:[],error:null}),
    ]);
    setObjectives((o.data||[]) as Objective[]);setEvidence((e.data||[]) as Evidence[]);setReviews((r.data||[]) as Review[]);setProgress((pr.data||[]) as Progress[]);setStaff((s.data||[]) as Profile[]);
    setNotice([profileError,o.error,e.error,r.error,pr.error,s.error].filter(Boolean).map(x=>x!.message).join(" · "));setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  const completed=new Set(progress.filter(row=>row.completed_at).map(row=>row.course_id));
  const ownObjectives=objectives.filter(o=>o.user_id===me?.id);const sharedObjectives=objectives.filter(o=>o.user_id!==me?.id);
  const ownReviews=reviews.filter(r=>r.user_id===me?.id||r.reviewer_id===me?.id);const sharedReviews=reviews.filter(r=>r.user_id!==me?.id&&r.reviewer_id!==me?.id);
  const evidenceByObjective=useMemo(()=>new Map(objectives.map(o=>[o.id,evidence.filter(item=>item.objective_id===o.id)])),[objectives,evidence]);

  async function createObjective(){
    if(!me?.organisation_id||!objectiveForm.title.trim()||!objectiveForm.successCriteria.trim())return setNotice("Add an objective title and success criteria first.");
    const client=getSupabaseBrowserClient();const {error}=await client.from("appraisal_objectives").insert({organisation_id:me.organisation_id,user_id:me.id,title:objectiveForm.title.trim(),description:objectiveForm.description.trim(),success_criteria:objectiveForm.successCriteria.trim(),standard_codes:[],linked_course_ids:objectiveForm.courseId?[objectiveForm.courseId]:[],review_date:objectiveForm.reviewDate||null,status:"active",shared_with_leadership:objectiveForm.share,created_by:me.id});
    if(error)return setNotice(error.message);setObjectiveForm(EMPTY_OBJECTIVE);setNotice("Objective added.");await load();
  }

  async function addEvidence(){
    if(!me||!evidenceObjective||!evidenceNote.trim())return setNotice("Choose an objective and add a short evidence note.");
    const client=getSupabaseBrowserClient();const objective=objectives.find(o=>o.id===evidenceObjective);const {error}=await client.from("appraisal_evidence").insert({objective_id:evidenceObjective,user_id:me.id,evidence_type:evidenceType,evidence_reference:evidenceRef.trim()||null,note:evidenceNote.trim(),shared_with_leadership:Boolean(objective?.shared_with_leadership)});
    if(error)return setNotice(error.message);setEvidenceNote("");setEvidenceRef("");setNotice("Evidence added to the objective.");await load();
  }

  async function createReview(){
    if(!me?.organisation_id||!reviewUser)return;const client=getSupabaseBrowserClient();const {error}=await client.from("appraisal_reviews").insert({organisation_id:me.organisation_id,user_id:reviewUser,reviewer_id:isAdmin&&reviewUser!==me.id?me.id:null,cycle_label:cycleLabel.trim()||"Current cycle",review_type:reviewType,scheduled_on:reviewDate||null,status:reviewDate?"scheduled":"draft",employee_reflection:reviewUser===me.id?reflection.trim():"",reviewer_summary:"",agreed_actions:[],next_review_date:null,shared_with_leadership:isAdmin||reviewUser===me.id,created_by:me.id});
    if(error)return setNotice(error.message);setReflection("");setReviewDate("");setNotice("Professional review created.");await load();
  }

  async function updateReview(review:Review,patch:Partial<Review>){
    const client=getSupabaseBrowserClient();const {error}=await client.from("appraisal_reviews").update({...patch,updated_at:new Date().toISOString()}).eq("id",review.id);if(error)return setNotice(error.message);await load();
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading appraisal workspace…</div></main>;
  return <main className="stagePage schoolWorkflowPage">
    <section className="stageHero workflowHero"><span className="eyebrow">APPRAISAL & PROFESSIONAL REVIEW</span><h1>Development objectives connected to real CPD and evidence.</h1><p>Set objectives, attach implementation evidence and prepare professional reviews without turning appraisal into a staff-ranking system.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/dashboard">Back to dashboard</a><a className="secondary phaseLinkButton" href="/portfolio">Evidence portfolio</a><a className="secondary phaseLinkButton" href="/pathways/personal">Personal pathway</a></div></section>
    {notice&&<div className="phaseNotice">{notice}</div>}
    <section className="workflowStats"><div><strong>{ownObjectives.filter(o=>o.status==="active").length}</strong><span>active objectives</span></div><div><strong>{evidence.filter(e=>ownObjectives.some(o=>o.id===e.objective_id)).length}</strong><span>evidence items</span></div><div><strong>{ownReviews.length}</strong><span>review records</span></div><div><strong>{completed.size}</strong><span>completed CPD</span></div></section>

    <section className="stageGrid"><article className="stageCard stageSpan7"><span className="eyebrow">MY OBJECTIVES</span><h2>Current professional priorities</h2><div className="stageList">{ownObjectives.map(o=><div className="workflowObjective" key={o.id}><div><strong>{o.title}</strong><p>{o.description||"No additional description."}</p><small>Success: {o.success_criteria}</small><div className="workflowPills"><span>{o.status}</span>{o.review_date&&<span>Review {formatWorkflowDate(o.review_date)}</span>}{o.linked_course_ids.map(id=><span key={id}>{completed.has(id)?"✓ ":""}{courses.find(c=>c.id===id)?.title||id}</span>)}</div></div><aside><b>{evidenceByObjective.get(o.id)?.length||0}</b><small>evidence</small></aside></div>)}{!ownObjectives.length&&<div className="emptyCompact">No appraisal objectives yet.</div>}</div></article>
      <aside className="stageCard stageSpan5"><span className="eyebrow">ADD OBJECTIVE</span><h2>Define a measurable development goal</h2><div className="workflowForm"><input placeholder="Objective title" value={objectiveForm.title} onChange={e=>setObjectiveForm({...objectiveForm,title:e.target.value})}/><textarea placeholder="What are you trying to improve?" value={objectiveForm.description} onChange={e=>setObjectiveForm({...objectiveForm,description:e.target.value})}/><textarea placeholder="Success criteria — what evidence would show progress?" value={objectiveForm.successCriteria} onChange={e=>setObjectiveForm({...objectiveForm,successCriteria:e.target.value})}/><select value={objectiveForm.courseId} onChange={e=>setObjectiveForm({...objectiveForm,courseId:e.target.value})}><option value="">Optional linked CPD</option>{courses.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select><input type="date" value={objectiveForm.reviewDate} onChange={e=>setObjectiveForm({...objectiveForm,reviewDate:e.target.value})}/><label className="workflowCheck"><input type="checkbox" checked={objectiveForm.share} onChange={e=>setObjectiveForm({...objectiveForm,share:e.target.checked})}/> Share this objective with leadership/reviewer</label><button className="primary" onClick={createObjective}>Add objective</button></div></aside></section>

    <section className="stageGrid"><article className="stageCard stageSpan6"><span className="eyebrow">EVIDENCE</span><h2>Add evidence against an objective</h2><div className="workflowForm"><select value={evidenceObjective} onChange={e=>setEvidenceObjective(e.target.value)}><option value="">Choose objective</option>{ownObjectives.map(o=><option value={o.id} key={o.id}>{o.title}</option>)}</select><select value={evidenceType} onChange={e=>setEvidenceType(e.target.value)}>{["Reflection","CPD implementation","Pupil work","Coaching/observation","Learning walk","Planning/resource","Other"].map(v=><option key={v}>{v}</option>)}</select><input placeholder="Optional evidence link/reference" value={evidenceRef} onChange={e=>setEvidenceRef(e.target.value)}/><textarea placeholder="What does this evidence show?" value={evidenceNote} onChange={e=>setEvidenceNote(e.target.value)}/><button className="primary" onClick={addEvidence}>Add evidence</button></div></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">PROFESSIONAL REVIEW</span><h2>Create or schedule a review</h2><div className="workflowForm">{isAdmin&&<select value={reviewUser} onChange={e=>setReviewUser(e.target.value)}>{staff.map(person=><option value={person.id} key={person.id}>{person.full_name} · {person.department}</option>)}</select>}<input value={cycleLabel} onChange={e=>setCycleLabel(e.target.value)} placeholder="Cycle e.g. 2026/27"/><select value={reviewType} onChange={e=>setReviewType(e.target.value)}><option value="initial">Initial review</option><option value="mid_year">Mid-year review</option><option value="final">Final review</option></select><input type="date" value={reviewDate} onChange={e=>setReviewDate(e.target.value)}/>{reviewUser===me?.id&&<textarea placeholder="Reflection before the meeting" value={reflection} onChange={e=>setReflection(e.target.value)}/>}<button className="primary" onClick={createReview}>{isAdmin&&reviewUser!==me?.id?"Schedule review":"Create review"}</button></div></article></section>

    <section className="stageCard"><span className="eyebrow">REVIEW HISTORY</span><h2>Professional review record</h2><div className="stageList">{ownReviews.map(r=><div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.cycle_label} · {r.review_type.replace("_"," ")}</strong><span>{r.scheduled_on?formatWorkflowDate(r.scheduled_on):"Date not set"} · {r.status}</span><small>{r.employee_reflection||r.reviewer_summary||"No reflection or summary recorded yet."}</small></div>{r.status!=="completed"&&<button className="secondary" onClick={()=>updateReview(r,{status:r.status==="agreed"?"completed":"agreed"})}>{r.status==="agreed"?"Mark complete":"Mark agreed"}</button>}</div>)}{!ownReviews.length&&<div className="emptyCompact">No professional reviews recorded yet.</div>}</div></section>

    {isAdmin&&(sharedObjectives.length>0||sharedReviews.length>0)&&<section className="stageCard"><span className="eyebrow">LEADERSHIP VIEW</span><h2>Shared appraisal information</h2><p className="workflowPrivacy">Only objectives/evidence shared for leadership and review records your role is authorised to access are shown. This is a development view, not a teacher-quality ranking.</p><div className="stageList">{sharedObjectives.slice(0,12).map(o=><div className="stageRow" key={o.id}><div className="stageRowMain"><strong>{staff.find(s=>s.id===o.user_id)?.full_name||"Staff member"}: {o.title}</strong><span>{o.success_criteria}</span><small>{evidenceByObjective.get(o.id)?.length||0} shared evidence items</small></div></div>)}{sharedReviews.slice(0,8).map(r=><div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{staff.find(s=>s.id===r.user_id)?.full_name||"Staff member"}: {r.review_type.replace("_"," ")}</strong><span>{r.status} · {r.scheduled_on?formatWorkflowDate(r.scheduled_on):"unscheduled"}</span></div></div>)}</div></section>}
  </main>;
}
