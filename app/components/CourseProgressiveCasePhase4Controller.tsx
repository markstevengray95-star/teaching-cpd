"use client";

import { useEffect } from "react";
import {
  courses,
  getProgressiveCasePhase4ModulePack,
  isProgressiveCasePhase4Module,
  type Phase4ProgressiveCaseModulePack,
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

function responseKey(courseId: string, caseNumber: number) {
  return `cpd-phase4-progressive-case:${courseId}:${caseNumber}`;
}

type StoredCase = { roleId?: string; firstAttempt?: string; secondAttempt?: string };

function readStored(courseId: string, caseNumber: number): StoredCase {
  try { return JSON.parse(localStorage.getItem(responseKey(courseId, caseNumber)) || "{}") as StoredCase; } catch { return {}; }
}

function writeStored(courseId: string, caseNumber: number, patch: Partial<StoredCase>) {
  const next = { ...readStored(courseId, caseNumber), ...patch };
  try { localStorage.setItem(responseKey(courseId, caseNumber), JSON.stringify(next)); } catch {}
  return next;
}

function complete(content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, detail: string) {
  const textarea = content.querySelector<HTMLTextAreaElement>(".activityResponse");
  if (textarea) setReactTextarea(textarea, `PROGRESSIVE CASE COMPLETE · CASE ${pack.caseNumber} · ${pack.step.toUpperCase()} · ${detail}`);
  content.classList.add("phase4CaseComplete");
  const status = content.querySelector<HTMLElement>(".phase4CaseStatus");
  if (status) {
    status.className = "phase4CaseStatus success";
    status.innerHTML = `<strong>Step complete</strong><span>${escapeHtml(detail)}</span><small>Save this activity to your CPD record, then continue the case.</small>`;
  }
}

function status(content: HTMLElement, title: string, detail: string, kind: "hint" | "error" | "success" = "hint") {
  const element = content.querySelector<HTMLElement>(".phase4CaseStatus");
  if (!element) return;
  element.className = `phase4CaseStatus ${kind}`;
  element.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}

function selectedRole(pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const stored = readStored(courseId, pack.caseNumber);
  return pack.roles.find(role => role.id === stored.roleId) || pack.roles[0];
}

function renderBrief(shell: HTMLElement, content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const stored = readStored(courseId, pack.caseNumber);
  let roleId = stored.roleId || pack.roles[0]?.id || "primary";
  shell.innerHTML += `<section class="phase4CaseSituation"><span>THE SITUATION</span><p>${escapeHtml(pack.situation)}</p></section><section class="phase4RoleLens"><span>CHOOSE YOUR ROLE LENS</span><div>${pack.roles.map(role => `<button type="button" data-role="${role.id}" aria-pressed="${role.id === roleId}"><strong>${escapeHtml(role.label)}</strong><small>${escapeHtml(role.context)}</small></button>`).join("")}</div></section><button type="button" class="phase4PrimaryAction">Begin this case</button>`;
  shell.querySelectorAll<HTMLButtonElement>("[data-role]").forEach(button => button.addEventListener("click", () => {
    roleId = button.dataset.role || roleId;
    shell.querySelectorAll<HTMLButtonElement>("[data-role]").forEach(item => item.setAttribute("aria-pressed", String(item.dataset.role === roleId)));
    writeStored(courseId, pack.caseNumber, { roleId });
  }));
  shell.querySelector<HTMLButtonElement>(".phase4PrimaryAction")?.addEventListener("click", () => {
    const role = pack.roles.find(item => item.id === roleId) || pack.roles[0];
    writeStored(courseId, pack.caseNumber, { roleId });
    complete(content, pack, `Role lens selected: ${role?.label || "professional role"}. Keep this perspective as the case develops.`);
  });
}

function renderChoiceStep(shell: HTMLElement, content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const isEvidence = pack.step === "evidence";
  const isTransfer = pack.step === "transfer";
  const prompt = isEvidence ? pack.evidencePrompt : isTransfer ? pack.transferPrompt : pack.firstDecisionPrompt;
  const options = isEvidence ? pack.evidenceOptions : isTransfer ? pack.transferOptions : pack.firstDecisionOptions;
  const role = selectedRole(pack, courseId);
  shell.innerHTML += `${isEvidence ? `<section class="phase4EvidenceReveal"><span>NEW EVIDENCE</span>${pack.newEvidence.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</section>` : ""}<section class="phase4RoleReminder"><strong>${escapeHtml(role?.label || "Role lens")}</strong><span>${escapeHtml(isTransfer ? role?.transfer || "" : role?.context || "")}</span></section><section class="phase4Decision"><span>${isTransfer ? "TRANSFER DECISION" : isEvidence ? "UPDATE YOUR DECISION" : "DECIDE BEFORE FEEDBACK"}</span><h3>${escapeHtml(prompt)}</h3><div>${options.map(option => `<button type="button" data-choice="${option.id}">${escapeHtml(option.label)}</button>`).join("")}</div></section>`;
  shell.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach(button => button.addEventListener("click", () => {
    const option = options.find(item => item.id === button.dataset.choice);
    if (!option) return;
    shell.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach(item => item.classList.remove("selected", "strong", "weak"));
    button.classList.add("selected", option.strongest ? "strong" : "weak");
    if (option.strongest) complete(content, pack, option.feedback);
    else status(content, "Plausible, but revise it", option.feedback, "error");
  }));
}

function renderRehearsal(shell: HTMLElement, content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const stored = readStored(courseId, pack.caseNumber);
  const role = selectedRole(pack, courseId);
  shell.innerHTML += `<section class="phase4RoleReminder"><strong>${escapeHtml(role?.label || "Role lens")}</strong><span>${escapeHtml(role?.context || "")}</span></section><section class="phase4Rehearsal"><span>FIRST ATTEMPT · DO THIS BEFORE THE MODEL</span><h3>${escapeHtml(pack.rehearsalPrompt)}</h3><textarea class="phase4RehearsalInput" rows="7" placeholder="Write the response you would actually use in practice…">${escapeHtml(stored.firstAttempt || "")}</textarea><div class="phase4WordSignal"><b>0</b><span>words · aim for enough detail to expose your reasoning</span></div><button type="button" class="phase4PrimaryAction">Save first attempt</button></section>`;
  const input = shell.querySelector<HTMLTextAreaElement>(".phase4RehearsalInput");
  const signal = shell.querySelector<HTMLElement>(".phase4WordSignal b");
  const update = () => { if (signal && input) signal.textContent = String(clean(input.value).split(/\s+/).filter(Boolean).length); };
  input?.addEventListener("input", update); update();
  shell.querySelector<HTMLButtonElement>(".phase4PrimaryAction")?.addEventListener("click", () => {
    const response = clean(input?.value);
    if (response.length < 80) return status(content, "Develop the rehearsal", "Write at least 80 characters so the next model can genuinely challenge your first attempt.", "error");
    writeStored(courseId, pack.caseNumber, { firstAttempt: response });
    complete(content, pack, "First attempt captured. Do not edit it now; the next slide will give you a model to compare against.");
  });
}

function renderModel(shell: HTMLElement, content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const stored = readStored(courseId, pack.caseNumber);
  shell.innerHTML += `<section class="phase4AttemptCompare"><article><span>YOUR FIRST ATTEMPT</span><p>${escapeHtml(stored.firstAttempt || "No first attempt is stored on this device. Return to the previous rehearsal slide before continuing.")}</p></article><article class="model"><span>ANNOTATED MODEL RESPONSE</span><p>${escapeHtml(pack.modelResponse)}</p></article></section><section class="phase4Criteria"><span>WHAT MAKES THE MODEL STRONGER?</span>${pack.modelCriteria.map((criterion, i) => `<label><input type="checkbox" data-criterion="${i}"/><strong>${i + 1}</strong><span>${escapeHtml(criterion)}</span></label>`).join("")}<button type="button" class="phase4PrimaryAction">I have compared the responses</button></section>`;
  shell.querySelector<HTMLButtonElement>(".phase4PrimaryAction")?.addEventListener("click", () => {
    if (!stored.firstAttempt) return status(content, "First attempt missing", "Return to the previous slide and save a first rehearsal before studying the model.", "error");
    const checks = Array.from(shell.querySelectorAll<HTMLInputElement>("[data-criterion]"));
    if (!checks.every(check => check.checked)) return status(content, "Annotate the model first", "Tick each criterion after locating it in the model response. The aim is to notice what your second attempt needs to improve.", "error");
    complete(content, pack, "Model analysed against all success criteria. Move on and make a genuinely improved second attempt.");
  });
}

function renderRetry(shell: HTMLElement, content: HTMLElement, pack: Phase4ProgressiveCaseModulePack, courseId: string) {
  const stored = readStored(courseId, pack.caseNumber);
  shell.innerHTML += `<section class="phase4RetryCompare"><article><span>FIRST ATTEMPT · LOCKED FOR COMPARISON</span><p>${escapeHtml(stored.firstAttempt || "Return to the first rehearsal slide before completing this step.")}</p></article><article><span>MODEL CRITERIA</span><ul>${pack.modelCriteria.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></section><section class="phase4Rehearsal phase4SecondAttempt"><span>SECOND ATTEMPT · REVISION REQUIRED</span><h3>${escapeHtml(pack.retryPrompt)}</h3><textarea class="phase4RetryInput" rows="8" placeholder="Rewrite the response. Do not paste the first attempt unchanged…">${escapeHtml(stored.secondAttempt || "")}</textarea><div class="phase4CriteriaCheck">${pack.modelCriteria.map((criterion, i) => `<label><input type="checkbox" data-retry-criterion="${i}"/><span>${escapeHtml(criterion)}</span></label>`).join("")}</div><button type="button" class="phase4PrimaryAction">Check revised attempt</button></section>`;
  shell.querySelector<HTMLButtonElement>(".phase4PrimaryAction")?.addEventListener("click", () => {
    const response = clean(shell.querySelector<HTMLTextAreaElement>(".phase4RetryInput")?.value);
    if (!stored.firstAttempt) return status(content, "First attempt missing", "Complete the first rehearsal before making the required second attempt.", "error");
    if (response.length < 100) return status(content, "Make the revision substantive", "The second attempt needs at least 100 characters so it can show meaningful professional reasoning.", "error");
    if (response.toLowerCase() === clean(stored.firstAttempt).toLowerCase()) return status(content, "Revision required", "The second attempt is unchanged. Use the model criteria to improve wording, reasoning or evidence before continuing.", "error");
    const checks = Array.from(shell.querySelectorAll<HTMLInputElement>("[data-retry-criterion]"));
    if (!checks.every(check => check.checked)) return status(content, "Self-check the revision", "Use every model criterion to inspect your second attempt before saving it.", "error");
    writeStored(courseId, pack.caseNumber, { secondAttempt: response });
    complete(content, pack, "Second attempt saved after model comparison and criterion-based revision.");
  });
}

function renderCase(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;
  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");

  if (!isProgressiveCasePhase4Module(module)) {
    content.classList.remove("phase4ProgressiveCase", "phase4CaseComplete");
    content.querySelector(".phase4CaseShell")?.remove();
    if (moduleType) moduleType.textContent = module.type.toUpperCase();
    if (navType) navType.textContent = module.type;
    delete content.dataset.phase4CaseSignature;
    return;
  }

  const pack = getProgressiveCasePhase4ModulePack(course, module);
  if (!pack) return;
  const signature = `${course.id}|${module.id}`;
  if (!force && content.dataset.phase4CaseSignature === signature) return;
  content.dataset.phase4CaseSignature = signature;
  content.classList.add("phase4ProgressiveCase");
  if (moduleType) moduleType.textContent = `PROGRESSIVE CASE ${pack.caseNumber}`;
  if (navType) navType.textContent = `case ${pack.caseNumber} · ${pack.step}`;

  content.querySelector(".phase4CaseShell")?.remove();
  const shell = document.createElement("section");
  shell.className = `phase4CaseShell phase4Case-${pack.step}`;
  const stepIndex = ["brief", "decision", "evidence", "rehearse", "model", "retry", "transfer"].indexOf(pack.step);
  shell.innerHTML = `<header class="phase4CaseHead"><div><span>PRESENTATION OVERHAUL · PHASE 4</span><strong>${escapeHtml(pack.subtitle)}</strong></div><b>CASE ${pack.caseNumber}</b></header><div class="phase4CaseProgress">${["Context", "Decide", "Evidence", "Rehearse", "Model", "Retry", "Transfer"].map((label, i) => `<span class="${i < stepIndex ? "done" : i === stepIndex ? "current" : ""}"><b>${i + 1}</b><small>${label}</small></span>`).join("")}</div><div class="phase4CaseStatus hint"><strong>Work the case, don't just read it.</strong><span>Your response should change as the evidence changes.</span></div>`;
  const practice = content.querySelector(".practiceActivity");
  content.insertBefore(shell, practice || content.querySelector(".moduleActions") || null);

  if (pack.step === "brief") renderBrief(shell, content, pack, course.id);
  else if (pack.step === "decision" || pack.step === "evidence" || pack.step === "transfer") renderChoiceStep(shell, content, pack, course.id);
  else if (pack.step === "rehearse") renderRehearsal(shell, content, pack, course.id);
  else if (pack.step === "model") renderModel(shell, content, pack, course.id);
  else if (pack.step === "retry") renderRetry(shell, content, pack, course.id);
}

export default function CourseProgressiveCasePhase4Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal => renderCase(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
