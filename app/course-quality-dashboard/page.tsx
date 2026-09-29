import { courseFinalQaSummary } from "@/lib/catalogue";

function status(report: (typeof courseFinalQaSummary.reports)[number]) {
  if (!report.passed) return { label: "Critical", cls: "warn" };
  if (report.warnings) return { label: "Ready with warnings", cls: "warn" };
  return { label: "Ready", cls: "good" };
}

export default function CourseQualityDashboardPage() {
  const qa = courseFinalQaSummary;
  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">PHASE 8 · FINAL QUALITY ASSURANCE</span>
      <h1>Final course quality dashboard</h1>
      <p>This is the last gate in the course-improvement programme. It combines the Phase 1–7 checks with final checks for unfinished copy, presentation pacing, interaction balance, accessibility, mastery, follow-through and facilitator-route integrity.</p>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/course-audit">Open detailed audit</a><a className="secondary phaseLinkButton" href="/facilitator">Test facilitator routes</a><a className="secondary phaseLinkButton" href="/">Open CPD library</a></div>
    </section>

    <section className="stageStatGrid">
      <div className="stageStat"><strong>{qa.courseCount}</strong><span>courses checked</span></div>
      <div className="stageStat"><strong>{qa.passed}/{qa.courseCount}</strong><span>critical QA passed</span></div>
      <div className="stageStat"><strong>{qa.withWarnings}</strong><span>courses with advisory warnings</span></div>
      <div className="stageStat"><strong>{qa.averagePercent}%</strong><span>average final QA score</span></div>
    </section>

    <section className="stageGrid">
      <article className="stageCard stageSpan6"><span className="eyebrow">BUILD-BLOCKING CHECKS</span><h2>Critical quality gates</h2><div className="stageList">
        {[
          ["Identity", "Unique course/module IDs and a valid course opening."],
          ["Finished content", "No TODO, placeholder, coming-soon or unfinished copy."],
          ["Presentation", "Phase 3 visuals and pacing with no run of more than three text-heavy slides."],
          ["Practice & mastery", "All Phase 4 practice and Phase 5 mastery requirements remain intact."],
          ["Follow-through", "Phase 6 retrieval and 7/30/90-day impact cycle remain available."],
          ["Facilitation", "All four Phase 7 routes have exact timing, substantive learning, interaction and transfer."],
          ["Accessibility", "Visual and interactive content has meaningful labels, text and instructions."],
        ].map(([title, detail]) => <div className="stageRow" key={title}><div className="stageRowMain"><strong>{title}</strong><span>{detail}</span></div><span className="stageBadge good">Enforced</span></div>)}
      </div></article>
      <article className="stageCard stageSpan6"><span className="eyebrow">ADVISORY CHECKS</span><h2>Warnings that do not block a build</h2><div className="stageList">
        <div className="stageRow"><div className="stageRowMain"><strong>Learning objectives</strong><span>Three to six usable objectives with enough detail to guide delivery.</span></div><span className="stageBadge">Review</span></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Interaction density</strong><span>Enough interactive or reflective modules to avoid a passive course.</span></div><span className="stageBadge">Review</span></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Repeated slide titles</strong><span>Flags titles reused excessively across one course.</span></div><span className="stageBadge">Review</span></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Course summary</strong><span>Checks that the purpose is described clearly enough for staff choosing a course.</span></div><span className="stageBadge">Review</span></div>
      </div></article>
    </section>

    <section className="stageCard">
      <span className="eyebrow">ALL COURSES</span><h2>Final QA results</h2>
      <div className="stageList">{qa.reports.map(report => {
        const state = status(report);
        const failed = report.checks.filter(item => !item.passed);
        return <details className="stageRow" key={report.courseId}>
          <summary className="stageRowMain" style={{cursor:"pointer"}}><strong>{report.title}</strong><span>{report.percent}% · {report.criticalFailures} critical failures · {report.warnings} warnings</span></summary>
          <span className={`stageBadge ${state.cls}`}>{state.label}</span>
          <div style={{width:"100%",paddingTop:12}} className="stageList">
            {report.checks.map(item => <div className="stageRow" key={item.id}><div className="stageRowMain"><strong>{item.label}</strong><span>{item.detail}</span></div><span className={`stageBadge ${item.passed?"good":item.critical?"warn":""}`}>{item.passed?"Pass":item.critical?"Fail":"Warning"}</span></div>)}
            {failed.length === 0 && <div className="stageRow"><div className="stageRowMain"><strong>No issues detected</strong><span>This course passed every final QA check.</span></div><span className="stageBadge good">Ready</span></div>}
          </div>
        </details>;
      })}</div>
    </section>
  </main>;
}
