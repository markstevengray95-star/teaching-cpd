"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase28Pack, type Phase28RouteId } from "../../lib/coursePersonalisedEntryPhase28";

function clean(value:string|null|undefined){return(value||"").replace(/\s+/g," ").trim();}
function esc(value:string){return value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function currentCourse(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}
type Stored={route?:Phase28RouteId;complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase28:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:28}}));return next;}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;
  const course=currentCourse(modal);const head=modal.querySelector<HTMLElement>(".courseModalHead");const nav=modal.querySelector<HTMLElement>(".moduleNav");if(!course||!head||!nav)return;
  const pack=getPhase28Pack(course as never);const stored=read(course.id);const selected=pack.routes.find(route=>route.id===stored.route)||null;
  const signature=`${course.id}|${selected?.id||"none"}`;if(!force&&modal.dataset.phase28Signature===signature)return;modal.dataset.phase28Signature=signature;

  let badge=head.querySelector<HTMLButtonElement>(".phase28RouteBadge");
  if(!badge){badge=document.createElement("button");badge.type="button";badge.className="phase28RouteBadge";head.appendChild(badge);badge.addEventListener("click",()=>{modal.querySelector<HTMLElement>(".phase28EntryPanel")?.classList.toggle("open");});}
  badge.innerHTML=selected?`<span>ROUTE</span><strong>${esc(selected.label)}</strong>`:`<span>ROUTE</span><strong>Choose entry</strong>`;

  let panel=modal.querySelector<HTMLElement>(".phase28EntryPanel");if(!panel){panel=document.createElement("section");panel.className="phase28EntryPanel";head.insertAdjacentElement("afterend",panel);}
  const wasOpen=panel.classList.contains("open")||!selected;
  panel.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 28</span><h3>${esc(pack.title)}</h3><p>${esc(pack.subtitle)}</p></div><button type="button" class="phase28Close" aria-label="Close route chooser">×</button></header><div class="phase28RouteGrid">${pack.routes.map(route=>`<button type="button" data-phase28-route="${route.id}" class="${selected?.id===route.id?"selected":""}"><span>${esc(route.strapline)}</span><strong>${esc(route.label)}</strong><small>${esc(route.challenge)}</small></button>`).join("")}</div>${selected?`<section class="phase28RouteDetail"><div><span>YOUR EMPHASIS</span><h4>${esc(selected.label)}</h4><ul>${selected.emphasis.map(item=>`<li>${esc(item)}</li>`).join("")}</ul></div><aside><span>OPENING CHALLENGE</span><p>${esc(selected.openingPrompt)}</p><button type="button" class="phase28Start">Start from my recommended point</button></aside></section>`:`<div class="phase28Prompt">Choose the route that best matches your current experience, role or goal.</div>`}`;
  panel.classList.toggle("open",wasOpen);
  panel.querySelector<HTMLButtonElement>(".phase28Close")?.addEventListener("click",()=>panel?.classList.remove("open"));
  panel.querySelectorAll<HTMLButtonElement>("[data-phase28-route]").forEach(button=>button.addEventListener("click",()=>{write(course.id,{route:button.dataset.phase28Route as Phase28RouteId,complete:true});render(modal,true);}));
  panel.querySelector<HTMLButtonElement>(".phase28Start")?.addEventListener("click",()=>{if(!selected)return;const moduleIndex=course.modules.findIndex(module=>selected.recommendedTypes.includes(module.type));const buttons=Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));if(moduleIndex>=0)buttons[moduleIndex]?.click();panel?.classList.remove("open");});

  const navButtons=Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));navButtons.forEach((button,index)=>{button.classList.remove("phase28Recommended");if(selected&&selected.recommendedTypes.includes(course.modules[index]?.type))button.classList.add("phase28Recommended");});
}

export default function CoursePersonalisedEntryPhase28Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(m=>render(m));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
