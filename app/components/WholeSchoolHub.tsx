"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { STAFF_ROLE_LABELS, resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./WholeSchoolHub.css";

export type WholeSchoolArea = "teach" | "students" | "develop" | "school" | "resources";
type RoleId = StaffRole;
type ToolCard = { title: string; description: string; href: string; icon: string; roles?: RoleId[]; badge?: string };
type AreaConfig = { eyebrow: string; title: string; description: string; accent: string; tools: ToolCard[] };

const roles: { id: RoleId; label: string }[] = (Object.keys(STAFF_ROLE_LABELS) as RoleId[]).map((id) => ({ id, label: STAFF_ROLE_LABELS[id] }));
const leadershipRoles: RoleId[] = ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];
const seniorRoles: RoleId[] = ["slt", "administrator", "super-admin"];
const teachingRoles: RoleId[] = ["teacher", "tutor", "hod", "pastoral", "send-eal", "slt", "super-admin"];

const areaConfig: Record<WholeSchoolArea, AreaConfig> = {
  teach: {
    eyebrow: "TEACH", title: "Teaching & Learning", description: "Plan, improve and share classroom practice from one place. Teaching guidance, department work, curriculum planning and resource creation sit together.", accent: "Teaching",
    tools: [
      { title: "Teaching & Learning Hub", description: "Search practical strategies for retrieval, questioning, adaptive teaching, feedback, literacy and more.", href: "/teaching-learning", icon: "◎", roles: teachingRoles, badge: "Phase 31" },
      { title: "Teaching Resource Generator", description: "Create, edit, save and download retrieval tasks, quizzes, worksheets, exit tickets and more.", href: "/resource-generator", icon: "✎", roles: teachingRoles, badge: "Phase 32" },
      { title: "Department Hub", description: "Open notices, resources, assessments, meeting notes, key dates, staff and development work for your department.", href: "/department-hub", icon: "▦", roles: teachingRoles, badge: "Phase 33" },
      { title: "Curriculum Hub", description: "Browse and build curriculum by subject, year group, topic and lesson.", href: "/curriculum", icon: "▤", roles: teachingRoles, badge: "Phase 34" },
      { title: "Department Improvement Plans", description: "Review department priorities, progress, evidence and impact.", href: "/department-plans", icon: "↗", roles: teachingRoles, badge: "Phase 47" },
      { title: "Teaching & Learning CPD", description: "Open subject-specific and classroom-practice professional learning.", href: "/subject-cpd", icon: "✦", roles: teachingRoles, badge: "Existing" },
      { title: "Professional Standards", description: "Connect development activity to professional standards and expectations.", href: "/standards", icon: "✓", roles: teachingRoles, badge: "Existing" },
      { title: "Learning Walks", description: "Open the learning-walk and classroom-practice tools.", href: "/learning-walks", icon: "◎", roles: leadershipRoles, badge: "Existing" },
      { title: "AI CPD Tutor", description: "Ask for planning, reflection and professional-learning support.", href: "/ai-coach", icon: "✧", roles: teachingRoles, badge: "Existing" },
    ],
  },
  students: {
    eyebrow: "STUDENTS", title: "Pastoral, Regulation & Inclusion", description: "Tutor-time planning, pastoral support, regulation, behaviour, SEND, EAL and intervention tracking in one student-support area.", accent: "Student support",
    tools: [
      { title: "Pastoral Hub", description: "Plan tutor time and access assemblies, mentoring, attendance, behaviour, rewards, wellbeing and key pastoral dates.", href: "/pastoral", icon: "◎", badge: "Phase 35" },
      { title: "Regulation & Behaviour", description: "Use one consistent workflow for regulation support, behaviour, restorative response and return to learning.", href: "/regulation-behaviour", icon: "◉", badge: "Phase 36" },
      { title: "SEND & EAL Hub", description: "Find inclusive classroom adaptations, SEND strategies, EAL scaffolds and school-specific inclusion guidance.", href: "/send-eal", icon: "◇", badge: "Phase 37" },
      { title: "Intervention Tracking", description: "Set baselines and goals, record support, schedule reviews and track outcomes.", href: "/interventions", icon: "↻", badge: "Phase 38" },
    ],
  },
  develop: {
    eyebrow: "DEVELOP", title: "Professional Development", description: "Turn professional learning into an ongoing cycle of goals, courses, coaching, evidence, appraisal, needs analysis and impact review.", accent: "Professional growth",
    tools: [
      { title: "Professional Learning Hub", description: "Bring assigned CPD, course progress, development goals, external CPD and impact reviews into one workflow.", href: "/professional-learning", icon: "◎", badge: "Phase 39" },
      { title: "Professional Portfolio", description: "Keep CPD, coaching, evidence, achievements, reflections and impact in one professional record.", href: "/portfolio", icon: "▤", badge: "Phase 40" },
      { title: "Coaching", description: "Run structured coaching cycles linked to development targets, CPD, evidence and next actions.", href: "/coaching", icon: "◎", badge: "Phase 41" },
      { title: "Appraisal", description: "Manage the annual professional-review cycle, objectives, progress, evidence, support and next steps.", href: "/appraisal", icon: "✓", badge: "Phase 42" },
      { title: "Development Needs Audit", description: "Self-assess development needs and use the results to shape professional learning.", href: "/needs-audit", icon: "◫", badge: "Phase 58" },
      { title: "Staff Recognition", description: "Recognise specific contributions, teamwork and positive impact across the school.", href: "/recognition", icon: "★", badge: "Phase 60" },
      { title: "Compliance", description: "Open mandatory and compliance training records.", href: "/compliance", icon: "◉", badge: "Phase 48" },
      { title: "CPD Academy", description: "Browse and complete the full course library.", href: "/", icon: "▣", badge: "Core" },
      { title: "Micro CPD", description: "Open shorter refresher learning and focused professional development.", href: "/micro-cpd", icon: "◫", badge: "Existing" },
      { title: "Personal Pathway", description: "Follow personalised development routes and recommended learning.", href: "/pathways/personal", icon: "↗", badge: "Existing" },
    ],
  },
  school: {
    eyebrow: "SCHOOL", title: "Whole-school Operations", description: "Personal staff tools, timetable, shared communication, calendar, improvement, approvals, leadership intelligence, staff voice and administration in one area.", accent: "School systems",
    tools: [
      { title: "School Calendar", description: "See meetings, deadlines, CPD, trips and shared school events, plus private personal items.", href: "/calendar", icon: "◷", badge: "Phase 44" },
      { title: "Staff Directory", description: "Find colleagues by department, role and expertise.", href: "/directory", icon: "◎", badge: "Phase 45" },
      { title: "Staff Timetable", description: "Upload your timetable to auto-fill a personal two-week schedule, edit lessons and free periods, or open the separate demo timetable.", href: "/staff-timetable", icon: "◷", badge: "Staff tool" },
      { title: "School Improvement Plan", description: "Track strategic priorities, ownership, milestones, evidence and impact.", href: "/school-improvement", icon: "↗", roles: leadershipRoles, badge: "Phase 46" },
      { title: "Department Improvement Plans", description: "Track department priorities and connect them to whole-school improvement.", href: "/department-plans", icon: "▦", roles: leadershipRoles, badge: "Phase 47" },
      { title: "Forms & Approvals", description: "Submit school requests and track decisions in one workflow.", href: "/forms", icon: "✓", badge: "Phase 49" },
      { title: "Trips & Visits", description: "Start trip requests, record planning information and track approval.", href: "/trips", icon: "◇", badge: "Phase 50" },
      { title: "Leadership Dashboard", description: "See improvement, approvals, policy review and upcoming activity in one leadership view.", href: "/leadership-dashboard", icon: "▤", roles: leadershipRoles, badge: "Phase 56" },
      { title: "Department Analytics", description: "Compare department capacity, improvement actions and resources without ranking individual staff.", href: "/department-analytics", icon: "◎", roles: leadershipRoles, badge: "Phase 57" },
      { title: "New Staff Induction", description: "Support new staff through the existing induction workflow.", href: "/induction", icon: "✦", roles: leadershipRoles, badge: "Phase 59" },
      { title: "Staff Voice", description: "Review ideas, barriers and suggestions, including anonymous submissions.", href: "/staff-voice", icon: "✉", roles: leadershipRoles, badge: "Phase 61" },
      { title: "Notification Centre", description: "Publish targeted alerts and review school-wide notification signals.", href: "/notifications", icon: "◉", roles: leadershipRoles, badge: "Phase 66" },
      { title: "Google Integrations", description: "Check Google sign-in and Workspace workflow readiness.", href: "/integrations", icon: "G", roles: leadershipRoles, badge: "Phase 67" },
      { title: "Whole-school Admin Centre", description: "Manage access, health, compliance, integrations and organisation-level systems.", href: "/admin-centre", icon: "⚙", roles: seniorRoles, badge: "Phase 68" },
      { title: "Notices Centre", description: "Publish and manage targeted school notices and acknowledgements.", href: "/notices", icon: "✉", roles: leadershipRoles, badge: "Phase 43" },
      { title: "School Hub", description: "Open the existing whole-school development and organisation area.", href: "/school-hub", icon: "⌂", roles: leadershipRoles, badge: "Existing" },
      { title: "Platform Administration", description: "Open unrestricted platform administration for the Super Admin account.", href: "/admin", icon: "⚙", roles: ["super-admin"], badge: "Restricted" },
    ],
  },
  resources: {
    eyebrow: "RESOURCES", title: "Resources & Knowledge", description: "Search school information, open policies and resources, use grounded AI, manage files and keep up with alerts.", accent: "Find what you need",
    tools: [
      { title: "Universal Search", description: "Search notices, calendar, policies, resources, staff, plans, forms and trips.", href: "/search", icon: "⌕", badge: "Phase 53" },
      { title: "School AI Assistant", description: "Ask school-specific questions using only the records your account is allowed to read.", href: "/school-assistant", icon: "✧", badge: "Phase 54" },
      { title: "Smart Recommendations", description: "Surface overdue priorities, urgent notices, upcoming events and pending actions.", href: "/recommendations", icon: "↗", badge: "Phase 55" },
      { title: "Resource Library", description: "Browse and contribute trusted whole-school resources and links.", href: "/resource-library", icon: "▤", badge: "Phase 51" },
      { title: "Policy Centre", description: "Open current policy versions, review dates and staff-facing summaries.", href: "/policies", icon: "✓", badge: "Phase 52" },
      { title: "School File Centre", description: "Open private school files through signed, time-limited links.", href: "/files", icon: "▣", badge: "Phase 63" },
      { title: "Staff Directory", description: "Find people by role, department and expertise.", href: "/directory", icon: "◎", badge: "Phase 45" },
      { title: "Staff Recognition", description: "See and add specific examples of positive contribution.", href: "/recognition", icon: "★", badge: "Phase 60" },
      { title: "Notification Centre", description: "See targeted school notifications and smart alerts.", href: "/notifications", icon: "◉", badge: "Phase 66" },
      { title: "Google Integrations", description: "Open Google sign-in, calendar export and Drive-link workflows.", href: "/integrations", icon: "G", badge: "Phase 67" },
      { title: "School Calendar", description: "See school events relevant to you and add private reminders.", href: "/calendar", icon: "◷", badge: "Phase 44" },
      { title: "School Notices", description: "Read current notices and complete required acknowledgements.", href: "/notices", icon: "✉", badge: "Phase 43" },
      { title: "Knowledge Base", description: "Search the existing school knowledge and guidance area.", href: "/knowledge-base", icon: "⌕", badge: "Existing" },
      { title: "Safeguarding Documents", description: "Open safeguarding documents and supporting materials.", href: "/safeguarding/documents", icon: "▤", badge: "Existing" },
    ],
  },
};

