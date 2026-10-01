"use client";

import { useEffect } from "react";
import {
  courses,
  countProfessionalReadingWords,
  getProfessionalReadingPhase2Pack,
  isProfessionalReadingPhase2Module,
  type Phase2ReadingDepth,
} from "@/lib/catalogue";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function readDepth(): Phase2ReadingDepth {
  try {
    const value = window.localStorage.getItem("cpd-professional-reading-depth");
    return value === "quick" || value === "deep" ? value : "core";
  } catch {
    return "core";
  }
}

function saveDepth(depth: Phase2ReadingDepth) {
  try { window.localStorage.setItem("cpd-professional-reading-depth", depth); } catch {}
}

function currentCourse(modal: HTMLElement) {
  const title = clean(modal.querySelector(".courseModalHead h2")?.textContent);
  return courses.find(course => course.title === title) || null;
}

function currentModuleIndex(modal: HTMLElement) {
  return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button => button.classList.contains("current"));
}

function readingTime(words: number) {
  return Math.max(1, Math.ceil(words / 210));
}

function render(modal: HTMLElement, depth: Phase2ReadingDepth, force = false) {
  if (modal.classList.contains("academyPresentation")) return;
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const moduleType = content.querySelector<HTMLElement>(".moduleType");
  const navCurrent = modal.querySelector<HTMLElement>(".moduleNav button.current");
  const navType = navCurrent?.querySelector<HTMLElement>("small");

  if (!isProfessionalReadingPhase2Module(module)) {
    content.classList.remove("phase2ProfessionalReading");
    content.querySelector(".phase2ReadingShell")?.remove();
    if (moduleType) moduleType.textContent = module.type.toUpperCase();
    if (navType) navType.textContent = module.type;
    delete content.dataset.phase2Signature;
    return;
  }

  const pack = getProfessionalReadingPhase2Pack(course, module);
  if (!pack) return;
  const activeDepth = depth;
  const paragraphs = pack[activeDepth];
  const wordCount = countProfessionalReadingWords(paragraphs);
  const signature = `${course.id}|${module.id}|${activeDepth}`;
  if (!force && content.dataset.phase2Signature === signature) return;
  content.dataset.phase2Signature = signature;
  content.classList.add("phase2ProfessionalReading");
  if (moduleType) moduleType.textContent = "PROFESSIONAL READING";
  if (navType) navType.textContent = "reading";

  let shell = content.querySelector<HTMLElement>(".phase2ReadingShell");
  if (!shell) {
    shell = document.createElement("section");
    shell.className = "phase2ReadingShell";
    const actions = content.querySelector(".moduleActions");
    content.insertBefore(shell, actions || null);
  }

  shell.innerHTML = `
    <div class="phase2ReadingIntro">
      <div>
        <span>PHASE 2 · PROFESSIONAL READING ${pack.section}/3</span>
        <strong>${escapeHtml(pack.strapline)}</strong>
      </div>
      <div class="phase2ReadingMeta"><b>${wordCount}</b><small>words</small><b>${readingTime(wordCount)}</b><small>min read</small></div>
    </div>
    <div class="phase2ReadingDepths" role="group" aria-label="Reading depth">
      <button type="button" data-depth="quick" aria-pressed="${activeDepth === "quick"}"><strong>Quick Read</strong><span>Essential ideas</span></button>
      <button type="button" data-depth="core" aria-pressed="${activeDepth === "core"}"><strong>Core Reading</strong><span>Standard course route</span></button>
      <button type="button" data-depth="deep" aria-pressed="${activeDepth === "deep"}"><strong>Deep Dive</strong><span>Evidence + limitations</span></button>
    </div>
    <div class="phase2ReadingNotice">${activeDepth === "quick" ? "Quick Read gives the essential argument. Use Core Reading when completing the normal course route." : activeDepth === "deep" ? "Deep Dive includes the Core Reading plus more analysis of evidence, uncertainty and implementation." : "Core Reading is the normal professional-learning route for this course."}</div>
    <aside class="phase2KeyIdeas"><span>READ FOR THESE IDEAS</span>${pack.keyIdeas.map((idea, i) => `<div><b>${i + 1}</b><p>${escapeHtml(idea)}</p></div>`).join("")}</aside>
    <article class="phase2ReadingBody">${paragraphs.map((paragraph, i) => `<p${i === 0 ? ' class="phase2ReadingLead"' : ""}>${escapeHtml(paragraph)}</p>`).join("")}</article>
    <section class="phase2PausePanel">
      <div class="phase2PauseHead"><span>PAUSE + PROCESS</span><strong>Do something with the reading before moving on.</strong></div>
      <ol>${pack.pausePrompts.map(prompt => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol>
      <small>The next module gives you a space to record these ideas in your CPD account.</small>
    </section>
    <details class="phase2Glossary">
      <summary><span>Professional glossary</span><small>${pack.glossary.length} terms</small></summary>
      <div>${pack.glossary.map(item => `<article><strong>${escapeHtml(item.term)}</strong><p>${escapeHtml(item.definition)}</p></article>`).join("")}</div>
    </details>`;

  shell.querySelectorAll<HTMLButtonElement>("[data-depth]").forEach(button => button.addEventListener("click", () => {
    const next = button.dataset.depth as Phase2ReadingDepth;
    saveDepth(next);
    render(modal, next, true);
  }));
}

export default function CourseReadingPhase2Controller() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const depth = readDepth();
        document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal => render(modal, depth));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
