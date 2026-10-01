"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import {
  getPhase13EscapePack,
  isPhase13EscapeAnchor,
  type Phase13ChoiceLock,
  type Phase13EscapePack,
  type Phase13SequenceLock,
} from "../../lib/courseEscapePhase13";

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

type StoredEscape = {
  unlocked?: number;
  complete?: boolean;
  sequence?: string[];
};

function key(courseId: string) {
  return `cpd-phase13-escape:${courseId}`;
}

function readStored(courseId: string): StoredEscape {
  try { return JSON.parse(localStorage.getItem(key(courseId)) || "{}") as StoredEscape; } catch { return {}; }
}

function writeStored(courseId: string, patch: Partial<StoredEscape>) {
  const next = { ...readStored(courseId), ...patch };
  try { localStorage.setItem(key(courseId), JSON.stringify(next)); } catch {}
  return next;
}

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase13-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase13PreviousDisabled === "true";
  button.removeAttribute("data-phase13-gated");
  button.removeAttribute("data-phase13-previous-disabled");
  button.removeAttribute("title");
}

function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary");
  if (!button) return;
  if (!button.dataset.phase13Gated) {
    button.dataset.phase13PreviousDisabled = String(button.disabled);
    button.dataset.phase13Gated = "true";
  }
  if (complete) {
    button.disabled = button.dataset.phase13PreviousDisabled === "true";
    button.title = "Escape challenge complete — continue to the final synthesis.";
  } else {
    button.disabled = true;
    button.title = "Clear all four Phase 13 locks to continue.";
  }
}

function feedback(shell: HTMLElement, title: string, detail: string, success = false) {
  const box = shell.querySelector<HTMLElement>(".phase13Feedback");
  if (!box) return;
  box.className = `phase13Feedback ${success ? "success" : "retry"}`;
  box.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}

function clueRail(pack: Phase13EscapePack, unlocked: number) {
  return `<div class="phase13ClueRail">${pack.locks.map((lock, index) => `<span class="${index < unlocked ? "unlocked" : index === unlocked ? "current" : "locked"}"><b>${index < unlocked ? "✓" : index + 1}</b><small>${index < unlocked ? escapeHtml(lock.clue) : "LOCKED"}</small></span>`).join("")}</div>`;
}

function renderChoiceLock(shell: HTMLElement, pack: Phase13EscapePack, lock: Phase13ChoiceLock, index: number, courseId: string, rerender: () => void) {
  shell.innerHTML += `<section class="phase13Lock"><div class="phase13LockLabel"><span>LOCK ${index + 1} OF 4</span><b>${escapeHtml(lock.clue)}</b></div><h3>${escapeHtml(lock.title)}</h3><p>${escapeHtml(lock.prompt)}</p><div class="phase13Options">${lock.options.map(option => `<button type="button" data-phase13-choice="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join("")}</div><button type="button" class="phase13HintButton">Show hint</button><div class="phase13Hint" hidden>${escapeHtml(lock.hint)}</div></section>`;

  const hintButton = shell.querySelector<HTMLButtonElement>(".phase13HintButton");
  const hint = shell.querySelector<HTMLElement>(".phase13Hint");
  hintButton?.addEventListener("click", () => {
    if (!hint) return;
    hint.hidden = !hint.hidden;
    hintButton.textContent = hint.hidden ? "Show hint" : "Hide hint";
  });

  shell.querySelectorAll<HTMLButtonElement>("[data-phase13-choice]").forEach(button => button.addEventListener("click", () => {
    const option = lock.options.find(item => item.id === button.dataset.phase13Choice);
    if (!option) return;
    shell.querySelectorAll<HTMLButtonElement>("[data-phase13-choice]").forEach(item => item.classList.remove("correct", "wrong"));
    button.classList.add(option.correct ? "correct" : "wrong");
    if (!option.correct) {
      feedback(shell, "Lock stays closed", option.feedback);
      return;
    }
    writeStored(courseId, { unlocked: index + 1, sequence: [] });
    feedback(shell, `${lock.clue} clue unlocked`, option.feedback, true);
    window.setTimeout(rerender, 450);
  }));
}

