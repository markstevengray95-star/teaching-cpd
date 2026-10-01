"use client";

import { useEffect } from "react";
import {
  courses,
  getPhase11MissionPack,
  getPhase12SimulationModulePack,
  isPhase11MissionModule,
  isPhase12SimulationModule,
  type Course,
  type Phase12SimulationPack,
} from "@/lib/catalogue";

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

function setReactTextarea(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, value); else textarea.value = value;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function completeUnderlyingActivity(content: HTMLElement, value: string) {
  const textarea = content.querySelector<HTMLTextAreaElement>(".activityResponse");
  if (textarea) setReactTextarea(textarea, value);
  content.classList.add("phase1112Complete");
}

function firstIndex(course: Course, predicate: (id: string) => boolean, fallback: number) {
  const index = course.modules.findIndex(module => predicate(module.id));
  return index >= 0 ? index : fallback;
}

function missionStageIndex(course: Course, moduleIndex: number) {
  const mission = firstIndex(course, id => id.startsWith("overhaul11-mission-"), 1);
  const learn = firstIndex(course, id => id.startsWith("overhaul2-reading-"), Math.min(course.modules.length - 1, mission + 2));
  const practise = firstIndex(course, id => id.startsWith("overhaul3-workshop-"), Math.round(course.modules.length * .35));
  const decide = firstIndex(course, id => id.startsWith("overhaul12-sim-") && id.endsWith("-2"), Math.round(course.modules.length * .65));
  const transfer = firstIndex(course, id => id.startsWith("overhaul9-synthesis-"), Math.round(course.modules.length * .82));
  const anchors = [mission, learn, practise, decide, transfer];
  let stage = 0;
  anchors.forEach((anchor, index) => { if (moduleIndex >= anchor) stage = index; });
  return Math.max(0, Math.min(4, stage));
}

function renderMissionRail(modal: HTMLElement, course: Course, moduleIndex: number) {
  const head = modal.querySelector<HTMLElement>(".courseModalHead");
  if (!head) return;
  const pack = getPhase11MissionPack(course);
  const stageIndex = missionStageIndex(course, moduleIndex);
  let rail = modal.querySelector<HTMLElement>(".phase11MissionRail");
  if (!rail) {
    rail = document.createElement("section");
    rail.className = "phase11MissionRail";
    head.insertAdjacentElement("afterend", rail);
  }
  rail.innerHTML = `<div class="phase11MissionRailTitle"><span>MISSION</span><strong>${escapeHtml(pack.title)}</strong></div><div class="phase11MissionRailStages">${pack.stages.map((stage, index) => `<span class="${index < stageIndex ? "done" : index === stageIndex ? "current" : ""}"><b>${index + 1}</b><small>${escapeHtml(stage.label)}</small></span>`).join("")}</div>`;
}

