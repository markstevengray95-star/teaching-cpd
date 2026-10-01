"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase23Pack } from "../../lib/courseLiveTeamQuizPhase23";

function clean(v:string|null|undefined){return(v||"").replace(/\s+/g," ").trim();}
function esc(v:string){return v.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function courseFor(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(c=>c.title===title)||null;}

type Team={id:string;name:string;score:number;answer?:string};
type Stored={teams?:Team[];roundIndex?:number;revealed?:boolean;complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase23:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:23}}));return next;}
function reset(id:string){try{localStorage.removeItem(key(id));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:23}}));}

function render(modal:HTMLElement,force=false){
  const course=courseFor(modal);if(!course)return;const head=modal.querySelector<HTMLElement>(".courseModalHead");if(!head)return;
  const pack=getPhase23Pack(course as never);const stored=read(course.id);const teams=stored.teams?.length?stored.teams:[{id:"t1",name:"Team A",score:0},{id:"t2",name:"Team B",score:0}];const roundIndex=Math.max(0,Math.min(pack.rounds.length-1,stored.roundIndex||0));const round=pack.rounds[roundIndex];const revealed=Boolean(stored.revealed);const complete=Boolean(stored.complete);
  const sig=`${course.id}|${roundIndex}|${revealed?1:0}|${complete?1:0}|${teams.map(t=>`${t.name}:${t.score}:${t.answer||""}`).join("|")}`;if(!force&&modal.dataset.phase23Signature===sig)return;modal.dataset.phase23Signature=sig;
  let badge=head.querySelector<HTMLButtonElement>(".phase23QuizBadge");if(!badge){badge=document.createElement("button");badge.type="button";badge.className="phase23QuizBadge";badge.addEventListener("click",()=>{const d=modal.querySelector<HTMLElement>(".phase23QuizDrawer");if(!d)return;d.classList.toggle("open");});head.appendChild(badge);}badge.innerHTML=`<span>QUIZ</span><strong>${complete?"✓":`${roundIndex+1}/3`}</strong><small>team mode</small>`;
  let drawer=modal.querySelector<HTMLElement>(".phase23QuizDrawer");if(!drawer){drawer=document.createElement("section");drawer.className="phase23QuizDrawer";head.insertAdjacentElement("afterend",drawer);}const open=drawer.classList.contains("open");
  const opts=round.options.map(o=>`<button type="button" data-phase23-option="${o.id}" class="${revealed&&o.correct?"correct":""}"><b>${o.id}</b><span>${esc(o.label)}</span></button>`).join("");
  const teamCards=teams.map((t,i)=>`<article><div><input value="${esc(t.name)}" data-phase23-name="${t.id}"/><strong>${t.score} pts</strong></div><select data-phase23-answer="${t.id}" ${revealed?"disabled":""}><option value="">Choose answer</option>${round.options.map(o=>`<option value="${o.id}" ${t.answer===o.id?"selected":""}>${o.id}</option>`).join("")}</select></article>`).join("");
  drawer.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 23</span><h3>${esc(pack.title)}</h3><p>${esc(pack.subtitle)}</p></div><button class="phase23Close" type="button">×</button></header><section class="phase23Rules">${pack.teamRules.map(r=>`<small>${esc(r)}</small>`).join("")}</section><section class="phase23Round"><div><span>${esc(round.kind.replaceAll("_"," ").toUpperCase())}</span><h4>${esc(round.title)}</h4><p>${esc(round.prompt)}</p></div><div class="phase23Options">${opts}</div></section><section class="phase23Teams"><div class="phase23TeamHead"><span>TEAM ANSWERS</span><button type="button" class="phase23Add" ${teams.length>=6?"disabled":""}>+ Add team</button></div><div class="phase23TeamGrid">${teamCards}</div></section>${revealed?`<section class="phase23Reveal"><span>REVEAL & DISCUSS</span><strong>${esc(round.reveal)}</strong><p>${esc(round.discussion)}</p></section>`:""}<footer><div><strong>${complete?"Session complete":"Facilitator controls reveal"}</strong><p>No individual staff ranking is stored. Team scores are temporary to this course quiz session.</p></div><div><button class="phase23RevealButton" type="button" ${revealed?"disabled":""}>Reveal answer</button><button class="phase23Next" type="button" ${!revealed?"disabled":""}>${roundIndex===pack.rounds.length-1?"Finish quiz":"Next round"}</button><button class="phase23Reset" type="button">Reset</button></div></footer>`;
  drawer.classList.toggle("open",open);
  drawer.querySelector(".phase23Close")?.addEventListener("click",()=>drawer?.classList.remove("open"));
  drawer.querySelector(".phase23Add")?.addEventListener("click",()=>{if(teams.length>=6)return;write(course.id,{teams:[...teams,{id:`t${Date.now()}`,name:`Team ${String.fromCharCode(65+teams.length)}`,score:0}],roundIndex,revealed:false});render(modal,true);});
  drawer.querySelectorAll<HTMLInputElement>("[data-phase23-name]").forEach(input=>input.addEventListener("change",()=>{write(course.id,{teams:teams.map(t=>t.id===input.dataset.phase23Name?{...t,name:clean(input.value)||t.name}:t)});}));
  drawer.querySelectorAll<HTMLSelectElement>("[data-phase23-answer]").forEach(sel=>sel.addEventListener("change",()=>{write(course.id,{teams:teams.map(t=>t.id===sel.dataset.phase23Answer?{...t,answer:sel.value}:t)});render(modal,true);}));
  drawer.querySelector(".phase23RevealButton")?.addEventListener("click",()=>{const correct=round.options.find(o=>o.correct)?.id;write(course.id,{revealed:true,teams:teams.map(t=>({...t,score:t.score+(t.answer&&t.answer===correct?10:0)}))});render(modal,true);});
  drawer.querySelector(".phase23Next")?.addEventListener("click",()=>{if(!revealed)return;if(roundIndex===pack.rounds.length-1){write(course.id,{complete:true});render(modal,true);return;}write(course.id,{roundIndex:roundIndex+1,revealed:false,teams:teams.map(t=>({...t,answer:""}))});render(modal,true);});
  drawer.querySelector(".phase23Reset")?.addEventListener("click",()=>{reset(course.id);render(modal,true);});
}

export default function CourseLiveTeamQuizPhase23Controller(){useEffect(()=>{let q=false;const apply=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(m=>render(m));});};apply();const o=new MutationObserver(apply);o.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>o.disconnect();},[]);return null;}