const topNav: { id: "home" | WholeSchoolArea; label: string; href: string; icon: string }[] = [
  { id: "home", label: "Home", href: "/dashboard", icon: "⌂" },
  { id: "teach", label: "Teach", href: "/teach", icon: "✦" },
  { id: "students", label: "Students", href: "/students", icon: "◉" },
  { id: "develop", label: "Develop", href: "/develop", icon: "↗" },
  { id: "school", label: "School", href: "/school", icon: "▦" },
  { id: "resources", label: "Resources", href: "/resources", icon: "▤" },
];

function roleCanSee(role: RoleId, card: ToolCard) {
  if (!card.roles || card.roles.length === 0) return true;
  if (role === "super-admin") return true;
  return card.roles.includes(role);
}

export default function WholeSchoolHub({ area }: { area: WholeSchoolArea }) {
  const [role, setRole] = useState<RoleId>("teacher");
  const [authorizedRole, setAuthorizedRole] = useState<RoleId | null>(null);
  const config = areaConfig[area];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getUser();
      if (!data.user) return;
      const access = await resolveStaffAccess(client, data.user);
      if (!mounted) return;
      setAuthorizedRole(access.role);
      setRole(access.role);
      window.localStorage.setItem("staff-development-authorized-role", access.role);
      window.localStorage.setItem("staff-development-authorized-role-label", STAFF_ROLE_LABELS[access.role]);
    })().catch((error) => console.error("Could not resolve whole-school role", error));
    return () => { mounted = false; };
  }, []);

  const canPreview = authorizedRole === "super-admin";
  const visibleTools = useMemo(() => config.tools.filter((tool) => roleCanSee(role, tool)), [config.tools, role]);
  const roleLabel = STAFF_ROLE_LABELS[role];

  function changeRole(nextRole: RoleId) { if (canPreview) setRole(nextRole); }

  return (
    <main className="wholeSchoolHub">
      <header className="wholeSchoolHeader">
        <Link href="/dashboard" className="wholeSchoolBrand" aria-label="Teaching CPD home"><span className="wholeSchoolBrandMark">TC</span><span><strong>Teaching CPD</strong><small>Whole-school staff platform</small></span></Link>
        <nav className="wholeSchoolTopNav" aria-label="Whole-school areas">{topNav.map((item) => <Link key={item.id} href={item.href} className={item.id === area ? "active" : ""}><span>{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="wholeSchoolRole">{canPreview ? <><span>Preview as</span><select value={role} onChange={(event) => changeRole(event.target.value as RoleId)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></> : <><span>Your role</span><strong>{authorizedRole ? STAFF_ROLE_LABELS[authorizedRole] : "Checking…"}</strong></>}</div>
      </header>
      <section className="wholeSchoolHero"><div><span className="wholeSchoolEyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p><div className="wholeSchoolHeroMeta"><span>{config.accent}</span><span>{visibleTools.length} tools for {roleLabel}</span></div></div><div className="wholeSchoolHeroCard"><span>WHOLE-SCHOOL PLATFORM</span><strong>Teaching CPD and school systems together.</strong><p>CPD, inclusion, improvement, operations and resources now share one clear navigation structure.</p></div></section>
      <section className="wholeSchoolSectionHeading"><div><span>{canPreview ? "ADMIN PREVIEW" : "YOUR ACCESS"}</span><h2>{roleLabel} tools</h2></div><p>{canPreview ? "Previewing changes what the super admin sees here; it never changes the account’s real permissions." : "Your signed-in school role controls this view."}</p></section>
      <section className="wholeSchoolToolGrid">{visibleTools.map((tool) => <Link key={`${tool.title}-${tool.href}`} href={tool.href} className="wholeSchoolToolCard"><div className="wholeSchoolToolIcon">{tool.icon}</div><div className="wholeSchoolToolCopy"><div className="wholeSchoolToolTitleRow"><h3>{tool.title}</h3>{tool.badge && <span>{tool.badge}</span>}</div><p>{tool.description}</p><strong>Open tool →</strong></div></Link>)}</section>
      {visibleTools.length === 0 && <section className="wholeSchoolEmpty"><strong>No tools are assigned to this role in this area yet.</strong><p>Choose another whole-school area above.</p></section>}
    </main>
  );
}
