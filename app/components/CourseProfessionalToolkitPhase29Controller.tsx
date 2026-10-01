"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase29Pack } from "../../lib/courseProfessionalToolkitPhase29";

function clean(value:string|null|undefined){return(value||"").replace(/\s+/g," ").trim();}
function esc(value:string){return value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function currentCourse(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}
function isComplete(modal:HTMLElement){const percent=clean(modal.querySelector(".courseProgress strong")?.textContent);if(percent==="100%")return true;const buttons=Array.from(modal.querySelectorAll<HTMLElement>(".moduleNav button"));return buttons.length>0&&buttons.every(button=>button.classList.contains("done"));}
type Stored={savedTools?:string[];complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase29:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:29}}));return next;}
function pretty(kind:string){return kind.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;const course=currentCourse(modal);const head=modal.querySelector<HTMLElement>(".courseModalHead");if(!course||!head)return;
  const unlocked=isComplete(modal);const pack=getPhase29Pack(course as never);const stored=read(course.id);const saved=new Set(stored.savedTools||[]);const signature=`${course.id}|${unlocked?1:0}|${[...saved].join(",")}`;if(!force&&modal.dataset.phase29Signature===signature)return;modal.dataset.phase29Signature=signature;
  let badge=head.querySelector<HTMLButtonElement>(".phase29ToolkitBadge");if(!badge){badge=document.createElement("button");badge.type="button";badge.className="phase29ToolkitBadge";head.appendChild(badge);badge.addEventListener("click",()=>modal.querySelector<HTMLElement>(".phase29ToolkitDrawer")?.classList.toggle("open"));}
  badge.disabled=!unlocked;badge.innerHTML=unlocked?`<span>TOOLKIT</span><strong>${saved.size}/${pack.tools.length} saved</strong>`:`<span>TOOLKIT</span><strong>Unlock on completion</strong>`;
  let drawer=modal.querySelector<HTMLElement>(".phase29ToolkitDrawer");if(!drawer){drawer=document.createElement("section");drawer.className="phase29ToolkitDrawer";head.insertAdjacentElement("afterend",drawer);}const open=drawer.classList.contains("open");
  drawer.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 29</span><h3>${esc(pack.title)}</h3><p>${esc(pack.subtitle)}</p></div><button type="button" class="phase29Close">×</button></header><div class="phase29ToolGrid">${pack.tools.map(item=>`<article class="${saved.has(item.id)?"saved":""}"><div class="phase29ToolTop"><span>${esc(pretty(item.kind))}</span><b>${saved.has(item.id)?"✓ SAVED":"UNLOCKED"}</b></div><h4>${esc(item.title)}</h4><p>${esc(item.summary)}</p><div class="phase29ToolBody">${item.body.map(line=>`<div>${esc(line)}</div>`).join("")}</div><footer><button type="button" data-phase29-copy="${item.id}">Copy</button><button type="button" data-phase29-save="${item.id}">${saved.has(item.id)?"Remove from My toolkit":"Save to My toolkit"}</button></footer></article>`).join("")}</div><footer class="phase29ToolkitFooter"><strong>${saved.size} reusable tool${saved.size===1?"":"s"} saved</strong><p>Saved tools remain available from this course when you return. Copy any tool into planning notes, meeting agendas or implementation work.</p></footer>`;drawer.classList.toggle("open",open);
  drawer.querySelector<HTMLButtonElement>(".phase29Close")?.addEventListener("click",()=>drawer?.classList.remove("open"));
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase29-copy]").forEach(button=>button.addEventListener("click",async()=>{const item=pack.tools.find(t=>t.id===button.dataset.phase29Copy);if(!item)return;const text=`${item.title}\n\n${item.summary}\n\n${item.body.join("\n")}`;try{await navigator.clipboard.writeText(text);button.textContent="Copied ✓";setTimeout(()=>button.textContent="Copy",1200);}catch{button.textContent="Select and copy";}}));
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase29-save]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.phase29Save||"";const next=new Set(read(course.id).savedTools||[]);if(next.has(id))next.delete(id);else next.add(id);write(course.id,{savedTools:[...next],complete:next.size>0});render(modal,true);}));
}

export default function CourseProfessionalToolkitPhase29Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(m=>render(m));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
