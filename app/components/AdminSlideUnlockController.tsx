"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export default function AdminSlideUnlockController() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !active) return;

      const metadataAdmin = auth.user.app_metadata?.platform_admin === true;
      const [{ data: profile }, { data: platformAdmin }] = await Promise.all([
        supabase.from("staff_profiles").select("role").eq("id", auth.user.id).maybeSingle(),
        supabase.from("platform_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle(),
      ]);

      if (!active) return;
      setIsAdmin(metadataAdmin || profile?.role === "Admin" || Boolean(platformAdmin));
    })().catch((error) => console.error("Could not resolve admin course access", error));

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let scheduled = false;
    const unlock = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll<HTMLElement>(".courseModal:not(.labMode):not(.shortCoursePresentation)").forEach((modal) => {
          modal.dataset.adminSlideUnlocked = "true";
          modal.querySelectorAll<HTMLButtonElement>(".moduleNav button").forEach((button) => {
            if (button.disabled) button.disabled = false;
            button.setAttribute("aria-disabled", "false");
            const title = button.querySelector("strong")?.textContent?.trim() || "Course section";
            button.setAttribute("aria-label", `Admin unlocked: ${title}`);
          });
        });
      });
    };

    unlock();
    const observer = new MutationObserver(unlock);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "disabled"],
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const modal = document.querySelector<HTMLElement>(".courseModal:not(.labMode):not(.shortCoursePresentation)");
      if (!modal) return;
      const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>(".moduleNav button"));
      const currentIndex = buttons.findIndex((button) => button.classList.contains("current"));
      if (currentIndex < 0) return;

      const nextIndex = event.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;
      const target = buttons[nextIndex];
      if (!target) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      target.click();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown, true);
      document.querySelectorAll<HTMLElement>(".courseModal[data-admin-slide-unlocked]").forEach((modal) => {
        delete modal.dataset.adminSlideUnlocked;
      });
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  return <style>{`
    .courseModal[data-admin-slide-unlocked="true"] .moduleNav button.presentationLocked {
      opacity: 1 !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      filter: none !important;
    }
    .courseModal[data-admin-slide-unlocked="true"] .moduleNav button.presentationLocked::after {
      display: none !important;
    }
  `}</style>;
}
