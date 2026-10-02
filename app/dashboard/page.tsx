"use client";

import { useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { STAFF_ROLE_LABELS, hasStaffPermission, resolveStaffAccess, type StaffPermission, type StaffRole } from "@/lib/rolePermissions";
import "./Phase1Dashboard.css";

type Profile = { id: string; full_name: string; role: StaffRole; department: string | null; organisation_id: string | null };
type Progress = { course_id: string; completed_at: string | null; updated_at: string };
type Target = { id: string; title: string; description: string; review_date: string | null; status: string; linked_course_id: string | null };
type Assignment = { id: string; title_snapshot: string; due_date: string | null; mandatory: boolean; status: string; target_id: string };
type Review = { id: string; source_id: string; source_title: string; review_stage: string; due_on: string; reviewed_at: string | null; implementation_status: string | null; evidence_type: string | null; impact_note: string | null };
type Pathway = { id: string; role_focus: string; goal: string; selected_course_ids: string[]; target_completion: string | null; status: string; updated_at: string };
type CalendarEvent = { id: string; title: string; category: string; starts_at: string; ends_at: string; all_day: boolean; location: string; audience: string; target_department: string; created_by: string };
type Notice = { id: string; title: string; category: string; audience: string; target_department: string; priority: "normal" | "important" | "urgent"; pinned: boolean; requires_acknowledgement: boolean; starts_at: string; expires_at: string | null };
type NoticeRead = { notice_id: string; read_at: string; acknowledged_at: string | null };
type TimetableLesson = { id: string; week: "W1" | "W2"; day: string; period: number; start: string; end: string; subject: string; className: string; room: string };
type TimetableTask = { id: string; title: string; type: string; status: string; date: string; period: string; notes: string };
type TimetableStore = { week: "W1" | "W2"; lessons: TimetableLesson[]; tasks: TimetableTask[] };
type AreaId = "teach" | "students" | "sen" | "develop" | "school" | "resources";
type AreaCard = { id: AreaId; eyebrow: string; title: string; description: string; href: string; icon: string; permission: StaffPermission };
type Tool = { href: string; title: string; subtitle: string; icon: string };
type AttentionItem = { id: string; title: string; detail: string; href: string; tone: "normal" | "warn" | "urgent" };

const TIMETABLE_STORAGE_KEY = "teaching-cpd-personal-staff-timetable-v2";
const AREA_ORDER_PREFIX = "staff-dashboard-area-order";
const RECENT_TOOLS_PREFIX = "staff-dashboard-recent-tools";

const AREA_CARDS: AreaCard[] = [
  { id: "teach", eyebrow: "TEACH", title: "Teaching & Learning", description: "Planning, curriculum, classroom strategies, departments and teaching resources.", href: "/teach", icon: "✦", permission: "teach:view" },
  { id: "students", eyebrow: "STUDENTS", title: "Students", description: "Pastoral support, regulation, behaviour and intervention tracking.", href: "/students", icon: "◉", permission: "students:view" },
  { id: "sen", eyebrow: "SEN & INCLUSION", title: "SEN Hub", description: "Support plans, pupil passports, provision reviews, EAL tests, reading-age tools and regulation support.", href: "/sen", icon: "◇", permission: "students:view" },
  { id: "develop", eyebrow: "DEVELOP", title: "Professional Development", description: "CPD, coaching, appraisal, pathways, evidence and professional growth.", href: "/develop", icon: "↗", permission: "develop:view" },
  { id: "school", eyebrow: "SCHOOL", title: "School", description: "Timetables, calendar, forms, trips, notices, improvement and administration.", href: "/school", icon: "▦", permission: "develop:view" },
  { id: "resources", eyebrow: "RESOURCES", title: "Resources & Knowledge", description: "Search, policies, school files, trusted resources and school knowledge.", href: "/resources", icon: "▤", permission: "develop:view" },
];

const TOOL_CATALOG: Tool[] = [
  { href: "/staff-timetable", title: "Staff timetable", subtitle: "Today, planning and workload", icon: "◷" },
  { href: "/calendar", title: "School calendar", subtitle: "Meetings, events and deadlines", icon: "□" },
  { href: "/notices", title: "School notices", subtitle: "Current information and actions", icon: "✉" },
  { href: "/sen", title: "SEN Hub", subtitle: "Pupil support and inclusion", icon: "◇" },
  { href: "/sen/eal/try", title: "Try EAL tests", subtitle: "Run the full practice test packs", icon: "A" },
  { href: "/sen/eal/full-tests", title: "EAL test centre", subtitle: "Assessment and teacher scoring", icon: "✓" },
  { href: "/resource-generator", title: "Resource generator", subtitle: "Create classroom materials", icon: "✎" },
  { href: "/curriculum", title: "Curriculum Hub", subtitle: "Subjects, topics and lessons", icon: "▤" },
  { href: "/interventions", title: "Interventions", subtitle: "Plan and review support", icon: "↻" },
  { href: "/ai-coach", title: "AI CPD Coach", subtitle: "Professional learning support", icon: "✧" },
  { href: "/school-assistant", title: "School assistant", subtitle: "School knowledge and guidance", icon: "⌕" },
  { href: "/professional-learning", title: "Professional learning", subtitle: "CPD, goals and follow-up", icon: "◎" },
  { href: "/admin-centre", title: "Admin centre", subtitle: "Whole-school platform controls", icon: "⚙" },
  { href: "/leadership-dashboard", title: "Leadership dashboard", subtitle: "School activity and priorities", icon: "▦" },
  { href: "/staff-access", title: "Staff access", subtitle: "Roles and permissions", icon: "◉" },
];

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function firstName(name: string) { return name.trim().split(/\s+/)[0] || name; }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function formatLongDate(date: Date) { return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); }
function formatClock(value: string) { return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function labelStage(stage: string) { if (stage === "day_7") return "7-day transfer"; if (stage === "day_30") return "30-day impact"; if (stage === "day_90") return "90-day sustain"; return stage.replaceAll("_", " "); }

function defaultAreaOrder(role: StaffRole): AreaId[] {
  if (role === "send-eal") return ["sen", "students", "teach", "school", "develop", "resources"];
  if (role === "pastoral") return ["students", "sen", "school", "teach", "develop", "resources"];
  if (["slt", "administrator", "super-admin"].includes(role)) return ["school", "students", "sen", "teach", "develop", "resources"];
  if (role === "support") return ["students", "sen", "school", "develop", "resources", "teach"];
  return ["teach", "students", "sen", "develop", "school", "resources"];
}

function recommendedAreas(role: StaffRole) {
  if (role === "send-eal") return new Set<AreaId>(["sen", "students"]);
  if (role === "pastoral") return new Set<AreaId>(["students", "sen"]);
  if (["slt", "administrator", "super-admin"].includes(role)) return new Set<AreaId>(["school", "students"]);
  if (role === "support") return new Set<AreaId>(["students", "sen"]);
  return new Set<AreaId>(["teach", "develop"]);
}

function roleToolDefaults(role: StaffRole) {
  if (role === "send-eal") return ["/sen", "/sen/eal/try", "/sen/eal/full-tests", "/interventions", "/calendar", "/notices"];
  if (role === "pastoral") return ["/students", "/sen", "/interventions", "/calendar", "/notices", "/staff-timetable"];
  if (["slt", "administrator", "super-admin"].includes(role)) return ["/leadership-dashboard", "/admin-centre", "/staff-access", "/notices", "/calendar", "/school-assistant"];
  if (role === "support") return ["/students", "/sen", "/calendar", "/notices", "/professional-learning", "/school-assistant"];
  return ["/staff-timetable", "/resource-generator", "/curriculum", "/sen", "/calendar", "/ai-coach"];
}

function primaryTool(role: StaffRole) {
  if (role === "send-eal") return { href: "/sen", label: "Open SEN Hub" };
  if (role === "pastoral") return { href: "/students", label: "Open Students" };
  if (["slt", "administrator", "super-admin"].includes(role)) return { href: "/school", label: "Open School" };
  if (role === "support") return { href: "/students", label: "Open Student Support" };
  return { href: "/staff-timetable", label: "Open today’s timetable" };
}

function noticeVisibleToRole(notice: Notice, role: StaffRole, department: string) {
  const publisherRoles: StaffRole[] = ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];
  if (publisherRoles.includes(role)) return true;
  if (notice.audience === "All staff") return true;
  if (notice.audience === "Teaching staff") return ["teacher", "tutor"].includes(role);
  if (notice.audience === "Tutors") return role === "tutor";
  if (notice.audience === "Support staff") return role === "support";
  if (notice.audience === "Department") return Boolean(department && notice.target_department.toLowerCase() === department.toLowerCase());
  return false;
}

