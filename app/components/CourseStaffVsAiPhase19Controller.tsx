"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase19ChallengePack } from "../../lib/courseStaffVsAiPhase19";

function clean(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char)); }
function currentCourse(modal: HTMLElement) { const title = clean(modal.querySelector(".courseModalHead h2")?.textContent); return courses.find(course => course.title === title) || null; }
function currentModuleIndex(modal: HTMLElement) { return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button => button.classList.contains("current")); }
function changeScore(a: string, b: string) { const x = clean(a), y = clean(b); const limit = Math.min(x.length, y.length); let changed = Math.abs(x.length - y.length); for (let i = 0; i < limit; i += 1) if (x[i] !== y[i]) changed += 1; return changed; }

type Stored = { staffAnswer?: string; aiRevealed?: boolean; selected?: string[]; critiquePassed?: boolean; rewrite?: string; complete?: boolean; attempts?: number };
function key(courseId: string) { return `cpd-phase19:${courseId}`; }
function read(courseId: string): Stored { try { return JSON.parse(localStorage.getItem(key(courseId)) || "{}") as Stored; } catch { return {}; } }
function write(courseId: string, patch: Partial<Stored>) { const next = { ...read(courseId), ...patch }; try { localStorage.setItem(key(courseId), JSON.stringify(next)); } catch {} window.dispatchEvent(new CustomEvent("cpd:meaningful-progress", { detail: { courseId, phase: 19 } })); return next; }
function reset(courseId: string) { try { localStorage.removeItem(key(courseId)); } catch {} window.dispatchEvent(new CustomEvent("cpd:meaningful-progress", { detail: { courseId, phase: 19 } })); }

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase19-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase19PreviousDisabled === "true";
  button.removeAttribute("data-phase19-gated"); button.removeAttribute("data-phase19-previous-disabled"); button.removeAttribute("title");
}
function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary"); if (!button) return;
  if (!button.dataset.phase19Gated) { button.dataset.phase19PreviousDisabled = String(button.disabled); button.dataset.phase19Gated = "true"; }
  button.disabled = complete ? button.dataset.phase19PreviousDisabled === "true" : true;
  button.title = complete ? "Staff vs AI challenge complete — continue." : "Answer first, critique the AI response and improve your final answer before continuing.";
}

