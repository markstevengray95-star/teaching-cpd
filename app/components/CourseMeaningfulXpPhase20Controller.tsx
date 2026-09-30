"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { PHASE20_ACHIEVEMENTS, phase20NextTierForXp, phase20TierForXp, type Phase20Achievement } from "../../lib/courseMeaningfulXpPhase20";

function clean(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char)); }
function currentCourse(modal: HTMLElement) { const title = clean(modal.querySelector(".courseModalHead h2")?.textContent); return courses.find(course => course.title === title) || null; }
function json(key: string) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }
function hasCompletedPrefix(prefix: string) { for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (!key?.startsWith(prefix)) continue; try { if (JSON.parse(localStorage.getItem(key) || "{}").complete === true) return true; } catch {} } return false; }
function hasPassedAssessment(courseTitle: string) { for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (!key?.startsWith(`cpd-phase5:${courseTitle}|`) || key.includes("Diagnostic pre-check")) continue; try { if (JSON.parse(localStorage.getItem(key) || "{}").passed === true) return true; } catch {} } return false; }

type Progress = { unlocked: Phase20Achievement[]; xp: number; coreCount: number; writtenDepth: boolean };
function progressFor(courseId: string, courseTitle: string): Progress {
  const p16 = json(`cpd-phase16:${courseId}`); const p17 = json(`cpd-phase17:${courseId}`); const p18 = json(`cpd-phase18:${courseId}`); const p19 = json(`cpd-phase19:${courseId}`);
  const state = {
    assessment: hasPassedAssessment(courseTitle),
    inspection: hasCompletedPrefix(`cpd-phase15:${courseId}:`),
    adventure: p16.complete === true,
    investigation: p17.complete === true,
    improvement: p18.complete === true,
    ai_critique: p19.complete === true,
  };
  const coreCount = Object.values(state).filter(Boolean).length;
  const writtenDepth = clean(p16.transferAction).length >= 40 && clean(p17.nextAction).length >= 50 && clean(p18.reflection).length >= 40 && clean(p19.rewrite).length >= 120;
  const unlocked = PHASE20_ACHIEVEMENTS.filter(item => {
    if (item.evidenceKey === "deep_reflection") return writtenDepth;
    if (item.evidenceKey === "mastery_chain") return coreCount === 6;
    return Boolean(state[item.evidenceKey as keyof typeof state]);
  });
  return { unlocked, xp: unlocked.reduce((sum, item) => sum + item.xp, 0), coreCount, writtenDepth };
}
function overallXp() { return courses.reduce((sum, course) => sum + progressFor(course.id, course.title).xp, 0); }

function render(modal: HTMLElement, force = false) {
  const course = currentCourse(modal); if (!course) return;
  const head = modal.querySelector<HTMLElement>(".courseModalHead"); if (!head) return;
  const progress = progressFor(course.id, course.title); const totalXp = overallXp(); const tier = phase20TierForXp(progress.xp); const next = phase20NextTierForXp(progress.xp);
  const signature = `${course.id}|${progress.xp}|${progress.unlocked.map(item=>item.id).join(",")}|${totalXp}`;
  if (!force && modal.dataset.phase20Signature === signature) return; modal.dataset.phase20Signature = signature;

  let badge = head.querySelector<HTMLButtonElement>(".phase20XpBadge");
  if (!badge) { badge = document.createElement("button"); badge.type = "button"; badge.className = "phase20XpBadge"; badge.addEventListener("click", () => { const drawer = modal.querySelector<HTMLElement>(".phase20XpDrawer"); if (!drawer) return; drawer.classList.toggle("open"); badge?.setAttribute("aria-expanded", String(drawer.classList.contains("open"))); }); head.appendChild(badge); }
  badge.innerHTML = `<span>XP</span><strong>${progress.xp}</strong><small>${escapeHtml(tier.label)}</small>`; badge.setAttribute("aria-label", `${progress.xp} meaningful XP in this course. Open achievements.`);

  let drawer = modal.querySelector<HTMLElement>(".phase20XpDrawer");
  if (!drawer) { drawer = document.createElement("section"); drawer.className = "phase20XpDrawer"; head.insertAdjacentElement("afterend", drawer); }
  const open = drawer.classList.contains("open");
  const unlockedIds = new Set(progress.unlocked.map(item=>item.id));
  const tierProgress = next ? Math.max(0, Math.min(100, Math.round(((progress.xp - tier.minimumXp) / Math.max(1, next.minimumXp - tier.minimumXp)) * 100))) : 100;
  drawer.innerHTML = `<header><div><span>PRESENTATION OVERHAUL · PHASE 20</span><h3>Meaningful XP & Achievements</h3><p>XP is awarded only for demonstrated learning evidence — not clicks, slide opens, time-on-page or streaks.</p></div><button type="button" class="phase20Close" aria-label="Close achievements">×</button></header>
    <div class="phase20Summary"><article><span>THIS COURSE</span><strong>${progress.xp} XP</strong><small>${escapeHtml(tier.label)}</small></article><article><span>CORE EVIDENCE</span><strong>${progress.coreCount}/6</strong><small>assessment + applied professional tasks</small></article><article><span>ALL COURSES</span><strong>${totalXp} XP</strong><small>evidence earned across the catalogue</small></article></div>
    <div class="phase20Tier"><div><strong>${escapeHtml(tier.label)}</strong><span>${next ? `${next.minimumXp - progress.xp} XP to ${escapeHtml(next.label)}` : "Highest course tier secured"}</span></div><div class="phase20TierTrack"><i style="width:${tierProgress}%"></i></div><p>${escapeHtml(tier.description)}</p></div>
    <div class="phase20AchievementGrid">${PHASE20_ACHIEVEMENTS.map(item=>`<article class="phase20Achievement ${unlockedIds.has(item.id) ? "unlocked" : "locked"}"><div class="phase20Icon">${escapeHtml(item.icon)}</div><div><span>${unlockedIds.has(item.id) ? `+${item.xp} XP · SECURED` : `${item.xp} XP · LOCKED`}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><small>${escapeHtml(item.evidence)}</small></div></article>`).join("")}</div>
    <footer><strong>Why this is different</strong><p>Replaying or repeatedly clicking an activity cannot farm XP. Each achievement is derived from the stored evidence that the substantive task was actually completed.</p></footer>`;
  drawer.classList.toggle("open", open);
  drawer.querySelector<HTMLButtonElement>(".phase20Close")?.addEventListener("click",()=>{ drawer?.classList.remove("open"); badge?.setAttribute("aria-expanded","false"); });
}

export default function CourseMeaningfulXpPhase20Controller(){
  useEffect(()=>{
    let queued=false; const apply=()=>{ if(queued)return; queued=true; requestAnimationFrame(()=>{ queued=false; document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal)); }); };
    apply(); const observer=new MutationObserver(apply); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});
    const refresh=()=>document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal,true)); window.addEventListener("storage",refresh); window.addEventListener("cpd:phase5-assessment",refresh as EventListener); window.addEventListener("cpd:meaningful-progress",refresh as EventListener);
    return()=>{ observer.disconnect(); window.removeEventListener("storage",refresh); window.removeEventListener("cpd:phase5-assessment",refresh as EventListener); window.removeEventListener("cpd:meaningful-progress",refresh as EventListener); };
  },[]); return null;
}
