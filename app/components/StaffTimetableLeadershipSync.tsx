"use client";

import { useEffect, useMemo, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import { type ClassCurriculumProfile, getCourseLessonSequence, inferClassCurriculumProfile } from "./staffTimetableCurriculumPhase1";
import { type MediumTermPlan } from "./staffTimetableMediumTerm";
import { type CurriculumAssessment } from "./StaffTimetableAssessments";

type SummaryLesson = {
  className: string;
  subject: string;
  plan: {
    topic?: string;
    sequencePosition?: number;
    curriculumUnit?: string;
    lessonDate?: string;
  };
};

type Props = {
  lessons: SummaryLesson[];
  classCurriculumProfiles: Record<string, ClassCurriculumProfile>;
  mediumTermPlans: MediumTermPlan[];
  assessments: CurriculumAssessment[];
  disabled?: boolean;
};

function yearGroup(className: string) {
  const match = className.match(/(?:^|\b)(?:Y|Year\s*)(\d{1,2})(?:\b|\s)/i);
  return match ? `Year ${match[1]}` : "";
}

function expectedAcademicYearProgress(today: string) {
  const current = new Date(`${today}T12:00:00`);
  if (Number.isNaN(current.getTime())) return 0;
  const year = current.getMonth() >= 8 ? current.getFullYear() : current.getFullYear() - 1;
  const start = new Date(year, 8, 1, 12);
  const end = new Date(year + 1, 6, 20, 12);
  if (current <= start) return 0;
  if (current >= end) return 100;
  return Math.round(((current.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
}

export default function StaffTimetableLeadershipSync({ lessons, classCurriculumProfiles, mediumTermPlans, assessments, disabled = false }: Props) {
  const lastPayload = useRef("");
  const today = new Date().toISOString().slice(0, 10);

  const summaries = useMemo(() => {
    const classes = [...new Set(lessons.map((lesson) => lesson.className).filter(Boolean))].sort();
    const expected = expectedAcademicYearProgress(today);
    return classes.map((className) => {
      const classLessons = lessons.filter((lesson) => lesson.className === className);
      const profile = classCurriculumProfiles[className] || inferClassCurriculumProfile(className, classLessons[0]?.subject || "Science");
      const sequence = getCourseLessonSequence(profile);
      const medium = mediumTermPlans.find((item) => item.className === className && (!profile.courseId || item.courseId === profile.courseId)) || mediumTermPlans.find((item) => item.className === className);
      const completed = medium?.sessions.filter((item) => item.status === "complete") || [];
      const planned = medium?.sessions.filter((item) => item.status !== "missed") || [];
      const placed = new Set(classLessons.map((lesson) => Number(lesson.plan.sequencePosition)).filter((position) => Number.isInteger(position) && position >= 0));
      const completedCount = completed.length;
      const plannedCount = medium ? planned.length : placed.size;
      const coveragePercent = sequence.length ? Math.max(0, Math.min(100, Math.round(((medium ? completedCount : plannedCount) / sequence.length) * 100))) : 0;
      const orderedSessions = (medium?.sessions || []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
      const lastComplete = orderedSessions.filter((item) => item.status === "complete").at(-1);
      const nextSession = orderedSessions.find((item) => item.status === "planned" && item.date >= today) || orderedSessions.find((item) => item.status === "planned");
      const currentUnit = lastComplete?.unitTitle || classLessons.find((lesson) => lesson.plan.curriculumUnit)?.plan.curriculumUnit || "";
      const nextUnit = nextSession?.unitTitle || "";
      const nextAssessment = assessments
        .filter((item) => item.className === className && item.assessmentDate >= today)
        .slice()
        .sort((a, b) => a.assessmentDate.localeCompare(b.assessmentDate))[0];
      const gapFlags: string[] = [];
      if (!sequence.length) gapFlags.push("No curriculum sequence");
      if (!medium) gapFlags.push("No medium-term plan");
      if (!nextAssessment) gapFlags.push("No upcoming assessment");
      if (sequence.length && coveragePercent + 10 < expected) gapFlags.push("Coverage behind expected pace");
      if (medium && plannedCount < Math.min(sequence.length, completedCount + 4)) gapFlags.push("Short forward-planning horizon");
      return {
        class_name: className,
        subject: profile.subject || classLessons[0]?.subject || "",
        year_group: yearGroup(className),
        course_id: profile.courseId || "",
        coverage_percent: coveragePercent,
        completed_lessons: completedCount,
        planned_lessons: plannedCount,
        sequence_length: sequence.length,
        current_unit: currentUnit,
        next_unit: nextUnit,
        next_assessment_title: nextAssessment?.title || "",
        next_assessment_date: nextAssessment?.assessmentDate || null,
        gap_flags: gapFlags,
      };
    });
  }, [lessons, classCurriculumProfiles, mediumTermPlans, assessments, today]);

  useEffect(() => {
    if (disabled) return;
    const payloadKey = JSON.stringify(summaries);
    if (payloadKey === lastPayload.current) return;
    const timer = window.setTimeout(async () => {
      const client = getSupabaseBrowserClient();
      const { data: userData } = await client.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const access = await resolveStaffAccess(client, user);
      if (!access.organizationId) return;
      const rows = summaries.map((row) => ({ ...row, organization_id: access.organizationId, user_id: user.id, updated_at: new Date().toISOString() }));
      const { error: clearError } = await client.from("staff_timetable_curriculum_summaries").delete().eq("organization_id", access.organizationId).eq("user_id", user.id);
      if (clearError) return;
      if (rows.length) {
        const { error } = await client.from("staff_timetable_curriculum_summaries").insert(rows);
        if (error) return;
      }
      lastPayload.current = payloadKey;
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [summaries, disabled]);

  return null;
}
