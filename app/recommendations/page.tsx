"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { recommendCourses } from "@/lib/cpdRecommendations";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Observation={id:string;observed_on:string;focus:string;development_area:string;strength:string;linked_course_id:string|null;shared_with_leadership:boolean};
type Target={id:string;title:string;description:string;success_criteria:string;status:string};

type RecommendationSource={id:string;label:string;title:string;text:string;observationId?:string;linkedCourseId?:string|null};

export default function RecommendationsPage(){
  const [observations,setObservations]=useState<Observation[]>([]);const [targets,setTargets]=useState<Target[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");
  useEffect(()=>{let live=true;(async()=>{const c=getSupabaseBrowserClient();const {data:auth}=await c.auth.getUser();if(!auth.user){window.location.href="/auth?next=/recommendations";return;}const [o,t]=await Promise.all([
    c.from("professional_observation_links").select("id,observed_on,focus,development_area,strength,linked_course_id,shared_with_leadership").eq("user_id",auth.user.id).order("observed_on",{ascending:false}).limit(8),
    c.from("development_targets").select("id,title,description,success_criteria,status").eq("user_id",auth.user.id).eq("status","active").order("created_at",{ascending:false}).limit(8),
  ]);if(!live)return;if(o.error||t.error)setMessage([o.error?.message,t.error?.message].filter(Boolean).join(" · "));setObservations((o.data||[]) as Observation[]);setTargets((t.data||[]) as Target[]);setLoading(false);})();return()=>{live=false};},[]);

  const sources=useMemo<RecommendationSource[]>(()=>[
    ...observations.map(o=>({id:`ob-${o.id}`,label:"Observation / self-review",title:o.focus,text:`${o.focus} ${o.development_area} ${o.strength}`,observationId:o.id,linkedCourseId:o.linked_course_id})),
    ...targets.map(t=>({id:`target-${t.id}`,label:"Active development target",title:t.title,text:`${t.title} ${t.description} ${t.success_criteria}`})),
  ],[observations,targets]);

  const combined=useMemo(()=>{
    const map=new Map<string,{course:(typeof courses)[number];score:number;matched:Set<string>;sourceCount:number}>();
    for(const source of sources){for(const r of recommendCourses(source.text,courses,5)){const current=map.get(r.course.id);if(current){current.score+=r.score;current.sourceCount+=1;r.matched.forEach(m=>current.matched.add(m));}else map.set(r.course.id,{course:r.course,score:r.score,sourceCount:1,matched:new Set(r.matched)});}}
    return [...map.values()].sort((a,b)=>b.score-a.score||b.sourceCount-a.sourceCount||a.course.duration-b.course.duration).slice(0,8);
  },[sources]);

  async function linkCourse(observationId:string,courseId:string){const c=getSupabaseBrowserClient();const {error}=await c.from("professional_observation_links").update({linked_course_id:courseId}).eq("id",observationId);if(error){setMessage(error.message);return;}setObservations(prev=>prev.map(o=>o.id===observationId?{...o,linked_course_id:courseId}:o));setMessage("Course linked to your professional learning note.");}

  if(loading)return <main className="stagePage"><div className="stageCard">Building your CPD recommendations…</div></main>;
  return <main className="stagePage recommendationsPage"><section className="stageHero recommendationsHero"><span className="eyebrow">PERSONAL CPD RECOMMENDATIONS</span><h1>Turn observation and self-review into focused next steps.</h1><p>Recommendations are calculated locally from your own observation focus, development areas and active targets against the CPD catalogue. Private notes are not sent to an external AI service and are not shared with leadership by this feature.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/improvement">Professional learning notes</a><a className="secondary phaseLinkButton" href="/coach">CPD Coach</a></div></section>{message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{observations.length}</strong><span>recent learning notes used</span></div><div className="stageStat"><strong>{targets.length}</strong><span>active targets used</span></div><div className="stageStat"><strong>{combined.length}</strong><span>matched courses</span></div><div className="stageStat"><strong>{observations.filter(o=>o.linked_course_id).length}</strong><span>notes already linked</span></div></section>
    {!sources.length?<section className="stageCard recommendationEmpty"><h2>Add a development focus first</h2><p>Record an observation/self-review or create an active development target. The recommendation engine needs a real development focus rather than guessing what you should work on.</p><a className="primary phaseLinkButton" href="/improvement">Add professional learning note</a></section>:<>
      <section className="stageCard"><span className="eyebrow">BEST OVERALL MATCHES</span><h2>Courses connected to your current development themes</h2><div className="recommendationGrid">{combined.map(r=><article className="recommendationCourse" key={r.course.id}><div className="recommendationMeta"><span>{r.course.category}</span><span>{r.course.duration} min</span><span>{r.course.level}</span></div><h3>{r.course.title}</h3><p>{r.course.summary}</p><div className="recommendationWhy"><strong>Why it matched</strong><span>{[...r.matched].slice(0,4).join(" · ")||"general teaching practice"}</span></div><small>Connected to {r.sourceCount} of your current development record{r.sourceCount===1?"":"s"}.</small><a className="secondary phaseLinkButton" href="/">Open course library</a></article>)}</div></section>
      <section className="stageCard"><span className="eyebrow">NOTE-BY-NOTE RECOMMENDATIONS</span><h2>Link a course directly to a professional learning note</h2><div className="sourceRecommendations">{observations.map(o=>{const recs=recommendCourses(`${o.focus} ${o.development_area} ${o.strength}`,courses,3);return <article key={o.id}><header><div><span>{new Date(o.observed_on).toLocaleDateString("en-GB")}</span><strong>{o.focus}</strong></div><small>{o.shared_with_leadership?"Explicitly shared":"Private"}</small></header><div className="sourceCourseList">{recs.map(r=><div className={o.linked_course_id===r.course.id?"linked":""} key={r.course.id}><div><strong>{r.course.title}</strong><span>{r.matched.join(" · ")||r.course.category}</span></div><button className={o.linked_course_id===r.course.id?"secondary":"primary"} disabled={o.linked_course_id===r.course.id} onClick={()=>linkCourse(o.id,r.course.id)}>{o.linked_course_id===r.course.id?"Linked":"Link course"}</button></div>)}</div></article>})}</div></section>
    </>}
    <section className="stageCard recommendationBoundary"><strong>Recommendation boundary</strong><p>This is a matching aid, not a teacher-performance score and not an automated judgement about teaching quality. The staff member controls which course is linked and whether the underlying observation note is shared.</p></section>
  </main>;
}
