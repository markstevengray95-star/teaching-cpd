"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getPhase18StudioPack } from "../../lib/courseBeforeAfterPhase18";

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
function changeScore(original: string, edited: string) {
  const a = clean(original);
  const b = clean(edited);
  const limit = Math.min(a.length, b.length);
  let changed = Math.abs(a.length - b.length);
  for (let i = 0; i < limit; i += 1) if (a[i] !== b[i]) changed += 1;
  return changed;
}

type StoredStudio = {
  draft?: string;
  revealed?: boolean;
  checks?: string[];
  reflection?: string;
  complete?: boolean;
};
function storageKey(courseId: string) { return `cpd-phase18:${courseId}`; }
function readStored(courseId: string): StoredStudio {
  try { return JSON.parse(localStorage.getItem(storageKey(courseId)) || "{}") as StoredStudio; } catch { return {}; }
}
function writeStored(courseId: string, patch: Partial<StoredStudio>) {
  const next = { ...readStored(courseId), ...patch };
  try { localStorage.setItem(storageKey(courseId), JSON.stringify(next)); } catch {}
  return next;
}
function resetStored(courseId: string) { try { localStorage.removeItem(storageKey(courseId)); } catch {} }

function restoreGate(modal: HTMLElement) {
  const button = modal.querySelector<HTMLButtonElement>('.moduleActions .primary[data-phase18-gated="true"]');
  if (!button) return;
  button.disabled = button.dataset.phase18PreviousDisabled === "true";
  button.removeAttribute("data-phase18-gated");
  button.removeAttribute("data-phase18-previous-disabled");
  button.removeAttribute("title");
}
function gateNext(modal: HTMLElement, complete: boolean) {
  const button = modal.querySelector<HTMLButtonElement>(".moduleActions .primary");
  if (!button) return;
  if (!button.dataset.phase18Gated) {
    button.dataset.phase18PreviousDisabled = String(button.disabled);
    button.dataset.phase18Gated = "true";
  }
  if (complete) {
    button.disabled = button.dataset.phase18PreviousDisabled === "true";
    button.title = "Before/After Studio complete — continue.";
  } else {
    button.disabled = true;
    button.title = "Improve the weak example and complete the Phase 18 comparison before continuing.";
  }
}

