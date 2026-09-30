"use client";

import { useEffect } from "react";
import {
  courses,
  getWorkshopActivityPhase3Pack,
  isWorkshopActivityPhase3Module,
  type Phase3WorkshopPack,
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
  if (setter) setter.call(textarea, value);
  else textarea.value = value;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function writeCompletion(content: HTMLElement, pack: Phase3WorkshopPack, detail: string) {
  const textarea = content.querySelector<HTMLTextAreaElement>(".activityResponse");
  if (textarea) setReactTextarea(textarea, `WORKSHOP COMPLETE · ${pack.kind.toUpperCase()} · ${detail}`);
  const status = content.querySelector<HTMLElement>(".phase3WorkshopStatus");
  if (status) {
    status.className = "phase3WorkshopStatus success";
    status.innerHTML = `<strong>Workshop complete</strong><span>${escapeHtml(pack.successText)}</span><small>You can now save this activity to your CPD record.</small>`;
  }
  content.classList.add("phase3WorkshopComplete");
}

function setStatus(content: HTMLElement, message: string, kind: "hint" | "error" | "success" = "hint") {
  const status = content.querySelector<HTMLElement>(".phase3WorkshopStatus");
  if (!status) return;
  status.className = `phase3WorkshopStatus ${kind}`;
  status.innerHTML = message;
}

function actionButton(label = "Check response") {
  return `<button type="button" class="phase3CheckButton">${escapeHtml(label)}</button>`;
}

function renderMisconception(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  const selected = new Set<string>();
  shell.innerHTML += `<div class="phase3ChoiceGrid">${(pack.options || []).map(option => `<button type="button" class="phase3Choice" data-id="${option.id}" aria-pressed="false"><span class="phase3ChoiceMarker">?</span><span>${escapeHtml(option.label)}</span></button>`).join("")}</div>${actionButton("Check misconceptions")}`;
  shell.querySelectorAll<HTMLButtonElement>(".phase3Choice").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.id || "";
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    button.setAttribute("aria-pressed", String(selected.has(id)));
  }));
  shell.querySelector<HTMLButtonElement>(".phase3CheckButton")?.addEventListener("click", () => {
    const expected = new Set((pack.options || []).filter(option => option.correct).map(option => option.id));
    const correct = selected.size === expected.size && [...expected].every(id => selected.has(id));
    if (correct) writeCompletion(content, pack, "Misconceptions correctly identified and separated from sound principles.");
    else setStatus(content, "<strong>Try again.</strong><span>Some professionally plausible statements are still being treated as if they were sound principles. Look especially for assumptions presented as evidence.</span>", "error");
  });
}

function renderMatch(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  const values = new Map<string, string>();
  shell.innerHTML += `<div class="phase3MatchGrid">${(pack.options || []).map(option => `<article class="phase3MatchCard"><p>${escapeHtml(option.label)}</p><select data-id="${option.id}"><option value="">Choose the role this plays…</option>${(pack.targets || []).map(target => `<option value="${target.id}">${escapeHtml(target.label)}</option>`).join("")}</select></article>`).join("")}</div>${actionButton("Check matches")}`;
  shell.querySelectorAll<HTMLSelectElement>("select[data-id]").forEach(select => select.addEventListener("change", () => values.set(select.dataset.id || "", select.value)));
  shell.querySelector<HTMLButtonElement>(".phase3CheckButton")?.addEventListener("click", () => {
    const correct = (pack.options || []).every(option => values.get(option.id) === option.target);
    if (correct) writeCompletion(content, pack, "Purpose, principle, evidence and adaptation correctly matched.");
    else setStatus(content, "<strong>Not quite.</strong><span>Ask what job each statement is doing: defining the problem, explaining why the approach works, checking its effect, or adapting it without losing the purpose.</span>", "error");
  });
}

function orderedInteraction(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack, label: string) {
  const source = [...(pack.options || [])];
  const order = source.length > 3 ? [source[2], source[0], source[source.length - 1], ...source.slice(1, source.length - 1).filter(item => item !== source[2])] : [...source].reverse();
  const list = document.createElement("div");
  list.className = "phase3OrderList";
  const draw = () => {
    list.innerHTML = order.map((option, index) => `<article class="phase3OrderCard"><span>${index + 1}</span><p>${escapeHtml(option.label)}</p><div><button type="button" data-move="up" data-index="${index}" aria-label="Move up">↑</button><button type="button" data-move="down" data-index="${index}" aria-label="Move down">↓</button></div></article>`).join("");
    list.querySelectorAll<HTMLButtonElement>("button[data-move]").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const next = button.dataset.move === "up" ? index - 1 : index + 1;
      if (next < 0 || next >= order.length) return;
      [order[index], order[next]] = [order[next], order[index]];
      draw();
    }));
  };
  draw();
  shell.appendChild(list);
  const check = document.createElement("button");
  check.type = "button";
  check.className = "phase3CheckButton";
  check.textContent = label;
  check.addEventListener("click", () => {
    const correct = order.every((option, index) => option.order === index + 1);
    if (correct) writeCompletion(content, pack, order.map(item => item.label).join(" → "));
    else setStatus(content, "<strong>Reconsider the order.</strong><span>Start with diagnosis and purpose, then move through action/rehearsal before judging impact.</span>", "error");
  });
  shell.appendChild(check);
}

