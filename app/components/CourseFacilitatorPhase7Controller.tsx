"use client";

import { useEffect } from "react";
import {
  courses,
  getPhase7FacilitatorPlan,
  getPhase7SlideGuide,
  PHASE7_SESSION_ROUTES,
  type Phase7RouteMinutes,
} from "@/lib/catalogue";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function readRoute(): Phase7RouteMinutes {
  try {
    const value = Number(window.localStorage.getItem("cpd-phase7-route") || "60");
    return PHASE7_SESSION_ROUTES.includes(value as Phase7RouteMinutes) ? value as Phase7RouteMinutes : 60;
  } catch {
    return 60;
  }
}

function saveRoute(value: Phase7RouteMinutes) {
  try { window.localStorage.setItem("cpd-phase7-route", String(value)); } catch {}
}

function courseForModal(modal: HTMLElement) {
  const heading = clean(modal.querySelector(".courseModalHead h2")?.textContent);
  return courses.find(course => course.title === heading) || null;
}

function currentIndex(modal: HTMLElement) {
  return Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button")).findIndex(button => button.classList.contains("current"));
}

function setAccessibility(modal: HTMLElement, key: "large" | "contrast" | "quiet", active: boolean) {
  modal.classList.toggle(`phase7-${key}`, active);
}

function ensureToolbar(modal: HTMLElement) {
  const actions = modal.querySelector<HTMLElement>(".courseModalHeadActions");
  if (!actions || actions.querySelector(".phase7FacilitatorToggle")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary phase7FacilitatorToggle";
  button.textContent = "Facilitator";
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    const open = modal.classList.toggle("phase7FacilitatorMode");
    button.textContent = open ? "Close facilitator" : "Facilitator";
    button.setAttribute("aria-pressed", String(open));
    if (open && !modal.classList.contains("presentationFocus")) modal.querySelector<HTMLButtonElement>(".presentationModeToggle")?.click();
    updateConsole(modal, true);
  });
  actions.prepend(button);
}

function ensureConsole(modal: HTMLElement) {
  if (modal.querySelector(".phase7FacilitatorConsole")) return;
  const panel = document.createElement("aside");
  panel.className = "phase7FacilitatorConsole";
  panel.setAttribute("aria-label", "Facilitator console");
  modal.appendChild(panel);
}

