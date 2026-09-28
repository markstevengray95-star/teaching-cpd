"use client";

import { useEffect, useState } from "react";
import { practiceScenarios } from "@/lib/practiceSimulator";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function SimulatorPage(){
  const [scenarioId,setScenarioId]=useState(practiceScenarios[0].id);
  const [selected,setSelected]=useState<number|null>(null);
  const [userId,setUserId]=useState("");
  const [message,setMessage]=useState("");
  const scenario=practiceScenarios.find(item=>item.id===scenarioId)||practiceScenarios[0];
  const choice=selected===null?null:scenario.choices[selected];

  useEffect(()=>{const client=getSupabaseBrowserClient();(async()=>{const {data}=await client.auth.getUser();if(data.user)setUserId(data.user.id);})();},[]);

  function chooseScenario(id:string){setScenarioId(id);setSelected(null);setMessage("");}

  async function saveReflection(){
    if(!choice||!userId)return;
    const client=getSupabaseBrowserClient();
    const description=`Scenario: ${scenario.situation}\n\nMy decision: ${choice.label}\n\nFeedback: ${choice.feedback}\n\nCoaching point: ${scenario.coachingPoint}`;
    const {error}=await client.from("portfolio_entries").insert({user_id:userId,title:`Practice simulator: ${scenario.title}`,description,evidence_type:"reflection",cpd_hours:0.1,occurred_on:new Date().toISOString().slice(0,10)});
    setMessage(error?error.message:"Simulator reflection saved to your private CPD portfolio.");
  }

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">PROFESSIONAL PRACTICE SIMULATOR</span><h1>Rehearse the decision before you need it.</h1><p>Work through realistic professional situations, commit to a response and use the feedback to refine your thinking. This is developmental practice, not an appraisal score.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/development">Development cycle</a><a className="secondary phaseLinkButton" href="/coaching">Use in coaching</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageGrid">
      <aside className="stageCard stageSpan4"><span className="eyebrow">SCENARIOS</span><div className="stageList" style={{marginTop:10}}>{practiceScenarios.map(item=><button key={item.id} className={`stageRow ${item.id===scenario.id?"active":""}`} onClick={()=>chooseScenario(item.id)} style={{width:"100%",textAlign:"left"}}><div className="stageRowMain"><strong>{item.title}</strong><span>{item.category}</span></div></button>)}</div></aside>
      <article className="stageCard stageSpan8"><span className="eyebrow">{scenario.category.toUpperCase()}</span><h2>{scenario.title}</h2><p style={{fontSize:"1.05rem"}}>{scenario.situation}</p><div className="learnerOptions" style={{marginTop:18}}>{scenario.choices.map((option,index)=><button key={option.label} className={selected===index?"selected":""} onClick={()=>setSelected(index)}>{option.label}</button>)}</div>
        {choice&&<><div className="phaseNotice" style={{marginTop:16}}><strong>Coaching feedback</strong><p>{choice.feedback}</p></div><div className="noticeGood" style={{marginTop:12}}><strong>Principle to carry forward</strong><p>{scenario.coachingPoint}</p></div><div className="stageHeroActions" style={{marginTop:16}}><button className="primary" onClick={saveReflection}>Save reflection to portfolio</button><a className="secondary phaseLinkButton" href={`/actions?focus=${encodeURIComponent(scenario.title)}`}>Turn into action plan</a></div></>}
      </article>
    </section>
    <section className="stageCard" style={{marginTop:18}}><span className="eyebrow">DEEPEN THE PRACTICE</span><h2>Related CPD</h2><div className="stageHeroActions">{scenario.relatedCourseIds.map(id=><a key={id} className="secondary phaseLinkButton" href={`/?course=${encodeURIComponent(id)}`}>Open related course</a>)}</div></section>
  </main>;
}
