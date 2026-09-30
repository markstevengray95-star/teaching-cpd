"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import {
  getPhase14TimedChallengeForModule,
  type Phase14TimedChallenge,
} from "../../lib/courseTimedChallengePhase14";

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

function storageKey(courseId: string, challengeId: string) {
  return `cpd-phase14:${courseId}:${challengeId}`;
}

function isComplete(courseId: string, challengeId: string) {
  try { return localStorage.getItem(storageKey(courseId, challengeId)) === "complete"; } catch { return false; }
}

function markComplete(courseId: string, challengeId: string) {
  try { localStorage.setItem(storageKey(courseId, challengeId), "complete"); } catch {}
}

type TimerShell = HTMLElement & { _phase14Timer?: ReturnType<typeof window.setInterval> };

function clearTimer(shell: TimerShell | null | undefined) {
  if (shell?._phase14Timer) window.clearInterval(shell._phase14Timer);
  if (shell) delete shell._phase14Timer;
}

function setFeedback(shell: HTMLElement, title: string, text: string, success = false) {
  const box = shell.querySelector<HTMLElement>(".phase14Feedback");
  if (!box) return;
  box.className = `phase14Feedback ${success ? "success" : "retry"}`;
  box.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span>`;
}

function timerController(shell: TimerShell, challenge: Phase14TimedChallenge) {
  const timerText = shell.querySelector<HTMLElement>(".phase14TimerText");
  const start = shell.querySelector<HTMLButtonElement>(".phase14Start");
  const pause = shell.querySelector<HTMLButtonElement>(".phase14Pause");
  const untimed = shell.querySelector<HTMLButtonElement>(".phase14Untimed");
  const reset = shell.querySelector<HTMLButtonElement>(".phase14ResetTimer");
  let remaining = challenge.seconds;
  let running = false;
  let untimedMode = false;

  const paint = () => {
    if (!timerText) return;
    timerText.textContent = untimedMode ? "UNTIMED" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    timerText.classList.toggle("low", !untimedMode && remaining <= 10);
    if (start) start.disabled = running || untimedMode;
    if (pause) pause.disabled = !running || untimedMode;
  };

  const stop = () => {
    running = false;
    clearTimer(shell);
    paint();
  };

  const tick = () => {
    remaining = Math.max(0, remaining - 1);
    paint();
    if (remaining === 0) {
      stop();
      untimedMode = true;
      paint();
      setFeedback(shell, "Time is up — keep going", "The timer is optional. Finish the challenge without a penalty or loss of progress.");
    }
  };

  start?.addEventListener("click", () => {
    if (running || untimedMode) return;
    running = true;
    clearTimer(shell);
    shell._phase14Timer = window.setInterval(tick, 1000);
    paint();
  });

  pause?.addEventListener("click", stop);
  untimed?.addEventListener("click", () => {
    stop();
    untimedMode = true;
    paint();
    setFeedback(shell, "Untimed mode", "Take as long as you need. Timing never affects completion, assessment or certification.", true);
  });
  reset?.addEventListener("click", () => {
    stop();
    remaining = challenge.seconds;
    untimedMode = false;
    paint();
  });
  paint();
}

function complete(shell: HTMLElement, courseId: string, challenge: Phase14TimedChallenge) {
  markComplete(courseId, challenge.id);
  setFeedback(shell, "Challenge complete", challenge.success, true);
  shell.classList.add("completed");
  const status = shell.querySelector<HTMLElement>(".phase14Status");
  if (status) status.textContent = "COMPLETED";
}

function renderRetrieval(shell: HTMLElement, courseId: string, challenge: Phase14TimedChallenge) {
  const area = shell.querySelector<HTMLElement>(".phase14Task");
  if (!area) return;
  area.innerHTML = `<p class="phase14Prompt">${escapeHtml(challenge.prompt)}</p><div class="phase14Choices">${challenge.options.map(item => `<button type="button" data-phase14-choice="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join("")}</div>`;
  area.querySelectorAll<HTMLButtonElement>("[data-phase14-choice]").forEach(button => button.addEventListener("click", () => {
    const choice = challenge.options.find(item => item.id === button.dataset.phase14Choice);
    if (!choice) return;
    area.querySelectorAll<HTMLButtonElement>("[data-phase14-choice]").forEach(item => item.classList.remove("correct", "wrong"));
    button.classList.add(choice.correct ? "correct" : "wrong");
    if (choice.correct) complete(shell, courseId, challenge);
    else setFeedback(shell, "Try another response", choice.feedback);
  }));
}

function renderRanking(shell: HTMLElement, courseId: string, challenge: Phase14TimedChallenge) {
  const area = shell.querySelector<HTMLElement>(".phase14Task");
  if (!area || !challenge.correctOrder) return;
  let order: string[] = [];
  area.innerHTML = `<p class="phase14Prompt">${escapeHtml(challenge.prompt)}</p><div class="phase14RankChosen"><em>Select each action in order.</em></div><div class="phase14Choices">${challenge.options.map(item => `<button type="button" data-phase14-rank="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join("")}</div><div class="phase14TaskActions"><button type="button" class="phase14Check">Check order</button><button type="button" class="phase14Clear">Clear</button></div>`;
  const chosen = area.querySelector<HTMLElement>(".phase14RankChosen");
  const repaint = () => {
    if (chosen) chosen.innerHTML = order.length ? order.map((id, index) => `<span><b>${index + 1}</b>${escapeHtml(challenge.options.find(item => item.id === id)?.label || id)}</span>`).join("") : `<em>Select each action in order.</em>`;
    area.querySelectorAll<HTMLButtonElement>("[data-phase14-rank]").forEach(button => { button.disabled = order.includes(button.dataset.phase14Rank || ""); });
  };
  area.querySelectorAll<HTMLButtonElement>("[data-phase14-rank]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.phase14Rank;
    if (!id || order.includes(id)) return;
    order = [...order, id];
    repaint();
  }));
  area.querySelector<HTMLButtonElement>(".phase14Clear")?.addEventListener("click", () => { order = []; repaint(); });
  area.querySelector<HTMLButtonElement>(".phase14Check")?.addEventListener("click", () => {
    if (order.length !== challenge.correctOrder?.length) {
      setFeedback(shell, "Use all four actions", "Complete the sequence before checking your judgement.");
      return;
    }
    const correct = order.every((id, index) => id === challenge.correctOrder?.[index]);
    if (correct) complete(shell, courseId, challenge);
    else setFeedback(shell, "Re-rank the response", "The sequence moves to action too early. Start with the problem or purpose, then act, then review evidence.");
  });
  repaint();
}

