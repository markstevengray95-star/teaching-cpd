"use client";

import { useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { subjectCpdProfiles } from "@/lib/subjectCpd";

export default function SubjectCpdPage(){
  const [subject,setSubject]=useState(subjectCpdProfiles[0].id);
  const profile=subjectCpdProfiles.find(item=>item.id===subject)||subjectCpdProfiles[0];
  const courseMap=useMemo(()=>new Map(courses.map(course=>[course.id,course])),[]);
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">SUBJECT-SPECIFIC CPD</span><h1>Translate evidence-informed teaching into the discipline you actually teach.</h1><p>Generic strategies become more useful when examples respect the knowledge, representations, language and decisions of the subject.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/development">Development cycle</a><a className="secondary phaseLinkButton" href="/pathways">Professional pathways</a></div></section>
    <section className="stageCard" style={{marginBottom:18}}><span className="eyebrow">CHOOSE SUBJECT / PHASE</span><div className="chips" style={{marginTop:10}}>{subjectCpdProfiles.map(item=><button key={item.id} className={subject===item.id?"chip active":"chip"} onClick={()=>setSubject(item.id)}>{item.title}</button>)}</div></section>
    <section className="stageGrid">
      <article className="stageCard stageSpan12"><span className="eyebrow">{profile.title.toUpperCase()}</span><h2>{profile.audience}</h2><p>{profile.application}</p></article>
      <Example title="Questioning & checking" text={profile.questioning}/><Example title="Modelling & explanation" text={profile.modelling}/><Example title="Retrieval & memory" text={profile.retrieval}/><Example title="Feedback" text={profile.feedback}/>
    </section>
    <section className="stageCard" style={{marginTop:18}}><span className="eyebrow">RECOMMENDED NEXT</span><h2>Build a subject-specific development sequence.</h2><div className="stageList">{profile.recommendedCourseIds.map(id=>{const course=courseMap.get(id);if(!course)return null;return <div className="stageRow" key={id}><div className="stageRowMain"><strong>{course.title}</strong><span>{course.summary}</span></div><a className="secondary phaseLinkButton" href={`/?course=${encodeURIComponent(id)}`}>Open course</a></div>;})}</div></section>
  </main>;
}

function Example({title,text}:{title:string;text:string}){return <article className="stageCard stageSpan6"><span className="eyebrow">SUBJECT APPLICATION</span><h2>{title}</h2><p>{text}</p></article>;}
