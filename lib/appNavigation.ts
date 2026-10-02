import { hasStaffPermission, permissionForPath, type StaffRole } from "./rolePermissions";

export type HomeView = "dashboard" | "courses" | "mycpd" | "certificates" | "profile";
export function homeViewFromSearch(search: string): HomeView {
  const params = new URLSearchParams(search);
  if (params.has("course")) return "courses";
  const view = params.get("view");
  return ["dashboard", "courses", "mycpd", "certificates", "profile"].includes(view || "") ? view as HomeView : "courses";
}
export function homeViewUrl(href: string, view: HomeView) {
  const url = new URL(href);
  url.searchParams.delete("course");
  url.searchParams.set("view", view);
  return url.pathname + url.search + url.hash;
}
export const NAVIGATION_EVENT = "teaching-cpd:navigation";
export type NavigationAccess = { role: StaffRole | null; legacyRole: string; platformAdmin: boolean };
type Gate = "leader" | "cpd" | "admin" | "platform";
export type NavigationTool = { href: string; label: string; description: string; group: string; gate?: Gate };
const entries = (group: string, rows: [string, string, string][], gate?: Gate): NavigationTool[] =>
  rows.map(([href, label, description]) => ({ href, label, description, group, ...(gate ? { gate } : {}) }));

export const navigationTools: NavigationTool[] = [
  ...entries("Learning", [
    ["/", "Course library", "Find short refreshers and full CPD courses."],
    ["/?view=mycpd", "My learning", "Continue courses and review your CPD record."],
    ["/professional-learning", "Learning overview", "Assigned CPD, goals and learning activity."],
    ["/develop", "Development hub", "Explore professional growth tools."],
    ["/development", "Development cycle", "Plan, learn, apply and review."],
    ["/pathways", "Connected pathways", "Courses that build on each other."],
    ["/pathways/personal", "Personal pathway", "Your tailored professional learning plan."],
    ["/recommendations", "Recommendations", "Suggested learning and pending priorities."],
    ["/micro-cpd", "Short courses", "Quick micro-CPD and refreshers."],
    ["/subject-cpd", "Subject-specific CPD", "Professional learning for your subject."],
    ["/reading", "Course reading", "Readings to deepen your understanding."],
    ["/adaptive", "Learning pre-check", "Identify what to focus on before a course."],
    ["/training", "Required training", "Track assigned and mandatory training."],
    ["/certificates", "Verified certificates", "Your digital CPD certificates."],
    ["/?view=certificates", "Printable certificates", "Print certificates from completed courses."],
    ["/reminders", "Learning reminders", "Spaced follow-up and refresher prompts."],
  ]),
  ...entries("Practice & reflection", [
    ["/ai-coach", "AI CPD tutor", "Discuss planning and professional learning."],
    ["/actions", "Action plans", "Choose a change to test in your classroom."],
    ["/coach", "CPD coaching plan", "Build a focused development plan."],
    ["/coaching", "Coaching conversations", "Record coaching and next steps."],
    ["/simulator", "Practice simulator", "Rehearse classroom decisions."],
    ["/needs-audit", "Needs audit", "Identify your development priorities."],
    ["/portfolio", "Evidence portfolio", "Collect evidence of professional growth."],
    ["/impact", "CPD impact", "Review the difference your learning makes."],
    ["/standards", "Professional standards", "Connect your learning to standards."],
    ["/external-cpd", "External CPD", "Record learning outside the platform."],
    ["/appraisal", "Appraisal & review", "Review objectives and development."],
  ]),
  ...entries("Teaching & student support", [
    ["/teach", "Teaching hub", "Classroom practice and planning tools."],
    ["/teaching-learning", "Teaching strategies", "Retrieval, questioning, feedback and literacy."],
    ["/resource-generator", "Teaching resource generator", "Create quizzes, worksheets and exit tickets."],
    ["/department-hub", "Department hub", "Shared department work and resources."],
    ["/curriculum", "Curriculum planning", "Subjects, topics and lessons."],
    ["/department-plans", "Department improvement plans", "Priorities, progress and evidence."],
    ["/students", "Student support hub", "Pastoral support, behaviour and inclusion."],
    ["/pastoral", "Pastoral support", "Tutor time, wellbeing and mentoring."],
    ["/regulation-behaviour", "Regulation & behaviour", "Support regulation and return to learning."],
    ["/send-eal", "SEND & EAL", "Inclusive adaptations and scaffolds."],
    ["/interventions", "Interventions", "Track goals, support and review dates."],
    ["/learning-walks", "Learning walks", "Record and review classroom practice."],
  ]),
  ...entries("School essentials", [
    ["/school", "School overview", "School operations and shared workflows."],
    ["/school-hub", "School development hub", "Policies, INSET, induction and governance."],
    ["/calendar", "School calendar", "Events, deadlines and personal reminders."],
    ["/notices", "School notices", "Updates and required acknowledgements."],
    ["/directory", "Staff directory", "Find colleagues and expertise."],
    ["/forms", "Forms & approvals", "Submit requests and track decisions."],
    ["/trips", "Trips & visits", "Plan visits and request approval."],
    ["/compliance", "Training compliance", "Review required training."],
    ["/induction", "Staff induction", "Support new staff development."],
    ["/departments", "Department development", "Connect department priorities to CPD."],
    ["/safeguarding", "Safeguarding", "Safeguarding training and guidance."],
    ["/safeguarding/documents", "Safeguarding documents", "Find supporting safeguarding materials."],
    ["/safety", "Health & safety", "Safety guidance and compliance."],
    ["/improvement", "CPD improvement priorities", "Connect school priorities to learning."],
    ["/school-improvement", "School improvement plan", "Strategic priorities and milestones."],
    ["/leadership-dashboard", "School leadership overview", "Priorities, approvals and upcoming activity."],
    ["/department-analytics", "Department analytics", "Review capacity and improvement."],
    ["/recognition", "Staff recognition", "Recognise positive contributions."],
    ["/staff-voice", "Staff voice", "Share ideas, suggestions and barriers."],
    ["/notifications", "Notifications", "School alerts relevant to you."],
  ]),
  ...entries("Resources & help", [
    ["/resources", "Resources hub", "School knowledge and information."],
    ["/resource-library", "Resource library", "Trusted resources and links."],
    ["/policies", "Policy centre", "Current policies and review dates."],
    ["/files", "School files", "Access private school documents."],
    ["/search", "Search school information", "Search notices, resources, people and plans."],
    ["/knowledge-base", "School knowledge base", "Guidance and frequently asked questions."],
    ["/school-assistant", "School AI assistant", "Ask questions grounded in school information."],
    ["/course-packs", "Course packs", "Supporting course materials."],
    ["/integrations", "Google integrations", "Sign-in, calendar and Drive workflows."],
    ["/help", "Help & support", "Find help using the platform."],
    ["/accessibility", "Accessibility", "Accessibility information and options."],
    ["/?view=profile", "My account", "Update your profile or sign out."],
    ["/account/username", "Account username", "Manage your login username."],
  ]),
  ...entries("Manage CPD", [
    ["/department-cpd", "Department CPD", "Coordinate department learning."],
    ["/leadership", "CPD leadership", "Review professional development."],
    ["/live", "Run live CPD", "Lead a live professional learning session."],
    ["/live-presenter", "Live presenter", "Present courses and activities."],
    ["/facilitator", "Facilitator packs", "Prepare to facilitate CPD."],
    ["/improvement/programmes", "Improvement programmes", "Link improvement to CPD programmes."],
  ], "leader"),
  ...entries("Manage CPD", [
    ["/procurement", "School procurement pack", "Information for school purchasing."],
    ["/school-onboarding", "School setup & tutorial", "Set up your school step by step."],
    ["/school-reporting", "School CPD reporting", "Completion, coverage and impact reporting."],
    ["/ai-course-builder", "AI course builder", "Create tailored professional learning."],
    ["/policy-training", "Policy training builder", "Connect school policies to training."],
    ["/builder", "Course creator", "Build a CPD course."],
    ["/course-studio", "Course studio", "Edit and organise course content."],
    ["/quality", "Annual CPD & quality", "Plan CPD and review quality."],
    ["/presentation-overhaul-final", "Presentation quality review", "Review course presentation quality."],
    ["/course-quality-dashboard", "Course quality dashboard", "Check course quality and readiness."],
    ["/course-audit", "Course audit", "Review course content and activities."],
  ], "cpd"),
  ...entries("Administration", [
    ["/admin-centre", "School admin centre", "Organisation-level administration."],
    ["/organisation", "Organisation settings", "School organisation and membership."],
    ["/school-access", "School access", "Manage school access and invitations."],
    ["/staff-access", "Staff access", "Manage staff login access."],
    ["/staff-sync", "Staff sync", "Synchronise staff records."],
    ["/launch-readiness", "Launch readiness", "Check school launch readiness."],
  ], "admin"),
  ...entries("Platform administration", [
    ["/admin", "Platform administration", "Restricted platform-level administration."],
    ["/owner-portal", "Owner portal", "Platform owner tools."],
    ["/platform", "Platform settings", "Platform management."],
    ["/managed-logins", "Managed logins", "Manage platform login accounts."],
  ], "platform"),
];

