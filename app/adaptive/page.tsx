"use client";

import { useMemo, useState } from "react";
import { courses, type Course } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type QuizModule = Extract<Course["modules"][number],{type:"quiz"}>;

export default function AdaptivePage(){
  const eligible=useMemo(()=>courses.filter(course=>course.category!=="Safeguarding"&&course.modules.filter(module=>module.type==="quiz").length>=2),[]);
  const [courseId,setCourseId]=useState(eligible[0]?.id||"");
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [result,setResult]=useState<{score:number;passed:boolean}|null>(null);
  const [message,setMessage]=useState("");
  const course=eligible.find(item=>item.id===courseId)||eligible[0];
  const quizzes=(course?.modules.filter((module):module is QuizModule=>module.type==="quiz").slice(0,3)||[]);

  function reset(id:string){setCourseId(id);setAnswers({});setResult(null);setMessage("");}
  function mark(){if(!quizzes.length)return;const correct=quizzes.filter(q=>answers[q.id]===q.answer).length;const score=Math.round(correct/quizzes.length*100);setResult({score,passed:score>=80});}

  async function applyFocusedRoute(){
    if(!course||!result?.passed)return;
    const client=getSupabaseBrowserClient(); const {data:auth}=await client.auth.getUser(); if(!auth.user){window.location.href=`/auth?next=${encodeURIComponent("/adaptive")}`;return;}
    const {data:existing,error:readError}=await client.from("course_progress").select("completed_modules,reflections,completed_at").eq("user_id",auth.user.id).eq("course_id",course.id).maybeSingle();
    if(readError){setMessage(readError.message);return;}
    const passive=course.modules.filter(module=>module.type==="content"||module.type==="visual").map(module=>module.id);
    const completed=[...new Set([...(existing?.completed_modules||[]),...passive])];
    const reflections={...((existing?.reflections||{}) as Record<string,string>),"adaptive-precheck":`${result.score}% on ${new Date().toISOString()}`};
    const {error}=await client.from("course_progress").upsert({user_id:auth.user.id,course_id:course.id,completed_modules:completed,reflections,completed_at:existing?.completed_at||null,updated_at:new Date().toISOString()},{onConflict:"user_id,course_id"});
    if(error){setMessage(error.message);return;}
    setMessage("Focused route saved. Explanatory slides are marked reviewed; all quizzes, scenarios, practice, checklists and reflection still need completing.");
  }

  if(!course)return <main className="stagePage"><div className="stageCard">No courses are currently eligible for adaptive pre-check.</div></main>;
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">ADAPTIVE COURSE MODE</span><h1>Use prior knowledge to focus time where it is most useful.</h1><p>The pre-check can fast-track explanatory content when prior knowledge is secure. It never skips required professional decisions, practice, application or reflection. Safeguarding training is excluded from fast-track mode.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/development">Development cycle</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageCard"><label><strong>Choose course</strong><select value={course.id} onChange={e=>reset(e.target.value)} style={{display:"block",marginTop:8,width:"100%"}}>{eligible.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label></section>
    <section className="stageCard" style={{marginTop:18}}><span className="eyebrow">PRIOR-KNOWLEDGE CHECK</span><h2>{course.title}</h2><p>Answer the diagnostic items without opening the course first.</p><div className="stageList">{quizzes.map((quiz,index)=><article key={quiz.id} className="stageRow" style={{display:"block"}}><strong>{index+1}. {quiz.question}</strong><div className="learnerOptions" style={{marginTop:10}}>{quiz.options.map((option,i)=><button key={`${quiz.id}-${i}`} className={answers[quiz.id]===i?"selected":""} onClick={()=>{setAnswers(prev=>({...prev,[quiz.id]:i}));setResult(null);}}>{option}</button>)}</div></article>)}</div><div className="stageHeroActions" style={{marginTop:16}}><button className="primary" disabled={quizzes.some(q=>answers[q.id]===undefined)} onClick={mark}>Check my route</button></div></section>
    {result&&<section className="stageCard" style={{marginTop:18}}><span className="eyebrow">ROUTE RECOMMENDATION</span><h2>{result.score}% on the pre-check</h2>{result.passed?<><p>Your prior knowledge is strong enough for a focused route. Explanatory content can be marked reviewed, but all active checks and application remain required.</p><div className="stageHeroActions"><button className="primary" onClick={applyFocusedRoute}>Apply focused route</button><a className="secondary phaseLinkButton" href={`/?course=${encodeURIComponent(course.id)}`}>Open course</a></div></>:<><p>The full guided route is recommended so the underlying explanation, examples and checks are available before application.</p><a className="primary phaseLinkButton" href={`/?course=${encodeURIComponent(course.id)}`}>Start full course</a></>}</section>}
  </main>;
}
