"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { certificateReference } from "@/lib/certificates";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;department:string;organisation_id:string|null};
type ProgressRow={course_id:string;completed_at:string|null;completed_modules:string[];reflections:Record<string,string>|null};
type CertificateRecord={certificate_ref:string;course_id:string;completed_at:string;status:string;recipient_name_snapshot:string;organisation_name_snapshot:string};

function escapeXml(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[c]||c));}
function certificationPassed(row:ProgressRow){return row.reflections?.phase31_certification_passed==="true";}
function certificationScore(row:ProgressRow){const value=Number(row.reflections?.phase31_certification_score||0);return Number.isFinite(value)?value:0;}

function certificateSvg(name:string,courseTitle:string,duration:number,date:string,orgName:string,reference:string,category:string,verifyUrl:string){
  const safeguardingNote=category==="Safeguarding"?"School CPD completion record. This is not an externally accredited safeguarding qualification unless separately stated.":"School CPD completion record.";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1131" viewBox="0 0 1600 1131">
  <rect width="1600" height="1131" fill="#ffffff"/>
  <rect x="42" y="42" width="1516" height="1047" rx="28" fill="none" stroke="#1d3557" stroke-width="8"/>
  <rect x="72" y="72" width="1456" height="987" rx="22" fill="none" stroke="#457b9d" stroke-width="2"/>
  <text x="800" y="165" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" letter-spacing="7" fill="#457b9d">TEACHING CPD HUB</text>
  <text x="800" y="255" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="72" fill="#1d3557">Certificate of CPD Completion</text>
  <text x="800" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#5f6b78">This certifies that</text>
  <text x="800" y="430" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="64" fill="#172033">${escapeXml(name)}</text>
  <text x="800" y="505" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#5f6b78">has completed</text>
  <text x="800" y="595" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="44" fill="#1d3557">${escapeXml(courseTitle)}</text>
  <text x="800" y="680" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#354052">${duration} minutes of professional learning · completed ${escapeXml(date)}</text>
  <text x="800" y="735" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#354052">${escapeXml(orgName)}</text>
  <line x1="330" y1="800" x2="1270" y2="800" stroke="#d6dde5" stroke-width="2"/>
  <text x="800" y="848" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#536171">Certificate reference: ${escapeXml(reference)}</text>
  <text x="800" y="890" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#457b9d">Verify online: ${escapeXml(verifyUrl)}</text>
  <text x="800" y="942" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#6c7784">${escapeXml(safeguardingNote)}</text>
  <text x="800" y="985" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#7d8792">Verification confirms the platform-issued completion record without exposing private account data.</text>
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
function certificateKey(courseId:string,completedAt:string){return `${courseId}|${completedAt}`;}

export default function CertificatesPage(){
  const [profile,setProfile]=useState<Profile|null>(null);const [rows,setRows]=useState<ProgressRow[]>([]);const [certificates,setCertificates]=useState<CertificateRecord[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");

  useEffect(()=>{let alive=true;(async()=>{
    const c=getSupabaseBrowserClient();const {data:auth}=await c.auth.getUser();
    if(!auth.user){window.location.href="/auth?next=/certificates";return;}
    const {data:p,error:pErr}=await c.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("id",auth.user.id).single();
    if(!alive)return;if(pErr||!p){setMessage(pErr?.message||"Unable to load profile.");setLoading(false);return;}setProfile(p as Profile);

    const progress=await c.from("course_progress").select("course_id,completed_at,completed_modules,reflections").eq("user_id",auth.user.id).not("completed_at","is",null).order("completed_at",{ascending:false});
    if(progress.error){setMessage(progress.error.message);setLoading(false);return;}
    const progressRows=(progress.data||[]) as ProgressRow[];setRows(progressRows);

    const existing=await c.from("cpd_certificates").select("certificate_ref,course_id,completed_at,status,recipient_name_snapshot,organisation_name_snapshot").eq("user_id",auth.user.id).order("issued_at",{ascending:false});
    let records=(existing.data||[]) as CertificateRecord[];const existingKeys=new Set(records.map(item=>certificateKey(item.course_id,item.completed_at)));let needsReload=false;const issueErrors:string[]=[];

    for(const row of progressRows){
      if(!row.completed_at||existingKeys.has(certificateKey(row.course_id,row.completed_at)))continue;
      if(!certificationPassed(row))continue;
      const {error}=await c.from("cpd_certificates").insert({certificate_ref:certificateReference(p.id,row.course_id,row.completed_at),user_id:p.id,course_id:row.course_id,completed_at:row.completed_at});
      if(error&&error.code!=="23505")issueErrors.push(error.message);else needsReload=true;
    }

    if(needsReload){const refreshed=await c.from("cpd_certificates").select("certificate_ref,course_id,completed_at,status,recipient_name_snapshot,organisation_name_snapshot").eq("user_id",auth.user.id).order("issued_at",{ascending:false});if(refreshed.data)records=refreshed.data as CertificateRecord[];if(refreshed.error)issueErrors.push(refreshed.error.message);}
    if(!alive)return;setCertificates(records);if(existing.error||issueErrors.length)setMessage([existing.error?.message,...issueErrors].filter(Boolean).join(" · "));setLoading(false);
  })();return()=>{alive=false};},[]);

  const certificateMap=useMemo(()=>new Map(certificates.map(item=>[certificateKey(item.course_id,item.completed_at),item])),[certificates]);
  const completed=useMemo(()=>rows.map(row=>({row,course:courses.find(c=>c.id===row.course_id),certificate:row.completed_at?certificateMap.get(certificateKey(row.course_id,row.completed_at)):undefined})).filter(x=>x.course),[rows,certificateMap]);

  if(loading)return <main className="stagePage"><div className="stageCard">Loading certification records…</div></main>;
  return <main className="stagePage digitalCertificatesPage"><section className="stageHero"><span className="eyebrow">DIGITAL CPD RECORDS · PHASE 31</span><h1>Downloadable, verifiable certificates</h1><p>New certificates unlock after the course is complete and the final Phase 31 certification exam has been passed at 80% or higher. Certificates issued before Phase 31 remain valid and continue to verify normally.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/verify" target="_blank" rel="noreferrer">Open public verifier</a></div></section>{message&&<div className="phaseNotice">{message}</div>}{completed.length?<div className="digitalCertificateGrid">{completed.map(({row,course,certificate})=>{if(!course||!row.completed_at||!profile)return null;
    if(!certificate){const passed=certificationPassed(row);const score=certificationScore(row);return <article className="digitalCertificateCard" key={`${course.id}-${row.completed_at}`}><div className="digitalCertPreview"><div className="certSeal">🔒</div><span className="eyebrow">CERTIFICATION REQUIRED</span><h2>{course.title}</h2><p>{passed?"Your Phase 31 pass is recorded. Open this page again if certificate issuance is still syncing.":"Pass the Phase 31 certification exam at 80% or higher to unlock this certificate."}</p>{score>0&&<div className="certMeta"><span>Best certification score: {score}%</span><span>Pass mark: 80%</span></div>}<p className="certificateBoundary">Course completion remains on your CPD record while certification is pending.</p></div><div className="digitalCertActions"><a className="primary phaseLinkButton" href="/">Return to courses</a></div></article>}
    const date=new Date(row.completed_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});const ref=certificate.certificate_ref;const orgName=certificate.organisation_name_snapshot||"Teaching CPD Hub";const recipient=certificate.recipient_name_snapshot||profile.full_name||"Staff member";const origin=typeof window!=="undefined"?window.location.origin:"https://teaching-cpd.vercel.app";const verifyUrl=`${origin}/verify?ref=${encodeURIComponent(ref)}`;const svg=certificateSvg(recipient,course.title,course.duration,date,orgName,ref,course.category,verifyUrl);return <article className="digitalCertificateCard" key={`${course.id}-${row.completed_at}`}><div className="digitalCertPreview"><div className="certSeal">✓</div><span className="eyebrow">VERIFIABLE CERTIFICATE OF CPD COMPLETION</span><h2>{course.title}</h2><p>Awarded to <strong>{recipient}</strong></p><div className="certMeta"><span>{course.duration} minutes</span><span>{date}</span></div><small>{orgName}</small><code>{ref}</code><p className="certificateVerificationNote">Public verification confirms the reference, recipient, course, completion date and issuing organisation.</p>{course.category==="Safeguarding"&&<p className="certificateBoundary">This records CPD completion. It does not claim external accreditation or replace specialist DSL/DDSL training where required.</p>}</div><div className="digitalCertActions"><button className="primary" onClick={()=>downloadSvg(`${course.id}-${ref}.svg`,svg)}>Download digital certificate</button><button className="secondary" onClick={()=>printCertificate(svg)}>Print / Save PDF</button><a className="secondary phaseLinkButton" href={verifyUrl} target="_blank" rel="noreferrer">Verify certificate</a></div></article>})}</div>:<section className="stageCard"><h2>No completed courses yet</h2><p>Complete a course, then pass its Phase 31 certification exam to unlock a new certificate.</p><a href="/" className="primary phaseLinkButton">Browse courses</a></section>}</main>;
}
