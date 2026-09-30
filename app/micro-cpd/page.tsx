"use client";

import { useEffect, useMemo, useState } from "react";
import { microCpdUnits } from "@/lib/microCpd";
import { cpdRefreshers } from "@/lib/cpdRefreshers";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Progress={unit_id:string;reflection:string;completed_at:string};

export default function MicroCpdPage(){
  const [progress,setProgress]=useState<Record<string,Progress>>({});
  const [open,setOpen]=useState<string|null>(null);
  const [refresherOpen,setRefresherOpen]=useState<string|null>(null);
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [refresherAnswers,setRefresherAnswers]=useState<Record<string,Record<number,number>>>({});
  const [reflections,setReflections]=useState<Record<string,string>>({});
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [category,setCategory]=useState("All");

  useEffect(()=>{let live=true;(async()=>{const c=getSupabaseBrowserClient();const {data:auth}=await c.auth.getUser();if(!auth.user){window.location.href="/auth?next=/micro-cpd";return;}const {data,error}=await c.from("micro_cpd_progress").select("unit_id,reflection,completed_at").eq("user_id",auth.user.id);if(!live)return;if(error)setMessage(error.message);const next:Record<string,Progress>={};for(const row of data||[])next[row.unit_id]=row as Progress;setProgress(next);setReflections(Object.fromEntries(Object.values(next).map(row=>[row.unit_id,row.reflection])));setLoading(false);})();return()=>{live=false};},[]);

  const categories=useMemo(()=>["All",...new Set(microCpdUnits.map(u=>u.category))],[]);
  const units=category==="All"?microCpdUnits:microCpdUnits.filter(u=>u.category===category);
  const completedMicro=microCpdUnits.filter(u=>progress[u.id]).length;
  const completedRefreshers=cpdRefreshers.filter(u=>progress[u.id]).length;
  const minutes=microCpdUnits.filter(u=>progress[u.id]).reduce((sum,u)=>sum+u.minutes,0)+cpdRefreshers.filter(u=>progress[u.id]).reduce((sum,u)=>sum+u.minutes,0);

  async function saveProgress(unitId:string,reflection:string,title:string){
    const c=getSupabaseBrowserClient();const {data:auth}=await c.auth.getUser();if(!auth.user)return false;
    const {data,error}=await c.from("micro_cpd_progress").upsert({user_id:auth.user.id,unit_id:unitId,reflection,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"user_id,unit_id"}).select("unit_id,reflection,completed_at").single();
    if(error){setMessage(error.message);return false;}setProgress(prev=>({...prev,[unitId]:data as Progress}));setMessage(`Saved: ${title}`);return true;
  }

  async function complete(unitId:string){const unit=microCpdUnits.find(u=>u.id===unitId);if(!unit)return;if(answers[unitId]!==unit.answer){setMessage("Complete the quick check correctly before saving this micro-CPD unit.");return;}const reflection=(reflections[unitId]||"").trim();if(reflection.length<12){setMessage("Add a short commitment to practice before completing the unit.");return;}await saveProgress(unitId,reflection,unit.title);}

  async function completeRefresher(refresherId:string){
    const unit=cpdRefreshers.find(item=>item.id===refresherId);if(!unit)return;
    const picked=refresherAnswers[refresherId]||{};
    const allCorrect=unit.finalChecks.every((check,index)=>picked[index]===check.answer);
    if(!allCorrect){setMessage("Complete all three refresher checks correctly before saving the 30-minute refresher.");return;}
    const reflection=(reflections[refresherId]||"").trim();if(reflection.length<15){setMessage("Add one specific action you will take after this refresher.");return;}
    await saveProgress(refresherId,reflection,unit.title);
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading quick CPD…</div></main>;
  return <main className="stagePage microCpdPage">
    <section className="stageHero microCpdHero"><span className="eyebrow">QUICK CPD · 5–30 MINUTES</span><h1>Choose a short refresher or one focused micro-CPD idea.</h1><p>The new 30-minute refreshers cover key whole-school priorities without taking staff through the full course. The original micro-units remain available for 5–10 minute development moments.</p></section>
    {message&&<div className="phaseNotice">{message}</div>}

    <section className="stageStatGrid"><div className="stageStat"><strong>{completedRefreshers}</strong><span>30-min refreshers completed</span></div><div className="stageStat"><strong>{completedMicro}</strong><span>micro-units completed</span></div><div className="stageStat"><strong>{minutes}</strong><span>development minutes completed</span></div><div className="stageStat"><strong>{cpdRefreshers.length}</strong><span>key refreshers available</span></div></section>

    <section className="stageCard refresherIntro"><div><span className="eyebrow">30-MINUTE REFRESHERS</span><h2>Essential CPD without the full-course length</h2><p>Use these for annual refresh, staff meetings, return-to-practice reminders or when a full course is not needed. Each refresher has three short sections, quick decisions and a final three-question check.</p></div></section>

    <section className="refresherGrid">{cpdRefreshers.map(unit=>{const done=Boolean(progress[unit.id]);const openNow=refresherOpen===unit.id;const picked=refresherAnswers[unit.id]||{};return <article className={`stageCard refresherCard ${done?"done":""}`} key={unit.id}><header><div><span className="refresherMinutes">30 min</span><span className="microCategory">{unit.category}</span></div>{done&&<b>✓ completed</b>}</header><h2>{unit.title}</h2><p>{unit.summary}</p>{unit.boundary&&<small className="refresherBoundary">{unit.boundary}</small>}<button className="secondary" onClick={()=>setRefresherOpen(openNow?null:unit.id)}>{openNow?"Close refresher":done?"Review refresher":"Start 30-min refresher"}</button>{openNow&&<div className="refresherBody">
      <div className="refresherSections">{unit.sections.map((section,index)=><section key={section.title}><header><span>{section.minutes} min</span><strong>{section.title}</strong></header><p>{section.intro}</p><ul>{section.keyPoints.map(point=><li key={point}>{point}</li>)}</ul>{section.scenario&&<div className="refresherScenario"><span className="eyebrow">DECISION POINT</span><strong>{section.scenario.question}</strong><p>{section.scenario.feedback}</p></div>}</section>)}</div>
      <section className="refresherFinal"><span className="eyebrow">FINAL CHECK · 3 QUESTIONS</span>{unit.finalChecks.map((check,index)=>{const selected=picked[index];return <div className="refresherQuestion" key={check.question}><strong>{index+1}. {check.question}</strong><div>{check.options.map((option,optionIndex)=><label className={selected!==undefined&&optionIndex===check.answer?"correct":selected===optionIndex?"wrong":""} key={option}><input type="radio" name={`${unit.id}-${index}`} checked={selected===optionIndex} onChange={()=>setRefresherAnswers(prev=>({...prev,[unit.id]:{...(prev[unit.id]||{}),[index]:optionIndex}}))}/><span>{option}</span></label>)}</div>{selected!==undefined&&<p className={selected===check.answer?"checkFeedback good":"checkFeedback"}>{selected===check.answer?check.feedback:"Not quite. Review the section and try again."}</p>}</div>})}</section>
      <section className="microCommit"><span className="eyebrow">COMMIT TO PRACTICE</span><label>{unit.commitPrompt}<textarea rows={3} value={reflections[unit.id]||""} onChange={e=>setReflections(prev=>({...prev,[unit.id]:e.target.value}))} placeholder="Write one specific action…"/></label><button className="primary" onClick={()=>completeRefresher(unit.id)}>{done?"Update reflection":"Complete 30-min refresher"}</button>{done&&<small>Last saved {new Date(progress[unit.id].completed_at).toLocaleDateString("en-GB")}</small>}</section>
    </div>}</article>})}</section>

    <section className="stageCard microFilter"><div><span className="eyebrow">5–10 MINUTE MICRO-CPD</span><h2>Choose a development theme</h2></div><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></section>
    <section className="microGrid">{units.map(unit=>{const done=Boolean(progress[unit.id]);const answer=answers[unit.id];const answered=answer!==undefined;return <article className={`stageCard microCard ${done?"done":""}`} key={unit.id}><header><div><span className="microMinutes">{unit.minutes} min</span><span className="microCategory">{unit.category}</span></div>{done&&<b>✓ completed</b>}</header><h2>{unit.title}</h2><p>{unit.idea}</p><button className="secondary" onClick={()=>setOpen(open===unit.id?null:unit.id)}>{open===unit.id?"Close unit":done?"Review unit":"Start micro-CPD"}</button>{open===unit.id&&<div className="microBody"><div className="microFlow">{unit.visual.map((step,i)=><div key={step.heading}><span>{i+1}</span><strong>{step.heading}</strong><p>{step.text}</p></div>)}</div><section className="microPractice"><span className="eyebrow">TRY IT</span><p>{unit.tryIt}</p></section><section className="microCheck"><span className="eyebrow">QUICK CHECK</span><strong>{unit.question}</strong><div>{unit.options.map((option,i)=><label className={answered&&i===unit.answer?"correct":answered&&i===answer?"wrong":""} key={option}><input type="radio" name={`answer-${unit.id}`} checked={answer===i} onChange={()=>setAnswers(prev=>({...prev,[unit.id]:i}))}/><span>{option}</span></label>)}</div>{answered&&<p className={answer===unit.answer?"checkFeedback good":"checkFeedback"}>{answer===unit.answer?unit.feedback:"Not quite. Re-read the idea and try the check again."}</p>}</section><section className="microCommit"><span className="eyebrow">COMMIT TO PRACTICE</span><label>{unit.commitPrompt}<textarea rows={3} value={reflections[unit.id]||""} onChange={e=>setReflections(prev=>({...prev,[unit.id]:e.target.value}))} placeholder="Write one specific action you will try…"/></label><button className="primary" onClick={()=>complete(unit.id)}>{done?"Update reflection":"Complete micro-CPD"}</button>{done&&<small>Last saved {new Date(progress[unit.id].completed_at).toLocaleDateString("en-GB")}</small>}</section></div>}</article>})}</section>
    <section className="stageCard microBoundary"><strong>Quick CPD is a prompt for practice, not proof of impact.</strong><p>Completion records that you engaged with the material. Use an action plan, coaching cycle, portfolio evidence or later reflection if you want to evaluate whether the change improved practice.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/actions">Action plans</a><a className="secondary phaseLinkButton" href="/portfolio">Portfolio</a></div></section>
  </main>;
}
