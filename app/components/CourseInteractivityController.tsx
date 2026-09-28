"use client";

import { useEffect } from "react";

const ENHANCED = "data-cpd-interactive";

export default function CourseInteractivityController() {
  useEffect(() => {
    const cleanups = new Map<Element, () => void>();

    function listen(el: Element, event: string, handler: EventListener) {
      el.addEventListener(event, handler);
      return () => el.removeEventListener(event, handler);
    }

    function enhanceKeyPoints(root: ParentNode = document) {
      root.querySelectorAll<HTMLElement>(`.keyPoints:not([${ENHANCED}])`).forEach(box => {
        box.setAttribute(ENHANCED, "true");
        const children = Array.from(box.querySelectorAll<HTMLElement>(":scope > div"));
        if (!children.length) return;
        const progress = document.createElement("div");
        progress.className = "interactiveAutoProgress";
        progress.innerHTML = `<span>CLICK TO REVEAL KEY IDEAS</span><b>0/${children.length} explored</b>`;
        box.insertBefore(progress, children[0]);
        const revealed = new Set<number>();
        const offs: (() => void)[] = [];
        children.forEach((item, index) => {
          const original = item.textContent?.replace(/^✓\s*/, "").trim() || "Key idea";
          item.classList.add("autoRevealIdea");
          item.tabIndex = 0;
          item.setAttribute("role", "button");
          item.setAttribute("aria-label", `Reveal key idea ${index + 1}: ${original}`);
          item.innerHTML = `<span class="autoRevealNumber">${index + 1}</span><span class="autoRevealText">Reveal key idea</span><b>+</b>`;
          const toggle = () => {
            if (revealed.has(index)) revealed.delete(index); else revealed.add(index);
            const open = revealed.has(index);
            item.classList.toggle("open", open);
            const text = item.querySelector<HTMLElement>(".autoRevealText");
            const number = item.querySelector<HTMLElement>(".autoRevealNumber");
            const icon = item.querySelector<HTMLElement>("b");
            if (text) text.textContent = open ? original : "Reveal key idea";
            if (number) number.textContent = open ? "✓" : String(index + 1);
            if (icon) icon.textContent = open ? "−" : "+";
            item.setAttribute("aria-expanded", String(open));
            const count = progress.querySelector<HTMLElement>("b");
            if (count) count.textContent = `${revealed.size}/${children.length} explored`;
            if (revealed.size === children.length) addConfidencePulse(box);
          };
          offs.push(listen(item, "click", toggle));
          offs.push(listen(item, "keydown", ((event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
          }) as EventListener));
        });
        cleanups.set(box, () => offs.forEach(off => off()));
      });
    }

    function addConfidencePulse(box: HTMLElement) {
      if (box.querySelector(".autoConfidencePulse")) return;
      const pulse = document.createElement("div");
      pulse.className = "autoConfidencePulse";
      pulse.innerHTML = `<span>Quick confidence check</span><div><button type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button></div><small>Select how confident you feel before you continue.</small>`;
      box.appendChild(pulse);
      pulse.querySelectorAll("button").forEach((button, index) => button.addEventListener("click", () => {
        pulse.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        const note = pulse.querySelector("small");
        if (note) note.textContent = index < 2 ? "Keep the key ideas open and revisit the example before moving on." : "Good. Use the next activity to test whether you can apply it.";
      }));
    }

    function enhanceVisuals(root: ParentNode = document) {
      root.querySelectorAll<HTMLElement>(`.visualExplainer:not([${ENHANCED}])`).forEach(explainer => {
        explainer.setAttribute(ENHANCED, "true");
        const grid = explainer.querySelector<HTMLElement>(".visualGrid");
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > .visualCard"));
        if (!cards.length) return;
        const toolbar = document.createElement("div");
        toolbar.className = "autoVisualToolbar";
        toolbar.innerHTML = `<div><span>INTERACTIVE VISUAL</span><b>Click a card to focus</b></div><div class="autoVisualActions"></div>`;
        grid.parentElement?.insertBefore(toolbar, grid);
        const detail = document.createElement("div");
        detail.className = "autoVisualDetail";
        grid.insertAdjacentElement("afterend", detail);
        const actions = toolbar.querySelector<HTMLElement>(".autoVisualActions");
        const headings = cards.map((card, index) => ({ heading: card.querySelector("strong")?.textContent?.trim() || `Step ${index + 1}`, text: card.querySelector("span")?.textContent?.trim() || "" }));
        const update = (index: number) => {
          cards.forEach((card, i) => { card.classList.toggle("autoActive", i === index); card.setAttribute("aria-pressed", String(i === index)); });
          detail.innerHTML = `<span>FOCUS ${index + 1} OF ${cards.length}</span><h3>${escapeHtml(headings[index].heading)}</h3><p>${escapeHtml(headings[index].text)}</p>`;
        };
        const offs: (() => void)[] = [];
        cards.forEach((card, index) => {
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          const choose = () => update(index);
          offs.push(listen(card, "click", choose));
          offs.push(listen(card, "keydown", ((event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } }) as EventListener));
        });
        update(0);
        const sequential = ["flow", "timeline", "cycle", "ladder"].some(name => grid.classList.contains(name));
        if (sequential && cards.length >= 3 && actions) {
          const challenge = document.createElement("button");
          challenge.type = "button";
          challenge.textContent = "Sequence challenge";
          actions.appendChild(challenge);
          offs.push(listen(challenge, "click", (() => launchSequenceChallenge(explainer, headings)) as EventListener));
        }
        cleanups.set(explainer, () => offs.forEach(off => off()));
      });
    }

    function launchSequenceChallenge(explainer: HTMLElement, items: { heading: string; text: string }[]) {
      explainer.querySelector(".autoSequenceChallenge")?.remove();
      const challenge = document.createElement("div");
      challenge.className = "autoSequenceChallenge";
      const order = items.map((_, index) => index);
      const mixed = order.length > 2 ? [...order.slice(1), order[0]] : [...order].reverse();
      let guess: number[] = [];
      challenge.innerHTML = `<div class="autoSequenceHead"><div><span>CLICKABLE ACTIVITY</span><strong>Rebuild the sequence</strong><p>Choose the stages from first to last.</p></div><b>0/${items.length}</b></div><div class="autoSequencePool"></div><div class="autoSequenceFeedback"></div>`;
      const pool = challenge.querySelector<HTMLElement>(".autoSequencePool")!;
      const feedback = challenge.querySelector<HTMLElement>(".autoSequenceFeedback")!;
      const count = challenge.querySelector<HTMLElement>(".autoSequenceHead>b")!;
      const render = () => {
        pool.innerHTML = "";
        mixed.forEach(index => {
          const button = document.createElement("button");
          button.type = "button";
          button.disabled = guess.includes(index);
          button.innerHTML = `<span>${guess.includes(index) ? guess.indexOf(index) + 1 : "?"}</span><strong>${escapeHtml(items[index].heading)}</strong>`;
          button.addEventListener("click", () => { if (!guess.includes(index)) { guess = [...guess, index]; render(); } });
          pool.appendChild(button);
        });
        count.textContent = `${guess.length}/${items.length}`;
        feedback.innerHTML = "";
        if (guess.length === items.length) {
          const correct = guess.every((value, index) => value === index);
          feedback.className = `autoSequenceFeedback ${correct ? "good" : "retry"}`;
          feedback.innerHTML = correct ? `<strong>Correct sequence.</strong><p>You reconstructed the process in the intended order.</p>` : `<strong>Not quite.</strong><p>Compare the stages with the visual, then try again.</p><button type="button">Try again</button>`;
          feedback.querySelector("button")?.addEventListener("click", () => { guess = []; render(); });
        }
      };
      render();
      explainer.appendChild(challenge);
      challenge.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    }

    function enhanceActivities(root: ParentNode = document) {
      root.querySelectorAll<HTMLElement>(`.practiceActivity:not([${ENHANCED}])`).forEach(activity => {
        activity.setAttribute(ENHANCED, "true");
        const list = activity.querySelector("ol");
        const textarea = activity.querySelector<HTMLTextAreaElement>("textarea");
        if (!list || !textarea) return;
        const steps = Array.from(list.querySelectorAll<HTMLElement>("li"));
        const head = document.createElement("div");
        head.className = "autoActivityHead";
        head.innerHTML = `<div><span>CLICKABLE PRACTICE</span><strong>Work through each step</strong></div><b>0/${steps.length} checked</b>`;
        list.insertAdjacentElement("beforebegin", head);
        const done = new Set<number>();
        const offs: (() => void)[] = [];
        steps.forEach((step,index) => {
          step.tabIndex = 0;
          step.setAttribute("role", "button");
          step.classList.add("autoActivityStep");
          const original = step.textContent?.trim() || `Step ${index + 1}`;
          step.innerHTML = `<span>${index + 1}</span><strong>${escapeHtml(original)}</strong><b>Check</b>`;
          const toggle = () => {
            if (done.has(index)) done.delete(index); else done.add(index);
            const checked = done.has(index);
            step.classList.toggle("done", checked);
            const number = step.querySelector<HTMLElement>("span");
            const label = step.querySelector<HTMLElement>("b");
            if (number) number.textContent = checked ? "✓" : String(index + 1);
            if (label) label.textContent = checked ? "Done" : "Check";
            head.querySelector("b")!.textContent = `${done.size}/${steps.length} checked`;
          };
          offs.push(listen(step, "click", toggle));
          offs.push(listen(step, "keydown", ((event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }) as EventListener));
        });
        const tools = document.createElement("div");
        tools.className = "autoActivityTools";
        ["Evidence I would look for: ", "A likely barrier is: ", "My next adjustment would be: ", "I would know this worked if: "].forEach((text, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = ["+ Evidence", "+ Barrier", "+ Next adjustment", "+ Success indicator"][index];
          button.addEventListener("click", () => appendToTextarea(textarea, text));
          tools.appendChild(button);
        });
        textarea.insertAdjacentElement("beforebegin", tools);
        cleanups.set(activity, () => offs.forEach(off => off()));
      });
    }

    function enhanceContentPulse(root: ParentNode = document) {
      root.querySelectorAll<HTMLElement>(`.moduleContent:not([data-cpd-pulse])`).forEach(content => {
        if (!content.querySelector(".moduleType.content")) return;
        content.setAttribute("data-cpd-pulse", "true");
        const lead = content.querySelector(".lead");
        if (!lead) return;
        const pulse = document.createElement("div");
        pulse.className = "autoMiniPulse";
        pulse.innerHTML = `<span>QUICK PULSE</span><strong>How familiar is this idea?</strong><div><button type="button">New</button><button type="button">Somewhat</button><button type="button">Confident</button><button type="button">Could explain it</button></div><small>Choose one — this is for your own reflection, not a staff score.</small>`;
        lead.insertAdjacentElement("afterend", pulse);
        pulse.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
          pulse.querySelectorAll("button").forEach(b => b.classList.remove("active"));
          button.classList.add("active");
        }));
      });
    }

    function enhance(root: ParentNode = document) {
      enhanceKeyPoints(root); enhanceVisuals(root); enhanceActivities(root); enhanceContentPulse(root);
    }

    enhance();
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of Array.from(record.addedNodes)) if (node instanceof HTMLElement) enhance(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); cleanups.forEach(clean => clean()); cleanups.clear(); };
  }, []);

  return null;
}

function appendToTextarea(textarea: HTMLTextAreaElement, text: string) {
  const next = `${textarea.value}${textarea.value.trim() ? "\n\n" : ""}${text}`;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(textarea, next);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
  textarea.setSelectionRange(next.length, next.length);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}
