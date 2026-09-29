"use client";

import { useEffect } from "react";

function text(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function sentence(value: string) {
  const clean = text(value);
  const first = clean.match(/^.*?[.!?](?:\s|$)/)?.[0] || clean;
  return first.length > 220 ? `${first.slice(0, 217)}…` : first;
}

function slideGuide(stage: string, title: string) {
  const shared = {
    Learn: ["Explain the principle before naming the technique.", "Ask: What problem is this intended to solve?", "3–5 min"],
    Explore: ["Use the visual as the explanation; do not read every card aloud.", "Ask staff to predict the next step before revealing it.", "3–4 min"],
    Check: ["Give thinking time before taking responses.", "Ask for the reasoning behind the answer, not only the option.", "2–3 min"],
    Decide: ["Let staff commit to a response before discussing alternatives.", "Ask: What evidence made that option stronger?", "4–6 min"],
    Practise: ["Protect rehearsal time; the activity is the learning, not an optional extra.", "Ask staff to name the evidence they would look for afterwards.", "6–10 min"],
    Apply: ["Turn the checklist into a concrete implementation plan.", "Ask: What will you actually do differently this week?", "4–6 min"],
    Reflect: ["Allow quiet thinking before paired or whole-group discussion.", "Ask for one change, one measure and one review point.", "3–5 min"],
  } as const;
  const [move, ask, timing] = shared[stage as keyof typeof shared] || shared.Learn;
  return { move, ask, timing, title };
}

function ensureControls(modal: HTMLElement) {
  const actions = modal.querySelector<HTMLElement>(".courseModalHeadActions");
  if (!actions || actions.querySelector(".phase3PresenterTools")) return;

  const tools = document.createElement("div");
  tools.className = "phase3PresenterTools";

  const timer = document.createElement("span");
  timer.className = "phase3SessionTimer";
  timer.textContent = "00:00";
  tools.appendChild(timer);

  const notes = document.createElement("button");
  notes.type = "button";
  notes.className = "secondary phase3NotesToggle";
  notes.textContent = "Presenter notes";
  notes.addEventListener("click", () => {
    const open = modal.classList.toggle("phase3NotesOpen");
    notes.textContent = open ? "Hide notes" : "Presenter notes";
    notes.setAttribute("aria-pressed", String(open));
  });
  tools.appendChild(notes);

  const fullscreen = document.createElement("button");
  fullscreen.type = "button";
  fullscreen.className = "secondary phase3Fullscreen";
  fullscreen.textContent = "Full screen";
  fullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await modal.requestFullscreen?.();
  });
  tools.appendChild(fullscreen);

  actions.prepend(tools);
  modal.dataset.phase3Start = String(Date.now());
}

function ensureNotes(modal: HTMLElement) {
  if (!modal.querySelector(".phase3PresenterNotes")) {
    const panel = document.createElement("aside");
    panel.className = "phase3PresenterNotes";
    modal.appendChild(panel);
  }
}

function keyPointTexts(article: HTMLElement) {
  const revealed = Array.from(article.querySelectorAll<HTMLElement>(".autoRevealIdea"))
    .map(item => text(item.getAttribute("aria-label")?.split(":").slice(1).join(":")))
    .filter(Boolean);
  if (revealed.length) return revealed.slice(0, 3);
  return Array.from(article.querySelectorAll<HTMLElement>(".keyPoints > div"))
    .map(item => text(item.textContent))
    .filter(Boolean)
    .slice(0, 3);
}

function updatePresenter(modal: HTMLElement) {
  if (modal.classList.contains("labMode")) return;
  const article = modal.querySelector<HTMLElement>(".moduleContent");
  if (!article) return;
  ensureControls(modal);
  ensureNotes(modal);

  const title = text(article.querySelector("h2")?.textContent) || "Current slide";
  const stage = article.dataset.presentationStage || "Learn";
  const lead = text(article.querySelector(".lead")?.textContent || article.querySelector(".scenarioBox")?.textContent || article.querySelector(".visualExplainer>p")?.textContent);
  const points = keyPointTexts(article);
  const signature = `${title}|${stage}|${lead}|${points.join("|")}`;
  if (article.dataset.phase3PresenterSignature === signature) return;
  article.dataset.phase3PresenterSignature = signature;

  article.classList.toggle("phase3DividerSlide", /^Section \d|^Opening challenge|^Course recap/i.test(title));

  article.querySelector(".phase3PresenterTakeaway")?.remove();
  const takeaway = document.createElement("div");
  takeaway.className = "phase3PresenterTakeaway";
  takeaway.innerHTML = `<span>ON-SCREEN TAKEAWAY</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(sentence(lead || points[0] || title))}</p>${points.length ? `<ul>${points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}`;
  const dots = article.querySelector(".presentationDots");
  if (dots) dots.insertAdjacentElement("afterend", takeaway);
  else article.prepend(takeaway);

  const guide = slideGuide(stage, title);
  const notes = modal.querySelector<HTMLElement>(".phase3PresenterNotes")!;
  notes.innerHTML = `<div class="phase3NotesHead"><span>PRESENTER VIEW</span><strong>${escapeHtml(title)}</strong></div><div class="phase3NoteBlock"><b>Purpose</b><p>${escapeHtml(sentence(lead || title))}</p></div><div class="phase3NoteBlock"><b>Facilitator move</b><p>${escapeHtml(guide.move)}</p></div><div class="phase3NoteBlock"><b>Ask the room</b><p>${escapeHtml(guide.ask)}</p></div><div class="phase3NoteBlock"><b>Suggested time</b><p>${guide.timing}</p></div><div class="phase3ShortcutHelp">← / → slides · N notes · F fullscreen · Esc exit presentation</div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

export default function CoursePresenterPhase3Controller() {
  useEffect(() => {
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal").forEach(updatePresenter);
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ["class"] });

    const timer = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>(".courseModal").forEach(modal => {
        const output = modal.querySelector<HTMLElement>(".phase3SessionTimer");
        const start = Number(modal.dataset.phase3Start || Date.now());
        if (!output) return;
        const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
        output.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      });
    }, 1000);

    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) || event.target.isContentEditable)) return;
      const modal = document.querySelector<HTMLElement>(".courseModal:not(.labMode)");
      if (!modal) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        modal.querySelector<HTMLButtonElement>(".phase3NotesToggle")?.click();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        modal.querySelector<HTMLButtonElement>(".phase3Fullscreen")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
