"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase16AdventurePack, type Phase16AdventurePack, type Phase16Effects } from "../../lib/courseBranchingAdventurePhase16";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function currentCourse(modal: HTMLElement) {
  const title = clean(modal.querySelector(".courseModalHead h2")?.textContent);
  return courses.find(course => course.title === title) || null;
}

function currentModuleIndex(modal: HTMLElement) {
  return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button => button.classList.contains("current"));
}

type HistoryItem = {
  stateId: string;
  stateTitle: string;
  choiceId: string;
  choiceLabel: string;
  feedback: string;
  consequence: string;
};

type StoredAdventure = {
  currentId?: string;
  effects?: Phase16Effects;
  history?: HistoryItem[];
  arrived?: boolean;
  complete?: boolean;
  transferAction?: string;
};

const INITIAL: Phase16Effects = { evidence: 50, trust: 50, sustainability: 50 };

function storageKey(courseId: string) {
  return `cpd-phase16:${courseId}`;
}

function readStored(courseId: string): StoredAdventure {
  try { return JSON.parse(localStorage.getItem(storageKey(courseId)) || "{}") as StoredAdventure; } catch { return {}; }
}

function writeStored(courseId: string, next: StoredAdventure) {
  try { localStorage.setItem(storageKey(courseId), JSON.stringify(next)); } catch {}
  return next;
}

function resetStored(courseId: string) {
  try { localStorage.removeItem(storageKey(courseId)); } catch {}
}

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase16-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase16PreviousDisabled === "true";
  button.removeAttribute("data-phase16-gated");
  button.removeAttribute("data-phase16-previous-disabled");
  button.removeAttribute("title");
}

function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary");
  if (!button) return;
  if (!button.dataset.phase16Gated) {
    button.dataset.phase16PreviousDisabled = String(button.disabled);
    button.dataset.phase16Gated = "true";
  }
  if (complete) {
    button.disabled = button.dataset.phase16PreviousDisabled === "true";
    button.title = "Branching adventure complete — continue.";
  } else {
    button.disabled = true;
    button.title = "Reach an ending and save a transfer action before continuing.";
  }
}

function meterMarkup(label: string, value: number, key: string) {
  return `<div class="phase16Meter"><div><span>${escapeHtml(label)}</span><b data-phase16-value="${key}">${value}</b></div><div class="phase16Track"><i data-phase16-meter="${key}" style="width:${value}%"></i></div></div>`;
}

function historyMarkup(history: HistoryItem[]) {
  if (!history.length) return `<div class="phase16EmptyLedger">Your first choice will create the first consequence.</div>`;
  return history.map((item, index) => `<article class="phase16LedgerItem"><span>${index + 1}</span><div><strong>${escapeHtml(item.stateTitle)}</strong><p>${escapeHtml(item.choiceLabel)}</p><small>${escapeHtml(item.consequence)}</small></div></article>`).join("");
}

function endingMarkup(pack: Phase16AdventurePack, stateId: string, stored: StoredAdventure) {
  const ending = pack.endings.find(item => item.id === stateId);
  if (!ending) return "";
  const action = stored.transferAction || "";
  return `<section class="phase16Ending ${stored.complete ? "complete" : ""}"><span>YOUR ENDING</span><h4>${escapeHtml(ending.title)}</h4><p>${escapeHtml(ending.summary)}</p><div class="phase16Transfer"><strong>Transfer it to practice</strong><p>${escapeHtml(ending.transferPrompt)}</p><textarea class="phase16TransferInput" rows="4" placeholder="Write a specific action, evidence check and review point…">${escapeHtml(action)}</textarea><div class="phase16TransferFoot"><small class="phase16TransferCount">${action.trim().length} / 40 characters</small><button type="button" class="phase16SaveTransfer" ${stored.complete ? "disabled" : ""}>${stored.complete ? "Transfer saved ✓" : "Save transfer action"}</button></div></div></section>`;
}

