"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase26Pack } from "../../lib/courseVideoDecisionPointsPhase26";

function clean(v:string|null|undefined){return(v||"").replace(/\s+/g," ").trim();}
function esc(v:string){return v.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function courseFor(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(c=>c.title===title)||null;}
function moduleIndex(modal:HTMLElement){return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(b=>b.classList.contains("current"));}

type Stored={point?:number;viewed?:string[];answers?:Record<string,string>;complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase26:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:26}}));return next;}
function reset(id:string){try{localStorage.removeItem(key(id));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:26}}));}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;
  const course=courseFor(modal);const idx=moduleIndex(modal);const module=course?.modules[idx];const content=modal.querySelector<HTMLElement>(".moduleContent");
  if(!course||!module||!content)return;
  const pack=getPhase26Pack(course as never);
  if(module.id!==pack.anchorId){content.querySelector(".phase26VideoShell")?.remove();delete content.dataset.phase26Signature;return;}
  const stored=read(course.id);const pointIndex=Math.max(0,Math.min(pack.points.length-1,stored.point||0));const point=pack.points[pointIndex];const viewed=new Set(stored.viewed||[]);const answers=stored.answers||{};const selected=answers[point.id]||"";const hasViewed=viewed.has(point.id);const complete=Boolean(stored.complete);
  const sig=`${course.id}|${pointIndex}|${[...viewed].join(",")}|${Object.entries(answers).map(x=>x.join(":"))}|${complete?1:0}`;
  if(!force&&content.dataset.phase26Signature===sig)return;content.dataset.phase26Signature=sig;content.querySelector(".phase26VideoShell")?.remove();

  const timeline=pack.points.map((item,i)=>`<button type="button" data-phase26-point="${i}" class="${i===pointIndex?"current":""} ${viewed.has(item.id)?"viewed":""}"><span>${esc(item.timestamp)}</span><strong>${i+1}</strong></button>`).join("");
  const choices=point.options.map(o=>`<button type="button" data-phase26-answer="${o.id}" ${hasViewed?"":"disabled"} class="${selected===o.id?"selected":""} ${selected&&o.best?"best":""}"><b>${o.id}</b><span>${esc(o.label)}</span></button>`).join("");
  const feedback=selected?(point.options.find(o=>o.id===selected)?.best?`<div class="phase26Feedback success"><strong>Strong professional decision</strong><p>${esc(point.feedback)}</p></div>`:`<div class="phase26Feedback"><strong>Pause and reconsider</strong><p>${esc(point.feedback)}</p></div>`):"";
  const shell=document.createElement("section");shell.className=`phase26VideoShell ${complete?"completed":""}`;
  shell.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 26</span><h3>${esc(pack.title)}</h3><p>${esc(pack.context)}</p></div><b>${complete?"✓":`${pointIndex+1}/3`}</b></header>
    <div class="phase26Timeline">${timeline}</div>
    <section class="phase26Player ${hasViewed?"viewed":"locked"}">
      <div class="phase26Screen"><div class="phase26Scene"><span>SCENE ${pointIndex+1} · ${esc(point.timestamp)}</span><h4>${esc(point.scene)}</h4><p>${hasViewed?esc(point.narration):"Press play to watch the short scene build to the decision point."}</p><div class="phase26VisualPulse"><i></i><i></i><i></i></div></div><div class="phase26Controls"><button type="button" class="phase26Play">${hasViewed?"Replay scene":"▶ Play to decision"}</button><span>${hasViewed?"PAUSED AT DECISION":"READY"}</span></div></div>
      <details class="phase26Transcript"><summary>Accessible transcript</summary><p><strong>Scene:</strong> ${esc(point.scene)}</p><p><strong>Narration:</strong> ${esc(point.narration)}</p></details>
    </section>
    <section class="phase26Decision"><span>VIDEO DECISION POINT</span><h4>${esc(point.prompt)}</h4><div class="phase26Choices">${choices}</div>${hasViewed?feedback:`<p class="phase26LockedNote">Watch the scene first, then choose what should happen next.</p>`}</section>
    <footer><div><strong>${viewed.size}/3 scenes viewed · ${Object.keys(answers).length}/3 decisions made</strong><p>${complete?"Video decision sequence complete — revisit any pause to review the reasoning.":"Complete all three video pauses and decisions."}</p></div><div><button type="button" class="phase26Next" ${selected?"":"disabled"}>${pointIndex===2?"Review from start":"Next decision point"}</button><button type="button" class="phase26Reset">Reset</button></div></footer>`;
  const target=content.querySelector(".moduleActions");content.insertBefore(shell,target||null);

  shell.querySelectorAll<HTMLButtonElement>("[data-phase26-point]").forEach(b=>b.addEventListener("click",()=>{write(course.id,{point:Number(b.dataset.phase26Point||0)});render(modal,true);}));
  shell.querySelector<HTMLButtonElement>(".phase26Play")?.addEventListener("click",()=>{shell.classList.add("playing");const button=shell.querySelector<HTMLButtonElement>(".phase26Play");if(button){button.disabled=true;button.textContent="Playing scene…";}window.setTimeout(()=>{const latest=read(course.id);const nextViewed=new Set(latest.viewed||[]);nextViewed.add(point.id);write(course.id,{viewed:[...nextViewed]});render(modal,true);},1350);});
  shell.querySelectorAll<HTMLButtonElement>("[data-phase26-answer]").forEach(b=>b.addEventListener("click",()=>{const latest=read(course.id);const nextAnswers={...(latest.answers||{}),[point.id]:b.dataset.phase26Answer||""};const nextViewed=new Set(latest.viewed||[]);nextViewed.add(point.id);const allAnswered=pack.points.every(item=>Boolean(nextAnswers[item.id]));const allViewed=pack.points.every(item=>nextViewed.has(item.id));write(course.id,{answers:nextAnswers,viewed:[...nextViewed],complete:allAnswered&&allViewed});render(modal,true);}));
  shell.querySelector<HTMLButtonElement>(".phase26Next")?.addEventListener("click",()=>{write(course.id,{point:pointIndex===2?0:pointIndex+1});render(modal,true);});
  shell.querySelector(".phase26Reset")?.addEventListener("click",()=>{reset(course.id);render(modal,true);});
}

export default function CourseVideoDecisionPointsPhase26Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(m=>render(m));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
