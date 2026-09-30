"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase27Pack } from "../../lib/courseAudioProfessionalScenariosPhase27";

function clean(v:string|null|undefined){return(v||"").replace(/\s+/g," ").trim();}
function esc(v:string){return v.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));}
function courseFor(modal:HTMLElement){const title=clean(modal.querySelector(".courseModalHead h2")?.textContent);return courses.find(c=>c.title===title)||null;}
function moduleIndex(modal:HTMLElement){return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(b=>b.classList.contains("current"));}

type Stored={listened?:boolean;transcriptRead?:boolean;answers?:Record<string,string>;complete?:boolean;updatedAt?:string};
function key(id:string){return`cpd-phase27:${id}`;}
function read(id:string):Stored{try{return JSON.parse(localStorage.getItem(key(id))||"{}")}catch{return{}}}
function write(id:string,patch:Partial<Stored>){const next={...read(id),...patch,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(id),JSON.stringify(next));}catch{}window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:27}}));return next;}
function reset(id:string){try{localStorage.removeItem(key(id));}catch{}window.speechSynthesis?.cancel();window.dispatchEvent(new CustomEvent("cpd:meaningful-progress",{detail:{courseId:id,phase:27}}));}

function render(modal:HTMLElement,force=false){
  if(modal.classList.contains("labMode"))return;
  const course=courseFor(modal);const idx=moduleIndex(modal);const module=course?.modules[idx];const content=modal.querySelector<HTMLElement>(".moduleContent");
  if(!course||!module||!content)return;
  const pack=getPhase27Pack(course as never);
  if(module.id!==pack.anchorId){content.querySelector(".phase27AudioShell")?.remove();delete content.dataset.phase27Signature;return;}
  const stored=read(course.id);const answers=stored.answers||{};const engaged=Boolean(stored.listened||stored.transcriptRead);const complete=Boolean(stored.complete);
  const sig=`${course.id}|${stored.listened?1:0}|${stored.transcriptRead?1:0}|${Object.entries(answers).map(x=>x.join(":"))}|${complete?1:0}`;
  if(!force&&content.dataset.phase27Signature===sig)return;content.dataset.phase27Signature=sig;content.querySelector(".phase27AudioShell")?.remove();

  const transcript=pack.turns.map((turn,i)=>`<div class="phase27Turn" data-phase27-turn="${i}"><b>${esc(turn.speaker)}</b><span>${esc(turn.role)}</span><p>${esc(turn.line)}</p></div>`).join("");
  const analysis=pack.analysis.map((item,index)=>{const selected=answers[item.id]||"";const optionHtml=item.options.map(o=>`<button type="button" data-phase27-question="${esc(item.id)}" data-phase27-answer="${o.id}" class="${selected===o.id?"selected":""} ${selected&&o.best?"best":""}"><b>${o.id}</b><span>${esc(o.label)}</span></button>`).join("");const feedback=selected?(item.options.find(o=>o.id===selected)?.best?`<div class="phase27Feedback success"><strong>Strong analysis</strong><p>${esc(item.feedback)}</p></div>`:`<div class="phase27Feedback"><strong>Reconsider the evidence</strong><p>${esc(item.feedback)}</p></div>`):"";return`<article class="phase27AnalysisCard"><span>ANALYSIS ${index+1}/3</span><h4>${esc(item.prompt)}</h4><div>${optionHtml}</div>${feedback}</article>`;}).join("");
  const canSpeak=typeof window!=="undefined"&&"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
  const shell=document.createElement("section");shell.className=`phase27AudioShell ${complete?"completed":""}`;
  shell.innerHTML=`<header><div><span>PRESENTATION OVERHAUL · PHASE 27</span><h3>${esc(pack.title)}</h3><p>${esc(pack.context)}</p></div><b>${complete?"✓":"AUDIO"}</b></header>
    <section class="phase27Player">
      <div class="phase27AudioBar"><div class="phase27Wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div><strong>${stored.listened?"Conversation listened to":stored.transcriptRead?"Transcript reviewed":"Professional conversation ready"}</strong><span class="phase27Status">${engaged?"Ready for analysis":"Play the audio or use the accessible transcript"}</span></div></div>
      <div class="phase27PlayerControls"><button type="button" class="phase27Play" ${canSpeak?"":"disabled"}>${stored.listened?"▶ Replay conversation":"▶ Play conversation"}</button><button type="button" class="phase27Stop" ${canSpeak?"":"disabled"}>■ Stop</button></div>
      ${canSpeak?"":`<p class="phase27AudioFallback">Browser speech playback is unavailable here. The full transcript below provides the same scenario.</p>`}
      <details class="phase27Transcript" ${stored.transcriptRead?"open":""}><summary>Accessible transcript</summary><div>${transcript}</div><button type="button" class="phase27TranscriptRead">${stored.transcriptRead?"✓ Transcript reviewed":"Mark transcript as reviewed"}</button></details>
    </section>
    <section class="phase27Analysis"><div class="phase27AnalysisHead"><span>LISTEN · NOTICE · ANALYSE</span><h4>What does the professional reasoning reveal?</h4><p>Use the conversation evidence rather than choosing the answer that merely sounds most confident.</p></div>${analysis}</section>
    <footer><div><strong>${engaged?"1/1 conversation engaged":"0/1 conversation engaged"} · ${Object.keys(answers).length}/3 analyses complete</strong><p>${complete?"Audio professional scenario complete — replay it to notice how the reasoning develops.":"Listen to the conversation or review the transcript, then complete all three analysis questions."}</p></div><button type="button" class="phase27Reset">Reset</button></footer>`;
  const target=content.querySelector(".moduleActions");content.insertBefore(shell,target||null);

  const finishIfReady=(nextAnswers:Record<string,string>,extra:Partial<Stored>={})=>{const latest={...read(course.id),...extra};const nextEngaged=Boolean(latest.listened||latest.transcriptRead);const allAnswered=pack.analysis.every(item=>Boolean(nextAnswers[item.id]));write(course.id,{...extra,answers:nextAnswers,complete:nextEngaged&&allAnswered});};

  shell.querySelector<HTMLButtonElement>(".phase27Play")?.addEventListener("click",()=>{
    if(!canSpeak)return;window.speechSynthesis.cancel();shell.classList.add("playing");
    const rows=Array.from(shell.querySelectorAll<HTMLElement>(".phase27Turn"));const status=shell.querySelector<HTMLElement>(".phase27Status");const play=shell.querySelector<HTMLButtonElement>(".phase27Play");if(play){play.disabled=true;play.textContent="Playing…";}
    const voices=window.speechSynthesis.getVoices();
    const speak=(i:number)=>{rows.forEach((row,n)=>row.classList.toggle("active",n===i));if(i>=pack.turns.length){rows.forEach(row=>row.classList.remove("active"));const latest=read(course.id);const allAnswered=pack.analysis.every(item=>Boolean(latest.answers?.[item.id]));write(course.id,{listened:true,complete:allAnswered});render(modal,true);return;}const turn=pack.turns[i];if(status)status.textContent=`${turn.speaker} · ${i+1}/${pack.turns.length}`;const utter=new SpeechSynthesisUtterance(turn.line);utter.rate=0.98;utter.pitch=i%2===0?1:0.9;if(voices.length)utter.voice=voices[i%voices.length];utter.onend=()=>speak(i+1);utter.onerror=()=>{if(status)status.textContent="Audio playback stopped — use the transcript to continue";if(play){play.disabled=false;play.textContent="▶ Replay conversation";}shell.classList.remove("playing");};window.speechSynthesis.speak(utter);};
    speak(0);
  });
  shell.querySelector<HTMLButtonElement>(".phase27Stop")?.addEventListener("click",()=>{window.speechSynthesis?.cancel();shell.classList.remove("playing");shell.querySelectorAll(".phase27Turn.active").forEach(row=>row.classList.remove("active"));const status=shell.querySelector<HTMLElement>(".phase27Status");if(status)status.textContent="Playback stopped — replay or continue with the transcript";const play=shell.querySelector<HTMLButtonElement>(".phase27Play");if(play){play.disabled=false;play.textContent="▶ Play conversation";}});
  shell.querySelector<HTMLButtonElement>(".phase27TranscriptRead")?.addEventListener("click",()=>{const latest=read(course.id);const allAnswered=pack.analysis.every(item=>Boolean(latest.answers?.[item.id]));write(course.id,{transcriptRead:true,complete:allAnswered});render(modal,true);});
  shell.querySelectorAll<HTMLButtonElement>("[data-phase27-question]").forEach(button=>button.addEventListener("click",()=>{const latest=read(course.id);const nextAnswers={...(latest.answers||{}),[button.dataset.phase27Question||""]:button.dataset.phase27Answer||""};finishIfReady(nextAnswers);render(modal,true);}));
  shell.querySelector(".phase27Reset")?.addEventListener("click",()=>{reset(course.id);render(modal,true);});
}

export default function CourseAudioProfessionalScenariosPhase27Controller(){useEffect(()=>{let queued=false;const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal").forEach(m=>render(m));});};apply();const observer=new MutationObserver(apply);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});return()=>{observer.disconnect();window.speechSynthesis?.cancel();};},[]);return null;}
