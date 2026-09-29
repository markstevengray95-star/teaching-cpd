"use client";

import { useEffect } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AssessmentEventDetail = {
  courseTitle?: string;
  key?: string;
  value?: string;
};

export default function CourseAssessmentPhase5Sync() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent<AssessmentEventDetail>).detail || {};
      if (!detail.courseTitle || !detail.key || typeof detail.value !== "string") return;
      const course = courses.find(item => item.title === detail.courseTitle);
      if (!course) return;
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: existing } = await supabase
        .from("course_progress")
        .select("completed_modules,reflections,completed_at")
        .eq("user_id", auth.user.id)
        .eq("course_id", course.id)
        .maybeSingle();
      const reflections = { ...((existing?.reflections || {}) as Record<string, string>), [detail.key]: detail.value };
      await supabase.from("course_progress").upsert({
        user_id: auth.user.id,
        course_id: course.id,
        completed_modules: existing?.completed_modules || [],
        reflections,
        completed_at: existing?.completed_at || null,
      }, { onConflict: "user_id,course_id" });
    };
    window.addEventListener("cpd:phase5-assessment", handler as EventListener);
    return () => window.removeEventListener("cpd:phase5-assessment", handler as EventListener);
  }, []);
  return null;
}
