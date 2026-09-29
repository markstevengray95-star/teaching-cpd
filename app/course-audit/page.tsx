import { courseAssessmentAudit, courseFollowThroughAudit, coursePracticeAudit, coursePresentationAudit, courseQualityAudit } from "@/lib/catalogue";

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
  const followThroughReady = courseFollowThroughAudit.filter(row => row.followThroughReady && row.checkpoints === 3 && row.retrievalQuestions >= 8).length;
  const averageAdvancedDecisions = coursePracticeAudit.length ? Math.round(coursePracticeAudit.reduce((sum, row) => sum + row.advancedDecisions, 0) / coursePracticeAudit.length) : 0;
  const averageBank = courseAssessmentAudit.length ? Math.round(courseAssessmentAudit.reduce((sum, row) => sum + row.uniqueQuestions, 0) / courseAssessmentAudit.length) : 0;
  const averageFollowThroughBank = courseFollowThroughAudit.length ? Math.round(courseFollowThroughAudit.reduce((sum, row) => sum + row.retrievalQuestions, 0) / courseFollowThroughAudit.length) : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASES 1–6 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every course now moves from deep learning to mastery, implementation and long-term follow-through.</h1>
        <p>
          Phase 1 standardised the learning journey, Phase 2 deepened the knowledge, Phase 3 rebuilt presentation delivery,
          Phase 4 added higher-order practice, Phase 5 added mastery assessment, and Phase 6 now follows completed learning
          into practice through 7, 30 and 90-day review checkpoints, spaced retrieval and evidence-led impact review.
        </p>
        <div className="stageHeroActions">
          <a className="primary phaseLinkButton" href="/">Open CPD library</a>
          <a className="secondary phaseLinkButton" href="/impact">Open Phase 6 impact hub</a>
          <a className="secondary phaseLinkButton" href="/quality">School QA & annual planning</a>
        </div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{audit.courseCount}</strong><span>courses audited</span></div>
        <div className="stageStat"><strong>{practiceReady}/{audit.courseCount}</strong><span>Phase 4 practice ready</span></div>
        <div className="stageStat"><strong>{assessmentReady}/{audit.courseCount}</strong><span>Phase 5 mastery ready</span></div>
        <div className="stageStat"><strong>{followThroughReady}/{audit.courseCount}</strong><span>Phase 6 follow-through ready</span></div>
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
          <span className="eyebrow">LIBRARY SCALE</span>
          <h2>Learning, practice, mastery and transfer</h2>
          <div className="stageList">
            <div className="stageRow"><div className="stageRowMain"><strong>Phase 2 depth ready</strong><span>Courses above the substantive-knowledge threshold.</span></div><span className="stageBadge good">{depthReady}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Phase 3 presentation ready</strong><span>Courses with the presentation and visual delivery layer.</span></div><span className="stageBadge good">{presentationReady}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 4 decisions</strong><span>Higher-order professional decisions per course.</span></div><span className="stageBadge good">{averageAdvancedDecisions}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 5 question bank</strong><span>Unique mastery prompts available for repeated assessment.</span></div><span className="stageBadge good">{averageBank}</span></div>
            <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 6 retrieval bank</strong><span>Questions available for spaced review after completion.</span></div><span className="stageBadge good">{averageFollowThroughBank}</span></div>
          </div>
        </article>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 6 FOLLOW-THROUGH & IMPACT</span>
        <h2>Course completion now starts a structured implementation cycle</h2>
        <div className="stageGrid">
          {[
            ["1", "Automatic follow-up schedule", "Completed courses create 7-day transfer, 30-day impact and 90-day sustain checkpoints from the recorded completion date."],
            ["2", "Spaced retrieval", "Each course checkpoint reuses high-quality Phase 5 questions so important knowledge is retrieved again after the training event."],
            ["3", "Implementation review", "Staff record whether the intended practice is not started, being tried, embedded, adapted or stopped."],
            ["4", "Private evidence upload", "PDF or image evidence can be stored in the private CPD evidence bucket and attached to the review without exposing it in leadership analytics."],
            ["5", "Evidence-led decision", "Every review ends with an explicit next step: keep, adapt, fade, revisit or stop rather than assuming the strategy should continue."],
            ["6", "Privacy-protected leadership view", "Leaders see aggregate implementation patterns only when at least three staff are represented; private notes and evidence files remain private."],
          ].map(([n,title,text]) => <div className="stageCard stageSpan4" key={title}><span className="eyebrow">FOLLOW-THROUGH {n}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 5 ASSESSMENT & MASTERY</span>
        <h2>Five assessment stages prevent click-through completion</h2>
        <div className="stageGrid">
          {[
            ["1", "Diagnostic pre-check", "A baseline set identifies weaker concepts without a pass mark."],
            ["2", "Retrieval mastery sprint", "A rotating retrieval set requires at least 75%."],
            ["3", "Scenario application", "Professional judgement questions require at least 75%."],
            ["4", "Targeted reteach", "Missed topics generate specific revisit guidance before another attempt."],
            ["5", "Final mastery + application", "An 80% mastery assessment is followed by a fully secure application gate."],
            ["6", "Attempt evidence", "Latest and best scores, attempts and weak topics remain attached to the course record."],
          ].map(([n,title,text]) => <div className="stageCard stageSpan4" key={title}><span className="eyebrow">ASSESSMENT {n}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 4 ADVANCED PRACTICE</span>
        <h2>Six practice environments remain in every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Evidence sorting", "Separate stronger evidence from weak evidence and assumptions."],
            ["2", "Response ranking", "Rebuild the decision sequence from diagnosis to review."],
            ["3", "Hotspot investigation", "Identify the most diagnostic areas before making a judgement."],
            ["4", "Evidence analyst", "Separate implementation evidence from impact evidence and proxy measures."],
            ["5", "Branching case", "Make linked decisions and see the consequences of professional choices."],
            ["6", "Implementation simulator", "Run a mini cycle through clarity, support, evidence and review."],
          ].map(([n,title,text]) => <div className="stageCard stageSpan4" key={title}><span className="eyebrow">PRACTICE {n}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">COURSE-BY-COURSE AUDIT</span>
        <h2>Content, presentation, practice, mastery and follow-through by course</h2>
        <div className="stageList">
          {audit.reports.map(report => {
            const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
            const practice = coursePracticeAudit.find(row => row.courseId === report.courseId);
            const assessment = courseAssessmentAudit.find(row => row.courseId === report.courseId);
            const follow = courseFollowThroughAudit.find(row => row.courseId === report.courseId);
            return (
              <details className="stageRow" key={report.courseId}>
                <summary className="stageRowMain" style={{cursor:"pointer"}}>
                  <strong>{report.title}</strong>
                  <span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span>
                  <small>
                    {presentation ? `${presentation.visualSlides} visuals · ${presentation.interactiveSlides} interactive slides` : "Presentation audit unavailable"}
                    {practice ? ` · ${practice.phase4Modules} Phase 4 practice modules` : " · Practice audit unavailable"}
                    {assessment ? ` · ${assessment.phase5Modules} Phase 5 assessment stages` : " · Assessment audit unavailable"}
                    {follow ? ` · ${follow.retrievalQuestions} Phase 6 spaced-retrieval questions` : " · Follow-through audit unavailable"}
                  </small>
                </summary>
                <div style={{width:"100%",paddingTop:12}}>
                  <div className="priorityPills">
                    <span className={`stageBadge ${report.passed?"good":"warn"}`}>{statusLabel(report.status)}</span>
                    <span className={`stageBadge ${report.estimatedKnowledgeWords>=700?"good":"warn"}`}>{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
                    <span className={`stageBadge ${practice?.phase4Modules===6?"good":"warn"}`}>{practice?.phase4Modules||0}/6 Phase 4</span>
                    <span className={`stageBadge ${assessment?.phase5Modules===5&&assessment.masteryGateReady?"good":"warn"}`}>{assessment?.phase5Modules||0}/5 Phase 5</span>
                    <span className={`stageBadge ${follow?.followThroughReady?"good":"warn"}`}>{follow?.checkpoints||0}/3 Phase 6</span>
                    <span className="stageBadge">{report.score}/{report.maxScore}</span>
                  </div>
                  <div className="stageList" style={{marginTop:10}}>{report.checks.map(check => <div className="stageRow" key={check.id}><div className="stageRowMain"><strong>{check.label}</strong><span>{check.description}</span><small>{check.evidence}</small></div><span className={`stageBadge ${check.passed?"good":"warn"}`}>{check.score}/{check.maxScore}</span></div>)}</div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}
