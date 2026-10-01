"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { schedulePhase6CourseReviews } from "@/lib/courseFollowThroughClient";
import { getPhase30Pack, type Phase30FieldId } from "../../lib/courseImplementationChallengePhase30";

function clean(value:string|null|undefined){return(value||"").replace(/\s+/g," ").trim();}
function esc(value:string){return value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function currentCourse(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(course=>course.title===title)||null;}
function currentModuleIndex(modal:HTMLElement){return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button=>button.classList.contains("current"));}
type Answers=Partial<Record<Phase30FieldId,string>>;
type Stored={answers?:Answers;complete?:boolean;scheduled?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase30:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:30}}));return next;}

async function syncCloud(courseId:string,courseTitle:string,answers:Answers){
  try{
    const client=getSupabaseBrowserClient();const {data:auth}=await client.auth.getUser();if(!auth.user)return{signedIn:false,scheduled:false,message:"Saved on this device. Sign in to add the 7/30/90-day follow-up to your CPD record."};
    const {data:progress}=await client.from("course_progress").select("reflections,completed_at").eq("user_id",auth.user.id).eq("course_id",courseId).maybeSingle();
    const previous=((progress?.reflections||{}) as Record<string,string>);
    const commitment=[`Problem: ${answers.problem||""}`,`Action: ${answers.action||""}`,`Context: ${answers.context||""}`,`Barrier: ${answers.barrier||""}`,`Evidence: ${answers.evidence||""}`,`Review: ${answers.review||""}`].join("\n");
    const reflections={...previous,phase30_implementation_commitment:commitment,phase30_problem:answers.problem||"",phase30_action:answers.action||"",phase30_context:answers.context||"",phase30_barrier:answers.barrier||"",phase30_evidence:answers.evidence||"",phase30_review:answers.review||""};
    await client.from("course_progress").update({reflections}).eq("user_id",auth.user.id).eq("course_id",courseId);
    const result=await schedulePhase6CourseReviews(client,auth.user.id,{id:courseId,title:courseTitle},progress?.completed_at||new Date().toISOString());
    return{signedIn:true,scheduled:!result.error,message:result.error?"Plan saved, but the follow-up schedule could not be updated yet.":result.created?`${result.created} follow-up checkpoint${result.created===1?"":"s"} scheduled for 7, 30 and 90-day review.`:"Your 7, 30 and 90-day follow-up checkpoints are already scheduled."};
  }catch{return{signedIn:false,scheduled:false,message:"Your implementation plan is saved on this device. The cloud follow-up can be opened from the Impact hub."};}
}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;const course=currentCourse(modal);const index=currentModuleIndex(modal);const module=course?.modules[index];const content=modal.querySelector<HTMLElement>(".moduleContent");if(!course||!module||!content)return;
  const pack=getPhase30Pack(course as never);if(module.id!==pack.anchorId){content.querySelector(".phase30ChallengeShell")?.remove();delete content.dataset.phase30Signature;return;}
  const stored=read(course.id);const answers=stored.answers||{};const completion=pack.fields.filter(field=>(answers[field.id]||"").trim().length>=field.minimumCharacters).length;const signature=`${course.id}|${completion}|${stored.complete?1:0}|${stored.scheduled?1:0}`;if(!force&&content.dataset.phase30Signature===signature)return;content.dataset.phase30Signature=signature;content.querySelector(".phase30ChallengeShell")?.remove();
  const shell=document.createElement("section");shell.className=`phase30ChallengeShell ${stored.complete?"completed":""}`;shell.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 30</span><h3>${esc(pack.title)}</h3><p>${esc(pack.subtitle)}</p></div><b>${stored.complete?"✓":`${completion}/6`}</b></header><div class="phase30Flow">${pack.fields.map((field,i)=>`<span class="${(answers[field.id]||"").trim().length>=field.minimumCharacters?"done":""}"><b>${i+1}</b>${esc(field.label)}</span>`).join("")}</div><div class="phase30Fields">${pack.fields.map(field=>`<label><span>${esc(field.label)}</span><strong>${esc(field.prompt)}</strong><textarea data-phase30-field="${field.id}" rows="4" placeholder="${esc(field.hint)}">${esc(answers[field.id]||"")}</textarea><small>${Math.min((answers[field.id]||"").trim().length,field.minimumCharacters)}/${field.minimumCharacters} minimum characters</small></label>`).join("")}</div><section class="phase30Follow"><div><span>FOLLOW-THROUGH</span><h4>7 · 30 · 90-day review cycle</h4><p>Your completed challenge feeds the existing follow-through system so you can review transfer, impact and whether the change should be kept, adapted or stopped.</p></div><div>${pack.reviewWindows.map(day=>`<b>${day}<small>days</small></b>`).join("")}</div></section><footer><div class="phase30Status" aria-live="polite">${stored.complete?(stored.scheduled?"Implementation challenge complete and follow-up connected.":"Implementation challenge complete."):"Complete all six fields to lock the implementation challenge."}</div><div><button type="button" class="phase30Submit" ${completion===6?"":"disabled"}>${stored.complete?"Update implementation challenge":"Complete challenge & schedule follow-up"}</button><button type="button" class="phase30Impact">Open follow-through hub</button></div></footer>`;
  const target=content.querySelector(".moduleActions");content.insertBefore(shell,target||null);
  shell.querySelectorAll<HTMLTextAreaElement>("[data-phase30-field]").forEach(area=>area.addEventListener("input",()=>{const latest=read(course.id);const nextAnswers={...(latest.answers||{}),[area.dataset.phase30Field as Phase30FieldId]:area.value};write(course.id,{answers:nextAnswers});const small=area.parentElement?.querySelector("small");const field=pack.fields.find(f=>f.id===area.dataset.phase30Field);if(small&&field)small.textContent=`${Math.min(area.value.trim().length,field.minimumCharacters)}/${field.minimumCharacters} minimum characters`;const button=shell.querySelector<HTMLButtonElement>(".phase30Submit");if(button)button.disabled=!pack.fields.every(f=>(nextAnswers[f.id]||"").trim().length>=f.minimumCharacters);}));
  shell.querySelector<HTMLButtonElement>(".phase30Submit")?.addEventListener("click",async()=>{const latest=read(course.id);const nextAnswers=latest.answers||{};if(!pack.fields.every(f=>(nextAnswers[f.id]||"").trim().length>=f.minimumCharacters))return;const status=shell.querySelector<HTMLElement>(".phase30Status");const submit=shell.querySelector<HTMLButtonElement>(".phase30Submit");if(status)status.textContent="Saving implementation challenge and checking follow-up schedule…";if(submit)submit.disabled=true;write(course.id,{answers:nextAnswers,complete:true});const result=await syncCloud(course.id,course.title,nextAnswers);write(course.id,{answers:nextAnswers,complete:true,scheduled:result.scheduled});if(status)status.textContent=result.message;render(modal,true);});
  shell.querySelector<HTMLButtonElement>(".phase30Impact")?.addEventListener("click",()=>{window.location.href=`/impact?course=${encodeURIComponent(course.id)}`;});
}

export default function CourseImplementationChallengePhase30Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(m=>render(m));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();},[]);return null;}
