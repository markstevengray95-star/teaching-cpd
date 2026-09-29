import { coursePresentationAudit, courseQualityAudit } from "@/lib/catalogue";

function statusLabel(status: string) {
  if (status === "excellent") return "Excellent";
  if (status === "secure") return "Secure";
  if (status === "developing") return "Developing";
  return "Priority";
}

export default function CourseAuditPage() {
  const audit = courseQualityAudit;
  const topPriorities = audit.weakestDimensions.slice(0, 5);
  const depthReady = audit.reports.filter(report => report.estimatedKnowledgeWords >= 700 && report.checks.find(check => check.id === "knowledge")?.passed).length;
  const averageWords = audit.reports.length
    ? Math.round(audit.reports.reduce((sum, report) => sum + report.estimatedKnowledgeWords, 0) / audit.reports.length)
    : 0;
  const presentationReady = coursePresentationAudit.filter(row => row.phase3Slides >= 6 && row.visualSlides >= 6).length;
  const averageVisuals = coursePresentationAudit.length
    ? Math.round(coursePresentationAudit.reduce((sum, row) => sum + row.visualSlides, 0) / coursePresentationAudit.length)
    : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASES 1–3 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every course now has a common structure, deeper content and a presentation-first delivery layer.</h1>
        <p>
          Phase 1 standardised the learning journey, Phase 2 deepened the professional knowledge, and Phase 3 rebuilds
          presentation delivery with visual hooks, section dividers, worked examples, concise presenter mode, facilitator
          notes, fullscreen controls and visual recaps.
        </p>
        <div className="stageHeroActions">
          <a className="primary phaseLinkButton" href="/">Open CPD library</a>
          <a className="secondary phaseLinkButton" href="/quality">School QA & annual planning</a>
        </div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{audit.courseCount}</strong><span>courses audited</span></div>
        <div className="stageStat"><strong>{depthReady}/{audit.courseCount}</strong><span>Phase 2 depth ready</span></div>
        <div className="stageStat"><strong>{presentationReady}/{audit.courseCount}</strong><span>Phase 3 presentation ready</span></div>
        <div className="stageStat"><strong>{averageVisuals}</strong><span>average visual slides/course</span></div>
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
          <span className="eyebrow">NEXT QUALITY TARGETS</span>
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
        <span className="eyebrow">PHASE 3 PRESENTATION OVERHAUL</span>
        <h2>Six presentation slides and a facilitator layer are added to every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Opening challenge", "A visual Notice → Interpret → Act → Review hook starts the presentation with a professional problem rather than a paragraph."],
            ["2", "Section dividers", "Understand, Practise and Transfer sections give every presentation deliberate pacing and clearer transitions."],
            ["3", "Worked visual model", "A four-stage worked example makes professional reasoning visible rather than only presenting the final answer."],
            ["4", "Presenter mode", "Full reading remains in learner mode; presentation mode replaces long text with a concise on-screen takeaway."],
            ["5", "Presenter notes", "Facilitator move, discussion prompt, purpose and suggested timing are generated for the active slide."],
            ["6", "Visual recap", "The course ends with an explain/apply/check/transfer recap before the implementation commitment."],
          ].map(([n, title, text]) => (
            <div className="stageCard stageSpan4" key={title}>
              <span className="eyebrow">PRESENTATION {n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 2 CONTENT DEPTH</span>
        <h2>Five deeper sections remain in every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Connect the ideas", "Explains how the course principles, objectives and existing key knowledge fit together."],
            ["2", "Misconceptions & limits", "Uses existing quiz/scenario feedback to surface non-examples, weak reasoning and boundary cases."],
            ["3", "Worked application", "Turns the principle into a five-step professional decision and review cycle."],
            ["4", "Inclusive application", "Builds SEND, EAL, language, access and independence considerations into application."],
            ["5", "Evidence & follow-through", "Separates implementation evidence from impact evidence and supports keep/adapt/fade/stop review decisions."],
          ].map(([n, title, text]) => (
            <div className="stageCard stageSpan4" key={title}>
              <span className="eyebrow">DEPTH {n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">COURSE-BY-COURSE AUDIT</span>
        <h2>Presentation and content quality by course</h2>
        <div className="stageList">
          {audit.reports.map(report => {
            const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
            return (
              <details className="stageRow" key={report.courseId}>
                <summary className="stageRowMain" style={{ cursor: "pointer" }}>
                  <strong>{report.title}</strong>
                  <span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span>
                  <small>{presentation ? `${presentation.visualSlides} visual slides · ${presentation.interactiveSlides} interactive slides · ${presentation.phase3Slides} Phase 3 presentation slides` : "Presentation audit unavailable"}</small>
                </summary>
                <div style={{ width: "100%", paddingTop: 12 }}>
                  <div className="priorityPills">
                    <span className={`stageBadge ${report.passed ? "good" : "warn"}`}>{statusLabel(report.status)}</span>
                    <span className={`stageBadge ${report.estimatedKnowledgeWords >= 700 ? "good" : "warn"}`}>{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
