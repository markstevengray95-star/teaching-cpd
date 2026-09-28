"use client";

import { useEffect } from "react";

const STAGE_LABELS: Record<string, string> = {
  CONTENT: "Learn",
  VISUAL: "Explore",
  QUIZ: "Check",
  SCENARIO: "Decide",
  ACTIVITY: "Practise",
  CHECKLIST: "Apply",
  REFLECTION: "Reflect",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

function ensurePresentationToggle(modal: HTMLElement) {
  const actions = modal.querySelector<HTMLElement>(".courseModalHeadActions");
  if (!actions || actions.querySelector(".presentationModeToggle")) return;

  const presentButton = document.createElement("button");
  presentButton.type = "button";
  presentButton.className = "secondary presentationModeToggle";
  presentButton.textContent = modal.classList.contains("presentationFocus") ? "Exit presentation" : "Present";
  presentButton.setAttribute("aria-pressed", String(modal.classList.contains("presentationFocus")));
  presentButton.addEventListener("click", () => {
    const focused = modal.classList.toggle("presentationFocus");
    presentButton.textContent = focused ? "Exit presentation" : "Present";
    presentButton.setAttribute("aria-pressed", String(focused));
  });
  actions.prepend(presentButton);
}

function decoratePresentation(modal: HTMLElement) {
  if (modal.classList.contains("labMode")) return;
  const nav = modal.querySelector<HTMLElement>(".moduleNav");
  const article = modal.querySelector<HTMLElement>(".moduleContent");
  if (!nav || !article) return;

  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
  const currentIndex = buttons.findIndex(button => button.classList.contains("current"));
  if (currentIndex < 0) return;

  const moduleType = (article.querySelector(".moduleType")?.textContent || "CONTENT").trim().toUpperCase();
  const progressText = modal.querySelector<HTMLElement>(".courseProgress span")?.textContent || "";
  const completedPreviously = /completed previously/i.test(progressText);

  // Always re-apply the actual control state. React may recreate these buttons without
  // changing the visible presentation state, so this must not sit behind the signature guard.
  buttons.forEach((button, index) => {
    const current = button.classList.contains("current");
    const done = button.classList.contains("done");
    const unlocked = completedPreviously || current || done;
    button.disabled = !unlocked;
    button.setAttribute("aria-disabled", String(!unlocked));
    button.classList.toggle("presentationLocked", !unlocked);
    if (current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    const title = button.querySelector("strong")?.textContent?.trim() || `Slide ${index + 1}`;
    button.setAttribute("aria-label", `${unlocked ? "" : "Locked. "}Slide ${index + 1} of ${buttons.length}: ${title}`);
  });

  ensurePresentationToggle(modal);

  const stateSignature = `${currentIndex}|${moduleType}|${completedPreviously ? 1 : 0}|${buttons.map(button => `${button.classList.contains("done") ? 1 : 0}${button.classList.contains("current") ? 1 : 0}`).join("")}`;
  if (modal.dataset.presentationSignature === stateSignature) return;
  modal.dataset.presentationSignature = stateSignature;

  const stage = STAGE_LABELS[moduleType] || "Learn";
  article.dataset.presentationStage = stage;
  article.dataset.slideNumber = String(currentIndex + 1);

  let meta = article.querySelector<HTMLElement>(".presentationSlideMeta");
  if (!meta) {
    meta = document.createElement("div");
    meta.className = "presentationSlideMeta";
    article.prepend(meta);
  }
  meta.replaceChildren();

  const stageBadge = document.createElement("span");
  stageBadge.className = "presentationStageBadge";
  stageBadge.textContent = stage;
  const counter = document.createElement("span");
  counter.className = "presentationSlideCounter";
  counter.textContent = `Slide ${currentIndex + 1} of ${buttons.length}`;
  const hint = document.createElement("span");
  hint.className = "presentationKeyboardHint";
  hint.textContent = completedPreviously ? "← / → review slides" : "← back · → next when complete";
  meta.append(stageBadge, counter, hint);

  let dots = article.querySelector<HTMLElement>(".presentationDots");
  if (!dots) {
    dots = document.createElement("div");
    dots.className = "presentationDots";
    meta.after(dots);
  }
  dots.replaceChildren();
  buttons.forEach((button, index) => {
    const dot = document.createElement("span");
    dot.className = `presentationDot${index === currentIndex ? " current" : ""}${button.classList.contains("done") ? " done" : ""}`;
    dot.title = `Slide ${index + 1}`;
    dots!.append(dot);
  });
}

export default function CoursePresentationController() {
  useEffect(() => {
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(decoratePresentation);
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ["class"] });

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const modal = document.querySelector<HTMLElement>(".courseModal:not(.labMode)");
      if (!modal) return;

      if (event.key === "Escape" && modal.classList.contains("presentationFocus")) {
        event.preventDefault();
        modal.querySelector<HTMLButtonElement>(".presentationModeToggle")?.click();
        return;
      }

      const navButtons = Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button"));
      const currentIndex = navButtons.findIndex(button => button.classList.contains("current"));
      const completedPreviously = /completed previously/i.test(modal.querySelector<HTMLElement>(".courseProgress span")?.textContent || "");

      if (event.key === "ArrowLeft") {
        const back = modal.querySelector<HTMLButtonElement>(".moduleActions .secondary:not(:disabled)");
        if (back) {
          event.preventDefault();
          back.click();
        }
      }

      if (event.key === "ArrowRight") {
        if (completedPreviously && currentIndex >= 0 && currentIndex < navButtons.length - 1) {
          const nextSlide = navButtons[currentIndex + 1];
          if (!nextSlide.disabled) {
            event.preventDefault();
            nextSlide.click();
            return;
          }
        }
        const primary = modal.querySelector<HTMLButtonElement>(".moduleActions .primary:not(:disabled)");
        if (primary && /next (module|slide)|finish course/i.test(primary.textContent || "")) {
          event.preventDefault();
          primary.click();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