function renderStudio(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const pack = getPhase18StudioPack(course as never);
  if (module.id !== pack.anchorId) {
    restoreGate(modal);
    content.classList.remove("phase18StudioSlide");
    content.querySelector(".phase18StudioShell")?.remove();
    delete content.dataset.phase18Signature;
    return;
  }

  const stored = readStored(course.id);
  const draft = stored.draft ?? pack.weakExample;
  const revealed = Boolean(stored.revealed);
  const checks = new Set(stored.checks || []);
  const reflection = stored.reflection || "";
  const complete = Boolean(stored.complete);
  const editScore = changeScore(pack.weakExample, draft);
  const signature = `${course.id}|${module.id}|${draft.length}|${editScore}|${revealed ? 1 : 0}|${checks.size}|${reflection.length}|${complete ? 1 : 0}`;
  gateNext(modal, complete);
  if (!force && content.dataset.phase18Signature === signature) return;
  content.dataset.phase18Signature = signature;
  content.classList.add("phase18StudioSlide");
  content.querySelector(".phase18StudioShell")?.remove();

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navType = modal.querySelector<HTMLElement>(".moduleNav button.current small");
  if (moduleType) moduleType.textContent = "BEFORE / AFTER STUDIO";
  if (navType) navType.textContent = complete ? "studio · complete" : revealed ? "studio · compare" : "studio · improve";

  const criteriaMarkup = pack.criteria.map(item => `<article><span>${escapeHtml(item.label)}</span><p>${escapeHtml(item.guidance)}</p></article>`).join("");
  const modelMarkup = pack.annotations.map((item, i) => `<article class="phase18Annotation"><span>${i + 1}</span><div><strong>${escapeHtml(item.label)}</strong><blockquote>${escapeHtml(item.excerpt)}</blockquote><p>${escapeHtml(item.whyBetter)}</p></div></article>`).join("");
  const selfReviewMarkup = pack.criteria.map(item => `<label class="phase18Check ${checks.has(item.id) ? "checked" : ""}"><input type="checkbox" data-phase18-check="${escapeHtml(item.id)}" ${checks.has(item.id) ? "checked" : ""}/><span><strong>${escapeHtml(item.label)}</strong><small>My revised version now meets this criterion.</small></span></label>`).join("");

  const shell = document.createElement("section");
  shell.className = `phase18StudioShell ${revealed ? "revealed" : "editing"} ${complete ? "completed" : ""}`;
  shell.innerHTML = `<header class="phase18Head"><div><span>PRESENTATION OVERHAUL · PHASE 18</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.brief)}</p></div><b>${complete ? "✓" : revealed ? "2" : "1"}</b></header>
    <section class="phase18Criteria"><div><span>IMPROVEMENT LENS</span><strong>Rewrite first. The model stays hidden until you make a meaningful improvement.</strong></div><div class="phase18CriteriaGrid">${criteriaMarkup}</div></section>
    <div class="phase18CompareGrid"><section class="phase18Before"><div class="phase18PanelHead"><span>BEFORE</span><strong>${escapeHtml(pack.weakLabel)}</strong></div><div class="phase18WeakText">${escapeHtml(pack.weakExample)}</div></section><section class="phase18Rewrite"><div class="phase18PanelHead"><span>YOUR VERSION</span><strong>Rewrite the response</strong></div><textarea rows="10" class="phase18Draft">${escapeHtml(draft)}</textarea><div class="phase18RewriteFoot"><small class="phase18EditStatus">${editScore} character-level changes · ${clean(draft).length} characters</small><button type="button" class="phase18Reveal" ${revealed || editScore < 30 || clean(draft).length < 100 ? "disabled" : ""}>${revealed ? "Model revealed ✓" : "Reveal stronger model"}</button></div></section></div>
    ${revealed ? `<section class="phase18After"><div class="phase18AfterHead"><div><span>AFTER</span><h4>Annotated stronger model</h4><p>Compare the model with your rewrite. The goal is not identical wording; it is stronger professional reasoning.</p></div></div><div class="phase18Model">${escapeHtml(pack.strongerModel)}</div><div class="phase18AnnotationGrid">${modelMarkup}</div></section><section class="phase18SelfReview"><span>SELF-REVIEW</span><h4>Check your revised version against the same four criteria</h4><div class="phase18Checks">${selfReviewMarkup}</div><label class="phase18ReflectionLabel">${escapeHtml(pack.reflectionPrompt)}<textarea rows="4" class="phase18Reflection" placeholder="Compare your version with the model and identify the improvement that matters most…">${escapeHtml(reflection)}</textarea></label><div class="phase18CompleteFoot"><small class="phase18ReflectionCount">${clean(reflection).length} / 40 characters · ${checks.size}/4 criteria checked</small><button type="button" class="phase18Complete" ${complete ? "disabled" : ""}>${complete ? "Studio complete ✓" : "Complete comparison"}</button></div></section>` : `<section class="phase18ModelLocked"><span>MODEL LOCKED</span><strong>Improve before you compare.</strong><p>Make a substantive edit to the weak response using the four criteria above. The annotated model unlocks only after your version is meaningfully different.</p></section>`}
    <footer class="phase18Foot"><span>${complete ? "Comparison saved. Your rewrite remains available if you revisit this course." : "A stronger model is evidence for reflection, not text to copy verbatim."}</span><button type="button" class="phase18Reset">Reset studio</button></footer>`;
  content.insertBefore(shell, content.querySelector(".moduleActions") || null);

  const draftBox = shell.querySelector<HTMLTextAreaElement>(".phase18Draft");
  const editStatus = shell.querySelector<HTMLElement>(".phase18EditStatus");
  const revealButton = shell.querySelector<HTMLButtonElement>(".phase18Reveal");
  const refreshDraft = () => {
    if (!draftBox) return;
    const score = changeScore(pack.weakExample, draftBox.value);
    const length = clean(draftBox.value).length;
    if (editStatus) editStatus.textContent = `${score} character-level changes · ${length} characters`;
    if (revealButton && !revealed) revealButton.disabled = score < 30 || length < 100;
  };
  draftBox?.addEventListener("input", () => {
    writeStored(course.id, { draft: draftBox.value });
    refreshDraft();
  });
  revealButton?.addEventListener("click", () => {
    if (!draftBox) return;
    const score = changeScore(pack.weakExample, draftBox.value);
    if (score < 30 || clean(draftBox.value).length < 100) return;
    writeStored(course.id, { draft: draftBox.value, revealed: true });
    renderStudio(modal, true);
  });
  refreshDraft();

  shell.querySelectorAll<HTMLInputElement>("[data-phase18-check]").forEach(input => input.addEventListener("change", () => {
    const current = new Set(readStored(course.id).checks || []);
    const id = input.dataset.phase18Check || "";
    if (input.checked) current.add(id); else current.delete(id);
    writeStored(course.id, { checks: [...current] });
    renderStudio(modal, true);
  }));

  const reflectionBox = shell.querySelector<HTMLTextAreaElement>(".phase18Reflection");
  const reflectionCount = shell.querySelector<HTMLElement>(".phase18ReflectionCount");
  const completeButton = shell.querySelector<HTMLButtonElement>(".phase18Complete");
  const refreshCompletion = () => {
    const latest = readStored(course.id);
    const count = new Set(latest.checks || []).size;
    const length = clean(reflectionBox?.value ?? latest.reflection).length;
    if (reflectionCount) reflectionCount.textContent = `${length} / 40 characters · ${count}/4 criteria checked`;
    if (completeButton && !complete) completeButton.disabled = count < 4 || length < 40;
  };
  reflectionBox?.addEventListener("input", () => {
    writeStored(course.id, { reflection: reflectionBox.value });
    refreshCompletion();
  });
  completeButton?.addEventListener("click", () => {
    const latest = readStored(course.id);
    if (new Set(latest.checks || []).size < 4 || clean(latest.reflection).length < 40) return;
    writeStored(course.id, { complete: true, reflection: clean(latest.reflection) });
    renderStudio(modal, true);
  });
  refreshCompletion();

  shell.querySelector<HTMLButtonElement>(".phase18Reset")?.addEventListener("click", () => {
    resetStored(course.id);
    renderStudio(modal, true);
  });
}

export default function CourseBeforeAfterPhase18Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => renderStudio(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