function renderCompare(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  if (!pack.compare) return;
  shell.innerHTML += `<div class="phase3CompareGrid"><button type="button" class="phase3CompareCard" data-choice="a"><span>RESPONSE A</span><p>${escapeHtml(pack.compare.a)}</p></button><button type="button" class="phase3CompareCard" data-choice="b"><span>RESPONSE B</span><p>${escapeHtml(pack.compare.b)}</p></button></div>`;
  shell.querySelectorAll<HTMLButtonElement>(".phase3CompareCard").forEach(button => button.addEventListener("click", () => {
    const choice = button.dataset.choice as "a" | "b";
    shell.querySelectorAll(".phase3CompareCard").forEach(card => card.classList.remove("selected"));
    button.classList.add("selected");
    if (choice === pack.compare?.stronger) {
      setStatus(content, `<strong>Stronger reasoning.</strong><span>${escapeHtml(pack.compare.explanation)}</span>`, "success");
      writeCompletion(content, pack, `Selected response ${choice.toUpperCase()}: ${pack.compare.explanation}`);
    } else setStatus(content, `<strong>Plausible, but weaker.</strong><span>${escapeHtml(pack.compare?.explanation || "Look for the response that is more tightly connected to principle, evidence and context.")}</span>`, "error");
  }));
}

function renderSort(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  const assignments = new Map<string, string>();
  shell.innerHTML += `<div class="phase3SortLegend">${(pack.groups || []).map(group => `<div><strong>${escapeHtml(group.label)}</strong><span>${escapeHtml(group.description)}</span></div>`).join("")}</div><div class="phase3SortGrid">${(pack.options || []).map(option => `<article class="phase3SortCard" data-id="${option.id}"><p>${escapeHtml(option.label)}</p><div>${(pack.groups || []).map(group => `<button type="button" data-group="${group.id}">${escapeHtml(group.label)}</button>`).join("")}</div></article>`).join("")}</div>${actionButton("Check the sort")}`;
  shell.querySelectorAll<HTMLElement>(".phase3SortCard").forEach(card => card.querySelectorAll<HTMLButtonElement>("button[data-group]").forEach(button => button.addEventListener("click", () => {
    const id = card.dataset.id || "";
    assignments.set(id, button.dataset.group || "");
    card.querySelectorAll("button[data-group]").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
  })));
  shell.querySelector<HTMLButtonElement>(".phase3CheckButton")?.addEventListener("click", () => {
    const correct = (pack.options || []).every(option => assignments.get(option.id) === option.group);
    if (correct) writeCompletion(content, pack, "All statements correctly classified as evidence or assumption.");
    else setStatus(content, "<strong>Check the boundary.</strong><span>Evidence is directly observable or checkable. An assumption is an interpretation that still needs testing.</span>", "error");
  });
}

function renderEvidence(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  shell.innerHTML += `<div class="phase3EvidenceGrid">${(pack.options || []).map(option => `<button type="button" class="phase3EvidenceCard" data-id="${option.id}"><span>SELECT</span><p>${escapeHtml(option.label)}</p></button>`).join("")}</div>`;
  shell.querySelectorAll<HTMLButtonElement>(".phase3EvidenceCard").forEach(button => button.addEventListener("click", () => {
    const option = (pack.options || []).find(item => item.id === button.dataset.id);
    shell.querySelectorAll(".phase3EvidenceCard").forEach(card => card.classList.remove("selected"));
    button.classList.add("selected");
    if (option?.correct) {
      setStatus(content, `<strong>Best evidence match.</strong><span>${escapeHtml(option.feedback || "This evidence is close to the intended outcome.")}</span>`, "success");
      writeCompletion(content, pack, option.label);
    } else setStatus(content, `<strong>Useful information, but not the strongest test.</strong><span>${escapeHtml(option?.feedback || "Look for evidence that is closer to the intended outcome.")}</span>`, "error");
  }));
}