export function visibleNavigationTools(access: NavigationAccess) {
  return navigationTools.filter(tool => {
    const permission = permissionForPath(tool.href.split("?")[0]);
    if (permission && (!access.role || !hasStaffPermission(access.role, permission))) return false;
    if (!tool.gate) return true;
    if (tool.gate === "platform") return access.platformAdmin;
    if (tool.gate === "admin") return Boolean(access.role && hasStaffPermission(access.role, "admin:manage"));
    // Existing CPD pages still use the legacy staff profile role.
    if (tool.gate === "cpd") return ["CPD Lead", "Admin"].includes(access.legacyRole);
    return ["Department Lead", "CPD Lead", "Admin"].includes(access.legacyRole);
  });
}
export function searchNavigationTools(tools: NavigationTool[], query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return tools.filter(tool => words.every(word => `${tool.label} ${tool.description} ${tool.group}`.toLocaleLowerCase().includes(word)));
}
export function primaryNavigation(access: NavigationAccess) {
  const school = Boolean(access.role && hasStaffPermission(access.role, "school:view"));
  return [
    { href: "/dashboard", label: "Home" },
    { href: "/", label: "Courses" },
    { href: "/?view=mycpd", label: "My learning" },
    { href: school ? "/school" : "/resources", label: "School" },
  ];
}
export function isNavigationActive(pathname: string, search: string, href: string) {
  const target = new URL(href, "https://teaching-cpd.invalid");
  if (target.pathname === "/") return pathname === "/" && homeViewFromSearch(search) === homeViewFromSearch(target.search);
  return pathname === target.pathname || pathname.startsWith(target.pathname + "/");
}
export function hideAppNavigation(pathname: string) {
  return ["/auth", "/admin-login", "/owner-login", "/test-login", "/access", "/access-denied", "/join", "/verify", "/reset-password", "/procurement", "/offline", "/school-trial"].some(path => pathname === path || pathname.startsWith(path + "/"));
}
