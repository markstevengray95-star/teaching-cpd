"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { pathways } from "@/lib/pathways";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id:string; full_name:string; role:string; department:string; school_id:string|null };
type Priority = { id:string; title:string; description:string; academic_year:string; scope:"school"|"department"; department:string|null; active:boolean; review_date:string|null; school_id:string|null };
type Observation = { id:string; observed_on:string; source_type:string; focus:string; strength:string; development_area:string; notes:string; priority_id:string|null; linked_course_id:string|null; linked_pathway_id:string|null; shared_with_leadership:boolean };
type Target = { id:string; title:string; description:string; success_criteria:string; review_date:string|null; status:string; priority_id:string|null };
type SummaryRow = { id:string; title:string; scope:string; department:string|null; active:boolean; linked_targets:number; shared_observations:number };

export default function ImprovementPage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [priorities,setPriorities]=useState<Priority[]>([]);
  const [observations,setObservations]=useState<Observation[]>([]);
  const [targets,setTargets]=useState<Target[]>([]);
  const [summary,setSummary]=useState<SummaryRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();let alive=true;
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();
      if(!auth.user){window.location.href="/auth?next=/improvement";return;}
      const {data:p,error:pe}=await supabase.from("staff_profiles").select("id,full_name,role,department,school_id").eq("id",auth.user.id).single();
      if(!alive)return;
      if(pe||!p){setMessage(pe?.message||"Unable to load your staff profile.");setLoading(false);return;}
      const me=p as Profile;setProfile(me);
      const [pr,ob,tg]=await Promise.all([
        supabase.from("improvement_priorities").select("id,title,description,academic_year,scope,department,active,review_date,school_id").order("active",{ascending:false}).order("title"),
        supabase.from("professional_observation_links").select("id,observed_on,source_type,focus,strength,development_area,notes,priority_id,linked_course_id,linked_pathway_id,shared_with_leadership").eq("user_id",auth.user.id).order("observed_on",{ascending:false}),
        supabase.from("development_targets").select("id,title,description,success_criteria,review_date,status,priority_id").eq("user_id",auth.user.id).order("created_at",{ascending:false}),
      ]);
      const errs=[pr.error,ob.error,tg.error].filter(Boolean);if(errs.length)setMessage(errs.map(e=>e?.message).join(" · "));
      setPriorities((pr.data||[]) as Priority[]);setObservations((ob.data||[]) as Observation[]);setTargets((tg.data||[]) as Target[]);
      if(["Department Lead","CPD Lead","Admin"].includes(me.role)){
        const {data}=await supabase.rpc("priority_engagement_summary"); if(alive&&Array.isArray(data))setSummary(data as SummaryRow[]);
      }
      setLoading(false);
    })();return()=>{alive=false;};
  },[]);

  const activePriorities=priorities.filter(p=>p.active);
  const relevantPriorities=useMemo(()=>activePriorities.filter(p=>p.scope==="school"||!p.department||p.department===profile?.department),[activePriorities,profile?.department]);
  const canManage=profile&&["CPD Lead","Admin"].includes(profile.role);

  async function createPriority(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!profile)return;
    const scope=String(form.get("scope")||"school");
    const {data,error}=await supabase.from("improvement_priorities").insert({
      title:String(form.get("title")||"").trim(),description:String(form.get("description")||""),academic_year:String(form.get("academic_year")||""),scope,department:scope==="department"?String(form.get("department")||"")||profile.department:null,review_date:String(form.get("review_date")||"")||null,created_by:profile.id,school_id:profile.school_id
    }).select("id,title,description,academic_year,scope,department,active,review_date,school_id").single();
    if(error){setMessage(error.message);return;}setPriorities(prev=>[data as Priority,...prev]);setMessage("Improvement priority added.");formEl.reset();
  }

  async function createObservation(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!profile)return;
    const {data,error}=await supabase.from("professional_observation_links").insert({
      user_id:profile.id,school_id:profile.school_id,observed_on:String(form.get("observed_on")||"")||new Date().toISOString().slice(0,10),source_type:String(form.get("source_type")||"self_review"),focus:String(form.get("focus")||"").trim(),strength:String(form.get("strength")||""),development_area:String(form.get("development_area")||""),notes:String(form.get("notes")||""),priority_id:String(form.get("priority_id")||"")||null,linked_course_id:String(form.get("linked_course_id")||"")||null,linked_pathway_id:String(form.get("linked_pathway_id")||"")||null,shared_with_leadership:Boolean(form.get("shared_with_leadership"))
    }).select("id,observed_on,source_type,focus,strength,development_area,notes,priority_id,linked_course_id,linked_pathway_id,shared_with_leadership").single();
    if(error){setMessage(error.message);return;}setObservations(prev=>[data as Observation,...prev]);setMessage("Professional learning note saved privately to your account.");formEl.reset();
  }

  async function createTarget(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const formEl=e.currentTarget;const form=new FormData(formEl);const supabase=getSupabaseBrowserClient();if(!profile)return;
    const {data,error}=await supabase.from("development_targets").insert({user_id:profile.id,title:String(form.get("title")||"").trim(),description:String(form.get("description")||""),success_criteria:String(form.get("success_criteria")||""),review_date:String(form.get("review_date")||"")||null,priority_id:String(form.get("priority_id")||"")||null}).select("id,title,description,success_criteria,review_date,status,priority_id").single();
    if(error){setMessage(error.message);return;}setTargets(prev=>[data as Target,...prev]);setMessage("Development target created and linked to the priority.");formEl.reset();
  }

  async function toggleShare(item:Observation){
    const supabase=getSupabaseBrowserClient();const next=!item.shared_with_leadership;const {error}=await supabase.from("professional_observation_links").update({shared_with_leadership:next}).eq("id",item.id);
    if(error){setMessage(error.message);return;}setObservations(prev=>prev.map(o=>o.id===item.id?{...o,shared_with_leadership:next}:o));setMessage(next?"This entry is now explicitly shared with authorised CPD leadership.":"This entry is private again.");
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading school development links…</div></main>;
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 13 · SCHOOL IMPROVEMENT LINKS</span><h1>Connect CPD to real development priorities.</h1><p>Link professional learning to school or department priorities, convert observation/self-review into a focused development target, and choose explicitly whether any observation note is shared with CPD leadership.</p></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{relevantPriorities.length}</strong><span>active relevant priorities</span></div><div className="stageStat"><strong>{targets.filter(t=>t.status==="active").length}</strong><span>active targets</span></div><div className="stageStat"><strong>{observations.length}</strong><span>professional learning notes</span></div><div className="stageStat"><strong>{observations.filter(o=>o.shared_with_leadership).length}</strong><span>explicitly shared</span></div></section>

    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">CURRENT PRIORITIES</span><h2>School and department focus</h2><div className="stageList">{relevantPriorities.map(p=><div className="stageRow" key={p.id}><div className="stageRowMain"><strong>{p.title}</strong><span>{p.description||"No description"}</span><small>{p.scope==="department"?`Department · ${p.department||"Unspecified"}`:"Whole school"}{p.academic_year?` · ${p.academic_year}`:""}{p.review_date?` · review ${new Date(p.review_date).toLocaleDateString("en-GB")}`:""}</small></div><span className="stageBadge good">active</span></div>)}{!relevantPriorities.length&&<div className="emptyCompact">No active priorities have been published yet.</div>}</div></div>
      <div className="stageCard stageSpan5"><span className="eyebrow">WHY LINK IT?</span><h2>Keep CPD connected to practice</h2><p>A useful development chain is: identify a priority → notice a specific classroom behaviour → choose focused learning → test a change → review evidence. The note itself remains private unless you turn sharing on.</p><a className="secondary phaseLinkButton" href="/coach">Open CPD Coach</a></div>
    </section>

    <section className="stageGrid">
      <div className="stageSpan6"><details className="stageDetails" open><summary>Record observation or self-review</summary><form className="stageForm" onSubmit={createObservation}><div className="stageFormGrid"><label>Date<input name="observed_on" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label><label>Source<select name="source_type"><option value="self_review">Self-review</option><option value="learning_walk">Learning walk</option><option value="formal_observation">Formal observation</option><option value="coaching">Coaching</option><option value="other">Other</option></select></label><label className="full">Focus<input required name="focus" placeholder="e.g. Checking for understanding before independent practice"/></label><label className="full">What is already working?<textarea name="strength" rows={2}/></label><label className="full">Development area<textarea name="development_area" rows={2}/></label><label>Improvement priority<select name="priority_id"><option value="">None</option>{relevantPriorities.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label>Linked course<select name="linked_course_id"><option value="">None</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Linked pathway<select name="linked_pathway_id"><option value="">None</option>{pathways.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label className="full">Private notes<textarea name="notes" rows={3}/></label><label className="full inlineCheck"><input name="shared_with_leadership" type="checkbox"/>Explicitly share this entry with authorised CPD leadership</label></div><button className="primary">Save professional learning note</button></form></details></div>
      <div className="stageSpan6"><details className="stageDetails" open><summary>Create a development target from a priority</summary><form className="stageForm" onSubmit={createTarget}><div className="stageFormGrid"><label className="full">Target title<input required name="title" placeholder="One specific behaviour or outcome"/></label><label className="full">What will change?<textarea name="description" rows={3}/></label><label className="full">Success criteria<textarea name="success_criteria" rows={3} placeholder="What evidence will show improvement?"/></label><label>Priority<select name="priority_id"><option value="">None</option>{relevantPriorities.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label>Review date<input name="review_date" type="date"/></label></div><button className="primary">Create linked target</button></form></details></div>
    </section>

    <section className="stageCard"><span className="eyebrow">YOUR PROFESSIONAL LEARNING NOTES</span><h2>Observation and self-review history</h2><div className="stageList">{observations.map(o=><div className="stageRow" key={o.id}><div className="stageRowMain"><strong>{o.focus}</strong><span>{o.development_area||o.strength||"Professional learning note"}</span><small>{new Date(o.observed_on).toLocaleDateString("en-GB")} · {o.source_type.replaceAll("_"," ")}</small></div><button className="smallButton" onClick={()=>toggleShare(o)}>{o.shared_with_leadership?"Make private":"Share"}</button></div>)}{!observations.length&&<div className="emptyCompact">No observation or self-review notes yet.</div>}</div></section>

    {canManage&&<section className="stageGrid"><div className="stageSpan5"><details className="stageDetails"><summary>Create school/department priority</summary><form className="stageForm" onSubmit={createPriority}><div className="stageFormGrid"><label className="full">Title<input required name="title"/></label><label className="full">Description<textarea name="description" rows={3}/></label><label>Academic year<input name="academic_year" placeholder="2026/27"/></label><label>Scope<select name="scope"><option value="school">Whole school</option><option value="department">Department</option></select></label><label>Department<input name="department" placeholder={profile?.department||"Science"}/></label><label>Review date<input name="review_date" type="date"/></label></div><button className="primary">Publish priority</button></form></details></div><div className="stageCard stageSpan7"><span className="eyebrow">AGGREGATE ENGAGEMENT</span><h2>Priority uptake</h2><p className="muted">Counts only. Private observation notes are not shown unless the staff member explicitly shares them.</p><div className="stageList">{summary.map(s=><div className="stageRow" key={s.id}><div className="stageRowMain"><strong>{s.title}</strong><span>{s.linked_targets} linked targets · {s.shared_observations} shared observation notes</span></div><span className={`stageBadge ${s.active?"good":""}`}>{s.active?"active":"inactive"}</span></div>)}{!summary.length&&<div className="emptyCompact">No priority engagement yet.</div>}</div></div></section>}
  </main>;
}
