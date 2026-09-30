"use client";

import { useEffect } from "react";
import { courses, getAdaptivePathwayPhase8Pack, isAdaptivePathwayPhase8Module } from "@/lib/catalogue";

function clean(value:string|null|undefined){return (value||"").replace(/\s+/g," ").trim();}
function escapeHtml(value:string){return value.replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]||char));}
function currentCourse(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}
function currentModuleIndex(modal:HTMLElement){return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button=>button.classList.contains("current"));}

function render(modal:HTMLElement){
  if(modal.classList.contains("labMode"))return;
  const course=currentCourse(modal); const index=currentModuleIndex(modal); const module=course?.modules[index]; const content=modal.querySelector<HTMLElement>(".moduleContent");
  if(!course||!module||!content)return;
  if(!isAdaptivePathwayPhase8Module(module)){content.querySelector(".phase8AdaptiveShell")?.remove();delete content.dataset.phase8Signature;return;}
  const pack=getAdaptivePathwayPhase8Pack(course,module); if(!pack)return;
  const signature=`${course.id}|${module.id}`; if(content.dataset.phase8Signature===signature)return; content.dataset.phase8Signature=signature;
  let shell=content.querySelector<HTMLElement>(".phase8AdaptiveShell"); if(!shell){shell=document.createElement("section");shell.className="phase8AdaptiveShell";const actions=content.querySelector(".moduleActions");content.insertBefore(shell,actions||null);}
  let selected=""; try{selected=window.localStorage.getItem(`cpd-path-${course.id}-${pack.kind}`)||"";}catch{}
  shell.innerHTML=`<div class="phase8AdaptiveHead"><span>PHASE 8 · ADAPTIVE PATHWAY</span><strong>${escapeHtml(pack.title)}</strong><p>Choose the route that best matches your current responsibility or context. The course principle stays stable; the application changes.</p></div><div class="phase8RouteGrid">${pack.routes.map(route=>`<button type="button" data-route="${escapeHtml(route.id)}" aria-pressed="${route.id===selected}"><strong>${escapeHtml(route.label)}</strong><span>${escapeHtml(route.purpose)}</span></button>`).join("")}</div><div class="phase8RouteDetail">${selected?renderDetail(pack.routes.find(route=>route.id===selected)?.label||"",pack.routes.find(route=>route.id===selected)?.prompt||"",pack.transferPrompt):"Select a route to reveal its professional prompt."}</div>`;
  shell.querySelectorAll<HTMLButtonElement>("[data-route]").forEach(button=>button.addEventListener("click",()=>{const route=button.dataset.route||"";try{window.localStorage.setItem(`cpd-path-${course.id}-${pack.kind}`,route);}catch{} content.dataset.phase8Signature="";render(modal);}));
}
function renderDetail(label:string,prompt:string,transfer:string){return `<span>YOUR ROUTE · ${escapeHtml(label)}</span><strong>${escapeHtml(prompt)}</strong><p>${escapeHtml(transfer)}</p><small>Use the normal activity response box below to record your adapted version.</small>`;}

export default function CourseAdaptivePathPhase8Controller(){
  useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal").forEach(render);});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;
}
