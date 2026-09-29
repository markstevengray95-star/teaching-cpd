import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "./data";
import { PHASE6_REVIEW_STAGES } from "./courseFollowThroughPhase6";

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function schedulePhase6CourseReviews(
  client: SupabaseClient,
  userId: string,
  course: Pick<Course, "id" | "title">,
  completedAt: string,
) {
  const [{ data: profile }, { data: existing, error: readError }] = await Promise.all([
    client.from("staff_profiles").select("organisation_id").eq("id", userId).maybeSingle(),
    client.from("cpd_impact_reviews").select("review_stage").eq("user_id", userId).eq("source_type", "course").eq("source_id", course.id),
  ]);
  if (readError) return { created: 0, error: readError };
  const existingStages = new Set((existing || []).map(row => String(row.review_stage)));
  const missing = PHASE6_REVIEW_STAGES.filter(stage => !existingStages.has(stage.id));
  if (!missing.length) return { created: 0, error: null };
  const rows = missing.map(stage => ({
    user_id: userId,
    organisation_id: profile?.organisation_id || null,
    source_type: "course",
    source_id: course.id,
    source_title: course.title,
    review_stage: stage.id,
    due_on: addDays(completedAt, stage.days),
  }));
  const { error } = await client.from("cpd_impact_reviews").insert(rows);
  return { created: error ? 0 : rows.length, error };
}
