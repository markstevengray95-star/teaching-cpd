"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type NotificationRow = { id:string; title:string; body:string|null; category:string|null; priority:string; action_url:string|null; starts_at:string; expires_at:string|null; department:string|null; audience:string };
type ReadRow = { notification_id:string; read_at:string };
type SmartAlert = { id:string; title:string; text:string; href:string; kind:string; date?:string|null; priority:"normal"|"high"|"urgent" };

const leaders: StaffRole[] = ["hod","pastoral","send-eal","slt","administrator","super-admin"];

function pretty(value?: string|null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

export default function NotificationsHub() {
  const client = getSupabaseBrowserClient();
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const [role,setRole] = useState<StaffRole>("teacher");
  const [userId,setUserId] = useState("");
  const [organizationId,setOrganizationId] = useState("");
  const [notifications,setNotifications] = useState<NotificationRow[]>([]);
  const [reads,setReads] = useState<ReadRow[]>([]);
  const [alerts,setAlerts] = useState<SmartAlert[]>([]);
  const [composer,setComposer] = useState(false);
  const [title,setTitle] = useState("");
  const [body,setBody] = useState("");
  const [category,setCategory] = useState("General");
  const [priority,setPriority] = useState("normal");
  const [audience,setAudience] = useState("all-staff");
  const [department,setDepartment] = useState("");
  const [actionUrl,setActionUrl] = useState("");
  const [expiresAt,setExpiresAt] = useState("");

  const canPublish = leaders.includes(role);

  async function load() {
    setLoading(true); setMessage("");
    const {data:auth}=await client.auth.getUser();
    if(!auth.user){setMessage("Sign in to view notifications.");setLoading(false);return;}
    setUserId(auth.user.id);
    const access=await resolveStaffAccess(client,auth.user); setRole(access.role); setOrganizationId(access.organizationId||"");
    if(!access.organizationId){setMessage("Select a school organisation first.");setLoading(false);return;}
    const org=access.organizationId;
    const [n,r,cal,content,req]=await Promise.all([
      client.from("school_notifications").select("*").eq("organization_id",org).order("starts_at",{ascending:false}),
      client.from("school_notification_reads").select("notification_id,read_at").eq("user_id",auth.user.id),
      client.from("school_calendar_events").select("id,title,starts_at,category").eq("organization_id",org).gte("starts_at",new Date().toISOString()).order("starts_at").limit(30),
      client.from("school_content_items").select("id,title,content_type,review_date,status").eq("organization_id",org).eq("content_type","policy").neq("status","archived"),
      client.from("school_requests").select("id,title,request_type,status,due_date,event_date").eq("organization_id",org).eq("status","submitted"),
    ]);
    setNotifications((n.data||[]) as NotificationRow[]); setReads((r.data||[]) as ReadRow[]);
    const smart:SmartAlert[]=[];
    for(const row of cal.data||[]){const days=Math.ceil((new Date(row.starts_at).getTime()-Date.now())/86_400_000);if(days<=3)smart.push({id:`cal-${row.id}`,title:row.title,text:days<=0?"Happening today":`Coming up in ${days} day${days===1?"":"s"}`,href:"/calendar",kind:"Calendar",date:row.starts_at,priority:days<=0?"high":"normal"});}
    for(const row of content.data||[]){if(!row.review_date)continue;const days=Math.ceil((new Date(row.review_date).getTime()-Date.now())/86_400_000);if(days<=30)smart.push({id:`pol-${row.id}`,title:row.title,text:days<0?"Policy review is overdue":`Policy review due in ${days} days`,href:"/policies",kind:"Policy",date:row.review_date,priority:days<0?"urgent":"high"});}
    for(const row of req.data||[])smart.push({id:`req-${row.id}`,title:row.title,text:`${row.request_type==="trip"?"Trip":"Form"} awaiting approval`,href:row.request_type==="trip"?"/trips":"/forms",kind:"Approval",date:row.event_date||row.due_date,priority:"high"});
    setAlerts(smart.sort((a,b)=>({urgent:3,high:2,normal:1}[b.priority]-{urgent:3,high:2,normal:1}[a.priority])));
    const firstError=[n.error,r.error,cal.error,content.error,req.error].find(Boolean); if(firstError)setMessage(firstError.message);
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  const readIds=useMemo(()=>new Set(reads.map((row)=>row.notification_id)),[reads]);
  const unread=notifications.filter((row)=>!readIds.has(row.id)).length;

  async function markRead(id:string){
    if(!userId)return;
    const {error}=await client.from("school_notification_reads").upsert({notification_id:id,user_id:userId,read_at:new Date().toISOString()},{onConflict:"notification_id,user_id"});
    if(error)setMessage(error.message);else await load();
  }

  async function publish(event:FormEvent){
    event.preventDefault(); if(!organizationId||!userId||!title.trim()||!canPublish)return;
    const {error}=await client.from("school_notifications").insert({organization_id:organizationId,title:title.trim(),body:body.trim()||null,category,audience,department:audience==="department"?(department.trim()||null):null,priority,action_url:actionUrl.trim()||null,expires_at:expiresAt?new Date(`${expiresAt}T23:59:59`).toISOString():null,created_by:userId});
    if(error){setMessage(error.message);return;} setTitle("");setBody("");setActionUrl("");setExpiresAt("");setComposer(false);await load();
  }

  return <main className="rpShell">
    <header className="rpTopbar"><Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link><nav><Link href="/notifications">Notifications</Link><Link href="/notices">Notices</Link><Link href="/calendar">Calendar</Link></nav><span className="rpRole">{STAFF_ROLE_LABELS[role]}</span></header>
    <section className="rpHero"><div><span>PHASE 66 · NOTIFICATIONS</span><h1>Notification Centre</h1><p>Bring school alerts, upcoming activity, approvals and review reminders into one focused inbox.</p></div>{canPublish&&<button onClick={()=>setComposer(true)}>Publish notification</button>}</section>
    <section className="rpStats"><article><strong>{unread}</strong><span>Unread school notifications</span></article><article><strong>{alerts.length}</strong><span>Smart alerts</span></article><article><strong>{notifications.filter((row)=>row.priority==="urgent").length}</strong><span>Urgent notices</span></article><article><strong>{notifications.length}</strong><span>Current notifications</span></article></section>
    {message&&<div className="rpMessage">{message}</div>}
    {loading?<section className="rpEmpty">Loading notifications…</section>:<section className="rpCompactGrid">
      <article className="rpPanel" style={{gridColumn:"span 2"}}><h2>School notifications</h2><div className="rpListRows">{notifications.map((row)=><div className="rpRow" key={row.id}><small>{!readIds.has(row.id)&&<span className="rpNoticeDot"/>}{row.category||"School"} · {row.priority} · {pretty(row.starts_at)}</small><strong>{row.title}</strong>{row.body&&<p>{row.body}</p>}<div className="rpPills">{row.action_url&&<Link href={row.action_url}>Open action</Link>}{!readIds.has(row.id)&&<button type="button" onClick={()=>void markRead(row.id)}>Mark read</button>}</div></div>)}{!notifications.length&&<p>No school notifications are active.</p>}</div></article>
      <article className="rpPanel"><h2>Smart alerts</h2><div className="rpListRows">{alerts.slice(0,10).map((alert)=><Link className="rpRow" href={alert.href} key={alert.id}><small>{alert.kind} · {alert.priority}</small><strong>{alert.title}</strong><small>{alert.text}{alert.date?` · ${pretty(alert.date)}`:""}</small></Link>)}{!alerts.length&&<p>No time-sensitive alerts detected.</p>}</div></article>
    </section>}
    {composer&&<div className="rpModal" role="dialog" aria-modal="true"><form className="rpComposer" onSubmit={publish}><div className="rpComposerHead"><div><span>PHASE 66</span><h2>Publish notification</h2></div><button type="button" onClick={()=>setComposer(false)}>×</button></div><label>Title<input value={title} onChange={(e)=>setTitle(e.target.value)} required/></label><label>Message<textarea rows={4} value={body} onChange={(e)=>setBody(e.target.value)}/></label><div className="rpFormGrid"><label>Category<input value={category} onChange={(e)=>setCategory(e.target.value)}/></label><label>Priority<select value={priority} onChange={(e)=>setPriority(e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Audience<select value={audience} onChange={(e)=>setAudience(e.target.value)}><option value="all-staff">All staff</option><option value="teaching">Teaching staff</option><option value="tutors">Tutors</option><option value="leadership">Leadership</option><option value="support">Support staff</option><option value="department">Department</option></select></label>{audience==="department"&&<label>Department<input value={department} onChange={(e)=>setDepartment(e.target.value)}/></label>}<label>Expiry date<input type="date" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)}/></label></div><label>Action link<input value={actionUrl} onChange={(e)=>setActionUrl(e.target.value)} placeholder="/calendar or https://…"/></label><div className="rpComposerActions"><button type="button" className="secondary" onClick={()=>setComposer(false)}>Cancel</button><button type="submit">Publish</button></div></form></div>}
  </main>;
}
