"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;department:string;organisation_id:string|null};
type Org={name:string;brand_name:string|null};
type ProgressRow={course_id:string;completed_at:string|null;completed_modules:string[]};

function certRef(userId:string,courseId:string,completedAt:string){
  const input=`${userId}|${courseId}|${completedAt}`;
  let hash=2166136261;
  for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}
  const date=new Date(completedAt).toISOString().slice(0,10).replace(/-/g,"");
  return `CPD-${date}-${(hash>>>0).toString(36).toUpperCase().padStart(7,"0")}`;
}

function escapeXml(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[c]||c));}

function certificateSvg(name:string,courseTitle:string,duration:number,date:string,orgName:string,reference:string,category:string){
  const safeguardingNote=category==="Safeguarding"?"School CPD completion record. This is not an externally accredited safeguarding qualification unless separately stated.":"School CPD completion record.";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1131" viewBox="0 0 1600 1131">
  <rect width="1600" height="1131" fill="#ffffff"/>
  <rect x="42" y="42" width="1516" height="1047" rx="28" fill="none" stroke="#1d3557" stroke-width="8"/>
  <rect x="72" y="72" width="1456" height="987" rx="22" fill="none" stroke="#457b9d" stroke-width="2"/>
  <text x="800" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" letter-spacing="7" fill="#457b9d">TEACHING CPD HUB</text>
  <text x="800" y="275" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="72" fill="#1d3557">Certificate of CPD Completion</text>
  <text x="800" y="350" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#5f6b78">This certifies that</text>
  <text x="800" y="450" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="64" fill="#172033">${escapeXml(name)}</text>
  <text x="800" y="525" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#5f6b78">has completed</text>
  <text x="800" y="615" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="44" fill="#1d3557">${escapeXml(courseTitle)}</text>
  <text x="800" y="705" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#354052">${duration} minutes of professional learning · completed ${escapeXml(date)}</text>
  <text x="800" y="760" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#354052">${escapeXml(orgName)}</text>
  <line x1="360" y1="825" x2="1240" y2="825" stroke="#d6dde5" stroke-width="2"/>
  <text x="800" y="875" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#536171">Certificate reference: ${escapeXml(reference)}</text>
  <text x="800" y="930" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#6c7784">${escapeXml(safeguardingNote)}</text>
  <text x="800" y="978" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#7d8792">Generated from the user's cloud-saved completion record.</text>
  </svg>`;
}

function downloadSvg(filename:string,svg:string){
  const blob=new Blob([svg],{type:"image/svg+xml;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function printCertificate(svg:string){
  const w=window.open("","_blank","noopener,noreferrer");if(!w)return;
  w.document.write(`<!doctype html><html><head><title>CPD Certificate</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;padding:0;background:#fff}svg{width:100vw;height:100vh;display:block}</style></head><body>${svg}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
}

export default function CertificatesPage(){
  const [profile,setProfile]=useState<Profile|null>(null);const [org,setOrg]=useState<Org|null>(null);const [rows,setRows]=useState<ProgressRow[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");
  useEffect(()=>{let alive=true;(async()=>{const c=getSupabaseBrowserClient();const {data:auth}=await c.auth.getUser();if(!auth.user){window.location.href="/auth?next=/certificates";return;}const {data:p,error:pErr}=await c.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("id",auth.user.id).single();if(!alive)return;if(pErr||!p){setMessage(pErr?.message||"Unable to load profile.");setLoading(false);return;}setProfile(p as Profile);const progress=await c.from("course_progress").select("course_id,completed_at,completed_modules").eq("user_id",auth.user.id).not("completed_at","is",null).order("completed_at",{ascending:false});if(progress.error)setMessage(progress.error.message);setRows((progress.data||[]) as ProgressRow[]);if(p.organisation_id){const o=await c.from("organisations").select("name,brand_name").eq("id",p.organisation_id).single();if(o.data)setOrg(o.data as Org);}setLoading(false);})();return()=>{alive=false};},[]);
  const completed=useMemo(()=>rows.map(row=>({row,course:courses.find(c=>c.id===row.course_id)})).filter(x=>x.course),[rows]);
  if(loading)return <main className="stagePage"><div className="stageCard">Loading digital certificates…</div></main>;
  return <main className="stagePage digitalCertificatesPage"><section className="stageHero"><span className="eyebrow">DIGITAL CPD RECORDS</span><h1>Downloadable certificates</h1><p>Every completed course can be exported as a scalable digital certificate or printed/saved as a PDF. Certificates use the cloud completion date and a unique reference derived from the completion record.</p></section>{message&&<div className="phaseNotice">{message}</div>}{completed.length?<div className="digitalCertificateGrid">{completed.map(({row,course})=>{if(!course||!row.completed_at||!profile)return null;const date=new Date(row.completed_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});const ref=certRef(profile.id,course.id,row.completed_at);const orgName=org?.brand_name||org?.name||"Teaching CPD Hub";const svg=certificateSvg(profile.full_name||"Staff member",course.title,course.duration,date,orgName,ref,course.category);return <article className="digitalCertificateCard" key={`${course.id}-${row.completed_at}`}><div className="digitalCertPreview"><div className="certSeal">✓</div><span className="eyebrow">CERTIFICATE OF CPD COMPLETION</span><h2>{course.title}</h2><p>Awarded to <strong>{profile.full_name}</strong></p><div className="certMeta"><span>{course.duration} minutes</span><span>{date}</span></div><small>{orgName}</small><code>{ref}</code>{course.category==="Safeguarding"&&<p className="certificateBoundary">This records CPD completion. It does not claim external accreditation or replace specialist DSL training.</p>}</div><div className="digitalCertActions"><button className="primary" onClick={()=>downloadSvg(`${course.id}-${ref}.svg`,svg)}>Download digital certificate</button><button className="secondary" onClick={()=>printCertificate(svg)}>Print / Save PDF</button></div></article>})}</div>:<section className="stageCard"><h2>No completed courses yet</h2><p>Complete a course and its certificate will appear here automatically.</p><a href="/" className="primary phaseLinkButton">Browse courses</a></section>}</main>;
}
