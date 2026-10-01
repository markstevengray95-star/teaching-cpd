"use client";

import { useEffect } from "react";
import { parsePracticeOption } from "@/lib/practiceOptionParsing";

type PracticeItem = { index: number; tag: string; label: string; button: HTMLButtonElement };

type BuildContext = {
  article: HTMLElement;
  modal: HTMLElement;
  lab: HTMLElement;
  items: PracticeItem[];
  key: string;
  complete: (message: string) => void;
};

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function parseItem(button: HTMLButtonElement, index: number): PracticeItem {
  const parsed = parsePracticeOption(clean(button.textContent));
  return { index, tag: button.dataset.practiceTag || parsed.tag, label: parsed.label.replace(/^\d+(?=[A-Za-z])/, ""), button };
}

function mixed<T>(items: T[]) {
  if (items.length < 3) return [...items].reverse();
  const rotated = [...items.slice(2), ...items.slice(0, 2)];
  const result: T[] = [];
  for (let i = 0; i < rotated.length; i += 2) {
    if (rotated[i + 1] !== undefined) result.push(rotated[i + 1]);
    result.push(rotated[i]);
  }
  return result;
}

function statusBox(lab: HTMLElement) {
  let status = lab.querySelector<HTMLElement>(".phase4PracticeStatus");
  if (!status) {
    status = document.createElement("div");
    status.className = "phase4PracticeStatus";
    status.setAttribute("aria-live", "polite");
    lab.appendChild(status);
  }
  return status;
}

function setStatus(lab: HTMLElement, kind: "info" | "good" | "retry", title: string, text: string) {
  const status = statusBox(lab);
  status.className = `phase4PracticeStatus ${kind}`;
  status.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
}

