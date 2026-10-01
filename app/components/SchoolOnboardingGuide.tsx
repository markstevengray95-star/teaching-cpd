"use client";
import {useState} from "react";
import {pilotChecks,schoolTutorial,setupChecks,type OnboardingSnapshot,type PilotCheckId} from "@/lib/schoolOnboarding";
export default function SchoolOnboardingGuide({snapshot,onSave,onRefresh}:{snapshot:OnboardingSnapshot|null;onSave:(id:PilotCheckId,complete:boolean)=>Promise<void>;onRefresh:()=>void}){
 const [step,setStep]=useState(0),[saving,setSaving]=useState<PilotCheckId|null>(null),[message,setMessage]=useState(""),[error,setError]=useState("");
 const tutorial=schoolTutorial[step],checks=setupChecks(snapshot),done=checks.filter(c=>c.done).length;
 async function save(id:PilotCheckId,value:boolean){
  if(saving)return;setSaving(id);setError("");setMessage("");
  try{await onSave(id,value);setMessage("Pilot checklist saved for this school.");}
  catch{setError("The pilot check was not saved. Your previous saved status is unchanged. Retry when connected.");}
  finally{setSaving(null);}
 }
 return <main className="stagePage schoolOperations onboardingPage">
  <header className="stageHero"><span className="eyebrow">SCHOOL ONBOARDING</span><h1>{snapshot?snapshot.name+": setup & tutorial":"Set up your school"}</h1><p>A guided introduction for School Admins and CPD Leads, from school access to the first staff learning record.</p><nav className="schoolOperationLinks noPrint" aria-label="School setup navigation"><a href="/organisation">Organisation setup</a><a href="/school-reporting">School reporting</a><a href="/procurement">Procurement pack</a><button type="button" className="secondary" onClick={onRefresh}>Refresh configuration</button></nav></header>
  {!snapshot?<section className="stageCard"><h2>Connect a school to save your checklist</h2><p>You can read the tutorial now. Create or join your school through Organisation setup, then return here. This page does not create a school, buy a licence or grant access automatically.</p><a href="/organisation">Create or join the school</a></section>:null}
  <section className="stageCard setupStatus" aria-labelledby="setup-status-title"><h2 id="setup-status-title">Live configuration: {done} / {checks.length} checks present</h2><p>These counts describe configuration, not content quality or launch approval. {snapshot?"Checked at "+snapshot.generated_at:"No school connected yet."}</p><ul>{checks.map(check=><li key={check.title}><strong>{check.done?"Present":"Needs attention"} · {check.title}</strong><span>{check.detail}</span></li>)}</ul><p>Staff directory preparation is recommended, not required: {snapshot?.directory??0} active directory rows. Failed data requests show an error, not a false zero.</p></section>
  <section className="stageCard schoolTutorial" aria-labelledby="tutorial-title">
   <h2 id="tutorial-title">Step-by-step tutorial</h2><p>Page {step+1} of {schoolTutorial.length}. Reading pages does not mark school configuration complete.</p>
   <nav className="tutorialSteps noPrint" aria-label="Tutorial pages">{schoolTutorial.map((page,index)=><button type="button" key={page.id} className={index===step?"primary":"secondary"} aria-current={index===step?"step":undefined} onClick={()=>setStep(index)}>{index+1}. {page.title}</button>)}</nav>
   <article aria-live="polite"><span className="eyebrow">STEP {step+1}</span><h3>{tutorial.title}</h3><p>{tutorial.reading}</p><ol>{tutorial.tasks.map(task=><li key={task}>{task}</li>)}</ol><a className="secondary phaseLinkButton" href={tutorial.href}>{tutorial.action}</a>{tutorial.id==="policies"?<a className="secondary phaseLinkButton" href="/training">Open training requirements</a>:null}</article>
   <div className="schoolOperationLinks noPrint"><button type="button" className="secondary" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous page</button><button type="button" className="primary" disabled={step===schoolTutorial.length-1} onClick={()=>setStep(s=>s+1)}>Next page</button>{step===schoolTutorial.length-1?<span role="status">End of tutorial. Complete and review the pilot checks below.</span>:null}</div>
  </section>
  <section className="stageCard" aria-labelledby="pilot-title"><h2 id="pilot-title">Shared pilot checklist · manually confirmed</h2><p>Only tick a check after carrying it out. Saved checks are administrator attestations, not independent verification. All authorised school administrators share this checklist.</p>
   <div className="pilotChecks">{pilotChecks.map(check=>{const saved=snapshot?.checkpoints.find(c=>c.checkpoint_id===check.id);return <label key={check.id}><input type="checkbox" checked={saved?.completed===true} disabled={!snapshot||saving!==null} onChange={e=>void save(check.id,e.target.checked)}/><span><strong>{check.title}</strong><span>{check.detail}</span><small>{saved?"Last saved: "+saved.updated_at:"Not yet confirmed"}</small>{saving===check.id?<small>Saving…</small>:null}</span></label>;})}</div>
   {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
  </section>
 </main>;
}
