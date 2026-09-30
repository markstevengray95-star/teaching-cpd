"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase17MysteryPack } from "../../lib/courseMysteryInvestigationPhase17";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}
function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}
function currentCourse(modal: HTMLElement) {
  const title = clean(modal.querySelector(".courseModalHead h2")?.textContent);
  return courses.find(course => course.title === title) || null;
}
function currentModuleIndex(modal: HTMLElement) {
  return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button => button.classList.contains("current"));
}

type StoredMystery = {
  unlocked?: number;
  notes?: Record<string, string>;
  judgementId?: string;
  judgementPassed?: boolean;
  nextAction?: string;
  complete?: boolean;
};

function storageKey(courseId: string) { return `cpd-phase17:${courseId}`; }
function readStored(courseId: string): StoredMystery {
  try { return JSON.parse(localStorage.getItem(storageKey(courseId)) || "{}") as StoredMystery; } catch { return {}; }
}
function writeStored(courseId: string, patch: Partial<StoredMystery>) {
  const next = { ...readStored(courseId), ...patch };
  try { localStorage.setItem(storageKey(courseId), JSON.stringify(next)); } catch {}
  return next;
}
function resetStored(courseId: string) { try { localStorage.removeItem(storageKey(courseId)); } catch {} }

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase17-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase17PreviousDisabled === "true";
  button.removeAttribute("data-phase17-gated");
  button.removeAttribute("data-phase17-previous-disabled");
  button.removeAttribute("title");
}
function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary");
  if (!button) return;
  if (!button.dataset.phase17Gated) {
    button.dataset.phase17PreviousDisabled = String(button.disabled);
    button.dataset.phase17Gated = "true";
  }
  if (complete) {
    button.disabled = button.dataset.phase17PreviousDisabled === "true";
    button.title = "Mystery investigation complete — continue.";
  } else {
    button.disabled = true;
    button.title = "Complete the Phase 17 evidence investigation before continuing.";
  }
}

