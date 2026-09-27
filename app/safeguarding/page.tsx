"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;organisation_id:string|null};
type Requirement={code:string;title:string;audience:string;requirement_kind:string;frequency_months:number|null;guidance_source_id:string|null;guidance_version:string;statutory_basis:string;certificate_rule:string;active:boolean};
type Evidence={id:string;requirement_code:string;completed_at:string;valid_until:string|null;evidence_kind:string;provider_name:string;certificate_number:string|null;accrediting_body:string|null;evidence_url:string|null;guidance_version:string;verified_at:string|null;notes:string};
type RoleAssignment={id:string;user_id:string;safeguarding_role:string;active:boolean;notes:string};
type Guidance={id:string;title:string;publisher:string;source_url:string;version_label:string;effective_date:string|null;last_verified_on:string;next_check_on:string|null;status:string};
type Summary={requirement_code:string;title:string;required_count:number;current_count:number;overdue_count:number};
type StaffRow={user_id:string;email:string;full_name:string;role:string;department:string;active:boolean};

const roleLabels:Record<string,string>={dsl:"Designated Safeguarding Lead",deputy_dsl:"Deputy DSL",governor_trustee:"Safeguarding Governor / Trustee",safer_recruitment_panel:"Safer Recruitment Panel",prevent_lead:"Prevent Lead",it_safeguarding:"Filtering & Monitoring / IT Safeguarding"};

