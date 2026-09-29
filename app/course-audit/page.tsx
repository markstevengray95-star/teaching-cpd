import { courseQualityAudit } from "@/lib/catalogue";

function statusLabel(status: string) {
  if (status === "excellent") return "Excellent";
  if (status === "secure") return "Secure";
  if (status === "developing") return "Developing";
  return "Priority";
}

export default function CourseAuditPage() {
  const audit = courseQualityAudit;
  const topPriorities = audit.weakestDimensions.slice(0, 5);

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASE 1 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every CPD course now uses one quality standard.</h1>
        <p>
          This automated audit scores the live course catalogue against the same 100-point framework. It checks purpose,
          learning objectives, presentation structure, diagnostic baseline, knowledge depth, visuals, practical rehearsal,
          scenarios, assessment, reflection, implementation and presentation balance.
        </p>
        <div className="stageHeroActions">
          <a className="primary phaseLinkButton" href="/">Open CPD library</a>
          <a className="secondary phaseLinkButton" href="/quality">School QA & annual planning</a>
        </div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{audit.courseCount}</strong><span>courses audited</span></div>
        <div className="stageStat"><strong>{audit.averagePercent}%</strong><span>library average</span></div>
        <div className="stageStat"><strong>{audit.phaseOneReady}</strong><span>Phase 1 ready</span></div>
        <div className="stageStat"><strong>{audit.templateVersion}</strong><span>template version</span></div>
      </section>

      <section className="stageGrid">
        <article className="stageCard stageSpan5">
          <span className="eyebrow">QUALITY DISTRIBUTION</span>
          <h2>Current library position</h2>
          <div className="stageList">
            <div className="stageRow"><div className="stageRowMain"><strong>Excellent</strong><span>90–100%</span></div><span className="stageBadge good">{audit.excellent}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Secure</strong><span>78–89%</span></div><span className="stageBadge good">{audit.secure}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Developing</strong><span>62–77%</span></div><span className="stageBadge warn">{audit.developing}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Priority</strong><span>Below 62%</span></div><span className="stageBadge warn">{audit.priority}</span></div>
          </div>
        </article>

        <article className="stageCard stageSpan7">
          <span className="eyebrow">PHASE 2 TARGETS</span>
          <h2>Weakest dimensions across the whole catalogue</h2>
          <div className="stageList">
            {topPriorities.map(row => (
              <div className="stageRow" key={row.id}>
                <div className="stageRowMain">
                  <strong>{row.label}</strong>
                  <span>{row.failingCourses} course{row.failingCourses === 1 ? "" : "s"} below the standard</span>
                </div>
                <span className={`stageBadge ${row.averagePercent >= 78 ? "good" : "warn"}`}>{row.averagePercent}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="stageCard">
        <span className="eyebrow">COMMON COURSE TEMPLATE</span>
        <h2>One learning journey for every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Orient", "Purpose, audience, outcomes and the visual learning journey."],
            ["2", "Diagnose", "A baseline reflection or check activates prior knowledge."],
            ["3", "Learn", "Core professional knowledge is taught in manageable chunks."],
            ["4", "Explore", "Models, examples, diagrams and non-examples make ideas visible."],
            ["5", "Practise", "Staff rehearse the skill in a realistic professional context."],
            ["6", "Decide", "Scenarios test judgement rather than simple recall."],
            ["7", "Check", "Knowledge checks expose misconceptions and give feedback."],
            ["8", "Implement", "One change, one measure and one review point closes the course."],
          ].map(([n, title, text]) => (
            <div className="stageCard stageSpan3" key={title}>
              <span className="eyebrow">STAGE {n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">COURSE-BY-COURSE AUDIT</span>
        <h2>Prioritised improvement queue</h2>
        <p>The lowest-scoring courses appear first so later phases can improve the library systematically rather than randomly.</p>
        <div className="stageList">
          {audit.reports.map(report => (
            <details className="stageRow" key={report.courseId}>
              <summary className="stageRowMain" style={{ cursor: "pointer" }}>
                <strong>{report.title}</strong>
                <span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span>
                <small>{report.priorities.length ? `Next priorities: ${report.priorities.join(" · ")}` : "No major structural priority identified."}</small>
              </summary>
              <div style={{ width: "100%", paddingTop: 12 }}>
                <div className="priorityPills">
                  <span className={`stageBadge ${report.passed ? "good" : "warn"}`}>{statusLabel(report.status)}</span>
                  <span className="stageBadge">{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
                  <span className="stageBadge">{report.score}/{report.maxScore}</span>
                </div>
                <div className="stageList" style={{ marginTop: 10 }}>
                  {report.checks.map(check => (
                    <div className="stageRow" key={check.id}>
                      <div className="stageRowMain">
                        <strong>{check.label}</strong>
                        <span>{check.description}</span>
                        <small>{check.evidence}</small>
                      </div>
                      <span className={`stageBadge ${check.passed ? "good" : "warn"}`}>{check.score}/{check.maxScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
