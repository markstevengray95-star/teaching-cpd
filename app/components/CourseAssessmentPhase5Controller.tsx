"use client";

import { useEffect } from "react";

type Question = {
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  reteach: string;
};

type AttemptRecord = {
  attempts: number;
  latestPercent: number;
  bestPercent: number;
  latestScore: number;
  latestTotal: number;
  passed: boolean;
  weakTopics: string[];
  updatedAt: string;
};

type AssessmentKind = "diagnostic" | "retrieval" | "scenario" | "mastery" | "application";

const SEP = "§";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function parseQuestion(button: HTMLButtonElement): Question | null {
  const raw = clean(button.textContent);
  const start = raw.indexOf("[q|");
  const encoded = start >= 0 ? raw.slice(start) : raw;
  const match = encoded.match(/^\[q\|([^|]+)\|(\d+)\]\s*(.*)$/);
  if (!match) return null;
  const parts = match[3].split(SEP);
  if (parts.length < 7) return null;
  const answer = Number(match[2]);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  return {
    topic: match[1],
    prompt: parts[0],
    options: parts.slice(1, 5),
    answer,
    explanation: parts[5],
    reteach: parts[6],
  };
}

function kindFromTitle(title: string): AssessmentKind | null {
  if (title.includes("Diagnostic pre-check")) return "diagnostic";
  if (title.includes("Retrieval mastery sprint")) return "retrieval";
  if (title.includes("Scenario application assessment")) return "scenario";
  if (title.includes("Final understanding assessment")) return "mastery";
  if (title.includes("Demonstrated application gate")) return "application";
  return null;
}

function config(kind: AssessmentKind) {
  if (kind === "diagnostic") return { count: 5, threshold: 0, label: "Baseline", help: "No pass mark — use the result to identify what to revisit before the mastery checks." };
  if (kind === "retrieval") return { count: 5, threshold: 0.75, label: "Retrieval", help: "Reach at least 75%. A new attempt rotates the question set." };
  if (kind === "scenario") return { count: 4, threshold: 0.75, label: "Application", help: "Reach at least 75% by applying the course ideas to professional decisions." };
  if (kind === "mastery") return { count: 6, threshold: 0.8, label: "Mastery", help: "Reach at least 80% across purpose, evidence, inclusion, implementation and review." };
  return { count: 3, threshold: 1, label: "Application gate", help: "Secure all three professional judgement questions before moving to your implementation commitment." };
}

function selectQuestions(bank: Question[], count: number, attempt: number, kind: AssessmentKind) {
  if (!bank.length) return [];
  const offset = { diagnostic: 0, retrieval: 2, scenario: 4, mastery: 1, application: 3 }[kind];
  const start = (attempt * 2 + offset) % bank.length;
  let rotated = [...bank.slice(start), ...bank.slice(0, start)];
  if (attempt % 2 === 1) rotated = [...rotated.slice(0, 1), ...rotated.slice(1).reverse()];
  return rotated.slice(0, Math.min(count, rotated.length));
}

function optionView(question: Question, attempt: number, questionIndex: number) {
  const shift = (attempt + questionIndex) % 4;
  const options = [...question.options.slice(shift), ...question.options.slice(0, shift)];
  const answer = (question.answer - shift + 4) % 4;
  return { options, answer };
}

function makeButton(label: string, className: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function readRecord(key: string): AttemptRecord | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as AttemptRecord : null;
  } catch {
    return null;
  }
}

function saveRecord(key: string, value: AttemptRecord, courseTitle: string, kind: AssessmentKind) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  window.dispatchEvent(new CustomEvent("cpd:phase5-assessment", {
    detail: {
      courseTitle,
      key: `phase5:${kind}`,
      value: JSON.stringify(value),
    },
  }));
}

