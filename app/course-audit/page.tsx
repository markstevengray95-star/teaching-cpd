import { courseAssessmentAudit, coursePracticeAudit, coursePresentationAudit, courseQualityAudit } from "@/lib/catalogue";

function statusLabel(status: string) {
  if (status === "excellent") return "Excellent";
  if (status === "secure") return "Secure";
  if (status === "developing") return "Developing";
  return "Priority";
}

export default function CourseAuditPage() {
  const audit = courseQualityAudit;
  const depthReady = audit.reports.filter(report => report.estimatedKnowledgeWords >= 700 && report.checks.find(check => check.id === "knowledge")?.passed).length;
  const presentationReady = coursePresentationAudit.filter(row => row.phase3Slides >= 6 && row.visualSlides >= 6).length;
  const practiceReady = coursePracticeAudit.filter(row => row.phase4Modules >= 6).length;
  const assessmentReady = courseAssessmentAudit.filter(row => row.phase5Modules === 5 && row.diagnosticReady && row.masteryGateReady).length;
  const averageAdvancedDecisions = coursePracticeAudit.length
    ? Math.round(coursePracticeAudit.reduce((sum, row) => sum + row.advancedDecisions, 0) / coursePracticeAudit.length)
    : 0;
  const averageBank = courseAssessmentAudit.length
    ? Math.round(courseAssessmentAudit.reduce((sum, row) => sum + row.uniqueQuestions, 0) / courseAssessmentAudit.length)
    : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASES 1–5 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every course now combines deep professional learning, presentation-quality delivery, advanced practice and mastery assessment.</h1>
        <p>
          Phase 1 standardised the learning journey, Phase 2 deepened the knowledge, Phase 3 rebuilt presentation delivery,
          Phase 4 added higher-order practice, and Phase 5 adds diagnostic assessment, rotating retrieval, scenario application,
          targeted reteach, final mastery and a demonstrated-application gate.
        </p>
        <div className="stageHeroActions">
          <a className="primary phaseLinkButton" href="/">Open CPD library</a>
          <a className="secondary phaseLinkButton" href="/quality">School QA & annual planning</a>
        </div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{audit.courseCount}</strong><span>courses audited</span></div>
        <div className="stageStat"><strong>{presentationReady}/{audit.courseCount}</strong><span>Phase 3 presentation ready</span></div>
        <div className="stageStat"><strong>{practiceReady}/{audit.courseCount}</strong><span>Phase 4 practice ready</span></div>
        <div className="stageStat"><strong>{assessmentReady}/{audit.courseCount}</strong><span>Phase 5 assessment ready</span></div>
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
          <span className="eyebrow">MASTERY SCALE</span>
          <h2>Assessment depth across every course</h2>
          <div className="stageList">
            <div className="stageRow"><div className="stageRowMain"><strong>Assessment sequence</strong><span>Diagnostic → retrieval → scenario application → final mastery → demonstrated application.</span></div><span className="stageBadge good">5 stages</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Average unique bank</strong><span>Question prompts available for rotation before repeated attempts.</span></div><span className="stageBadge good">{averageBank}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Advanced practice decisions</strong><span>Average Phase 4 evidence, ranking, hotspot and branching decisions per course.</span></div><span className="stageBadge good">{averageAdvancedDecisions}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Depth-ready courses</strong><span>Courses above the Phase 2 substantive knowledge threshold.</span></div><span className="stageBadge good">{depthReady}</span></div>
          </div>
        </article>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 5 ASSESSMENT & MASTERY</span>
        <h2>Five assessment stages prevent click-through completion</h2>
        <div className="stageGrid">
          {[
            ["1", "Diagnostic pre-check", "A baseline set identifies weaker concepts without a pass mark so staff know where to pay extra attention."],
            ["2", "Retrieval mastery sprint", "A rotating five-question retrieval set requires at least 75% and changes on subsequent attempts."],
            ["3", "Scenario application", "Professional judgement questions require at least 75%, with explanation after every decision."],
            ["4", "Targeted reteach", "Missed topics generate specific revisit guidance before another rotated attempt can be taken."],
            ["5", "Final mastery + application", "A final 80% mastery assessment is followed by a three-question application gate that must be completely secure."],
            ["6", "Attempt evidence", "Latest and best scores, attempts and weak topics are stored as assessment evidence for the course record."],
          ].map(([n, title, text]) => (
            <div className="stageCard stageSpan4" key={title}>
              <span className="eyebrow">ASSESSMENT {n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 4 ADVANCED PRACTICE</span>
        <h2>Six different practice environments remain in every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Evidence sorting", "Drag or tap evidence into stronger evidence and weak/assumption groups."],
            ["2", "Response ranking", "Rebuild the professional decision sequence from diagnosis to review."],
            ["3", "Hotspot investigation", "Identify the most diagnostic areas before making a judgement."],
            ["4", "Evidence analyst", "Separate implementation evidence from impact evidence and weak proxy measures."],
            ["5", "Branching case", "Make linked decisions and see the consequences of professional choices."],
            ["6", "Implementation simulator", "Run a mini implementation cycle through clarity, evidence and review."],
          ].map(([n, title, text]) => (
            <div className="stageCard stageSpan4" key={title}>
              <span className="eyebrow">PRACTICE {n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">COURSE-BY-COURSE AUDIT</span>
        <h2>Content, presentation, practice and mastery by course</h2>
        <div className="stageList">
          {audit.reports.map(report => {
            const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
            const practice = coursePracticeAudit.find(row => row.courseId === report.courseId);
            const assessment = courseAssessmentAudit.find(row => row.courseId === report.courseId);
            return (
              <details className="stageRow" key={report.courseId}>
                <summary className="stageRowMain" style={{ cursor: "pointer" }}>
                  <strong>{report.title}</strong>
                  <span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span>
                  <small>
                    {presentation ? `${presentation.visualSlides} visuals · ${presentation.interactiveSlides} interactive slides` : "Presentation audit unavailable"}
                    {practice ? ` · ${practice.phase4Modules} advanced practice modules` : " · Practice audit unavailable"}
                    {assessment ? ` · ${assessment.phase5Modules} assessment stages · ${assessment.uniqueQuestions} unique bank questions` : " · Assessment audit unavailable"}
                  </small>
                </summary>
                <div style={{ width: "100%", paddingTop: 12 }}>
                  <div className="priorityPills">
                    <span className={`stageBadge ${report.passed ? "good" : "warn"}`}>{statusLabel(report.status)}</span>
                    <span className={`stageBadge ${report.estimatedKnowledgeWords >= 700 ? "good" : "warn"}`}>{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
                    <span className={`stageBadge ${practice?.phase4Modules === 6 ? "good" : "warn"}`}>{practice?.phase4Modules || 0}/6 Phase 4</span>
                    <span className={`stageBadge ${assessment?.phase5Modules === 5 && assessment.masteryGateReady ? "good" : "warn"}`}>{assessment?.phase5Modules || 0}/5 Phase 5</span>
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
