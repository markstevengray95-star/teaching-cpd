import Link from "next/link";
import "../../components/WholeSiteDemo.css";
import "../../components/WholeSiteDemoPlus.css";
import "../../components/DemoSetupGuide.css";

export const metadata = {
  title: "Setup & Tools Guide | Teaching CPD Demo",
  description: "A fictional walkthrough of how a school could set up Teaching CPD and the tools included in the platform.",
};

const steps = [
  ["01", "Create the school workspace", "Set the school name, academic year, main site and initial administrator. Keep the public demo fictional; real school setup happens only after sign-in."],
  ["02", "Add staff and permissions", "Import or add staff, departments and roles. Teachers see teaching and learning tools; leaders and administrators receive the additional management views they need."],
  ["03", "Connect sign-in and integrations", "Configure school sign-in and supported Google workflows. Check permissions before inviting the wider staff body."],
  ["04", "Choose CPD and required training", "Assign school priorities, required training, department CPD and optional pathways. Staff then see a personal learning queue rather than the whole catalogue at once."],
  ["05", "Configure school tools", "Add notices, calendar items, policies, forms, resources, departments and school-improvement priorities so staff have a useful everyday homepage."],
  ["06", "Build or import the timetable", "Add staff contracts, curriculum requirements, rooms and constraints, then generate and review the whole-school timetable before publishing allocations to teacher planners."],
  ["07", "Pilot, review and launch", "Test with a small staff group, check access and workflows, review feedback, then expand to the whole school when the configuration is ready."],
];

const groups = [
  { title: "CPD & professional learning", items: ["Full CPD catalogue", "Micro-CPD", "Required training", "Personal pathways", "Coaching", "Appraisal & objectives", "Certificates", "CPD impact", "Department CPD", "Live CPD sessions"] },
  { title: "Teaching & planning", items: ["Teacher timetable", "Lesson planner", "Curriculum planner", "Resource generator", "Teaching strategies", "Department hub", "Learning walks", "AI CPD tutor", "Lesson resources"] },
  { title: "Student support", items: ["Unified pupil profile", "SEND workspace", "EAL assessment", "Reading information", "Interventions", "Review tracking", "Pastoral support", "Regulation check-ins", "Support plans"] },
  { title: "Whole-school timetable", items: ["18 / 40 / 75 / 120 staff demos", "Full and part-time contracts", "Rooms", "Curriculum requirements", "Hard and soft constraints", "Timetable generation", "Workload review", "Cover", "Daily changes", "Publish to staff planners"] },
  { title: "School operations", items: ["Calendar", "Notices", "Forms & approvals", "Trips & visits", "Policy centre", "Staff directory", "School improvement", "Staff voice", "Resource library", "Knowledge base"] },
  { title: "Leadership & reporting", items: ["CPD completion", "Required-training status", "Implementation evidence", "Department analytics", "Intervention review", "School-improvement tracking", "Timetable workload", "Launch readiness"] },
  { title: "Administration", items: ["School setup", "Staff access", "Role permissions", "Organisation settings", "Staff sync", "Google integrations", "Course creation", "School reporting", "Launch checks"] },
  { title: "Resources & support", items: ["Policy summaries", "School files", "Trusted resource library", "Search", "Knowledge base", "School AI assistant", "Help", "Accessibility tools"] },
];

const roles = [
  ["Teacher", "Courses, timetable, lesson planning, classroom tools, student support, notices and personal development."],
  ["Head of Department", "Teacher tools plus department planning, curriculum oversight, department CPD and analytics."],
  ["SEND / EAL", "Student support, interventions, plans, EAL / reading workflows and review activity."],
  ["SLT", "Whole-school reporting, school improvement, approvals, CPD oversight and timetable review."],
  ["School Admin", "School setup, accounts, permissions, timetable publishing, integrations and administration."],
];