function render(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal); const index = currentModuleIndex(modal); const module = course?.modules[index]; const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;
  const pack = getPhase19ChallengePack(course as never);
  if (module.id !== pack.anchorId) { restoreGate(modal); content.classList.remove("phase19AiSlide"); content.querySelector(".phase19AiShell")?.remove(); delete content.dataset.phase19Signature; return; }

  const stored = read(course.id); const selected = new Set(stored.selected || []); const complete = Boolean(stored.complete); const staffAnswer = stored.staffAnswer || ""; const rewrite = stored.rewrite || "";
  const signature = `${course.id}|${staffAnswer.length}|${stored.aiRevealed ? 1 : 0}|${[...selected].sort().join(",")}|${stored.critiquePassed ? 1 : 0}|${rewrite.length}|${complete ? 1 : 0}`;
  gateNext(modal, complete); if (!force && content.dataset.phase19Signature === signature) return; content.dataset.phase19Signature = signature;
  content.classList.add("phase19AiSlide"); content.querySelector(".phase19AiShell")?.remove();
  const moduleType = content.querySelector<HTMLElement>(".moduleType"); const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "STAFF VS AI"; if (navType) navType.textContent = complete ? "AI challenge · complete" : stored.critiquePassed ? "AI challenge · improve" : stored.aiRevealed ? "AI challenge · critique" : "AI challenge · answer first";

  const issueMarkup = pack.issues.map((item, idx) => `<button type="button" class="phase19Issue ${selected.has(item.id) ? "selected" : ""}" data-phase19-issue="${escapeHtml(item.id)}"><span>${idx + 1}</span><strong>${escapeHtml(item.label)}</strong></button>`).join("");
  const feedbackMarkup = stored.critiquePassed ? `<section class="phase19Expert"><span>EXPERT AUDIT</span><h4>Why the AI answer falls short</h4><div>${pack.issues.filter(i=>i.correct).map(item=>`<article><b>${escapeHtml(item.kind.toUpperCase())}</b><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.explanation)}</p></article>`).join("")}</div></section>` : "";
  const rewriteMarkup = stored.critiquePassed ? `<section class="phase19Rewrite"><span>ROUND 3 · BEAT THE AI</span><h4>${escapeHtml(pack.rewritePrompt)}</h4><div class="phase19Principles">${pack.expertPrinciples.map(item=>`<small>${escapeHtml(item)}</small>`).join("")}</div><textarea rows="7" class="phase19RewriteInput" placeholder="Write the stronger professional response…">${escapeHtml(rewrite)}</textarea><div class="phase19RewriteFoot"><small class="phase19RewriteCount">${clean(rewrite).length} / 120 characters · ${changeScore(staffAnswer,rewrite)} changes from your first answer</small><button type="button" class="phase19Complete" ${complete ? "disabled" : ""}>${complete ? "Challenge complete ✓" : "Complete challenge"}</button></div></section>` : "";

  const shell = document.createElement("section"); shell.className = `phase19AiShell ${complete ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase19Head"><div><span>PRESENTATION OVERHAUL · PHASE 19</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.brief)}</p></div><b>${complete ? "✓" : stored.critiquePassed ? "3" : stored.aiRevealed ? "2" : "1"}</b></header>
    <section class="phase19Staff"><span>ROUND 1 · STAFF FIRST</span><h4>${escapeHtml(pack.staffPrompt)}</h4><textarea rows="6" class="phase19StaffInput" placeholder="Commit to your own professional answer before seeing the AI…" ${stored.aiRevealed ? "disabled" : ""}>${escapeHtml(staffAnswer)}</textarea><div><small class="phase19StaffCount">${clean(staffAnswer).length} / 80 characters</small><button type="button" class="phase19Reveal" ${stored.aiRevealed ? "disabled" : ""}>${stored.aiRevealed ? "AI revealed ✓" : "Lock answer & reveal AI"}</button></div></section>
    ${stored.aiRevealed ? `<section class="phase19AiResponse"><div class="phase19AiBadge"><span>AI</span><strong>Plausible response — not necessarily good professional judgement</strong></div><p>${escapeHtml(pack.aiResponse)}</p></section><section class="phase19Critique"><span>ROUND 2 · AUDIT THE AI</span><h4>Select exactly three genuine weaknesses.</h4><p>Look for one unsupported assumption, one important omission and one professional-judgement problem.</p><div class="phase19Issues">${issueMarkup}</div><div class="phase19CritiqueFoot"><small class="phase19SelectedCount">${selected.size}/3 selected</small><button type="button" class="phase19Check">Check critique</button></div><div class="phase19CritiqueFeedback"></div></section>${feedbackMarkup}${rewriteMarkup}` : `<section class="phase19Locked"><span>AI RESPONSE LOCKED</span><strong>Your answer comes first.</strong><p>This prevents hindsight from making the comparison meaningless.</p></section>`}
    <footer class="phase19Foot"><span>${complete ? "Completed: your final response was produced after an independent answer and explicit AI critique." : "The goal is not to disagree with AI automatically; it is to keep professional judgement evidence-led and accountable."}</span><button type="button" class="phase19Reset">Restart challenge</button></footer>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  const staffBox = shell.querySelector<HTMLTextAreaElement>(".phase19StaffInput"); const staffCount = shell.querySelector<HTMLElement>(".phase19StaffCount"); const reveal = shell.querySelector<HTMLButtonElement>(".phase19Reveal");
  const refreshStaff = () => { const length = clean(staffBox?.value).length; if (staffCount) staffCount.textContent = `${length} / 80 characters`; if (reveal && !stored.aiRevealed) reveal.disabled = length < 80; };
  staffBox?.addEventListener("input",()=>{ write(course.id,{staffAnswer:staffBox.value}); refreshStaff(); }); reveal?.addEventListener("click",()=>{ if(!staffBox||clean(staffBox.value).length<80)return; write(course.id,{staffAnswer:clean(staffBox.value),aiRevealed:true}); render(modal,true); }); refreshStaff();

  shell.querySelectorAll<HTMLButtonElement>("[data-phase19-issue]").forEach(button=>button.addEventListener("click",()=>{ const id=button.dataset.phase19Issue||""; const current=new Set(read(course.id).selected||[]); if(current.has(id))current.delete(id); else if(current.size<3)current.add(id); write(course.id,{selected:[...current]}); render(modal,true); }));
  shell.querySelector<HTMLButtonElement>(".phase19Check")?.addEventListener("click",()=>{ const latest=read(course.id); const picks=new Set(latest.selected||[]); const correct=new Set(pack.issues.filter(i=>i.correct).map(i=>i.id)); const passed=picks.size===3&&[...picks].every(id=>correct.has(id)); const box=shell.querySelector<HTMLElement>(".phase19CritiqueFeedback"); if(!passed){ write(course.id,{critiquePassed:false,attempts:(latest.attempts||0)+1}); if(box) box.innerHTML=`<strong>Not yet</strong><p>At least one selected item is not a substantive weakness. Recheck the assumption, omission and professional-judgement boundary.</p>`; return; } write(course.id,{critiquePassed:true,attempts:(latest.attempts||0)+1}); render(modal,true); });

  const rewriteBox=shell.querySelector<HTMLTextAreaElement>(".phase19RewriteInput"); const rewriteCount=shell.querySelector<HTMLElement>(".phase19RewriteCount"); const completeButton=shell.querySelector<HTMLButtonElement>(".phase19Complete");
  const refreshRewrite=()=>{ const length=clean(rewriteBox?.value).length; const changes=changeScore(staffAnswer,rewriteBox?.value||""); if(rewriteCount)rewriteCount.textContent=`${length} / 120 characters · ${changes} changes from your first answer`; if(completeButton&&!complete)completeButton.disabled=length<120||changes<35; };
  rewriteBox?.addEventListener("input",()=>{ write(course.id,{rewrite:rewriteBox.value}); refreshRewrite(); }); completeButton?.addEventListener("click",()=>{ if(!rewriteBox)return; const length=clean(rewriteBox.value).length; const changes=changeScore(staffAnswer,rewriteBox.value); if(length<120||changes<35)return; write(course.id,{rewrite:clean(rewriteBox.value),complete:true}); render(modal,true); }); refreshRewrite();
  shell.querySelector<HTMLButtonElement>(".phase19Reset")?.addEventListener("click",()=>{ reset(course.id); render(modal,true); });
}

export default function CourseStaffVsAiPhase19Controller(){
  useEffect(()=>{ let queued=false; const apply=()=>{ if(queued)return; queued=true; requestAnimationFrame(()=>{ queued=false; document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal)); }); }; apply(); const observer=new MutationObserver(apply); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]}); return()=>observer.disconnect(); },[]); return null;
}