function calendarVisibleToRole(event: CalendarEvent, role: StaffRole, department: string, userId: string) {
  if (event.audience === "personal") return event.created_by === userId;
  if (event.audience === "all_staff") return true;
  if (event.audience === "department") return Boolean(department && event.target_department.toLowerCase() === department.toLowerCase());
  if (event.audience === "leadership") return ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"].includes(role);
  if (event.audience === "support") return role === "support" || ["slt", "administrator", "super-admin"].includes(role);
  if (event.audience === "tutors") return role === "tutor" || ["pastoral", "slt", "administrator", "super-admin"].includes(role);
  if (event.audience === "teaching") return ["teacher", "tutor", "hod", "pastoral", "send-eal", "slt", "super-admin"].includes(role);
  return true;
}

function readTimetableStore(): TimetableStore | null {
  try {
    const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { workspace?: { lessons?: TimetableLesson[]; tasks?: TimetableTask[] }; week?: "W1" | "W2" };
    return {
      week: parsed.week === "W2" ? "W2" : "W1",
      lessons: Array.isArray(parsed.workspace?.lessons) ? parsed.workspace?.lessons || [] : [],
      tasks: Array.isArray(parsed.workspace?.tasks) ? parsed.workspace?.tasks || [] : [],
    };
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeReads, setNoticeReads] = useState<NoticeRead[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<TimetableStore | null>(null);
  const [areaOrder, setAreaOrder] = useState<AreaId[]>([]);
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [customising, setCustomising] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseBrowserClient();
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/dashboard"; return; }

      const [profileResult, access] = await Promise.all([
        client.from("staff_profiles").select("id,full_name,role,department,organisation_id").eq("id", auth.user.id).maybeSingle(),
        resolveStaffAccess(client, auth.user),
      ]);
      if (!mounted) return;

      const legacy = profileResult.data as { id?: string; full_name?: string; role?: string; department?: string | null; organisation_id?: string | null } | null;
      const nextProfile: Profile = {
        id: auth.user.id,
        full_name: legacy?.full_name || auth.user.email?.split("@")[0] || "Staff member",
        role: access.role,
        department: legacy?.department || null,
        organisation_id: access.organizationId || legacy?.organisation_id || null,
      };
      setProfile(nextProfile);

      const [pr, t, a, r, pa] = await Promise.all([
        client.from("course_progress").select("course_id,completed_at,updated_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false }),
        client.from("development_targets").select("id,title,description,review_date,status,linked_course_id").eq("user_id", auth.user.id).order("updated_at", { ascending: false }),
        client.from("cpd_assignments").select("id,title_snapshot,due_date,mandatory,status,target_id").eq("assigned_to", auth.user.id).order("due_date", { ascending: true }),
        client.from("cpd_impact_reviews").select("id,source_id,source_title,review_stage,due_on,reviewed_at,implementation_status,evidence_type,impact_note").eq("user_id", auth.user.id).order("due_on", { ascending: true }),
        client.from("personal_pathway_plans").select("id,role_focus,goal,selected_course_ids,target_completion,status,updated_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false }).limit(3),
      ]);
      if (!mounted) return;
      setProgress((pr.data || []) as Progress[]);
      setTargets((t.data || []) as Target[]);
      setAssignments((a.data || []) as Assignment[]);
      setReviews((r.data || []) as Review[]);
      setPathways((pa.data || []) as Pathway[]);
      setMessage([profileResult.error, pr.error, t.error, a.error, r.error, pa.error].filter(Boolean).map(item => item?.message).filter(Boolean).join(" · "));

      const orgId = nextProfile.organisation_id;
      if (orgId) {
        const now = new Date();
        const start = startOfLocalDay(now).toISOString();
        const end = endOfLocalDay(now).toISOString();
        const schoolQueries = [
          client.from("school_calendar_events").select("id,title,category,starts_at,ends_at,all_day,location,audience,target_department,created_by").eq("organization_id", orgId).lte("starts_at", end).gte("ends_at", start).order("starts_at", { ascending: true }),
          client.from("school_notices").select("id,title,category,audience,target_department,priority,pinned,requires_acknowledgement,starts_at,expires_at").eq("organisation_id", orgId).order("pinned", { ascending: false }).order("starts_at", { ascending: false }).limit(30),
          client.from("school_notice_reads").select("notice_id,read_at,acknowledged_at").eq("user_id", auth.user.id),
        ] as const;
        const [cal, notice, reads] = await Promise.all(schoolQueries);
        if (!mounted) return;
        if (!cal.error) setCalendarEvents((cal.data || []) as CalendarEvent[]);
        if (!notice.error) setNotices((notice.data || []) as Notice[]);
        if (!reads.error) setNoticeReads((reads.data || []) as NoticeRead[]);

        if (["slt", "administrator", "super-admin"].includes(access.role)) {
          const members = await client.from("school_organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", orgId);
          if (mounted && !members.error) setMemberCount(members.count ?? 0);
        }
      }

      const orderKey = `${AREA_ORDER_PREFIX}:${auth.user.id}`;
      const recentKey = `${RECENT_TOOLS_PREFIX}:${auth.user.id}`;
      try {
        const storedOrder = JSON.parse(window.localStorage.getItem(orderKey) || "[]") as AreaId[];
        const validOrder = storedOrder.length === AREA_CARDS.length && AREA_CARDS.every(card => storedOrder.includes(card.id));
        setAreaOrder(validOrder ? storedOrder : defaultAreaOrder(access.role));
      } catch { setAreaOrder(defaultAreaOrder(access.role)); }
      try {
        const storedRecent = JSON.parse(window.localStorage.getItem(recentKey) || "[]") as string[];
        setRecentTools(Array.isArray(storedRecent) ? storedRecent.filter(href => TOOL_CATALOG.some(tool => tool.href === href)).slice(0, 8) : []);
      } catch { setRecentTools([]); }
      setTimetable(readTimetableStore());
      if (mounted) setLoading(false);
    })().catch((error) => {
      console.error("Dashboard failed to load", error);
      if (mounted) { setMessage("Some dashboard information could not be loaded."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const completed = new Set(progress.filter(item => item.completed_at).map(item => item.course_id));
  const activePathway = pathways.find(item => item.status === "active") || pathways[0];
  const pathwayCourses = (activePathway?.selected_course_ids || []).map(id => courses.find(course => course.id === id)).filter((course): course is NonNullable<typeof course> => Boolean(course));
  const nextPathway = pathwayCourses.find(course => !completed.has(course.id));
  const openAssignments = assignments.filter(item => !["completed", "waived"].includes(item.status));
  const pendingReviews = reviews.filter(item => !item.reviewed_at);
  const todayKey = localDateKey();
  const dueReviews = pendingReviews.filter(item => item.due_on <= todayKey);
  const activeTargets = targets.filter(item => item.status === "active");
  const noticeReadMap = useMemo(() => new Map(noticeReads.map(item => [item.notice_id, item])), [noticeReads]);
  const weekday = new Date().toLocaleDateString("en-GB", { weekday: "long" });
  const todayLessons = (timetable?.lessons || []).filter(item => item.week === timetable?.week && item.day === weekday).sort((a, b) => a.period - b.period);
  const todayTasks = (timetable?.tasks || []).filter(item => item.date === todayKey && item.status !== "Done");
  const visibleEvents = calendarEvents.filter(item => profile ? calendarVisibleToRole(item, profile.role, profile.department || "", profile.id) : false);
  const currentNotices = notices.filter(item => {
    if (!profile || !noticeVisibleToRole(item, profile.role, profile.department || "")) return false;
    const now = Date.now();
    return new Date(item.starts_at).getTime() <= now && (!item.expires_at || new Date(item.expires_at).getTime() >= now);
  });
  const unreadNotices = currentNotices.filter(item => !noticeReadMap.has(item.id));
  const acknowledgementNotices = currentNotices.filter(item => item.requires_acknowledgement && !noticeReadMap.get(item.id)?.acknowledged_at);
  const recommended = profile ? recommendedAreas(profile.role) : new Set<AreaId>();

  const recommendation = useMemo(() => {
    if (dueReviews[0]) return { title: `Complete ${labelStage(dueReviews[0].review_stage)} review`, text: `${dueReviews[0].source_title} is due for implementation follow-up.`, href: "/impact" };
    const overdue = openAssignments.find(item => item.due_date && item.due_date <= todayKey);
    if (overdue) return { title: `Complete ${overdue.title_snapshot}`, text: overdue.due_date ? `Due ${formatDate(overdue.due_date)}.` : "Assigned CPD is waiting.", href: overdue.target_id?.startsWith("custom:") ? "/training" : "/" };
    if (acknowledgementNotices[0]) return { title: "Acknowledge school notice", text: acknowledgementNotices[0].title, href: "/notices" };
    if (nextPathway) return { title: `Next pathway course: ${nextPathway.title}`, text: activePathway?.goal || "Continue your personalised development pathway.", href: `/?course=${encodeURIComponent(nextPathway.id)}` };
    if (activeTargets[0]) return { title: `Move your target forward: ${activeTargets[0].title}`, text: "Choose one small action and the evidence you will review afterwards.", href: "/actions" };
    return { title: "Choose your next development focus", text: "Build a pathway or use the AI CPD Coach for a practical next step.", href: "/pathways/personal" };
  }, [acknowledgementNotices, activePathway, activeTargets, dueReviews, nextPathway, openAssignments, todayKey]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    dueReviews.slice(0, 2).forEach(item => items.push({ id: `review-${item.id}`, title: `${labelStage(item.review_stage)} review due`, detail: item.source_title, href: "/impact", tone: "warn" }));
    openAssignments.filter(item => item.due_date && item.due_date <= todayKey).slice(0, 2).forEach(item => items.push({ id: `assignment-${item.id}`, title: "CPD deadline", detail: `${item.title_snapshot} · ${item.due_date ? formatDate(item.due_date) : "due"}`, href: "/training", tone: "urgent" }));
    activeTargets.filter(item => item.review_date && item.review_date <= todayKey).slice(0, 1).forEach(item => items.push({ id: `target-${item.id}`, title: "Development target review", detail: item.title, href: "/development", tone: "warn" }));
    acknowledgementNotices.slice(0, 2).forEach(item => items.push({ id: `notice-${item.id}`, title: "Notice needs acknowledgement", detail: item.title, href: "/notices", tone: item.priority === "urgent" ? "urgent" : "warn" }));
    unreadNotices.filter(item => item.priority === "urgent" && !item.requires_acknowledgement).slice(0, 1).forEach(item => items.push({ id: `urgent-${item.id}`, title: "Urgent unread notice", detail: item.title, href: "/notices", tone: "urgent" }));
    if (!timetable) items.push({ id: "timetable-setup", title: "Set up your timetable", detail: "Upload or enter your timetable to show today’s lessons here.", href: "/staff-timetable", tone: "normal" });
    return items.slice(0, 6);
  }, [acknowledgementNotices, activeTargets, dueReviews, openAssignments, timetable, todayKey, unreadNotices]);

  const orderedCards = (areaOrder.length ? areaOrder : AREA_CARDS.map(card => card.id)).map(id => AREA_CARDS.find(card => card.id === id)).filter((card): card is AreaCard => Boolean(card));
  const recentToolObjects = (recentTools.length ? recentTools : roleToolDefaults(profile?.role || "teacher")).map(href => TOOL_CATALOG.find(tool => tool.href === href)).filter((tool): tool is Tool => Boolean(tool)).slice(0, 6);
  const isAdminView = Boolean(profile && ["slt", "administrator", "super-admin"].includes(profile.role));
  const primary = primaryTool(profile?.role || "teacher");

  function rememberTool(href: string) {
    if (!profile) return;
    const next = [href, ...recentTools.filter(item => item !== href)].filter(item => TOOL_CATALOG.some(tool => tool.href === item)).slice(0, 8);
    setRecentTools(next);
    window.localStorage.setItem(`${RECENT_TOOLS_PREFIX}:${profile.id}`, JSON.stringify(next));
  }

  function moveArea(index: number, delta: number) {
    if (!profile) return;
    const target = index + delta;
    if (target < 0 || target >= orderedCards.length) return;
    const next = [...orderedCards.map(card => card.id)];
    [next[index], next[target]] = [next[target], next[index]];
    setAreaOrder(next);
    window.localStorage.setItem(`${AREA_ORDER_PREFIX}:${profile.id}`, JSON.stringify(next));
  }

  function resetAreaOrder() {
    if (!profile) return;
    const next = defaultAreaOrder(profile.role);
    setAreaOrder(next);
    window.localStorage.setItem(`${AREA_ORDER_PREFIX}:${profile.id}`, JSON.stringify(next));
  }

  if (loading) return <main className="stagePage"><div className="stageCard">Building your personalised staff dashboard…</div></main>;
  if (!profile) return <main className="stagePage"><div className="stageCard">Your staff profile could not be opened.</div></main>;

  return <main className="stagePage aiPlatformPage phase1Dashboard">
    <section className="phase1Hero">
      <div>
        <span className="phase1Eyebrow">WHOLE-SCHOOL STAFF PLATFORM · PHASE 1</span>
        <h1>Good {greeting()}, {firstName(profile.full_name)}.</h1>
        <p>Your homepage now brings together today’s timetable, meetings, school notices, deadlines and the main areas you use most.</p>
        <span className="phase1RolePill">{STAFF_ROLE_LABELS[profile.role]}{profile.department ? ` · ${profile.department}` : ""}</span>
      </div>
      <div className="phase1HeroActions">
        <a className="phase1Button primary" href={primary.href} onClick={() => rememberTool(primary.href)}>{primary.label}</a>
        <a className="phase1Button" href={recommendation.href}>{recommendation.title}</a>
        <a className="phase1Button" href="/school-assistant" onClick={() => rememberTool("/school-assistant")}>School assistant</a>
      </div>
    </section>

    {message && <div className="phase1Message">{message}</div>}

    <section className="phase1Section">
      <div className="phase1SectionHead"><div><span className="phase1Eyebrow">TODAY</span><h2>{formatLongDate(new Date())}</h2><p>What you need without opening several parts of the platform.</p></div><div className="phase1DateLine"><span className="phase1NoticeBadge">{timetable?.week || "No timetable"}</span><strong>{attentionItems.length}</strong> item{attentionItems.length === 1 ? "" : "s"} needing attention</div></div>
      <div className="phase1TodayGrid">
        <article className="phase1Panel">
          <div className="phase1PanelHead"><h3>Today’s timetable</h3><a href="/staff-timetable" onClick={() => rememberTool("/staff-timetable")}>Open timetable →</a></div>
          <div className="phase1Timeline">
            {todayLessons.slice(0, 6).map(lesson => <div className="phase1TimelineItem" key={lesson.id}><span className="phase1Time">{lesson.start}</span><div><strong>P{lesson.period} · {lesson.subject}{lesson.className ? ` · ${lesson.className}` : ""}</strong><span>{lesson.room || "Room not set"}</span></div></div>)}
            {!todayLessons.length && <div className="phase1Empty">{timetable ? `No ${timetable.week} lessons are listed for ${weekday}.` : "Add your timetable to see today’s lessons automatically."}</div>}
          </div>
        </article>

        <article className="phase1Panel">
          <div className="phase1PanelHead"><h3>Meetings & events</h3><a href="/calendar" onClick={() => rememberTool("/calendar")}>Calendar →</a></div>
          <div className="phase1Timeline">
            {visibleEvents.slice(0, 5).map(event => <div className="phase1TimelineItem" key={event.id}><span className="phase1Time">{event.all_day ? "All day" : formatClock(event.starts_at)}</span><div><strong>{event.title}</strong><span>{event.location || event.category}</span></div></div>)}
            {!visibleEvents.length && <div className="phase1Empty">No calendar events are scheduled for today.</div>}
          </div>
        </article>

        <article className="phase1Panel">
          <div className="phase1PanelHead"><h3>School notices</h3><a href="/notices" onClick={() => rememberTool("/notices")}>All notices →</a></div>
          <div className="phase1Timeline">
            {currentNotices.slice(0, 4).map(notice => <div className="phase1TimelineItem" key={notice.id}><span className={`phase1NoticeBadge ${notice.priority}`}>{notice.priority === "normal" ? notice.category : notice.priority}</span><div><strong>{notice.title}</strong><small>{noticeReadMap.has(notice.id) ? "Read" : "Unread"}{notice.requires_acknowledgement && !noticeReadMap.get(notice.id)?.acknowledged_at ? " · acknowledgement needed" : ""}</small></div></div>)}
            {!currentNotices.length && <div className="phase1Empty">No current notices for your account.</div>}
          </div>
        </article>

        <article className="phase1Panel">
          <div className="phase1PanelHead"><h3>Tasks & deadlines</h3><a href="/training" onClick={() => rememberTool("/professional-learning")}>Development →</a></div>
          <div className="phase1Timeline">
            {todayTasks.slice(0, 3).map(task => <div className="phase1TimelineItem" key={task.id}><span className="phase1Time">{task.period || "Task"}</span><div><strong>{task.title}</strong><span>{task.type}{task.notes ? ` · ${task.notes}` : ""}</span></div></div>)}
            {openAssignments.filter(item => item.due_date && item.due_date <= todayKey).slice(0, 2).map(item => <div className="phase1TimelineItem" key={item.id}><span className="phase1Time">Due</span><div><strong>{item.title_snapshot}</strong><span>{item.due_date ? formatDate(item.due_date) : "Today"}</span></div></div>)}
            {!todayTasks.length && !openAssignments.some(item => item.due_date && item.due_date <= todayKey) && <div className="phase1Empty">Nothing urgent is due today.</div>}
          </div>
        </article>
      </div>
    </section>

    <section className="phase1Section">
      <div className="phase1SectionHead"><div><span className="phase1Eyebrow">MAIN AREAS</span><h2>Where do you need to go?</h2><p>Ordered for your role. You can personalise the order on this device.</p></div><div className="phase1UtilityActions"><button className="phase1Button subtle" type="button" onClick={() => setCustomising(value => !value)}>{customising ? "Finish customising" : "Customise cards"}</button>{customising && <button className="phase1Button subtle" type="button" onClick={resetAreaOrder}>Reset order</button>}</div></div>
      {customising && <div className="phase1CustomizeHint">Use the arrow buttons on each card to move it earlier or later. Your order is saved automatically.</div>}
      <div className="phase1AreaGrid" aria-label="Main platform areas">
        {orderedCards.map((card, index) => {
          const allowed = hasStaffPermission(profile.role, card.permission);
          return <article key={card.id} className={`phase1AreaCard ${recommended.has(card.id) ? "recommended" : ""} ${allowed ? "" : "restricted"}`}>
            {customising && <div className="phase1Reorder"><button type="button" onClick={() => moveArea(index, -1)} disabled={index === 0} aria-label={`Move ${card.title} earlier`}>←</button><button type="button" onClick={() => moveArea(index, 1)} disabled={index === orderedCards.length - 1} aria-label={`Move ${card.title} later`}>→</button></div>}
            <span className="phase1AreaIcon" aria-hidden="true">{card.icon}</span><span className="phase1Eyebrow">{card.eyebrow}</span><h3>{card.title}</h3><p>{card.description}</p>
            {recommended.has(card.id) && <span className="phase1Badge">Recommended for your role</span>}
            <div className="phase1CardActions">{allowed ? <a className="phase1Button primary" href={card.href} onClick={() => rememberTool(card.href)}>Open {card.title} →</a> : <span className="phase1Button" aria-disabled="true">Role restricted</span>}</div>
          </article>;
        })}
      </div>
    </section>

    <section className="phase1TwoCol">
      <article className="phase1Panel">
        <div className="phase1PanelHead"><h3>Things needing attention</h3><a href="/recommendations">Smart recommendations →</a></div>
        <div className="phase1AttentionList">
          {attentionItems.map(item => <div key={item.id} className={`phase1AttentionItem ${item.tone}`}><div><strong>{item.title}</strong><span>{item.detail}</span></div><a href={item.href}>Open →</a></div>)}
          {!attentionItems.length && <div className="phase1Empty">You are up to date. New deadlines, reviews and acknowledgements will appear here.</div>}
        </div>
      </article>
      <article className="phase1Panel">
        <div className="phase1PanelHead"><h3>Recently used & useful</h3><span className="phase1FooterNote">Updates as you use dashboard tools</span></div>
        <div className="phase1RecentList">{recentToolObjects.map(tool => <a key={tool.href} className="phase1RecentTool" href={tool.href} onClick={() => rememberTool(tool.href)}><span aria-hidden="true">{tool.icon}</span><div><strong>{tool.title}</strong><small>{tool.subtitle}</small></div></a>)}</div>
      </article>
    </section>

    {isAdminView && <section className="phase1AdminPanel">
      <span className="phase1Eyebrow">LEADERSHIP / ADMIN VIEW</span><h2>Whole-school activity</h2><p>Quick operational signals and direct access to the areas that need leadership oversight.</p>
      <div className="phase1AdminStats"><div><strong>{memberCount ?? "—"}</strong><span>school members</span></div><div><strong>{currentNotices.length}</strong><span>current notices</span></div><div><strong>{visibleEvents.length}</strong><span>events today</span></div><div><strong>{attentionItems.length}</strong><span>your action items</span></div></div>
      <div className="phase1CompactLinks"><a className="phase1Button primary" href="/leadership-dashboard" onClick={() => rememberTool("/leadership-dashboard")}>Leadership dashboard</a><a className="phase1Button" href="/admin-centre" onClick={() => rememberTool("/admin-centre")}>Admin centre</a><a className="phase1Button" href="/staff-access" onClick={() => rememberTool("/staff-access")}>Staff access</a><a className="phase1Button" href="/notices" onClick={() => rememberTool("/notices")}>Manage notices</a></div>
    </section>}

    <section className="phase1Section">
      <div className="phase1SectionHead"><div><span className="phase1Eyebrow">YOUR DEVELOPMENT</span><h2>Professional learning at a glance</h2><p>The existing CPD and impact information remains connected below the daily workspace.</p></div></div>
      <div className="phase1Stats"><div className="phase1Stat"><strong>{progress.filter(item => item.completed_at).length}</strong><span>completed CPD</span></div><div className="phase1Stat"><strong>{openAssignments.length}</strong><span>open assignments</span></div><div className="phase1Stat"><strong>{activeTargets.length}</strong><span>active targets</span></div><div className="phase1Stat"><strong>{pendingReviews.length}</strong><span>follow-ups ahead</span></div></div>
      <div className="phase1Development">
        <article className="phase1Panel"><span className="phase1Eyebrow">RECOMMENDED NEXT ACTION</span><h3>{recommendation.title}</h3><p>{recommendation.text}</p><div className="phase1CardActions"><a className="phase1Button primary" href={recommendation.href}>Continue →</a><a className="phase1Button" href="/professional-learning" onClick={() => rememberTool("/professional-learning")}>Professional Learning Hub</a></div></article>
        <article className="phase1Panel"><span className="phase1Eyebrow">PERSONAL PATHWAY</span><h3>{activePathway?.goal || "No active personal pathway"}</h3><div className="phase1CourseList">{pathwayCourses.slice(0, 4).map(course => <div className="phase1CourseRow" key={course.id}><strong>{course.title}</strong><span>{completed.has(course.id) ? "Completed" : "Next"}</span></div>)}{!pathwayCourses.length && <div className="phase1Empty">Build a personal pathway from your role and current goals.</div>}</div><div className="phase1CardActions"><a className="phase1Button" href="/pathways/personal">Open pathway</a><a className="phase1Button" href="/portfolio">Portfolio</a></div></article>
      </div>
    </section>
  </main>;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
