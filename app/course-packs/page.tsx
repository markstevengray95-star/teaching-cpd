"use client";

import { useMemo, useState } from "react";
import { courses, type Course, type Module } from "@/lib/catalogue";

const flagshipCourses = courses.filter(course => course.modules.some(module => module.id === `chapter-orient-${course.id}`));

type ContentModule = Extract<Module,{type:"content"}>;
type ActivityModule = Extract<Module,{type:"activity"}>;
type VisualModule = Extract<Module,{type:"visual"}>;

function content(course:Course,prefix:string){return course.modules.find((m):m is ContentModule=>m.type==="content"&&m.id.startsWith(prefix));}
function activity(course:Course,prefix:string){return course.modules.find((m):m is ActivityModule=>m.type==="activity"&&m.id.startsWith(prefix));}
function visual(course:Course,prefix:string){return course.modules.find((m):m is VisualModule=>m.type==="visual"&&m.id.startsWith(prefix));}

export default function CoursePacksPage(){
  const [selectedId,setSelectedId]=useState(flagshipCourses[0]?.id||"");
  const course=useMemo(()=>flagshipCourses.find(item=>item.id===selectedId)||flagshipCourses[0],[selectedId]);
  if(!course)return <main className="stagePage"><div className="stageCard">No flagship course packs are available yet.</div></main>;

  const glossary=content(course,"glossary-");
  const resources=content(course,"mc-resource-");
  const facilitator=content(course,"fac-guide-");
  const practice=activity(course,"worked-practice-")||activity(course,"mc-practice-");
  const followup=visual(course,"mc-followup-");

  function download(){
    const lines=[
      course.title,
      `${course.category} · ${course.duration} minutes · ${course.level}`,
      "",
      "PURPOSE",
      course.summary,
      "",
      "LEARNING OUTCOMES",
      ...course.objectives.map((x,i)=>`${i+1}. ${x}`),
      "",
      "KEY VOCABULARY & CONCEPTS",
      ...(glossary?.keyPoints||[]).map(x=>`- ${x}`),
      "",
      "READY-TO-USE MATERIALS",
      ...(resources?.keyPoints||[]).map(x=>`- ${x}`),
      "",
      "PRACTICE / IMPLEMENTATION TASK",
      practice?.prompt||"",
      ...(practice?.instructions||[]).map((x,i)=>`${i+1}. ${x}`),
      "",
      "30-DAY FOLLOW-UP",
      ...(followup?.items||[]).map(x=>`${x.heading}: ${x.text}`),
      "",
      "FACILITATOR OPTIONS",
      ...(facilitator?.keyPoints||[]).map(x=>`- ${x}`),
      "",
      "Notes / implementation commitment:",
      "____________________________________________________________",
      "____________________________________________________________",
    ];
    const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${course.id}-cpd-pack.txt`;a.click();URL.revokeObjectURL(url);
  }

  return <main className="stagePage coursePacksPage">
    <section className="stageHero coursePacksHero"><span className="eyebrow">FLAGSHIP CPD MATERIALS</span><h1>Course packs</h1><p>Printable, reusable materials for individual study, coaching, department meetings and whole-school CPD. Each pack brings together the key vocabulary, practical task, implementation evidence and follow-up cycle from the full interactive course.</p><div className="stageHeroActions noPrint"><button className="primary" onClick={()=>window.print()}>Print / save PDF</button><button className="secondary" onClick={download}>Download text pack</button></div></section>

    <section className="stageCard coursePackSelector noPrint"><label><span>Choose flagship course</span><select value={course.id} onChange={e=>setSelectedId(e.target.value)}>{flagshipCourses.map(item=><option value={item.id} key={item.id}>{item.title}</option>)}</select></label></section>

    <article className="coursePackSheet">
      <header className="coursePackTitle"><span>{course.category} · {course.duration} min · {course.level}</span><h1>{course.title}</h1><p>{course.summary}</p></header>
      <section><h2>Learning outcomes</h2><ol>{course.objectives.map(item=><li key={item}>{item}</li>)}</ol></section>
      <section><h2>Key vocabulary & concepts</h2><div className="coursePackGrid">{(glossary?.keyPoints||[]).map(item=>{const [term,...rest]=item.split(" — ");return <div className="coursePackConcept" key={item}><strong>{term}</strong><p>{rest.join(" — ")}</p></div>})}</div></section>
      <section><h2>Ready-to-use professional learning materials</h2><ul>{(resources?.keyPoints||[]).map(item=><li key={item}>{item}</li>)}</ul></section>
      {practice&&<section><h2>Practice / implementation task</h2><p className="coursePackLead">{practice.prompt}</p><ol>{practice.instructions.map(item=><li key={item}>{item}</li>)}</ol><div className="coursePackWriting"><span>Plan / notes</span><i/><i/><i/><i/></div></section>}
      {followup&&<section><h2>30-day follow-up</h2><div className="coursePackTimeline">{followup.items.map(item=><div key={item.heading}><strong>{item.heading}</strong><p>{item.text}</p></div>)}</div></section>}
      {facilitator&&<section><h2>Facilitator options</h2><ul>{(facilitator.keyPoints||[]).map(item=><li key={item}>{item}</li>)}</ul></section>}
      <section className="coursePackReview"><h2>Implementation review</h2><div><strong>What did I change?</strong><i/><i/></div><div><strong>What evidence did I review?</strong><i/><i/></div><div><strong>Decision: keep / adapt / scale / stop / revisit</strong><i/><i/></div></section>
    </article>
  </main>;
}