function renderMission(content: HTMLElement, course: Course) {
  const pack = getPhase11MissionPack(course);
  const signature = `${course.id}|mission`;
  if (content.dataset.phase1112Signature === signature && content.querySelector(".phase11MissionShell")) return;
  content.dataset.phase1112Signature = signature;
  content.classList.add("phase11MissionSlide");
  const practice = content.querySelector<HTMLElement>(".practiceActivity");
  if (practice) practice.style.display = "none";
  content.querySelector(".phase11MissionShell")?.remove();
  const storedKey = `cpd-phase11-mission:${course.id}`;
  let selected = "";
  try { selected = localStorage.getItem(storedKey) || ""; } catch {}
  const shell = document.createElement("section");
  shell.className = "phase11MissionShell";
  shell.innerHTML = `<header><div><span>PRESENTATION OVERHAUL · PHASE 11</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.brief)}</p></div><b>MISSION</b></header><section class="phase11Objective"><span>YOUR OBJECTIVE</span><strong>${escapeHtml(pack.objective)}</strong></section><section class="phase11StageBoard">${pack.stages.map((stage, index) => `<article><b>${index + 1}</b><div><strong>${escapeHtml(stage.label)}</strong><p>${escapeHtml(stage.purpose)}</p></div></article>`).join("")}</section><section class="phase11Success"><span>CHOOSE THE SUCCESS SIGNAL YOU MOST NEED TO PROTECT</span><div>${pack.successSignals.map((signal, index) => `<button type="button" data-signal="${index}" aria-pressed="${selected === signal}">${escapeHtml(signal)}</button>`).join("")}</div></section><div class="phase1112Status"><strong>${selected ? "Mission focus saved" : "Choose a success signal"}</strong><span>${selected ? escapeHtml(selected) : "This gives the course a practical definition of success before you begin."}</span></div><button type="button" class="phase1112Primary" ${selected ? "" : "disabled"}>Accept mission</button>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);
  shell.querySelectorAll<HTMLButtonElement>("[data-signal]").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.signal);
    selected = pack.successSignals[index] || "";
    try { localStorage.setItem(storedKey, selected); } catch {}
    shell.querySelectorAll<HTMLButtonElement>("[data-signal]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    const status = shell.querySelector<HTMLElement>(".phase1112Status");
    if (status) status.innerHTML = `<strong>Mission focus saved</strong><span>${escapeHtml(selected)}</span>`;
    const accept = shell.querySelector<HTMLButtonElement>(".phase1112Primary");
    if (accept) accept.disabled = false;
  }));
  shell.querySelector<HTMLButtonElement>(".phase1112Primary")?.addEventListener("click", () => {
    if (!selected) return;
    completeUnderlyingActivity(content, `MISSION ACCEPTED · ${pack.title} · Success signal: ${selected}`);
    const status = shell.querySelector<HTMLElement>(".phase1112Status");
    if (status) {
      status.className = "phase1112Status success";
      status.innerHTML = `<strong>Mission accepted</strong><span>Work through Brief → Learn → Practise → Decide → Transfer and keep this success signal in view.</span>`;
    }
  });
}

type StoredSimulation = {
  stateId: string;
  evidence: number;
  access: number;
  sustainability: number;
  history: string[];
  complete: boolean;
  lastFeedback?: string;
  nextState?: string;
};

function simulationKey(courseId: string, simulationNumber: number) {
  return `cpd-phase12-simulation:${courseId}:${simulationNumber}`;
}

function initialSimulation(): StoredSimulation {
  return { stateId: "start", evidence: 50, access: 50, sustainability: 50, history: [], complete: false };
}

function readSimulation(courseId: string, simulationNumber: number): StoredSimulation {
  try {
    const value = localStorage.getItem(simulationKey(courseId, simulationNumber));
    return value ? { ...initialSimulation(), ...(JSON.parse(value) as StoredSimulation) } : initialSimulation();
  } catch { return initialSimulation(); }
}

function writeSimulation(courseId: string, simulationNumber: number, value: StoredSimulation) {
  try { localStorage.setItem(simulationKey(courseId, simulationNumber), JSON.stringify(value)); } catch {}
}

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }

function meter(label: string, value: number) {
  return `<div class="phase12Meter"><span><b>${escapeHtml(label)}</b><strong>${value}</strong></span><i><em style="width:${value}%"></em></i></div>`;
}

function renderSimulationState(shell: HTMLElement, content: HTMLElement, course: Course, pack: Phase12SimulationPack) {
  const stored = readSimulation(course.id, pack.simulationNumber);
  const state = pack.states.find(item => item.id === stored.stateId) || pack.states[0];
  if (!state) return;
  shell.innerHTML = `<header class="phase12SimHead"><div><span>PRESENTATION OVERHAUL · PHASE 12 · SIMULATION ${pack.simulationNumber}</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.subtitle)}</p></div><b>ROUND ${stored.complete ? 3 : state.round}/3</b></header><section class="phase12Meters">${meter("Evidence", stored.evidence)}${meter("Access", stored.access)}${meter("Sustainability", stored.sustainability)}</section>${stored.complete ? `<section class="phase12Outcome"><span>SIMULATION COMPLETE</span><h3>${stored.evidence + stored.access + stored.sustainability >= 210 ? "Strong professional route" : "Recovered professional route"}</h3><p>${escapeHtml(stored.lastFeedback || "You completed the simulation and reached a review decision.")}</p><div>${stored.history.map((item, index) => `<span><b>${index + 1}</b>${escapeHtml(item)}</span>`).join("")}</div><button type="button" class="phase1112Secondary" data-restart>Run the simulation again</button></section>` : `<section class="phase12Situation"><span>${state.round === 1 ? "STARTING SITUATION" : state.round === 2 ? "CONSEQUENCE" : "FINAL DECISION"}</span><h3>${escapeHtml(state.title)}</h3><p>${escapeHtml(state.situation)}</p></section><section class="phase12Choices"><span>WHAT DO YOU DO NEXT?</span>${state.choices.map(choice => `<button type="button" data-sim-choice="${choice.id}"><strong>${escapeHtml(choice.label)}</strong></button>`).join("")}</section><div class="phase1112Status"><strong>Choose before seeing the consequence</strong><span>Your decision changes both the next situation and the three professional impact meters.</span></div>`}`;

  shell.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () => {
    writeSimulation(course.id, pack.simulationNumber, initialSimulation());
    content.classList.remove("phase1112Complete");
    renderSimulationState(shell, content, course, pack);
  });

  shell.querySelectorAll<HTMLButtonElement>("[data-sim-choice]").forEach(button => button.addEventListener("click", () => {
    const latest = readSimulation(course.id, pack.simulationNumber);
    if (latest.complete || latest.nextState) return;
    const liveState = pack.states.find(item => item.id === latest.stateId) || state;
    const choice = liveState.choices.find(item => item.id === button.dataset.simChoice);
    if (!choice) return;
    const next: StoredSimulation = {
      ...latest,
      evidence: clamp(latest.evidence + choice.effects.evidence),
      access: clamp(latest.access + choice.effects.access),
      sustainability: clamp(latest.sustainability + choice.effects.sustainability),
      history: [...latest.history, choice.label],
      lastFeedback: choice.feedback,
      nextState: choice.next,
    };
    writeSimulation(course.id, pack.simulationNumber, next);
    shell.querySelectorAll<HTMLButtonElement>("[data-sim-choice]").forEach(item => { item.disabled = true; item.classList.toggle("selected", item === button); });
    const status = shell.querySelector<HTMLElement>(".phase1112Status");
    if (status) {
      status.className = "phase1112Status feedback";
      status.innerHTML = `<strong>Consequence</strong><span>${escapeHtml(choice.feedback)}</span><button type="button" class="phase1112Primary" data-continue>${choice.next === "end" ? "See simulation outcome" : "Continue simulation"}</button>`;
      status.querySelector<HTMLButtonElement>("[data-continue]")?.addEventListener("click", () => {
        const current = readSimulation(course.id, pack.simulationNumber);
        const finished = current.nextState === "end";
        const advanced: StoredSimulation = { ...current, stateId: finished ? current.stateId : (current.nextState || "start"), nextState: undefined, complete: finished };
        writeSimulation(course.id, pack.simulationNumber, advanced);
        if (finished) completeUnderlyingActivity(content, `SIMULATION ${pack.simulationNumber} COMPLETE · Evidence ${advanced.evidence} · Access ${advanced.access} · Sustainability ${advanced.sustainability}`);
        renderSimulationState(shell, content, course, pack);
      });
    }
  }));
}

function renderSimulation(content: HTMLElement, course: Course, pack: Phase12SimulationPack) {
  const signature = `${course.id}|simulation|${pack.simulationNumber}`;
  if (content.dataset.phase1112Signature === signature && content.querySelector(".phase12SimulationShell")) return;
  content.dataset.phase1112Signature = signature;
  content.classList.add("phase12SimulationSlide");
  const practice = content.querySelector<HTMLElement>(".practiceActivity");
  if (practice) practice.style.display = "none";
  content.querySelector(".phase12SimulationShell")?.remove();
  const shell = document.createElement("section");
  shell.className = "phase12SimulationShell";
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);
  renderSimulationState(shell, content, course, pack);
}

function resetSpecial(content: HTMLElement) {
  content.classList.remove("phase11MissionSlide", "phase12SimulationSlide", "phase1112Complete");
  content.querySelector(".phase11MissionShell")?.remove();
  content.querySelector(".phase12SimulationShell")?.remove();
  const practice = content.querySelector<HTMLElement>(".practiceActivity");
  if (practice) practice.style.removeProperty("display");
  delete content.dataset.phase1112Signature;
}

function decorate(modal: HTMLElement) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  const module = course?.modules[index];
  if (!course || !content || !module || index < 0) return;
  renderMissionRail(modal, course, index);
  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (isPhase11MissionModule(module)) {
    if (moduleType) moduleType.textContent = "MISSION";
    if (navType) navType.textContent = "mission";
    renderMission(content, course);
    return;
  }
  if (isPhase12SimulationModule(module)) {
    const pack = getPhase12SimulationModulePack(course, module);
    if (!pack) return;
    if (moduleType) moduleType.textContent = `SIMULATION ${pack.simulationNumber}`;
    if (navType) navType.textContent = `simulation ${pack.simulationNumber}`;
    renderSimulation(content, course, pack);
    return;
  }
  if (content.classList.contains("phase11MissionSlide") || content.classList.contains("phase12SimulationSlide")) resetSpecial(content);
}

export default function CourseMissionSimulationPhase11to12Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.labMode):not(.shortCoursePresentation)").forEach(decorate);
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
