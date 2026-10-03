"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type Counts = { staff:number; roles:number; improvement:number; content:number; pending:number; notifications:number };
type Org = { id:string; name:string; trust_name:string|null; seat_limit:number|null; status:string|null; logo_url:string|null };

export default function AdminCentreHub(){
  const client=getSupabaseBrowserClient();
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [role,setRole]=useState<StaffRole>("teacher");
  const [org,setOrg]=useState<Org|null>(null);
  const [counts,setCounts]=useState<Counts>({staff:0,roles:0,improvement:0,content:0,pending:0,notifications:0});
  const [fileStore,setFileStore]=useState<"checking"|"ready"|"restricted">("checking");

  async function load(){
    setLoading(true);setMessage("");
    const {data:auth}=await client.auth.getUser();
    if(!auth.user){setMessage("Sign in to open the admin centre.");setLoading(false);return;}
    const access=await resolveStaffAccess(client,auth.user);setRole(access.role);
    if(!access.organizationId){setMessage("Select a school organisation first.");setLoading(false);return;}
    const id=access.organizationId;
    const [orgResult,staff,roles,improvement,content,requests,notifications,files]=await Promise.all([
      client.from("school_organizations").select("id,name,trust_name,seat_limit,status,logo_url").eq("id",id).maybeSingle(),
      client.from("staff_directory_entries").select("id",{count:"exact",head:true}).eq("organization_id",id),
      client.from("staff_development_role_assignments").select("id",{count:"exact",head:true}).eq("organization_id",id),
      client.from("school_improvement_items").select("id",{count:"exact",head:true}).eq("organization_id",id),
      client.from("school_content_items").select("id",{count:"exact",head:true}).eq("organization_id",id),
      client.from("school_requests").select("id",{count:"exact",head:true}).eq("organization_id",id).eq("status","submitted"),
      client.from("school_notifications").select("id",{count:"exact",head:true}).eq("organization_id",id),
      client.storage.from("school-knowledge").list(id,{limit:1}),
    ]);
    if(orgResult.data)setOrg(orgResult.data as Org);
    setCounts({staff:staff.count||0,roles:roles.count||0,improvement:improvement.count||0,content:content.count||0,pending:requests.count||0,notifications:notifications.count||0});
    setFileStore(files.error?"restricted":"ready");
    const firstError=[orgResult.error,staff.error,roles.error,improvement.error,content.error,requests.error,notifications.error].find(Boolean);if(firstError)setMessage(firstError.message);
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  const systemCards=[
    {title:"People & access",text:"Manage staff membership, roles and school access.",href:"/staff-access",value:`${counts.roles} role assignments`},
    {title:"Sensitive data access",text:"Choose exactly who can view or manage student support, interventions, pastoral check-ins and staff progress reporting.",href:"/admin-centre/data-access",value:"Least privilege"},
    {title:"Organisation settings",text:"School identity, organisation setup and subscription-level settings.",href:"/organisation",value:org?.status||"School settings"},
    {title:"Compliance",text:"Review mandatory training and compliance records.",href:"/compliance",value:"Phase 48"},
    {title:"Launch readiness",text:"Check platform configuration and operational readiness.",href:"/launch-readiness",value:"Health checks"},
    {title:"Notifications",text:"Publish targeted alerts and review current school notifications.",href:"/notifications",value:`${counts.notifications} current`},
    {title:"Google integrations",text:"Check Google sign-in and Workspace workflow readiness.",href:"/integrations",value:"Phase 67"},
  ];

  return <main className="rpShell">
    <header className="rpTopbar"><Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link><nav><Link href="/admin-centre">Admin Centre</Link><Link href="/school">School</Link><Link href="/leadership-dashboard">Leadership</Link></nav><span className="rpRole">{STAFF_ROLE_LABELS[role]}</span></header>
    <section className="rpHero"><div><span>WHOLE-SCHOOL ADMIN CENTRE</span><h1>{org?.name||"School Admin Centre"}</h1><p>One control surface for people, permissions, sensitive-data access, compliance, system health, integrations and whole-school tools.</p></div><button onClick={()=>void load()}>Refresh health</button></section>
    {message&&<div className="rpMessage">{message}</div>}
    {loading?<section className="rpEmpty">Checking school configuration…</section>:<>
      <section className="rpStats"><article><strong>{counts.staff}</strong><span>Directory profiles</span></article><article><strong>{counts.improvement}</strong><span>Improvement records</span></article><article><strong>{counts.content}</strong><span>Resources & policies</span></article><article><strong>{counts.pending}</strong><span>Pending approvals</span></article></section>
      <section className="rpCompactGrid">
        {systemCards.map((card)=><Link href={card.href} className="rpPanel" key={card.href} style={{textDecoration:"none",color:"inherit"}}><div className="rpPills"><span>{card.value}</span></div><h2>{card.title}</h2><p>{card.text}</p><strong>Open →</strong></Link>)}
      </section>
      <section className="rpCompactGrid">
        <article className="rpPanel"><h2>Database isolation</h2><p>Organisation-scoped tables use row-level security. Sensitive general records now require an explicit School Admin grant instead of inheriting access from a broad leadership title.</p><div className="rpPills"><span>RLS</span><span>Explicit grants</span><span>School scoped</span></div></article>
        <article className="rpPanel"><h2>Private file storage</h2><p>The private <strong>school-knowledge</strong> store backs school resources and policy files. Staff access is controlled by storage policies rather than public bucket URLs.</p><div className="rpPills"><span>{fileStore==="ready"?"Storage ready":"Storage restricted"}</span><Link href="/resource-library">Open files</Link></div></article>
        <article className="rpPanel"><h2>Search architecture</h2><p>Universal Search queries records the signed-in user is allowed to see, so database access rules remain the source of truth rather than copying sensitive data into a public index.</p><div className="rpPills"><Link href="/search">Universal Search</Link><Link href="/school-assistant">School AI</Link></div></article>
      </section>
      <section className="rpCompactGrid"><article className="rpPanel" style={{gridColumn:"1/-1"}}><h2>School configuration</h2><div className="rpListRows"><div className="rpRow"><small>Organisation</small><strong>{org?.name||"—"}</strong></div><div className="rpRow"><small>Trust</small><strong>{org?.trust_name||"Not set"}</strong></div><div className="rpRow"><small>Seat limit</small><strong>{org?.seat_limit??"Not set"}</strong></div><div className="rpRow"><small>Platform role</small><strong>{STAFF_ROLE_LABELS[role]}</strong></div></div></article></section>
    </>}
  </main>;
}