export default function SafeguardingPage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [requirements,setRequirements]=useState<Requirement[]>([]);
  const [evidence,setEvidence]=useState<Evidence[]>([]);
  const [roles,setRoles]=useState<RoleAssignment[]>([]);
  const [guidance,setGuidance]=useState<Guidance[]>([]);
  const [summary,setSummary]=useState<Summary[]>([]);
  const [staff,setStaff]=useState<StaffRow[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);

  const leader=Boolean(profile&&["CPD Lead","Admin"].includes(profile.role));
  const admin=profile?.role==="Admin";

  useEffect(()=>{let alive=true;(async()=>{
    const c=getSupabaseBrowserClient();
    const {data:auth}=await c.auth.getUser();
    if(!auth.user){window.location.href="/auth?next=/safeguarding";return;}
    const {data:p,error:pErr}=await c.from("staff_profiles").select("id,full_name,role,organisation_id").eq("id",auth.user.id).single();
    if(!alive)return;
    if(pErr||!p){setMessage(pErr?.message||"Unable to load your profile.");setLoading(false);return;}
    setProfile(p as Profile);
    if(!p.organisation_id){setLoading(false);return;}
    const base=await Promise.all([
      c.from("safeguarding_requirements").select("*").eq("active",true).order("title"),
      c.from("safeguarding_evidence").select("id,requirement_code,completed_at,valid_until,evidence_kind,provider_name,certificate_number,accrediting_body,evidence_url,guidance_version,verified_at,notes").eq("user_id",auth.user.id).order("completed_at",{ascending:false}),
      c.from("safeguarding_role_assignments").select("id,user_id,safeguarding_role,active,notes").eq("user_id",auth.user.id).eq("active",true),
      c.from("system_guidance_sources").select("id,title,publisher,source_url,version_label,effective_date,last_verified_on,next_check_on,status").order("title"),
    ]);
    if(!alive)return;
    setRequirements((base[0].data||[]) as Requirement[]);setEvidence((base[1].data||[]) as Evidence[]);setRoles((base[2].data||[]) as RoleAssignment[]);setGuidance((base[3].data||[]) as Guidance[]);
    const errs=base.map(x=>x.error?.message).filter(Boolean);if(errs.length)setMessage(errs.join(" · "));
    if(["CPD Lead","Admin"].includes(p.role)){
      const {data,error}=await c.rpc("safeguarding_school_summary");if(error)setMessage(prev=>[prev,error.message].filter(Boolean).join(" · "));else setSummary((data||[]) as Summary[]);
    }
    if(p.role==="Admin"){
      const [{data:s,error:sErr},{data:r,error:rErr}]=await Promise.all([c.rpc("school_admin_list_staff"),c.from("safeguarding_role_assignments").select("id,user_id,safeguarding_role,active,notes").eq("organisation_id",p.organisation_id).eq("active",true)]);
      if(sErr||rErr)setMessage(prev=>[prev,sErr?.message,rErr?.message].filter(Boolean).join(" · "));setStaff((s||[]) as StaffRow[]);setRoles((r||[]) as RoleAssignment[]);
    }
    setLoading(false);
  })();return()=>{alive=false};},[]);

  const myRoleCodes=useMemo(()=>new Set(roles.filter(r=>r.user_id===profile?.id&&r.active).map(r=>r.safeguarding_role)),[roles,profile?.id]);
  const myRequirements=useMemo(()=>requirements.filter(r=>r.audience==="all_staff"||myRoleCodes.has(r.audience)),[requirements,myRoleCodes]);
  const latestByRequirement=useMemo(()=>{const map=new Map<string,Evidence>();for(const e of evidence)if(!map.has(e.requirement_code))map.set(e.requirement_code,e);return map;},[evidence]);
  const currentCount=useMemo(()=>myRequirements.filter(r=>isCurrent(latestByRequirement.get(r.code))).length,[myRequirements,latestByRequirement]);

  async function acknowledgeKcsie(){if(!profile?.organisation_id)return;setBusy(true);setMessage("");const c=getSupabaseBrowserClient();const {error}=await c.from("safeguarding_evidence").insert({organisation_id:profile.organisation_id,user_id:profile.id,requirement_code:"kcsie-part-one-2026",evidence_kind:"acknowledgement",provider_name:"Department for Education / school acknowledgement",guidance_version:"KCSIE 2026",notes:"Staff member confirmed they have read KCSIE 2026 Part One in full and will follow school safeguarding policies and procedures."});setBusy(false);if(error){setMessage(error.message);return;}setMessage("KCSIE 2026 Part One acknowledgement recorded.");await reloadOwn();}

  async function addEvidence(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!profile?.organisation_id)return;const fd=new FormData(e.currentTarget);const req=requirements.find(r=>r.code===String(fd.get("requirement_code")));if(!req)return;setBusy(true);const completed=String(fd.get("completed_at")||"");const valid=calcExpiry(completed,req.frequency_months);const c=getSupabaseBrowserClient();const {error}=await c.from("safeguarding_evidence").insert({organisation_id:profile.organisation_id,user_id:profile.id,requirement_code:req.code,completed_at:completed?new Date(`${completed}T12:00:00`).toISOString():new Date().toISOString(),valid_until:valid,evidence_kind:String(fd.get("evidence_kind")||"school_record"),provider_name:String(fd.get("provider_name")||"").trim(),certificate_number:String(fd.get("certificate_number")||"").trim()||null,accrediting_body:String(fd.get("accrediting_body")||"").trim()||null,evidence_url:String(fd.get("evidence_url")||"").trim()||null,guidance_version:req.guidance_version,notes:String(fd.get("notes")||"").trim()});setBusy(false);if(error){setMessage(error.message);return;}e.currentTarget.reset();setMessage("Safeguarding evidence recorded. External/accredited labels are preserved separately from school-issued records.");await reloadOwn();}

  async function reloadOwn(){if(!profile)return;const c=getSupabaseBrowserClient();const {data}=await c.from("safeguarding_evidence").select("id,requirement_code,completed_at,valid_until,evidence_kind,provider_name,certificate_number,accrediting_body,evidence_url,guidance_version,verified_at,notes").eq("user_id",profile.id).order("completed_at",{ascending:false});setEvidence((data||[]) as Evidence[]);if(leader){const {data:s}=await c.rpc("safeguarding_school_summary");setSummary((s||[]) as Summary[]);}}

  async function assignRole(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!admin||!profile?.organisation_id)return;const fd=new FormData(e.currentTarget),userId=String(fd.get("user_id")),role=String(fd.get("safeguarding_role"));setBusy(true);const c=getSupabaseBrowserClient();const {error}=await c.from("safeguarding_role_assignments").upsert({organisation_id:profile.organisation_id,user_id:userId,safeguarding_role:role,active:true,assigned_by:profile.id,notes:String(fd.get("notes")||"").trim()},{onConflict:"organisation_id,user_id,safeguarding_role"});setBusy(false);if(error){setMessage(error.message);return;}const {data}=await c.from("safeguarding_role_assignments").select("id,user_id,safeguarding_role,active,notes").eq("organisation_id",profile.organisation_id).eq("active",true);setRoles((data||[]) as RoleAssignment[]);setMessage("Safeguarding responsibility assigned. This does not change app permissions.");}

  async function removeRole(id:string){if(!admin)return;const c=getSupabaseBrowserClient();const {error}=await c.from("safeguarding_role_assignments").update({active:false}).eq("id",id);if(error){setMessage(error.message);return;}setRoles(prev=>prev.filter(r=>r.id!==id));}

  if(loading)return <main className="stagePage"><div className="stageCard">Loading safeguarding compliance…</div></main>;
  if(!profile?.organisation_id)return <main className="stagePage"><section className="stageHero safeguardingHero"><span className="eyebrow">SAFEGUARDING COMPLIANCE</span><h1>Connect to a school organisation first.</h1></section></main>;

  return <main className="stagePage safeguardingPage">
    <section className="stageHero safeguardingHero"><span className="eyebrow">SAFEGUARDING · ENGLAND</span><h1>Safeguarding compliance centre</h1><p>Track the evidence schools need for staff safeguarding learning, KCSIE reading, role-specific training and updates. Internal records are clearly separated from externally provided or accredited certificates.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="https://www.gov.uk/government/publications/keeping-children-safe-in-education--2" target="_blank" rel="noreferrer">Open KCSIE 2026</a>{leader&&<a className="secondary phaseLinkButton" href="#school-summary">School compliance</a>}</div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{currentCount}/{myRequirements.length}</strong><span>my requirements current</span></div><div className="stageStat"><strong>{myRoleCodes.size||"—"}</strong><span>specialist safeguarding roles</span></div><div className="stageStat"><strong>2026</strong><span>KCSIE version tracked</span></div><div className="stageStat"><strong>{guidance.filter(g=>g.status==="current").length}</strong><span>current guidance sources</span></div></section>

    <section className="stageCard safeguardingNotice"><strong>Certificate accuracy</strong><p>Teaching CPD records school safeguarding completion and external evidence. It does not describe an internally generated certificate as a national or externally accredited certificate unless an external provider/accrediting body is actually recorded and verified.</p></section>

    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">MY REQUIREMENTS</span><h2>Your safeguarding evidence</h2><div className="safeguardingRequirementList">{myRequirements.map(req=>{const item=latestByRequirement.get(req.code);const current=isCurrent(item);return <article key={req.code} className={`safeguardingRequirement ${current?"current":"due"}`}><div><span className="requirementKind">{labelKind(req.requirement_kind)}</span><h3>{req.title}</h3><p>{req.statutory_basis}</p><small>{req.guidance_version}{req.frequency_months?` · typical tracking cycle ${req.frequency_months} months`:""}</small></div><div className="requirementStatus"><strong>{current?"Current":"Action needed"}</strong>{item&&<small>{formatEvidence(item)} · {formatDate(item.completed_at)}{item.valid_until?` · valid to ${formatDate(item.valid_until)}`:""}</small>}{req.code==="kcsie-part-one-2026"&&!current&&<button className="primary" disabled={busy} onClick={acknowledgeKcsie}>Record Part One acknowledgement</button>}</div></article>})}</div></div>
      <div className="stageCard stageSpan5"><span className="eyebrow">ADD EVIDENCE</span><h2>Record training or certificate evidence</h2><form className="safeguardingEvidenceForm" onSubmit={addEvidence}><label>Requirement<select name="requirement_code" required>{myRequirements.filter(r=>r.code!=="kcsie-part-one-2026").map(r=><option value={r.code} key={r.code}>{r.title}</option>)}</select></label><label>Evidence type<select name="evidence_kind"><option value="school_record">School training/compliance record</option><option value="external_provider">External training provider</option><option value="externally_accredited">Externally accredited certificate</option></select></label><label>Completed date<input name="completed_at" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label><label>Provider name<input name="provider_name" placeholder="Required for external training"/></label><label>Certificate/reference number<input name="certificate_number"/></label><label>Accrediting body<input name="accrediting_body" placeholder="Required only if claiming accreditation"/></label><label>Evidence link<input name="evidence_url" type="url" placeholder="Drive / provider certificate link"/></label><label>Notes<textarea name="notes" rows={3}/></label><button className="primary" disabled={busy}>Save safeguarding evidence</button></form></div>
    </section>

    {leader&&<section id="school-summary" className="stageCard"><span className="eyebrow">WHOLE-SCHOOL SAFEGUARDING</span><h2>All-staff compliance picture</h2><p>These figures cover the whole-school requirements. Specialist DSL, governor, Prevent and technical-role evidence is tracked separately against assigned responsibilities.</p><div className="safeguardingSummaryGrid">{summary.map(s=>{const pct=s.required_count?Math.round((s.current_count/s.required_count)*100):0;return <div key={s.requirement_code}><strong>{s.title}</strong><span>{s.current_count}/{s.required_count} current</span><div className="complianceBar"><i style={{width:`${pct}%`}}/></div><small>{s.overdue_count} outstanding · {pct}%</small></div>})}{!summary.length&&<p className="muted">No whole-school compliance data is available yet.</p>}</div></section>}

    {admin&&<section className="stageGrid"><div className="stageCard stageSpan5"><span className="eyebrow">SAFEGUARDING RESPONSIBILITIES</span><h2>Assign specialist roles</h2><p>Safeguarding responsibility is separate from app access. A DSL does not automatically become a system Admin.</p><form className="safeguardingRoleForm" onSubmit={assignRole}><label>Staff member<select name="user_id" required>{staff.filter(s=>s.active).map(s=><option key={s.user_id} value={s.user_id}>{s.full_name||s.email} · {s.department||s.role}</option>)}</select></label><label>Safeguarding responsibility<select name="safeguarding_role">{Object.entries(roleLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Notes<input name="notes" placeholder="Optional local responsibility note"/></label><button className="primary" disabled={busy}>Assign responsibility</button></form></div><div className="stageCard stageSpan7"><span className="eyebrow">CURRENT ROLE HOLDERS</span><h2>Specialist safeguarding roles</h2><div className="roleAssignmentList">{roles.filter(r=>r.active).map(r=>{const person=staff.find(s=>s.user_id===r.user_id);return <div key={r.id}><span><strong>{roleLabels[r.safeguarding_role]||r.safeguarding_role}</strong><small>{person?.full_name||person?.email||"Staff member"}{r.notes?` · ${r.notes}`:""}</small></span><button className="textButton" onClick={()=>removeRole(r.id)}>Remove</button></div>})}{!roles.length&&<p className="muted">No specialist safeguarding roles assigned yet.</p>}</div></div></section>}

    <section className="stageCard"><span className="eyebrow">CURRENT NATIONAL GUIDANCE</span><h2>Version-controlled source register</h2><div className="guidanceCards">{guidance.filter(g=>g.status==="current").map(g=><a key={g.id} href={g.source_url} target="_blank" rel="noreferrer"><strong>{g.title}</strong><span>{g.publisher} · {g.version_label}</span><small>Verified {formatDate(g.last_verified_on)}{g.next_check_on?` · recheck ${formatDate(g.next_check_on)}`:""}</small></a>)}</div></section>
  </main>;
}

function isCurrent(e?:Evidence){if(!e)return false;return !e.valid_until||new Date(e.valid_until).getTime()>=Date.now();}
function formatDate(v:string|null){return v?new Date(v).toLocaleDateString("en-GB"):"Not set";}
function calcExpiry(date:string,months:number|null){if(!date||!months)return null;const d=new Date(`${date}T12:00:00`);d.setMonth(d.getMonth()+months);return d.toISOString();}
function labelKind(v:string){return v.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());}
function formatEvidence(e:Evidence){if(e.evidence_kind==="externally_accredited")return `Externally accredited${e.accrediting_body?` · ${e.accrediting_body}`:""}`;if(e.evidence_kind==="external_provider")return `External provider${e.provider_name?` · ${e.provider_name}`:""}`;if(e.evidence_kind==="acknowledgement")return "Acknowledged";return "School compliance record";}
