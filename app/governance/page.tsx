"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;department:string;school_id:string|null};
type School={id:string;name:string;code:string;active:boolean};
type Staff={id:string;full_name:string;role:string;department:string;school_id:string|null};
type Review={id:string;school_id:string;course_type:"catalogue"|"custom";course_id:string;title_snapshot:string;academic_year:string;review_due_on:string;reviewed_on:string|null;status:"due"|"approved"|"revise"|"archived";review_notes:string};
type CustomCourse={id:string;title:string;status:string;school_id:string|null;current_version_number:number};
type SchoolSummary={school_id:string;school_name:string;active:boolean;staff_count:number;course_completions:number;live_completions:number;open_assignments:number;governance_due:number};

export default function GovernancePage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [schools,setSchools]=useState<School[]>([]);
  const [staff,setStaff]=useState<Staff[]>([]);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [customCourses,setCustomCourses]=useState<CustomCourse[]>([]);
  const [trustSummary,setTrustSummary]=useState<SchoolSummary[]>([]);
  const [reviewSchool,setReviewSchool]=useState("");
  const [courseType,setCourseType]=useState<"catalogue"|"custom">("catalogue");
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();let alive=true;
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();if(!auth.user){window.location.href="/auth?next=/governance";return;}
      const {data:p,error:pe}=await supabase.from("staff_profiles").select("id,full_name,role,department,school_id").eq("id",auth.user.id).single();
      if(!alive)return;if(pe||!p){setMessage(pe?.message||"Unable to load profile.");setLoading(false);return;}
      const me=p as Profile;setProfile(me);setReviewSchool(me.school_id||"");
      if(!["CPD Lead","Admin"].includes(me.role)){setLoading(false);return;}
      const [s,st,r,c]=await Promise.all([
        supabase.from("schools").select("id,name,code,active").order("name"),
        supabase.from("staff_profiles").select("id,full_name,role,department,school_id").order("full_name"),
        supabase.from("course_governance_reviews").select("id,school_id,course_type,course_id,title_snapshot,academic_year,review_due_on,reviewed_on,status,review_notes").order("review_due_on"),
        supabase.from("custom_courses").select("id,title,status,school_id,current_version_number").order("title"),
      ]);
      const errs=[s.error,st.error,r.error,c.error].filter(Boolean);if(errs.length)setMessage(errs.map(e=>e?.message).join(" · "));
      setSchools((s.data||[]) as School[]);setStaff((st.data||[]) as Staff[]);setReviews((r.data||[]) as Review[]);setCustomCourses((c.data||[]) as CustomCourse[]);
      if(me.role==="Admin"){const {data,error}=await supabase.rpc("trust_school_summary");if(error)setMessage(error.message);else if(Array.isArray(data))setTrustSummary(data as SchoolSummary[]);}
      setLoading(false);
    })();return()=>{alive=false;};
  },[]);

  const isAdmin=profile?.role==="Admin";
  const currentSchool=schools.find(s=>s.id===profile?.school_id);
  const dueReviews=reviews.filter(r=>r.status==="due"&&new Date(r.review_due_on).getTime()<=Date.now()).length;
  const visibleCustom=useMemo(()=>customCourses.filter(c=>!reviewSchool||c.school_id===reviewSchool),[customCourses,reviewSchool]);

  async function createSchool(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!profile||!isAdmin)return;
    const name=String(form.get("name")||"").trim();const code=String(form.get("code")||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"-");
    const {data,error}=await supabase.from("schools").insert({name,code,created_by:profile.id}).select("id,name,code,active").single();
    if(error){setMessage(error.message);return;}setSchools(prev=>[...prev,data as School].sort((a,b)=>a.name.localeCompare(b.name)));setMessage("School added to the trust directory.");formEl.reset();
  }

  async function moveStaff(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!isAdmin)return;
    const userId=String(form.get("user_id")||"");const schoolId=String(form.get("school_id")||"");
    const {error}=await supabase.from("staff_profiles").update({school_id:schoolId}).eq("id",userId);
    if(error){setMessage(error.message);return;}setStaff(prev=>prev.map(s=>s.id===userId?{...s,school_id:schoolId}:s));setMessage("Staff school assignment updated.");formEl.reset();
  }

  async function createReview(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!profile)return;
    const schoolId=String(form.get("school_id")||profile.school_id||"");const targetId=String(form.get("course_id")||"");
    const core=courses.find(c=>c.id===targetId);const custom=customCourses.find(c=>c.id===targetId);const title=courseType==="catalogue"?core?.title:custom?.title;
    if(!title){setMessage("Choose a valid course for the review.");return;}
    const {data,error}=await supabase.from("course_governance_reviews").insert({school_id:schoolId,course_type:courseType,course_id:targetId,title_snapshot:title,academic_year:String(form.get("academic_year")||""),review_due_on:String(form.get("review_due_on")||""),created_by:profile.id}).select("id,school_id,course_type,course_id,title_snapshot,academic_year,review_due_on,reviewed_on,status,review_notes").single();
    if(error){setMessage(error.message);return;}setReviews(prev=>[...prev,data as Review].sort((a,b)=>a.review_due_on.localeCompare(b.review_due_on)));setMessage("Course governance review scheduled.");formEl.reset();setCourseType("catalogue");
  }

  async function updateReview(item:Review,status:Review["status"]){
    const supabase=getSupabaseBrowserClient();const notes=window.prompt(status==="approved"?"Optional review note:":"What needs to change before approval?",item.review_notes||"")??item.review_notes;
    const patch={status,review_notes:notes,reviewed_on:status==="approved"||status==="revise"?new Date().toISOString().slice(0,10):item.reviewed_on};
    const {error}=await supabase.from("course_governance_reviews").update(patch).eq("id",item.id);if(error){setMessage(error.message);return;}setReviews(prev=>prev.map(r=>r.id===item.id?{...r,...patch}:r));setMessage("Governance review updated.");
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading governance console…</div></main>;
  if(!profile||!["CPD Lead","Admin"].includes(profile.role))return <main className="stagePage"><section className="stageCard"><span className="eyebrow">STAGE 14 · GOVERNANCE</span><h1>CPD Lead or Admin access required</h1><p>Course governance and cross-school administration are restricted because they contain organisation-level controls.</p><a className="secondary phaseLinkButton" href="/">Back to CPD Hub</a></section></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 14 · TRUST & GOVERNANCE</span><h1>Keep CPD current, school-aware and reviewable.</h1><p>{isAdmin?"Admin has cross-school oversight; CPD Leads are limited to their own school.":`You are managing CPD for ${currentSchool?.name||"your school"}.`} Annual review records make it clear which courses need checking, revision or approval.</p></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{isAdmin?schools.length:1}</strong><span>{isAdmin?"schools in directory":"school context"}</span></div><div className="stageStat"><strong>{staff.length}</strong><span>staff visible to your role</span></div><div className="stageStat"><strong>{reviews.length}</strong><span>course review records</span></div><div className="stageStat"><strong>{dueReviews}</strong><span>reviews currently due</span></div></section>

    {isAdmin&&<section className="stageCard"><span className="eyebrow">TRUST OVERVIEW</span><h2>Cross-school aggregate view</h2><p className="muted">Counts only; private reflections, coaching notes and observation text are not included.</p><div className="stageList">{trustSummary.map(s=><div className="stageRow" key={s.school_id}><div className="stageRowMain"><strong>{s.school_name}</strong><span>{s.staff_count} staff · {s.course_completions} course completions · {s.live_completions} live CPD completions</span><small>{s.open_assignments} open assignments · {s.governance_due} governance items due</small></div><span className={`stageBadge ${s.active?"good":""}`}>{s.active?"active":"inactive"}</span></div>)}{!trustSummary.length&&<div className="emptyCompact">No trust-level activity yet.</div>}</div></section>}

    <section className="stageGrid">
      <div className="stageSpan5"><details className="stageDetails" open><summary>Schedule annual course review</summary><form className="stageForm" onSubmit={createReview}><div className="stageFormGrid">{isAdmin&&<label className="full">School<select name="school_id" value={reviewSchool} onChange={e=>setReviewSchool(e.target.value)} required>{schools.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}<label>Course type<select value={courseType} onChange={e=>setCourseType(e.target.value as "catalogue"|"custom")}><option value="catalogue">Core catalogue</option><option value="custom">School-created</option></select></label><label>Academic year<input name="academic_year" placeholder="2026/27"/></label><label className="full">Course<select required name="course_id"><option value="">Choose…</option>{courseType==="catalogue"?courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>):visibleCustom.map(c=><option key={c.id} value={c.id}>{c.title} · v{c.current_version_number}</option>)}</select></label><label>Review due<input required name="review_due_on" type="date"/></label></div><button className="primary">Schedule review</button></form></details></div>
      <div className="stageCard stageSpan7"><span className="eyebrow">QUALITY ASSURANCE</span><h2>Course review register</h2><div className="stageList">{reviews.map(r=><div className="stageRow" key={r.id}><div className="stageRowMain"><strong>{r.title_snapshot}</strong><span>{schools.find(s=>s.id===r.school_id)?.name||"School"} · {r.course_type} · due {new Date(r.review_due_on).toLocaleDateString("en-GB")}</span><small>{r.review_notes||r.academic_year||"No review notes yet"}</small></div><div className="rowActions"><span className={`stageBadge ${r.status==="approved"?"good":r.status==="revise"?"warn":(r.status==="due"&&new Date(r.review_due_on).getTime()<=Date.now())?"bad":""}`}>{r.status}</span>{r.status!=="archived"&&<><button className="smallButton" onClick={()=>updateReview(r,"approved")}>Approve</button><button className="smallButton" onClick={()=>updateReview(r,"revise")}>Revise</button></>}</div></div>)}{!reviews.length&&<div className="emptyCompact">No course review records yet.</div>}</div></div>
    </section>

    {isAdmin&&<section className="stageGrid"><div className="stageSpan6"><details className="stageDetails"><summary>Add a school</summary><form className="stageForm" onSubmit={createSchool}><div className="stageFormGrid"><label className="full">School name<input required name="name"/></label><label className="full">Short code<input required name="code" placeholder="e.g. adcote"/></label></div><button className="primary">Add school</button></form></details></div><div className="stageSpan6"><details className="stageDetails"><summary>Move staff member to a school</summary><form className="stageForm" onSubmit={moveStaff}><div className="stageFormGrid"><label className="full">Staff<select required name="user_id"><option value="">Choose…</option>{staff.map(s=><option key={s.id} value={s.id}>{s.full_name} · {s.department||s.role}</option>)}</select></label><label className="full">School<select required name="school_id"><option value="">Choose…</option>{schools.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div><button className="primary">Update school assignment</button></form></details></div></section>}
  </main>;
}
