"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { schedulePhase6CourseReviews } from "@/lib/courseFollowThroughClient";
import { PHASE6_REVIEW_STAGES } from "@/lib/courseFollowThroughPhase6";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isComplete(modal: HTMLElement) {
  const percent = clean(modal.querySelector(".courseProgress strong")?.textContent);
  if (percent === "100%") return true;
  const buttons = Array.from(modal.querySelectorAll<HTMLElement>(".moduleNav button"));
  return buttons.length > 0 && buttons.every(button => button.classList.contains("done"));
}

function buildBanner(modal: HTMLElement, courseId: string, courseTitle: string) {
  const existing = modal.querySelector<HTMLElement>(`.phase6FollowThrough[data-course-id="${CSS.escape(courseId)}"]`);
  if (existing) return existing;
  const progress = modal.querySelector<HTMLElement>(".courseProgress");
  if (!progress) return null;
  const section = document.createElement("section");
  section.className = "phase6FollowThrough";
  section.dataset.courseId = courseId;
  section.innerHTML = `
    <div class="phase6FollowHead">
      <div>
        <span>PHASE 6 · FOLLOW-THROUGH</span>
        <strong>Turn ${courseTitle.replace(/[<>&]/g, "")} into sustained practice.</strong>
        <p>Your course is complete. Follow-up now tracks transfer, evidence and whether the change should be kept, adapted or stopped.</p>
      </div>
      <button type="button" class="primary phase6OpenImpact">Open follow-through hub</button>
    </div>
    <div class="phase6Timeline">
      ${PHASE6_REVIEW_STAGES.map((stage, index) => `<article><b>${index + 1}</b><div><strong>${stage.label}</strong><span>${stage.purpose}</span></div></article>`).join("")}
    </div>
    <div class="phase6ScheduleStatus" aria-live="polite">Checking your follow-up schedule…</div>
  `;
  section.querySelector<HTMLButtonElement>(".phase6OpenImpact")?.addEventListener("click", () => {
    window.location.href = `/impact?course=${encodeURIComponent(courseId)}`;
  });
  progress.insertAdjacentElement("afterend", section);
  return section;
}

export default function CourseFollowThroughPhase6Controller() {
  useEffect(() => {
    const handled = new Set<string>();
    let scheduled = false;

    const apply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.labMode)").forEach(modal => {
          if (!isComplete(modal)) return;
          const title = clean(modal.querySelector(".courseModalHead h2")?.textContent);
          const course = courses.find(item => item.title === title);
          if (!course) return;
          const banner = buildBanner(modal, course.id, course.title);
          if (!banner || handled.has(course.id)) return;
          handled.add(course.id);
          const status = banner.querySelector<HTMLElement>(".phase6ScheduleStatus");
          (async () => {
            try {
              const client = getSupabaseBrowserClient();
              const { data: auth } = await client.auth.getUser();
              if (!auth.user) {
                if (status) status.textContent = "Sign in to save follow-through checkpoints.";
                return;
              }
              const { data: progress } = await client
                .from("course_progress")
                .select("completed_at")
                .eq("user_id", auth.user.id)
                .eq("course_id", course.id)
                .maybeSingle();
              const completedAt = progress?.completed_at || new Date().toISOString();
              const result = await schedulePhase6CourseReviews(client, auth.user.id, course, completedAt);
              if (result.error) {
                if (status) status.textContent = "Follow-through is available, but the review schedule could not be saved yet.";
                return;
              }
              if (status) status.textContent = result.created
                ? `${result.created} follow-up checkpoint${result.created === 1 ? "" : "s"} scheduled automatically.`
                : "Your 7, 30 and 90-day follow-up checkpoints are already scheduled.";
            } catch {
              if (status) status.textContent = "Follow-through is ready. Open the hub to review your schedule.";
            }
          })();
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