export default function DemoSetupPage() {
  return <main className="dsgShell">
    <header className="dsgTopbar">
      <Link href="/demo" className="dsgBrand"><span>TCPD</span><div><strong>Teaching CPD</strong><small>Demo setup & tools guide</small></div></Link>
      <div className="dsgFlag">PUBLIC GUIDE · FICTIONAL EXAMPLES</div>
      <nav><Link href="/demo">← Back to interactive demo</Link><Link className="primary" href="/procurement">Buyer information</Link></nav>
    </header>

    <section className="dsgHero">
      <div><span className="eyebrow">SETUP & TOOL DIRECTORY</span><h1>How a school would set up and use the platform</h1><p>This guide shows the recommended rollout order and gives prospective schools a clear map of the main tools before they decide whether to trial or purchase the platform.</p><div className="dsgHeroActions"><Link className="primary" href="/demo">Try the interactive school</Link><a href="#setup">View setup steps</a><a href="#tools">Browse all tools</a></div></div>
      <aside><strong>Suggested first demo</strong><ol><li>Open a CPD course</li><li>View teacher planning</li><li>Inspect progress tracking</li><li>Open Time Maker</li><li>Switch to SLT and review reports</li></ol></aside>
    </section>

    <section className="dsgSection" id="setup">
      <div className="dsgSectionHead"><span className="eyebrow">ROLL-OUT</span><h2>Seven-step school setup</h2><p>Start with access and essential workflows, test with a small group, then expand. This keeps setup manageable and avoids switching everything on at once.</p></div>
      <div className="dsgSteps">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section className="dsgSection dsgTint" id="roles">
      <div className="dsgSectionHead"><span className="eyebrow">ROLE-BASED EXPERIENCE</span><h2>Different staff see different priorities</h2><p>The live platform uses role and school access to reduce clutter. Restricted pupil-support areas keep their additional access controls.</p></div>
      <div className="dsgRoleGrid">{roles.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="dsgSection" id="tools">
      <div className="dsgSectionHead"><span className="eyebrow">WHAT IS INCLUDED</span><h2>Useful tools and sections</h2><p>The goal is a connected staff platform: professional learning links to classroom practice, support tracking and school operations rather than sitting as a separate CPD website.</p></div>
      <div className="dsgToolGrid">{groups.map(group => <article key={group.title}><h3>{group.title}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>

    <section className="dsgSection dsgTint" id="timetable">
      <div className="dsgSectionHead"><span className="eyebrow">TIMETABLE SETUP</span><h2>Teacher planner + whole-school Time Maker</h2><p>These are connected but serve different jobs.</p></div>
      <div className="dsgCompare"><article><span>TEACHER VIEW</span><h3>Timetable & lesson planner</h3><p>Each teacher sees their own lessons, free periods, lesson topics, next lessons, resources and planning notes.</p><ul><li>Personal week view</li><li>Subject / class organisation</li><li>Topic sequence</li><li>Resources and notes</li><li>Published allocation updates</li></ul></article><article><span>SCHOOL VIEW</span><h3>Time Maker</h3><p>Administrators and timetablers build the whole-school schedule before publishing allocations to staff.</p><ul><li>Staff and working patterns</li><li>Curriculum requirements</li><li>Rooms and constraints</li><li>Generate multiple options</li><li>Review clashes and workload</li><li>Publish to staff planners</li></ul></article></div>
    </section>

    <section className="dsgSection" id="tracking">
      <div className="dsgSectionHead"><span className="eyebrow">TRACKING</span><h2>What schools can follow over time</h2><p>The platform focuses on review and evidence rather than ranking people.</p></div>
      <div className="dsgTrackingGrid"><article><strong>CPD</strong><p>Assignment → progress → completion → implementation → impact.</p></article><article><strong>Interventions</strong><p>Baseline → strategy → evidence → review → next action.</p></article><article><strong>School improvement</strong><p>Priority → owner → milestone → evidence → review.</p></article><article><strong>Timetable</strong><p>Draft → constraint checks → workload review → publish → daily changes.</p></article></div>
    </section>

    <section className="dsgSection dsgChecklist">
      <div><span className="eyebrow">BEFORE A REAL LAUNCH</span><h2>Recommended school checklist</h2><p>Confirm access, data handling, local policies, staff roles and pilot workflows before using live school information.</p></div>
      <div className="dsgCheckGrid"><span>□ School admin confirmed</span><span>□ Staff roles reviewed</span><span>□ Sign-in tested</span><span>□ Policies checked</span><span>□ CPD priorities chosen</span><span>□ Timetable data checked</span><span>□ Pupil-support access reviewed</span><span>□ Pilot group completed</span></div>
    </section>

    <footer className="dsgFooter"><div><h2>Continue exploring</h2><p>Return to the fictional school demo to try the workflows, or open the buyer pack when you want to review procurement information.</p></div><div><Link href="/demo">Interactive demo</Link><Link className="primary" href="/procurement">Buyer information</Link></div></footer>
  </main>;
}
