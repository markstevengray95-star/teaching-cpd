"use client";

import { useEffect } from "react";
import {
  courses,
  getCourseLivePresenterPhase5Moments,
  getLivePresenterPhase5MomentForModule,
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

function renderCue(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = currentCourse(modal);
  const index = currentModuleIndex(modal);
  const module = course?.modules[index];
  const content = modal.querySelector<HTMLElement>(".moduleContent");
  if (!course || !module || !content) return;

  const moments = getCourseLivePresenterPhase5Moments(course);
  const moment = getLivePresenterPhase5MomentForModule(course, module);
  const navButtons = Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button"));
  navButtons.forEach((button, buttonIndex) => {
    const item = course.modules[buttonIndex];
    const live = item ? moments.find(entry => entry.moduleId === item.id) : null;
    button.classList.toggle("phase5LiveMomentNav", Boolean(live));
    if (live) button.dataset.phase5LiveKind = live.kind;
    else delete button.dataset.phase5LiveKind;
  });

  if (!moment) {
    content.querySelector(".phase5LiveCue")?.remove();
    delete content.dataset.phase5LiveCueSignature;
    return;
  }

  const signature = `${course.id}|${module.id}|${moment.id}`;
  if (!force && content.dataset.phase5LiveCueSignature === signature) return;
  content.dataset.phase5LiveCueSignature = signature;
  content.querySelector(".phase5LiveCue")?.remove();

  const position = moments.findIndex(entry => entry.id === moment.id) + 1;
  const cue = document.createElement("aside");
  cue.className = `phase5LiveCue phase5LiveCue-${moment.kind}`;
  cue.innerHTML = `
    <div class="phase5LiveCueHead">
      <div><span>PHASE 5 · LIVE MOMENT ${position}/${moments.length}</span><strong>${escapeHtml(moment.title)}</strong></div>
      <b>${escapeHtml(moment.kind.replaceAll("_", " ").toUpperCase())}${moment.durationMinutes ? ` · ${moment.durationMinutes} MIN` : ""}</b>
    </div>
    <p class="phase5LivePrompt">${escapeHtml(moment.prompt)}</p>
    <div class="phase5LivePurpose"><span>WHY NOW</span><p>${escapeHtml(moment.purpose)}</p></div>
    <div class="phase5LiveFacilitator"><span>FACILITATOR MOVE</span><p>${escapeHtml(moment.facilitatorPrompt)}</p></div>
    <a class="primary phase5LiveLaunch" href="/live-presenter?course=${encodeURIComponent(course.id)}&module=${encodeURIComponent(module.id)}&moment=${encodeURIComponent(moment.id)}">Open this moment in Presenter 2.0</a>`;

  const target = content.querySelector(".moduleActions") || content.querySelector(".practiceActivity");
  content.insertBefore(cue, target || null);
}

export default function CourseLivePresenterPhase5Controller() {
  useEffect(() => {
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.shortCoursePresentation)").forEach(modal => renderCue(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
