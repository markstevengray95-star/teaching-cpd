"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id:string; role:string; organisation_id:string|null };
type Site = { id:string; name:string; code:string };
type StaffRow = { user_id:string; email:string; full_name:string; role:string; department:string; site_id:string|null; site_name:string|null; active:boolean; joined_at:string };
const roles = ["Staff","Department Lead","CPD Lead","Admin"] as const;

export default function StaffAccessPage(){
  const [me,setMe]=useState<Profile|null>(null);
  const [sites,setSites]=useState<Site[]>([]);
  const [rows,setRows]=useState<StaffRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [busyId,setBusyId]=useState("");
  const [query,setQuery]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{let live=true;(async()=>{
    const c=getSupabaseBrowserClient();
    const {data:auth}=await c.auth.getUser();
    if(!auth.user){window.location.href="/admin-login";return;}
    const {data:p,error:pError}=await c.from("staff_profiles").select("id,role,organisation_id").eq("id",auth.user.id).single();
    if(!live)return;
    if(pError||!p){setMessage(pError?.message||"Unable to load your staff profile.");setLoading(false);return;}
    setMe(p as Profile);
    if(p.role!=="Admin"||!p.organisation_id){setLoading(false);return;}
    const [staffResult,siteResult]=await Promise.all([
      c.rpc("school_admin_list_staff"),
      c.from("school_sites").select("id,name,code").eq("organisation_id",p.organisation_id).eq("active",true).order("name"),
    ]);
    if(!live)return;
    if(staffResult.error)setMessage(staffResult.error.message);
    setRows((staffResult.data||[]) as StaffRow[]);
    setSites((siteResult.data||[]) as Site[]);
    if(siteResult.error)setMessage(prev=>[prev,siteResult.error?.message].filter(Boolean).join(" · "));
    setLoading(false);
  })();return()=>{live=false};},[]);

  async function reload(){
    const c=getSupabaseBrowserClient();const {data,error}=await c.rpc("school_admin_list_staff");
    if(error){setMessage(error.message);return;}setRows((data||[]) as StaffRow[]);
  }

  function edit(id:string,patch:Partial<StaffRow>){setRows(prev=>prev.map(r=>r.user_id===id?{...r,...patch}:r));}

  async function save(row:StaffRow){
    if(me?.role!=="Admin")return;
    setBusyId(row.user_id);setMessage("");
    const c=getSupabaseBrowserClient();
    const {error}=await c.rpc("school_admin_update_staff_access",{
      p_user_id:row.user_id,
      p_role:row.role,
      p_department:row.department||"",
      p_site_id:row.site_id||null,
      p_active:row.active,
    });
    setBusyId("");
    if(error){setMessage(error.message);await reload();return;}
    setMessage(`${row.full_name||row.email} access updated.`);await reload();
  }

  const visible=useMemo(()=>rows.filter(r=>`${r.full_name} ${r.email} ${r.department} ${r.role}`.toLowerCase().includes(query.toLowerCase())),[rows,query]);
  const stats=useMemo(()=>({active:rows.filter(r=>r.active).length,admins:rows.filter(r=>r.active&&r.role==="Admin").length,cpd:rows.filter(r=>r.active&&r.role==="CPD Lead").length,departments:new Set(rows.filter(r=>r.active&&r.department).map(r=>r.department)).size}),[rows]);

  if(loading)return <main className="stagePage"><div className="stageCard">Loading staff access…</div></main>;
  if(!me||me.role!=="Admin")return <main className="stagePage"><section className="stageHero"><span className="eyebrow">SCHOOL ADMIN</span><h1>School Admin access required.</h1><p>This area changes staff permissions. Sign in with an account that a School Admin has granted Admin access to.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/admin-login">Admin sign in</a><a className="secondary phaseLinkButton" href="/">Return home</a></div></section></main>;

  return <main className="stagePage staffAccessPage">
    <section className="stageHero staffAccessHero"><span className="eyebrow">SCHOOL ADMIN · STAFF ACCESS</span><h1>Control what each member of staff can access.</h1><p>Everyone using a verified school email can create an account while the school subscription is active. New accounts start as Staff unless you pre-provision or promote them here.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/staff-sync">Pre-provision staff</a><a className="secondary phaseLinkButton" href="/school-access">School access</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{stats.active}</strong><span>active staff</span></div><div className="stageStat"><strong>{stats.admins}</strong><span>school admins</span></div><div className="stageStat"><strong>{stats.cpd}</strong><span>CPD leads</span></div><div className="stageStat"><strong>{stats.departments}</strong><span>departments</span></div></section>
    {stats.admins<2&&<section className="stageCard adminCoverageWarning"><strong>Admin resilience: add a second School Admin</strong><p>The platform supports multiple Admins. Keeping at least two active Admin accounts reduces the risk of the school being unable to manage access if one administrator is absent or leaves.</p></section>}

    <section className="stageCard accessMatrix"><span className="eyebrow">ACCESS LEVELS</span><h2>Simple role-based permissions</h2><div className="accessLevelGrid"><div><strong>Staff</strong><p>Own courses, reminders, portfolio, action plans, Micro-CPD and personal development.</p></div><div><strong>Department Lead</strong><p>Staff access plus department CPD planning and department-level leadership views.</p></div><div><strong>CPD Lead</strong><p>Department access plus CPD assignments, mandatory training, INSET, course creation and quality/QA tools.</p></div><div><strong>Admin</strong><p>Full school controls, including staff permissions, domains/access settings and all CPD leadership tools. Multiple Admins are supported.</p></div></div></section>

    <section className="stageCard"><div className="staffAccessHeading"><div><span className="eyebrow">CURRENT STAFF</span><h2>Accounts in this school</h2></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email, department or role…"/></div>
      <div className="staffAccessTable"><div className="staffAccessHead"><span>Staff member</span><span>Department</span><span>Role</span><span>Site</span><span>Access</span><span/></div>{visible.map(row=>{
        const self=row.user_id===me.id;
        return <div className={`staffAccessRow ${!row.active?"disabled":""}`} key={row.user_id}>
          <div><strong>{row.full_name||"Unnamed staff member"}</strong><small>{row.email}</small></div>
          <input value={row.department||""} onChange={e=>edit(row.user_id,{department:e.target.value})} disabled={self&&row.role==="Admin"}/>
          <select value={row.role} onChange={e=>edit(row.user_id,{role:e.target.value})} disabled={self}>{roles.map(role=><option key={role}>{role}</option>)}</select>
          <select value={row.site_id||""} onChange={e=>edit(row.user_id,{site_id:e.target.value||null})}><option value="">Default site</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <label className="accessToggle"><input type="checkbox" checked={row.active} onChange={e=>edit(row.user_id,{active:e.target.checked})} disabled={self}/><span>{row.active?"Active":"Disabled"}</span></label>
          <button className="primary" disabled={busyId===row.user_id} onClick={()=>save(row)}>{busyId===row.user_id?"Saving…":"Save"}</button>
        </div>})}{!visible.length&&<div className="emptyCompact">No staff matched your search.</div>}</div>
    </section>

    <section className="stageCard staffAccessNote"><strong>Safe staff offboarding</strong><p>Disabling access does not delete the staff member's historic CPD record. Their active organisation membership is suspended, so normal school access is blocked until an Admin re-enables it.</p></section>
  </main>;
}
