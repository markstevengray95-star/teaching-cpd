"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase22TeamPack } from "../../lib/courseTeamChallengesPhase22";

function clean(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char)); }
function currentCourse(modal: HTMLElement) { const title = clean(modal.querySelector(".courseModalHead h2")?.textContent); return courses.find(course => course.title === title) || null; }

type Stored = { challengeId?: string; responses?: Record<string,string>; checks?: string[]; complete?: boolean; updatedAt?: string };
function key(courseId: string) { return `cpd-phase22:${courseId}`; }
function read(courseId: string): Stored { try { return JSON.parse(localStorage.getItem(key(courseId)) || "{}") as Stored; } catch { return {}; } }
function write(courseId: string, patch: Partial<Stored>) { const next = { ...read(courseId), ...patch, updatedAt: new Date().toISOString() }; try { localStorage.setItem(key(courseId),JSON.stringify(next)); } catch {} window.dispatchEvent(new CustomEvent("cpd:team-challenge",{detail:{courseId}})); return next; }
function reset(courseId: string) { try { localStorage.removeItem(key(courseId)); } catch {} window.dispatchEvent(new CustomEvent("cpd:team-challenge",{detail:{courseId}})); }

function render(modal: HTMLElement, force = false) {
  const course = currentCourse(modal); if (!course) return;
  const head = modal.querySelector<HTMLElement>(".courseModalHead"); if (!head) return;
  const pack = getPhase22TeamPack(course as never); const stored = read(course.id);
  const selectedChallenge = pack.challenges.find(item=>item.id===stored.challengeId) || pack.challenges[0];
  const responses = stored.responses || {}; const checks = new Set(stored.checks || []); const complete = Boolean(stored.complete);
  const signature = `${course.id}|${selectedChallenge.id}|${Object.values(responses).join("|").length}|${checks.size}|${complete?1:0}`;
  if (!force && modal.dataset.phase22Signature === signature) return; modal.dataset.phase22Signature = signature;

  let badge = head.querySelector<HTMLButtonElement>(".phase22TeamBadge");
  if (!badge) { badge=document.createElement("button"); badge.type="button"; badge.className="phase22TeamBadge"; badge.addEventListener("click",()=>{ const drawer=modal.querySelector<HTMLElement>(".phase22TeamDrawer"); if(!drawer)return; drawer.classList.toggle("open"); badge?.setAttribute("aria-expanded",String(drawer.classList.contains("open"))); }); head.appendChild(badge); }
  badge.innerHTML = `<span>TEAM</span><strong>${complete?"✓":"GO"}</strong><small>challenge</small>`;

  let drawer = modal.querySelector<HTMLElement>(".phase22TeamDrawer");
  if (!drawer) { drawer=document.createElement("section"); drawer.className="phase22TeamDrawer"; head.insertAdjacentElement("afterend",drawer); }
  const open = drawer.classList.contains("open");
  const challengeTabs = pack.challenges.map(item=>`<button type="button" data-phase22-challenge="${escapeHtml(item.id)}" class="${item.id===selectedChallenge.id?"current":""}"><span>${escapeHtml(item.kind.replaceAll("_"," ").toUpperCase())}</span><strong>${escapeHtml(item.title)}</strong></button>`).join("");
  const roleMarkup = pack.roles.map(item=>`<article><span>${escapeHtml(item.label)}</span><p>${escapeHtml(item.responsibility)}</p></article>`).join("");
  const promptMarkup = selectedChallenge.prompts.map((prompt,index)=>{ const id=`p${index+1}`; const value=responses[id]||""; return `<label class="phase22Prompt"><span>${index+1}</span><div><strong>${escapeHtml(prompt)}</strong><textarea rows="4" data-phase22-response="${id}" placeholder="Capture the team's agreed thinking…">${escapeHtml(value)}</textarea><small data-phase22-count="${id}">${clean(value).length} / 40 characters</small></div></label>`; }).join("");
  const checkMarkup = selectedChallenge.successChecks.map((item,index)=>`<label class="phase22Check ${checks.has(`c${index}`)?"checked":""}"><input type="checkbox" data-phase22-check="c${index}" ${checks.has(`c${index}`)?"checked":""}/><span>${escapeHtml(item)}</span></label>`).join("");
  const allResponsesReady = selectedChallenge.prompts.every((_,index)=>clean(responses[`p${index+1}`]).length>=40);
  const allChecks = checks.size===selectedChallenge.successChecks.length;

  drawer.innerHTML = `<header><div><span>PRESENTATION OVERHAUL · PHASE 22</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.subtitle)}</p></div><button type="button" class="phase22Close" aria-label="Close team challenge">×</button></header>
    <section class="phase22ChallengeTabs">${challengeTabs}</section>
    <section class="phase22Brief"><span>TEAM BRIEF</span><h4>${escapeHtml(selectedChallenge.title)}</h4><p>${escapeHtml(selectedChallenge.brief)}</p><div><strong>Required output</strong><span>${escapeHtml(selectedChallenge.output)}</span></div><small>${escapeHtml(pack.facilitationRule)}</small></section>
    <section class="phase22Roles"><div><span>SHARED ROLES</span><strong>Allocate these verbally before the group starts</strong></div><div class="phase22RoleGrid">${roleMarkup}</div></section>
    <section class="phase22Workspace"><span>COLLABORATIVE WORKSPACE</span><h4>Build one shared team response</h4>${promptMarkup}</section>
    <section class="phase22Review"><span>TEAM SUCCESS CHECK</span><h4>Review the output together before completing</h4><div>${checkMarkup}</div><div class="phase22ReviewFoot"><small>${allResponsesReady?"4/4 prompts substantial":"Each prompt needs at least 40 characters"} · ${checks.size}/${selectedChallenge.successChecks.length} checks</small><button type="button" class="phase22Complete" ${complete?"disabled":""}>${complete?"Team challenge complete ✓":"Complete team challenge"}</button></div></section>
    <footer><div><strong>${complete?"Collective output saved":"No individual leaderboard"}</strong><p>${complete?"The team can revisit, adapt or copy the shared output later.":"This activity is designed for collaborative professional learning. Success belongs to the shared output, not to a ranked individual."}</p></div><div><button type="button" class="phase22Copy">Copy team brief</button><button type="button" class="phase22Reset">Reset</button></div></footer>`;
  drawer.classList.toggle("open",open);

  drawer.querySelector<HTMLButtonElement>(".phase22Close")?.addEventListener("click",()=>{ drawer?.classList.remove("open"); badge?.setAttribute("aria-expanded","false"); });
  drawer.querySelectorAll<HTMLButtonElement>("[data-phase22-challenge]").forEach(button=>button.addEventListener("click",()=>{ const id=button.dataset.phase22Challenge||pack.challenges[0].id; write(course.id,{challengeId:id,responses:{},checks:[],complete:false}); render(modal,true); }));
  drawer.querySelectorAll<HTMLTextAreaElement>("[data-phase22-response]").forEach(box=>{ const id=box.dataset.phase22Response||""; const count=drawer?.querySelector<HTMLElement>(`[data-phase22-count="${id}"]`); box.addEventListener("input",()=>{ const latest=read(course.id); const next={...(latest.responses||{}),[id]:box.value}; write(course.id,{responses:next,complete:false}); if(count)count.textContent=`${clean(box.value).length} / 40 characters`; const button=drawer?.querySelector<HTMLButtonElement>(".phase22Complete"); if(button){ const responseReady=selectedChallenge.prompts.every((_,index)=>clean(next[`p${index+1}`]).length>=40); button.disabled=!(responseReady&&new Set(read(course.id).checks||[]).size===selectedChallenge.successChecks.length); } }); });
  drawer.querySelectorAll<HTMLInputElement>("[data-phase22-check]").forEach(input=>input.addEventListener("change",()=>{ const latest=new Set(read(course.id).checks||[]); const id=input.dataset.phase22Check||""; if(input.checked)latest.add(id);else latest.delete(id); write(course.id,{checks:[...latest],complete:false}); render(modal,true); }));
  drawer.querySelector<HTMLButtonElement>(".phase22Complete")?.addEventListener("click",()=>{ const latest=read(course.id); const responseReady=selectedChallenge.prompts.every((_,index)=>clean(latest.responses?.[`p${index+1}`]).length>=40); const checksReady=new Set(latest.checks||[]).size===selectedChallenge.successChecks.length; if(!responseReady||!checksReady)return; write(course.id,{complete:true}); render(modal,true); });
  drawer.querySelector<HTMLButtonElement>(".phase22Copy")?.addEventListener("click",async()=>{ const latest=read(course.id); const text=[pack.title,selectedChallenge.title,selectedChallenge.brief,`Required output: ${selectedChallenge.output}`,...selectedChallenge.prompts.map((prompt,index)=>`${index+1}. ${prompt}\n${clean(latest.responses?.[`p${index+1}`])||""}`),"Success checks:",...selectedChallenge.successChecks.map(item=>`- ${item}`)].join("\n\n"); try{ await navigator.clipboard.writeText(text); const button=drawer?.querySelector<HTMLButtonElement>(".phase22Copy"); if(button){button.textContent="Copied ✓";setTimeout(()=>button.textContent="Copy team brief",1200);} }catch{} });
  drawer.querySelector<HTMLButtonElement>(".phase22Reset")?.addEventListener("click",()=>{ reset(course.id); render(modal,true); });
}

export default function CourseTeamChallengesPhase22Controller(){
  useEffect(()=>{ let queued=false; const apply=()=>{ if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal=>render(modal));});}; apply(); const observer=new MutationObserver(apply); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]}); return()=>observer.disconnect(); },[]); return null;
}