function makeButton(label: string, className = "phase4PracticeButton") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function buildCategorise(ctx: BuildContext, categories: { id: string; label: string; help: string }[]) {
  const { lab, items, complete } = ctx;
  const placements = new Map<number, string>();
  let dragging: number | null = null;

  lab.innerHTML = `<div class="phase4PracticeHead"><span>ADVANCED PRACTICE · SORTING</span><strong>Build the evidence board</strong><p>Drag cards into a column, or use the category buttons on each card. Then check the whole board.</p></div>`;
  const board = document.createElement("div");
  board.className = `phase4SortBoard cols-${categories.length}`;
  const pool = document.createElement("div");
  pool.className = "phase4CardPool";
  pool.innerHTML = `<div class="phase4DropTitle"><strong>Unsorted evidence</strong><span>${items.length} cards</span></div><div class="phase4DropItems"></div>`;
  board.appendChild(pool);

  const zones = new Map<string, HTMLElement>();
  categories.forEach(category => {
    const zone = document.createElement("div");
    zone.className = "phase4DropZone";
    zone.dataset.category = category.id;
    zone.innerHTML = `<div class="phase4DropTitle"><strong>${escapeHtml(category.label)}</strong><span>${escapeHtml(category.help)}</span></div><div class="phase4DropItems"></div>`;
    zone.addEventListener("dragover", event => { event.preventDefault(); zone.classList.add("dragOver"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragOver"));
    zone.addEventListener("drop", event => {
      event.preventDefault();
      zone.classList.remove("dragOver");
      if (dragging !== null) assign(dragging, category.id);
    });
    zones.set(category.id, zone);
    board.appendChild(zone);
  });

  const cardMap = new Map<number, HTMLElement>();
  mixed(items).forEach(item => {
    const card = document.createElement("article");
    card.className = "phase4SortCard";
    card.draggable = true;
    card.dataset.item = String(item.index);
    card.innerHTML = `<p>${escapeHtml(item.label)}</p><div class="phase4CardChoices"></div>`;
    card.addEventListener("dragstart", () => { dragging = item.index; card.classList.add("dragging"); });
    card.addEventListener("dragend", () => { dragging = null; card.classList.remove("dragging"); });
    const choices = card.querySelector<HTMLElement>(".phase4CardChoices")!;
    categories.forEach(category => {
      const button = makeButton(category.label, "phase4MiniChoice");
      button.addEventListener("click", () => assign(item.index, category.id));
      choices.appendChild(button);
    });
    cardMap.set(item.index, card);
    pool.querySelector(".phase4DropItems")!.appendChild(card);
  });

  function assign(index: number, category: string) {
    placements.set(index, category);
    const card = cardMap.get(index);
    const zone = zones.get(category);
    if (!card || !zone) return;
    card.classList.remove("wrong");
    card.dataset.placed = category;
    zone.querySelector(".phase4DropItems")!.appendChild(card);
  }

  lab.appendChild(board);
  const actions = document.createElement("div");
  actions.className = "phase4PracticeActions";
  const reset = makeButton("Reset board", "secondary phase4PracticeButton");
  const check = makeButton("Check board", "primary phase4PracticeButton");
  reset.addEventListener("click", () => {
    placements.clear();
    cardMap.forEach(card => { card.classList.remove("wrong"); delete card.dataset.placed; pool.querySelector(".phase4DropItems")!.appendChild(card); });
    setStatus(lab, "info", "Board reset", "Sort every card, then check your decisions.");
  });
  check.addEventListener("click", () => {
    if (placements.size !== items.length) {
      setStatus(lab, "retry", "Finish the board first", `${items.length - placements.size} card(s) still need a category.`);
      return;
    }
    const wrong = items.filter(item => placements.get(item.index) !== item.tag);
    cardMap.forEach((card, index) => card.classList.toggle("wrong", wrong.some(item => item.index === index)));
    if (wrong.length) {
      setStatus(lab, "retry", "Recheck the highlighted cards", `${wrong.length} decision(s) need another look. Focus on what the evidence can genuinely tell you.`);
      return;
    }
    setStatus(lab, "good", "Evidence board complete", "You separated useful evidence from weaker signals accurately.");
    complete("Advanced evidence sorting completed accurately.");
  });
  actions.append(reset, check);
  lab.appendChild(actions);
  setStatus(lab, "info", "Your turn", "Complete the whole board before checking. Drag-and-drop and tap controls are both available.");
}

function buildRank(ctx: BuildContext) {
  const { lab, items, complete } = ctx;
  let order = mixed(items);
  let dragIndex: number | null = null;
  lab.innerHTML = `<div class="phase4PracticeHead"><span>ADVANCED PRACTICE · RANKING</span><strong>Rebuild the professional sequence</strong><p>Drag the steps or use the arrow controls. The strongest sequence moves from purpose and evidence to action and review.</p></div><div class="phase4RankList"></div>`;
  const list = lab.querySelector<HTMLElement>(".phase4RankList")!;

  function render() {
    list.innerHTML = "";
    order.forEach((item, position) => {
      const row = document.createElement("div");
      row.className = "phase4RankCard";
      row.draggable = true;
      row.innerHTML = `<span>${position + 1}</span><strong>${escapeHtml(item.label)}</strong><div class="phase4RankTools"></div>`;
      row.addEventListener("dragstart", () => { dragIndex = position; row.classList.add("dragging"); });
      row.addEventListener("dragend", () => { dragIndex = null; row.classList.remove("dragging"); });
      row.addEventListener("dragover", event => event.preventDefault());
      row.addEventListener("drop", event => {
        event.preventDefault();
        if (dragIndex === null || dragIndex === position) return;
        const next = [...order];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(position, 0, moved);
        order = next;
        render();
      });
      const tools = row.querySelector<HTMLElement>(".phase4RankTools")!;
      const up = makeButton("↑", "phase4RankArrow");
      const down = makeButton("↓", "phase4RankArrow");
      up.disabled = position === 0;
      down.disabled = position === order.length - 1;
      up.setAttribute("aria-label", `Move ${item.label} up`);
      down.setAttribute("aria-label", `Move ${item.label} down`);
      up.addEventListener("click", () => { [order[position - 1], order[position]] = [order[position], order[position - 1]]; render(); });
      down.addEventListener("click", () => { [order[position + 1], order[position]] = [order[position], order[position + 1]]; render(); });
      tools.append(up, down);
      list.appendChild(row);
    });
  }
  render();
  const actions = document.createElement("div");
  actions.className = "phase4PracticeActions";
  const check = makeButton("Check sequence", "primary phase4PracticeButton");
  check.addEventListener("click", () => {
    const correct = order.every((item, index) => Number(item.tag.split(":")[1]) === index + 1);
    if (!correct) {
      list.querySelectorAll(".phase4RankCard").forEach((row, index) => row.classList.toggle("wrong", Number(order[index].tag.split(":")[1]) !== index + 1));
      setStatus(lab, "retry", "Sequence needs another look", "The highlighted steps are out of position. Start with purpose, then diagnose, act, check and review.");
      return;
    }
    list.querySelectorAll(".phase4RankCard").forEach(row => row.classList.remove("wrong"));
    setStatus(lab, "good", "Sequence complete", "You rebuilt the professional decision cycle in a defensible order.");
    complete("Advanced response-ranking activity completed accurately.");
  });
  actions.appendChild(check);
  lab.appendChild(actions);
  setStatus(lab, "info", "Build the sequence", "Move every step into the order you would actually use in practice.");
}

function buildHotspot(ctx: BuildContext) {
  const { lab, items, complete } = ctx;
  const selected = new Set<number>();
  lab.innerHTML = `<div class="phase4PracticeHead"><span>ADVANCED PRACTICE · HOTSPOT</span><strong>Investigate before you judge</strong><p>Select the three parts of the situation you would investigate first. Click a hotspot to inspect it.</p></div><div class="phase4HotspotMap"></div>`;
  const map = lab.querySelector<HTMLElement>(".phase4HotspotMap")!;
  mixed(items).forEach((item, position) => {
    const button = makeButton("", "phase4Hotspot");
    const [heading, detail = ""] = item.label.split(" — ");
    button.innerHTML = `<span>${position + 1}</span><strong>${escapeHtml(heading)}</strong><small>${escapeHtml(detail)}</small>`;
    button.addEventListener("click", () => {
      if (selected.has(item.index)) selected.delete(item.index);
      else if (selected.size < 3) selected.add(item.index);
      else { setStatus(lab, "retry", "Choose only three", "Deselect one hotspot before selecting another."); return; }
      button.classList.toggle("selected", selected.has(item.index));
      setStatus(lab, "info", `${selected.size}/3 selected`, selected.size < 3 ? "Choose the areas that give you the most diagnostic information." : "Check your three priorities when ready.");
    });
    map.appendChild(button);
  });
  const actions = document.createElement("div");
  actions.className = "phase4PracticeActions";
  const check = makeButton("Check priorities", "primary phase4PracticeButton");
  check.addEventListener("click", () => {
    if (selected.size !== 3) { setStatus(lab, "retry", "Select three hotspots", "Choose exactly three areas to investigate first."); return; }
    const priorities = items.filter(item => item.tag === "hotspot:priority").map(item => item.index);
    const correct = priorities.every(index => selected.has(index));
    if (!correct) {
      setStatus(lab, "retry", "Refine your priorities", "Some selected areas may matter, but they are less diagnostic than purpose, evidence, access, safety or implementation conditions in this case.");
      return;
    }
    setStatus(lab, "good", "Priority hotspots identified", "You focused first on the areas most likely to explain what is happening and what action is justified.");
    complete("Hotspot investigation completed accurately.");
  });
  actions.appendChild(check);
  lab.appendChild(actions);
  setStatus(lab, "info", "0/3 selected", "Choose the three hotspots you would investigate before making a professional judgement.");
}

function buildBranch(ctx: BuildContext, prefix: "branch" | "sim") {
  const { lab, items, complete } = ctx;
  const grouped = new Map<number, PracticeItem[]>();
  items.forEach(item => {
    const parts = item.tag.split(":");
    const stage = Number(parts[1]);
    if (!grouped.has(stage)) grouped.set(stage, []);
    grouped.get(stage)!.push(item);
  });
  let stage = 1;
  let score = 0;
  const decisions: string[] = [];
  lab.innerHTML = `<div class="phase4PracticeHead"><span>ADVANCED PRACTICE · ${prefix === "sim" ? "SIMULATION" : "BRANCHING CASE"}</span><strong>${prefix === "sim" ? "Run the implementation cycle" : "Your choices change the route"}</strong><p>There are three rounds. Choose a response, read the consequence, then continue.</p></div><div class="phase4BranchProgress"><span></span><b>Round 1 of 3</b></div><div class="phase4BranchChoices"></div>`;
  const choices = lab.querySelector<HTMLElement>(".phase4BranchChoices")!;
  const bar = lab.querySelector<HTMLElement>(".phase4BranchProgress span")!;
  const label = lab.querySelector<HTMLElement>(".phase4BranchProgress b")!;

  function renderStage() {
    choices.innerHTML = "";
    label.textContent = `Round ${stage} of 3`;
    bar.style.width = `${((stage - 1) / 3) * 100}%`;
    const stageItems = mixed(grouped.get(stage) || []);
    stageItems.forEach(item => {
      const quality = item.tag.split(":")[2] as "best" | "okay" | "risk";
      const button = makeButton(item.label, "phase4BranchChoice");
      button.addEventListener("click", () => {
        choices.querySelectorAll("button").forEach(node => { (node as HTMLButtonElement).disabled = true; });
        score += quality === "best" ? 2 : quality === "okay" ? 1 : 0;
        decisions.push(item.label);
        const consequence = quality === "best"
          ? "Strong decision: the response stays close to evidence, purpose and proportionate action."
          : quality === "okay"
            ? "Partly useful, but there is a gap in diagnosis, clarity or evidence that could weaken the next decision."
            : "Risky decision: this route relies too heavily on assumption, overload or premature judgement.";
        setStatus(lab, quality === "best" ? "good" : quality === "okay" ? "info" : "retry", `Round ${stage} consequence`, consequence);
        const next = makeButton(stage === 3 ? "Finish simulation" : "Continue to next round", "primary phase4PracticeButton phase4NextRound");
        next.addEventListener("click", () => {
          next.remove();
          if (stage < 3) { stage += 1; renderStage(); return; }
          bar.style.width = "100%";
          label.textContent = `Score ${score}/6`;
          choices.innerHTML = `<div class="phase4DecisionTrail">${decisions.map((decision, index) => `<div><span>${index + 1}</span><p>${escapeHtml(decision)}</p></div>`).join("")}</div>`;
          if (score >= 4) {
            setStatus(lab, "good", `${prefix === "sim" ? "Implementation simulation" : "Branching case"} complete · ${score}/6`, "Your route preserved enough evidence, clarity and professional judgement to move forward.");
            complete(`${prefix === "sim" ? "Implementation simulation" : "Branching case"} completed with a score of ${score}/6.`);
          } else {
            setStatus(lab, "retry", `Score ${score}/6 · try the case again`, "Revisit the early decisions. Stronger routes diagnose before acting and use evidence before escalating or adding complexity.");
            const retry = makeButton("Try again", "secondary phase4PracticeButton");
            retry.addEventListener("click", () => { stage = 1; score = 0; decisions.length = 0; renderStage(); setStatus(lab, "info", "New attempt", "Aim for at least 4/6 by keeping decisions evidence-led and proportionate."); });
            lab.querySelector(".phase4PracticeStatus")?.insertAdjacentElement("afterend", retry);
          }
        });
        lab.appendChild(next);
      });
      choices.appendChild(button);
    });
  }
  renderStage();
  setStatus(lab, "info", "Round 1", "Choose the response you would genuinely take, not the one that simply sounds most formal.");
}

function buildForArticle(modal: HTMLElement, article: HTMLElement, completedKeys: Set<string>) {
  const title = clean(article.querySelector("h2")?.textContent);
  if (!title.startsWith("Phase 4 ·")) return;
  const signature = title;
  const optionList = article.querySelector<HTMLElement>(".optionList");
  if (!optionList) return;
  const originalButtons = Array.from(optionList.querySelectorAll<HTMLButtonElement>(".option"));
  if (!originalButtons.length) return;
  const currentNav = modal.querySelector<HTMLElement>(".moduleNav button.current");
  const courseTitle = clean(modal.querySelector(".courseModalHead h2")?.textContent);
  const key = `${courseTitle}|${title}`;
  const alreadyCompleted = completedKeys.has(key) || Boolean(currentNav?.classList.contains("done")) || originalButtons.some(button => button.classList.contains("selected"));

  article.classList.add("phase4AdvancedSlide");
  optionList.style.display = "none";
  article.querySelector<HTMLElement>(".feedback")?.style.setProperty("display", "none");
  if (article.dataset.phase4Signature === signature && article.querySelector(".phase4PracticeLab")) return;
  article.dataset.phase4Signature = signature;
  article.querySelector(".phase4PracticeLab")?.remove();

  const lab = document.createElement("section");
  lab.className = "phase4PracticeLab";
  optionList.insertAdjacentElement("beforebegin", lab);
  const items = originalButtons.map(parseItem);

  const complete = (message: string) => {
    completedKeys.add(key);
    lab.classList.add("completed");
    if (!originalButtons.some(button => button.classList.contains("selected"))) originalButtons[0]?.click();
    window.localStorage.setItem(`cpd-phase4:${key}`, JSON.stringify({ completed: true, message, at: new Date().toISOString() }));
  };

  if (alreadyCompleted && !completedKeys.has(key)) {
    completedKeys.add(key);
  }

  if (title.includes("Sort the evidence")) {
    buildCategorise({ article, modal, lab, items, key, complete }, [
      { id: "strong", label: "Stronger evidence", help: "Observable and decision-useful" },
      { id: "weak", label: "Weak / assumption", help: "Proxy, inference or overclaim" },
    ]);
  } else if (title.includes("Evidence analyst")) {
    buildCategorise({ article, modal, lab, items, key, complete }, [
      { id: "implementation", label: "Implementation", help: "Did the agreed practice happen?" },
      { id: "impact", label: "Impact", help: "Did the intended outcome change?" },
      { id: "weak", label: "Weak / insufficient", help: "Cannot answer either question alone" },
    ]);
  } else if (title.includes("Rank the professional response")) {
    buildRank({ article, modal, lab, items, key, complete });
  } else if (title.includes("Hotspot investigation")) {
    buildHotspot({ article, modal, lab, items, key, complete });
  } else if (title.includes("Branching case")) {
    buildBranch({ article, modal, lab, items, key, complete }, "branch");
  } else if (title.includes("Implementation simulator")) {
    buildBranch({ article, modal, lab, items, key, complete }, "sim");
  }

  if (alreadyCompleted) {
    lab.classList.add("previouslyCompleted");
    const badge = document.createElement("div");
    badge.className = "phase4CompletedBadge";
    badge.innerHTML = `<span>✓</span><div><strong>Practice completed</strong><small>You can repeat the activity for rehearsal; your existing course completion remains saved.</small></div>`;
    lab.prepend(badge);
  }
}

export default function CoursePracticePhase4Controller() {
  useEffect(() => {
    const completedKeys = new Set<string>();
    let scheduled = false;
    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.labMode):not(.shortCoursePresentation)").forEach(modal => {
          const article = modal.querySelector<HTMLElement>(".moduleContent");
          if (article) buildForArticle(modal, article, completedKeys);
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
