"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase15SceneForModule, type Phase15Scene } from "../../lib/courseSpotProblemPhase15";

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

type StoredScene = { complete?: boolean; attempts?: number };

function storageKey(courseId: string, sceneId: string) {
  return `cpd-phase15:${courseId}:${sceneId}`;
}

function readStored(courseId: string, sceneId: string): StoredScene {
  try { return JSON.parse(localStorage.getItem(storageKey(courseId, sceneId)) || "{}") as StoredScene; } catch { return {}; }
}

function writeStored(courseId: string, sceneId: string, patch: Partial<StoredScene>) {
  const next = { ...readStored(courseId, sceneId), ...patch };
  try { localStorage.setItem(storageKey(courseId, sceneId), JSON.stringify(next)); } catch {}
  return next;
}

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase15-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase15PreviousDisabled === "true";
  button.removeAttribute("data-phase15-gated");
  button.removeAttribute("data-phase15-previous-disabled");
  button.removeAttribute("title");
}

function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary");
  if (!button) return;
  if (!button.dataset.phase15Gated) {
    button.dataset.phase15PreviousDisabled = String(button.disabled);
    button.dataset.phase15Gated = "true";
  }
  if (complete) {
    button.disabled = button.dataset.phase15PreviousDisabled === "true";
    button.title = "Spot-the-problem activity complete — continue.";
  } else {
    button.disabled = true;
    button.title = "Complete or review the Phase 15 inspection before continuing.";
  }
}

