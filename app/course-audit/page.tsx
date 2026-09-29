import { courseAssessmentAudit, courseFacilitatorAudit, courseFollowThroughAudit, coursePracticeAudit, coursePresentationAudit, courseQualityAudit } from "@/lib/catalogue";

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
  const facilitatorReady = courseFacilitatorAudit.filter(row => row.routes === 4 && row.routeTimingReady && row.interactiveReady && row.transferReady && row.notesReady && row.printableReady).length;
  const averageAdvancedDecisions = coursePracticeAudit.length ? Math.round(coursePracticeAudit.reduce((sum, row) => sum + row.advancedDecisions, 0) / coursePracticeAudit.length) : 0;
  const averageBank = courseAssessmentAudit.length ? Math.round(courseAssessmentAudit.reduce((sum, row) => sum + row.uniqueQuestions, 0) / courseAssessmentAudit.length) : 0;
  const averageFollowThroughBank = courseFollowThroughAudit.length ? Math.round(courseFollowThroughAudit.reduce((sum, row) => sum + row.retrievalQuestions, 0) / courseFollowThroughAudit.length) : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PHASES 1–7 · LIBRARY-WIDE COURSE QUALITY</span>
        <h1>Every course now supports learning, mastery, implementation and ready-to-run facilitated CPD.</h1>
        <p>Phase 1 standardised the journey, Phase 2 deepened knowledge, Phase 3 rebuilt presentation delivery, Phase 4 added higher-order practice, Phase 5 added mastery assessment, Phase 6 added long-term follow-through, and Phase 7 now gives CPD leads complete facilitator routes, notes, timings, accessibility moves and printable delivery packs.</p>
        <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/">Open CPD library</a><a className="secondary phaseLinkButton" href="/facilitator">Open facilitator packs</a><a className="secondary phaseLinkButton" href="/impact">Open impact hub</a></div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{audit.courseCount}</strong><span>courses audited</span></div>
        <div className="stageStat"><strong>{assessmentReady}/{audit.courseCount}</strong><span>Phase 5 mastery ready</span></div>
        <div className="stageStat"><strong>{followThroughReady}/{audit.courseCount}</strong><span>Phase 6 follow-through ready</span></div>
        <div className="stageStat"><strong>{facilitatorReady}/{audit.courseCount}</strong><span>Phase 7 facilitator ready</span></div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">PHASE 7 FACILITATOR DELIVERY</span>
        <h2>Every course can now be delivered without rebuilding the training session</h2>
        <div className="stageGrid">
          {[
            ["1", "15 / 30 / 60 / 90-minute routes", "Each course has four paced delivery routes that retain explanation, interaction, practice and transfer."],
            ["2", "Route-aware presentation", "Facilitator mode marks core live slides, identifies optional extensions and lets presenters jump through the selected route without completing learner tasks."],
            ["3", "Rich presenter guidance", "Every slide gets a purpose, facilitator move, discussion question, misconception warning, accessibility move and optional extension."],
            ["4", "Live delivery tools", "Session pacing, a two-minute discussion timer, fullscreen delivery and route keyboard controls reduce facilitator workload."],
            ["5", "Accessible presentation controls", "Larger text, high contrast and low-motion controls can be switched on during delivery without changing learner records."],
            ["6", "Printable facilitator pack", "Any course and route can generate a print/PDF pack with agenda, timings, prompts, inclusion guidance and the hand-off into mastery and impact follow-up."],
          ].map(([n,title,text]) => <div className="stageCard stageSpan4" key={title}><span className="eyebrow">FACILITATOR {n}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="stageGrid">
        <article className="stageCard stageSpan5"><span className="eyebrow">QUALITY DISTRIBUTION</span><h2>Current library position</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Excellent</strong><span>90–100%</span></div><span className="stageBadge good">{audit.excellent}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Secure</strong><span>78–89%</span></div><span className="stageBadge good">{audit.secure}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Developing</strong><span>62–77%</span></div><span className="stageBadge warn">{audit.developing}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Priority</strong><span>Below 62%</span></div><span className="stageBadge warn">{audit.priority}</span></div>
        </div></article>
        <article className="stageCard stageSpan7"><span className="eyebrow">LIBRARY SCALE</span><h2>Learning, practice, mastery and transfer</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 2 depth ready</strong><span>Courses above the substantive-knowledge threshold.</span></div><span className="stageBadge good">{depthReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 3 presentation ready</strong><span>Courses with the visual presentation layer.</span></div><span className="stageBadge good">{presentationReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 4 practice ready</strong><span>Courses with six advanced practice environments.</span></div><span className="stageBadge good">{practiceReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 4 decisions</strong><span>Higher-order professional decisions per course.</span></div><span className="stageBadge good">{averageAdvancedDecisions}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 5 question bank</strong><span>Unique mastery prompts per course.</span></div><span className="stageBadge good">{averageBank}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 6 retrieval bank</strong><span>Questions available for spaced review.</span></div><span className="stageBadge good">{averageFollowThroughBank}</span></div>
        </div></article>
      </section>

      <section className="stageCard"><span className="eyebrow">PHASE 6 FOLLOW-THROUGH & IMPACT</span><h2>Course completion starts a structured implementation cycle</h2><div className="stageGrid">
        {[ ["1","Automatic follow-up schedule","7-day transfer, 30-day impact and 90-day sustain checkpoints use the recorded completion date."],["2","Spaced retrieval","High-quality Phase 5 questions are revisited after training."],["3","Implementation review","Staff record whether practice is not started, being tried, embedded, adapted or stopped."],["4","Private evidence upload","PDF or image evidence stays in the private CPD evidence bucket."],["5","Evidence-led decision","Reviews end with an explicit keep, adapt, fade, revisit or stop decision."],["6","Privacy-protected leadership view","Aggregate patterns appear only when enough staff are represented."] ].map(([n,title,text]) => <div className="stageCard stageSpan4" key={title}><span className="eyebrow">FOLLOW-THROUGH {n}</span><h3>{title}</h3><p>{text}</p></div>)}
      </div></section>

      <section className="stageCard"><span className="eyebrow">COURSE-BY-COURSE AUDIT</span><h2>Content, presentation, practice, mastery, follow-through and facilitation by course</h2><div className="stageList">
        {audit.reports.map(report => {
          const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
          const practice = coursePracticeAudit.find(row => row.courseId === report.courseId);
          const assessment = courseAssessmentAudit.find(row => row.courseId === report.courseId);
          const follow = courseFollowThroughAudit.find(row => row.courseId === report.courseId);
          const facilitator = courseFacilitatorAudit.find(row => row.courseId === report.courseId);
          return <details className="stageRow" key={report.courseId}><summary className="stageRowMain" style={{cursor:"pointer"}}><strong>{report.title}</strong><span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span><small>
            {presentation ? `${presentation.visualSlides} visuals · ${presentation.interactiveSlides} interactive slides` : "Presentation audit unavailable"}
            {practice ? ` · ${practice.phase4Modules} Phase 4 practice modules` : ""}
            {assessment ? ` · ${assessment.phase5Modules} Phase 5 assessment stages` : ""}
            {follow ? ` · ${follow.retrievalQuestions} Phase 6 retrieval questions` : ""}
            {facilitator ? ` · ${facilitator.routes} Phase 7 delivery routes` : ""}
          </small></summary><div style={{width:"100%",paddingTop:12}}><div className="priorityPills">
            <span className={`stageBadge ${report.passed?"good":"warn"}`}>{statusLabel(report.status)}</span>
            <span className={`stageBadge ${report.estimatedKnowledgeWords>=700?"good":"warn"}`}>{report.estimatedKnowledgeWords.toLocaleString("en-GB")} audit words</span>
            <span className={`stageBadge ${practice?.phase4Modules===6?"good":"warn"}`}>{practice?.phase4Modules||0}/6 Phase 4</span>
            <span className={`stageBadge ${assessment?.phase5Modules===5&&assessment.masteryGateReady?"good":"warn"}`}>{assessment?.phase5Modules||0}/5 Phase 5</span>
            <span className={`stageBadge ${follow?.followThroughReady?"good":"warn"}`}>{follow?.checkpoints||0}/3 Phase 6</span>
            <span className={`stageBadge ${facilitator?.routes===4&&facilitator.routeTimingReady&&facilitator.interactiveReady&&facilitator.transferReady?"good":"warn"}`}>{facilitator?.routes||0}/4 Phase 7 routes</span>
          </div><div className="stageList" style={{marginTop:10}}>{report.checks.map(check => <div className="stageRow" key={check.id}><div className="stageRowMain"><strong>{check.label}</strong><span>{check.description}</span><small>{check.evidence}</small></div><span className={`stageBadge ${check.passed?"good":"warn"}`}>{check.score}/{check.maxScore}</span></div>)}</div></div></details>;
        })}
      </div></section>
    </main>
  );
}