function discussionTimer(panel: HTMLElement) {
  const output = panel.querySelector<HTMLElement>(".phase7DiscussionTime");
  if (!output || output.dataset.running === "true") return;
  output.dataset.running = "true";
  let seconds = 120;
  output.textContent = "2:00";
  const id = window.setInterval(() => {
    seconds -= 1;
    output.textContent = `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
    if (seconds <= 0) {
      window.clearInterval(id);
      output.dataset.running = "false";
      output.textContent = "Done";
    }
  }, 1000);
}

function routeButton(route: Phase7RouteMinutes, active: boolean) {
  return `<button type="button" class="phase7Route${active ? " active" : ""}" data-route="${route}">${route} min</button>`;
}

function moveToRouteSlide(modal: HTMLElement, direction: 1 | -1, selectedIds: string[], moduleIds: string[]) {
  const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button"));
  const index = currentIndex(modal);
  const selectedIndexes = moduleIds.map((id, moduleIndex) => selectedIds.includes(id) ? moduleIndex : -1).filter(value => value >= 0);
  const target = direction > 0
    ? selectedIndexes.find(value => value > index)
    : [...selectedIndexes].reverse().find(value => value < index);
  if (typeof target !== "number") return;
  const button = buttons[target];
  if (!button) return;
  button.disabled = false;
  button.click();
}

function updateConsole(modal: HTMLElement, force = false) {
  if (modal.classList.contains("labMode")) return;
  const course = courseForModal(modal);
  if (!course) return;
  ensureToolbar(modal);
  ensureConsole(modal);

  const route = Number(modal.dataset.phase7Route || readRoute()) as Phase7RouteMinutes;
  const safeRoute = PHASE7_SESSION_ROUTES.includes(route) ? route : 60;
  modal.dataset.phase7Route = String(safeRoute);
  const plan = getPhase7FacilitatorPlan(course, safeRoute);
  const selected = new Set(plan.selectedModuleIds);
  const navButtons = Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button"));
  navButtons.forEach((button, index) => {
    const module = course.modules[index];
    const core = Boolean(module && selected.has(module.id));
    button.classList.toggle("phase7RouteCore", core);
    button.classList.toggle("phase7RouteOptional", !core);
    if (modal.classList.contains("phase7FacilitatorMode") && core) {
      button.disabled = false;
      button.setAttribute("aria-disabled", "false");
      button.classList.remove("presentationLocked");
    }
  });

  const index = currentIndex(modal);
  const module = course.modules[index];
  const panel = modal.querySelector<HTMLElement>(".phase7FacilitatorConsole")!;
  if (!module) return;
  const guide = getPhase7SlideGuide(course, module, safeRoute);
  const core = selected.has(module.id);
  const signature = `${course.id}|${safeRoute}|${index}|${core}|${modal.className}`;
  if (!force && panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;

  const selectedPosition = plan.selectedModuleIds.indexOf(module.id);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Number(modal.dataset.phase3Start || Date.now())) / 1000));
  const expectedBefore = selectedPosition <= 0 ? 0 : plan.slides.slice(0, selectedPosition).reduce((sum, slide) => sum + slide.suggestedMinutes, 0) * 60;
  const paceDifference = Math.round((elapsedSeconds - expectedBefore) / 60);
  const pace = selectedPosition < 0 ? "Optional slide" : paceDifference > 2 ? `${paceDifference} min behind route` : paceDifference < -2 ? `${Math.abs(paceDifference)} min ahead of route` : "On route pace";

  panel.innerHTML = `
    <div class="phase7ConsoleHead">
      <div><span>PHASE 7 · FACILITATOR</span><strong>${escapeHtml(course.title)}</strong><small>${plan.slides.length} live slides · ${safeRoute} min route · ${plan.independentFollowUpCount} mastery slides handed to independent follow-up</small></div>
      <span class="phase7Pace">${escapeHtml(pace)}</span>
    </div>
    <div class="phase7RoutePicker">${PHASE7_SESSION_ROUTES.map(item => routeButton(item, item === safeRoute)).join("")}</div>
    <div class="phase7RouteStatus"><span class="${core ? "core" : "optional"}">${core ? `Core route${selectedPosition >= 0 ? ` · ${selectedPosition + 1}/${plan.slides.length}` : ""}` : "Optional extension slide"}</span><b>${guide.suggestedMinutes} min</b></div>
    <div class="phase7GuideGrid">
      <article><span>PURPOSE</span><p>${escapeHtml(guide.purpose)}</p></article>
      <article><span>FACILITATOR MOVE</span><p>${escapeHtml(guide.facilitatorMove)}</p></article>
      <article><span>ASK THE ROOM</span><p>${escapeHtml(guide.discussionQuestion)}</p></article>
      <article><span>WATCH FOR</span><p>${escapeHtml(guide.misconception)}</p></article>
      <article><span>ACCESS & INCLUSION</span><p>${escapeHtml(guide.accessibilityMove)}</p></article>
      <article><span>OPTIONAL EXTENSION</span><p>${escapeHtml(guide.extension)}</p></article>
    </div>
    <div class="phase7ConsoleActions">
      <button type="button" class="secondary phase7PrevRoute">← Previous route slide</button>
      <button type="button" class="primary phase7NextRoute">Next route slide →</button>
      <button type="button" class="secondary phase7Discuss">2-min discussion <b class="phase7DiscussionTime">2:00</b></button>
      <a class="secondary phase7Print" href="/facilitator?course=${encodeURIComponent(course.id)}&route=${safeRoute}" target="_blank">Print facilitator pack</a>
    </div>
    <div class="phase7AccessControls">
      <span>DISPLAY</span>
      <button type="button" data-access="large" aria-pressed="${modal.classList.contains("phase7-large")}">Larger text</button>
      <button type="button" data-access="contrast" aria-pressed="${modal.classList.contains("phase7-contrast")}">High contrast</button>
      <button type="button" data-access="quiet" aria-pressed="${modal.classList.contains("phase7-quiet")}">Low motion</button>
    </div>
    <div class="phase7ShortcutHelp">G facilitator · N presenter notes · F fullscreen · [ / ] route slides · Esc exits presentation</div>`;

  panel.querySelectorAll<HTMLButtonElement>("[data-route]").forEach(button => button.addEventListener("click", () => {
    const value = Number(button.dataset.route) as Phase7RouteMinutes;
    if (!PHASE7_SESSION_ROUTES.includes(value)) return;
    modal.dataset.phase7Route = String(value);
    saveRoute(value);
    updateConsole(modal, true);
  }));
  panel.querySelector<HTMLButtonElement>(".phase7PrevRoute")?.addEventListener("click", () => moveToRouteSlide(modal, -1, plan.selectedModuleIds, course.modules.map(item => item.id)));
  panel.querySelector<HTMLButtonElement>(".phase7NextRoute")?.addEventListener("click", () => moveToRouteSlide(modal, 1, plan.selectedModuleIds, course.modules.map(item => item.id)));
  panel.querySelector<HTMLButtonElement>(".phase7Discuss")?.addEventListener("click", () => discussionTimer(panel));
  panel.querySelectorAll<HTMLButtonElement>("[data-access]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.access as "large" | "contrast" | "quiet";
    const active = button.getAttribute("aria-pressed") !== "true";
    setAccessibility(modal, key, active);
    button.setAttribute("aria-pressed", String(active));
  }));
}

export default function CourseFacilitatorPhase7Controller() {
  useEffect(() => {
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => updateConsole(modal));
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ["class"] });

    const timer = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>(".courseModal.phase7FacilitatorMode").forEach(modal => updateConsole(modal, true));
    }, 30000);

    const keyHandler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) || event.target.isContentEditable)) return;
      const modal = document.querySelector<HTMLElement>(".courseModal:not(.labMode)");
      if (!modal) return;
      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        modal.querySelector<HTMLButtonElement>(".phase7FacilitatorToggle")?.click();
      }
      if (!modal.classList.contains("phase7FacilitatorMode")) return;
      const course = courseForModal(modal);
      if (!course) return;
      const route = Number(modal.dataset.phase7Route || readRoute()) as Phase7RouteMinutes;
      const plan = getPhase7FacilitatorPlan(course, PHASE7_SESSION_ROUTES.includes(route) ? route : 60);
      if (event.key === "]") {
        event.preventDefault();
        moveToRouteSlide(modal, 1, plan.selectedModuleIds, course.modules.map(item => item.id));
      }
      if (event.key === "[") {
        event.preventDefault();
        moveToRouteSlide(modal, -1, plan.selectedModuleIds, course.modules.map(item => item.id));
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);
  return null;
}