function setFeedback(shell: HTMLElement, title: string, text: string, success = false) {
  const box = shell.querySelector<HTMLElement>(".phase15Feedback");
  if (!box) return;
  box.className = `phase15Feedback ${success ? "success" : "retry"}`;
  box.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span>`;
}

function expertMarkup(scene: Phase15Scene) {
  return `<section class="phase15Expert"><div class="phase15ExpertHead"><span>ANNOTATED EXPERT VIEW</span><h4>What survives professional scrutiny?</h4><p>${escapeHtml(scene.expertSummary)}</p></div><div class="phase15AnnotationGrid">${scene.hotspots.map((item, index) => `<article class="${item.problem ? "problem" : "strength"}"><b>${index + 1} · ${item.problem ? "CHANGE" : "KEEP"}</b><h5>${escapeHtml(item.label)}</h5><p>${escapeHtml(item.annotation)}</p><small>${escapeHtml(item.expertAction)}</small></article>`).join("")}</div></section>`;
}

function renderScene(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const scene = getPhase15SceneForModule(course as never, module as never);
  if (!scene) {
    restoreGate(modal);
    content.classList.remove("phase15SpotSlide");
    content.querySelector(".phase15SpotShell")?.remove();
    delete content.dataset.phase15Signature;
    return;
  }

  const stored = readStored(course.id, scene.id);
  const signature = `${course.id}|${module.id}|${stored.complete ? 1 : 0}`;
  gateNext(modal, Boolean(stored.complete));
  if (!force && content.dataset.phase15Signature === signature) return;
  content.dataset.phase15Signature = signature;
  content.classList.add("phase15SpotSlide");
  content.querySelector(".phase15SpotShell")?.remove();

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "SPOT THE PROBLEM";
  if (navType) navType.textContent = stored.complete ? "inspection · complete" : "inspection · 3 problems";

  const shell = document.createElement("section");
  shell.className = `phase15SpotShell ${stored.complete ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase15Head"><div><span>PRESENTATION OVERHAUL · PHASE 15</span><h3>${escapeHtml(scene.title)}</h3><p>${escapeHtml(scene.strapline)}</p></div><b>${stored.complete ? "✓" : "3"}</b></header><div class="phase15Brief"><strong>${escapeHtml(scene.sceneLabel)}</strong><p>${escapeHtml(scene.sceneSummary)}</p><small>${escapeHtml(scene.instruction)}</small></div><div class="phase15SceneBoard" role="group" aria-label="${escapeHtml(scene.sceneLabel)}">${scene.hotspots.map((item, hotspotIndex) => `<button type="button" class="phase15Hotspot" data-phase15-hotspot="${escapeHtml(item.id)}" style="--x:${item.x}%;--y:${item.y}%" aria-label="Hotspot ${hotspotIndex + 1}: ${escapeHtml(item.label)}"><b>${hotspotIndex + 1}</b><span>${escapeHtml(item.label)}</span></button>`).join("")}<div class="phase15SceneCentre"><span>INSPECT</span><strong>${escapeHtml(scene.sceneLabel)}</strong><small>3 problems · 3 defensible features</small></div></div><div class="phase15SelectionBar"><span class="phase15SelectionCount">0 / ${scene.targetProblems} selected</span><div><button type="button" class="phase15Check">Check hotspots</button><button type="button" class="phase15Reveal" ${stored.complete ? "" : "hidden"}>Reveal annotations</button></div></div><div class="phase15Feedback"><strong>${stored.complete ? "Inspection complete" : "Inspect before revealing"}</strong><span>${stored.complete ? "You can review every expert annotation below." : "Choose the three hotspots you think weaken the professional response."}</span></div><div class="phase15ExpertHost">${stored.complete ? expertMarkup(scene) : ""}</div>`;

  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  if (stored.complete) {
    shell.querySelectorAll<HTMLButtonElement>("[data-phase15-hotspot]").forEach(button => {
      const item = scene.hotspots.find(hotspot => hotspot.id === button.dataset.phase15Hotspot);
      button.classList.add(item?.problem ? "problemFound" : "strengthFound");
      button.disabled = true;
    });
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "phase15Reset";
    reset.textContent = "Replay inspection";
    reset.addEventListener("click", () => {
      writeStored(course.id, scene.id, { complete: false, attempts: 0 });
      renderScene(modal, true);
    });
    shell.append(reset);
    return;
  }

  const selected = new Set<string>();
  const buttons = Array.from(shell.querySelectorAll<HTMLButtonElement>("[data-phase15-hotspot]"));
  const count = shell.querySelector<HTMLElement>(".phase15SelectionCount");
  const reveal = shell.querySelector<HTMLButtonElement>(".phase15Reveal");
  const expertHost = shell.querySelector<HTMLElement>(".phase15ExpertHost");

  const paint = () => {
    buttons.forEach(button => button.classList.toggle("selected", selected.has(button.dataset.phase15Hotspot || "")));
    if (count) count.textContent = `${selected.size} / ${scene.targetProblems} selected`;
  };

  buttons.forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.phase15Hotspot;
    if (!id) return;
    buttons.forEach(item => item.classList.remove("rightPick", "wrongPick"));
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < scene.targetProblems) selected.add(id);
    else setFeedback(shell, "Three selected already", "Deselect one hotspot before choosing another.");
    paint();
  }));

  shell.querySelector<HTMLButtonElement>(".phase15Check")?.addEventListener("click", () => {
    if (selected.size !== scene.targetProblems) {
      setFeedback(shell, "Choose three hotspots", `Select exactly ${scene.targetProblems} areas before checking.`);
      return;
    }
    const problems = new Set(scene.hotspots.filter(item => item.problem).map(item => item.id));
    let correct = 0;
    buttons.forEach(button => {
      const id = button.dataset.phase15Hotspot || "";
      if (!selected.has(id)) return;
      const isProblem = problems.has(id);
      button.classList.add(isProblem ? "rightPick" : "wrongPick");
      if (isProblem) correct += 1;
    });
    if (correct === scene.targetProblems) {
      writeStored(course.id, scene.id, { complete: true, attempts: (stored.attempts || 0) + 1 });
      setFeedback(shell, "All three problems found", "Strong inspection. The annotated expert view is now unlocked.", true);
      window.setTimeout(() => renderScene(modal, true), 350);
      return;
    }
    const next = writeStored(course.id, scene.id, { attempts: (readStored(course.id, scene.id).attempts || 0) + 1 });
    setFeedback(shell, `${correct}/3 problems identified`, "One or more selected hotspots are actually defensible features. Reconsider what evidence the course principle supports.");
    if ((next.attempts || 0) >= 1 && reveal) reveal.hidden = false;
  });

  reveal?.addEventListener("click", () => {
    if (!expertHost) return;
    expertHost.innerHTML = expertMarkup(scene) + `<button type="button" class="phase15Reviewed">I have reviewed the annotations</button>`;
    reveal.hidden = true;
    setFeedback(shell, "Expert view revealed", "Compare every hotspot with your first judgement, then confirm the review to continue.", true);
    expertHost.querySelector<HTMLButtonElement>(".phase15Reviewed")?.addEventListener("click", () => {
      writeStored(course.id, scene.id, { complete: true });
      renderScene(modal, true);
    });
  });

  paint();
}

export default function CourseSpotProblemPhase15Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal => renderScene(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
