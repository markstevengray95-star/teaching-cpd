"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SchoolRow = {
  organisation_id:string;
  organisation_name:string;
  access_mode:string;
  subscription_status:string|null;
  plan:string|null;
  seat_limit:number|null;
  current_period_end:string|null;
  domain_id:string|null;
  domain:string|null;
  domain_status:string|null;
  domain_primary:boolean|null;
};
type School = {
  id:string;
  name:string;
  accessMode:string;
  subscriptionStatus:string;
  plan:string;
  seatLimit:number|null;
  periodEnd:string|null;
  domains:{id:string;domain:string;status:string;primary:boolean}[];
};

export default function OwnerPortalPage(){
  const [allowed,setAllowed]=useState<boolean|null>(null);
  const [rows,setRows]=useState<SchoolRow[]>([]);
  const [message,setMessage]=useState("");
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");

  useEffect(()=>{let alive=true;(async()=>{
    const c=getSupabaseBrowserClient();
    const {data:auth}=await c.auth.getUser();
    if(!auth.user){window.location.href="/auth?next=/owner-portal";return;}
    const {data:platform}=await c.from("platform_admins").select("user_id").eq("user_id",auth.user.id).maybeSingle();
    if(!alive)return;
    if(!platform){setAllowed(false);return;}
    setAllowed(true);
    const {data,error}=await c.rpc("platform_list_schools");
    if(!alive)return;
    if(error)setMessage(error.message);else setRows((data||[]) as SchoolRow[]);
  })();return()=>{alive=false};},[]);

  const schools=useMemo(()=>{
    const map=new Map<string,School>();
    for(const r of rows){
      if(!map.has(r.organisation_id))map.set(r.organisation_id,{id:r.organisation_id,name:r.organisation_name,accessMode:r.access_mode,subscriptionStatus:r.subscription_status||"none",plan:r.plan||"school",seatLimit:r.seat_limit,periodEnd:r.current_period_end,domains:[]});
      if(r.domain_id&&r.domain)map.get(r.organisation_id)!.domains.push({id:r.domain_id,domain:r.domain,status:r.domain_status||"pending",primary:Boolean(r.domain_primary)});
    }
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
  },[rows]);

  const filtered=useMemo(()=>schools.filter(s=>{
    const text=`${s.name} ${s.plan} ${s.subscriptionStatus} ${s.domains.map(d=>d.domain).join(" ")}`.toLowerCase();
    const matchesQuery=text.includes(query.toLowerCase());
    const matchesStatus=status==="all"||s.subscriptionStatus===status;
    return matchesQuery&&matchesStatus;
  }),[schools,query,status]);

  const stats=useMemo(()=>({
    schools:schools.length,
    live:schools.filter(s=>["active","trialing"].includes(s.subscriptionStatus)).length,
    paused:schools.filter(s=>["past_due","cancelled","expired","none"].includes(s.subscriptionStatus)).length,
    verified:schools.flatMap(s=>s.domains).filter(d=>d.status==="verified").length,
    pending:schools.flatMap(s=>s.domains).filter(d=>d.status==="pending").length,
    adminRisk:schools.filter(s=>s.domains.length===0||!s.domains.some(d=>d.status==="verified")).length,
  }),[schools]);

  function exportCsv(){
    const head=["School","Subscription","Plan","Period end","Access mode","Verified domains","Pending domains"];
    const lines=[head,...filtered.map(s=>[s.name,s.subscriptionStatus,s.plan,s.periodEnd||"",s.accessMode,s.domains.filter(d=>d.status==="verified").map(d=>d.domain).join("; "),s.domains.filter(d=>d.status==="pending").map(d=>d.domain).join("; ")])];
    const csv=lines.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`teaching-cpd-owner-overview-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
  }

  if(allowed===null)return <main className="stagePage"><div className="stageCard">Loading owner portal…</div></main>;
  if(!allowed)return <main className="stagePage"><section className="stageHero"><span className="eyebrow">OWNER PORTAL</span><h1>Platform Admin access required.</h1><p>This portal is restricted to the Teaching CPD platform owner account.</p></section></main>;

  return <main className="stagePage ownerPortalPage">
    <section className="stageHero ownerPortalHero"><span className="eyebrow">PLATFORM OWNER · CONTROL CENTRE</span><h1>Monitor every school using Teaching CPD.</h1><p>Track subscriptions, domain verification, access readiness and customer health from one place. Individual staff records remain school-scoped to protect staff privacy.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/platform">Manage subscriptions</a><button className="secondary" onClick={exportCsv}>Export overview CSV</button></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{stats.schools}</strong><span>customer schools</span></div><div className="stageStat"><strong>{stats.live}</strong><span>active / trial</span></div><div className="stageStat"><strong>{stats.paused}</strong><span>paused / inactive</span></div><div className="stageStat"><strong>{stats.pending}</strong><span>domains awaiting review</span></div></section>

    <section className="stageCard ownerPortalPrivacy"><strong>Staff privacy boundary</strong><p>The platform-owner view monitors commercial/access health across schools. Names, private reflections, coaching notes, observation notes and other staff-level professional records stay within each school’s own Admin controls. This reduces unnecessary cross-school access while still giving you the information needed to operate the service.</p></section>

    <section className="stageCard ownerPortalFilters"><div><span className="eyebrow">CUSTOMER MONITORING</span><h2>Schools and account access</h2></div><div className="ownerPortalFilterControls"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search school, domain or plan…"/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="trialing">Trialing</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option><option value="none">No licence</option></select></div></section>

    <section className="ownerSchoolGrid">{filtered.map(s=>{
      const verified=s.domains.filter(d=>d.status==="verified");
      const pending=s.domains.filter(d=>d.status==="pending");
      const healthy=["active","trialing"].includes(s.subscriptionStatus)&&verified.length>0;
      return <article className={`stageCard ownerSchoolCard ${healthy?"healthy":"attention"}`} key={s.id}><header><div><span className="eyebrow">{healthy?"READY":"NEEDS ATTENTION"}</span><h2>{s.name}</h2></div><span className={`subscriptionStatus ${s.subscriptionStatus}`}>{s.subscriptionStatus}</span></header><div className="ownerSchoolMetrics"><div><span>Plan</span><strong>{s.plan}</strong></div><div><span>Staff access</span><strong>{s.plan.toLowerCase()==="school"?"Whole school":s.seatLimit??"Unlimited"}</strong></div><div><span>Verified domains</span><strong>{verified.length}</strong></div><div><span>Pending domains</span><strong>{pending.length}</strong></div></div><div className="ownerDomainList">{s.domains.length?s.domains.map(d=><span key={d.id} className={d.status}>@{d.domain} · {d.status}</span>):<span className="missing">No domain configured</span>}</div><div className="ownerSchoolFooter"><span>{s.periodEnd?`Licence period ends ${new Date(s.periodEnd).toLocaleDateString("en-GB")}`:"No period end set"}</span><a href="/platform">Manage school</a></div></article>
    })}{!filtered.length&&<div className="stageCard"><h2>No schools matched</h2><p>Try another search or status filter.</p></div>}</section>

    <section className="stageCard ownerPortalGuide"><span className="eyebrow">WHOLE-SCHOOL USER MONITORING</span><h2>Where individual staff information lives</h2><div className="ownerPortalGuideGrid"><div><strong>School Admin → Staff access</strong><p>Names, school email, department, site, app role, active/disabled access and multiple Admin assignment.</p></div><div><strong>CPD Lead/Admin → Leadership</strong><p>Training completion, mandatory CPD gaps, assignments and whole-school professional-development patterns.</p></div><div><strong>CPD Lead/Admin → Safeguarding</strong><p>School safeguarding compliance and role-specific evidence without exposing private professional reflections to the platform owner.</p></div><div><strong>Platform Owner → This portal</strong><p>Commercial health, subscriptions, verified domains and access readiness across every customer school.</p></div></div></section>
  </main>;
}