function renderMystery(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const pack = getPhase17MysteryPack(course as never);
  if (module.id !== pack.anchorId) {
    restoreGate(modal);
    content.classList.remove("phase17MysterySlide");
    content.querySelector(".phase17MysteryShell")?.remove();
    delete content.dataset.phase17Signature;
    return;
  }

  const stored = readStored(course.id);
  const unlocked = Math.max(1, Math.min(4, stored.unlocked || 1));
  const notes = stored.notes || {};
  const complete = Boolean(stored.complete);
  const signature = `${course.id}|${module.id}|${unlocked}|${Object.keys(notes).length}|${stored.judgementId || ""}|${stored.judgementPassed ? 1 : 0}|${(stored.nextAction || "").length}|${complete ? 1 : 0}`;
  gateNext(modal, complete);
  if (!force && content.dataset.phase17Signature === signature) return;
  content.dataset.phase17Signature = signature;
  content.classList.add("phase17MysterySlide");
  content.querySelector(".phase17MysteryShell")?.remove();

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "MYSTERY INVESTIGATION";
  if (navType) navType.textContent = complete ? "investigation · complete" : `investigation · ${unlocked}/4 evidence`;

  const evidenceMarkup = pack.evidence.map((item, evidenceIndex) => {
    const open = evidenceIndex < unlocked;
    const note = notes[item.id] || "";
    const logged = clean(note).length >= 25;
    return `<article class="phase17Evidence ${open ? "unlocked" : "locked"} ${logged ? "logged" : ""}" data-phase17-evidence="${escapeHtml(item.id)}">
      <div class="phase17EvidenceHead"><span>${evidenceIndex + 1}</span><div><small>${escapeHtml(item.source)}</small><strong>${escapeHtml(item.label)}</strong></div><b>${open ? (logged ? "✓" : "OPEN") : "LOCKED"}</b></div>
      ${open ? `<div class="phase17EvidenceBody"><p>${escapeHtml(item.content)}</p><label>${escapeHtml(item.prompt)}<textarea rows="3" data-phase17-note="${escapeHtml(item.id)}" placeholder="Record how this evidence changes your thinking…">${escapeHtml(note)}</textarea></label><div class="phase17EvidenceFoot"><small data-phase17-count="${escapeHtml(item.id)}">${clean(note).length} / 25 characters</small>${evidenceIndex < 3 ? `<button type="button" data-phase17-unlock="${escapeHtml(item.id)}" ${logged ? "" : "disabled"}>${evidenceIndex + 1 < unlocked ? "Evidence logged ✓" : "Log clue & unlock next"}</button>` : ""}</div></div>` : `<div class="phase17LockedBody"><span>?</span><p>Process the previous evidence before this source is revealed.</p></div>`}
    </article>`;
  }).join("");

  const allLogged = pack.evidence.every(item => clean(notes[item.id]).length >= 25);
  const judgementMarkup = unlocked === 4 ? `<section class="phase17Judgement ${allLogged ? "ready" : "waiting"}"><div class="phase17JudgementHead"><span>FINAL JUDGEMENT</span><h4>${escapeHtml(pack.question)}</h4><p>${allLogged ? "Use all four sources. Choose the conclusion that stays closest to what the evidence can actually support." : "Process the final evidence source before making a judgement."}</p></div>${allLogged ? `<div class="phase17JudgementChoices">${pack.judgements.map((item, i) => `<button type="button" data-phase17-judgement="${escapeHtml(item.id)}" class="${stored.judgementId === item.id ? "selected" : ""}"><span>${String.fromCharCode(65 + i)}</span><strong>${escapeHtml(item.label)}</strong></button>`).join("")}</div><div class="phase17JudgementFeedback ${stored.judgementPassed ? "success" : ""}" ${stored.judgementId ? "" : "hidden"}>${stored.judgementId ? `<strong>${stored.judgementPassed ? "Evidence-led judgement" : "Reconsider the full evidence pattern"}</strong><p>${escapeHtml(pack.judgements.find(item => item.id === stored.judgementId)?.feedback || "")}</p>` : ""}</div>` : ""}</section>` : "";

  const synthesisMarkup = stored.judgementPassed ? `<section class="phase17Synthesis"><span>EXPERT SYNTHESIS</span><h4>What the evidence supports</h4><p>${escapeHtml(pack.expertSynthesis)}</p><label>${escapeHtml(pack.nextActionPrompt)}<textarea rows="4" class="phase17Action" placeholder="Write a specific professional next action…">${escapeHtml(stored.nextAction || "")}</textarea></label><div class="phase17ActionFoot"><small class="phase17ActionCount">${clean(stored.nextAction).length} / 50 characters</small><button type="button" class="phase17Save" ${complete ? "disabled" : ""}>${complete ? "Investigation saved ✓" : "Save investigation"}</button></div></section>` : "";

  const shell = document.createElement("section");
  shell.className = `phase17MysteryShell ${complete ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase17Head"><div><span>PRESENTATION OVERHAUL · PHASE 17</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.brief)}</p></div><b>${complete ? "✓" : `${unlocked}/4`}</b></header><div class="phase17CaseQuestion"><span>CASE QUESTION</span><strong>${escapeHtml(pack.question)}</strong></div><div class="phase17EvidenceGrid">${evidenceMarkup}</div>${judgementMarkup}${synthesisMarkup}<footer class="phase17Foot"><span>${complete ? "Case closed. Replay to test whether a different early hypothesis survives the evidence." : "Do not jump ahead: each source should change, confirm or complicate your current hypothesis."}</span><button type="button" class="phase17Reset">Restart case</button></footer>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  shell.querySelectorAll<HTMLTextAreaElement>("[data-phase17-note]").forEach(textarea => {
    const evidenceId = textarea.dataset.phase17Note || "";
    const count = shell.querySelector<HTMLElement>(`[data-phase17-count="${evidenceId}"]`);
    const unlockButton = shell.querySelector<HTMLButtonElement>(`[data-phase17-unlock="${evidenceId}"]`);
    const update = () => {
      const length = clean(textarea.value).length;
      if (count) count.textContent = `${length} / 25 characters`;
      if (unlockButton) unlockButton.disabled = length < 25;
      const nextNotes = { ...(readStored(course.id).notes || {}), [evidenceId]: textarea.value };
      writeStored(course.id, { notes: nextNotes });
    };
    textarea.addEventListener("input", update);
  });

  shell.querySelectorAll<HTMLButtonElement>("[data-phase17-unlock]").forEach(button => button.addEventListener("click", () => {
    const evidenceId = button.dataset.phase17Unlock || "";
    const currentStore = readStored(course.id);
    const note = currentStore.notes?.[evidenceId] || "";
    if (clean(note).length < 25) return;
    const evidenceIndex = pack.evidence.findIndex(item => item.id === evidenceId);
    writeStored(course.id, { unlocked: Math.max(currentStore.unlocked || 1, Math.min(4, evidenceIndex + 2)) });
    renderMystery(modal, true);
  }));

  shell.querySelectorAll<HTMLButtonElement>("[data-phase17-judgement]").forEach(button => button.addEventListener("click", () => {
    const judgementId = button.dataset.phase17Judgement || "";
    const judgement = pack.judgements.find(item => item.id === judgementId);
    if (!judgement) return;
    writeStored(course.id, { judgementId, judgementPassed: judgement.strongest });
    renderMystery(modal, true);
  }));

  const action = shell.querySelector<HTMLTextAreaElement>(".phase17Action");
  const actionCount = shell.querySelector<HTMLElement>(".phase17ActionCount");
  const save = shell.querySelector<HTMLButtonElement>(".phase17Save");
  const refreshAction = () => {
    const length = clean(action?.value).length;
    if (actionCount) actionCount.textContent = `${length} / 50 characters`;
    if (save && !complete) save.disabled = length < 50;
  };
  action?.addEventListener("input", () => {
    writeStored(course.id, { nextAction: action.value });
    refreshAction();
  });
  save?.addEventListener("click", () => {
    if (!action || clean(action.value).length < 50) return;
    writeStored(course.id, { nextAction: clean(action.value), complete: true });
    renderMystery(modal, true);
  });
  refreshAction();

  shell.querySelector<HTMLButtonElement>(".phase17Reset")?.addEventListener("click", () => {
    resetStored(course.id);
    renderMystery(modal, true);
  });
}

export default function CourseMysteryInvestigationPhase17Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => renderMystery(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