function renderAdventure(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const anchorId = `overhaul9-synthesis-${safeId(course.id)}-commit`;
  const pack = module.id === anchorId ? getPhase16AdventurePack(course as never) : null;
  if (!pack) {
    restoreGate(modal);
    content.classList.remove("phase16AdventureSlide");
    content.querySelector(".phase16AdventureShell")?.remove();
    delete content.dataset.phase16Signature;
    return;
  }

  const stored = readStored(course.id);
  const currentId = stored.currentId || "start";
  const current = pack.states.find(state => state.id === currentId) || pack.states[0];
  const effects = stored.effects || INITIAL;
  const history = stored.history || [];
  const arrived = Boolean(stored.arrived || current.chapter === 4);
  const complete = Boolean(stored.complete);
  const signature = `${course.id}|${module.id}|${current.id}|${history.length}|${effects.evidence}|${effects.trust}|${effects.sustainability}|${arrived ? 1 : 0}|${complete ? 1 : 0}|${(stored.transferAction || "").length}`;
  gateNext(modal, complete);
  if (!force && content.dataset.phase16Signature === signature) return;
  content.dataset.phase16Signature = signature;
  content.classList.add("phase16AdventureSlide");
  content.querySelector(".phase16AdventureShell")?.remove();

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "BRANCHING ADVENTURE";
  if (navType) navType.textContent = complete ? "adventure · complete" : `adventure · chapter ${current.chapter}`;

  const shell = document.createElement("section");
  shell.className = `phase16AdventureShell chapter${current.chapter} ${complete ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase16Head"><div><span>PRESENTATION OVERHAUL · PHASE 16</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.subtitle)}</p></div><b>${complete ? "✓" : current.chapter}</b></header>
    <div class="phase16Mission"><span>MISSION</span><p>${escapeHtml(pack.mission)}</p></div>
    <div class="phase16Dashboard">${meterMarkup("Evidence", effects.evidence, "evidence")}${meterMarkup("Trust", effects.trust, "trust")}${meterMarkup("Sustainability", effects.sustainability, "sustainability")}</div>
    <div class="phase16Grid"><div class="phase16Story"><div class="phase16Chapter"><span>CHAPTER ${current.chapter} OF 4</span><h4>${escapeHtml(current.title.replace(/^Chapter \d · /, ""))}</h4><p>${escapeHtml(current.situation)}</p></div>
      ${current.choices.length ? `<div class="phase16Choices">${current.choices.map((item, choiceIndex) => `<button type="button" class="phase16Choice" data-phase16-choice="${escapeHtml(item.id)}"><span>${String.fromCharCode(65 + choiceIndex)}</span><div><strong>${escapeHtml(item.label)}</strong><small>Choose this route →</small></div></button>`).join("")}</div>` : endingMarkup(pack, current.id, stored)}
      <div class="phase16Feedback" hidden></div></div>
      <aside class="phase16Ledger"><div class="phase16LedgerHead"><span>CONSEQUENCE LEDGER</span><strong>${history.length} decision${history.length === 1 ? "" : "s"} carried forward</strong></div><div class="phase16LedgerList">${historyMarkup(history)}</div></aside></div>
    <footer class="phase16Foot"><span>${complete ? "Adventure complete. Your full route remains available for review." : "Earlier choices cannot be undone inside this run — their consequences remain in the scenario."}</span><button type="button" class="phase16Replay">Replay from the beginning</button></footer>`;

  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  shell.querySelectorAll<HTMLButtonElement>("[data-phase16-choice]").forEach(button => button.addEventListener("click", () => {
    const item = current.choices.find(choice => choice.id === button.dataset.phase16Choice);
    if (!item) return;
    const nextState = pack.states.find(state => state.id === item.next);
    if (!nextState) return;
    shell.querySelectorAll<HTMLButtonElement>("[data-phase16-choice]").forEach(choiceButton => choiceButton.disabled = true);
    button.classList.add("chosen");
    const feedback = shell.querySelector<HTMLElement>(".phase16Feedback");
    if (feedback) {
      feedback.hidden = false;
      feedback.innerHTML = `<strong>Consequence created</strong><p>${escapeHtml(item.feedback)}</p><small>${escapeHtml(item.consequence)}</small>`;
    }
    const next: StoredAdventure = {
      ...stored,
      currentId: nextState.id,
      effects: {
        evidence: clamp(effects.evidence + item.effects.evidence),
        trust: clamp(effects.trust + item.effects.trust),
        sustainability: clamp(effects.sustainability + item.effects.sustainability),
      },
      history: [...history, { stateId: current.id, stateTitle: current.title, choiceId: item.id, choiceLabel: item.label, feedback: item.feedback, consequence: item.consequence }],
      arrived: nextState.chapter === 4,
      complete: false,
    };
    writeStored(course.id, next);
    window.setTimeout(() => renderAdventure(modal, true), 650);
  }));

  const transfer = shell.querySelector<HTMLTextAreaElement>(".phase16TransferInput");
  const transferCount = shell.querySelector<HTMLElement>(".phase16TransferCount");
  const saveTransfer = shell.querySelector<HTMLButtonElement>(".phase16SaveTransfer");
  const refreshTransfer = () => {
    const length = clean(transfer?.value).length;
    if (transferCount) transferCount.textContent = `${length} / 40 characters`;
    if (saveTransfer && !complete) saveTransfer.disabled = length < 40;
  };
  transfer?.addEventListener("input", refreshTransfer);
  saveTransfer?.addEventListener("click", () => {
    if (!transfer || clean(transfer.value).length < 40) return;
    writeStored(course.id, { ...stored, currentId: current.id, effects, history, arrived: true, complete: true, transferAction: clean(transfer.value) });
    renderAdventure(modal, true);
  });
  refreshTransfer();

  shell.querySelector<HTMLButtonElement>(".phase16Replay")?.addEventListener("click", () => {
    resetStored(course.id);
    renderAdventure(modal, true);
  });
}

export default function CourseBranchingAdventurePhase16Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => renderAdventure(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
