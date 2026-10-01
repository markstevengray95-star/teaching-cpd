"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createPhase31Exam, getPhase31QuestionBank, PHASE31_PASS_PERCENT } from "../../lib/courseCertificationExamPhase31";

function clean(value:string|null|undefined){return(value||"").replace(/\s+/g," ").trim();}
function esc(value:string){return value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function currentCourse(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}
function isComplete(modal:HTMLElement){const percent=clean(modal.querySelector(".courseProgress strong")?.textContent);if(percent==="100%")return true;const buttons=Array.from(modal.querySelectorAll<HTMLElement>(".moduleNav button"));return buttons.length>0&&buttons.every(button=>button.classList.contains("done"));}

type Stored={attempts?:number;bestPercent?:number;latestPercent?:number;latestScore?:number;latestTotal?:number;passed?:boolean;complete?:boolean;active?:boolean;activeSeed?:number;current?:number;answers?:Record<string,number>;weakTopics?:string[];completedAt?:string;cloudMessage?:string;updatedAt?:string};
function key(id:string){return`cpd-phase31:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:31}}));return next;}

async function syncResult(courseId:string,percent:number,attempts:number,passed:boolean,best:number,completedAt?:string){
  try{
    const client=getSupabaseBrowserClient();const {data:auth}=await client.auth.getUser();
    if(!auth.user)return"Result saved on this device. Sign in to connect a passing result to an official certificate.";
    const {data:progress,error:readError}=await client.from("course_progress").select("reflections,completed_at").eq("user_id",auth.user.id).eq("course_id",courseId).maybeSingle();
    if(readError)return"Your result is saved locally, but the account record could not be updated yet.";
    if(!progress?.completed_at)return"Exam result saved locally. Complete the course account record before an official certificate can unlock.";
    const previous=((progress.reflections||{}) as Record<string,string>);const alreadyPassed=previous.phase31_certification_passed==="true";
    const finalPassed=alreadyPassed||passed;const finalBest=Math.max(Number(previous.phase31_certification_score||0),best);
    const reflections={...previous,phase31_certification_passed:finalPassed?"true":"false",phase31_certification_score:String(finalBest),phase31_certification_latest_score:String(percent),phase31_certification_attempts:String(attempts),phase31_certification_completed_at:finalPassed?(previous.phase31_certification_completed_at||completedAt||new Date().toISOString()):""};
    const {error}=await client.from("course_progress").update({reflections}).eq("user_id",auth.user.id).eq("course_id",courseId);
    if(error)return"Your result is saved locally, but the certification record could not be synced yet.";
    return finalPassed?"Certification pass synced. Your certificate is now eligible to unlock in Certificates.":"Attempt synced. Reach 80% or above on any attempt to unlock the certificate.";
  }catch{return"Your result is saved locally. Account sync can be retried on your next attempt.";}
}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;const course=currentCourse(modal);const head=modal.querySelector<HTMLElement>(".courseModalHead");if(!course||!head)return;
  const courseComplete=isComplete(modal);const stored=read(course.id);const bankSize=getPhase31QuestionBank(course as never).length;const signature=`${course.id}|${courseComplete?1:0}|${stored.attempts||0}|${stored.bestPercent||0}|${stored.passed?1:0}|${stored.active?1:0}|${stored.activeSeed||0}|${stored.current||0}|${Object.keys(stored.answers||{}).length}|${stored.cloudMessage||""}`;
  if(!force&&modal.dataset.phase31Signature===signature)return;modal.dataset.phase31Signature=signature;

  let badge=head.querySelector<HTMLButtonElement>(".phase31CertificationBadge");if(!badge){badge=document.createElement("button");badge.type="button";badge.className="phase31CertificationBadge";head.appendChild(badge);badge.addEventListener("click",()=>modal.querySelector<HTMLElement>(".phase31ExamDrawer")?.classList.toggle("open"));}
  badge.disabled=!courseComplete;badge.innerHTML=stored.passed?`<span>CERTIFIED</span><strong>${stored.bestPercent||80}% ✓</strong>`:courseComplete?`<span>PHASE 31</span><strong>Certification exam</strong>`:`<span>PHASE 31</span><strong>Complete course first</strong>`;

  let drawer=modal.querySelector<HTMLElement>(".phase31ExamDrawer");if(!drawer){drawer=document.createElement("section");drawer.className="phase31ExamDrawer";head.insertAdjacentElement("afterend",drawer);}const open=drawer.classList.contains("open");
  if(!courseComplete){drawer.innerHTML=`<div class="phase31Locked"><strong>Certification exam locked</strong><p>Complete the course learning sequence first. The final exam then unlocks as the certificate gate.</p></div>`;drawer.classList.toggle("open",open);return;}

  if(stored.active&&stored.activeSeed){renderActive(drawer,course,stored,modal);}else{renderLanding(drawer,course,stored,bankSize,modal);}
  drawer.classList.toggle("open",open);
}

function renderLanding(drawer:HTMLElement,course:(typeof courses)[number],stored:Stored,bankSize:number,modal:HTMLElement){
  const attempts=stored.attempts||0;const best=stored.bestPercent||0;const passed=Boolean(stored.passed);
  drawer.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 31 · FINAL PHASE</span><h3>Certification Exam · ${esc(course.title)}</h3><p>Each attempt draws a fresh 10–15-question set from a validated ${bankSize}-question course bank. Score at least ${PHASE31_PASS_PERCENT}% to unlock certification. Resits are unlimited.</p></div><button type="button" class="phase31Close" aria-label="Close certification exam">×</button></header><div class="phase31ExamSummary"><div><span>PASS MARK</span><strong>${PHASE31_PASS_PERCENT}%</strong></div><div><span>QUESTION BANK</span><strong>${bankSize}</strong></div><div><span>ATTEMPTS</span><strong>${attempts}</strong></div><div><span>BEST</span><strong>${attempts?`${best}%`:"—"}</strong></div></div>${passed?`<section class="phase31Passed"><div class="phase31Seal">✓</div><div><span>CERTIFICATION STANDARD SECURED</span><h4>Certificate unlocked</h4><p>Your best certification score is ${best}%. This pass remains valid even if you practise with another randomized set.</p></div></section>`:`<section class="phase31Gate"><span>CERTIFICATE GATE</span><h4>Course completion alone does not issue a new certificate.</h4><p>Pass this final certification exam at 80% or above. Questions are randomized between attempts and no answers are revealed until the attempt is submitted.</p></section>`}${stored.weakTopics?.length?`<section class="phase31Review"><span>REVIEW BEFORE YOUR NEXT ATTEMPT</span><div>${stored.weakTopics.map(topic=>`<b>${esc(topic.replaceAll("-"," "))}</b>`).join("")}</div></section>`:""}${stored.cloudMessage?`<div class="phase31CloudMessage">${esc(stored.cloudMessage)}</div>`:""}<footer><div><strong>${passed?"Certification complete":"Ready for the final check"}</strong><p>${passed?"You can still take another set for practice without losing your pass.":"There is no penalty for resitting. Your highest score is retained."}</p></div><div><button type="button" class="phase31Start">${attempts?"Start another randomized attempt":"Start certification exam"}</button>${passed?`<button type="button" class="phase31Certificates">Open Certificates</button>`:""}</div></footer>`;
  drawer.querySelector<HTMLButtonElement>(".phase31Close")?.addEventListener("click",()=>drawer.classList.remove("open"));
  drawer.querySelector<HTMLButtonElement>(".phase31Start")?.addEventListener("click",()=>{const seed=Date.now()+(attempts+1)*7919;write(course.id,{active:true,activeSeed:seed,current:0,answers:{},cloudMessage:""});render(modal,true);});
  drawer.querySelector<HTMLButtonElement>(".phase31Certificates")?.addEventListener("click",()=>{window.location.href="/certificates";});
}

function renderActive(drawer:HTMLElement,course:(typeof courses)[number],stored:Stored,modal:HTMLElement){
  const exam=createPhase31Exam(course as never,stored.activeSeed||1);const current=Math.max(0,Math.min(exam.questions.length-1,stored.current||0));const question=exam.questions[current];const answers=stored.answers||{};const selected=answers[question.id];const answeredCount=Object.keys(answers).length;const isLast=current===exam.questions.length-1;
  drawer.innerHTML=`<header><div><span>PHASE 31 · CERTIFICATION ATTEMPT ${(stored.attempts||0)+1}</span><h3>${esc(course.title)}</h3><p>Answer independently. Explanations and review topics appear after submission.</p></div><button type="button" class="phase31Exit">Save & exit</button></header><div class="phase31AttemptProgress"><div><i style="width:${Math.round((answeredCount/exam.questions.length)*100)}%"></i></div><strong>${answeredCount}/${exam.questions.length} answered</strong></div><section class="phase31Question"><span>QUESTION ${current+1} OF ${exam.questions.length} · ${esc(question.topic.replaceAll("-"," "))}</span><h4>${esc(question.prompt)}</h4><div class="phase31Choices">${question.options.map((option,index)=>`<button type="button" data-phase31-answer="${index}" class="${selected===index?"selected":""}"><b>${String.fromCharCode(65+index)}</b><span>${esc(option)}</span></button>`).join("")}</div></section><footer class="phase31AttemptNav"><button type="button" class="phase31Prev" ${current===0?"disabled":""}>Previous</button><div>${Array.from({length:exam.questions.length},(_,index)=>`<button type="button" data-phase31-jump="${index}" class="${index===current?"current":""} ${answers[exam.questions[index].id]!==undefined?"answered":""}">${index+1}</button>`).join("")}</div>${isLast?`<button type="button" class="phase31Submit" ${answeredCount===exam.questions.length?"":"disabled"}>Submit exam</button>`:`<button type="button" class="phase31Next">Next</button>`}</footer>`;
  drawer.querySelector<HTMLButtonElement>(".phase31Exit")?.addEventListener("click",()=>drawer.classList.remove("open"));
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase31-answer]").forEach(button=>button.addEventListener("click",()=>{const next={...read(course.id).answers,[question.id]:Number(button.dataset.phase31Answer)};write(course.id,{answers:next});render(modal,true);}));
  drawer.querySelector<HTMLButtonElement>(".phase31Prev")?.addEventListener("click",()=>{write(course.id,{current:Math.max(0,current-1)});render(modal,true);});
  drawer.querySelector<HTMLButtonElement>(".phase31Next")?.addEventListener("click",()=>{write(course.id,{current:Math.min(exam.questions.length-1,current+1)});render(modal,true);});
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase31-jump]").forEach(button=>button.addEventListener("click",()=>{write(course.id,{current:Number(button.dataset.phase31Jump||0)});render(modal,true);}));
  drawer.querySelector<HTMLButtonElement>(".phase31Submit")?.addEventListener("click",async()=>{
    const latest=read(course.id);const latestAnswers=latest.answers||{};if(Object.keys(latestAnswers).length<exam.questions.length)return;
    let score=0;const weak:string[]=[];exam.questions.forEach(item=>{if(latestAnswers[item.id]===item.answer)score+=1;else weak.push(item.topic);});const percent=Math.round((score/exam.questions.length)*100);const passed=percent>=PHASE31_PASS_PERCENT;const attempts=(latest.attempts||0)+1;const best=Math.max(latest.bestPercent||0,percent);const stickyPass=Boolean(latest.passed||passed);const completedAt=stickyPass?(latest.completedAt||new Date().toISOString()):undefined;
    write(course.id,{attempts,bestPercent:best,latestPercent:percent,latestScore:score,latestTotal:exam.questions.length,passed:stickyPass,complete:stickyPass,active:false,current:0,answers:{},weakTopics:[...new Set(weak)].slice(0,6),completedAt,cloudMessage:"Syncing certification result…"});render(modal,true);
    const message=await syncResult(course.id,percent,attempts,stickyPass,best,completedAt);write(course.id,{cloudMessage:message});render(modal,true);
  });
}

export default function CourseCertificationExamPhase31Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal=>render(modal));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
