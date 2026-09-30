"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { PHASE21_HALF_TERM_DAYS, PHASE21_MILESTONES, PHASE21_TERM_DAYS, type Phase21Milestone } from "../../lib/courseProfessionalMilestonesPhase21";

function clean(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char)); }
function currentCourse(modal: HTMLElement) { const title = clean(modal.querySelector(".courseModalHead h2")?.textContent); return courses.find(course => course.title === title) || null; }
function parse(key: string) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }

type EvidenceEvent = { id: string; courseId: string; courseTitle: string; evidenceType: string; label: string; deep: boolean; firstSeen: string };
type EvidenceCandidate = Omit<EvidenceEvent, "firstSeen"> & { occurredAt?: string };
const LEDGER_KEY = "cpd-phase21:evidence-ledger";

function existingLedger(): EvidenceEvent[] { try { const value = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function completedKeys(prefix: string) {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (key?.startsWith(prefix)) keys.push(key); }
  return keys;
}

function scanCandidates(): EvidenceCandidate[] {
  const items: EvidenceCandidate[] = [];
  for (const course of courses) {
    for (const storageKey of completedKeys(`cpd-phase5:${course.title}|`)) {
      if (storageKey.includes("Diagnostic pre-check")) continue;
      const record = parse(storageKey);
      if (record.passed === true) items.push({ id: `assessment:${storageKey}`, courseId: course.id, courseTitle: course.title, evidenceType: "assessment", label: "Passed professional assessment", deep: false, occurredAt: record.updatedAt });
    }
    for (const storageKey of completedKeys(`cpd-phase15:${course.id}:`)) {
      const record = parse(storageKey);
      if (record.complete === true) items.push({ id: `inspection:${storageKey}`, courseId: course.id, courseTitle: course.title, evidenceType: "inspection", label: "Completed evidence inspection", deep: false, occurredAt: record.updatedAt });
    }
    const direct: Array<[number,string,string,boolean]> = [
      [16, "adventure", "Completed consequence adventure", true],
      [17, "investigation", "Completed mystery investigation", true],
      [18, "improvement", "Completed before/after improvement", true],
      [19, "ai_critique", "Completed Staff vs AI critique", true],
      [22, "team_challenge", "Completed collaborative team challenge", true],
      [23, "team_quiz", "Completed live team quiz", false],
      [24, "expert_challenge", "Completed unlockable expert challenge set", true],
      [25, "interactive_model", "Completed interactive professional model", true],
      [26, "video_decision", "Completed video decision-point scenario", true],
      [27, "audio_scenario", "Completed audio professional scenario", true],
      [28, "personalised_route", "Selected personalised professional learning route", false],
      [29, "professional_toolkit", "Saved a reusable professional toolkit resource", false],
      [30, "implementation_challenge", "Completed final implementation challenge", true],
      [31, "certification_exam", "Passed final certification exam", true],
    ];
    direct.forEach(([phase, type, label, deep]) => {
      const record = parse(`cpd-phase${phase}:${course.id}`);
      if (record.complete === true) items.push({ id: `phase${phase}:${course.id}`, courseId: course.id, courseTitle: course.title, evidenceType: type, label, deep, occurredAt: record.updatedAt });
    });
  }
  return items;
}

function syncLedger() {
  const prior = existingLedger();
  const byId = new Map(prior.map(item => [item.id, item]));
  const now = new Date().toISOString();
  scanCandidates().forEach(candidate => {
    if (byId.has(candidate.id)) return;
    byId.set(candidate.id, { ...candidate, firstSeen: candidate.occurredAt || now });
  });
  const next = [...byId.values()].sort((a,b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function inWindow(events: EvidenceEvent[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  return events.filter(item => { const time = new Date(item.firstSeen).getTime(); return Number.isFinite(time) && time >= cutoff; });
}
function milestoneValue(milestone: Phase21Milestone, events: EvidenceEvent[]) {
  const days = milestone.window === "half_term" ? PHASE21_HALF_TERM_DAYS : PHASE21_TERM_DAYS;
  const scoped = inWindow(events, days);
  if (milestone.unit === "activities") return scoped.length;
  if (milestone.unit === "courses") return new Set(scoped.map(item => item.courseId)).size;
  if (milestone.unit === "evidence_types") return new Set(scoped.map(item => item.evidenceType)).size;
  return scoped.filter(item => item.deep).length;
}
function dateLabel(value: string) { try { return new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"short" }).format(new Date(value)); } catch { return "recently"; } }

function render(modal: HTMLElement, force = false) {
  const course = currentCourse(modal); if (!course) return;
  const head = modal.querySelector<HTMLElement>(".courseModalHead"); if (!head) return;
  const ledger = syncLedger();
  const values = PHASE21_MILESTONES.map(item => ({ item, value: milestoneValue(item, ledger) }));
  const secured = values.filter(({item,value}) => value >= item.threshold).length;
  const signature = `${course.id}|${ledger.length}|${values.map(x=>x.value).join(",")}`;
  if (!force && modal.dataset.phase21Signature === signature) return; modal.dataset.phase21Signature = signature;

  let badge = head.querySelector<HTMLButtonElement>(".phase21MilestoneBadge");
  if (!badge) {
    badge = document.createElement("button"); badge.type = "button"; badge.className = "phase21MilestoneBadge";
    badge.addEventListener("click",()=>{ const drawer = modal.querySelector<HTMLElement>(".phase21MilestoneDrawer"); if (!drawer) return; drawer.classList.toggle("open"); badge?.setAttribute("aria-expanded",String(drawer.classList.contains("open"))); });
    head.appendChild(badge);
  }
  badge.innerHTML = `<span>M</span><strong>${secured}/${PHASE21_MILESTONES.length}</strong><small>milestones</small>`;

  let drawer = modal.querySelector<HTMLElement>(".phase21MilestoneDrawer");
  if (!drawer) { drawer = document.createElement("section"); drawer.className = "phase21MilestoneDrawer"; head.insertAdjacentElement("afterend", drawer); }
  const open = drawer.classList.contains("open");
  const milestoneMarkup = values.map(({item,value}) => {
    const progress = Math.min(100, Math.round((value / item.threshold) * 100)); const done = value >= item.threshold;
    const unit = item.unit.replaceAll("_"," ");
    return `<article class="phase21Milestone ${done ? "secured" : "progressing"}"><div class="phase21MilestoneTop"><div><span>${item.window === "half_term" ? "HALF-TERM" : "TERM"}</span><strong>${escapeHtml(item.title)}</strong></div><b>${done ? "✓" : `${Math.min(value,item.threshold)}/${item.threshold}`}</b></div><p>${escapeHtml(item.description)}</p><div class="phase21Track"><i style="width:${progress}%"></i></div><small>${value} ${escapeHtml(unit)} evidenced · ${escapeHtml(item.whyItMatters)}</small></article>`;
  }).join("");
  const recent = ledger.slice(0,8).map(item => `<div class="phase21LedgerItem"><span>${escapeHtml(dateLabel(item.firstSeen))}</span><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.courseTitle)}</small></div><b>${item.deep ? "DEEP" : "EVIDENCE"}</b></div>`).join("") || `<div class="phase21Empty">Substantial development evidence will appear here as staff complete assessments and applied CPD activities.</div>`;
  drawer.innerHTML = `<header><div><span>PRESENTATION OVERHAUL · PHASE 21</span><h3>Professional-learning milestones</h3><p>Positive half-term and term milestones based on substantial development evidence. No daily streaks, attendance pressure or individual ranking.</p></div><button type="button" class="phase21Close" aria-label="Close milestones">×</button></header><div class="phase21MilestoneGrid">${milestoneMarkup}</div><section class="phase21Ledger"><div><span>EVIDENCE LEDGER</span><strong>${ledger.length} substantial activit${ledger.length===1?"y":"ies"} recorded</strong></div>${recent}</section><footer><strong>Designed for sustainable CPD</strong><p>Half-term uses a rolling six-week evidence window; term milestones use a wider 120-day window. Missing a day or a week never resets progress.</p></footer>`;
  drawer.classList.toggle("open",open);
  drawer.querySelector<HTMLButtonElement>(".phase21Close")?.addEventListener("click",()=>{ drawer?.classList.remove("open"); badge?.setAttribute("aria-expanded","false"); });
}

export default function CourseProfessionalMilestonesPhase21Controller(){
  useEffect(()=>{
    let queued=false; const apply=()=>{ if(queued)return; queued=true; requestAnimationFrame(()=>{ queued=false; document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal)); }); };
    apply(); const observer=new MutationObserver(apply); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});
    const refresh=()=>document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal=>render(modal,true));
    window.addEventListener("storage",refresh); window.addEventListener("cpd:phase5-assessment",refresh as EventListener); window.addEventListener("cpd:meaningful-progress",refresh as EventListener); window.addEventListener("cpd:team-challenge",refresh as EventListener);
    return()=>{ observer.disconnect(); window.removeEventListener("storage",refresh); window.removeEventListener("cpd:phase5-assessment",refresh as EventListener); window.removeEventListener("cpd:meaningful-progress",refresh as EventListener); window.removeEventListener("cpd:team-challenge",refresh as EventListener); };
  },[]); return null;
}