function buildAssessment(modal: HTMLElement, article: HTMLElement, completedKeys: Set<string>) {
  const title = clean(article.querySelector("h2")?.textContent);
  if (!title.startsWith("Phase 5 ·")) return;
  const kind = kindFromTitle(title);
  if (!kind) return;
  const optionList = article.querySelector<HTMLElement>(".optionList");
  if (!optionList) return;
  const originalButtons = Array.from(optionList.querySelectorAll<HTMLButtonElement>(".option"));
  const bank = originalButtons.map(parseQuestion).filter((question): question is Question => Boolean(question));
  if (!bank.length) return;

  const courseTitle = clean(modal.querySelector(".courseModalHead h2")?.textContent) || "Course";
  const key = `${courseTitle}|${title}`;
  const storageKey = `cpd-phase5:${key}`;
  const currentNav = modal.querySelector<HTMLElement>(".moduleNav button.current");
  const previouslyCompleted = completedKeys.has(key) || Boolean(currentNav?.classList.contains("done"));
  const existing = readRecord(storageKey);

  article.classList.add("phase5AssessmentSlide");
  optionList.style.display = "none";
  article.querySelector<HTMLElement>(".lead")?.style.setProperty("display", "none");
  article.querySelector<HTMLElement>(".feedback")?.style.setProperty("display", "none");
  if (article.dataset.phase5Signature === key && article.querySelector(".phase5AssessmentLab")) return;
  article.dataset.phase5Signature = key;
  article.querySelector(".phase5AssessmentLab")?.remove();

  const lab = document.createElement("section");
  lab.className = "phase5AssessmentLab";
  optionList.insertAdjacentElement("beforebegin", lab);

  let attempt = Math.max(0, existing?.attempts || 0);
  let questions: Question[] = [];
  let current = 0;
  let score = 0;
  let answered = false;
  const misses: Question[] = [];
  const cfg = config(kind);

  function header() {
    const best = readRecord(storageKey)?.bestPercent;
    return `<div class="phase5AssessmentHead"><div><span>PHASE 5 · ${escapeHtml(cfg.label.toUpperCase())}</span><strong>${escapeHtml(title.replace("Phase 5 · ", ""))}</strong><p>${escapeHtml(cfg.help)}</p></div><div class="phase5Best"><span>BEST</span><strong>${typeof best === "number" ? `${best}%` : "—"}</strong></div></div>`;
  }

  function begin(nextAttempt = false) {
    if (nextAttempt) attempt += 1;
    questions = selectQuestions(bank, cfg.count, attempt, kind);
    current = 0;
    score = 0;
    answered = false;
    misses.length = 0;
    lab.innerHTML = `${header()}<div class="phase5Progress"><span></span><b></b></div><div class="phase5Question"></div><div class="phase5AssessmentFeedback" aria-live="polite"></div>`;
    renderQuestion();
  }

  function renderQuestion() {
    const question = questions[current];
    if (!question) { finishAttempt(); return; }
    answered = false;
    const view = optionView(question, attempt, current);
    const progress = lab.querySelector<HTMLElement>(".phase5Progress span")!;
    const progressLabel = lab.querySelector<HTMLElement>(".phase5Progress b")!;
    const area = lab.querySelector<HTMLElement>(".phase5Question")!;
    const feedback = lab.querySelector<HTMLElement>(".phase5AssessmentFeedback")!;
    progress.style.width = `${(current / questions.length) * 100}%`;
    progressLabel.textContent = `Question ${current + 1} of ${questions.length}`;
    feedback.innerHTML = "";
    area.innerHTML = `<div class="phase5Topic">${escapeHtml(question.topic.replaceAll("-", " "))}</div><h3>${escapeHtml(question.prompt)}</h3><div class="phase5Choices"></div>`;
    const choices = area.querySelector<HTMLElement>(".phase5Choices")!;
    view.options.forEach((option, optionIndex) => {
      const button = makeButton(option, "phase5Choice");
      button.innerHTML = `<span>${String.fromCharCode(65 + optionIndex)}</span><b>${escapeHtml(option)}</b>`;
      button.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const correct = optionIndex === view.answer;
        if (correct) score += 1;
        else misses.push(question);
        Array.from(choices.querySelectorAll<HTMLButtonElement>("button")).forEach((node, index) => {
          node.disabled = true;
          node.classList.toggle("correct", index === view.answer);
          node.classList.toggle("wrong", index === optionIndex && !correct);
        });
        feedback.className = `phase5AssessmentFeedback ${correct ? "good" : "retry"}`;
        feedback.innerHTML = `<strong>${correct ? "Correct" : "Not quite"}</strong><p>${escapeHtml(question.explanation)}</p>${!correct ? `<div class="phase5Reteach"><span>RETEACH</span>${escapeHtml(question.reteach)}</div>` : ""}`;
        const next = makeButton(current === questions.length - 1 ? "See results" : "Next question", "primary phase5Next");
        next.addEventListener("click", () => { current += 1; renderQuestion(); });
        feedback.appendChild(next);
      });
      choices.appendChild(button);
    });
  }

  function finishAttempt() {
    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    const required = Math.ceil(cfg.threshold * questions.length);
    const passed = kind === "diagnostic" || score >= required;
    const previous = readRecord(storageKey);
    const record: AttemptRecord = {
      attempts: Math.max((previous?.attempts || 0) + 1, attempt + 1),
      latestPercent: percent,
      bestPercent: Math.max(previous?.bestPercent || 0, percent),
      latestScore: score,
      latestTotal: questions.length,
      passed: Boolean(previous?.passed || passed),
      weakTopics: [...new Set(misses.map(question => question.topic))],
      updatedAt: new Date().toISOString(),
    };
    saveRecord(storageKey, record, courseTitle, kind);
    const progress = lab.querySelector<HTMLElement>(".phase5Progress span")!;
    const progressLabel = lab.querySelector<HTMLElement>(".phase5Progress b")!;
    const area = lab.querySelector<HTMLElement>(".phase5Question")!;
    const feedback = lab.querySelector<HTMLElement>(".phase5AssessmentFeedback")!;
    progress.style.width = "100%";
    progressLabel.textContent = `${score}/${questions.length} · ${percent}%`;
    area.innerHTML = `<div class="phase5ResultDial"><strong>${percent}%</strong><span>${kind === "diagnostic" ? "diagnostic baseline" : passed ? "mastery secured" : "mastery not yet secure"}</span></div>`;

    if (passed) {
      completedKeys.add(key);
      if (!originalButtons.some(button => button.classList.contains("selected"))) originalButtons[0]?.click();
      feedback.className = "phase5AssessmentFeedback good";
      feedback.innerHTML = `<strong>${kind === "diagnostic" ? "Baseline captured" : "Assessment passed"}</strong><p>${kind === "diagnostic" ? "Use the weak-area summary below to decide what deserves extra attention during the course." : `You reached the required standard. Best score: ${record.bestPercent}%. The underlying course module is now unlocked for completion.`}</p>`;
    } else {
      feedback.className = "phase5AssessmentFeedback retry";
      feedback.innerHTML = `<strong>Targeted reteach required</strong><p>You need ${required}/${questions.length}. Review the missed ideas, then retry. The next attempt rotates the question set.</p>`;
    }

    if (misses.length) {
      const reteach = document.createElement("div");
      reteach.className = "phase5ReteachGrid";
      const unique = Array.from(new Map(misses.map(question => [question.topic, question])).values());
      reteach.innerHTML = unique.map(question => `<article><span>${escapeHtml(question.topic.replaceAll("-", " "))}</span><p>${escapeHtml(question.reteach)}</p></article>`).join("");
      feedback.appendChild(reteach);
    }

    if (!passed) {
      const retry = makeButton("Reteach complete — try a new set", "primary phase5Retry");
      retry.addEventListener("click", () => begin(true));
      feedback.appendChild(retry);
    } else {
      const repeat = makeButton("Practise with another set", "secondary phase5Retry");
      repeat.addEventListener("click", () => begin(true));
      feedback.appendChild(repeat);
    }
  }

  begin(false);

  if (previouslyCompleted) {
    lab.classList.add("previouslyCompleted");
    const badge = document.createElement("div");
    badge.className = "phase5CompletedBadge";
    badge.innerHTML = `<span>✓</span><div><strong>Assessment module already completed</strong><small>You can still repeat it. Latest and best attempts continue to update.</small></div>`;
    lab.prepend(badge);
  }
}

export default function CourseAssessmentPhase5Controller() {
  useEffect(() => {
    const completedKeys = new Set<string>();
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.labMode)").forEach(modal => {
          const article = modal.querySelector<HTMLElement>(".moduleContent");
          if (article) buildAssessment(modal, article, completedKeys);
        });
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