function renderBranch(shell: HTMLElement, content: HTMLElement, pack: Phase3WorkshopPack) {
  const stages = pack.branch || [];
  let stage = 0;
  const path: string[] = [];
  const container = document.createElement("div");
  container.className = "phase3Branch";
  shell.appendChild(container);
  const draw = () => {
    const current = stages[stage];
    if (!current) return;
    container.innerHTML = `<div class="phase3BranchProgress">${stages.map((_, i) => `<span class="${i < stage ? "done" : i === stage ? "current" : ""}">${i + 1}</span>`).join("")}</div><h3>${escapeHtml(current.prompt)}</h3><div class="phase3BranchChoices">${current.options.map(option => `<button type="button" data-id="${option.id}">${escapeHtml(option.label)}</button>`).join("")}</div><div class="phase3BranchFeedback"></div>`;
    container.querySelectorAll<HTMLButtonElement>("button[data-id]").forEach(button => button.addEventListener("click", () => {
      const option = current.options.find(item => item.id === button.dataset.id);
      const feedback = container.querySelector<HTMLElement>(".phase3BranchFeedback");
      if (!option || !feedback) return;
      feedback.innerHTML = `<strong>${option.strongest ? "Strong decision" : "Reconsider"}</strong><span>${escapeHtml(option.feedback)}</span>`;
      feedback.className = `phase3BranchFeedback ${option.strongest ? "success" : "error"}`;
      if (!option.strongest) return;
      path.push(option.label);
      if (stage === stages.length - 1) {
        writeCompletion(content, pack, path.join(" → "));
        container.querySelectorAll<HTMLButtonElement>("button").forEach(item => { item.disabled = true; });
        return;
      }
      window.setTimeout(() => { stage += 1; draw(); }, 350);
    }));
  };
  draw();
}

function renderWorkshop(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;
  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");

  if (!isWorkshopActivityPhase3Module(module)) {
    content.classList.remove("phase3WorkshopActivity", "phase3WorkshopComplete");
    content.querySelector(".phase3WorkshopShell")?.remove();
    if (moduleType) moduleType.textContent = module.type.toUpperCase();
    if (navType) navType.textContent = module.type;
    delete content.dataset.phase3WorkshopSignature;
    return;
  }

  const pack = getWorkshopActivityPhase3Pack(course, module);
  if (!pack) return;
  const signature = `${course.id}|${module.id}`;
  if (!force && content.dataset.phase3WorkshopSignature === signature) return;
  content.dataset.phase3WorkshopSignature = signature;
  content.classList.add("phase3WorkshopActivity");
  if (moduleType) moduleType.textContent = "INTERACTIVE WORKSHOP";
  if (navType) navType.textContent = pack.kind;

  content.querySelector(".phase3WorkshopShell")?.remove();
  const shell = document.createElement("section");
  shell.className = `phase3WorkshopShell phase3Workshop-${pack.kind}`;
  shell.innerHTML = `<header class="phase3WorkshopHead"><div><span>PHASE 3 · WORKSHOP ACTIVITY</span><strong>${escapeHtml(pack.strapline)}</strong></div><b>${escapeHtml(pack.kind.toUpperCase())}</b></header><div class="phase3WorkshopInstruction"><span>YOUR TASK</span><p>${escapeHtml(pack.instruction)}</p></div><div class="phase3WorkshopStatus hint"><strong>Work it out before checking.</strong><span>Immediate feedback will help you retry rather than simply reveal an answer.</span></div>`;
  const practice = content.querySelector(".practiceActivity");
  content.insertBefore(shell, practice || content.querySelector(".moduleActions") || null);

  if (pack.kind === "misconception") renderMisconception(shell, content, pack);
  else if (pack.kind === "match") renderMatch(shell, content, pack);
  else if (pack.kind === "sequence") orderedInteraction(shell, content, pack, "Check sequence");
  else if (pack.kind === "compare") renderCompare(shell, content, pack);
  else if (pack.kind === "sort") renderSort(shell, content, pack);
  else if (pack.kind === "evidence") renderEvidence(shell, content, pack);
  else if (pack.kind === "rank") orderedInteraction(shell, content, pack, "Check ranking");
  else if (pack.kind === "branch") renderBranch(shell, content, pack);

  const saved = content.querySelector<HTMLTextAreaElement>(".activityResponse")?.value || "";
  if (saved.startsWith("WORKSHOP COMPLETE")) {
    setStatus(content, `<strong>Already completed</strong><span>${escapeHtml(pack.successText)}</span><small>Your saved workshop response remains in your CPD record.</small>`, "success");
    content.classList.add("phase3WorkshopComplete");
  }
}

export default function CourseWorkshopPhase3Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => renderWorkshop(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
