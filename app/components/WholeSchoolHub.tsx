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
      { title: "SEN department", description: "Connected support plans, pupil passports, provision reviews, EAL assessment and regulation tools.", href: "/sen", icon: "◇", badge: "Inclusion workspace" },
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

function roleCanSee(role: RoleId, card: ToolCard) {
  if (!card.roles || card.roles.length === 0) return true;
  if (role === "super-admin") return true;
  return card.roles.includes(role);
}

const everydayTools: Record<WholeSchoolArea, string[]> = {
  teach: ["/resource-generator", "/teaching-learning", "/curriculum", "/department-hub"],
  students: ["/pastoral", "/regulation-behaviour", "/send-eal", "/interventions"],
  develop: ["/", "/professional-learning", "/portfolio", "/coaching", "/needs-audit", "/pathways/personal"],
  school: ["/staff-timetable", "/calendar", "/directory", "/forms", "/trips", "/notices"],
  resources: ["/search", "/policies", "/resource-library", "/files", "/school-assistant", "/knowledge-base"],
};

export default function WholeSchoolHub({ area }: { area: WholeSchoolArea }) {
  const [role, setRole] = useState<RoleId>("teacher");
  const [authorizedRole, setAuthorizedRole] = useState<RoleId | null>(null);
  const [search, setSearch] = useState("");
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
  const matchingTools = visibleTools.filter(tool => (tool.title+" "+tool.description).toLowerCase().includes(search.trim().toLowerCase()));
  const searching = Boolean(search.trim());
  const priority = everydayTools[area];
  const startTools = priority.flatMap(href => visibleTools.filter(tool => tool.href === href));
  const extraTools = visibleTools.filter(tool => !priority.includes(tool.href));
  const managementTools = extraTools.filter(tool => tool.roles && tool.roles.every(item => leadershipRoles.includes(item)));
  const otherTools = extraTools.filter(tool => !managementTools.includes(tool));
  const roleLabel = STAFF_ROLE_LABELS[role];

  function changeRole(nextRole: RoleId) { if (canPreview) setRole(nextRole); }
  function cards(tools: ToolCard[]) {
    return <div className="wholeSchoolToolGrid">{tools.map((tool) => <Link key={tool.href} href={tool.href} className="wholeSchoolToolCard"><div className="wholeSchoolToolIcon">{tool.icon}</div><div className="wholeSchoolToolCopy"><div className="wholeSchoolToolTitleRow"><h3>{tool.title}</h3>{tool.badge==="Restricted" && <span>{tool.badge}</span>}</div><p>{tool.description}</p><strong>Open tool →</strong></div></Link>)}</div>;
  }

  return (
    <main className="wholeSchoolHub">
      <header className="wholeSchoolHeader">
        <div className="wholeSchoolRole">{canPreview ? <><span>Preview as</span><select value={role} onChange={(event) => changeRole(event.target.value as RoleId)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></> : <><span>Your role</span><strong>{authorizedRole ? STAFF_ROLE_LABELS[authorizedRole] : "Checking…"}</strong></>}</div>
      </header>
      <section className="wholeSchoolHero"><div><span className="wholeSchoolEyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p><div className="wholeSchoolHeroMeta"><span>{config.accent}</span><span>{roleLabel}</span></div></div></section>
      <section className="wholeSchoolSectionHeading"><div><span>{canPreview ? "ADMIN PREVIEW" : "YOUR ACCESS"}</span><h2>{searching ? "Search results" : "Start here"}</h2></div><p>{canPreview ? "Previewing changes what the super admin sees here; it never changes the account’s real permissions." : "Common tasks first. More specialist tools are grouped below."}</p></section>
      <div className="wholeSchoolToolSearch"><label>Find a tool in this area<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search by task or topic…"/></label><p role="status">{searching ? matchingTools.length + " matching tools" : "Search includes specialist tools"}</p></div>
      {searching ? cards(matchingTools) : <>
        {cards(startTools)}
        <div className="wholeSchoolAdditionalTools">{[{title:"More tools in this area",tools:otherTools},{title:"Leadership & school management",tools:managementTools}].filter(group=>group.tools.length).map(group=><details key={area + role + group.title}><summary>{group.title}<span>{group.tools.length}</span></summary>{cards(group.tools)}</details>)}</div>
      </>}
      {matchingTools.length === 0 && <section className="wholeSchoolEmpty"><strong>{search.trim()?"No tools match your search.":"No tools are assigned to this role in this area yet."}</strong><p>{search.trim()?"Try a shorter search or clear it to see every available tool.":"Open All tools to choose another area."}</p>{search.trim()&&<button type="button" className="secondary" onClick={()=>setSearch("")}>Clear search</button>}</section>}
    </main>
  );
}
