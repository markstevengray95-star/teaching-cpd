"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { professionalStandards, teachersStandardsSource } from "@/lib/professionalStandards";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function StandardsPage(){
  const [completed,setCompleted]=useState<Set<string>>(new Set());
  useEffect(()=>{const client=getSupabaseBrowserClient();let active=true;(async()=>{const {data:auth}=await client.auth.getUser();if(!auth.user)return;const {data}=await client.from("course_progress").select("course_id").eq("user_id",auth.user.id).not("completed_at","is",null);if(active)setCompleted(new Set((data||[]).map(row=>row.course_id)));})();return()=>{active=false;};},[]);
  const courseMap=useMemo(()=>new Map(courses.map(course=>[course.id,course])),[]);
  const covered=professionalStandards.filter(s=>s.courseIds.some(id=>completed.has(id))).length;
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">PROFESSIONAL STANDARDS MAP</span><h1>See how professional learning connects to the Teachers’ Standards.</h1><p>This is an alignment aid for reflection and development planning. It is not a formal assessment, appraisal score or judgement against the Standards.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/development">Development cycle</a><a className="secondary phaseLinkButton" href={teachersStandardsSource.url} target="_blank" rel="noreferrer">Official source ↗</a></div></section>
    <section className="stageGrid">
      <article className="stageCard stageSpan4"><span className="eyebrow">YOUR MAP</span><h2>{covered} of {professionalStandards.length} areas</h2><p>At least one completed course currently aligns with these areas. Completion is evidence of professional learning, not automatic evidence that a Standard is met.</p></article>
      <article className="stageCard stageSpan8"><span className="eyebrow">HOW TO USE IT</span><h2>Connect learning to practice and evidence.</h2><p>Open an area, review the related courses, then use your portfolio, action plans and impact reviews to capture what changed in practice.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/portfolio">Portfolio</a><a className="secondary phaseLinkButton" href="/actions">Action plans</a><a className="secondary phaseLinkButton" href="/impact">Impact reviews</a></div></article>
    </section>
    <section className="stageGrid" style={{marginTop:18}}>{professionalStandards.map(standard=>{
      const related=standard.courseIds.map(id=>courseMap.get(id)).filter(Boolean);
      const done=related.filter(course=>course&&completed.has(course.id));
      return <article className="stageCard stageSpan6" key={standard.code}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span className="eyebrow">{standard.code}</span><span className={`stageBadge ${done.length?"good":""}`}>{done.length}/{related.length} linked courses complete</span></div><h2>{standard.title}</h2><p>{standard.summary}</p><div className="stageList">{related.map(course=>course&&<div className="stageRow" key={course.id}><div className="stageRowMain"><strong>{completed.has(course.id)?"✓ ":""}{course.title}</strong><span>{course.category} · {course.duration} min</span></div><a className="smallLink" href={`/?course=${encodeURIComponent(course.id)}`}>{completed.has(course.id)?"Review":"Open"} →</a></div>)}</div></article>;
    })}</section>
    <div className="privacyNote" style={{marginTop:18}}>{teachersStandardsSource.note} Framework: {teachersStandardsSource.title}, England.</div>
  </main>;
}
