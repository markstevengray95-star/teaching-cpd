import { coursePracticeAudit, coursePresentationAudit, courseQualityAudit } from "@/lib/catalogue";

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
  const presentationReady = coursePresentationAudit.filter(row => row.phase3Slides >= 6 && row.visualSlides >= 6).length;
  const practiceReady = coursePracticeAudit.filter(row => row.phase4Modules >= 6).length;
  const averageAdvancedDecisions = coursePracticeAudit.length
    ? Math.round(coursePracticeAudit.reduce((sum, row) => sum + row.advancedDecisions, 0) / coursePracticeAudit.length)
    : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASES 1–4 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every course now combines deep professional learning with presentation-quality delivery and advanced practice.</h1>
        <p>
          Phase 1 standardised the learning journey, Phase 2 deepened the knowledge, Phase 3 rebuilt presentation delivery,
          and Phase 4 turns the course into a practice environment with sorting, ranking, hotspots, evidence analysis,
          branching decisions and implementation simulations.
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
        <div className="stageStat"><strong>{practiceReady}/{audit.courseCount}</strong><span>Phase 4 practice ready</span></div>
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
          <span className="eyebrow">PHASE 4 PRACTICE SCALE</span>
          <h2>Advanced decisions across every course</h2>
          <div className="stageList">
            <div className="stageRow"><div className="stageRowMain"><strong>Advanced practice suite</strong><span>Six higher-order activities are required in every course.</span></div><span className="stageBadge good">6 types</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Average decision opportunities</strong><span>Individual evidence cards, rankings, hotspots and branching choices per course.</span></div><span className="stageBadge good">{averageAdvancedDecisions}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Practice-ready courses</strong><span>Courses passing the full Phase 4 practice validator.</span></div><span className="stageBadge good">{practiceReady}</span></div>
          </div>
        </article>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 4 ADVANCED PRACTICE</span>
        <h2>Six different practice environments are built into every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Evidence sorting", "Drag or tap evidence into stronger evidence and weak/assumption groups, with corrective feedback."],
            ["2", "Response ranking", "Rebuild the professional decision sequence from purpose and diagnosis through action, evidence and review."],
            ["3", "Hotspot investigation", "Inspect a realistic situation and identify the three most diagnostic areas before making a judgement."],
            ["4", "Evidence analyst", "Separate implementation evidence from impact evidence and weak proxy measures."],
            ["5", "Branching case", "Make three linked decisions, see the consequence of each choice and achieve a threshold score before completion."],
            ["6", "Implementation simulator", "Run a mini implementation cycle covering clarity, support, evidence and the final keep/adapt/fade/stop decision."],
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
        <span className="eyebrow">PHASE 3 PRESENTATION OVERHAUL</span>
        <h2>Presentation-first delivery remains across the whole catalogue</h2>
        <div className="stageGrid">
          {[
            ["1", "Opening challenge", "A visual Notice → Interpret → Act → Review hook starts with a professional problem rather than a paragraph."],
            ["2", "Section dividers", "Understand, Practise and Transfer sections create deliberate pacing and clearer transitions."],
            ["3", "Worked visual model", "A four-stage worked example makes professional reasoning visible."],
            ["4", "Presenter mode", "Learner reading stays detailed while projected slides use concise on-screen takeaways."],
            ["5", "Presenter notes", "Facilitator move, discussion prompt, purpose and suggested timing are generated for the active slide."],
            ["6", "Visual recap", "The course ends with an explain/apply/check/transfer recap before implementation."],
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
        <h2>Five deeper knowledge sections remain in every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Connect the ideas", "Explains how the course principles, objectives and key knowledge fit together."],
            ["2", "Misconceptions & limits", "Surfaces non-examples, weak reasoning and boundary cases."],
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
        <h2>Content, presentation and advanced-practice quality by course</h2>
        <div className="stageList">
          {audit.reports.map(report => {
            const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
            const practice = coursePracticeAudit.find(row => row.courseId === report.courseId);
            return (
              <details className="stageRow" key={report.courseId}>
                <summary className="stageRowMain" style={{ cursor: "pointer" }}>
                  <strong>{report.title}</strong>
                  <span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span>
                  <small>
                    {presentation ? `${presentation.visualSlides} visuals · ${presentation.interactiveSlides} interactive slides` : "Presentation audit unavailable"}
                    {practice ? ` · ${practice.phase4Modules} advanced practice modules · ${practice.advancedDecisions} practice decisions` : " · Practice audit unavailable"}
                  </small>
                </summary>
                <div style={{ width: "100%", paddingTop: 12 }}>
                  <div className="priorityPills">
                    <span className={`stageBadge ${report.passed ? "good" : "warn"}`}>{statusLabel(report.status)}</span>
                    <span className={`stageBadge ${report.estimatedKnowledgeWords >= 700 ? "good" : "warn"}`}>{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
                    <span className={`stageBadge ${practice?.phase4Modules === 6 ? "good" : "warn"}`}>{practice?.phase4Modules || 0}/6 Phase 4 activities</span>
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