function renderSpotError(shell: HTMLElement, courseId: string, challenge: Phase14TimedChallenge) {
  const area = shell.querySelector<HTMLElement>(".phase14Task");
  if (!area) return;
  const selected = new Set<string>();
  area.innerHTML = `<p class="phase14Prompt">${escapeHtml(challenge.prompt)}</p><div class="phase14Choices phase14SpotChoices">${challenge.options.map(item => `<button type="button" data-phase14-error="${escapeHtml(item.id)}"><span>○</span>${escapeHtml(item.label)}</button>`).join("")}</div><div class="phase14TaskActions"><button type="button" class="phase14CheckErrors">Check the two traps</button><button type="button" class="phase14ClearErrors">Clear</button></div>`;
  area.querySelectorAll<HTMLButtonElement>("[data-phase14-error]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.phase14Error;
    if (!id) return;
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < (challenge.requiredErrors || 2)) selected.add(id);
    area.querySelectorAll<HTMLButtonElement>("[data-phase14-error]").forEach(item => {
      const active = selected.has(item.dataset.phase14Error || "");
      item.classList.toggle("selected", active);
      const marker = item.querySelector("span");
      if (marker) marker.textContent = active ? "✓" : "○";
    });
  }));
  area.querySelector<HTMLButtonElement>(".phase14ClearErrors")?.addEventListener("click", () => {
    selected.clear();
    area.querySelectorAll<HTMLButtonElement>("[data-phase14-error]").forEach(item => { item.classList.remove("selected"); const marker = item.querySelector("span"); if (marker) marker.textContent = "○"; });
  });
  area.querySelector<HTMLButtonElement>(".phase14CheckErrors")?.addEventListener("click", () => {
    if (selected.size !== (challenge.requiredErrors || 2)) {
      setFeedback(shell, "Choose exactly two", "Select the two professional traps before checking.");
      return;
    }
    const wrongSelection = [...selected].find(id => !challenge.options.find(item => item.id === id)?.error);
    if (wrongSelection) {
      const item = challenge.options.find(option => option.id === wrongSelection);
      setFeedback(shell, "One selection is a strength", item?.feedback || "Look again for the two statements that weaken professional practice.");
      return;
    }
    complete(shell, courseId, challenge);
  });
}

function renderTimedChallenge(modal: HTMLElement) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;
  const challenge = getPhase14TimedChallengeForModule(course as never, module as never);
  const existing = content.querySelector<TimerShell>(".phase14Shell");
  if (!challenge) {
    clearTimer(existing);
    existing?.remove();
    delete content.dataset.phase14Signature;
    content.classList.remove("phase14TimedSlide");
    return;
  }

  const completed = isComplete(course.id, challenge.id);
  const signature = `${course.id}|${module.id}|${challenge.id}|${completed ? 1 : 0}`;
  if (content.dataset.phase14Signature === signature && existing) return;
  clearTimer(existing);
  existing?.remove();
  content.dataset.phase14Signature = signature;
  content.classList.add("phase14TimedSlide");

  const shell = document.createElement("section") as TimerShell;
  shell.className = `phase14Shell ${completed ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase14Head"><div><span>PRESENTATION OVERHAUL · PHASE 14</span><h3>${escapeHtml(challenge.title)}</h3><p>${escapeHtml(challenge.strapline)}</p></div><b class="phase14Status">${completed ? "COMPLETED" : "OPTIONAL"}</b></header><div class="phase14TimerBar"><strong class="phase14TimerText">0:00</strong><button type="button" class="phase14Start">Start timer</button><button type="button" class="phase14Pause" disabled>Pause</button><button type="button" class="phase14Untimed">Untimed mode</button><button type="button" class="phase14ResetTimer">Reset timer</button></div><div class="phase14AccessibilityNote">The timer is optional. Pausing, switching to untimed mode or running out of time never blocks progress, assessment or certification.</div><div class="phase14Task"></div><div class="phase14Feedback ${completed ? "success" : ""}" aria-live="polite"><strong>${completed ? "Previously completed" : "Ready when you are"}</strong><span>${completed ? "Replay this challenge if you want another retrieval burst." : "Start the timer for a short challenge, or choose untimed mode."}</span></div>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);
  timerController(shell, challenge);
  if (challenge.kind === "retrieval") renderRetrieval(shell, course.id, challenge);
  else if (challenge.kind === "ranking") renderRanking(shell, course.id, challenge);
  else renderSpotError(shell, course.id, challenge);
}

export default function CourseTimedChallengePhase14Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(renderTimedChallenge);
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      document.querySelectorAll<TimerShell>(".phase14Shell").forEach(clearTimer);
    };
  }, []);
  return null;
}