function renderSequenceLock(shell: HTMLElement, pack: Phase13EscapePack, lock: Phase13SequenceLock, index: number, courseId: string, rerender: () => void) {
  const stored = readStored(courseId);
  let order = Array.isArray(stored.sequence) ? stored.sequence.filter(id => lock.items.some(item => item.id === id)) : [];

  shell.innerHTML += `<section class="phase13Lock"><div class="phase13LockLabel"><span>LOCK ${index + 1} OF 4</span><b>${escapeHtml(lock.clue)}</b></div><h3>${escapeHtml(lock.title)}</h3><p>${escapeHtml(lock.prompt)}</p><div class="phase13SequenceChosen"></div><div class="phase13SequencePool">${lock.items.map(item => `<button type="button" data-phase13-sequence="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join("")}</div><div class="phase13SequenceActions"><button type="button" class="phase13CheckSequence">Check sequence</button><button type="button" class="phase13ResetSequence">Reset</button></div><button type="button" class="phase13HintButton">Show hint</button><div class="phase13Hint" hidden>${escapeHtml(lock.hint)}</div></section>`;

  const chosen = shell.querySelector<HTMLElement>(".phase13SequenceChosen");
  const update = () => {
    if (chosen) chosen.innerHTML = order.length ? order.map((id, i) => `<span><b>${i + 1}</b>${escapeHtml(lock.items.find(item => item.id === id)?.label || id)}</span>`).join("") : `<em>Select the steps in order.</em>`;
    shell.querySelectorAll<HTMLButtonElement>("[data-phase13-sequence]").forEach(button => {
      const used = order.includes(button.dataset.phase13Sequence || "");
      button.disabled = used;
      button.classList.toggle("used", used);
    });
    writeStored(courseId, { sequence: order });
  };

  shell.querySelectorAll<HTMLButtonElement>("[data-phase13-sequence]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.phase13Sequence;
    if (!id || order.includes(id)) return;
    order = [...order, id];
    update();
  }));

  shell.querySelector<HTMLButtonElement>(".phase13ResetSequence")?.addEventListener("click", () => {
    order = [];
    update();
    feedback(shell, "Sequence reset", "Try again. Start with recognising or defining the professional problem before choosing an action.");
  });

  shell.querySelector<HTMLButtonElement>(".phase13CheckSequence")?.addEventListener("click", () => {
    if (order.length !== lock.correctOrder.length) {
      feedback(shell, "Lock stays closed", "Use all four steps before checking the sequence.");
      return;
    }
    const correct = order.every((id, position) => id === lock.correctOrder[position]);
    if (!correct) {
      feedback(shell, "Not quite", "The order moves to action too early or reviews before the professional problem has been defined. Reset and try again.");
      return;
    }
    writeStored(courseId, { unlocked: index + 1, sequence: [] });
    feedback(shell, `${lock.clue} clue unlocked`, "Correct sequence. The professional response now moves from problem to action to evidence-informed review.", true);
    window.setTimeout(rerender, 450);
  });

  const hintButton = shell.querySelector<HTMLButtonElement>(".phase13HintButton");
  const hint = shell.querySelector<HTMLElement>(".phase13Hint");
  hintButton?.addEventListener("click", () => {
    if (!hint) return;
    hint.hidden = !hint.hidden;
    hintButton.textContent = hint.hidden ? "Show hint" : "Hide hint";
  });

  update();
}

function renderComplete(shell: HTMLElement, pack: Phase13EscapePack, courseId: string, modal: HTMLElement) {
  writeStored(courseId, { unlocked: 4, complete: true, sequence: [] });
  gateNext(modal, true);
  shell.innerHTML += `<section class="phase13EscapeComplete"><span>PHASE 13 COMPLETE</span><div class="phase13VaultIcon">✓</div><h3>Professional vault unlocked</h3><p>${escapeHtml(pack.successMessage)}</p><div class="phase13FinalCode">${pack.locks.map(lock => `<b>${escapeHtml(lock.clue)}</b>`).join("<span>→</span>")}</div><small>No speed bonus, penalty or leaderboard is used. The challenge rewards professional reasoning and retrying.</small></section>`;
}

function renderEscape(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  if (!isPhase13EscapeAnchor(module)) {
    restoreGate(modal);
    content.classList.remove("phase13EscapeSlide");
    content.querySelector(".phase13EscapeShell")?.remove();
    delete content.dataset.phase13Signature;
    return;
  }

  const stored = readStored(course.id);
  const pack = getPhase13EscapePack(course as never);
  const unlocked = stored.complete ? 4 : Math.max(0, Math.min(3, stored.unlocked || 0));
  const signature = `${course.id}|${module.id}|${unlocked}|${stored.complete ? 1 : 0}|${(stored.sequence || []).join(",")}`;
  gateNext(modal, Boolean(stored.complete));
  if (!force && content.dataset.phase13Signature === signature) return;
  content.dataset.phase13Signature = signature;
  content.classList.add("phase13EscapeSlide");

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "ESCAPE CHALLENGE";
  if (navType) navType.textContent = stored.complete ? "escape · complete" : `escape · lock ${unlocked + 1}`;

  content.querySelector(".phase13EscapeShell")?.remove();
  const shell = document.createElement("section");
  shell.className = "phase13EscapeShell";
  shell.innerHTML = `<header class="phase13EscapeHead"><div><span>PRESENTATION OVERHAUL · PHASE 13</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.subtitle)}</p></div><b>${stored.complete ? "4/4" : `${unlocked}/4`}</b></header><p class="phase13EscapeIntro">${escapeHtml(pack.intro)}</p>${clueRail(pack, unlocked)}<div class="phase13Feedback"><strong>${stored.complete ? "All locks cleared" : "Solve the current lock"}</strong><span>${stored.complete ? "The final synthesis is now available." : "Wrong answers do not remove progress. Use the feedback, then try again."}</span></div>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  const rerender = () => renderEscape(modal, true);
  if (stored.complete) renderComplete(shell, pack, course.id, modal);
  else {
    const lock = pack.locks[unlocked];
    if (lock.id === "sequence") renderSequenceLock(shell, pack, lock, unlocked, course.id, rerender);
    else renderChoiceLock(shell, pack, lock, unlocked, course.id, rerender);
  }

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "phase13ResetAll";
  reset.textContent = stored.complete ? "Replay challenge" : "Restart escape challenge";
  reset.addEventListener("click", () => {
    writeStored(course.id, { unlocked: 0, complete: false, sequence: [] });
    renderEscape(modal, true);
  });
  shell.append(reset);
}

export default function CourseEscapePhase13Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal => renderEscape(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
