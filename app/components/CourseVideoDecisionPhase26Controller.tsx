"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase26Pack } from "../../lib/courseVideoDecisionPhase26";

function clean(value:string|null|undefined){return(value||"").replace(/\s+/g," ").trim();}
function esc(value:string){return value.replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]||char));}
function courseFor(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}

type Stored={scenario?:number;frame?:number;answers?:Record<string,string>;passed?:string[];complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase26:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:26}}));return next;}
function reset(id:string){try{localStorage.removeItem(key(id));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:26}}));}

function render(modal:HTMLElement,force=false){
  const course=courseFor(modal);if(!course)return;const head=modal.querySelector<HTMLElement>(".courseModalHead");if(!head)return;
  const pack=getPhase26Pack(course as never);const stored=read(course.id);const scenarioIndex=Math.max(0,Math.min(1,stored.scenario||0));const scenario=pack.scenarios[scenarioIndex];const frameIndex=Math.max(0,Math.min(2,stored.frame||0));const frame=scenario.frames[frameIndex];const passed=new Set(stored.passed||[]);const selected=stored.answers?.[scenario.id]||"";const atDecision=frameIndex===scenario.frames.length-1;const complete=Boolean(stored.complete);
  const signature=`${course.id}|${scenarioIndex}|${frameIndex}|${selected}|${[...passed].join(",")}|${complete?1:0}`;if(!force&&modal.dataset.phase26Signature===signature)return;modal.dataset.phase26Signature=signature;

  let badge=head.querySelector<HTMLButtonElement>(".phase26VideoBadge");if(!badge){badge=document.createElement("button");badge.type="button";badge.className="phase26VideoBadge";badge.addEventListener("click",()=>{const drawer=modal.querySelector<HTMLElement>(".phase26VideoDrawer");if(!drawer)return;drawer.classList.toggle("open");});head.appendChild(badge);}badge.innerHTML=`<span>▶</span><strong>${complete?"✓":`${scenarioIndex+1}/2`}</strong><small>decision clips</small>`;

  let drawer=modal.querySelector<HTMLElement>(".phase26VideoDrawer");if(!drawer){drawer=document.createElement("section");drawer.className="phase26VideoDrawer";head.insertAdjacentElement("afterend",drawer);}const open=drawer.classList.contains("open");
  const answerOptions=scenario.decision.options.map(option=>`<button type="button" data-phase26-answer="${option.id}" class="${selected===option.id?"selected":""} ${selected&&option.best?"best":""}"><b>${option.id}</b><span>${esc(option.label)}</span></button>`).join("");
  const chosen=scenario.decision.options.find(option=>option.id===selected);const passedCurrent=passed.has(scenario.id);
  drawer.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 26</span><h3>${esc(pack.title)}</h3><p>${esc(pack.subtitle)}</p></div><button type="button" class="phase26Close">×</button></header>
    <section class="phase26Tabs">${pack.scenarios.map((item,index)=>`<button type="button" data-phase26-scenario="${index}" class="${index===scenarioIndex?"current":""} ${passed.has(item.id)?"passed":""}"><span>CLIP ${index+1}</span><strong>${esc(item.title)}</strong><b>${passed.has(item.id)?"✓":""}</b></button>`).join("")}</section>
    <section class="phase26Player"><div class="phase26Screen"><div class="phase26ScreenTop"><span>${esc(frame.label)}</span><b>${frameIndex===0?"PLAYING":atDecision?"PAUSED · DECISION":"PLAYING"}</b></div><div class="phase26Scene"><span>${esc(frame.visualCue)}</span><strong>${esc(frame.narration)}</strong></div><div class="phase26Timeline"><i style="width:${((frameIndex+1)/scenario.frames.length)*100}%"></i></div></div><div class="phase26Controls"><button type="button" class="phase26Prev" ${frameIndex===0?"disabled":""}>← Previous</button><button type="button" class="phase26Play" ${atDecision?"disabled":""}>${frameIndex===1?"Continue to decision":"Play next frame"}</button><span>${frameIndex+1}/${scenario.frames.length} frames</span></div></section>
    ${atDecision?`<section class="phase26Decision"><span>VIDEO PAUSED · WHAT HAPPENS NEXT?</span><h4>${esc(scenario.decision.prompt)}</h4><div>${answerOptions}</div>${selected?`<aside class="${chosen?.best?"success":""}"><strong>${chosen?.best?"Strong decision":"Reconsider"}</strong><p>${esc(scenario.decision.rationale)}</p></aside>`:""}${passedCurrent?`<div class="phase26Transfer"><span>TRANSFER</span><p>${esc(scenario.transferPrompt)}</p></div>`:""}</section>`:""}
    <footer><div><strong>${complete?"Video decision set complete":`${passed.size}/2 decisions secured`}</strong><p>Short scenario clips add professional judgement without adding more slides to the course journey.</p></div><div><button type="button" class="phase26Next" ${!passedCurrent?"disabled":""}>${scenarioIndex===1?"Finish / review":"Next clip"}</button><button type="button" class="phase26Reset">Reset</button></div></footer>`;
  drawer.classList.toggle("open",open);
  drawer.querySelector(".phase26Close")?.addEventListener("click",()=>drawer?.classList.remove("open"));
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase26-scenario]").forEach(button=>button.addEventListener("click",()=>{write(course.id,{scenario:Number(button.dataset.phase26Scenario||0),frame:0});render(modal,true);}));
  drawer.querySelector(".phase26Prev")?.addEventListener("click",()=>{write(course.id,{frame:Math.max(0,frameIndex-1)});render(modal,true);});
  drawer.querySelector(".phase26Play")?.addEventListener("click",()=>{if(atDecision)return;write(course.id,{frame:Math.min(2,frameIndex+1)});render(modal,true);});
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase26-answer]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.phase26Answer||"";const option=scenario.decision.options.find(item=>item.id===id);const nextPassed=new Set(read(course.id).passed||[]);if(option?.best)nextPassed.add(scenario.id);write(course.id,{answers:{...(read(course.id).answers||{}),[scenario.id]:id},passed:[...nextPassed],complete:nextPassed.size===pack.scenarios.length});render(modal,true);}));
  drawer.querySelector(".phase26Next")?.addEventListener("click",()=>{if(!passedCurrent)return;write(course.id,{scenario:scenarioIndex===1?0:1,frame:0,complete:passed.size===pack.scenarios.length});render(modal,true);});
  drawer.querySelector(".phase26Reset")?.addEventListener("click",()=>{reset(course.id);render(modal,true);});
}

export default function CourseVideoDecisionPhase26Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
