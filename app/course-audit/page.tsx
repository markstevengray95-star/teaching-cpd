import { courseAssessmentAudit, courseFacilitatorAudit, courseFollowThroughAudit, coursePracticeAudit, coursePresentationAudit, coursePresentationOverhaulPhase1Audit, courseQualityAudit, PRESENTATION_LEARNING_CYCLE, PRESENTATION_OVERHAUL_PHASE1_VERSION } from "@/lib/catalogue";

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
  const overhaulReady = coursePresentationOverhaulPhase1Audit.filter(row => row.cycleAnchors === 4 && row.cycleActivities >= 3 && row.longestPassiveRun <= 3 && row.activeShare >= 30).length;
  const averageActiveShare = coursePresentationOverhaulPhase1Audit.length ? Math.round(coursePresentationOverhaulPhase1Audit.reduce((sum, row) => sum + row.activeShare, 0) / coursePresentationOverhaulPhase1Audit.length) : 0;
  const maxPassiveRun = coursePresentationOverhaulPhase1Audit.length ? Math.max(...coursePresentationOverhaulPhase1Audit.map(row => row.longestPassiveRun)) : 0;
  const automaticCheckpoints = coursePresentationOverhaulPhase1Audit.reduce((sum, row) => sum + row.automaticCheckpoints, 0);
  const averageAdvancedDecisions = coursePracticeAudit.length ? Math.round(coursePracticeAudit.reduce((sum, row) => sum + row.advancedDecisions, 0) / coursePracticeAudit.length) : 0;
  const averageBank = courseAssessmentAudit.length ? Math.round(courseAssessmentAudit.reduce((sum, row) => sum + row.uniqueQuestions, 0) / courseAssessmentAudit.length) : 0;
  const averageFollowThroughBank = courseFollowThroughAudit.length ? Math.round(courseFollowThroughAudit.reduce((sum, row) => sum + row.retrievalQuestions, 0) / courseFollowThroughAudit.length) : 0;

  return (
    <main className="stagePage">
      <section className="stageHero">
        <span className="eyebrow">PRESENTATION OVERHAUL PHASE 1 · {PRESENTATION_OVERHAUL_PHASE1_VERSION}</span>
        <h1>Courses now run as active professional-learning cycles rather than information-heavy slide sequences.</h1>
        <p>The new common structure repeatedly moves staff through {PRESENTATION_LEARNING_CYCLE.join(" → ")}. Build-time validation now prevents any course from exceeding three passive slides in a row and requires four explicit learning cycles plus structured thinking, rehearsal and implementation activities.</p>
        <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/">Open CPD library</a><a className="secondary phaseLinkButton" href="/facilitator">Open facilitator packs</a><a className="secondary phaseLinkButton" href="/course-quality-dashboard">Open final QA</a></div>
      </section>

      <section className="stageStatGrid">
        <div className="stageStat"><strong>{overhaulReady}/{audit.courseCount}</strong><span>new learning-cycle structure ready</span></div>
        <div className="stageStat"><strong>{averageActiveShare}%</strong><span>average active/interactive slides</span></div>
        <div className="stageStat"><strong>{maxPassiveRun}</strong><span>maximum passive slides in a row</span></div>
        <div className="stageStat"><strong>{automaticCheckpoints}</strong><span>automatic active checkpoints inserted</span></div>
      </section>

      <section className="stageCard">
        <span className="eyebrow">NEW COMMON COURSE ARCHITECTURE</span>
        <h2>Four repeated learning cycles now organise every course</h2>
        <div className="stageGrid">
          {[
            ["1", "Build the professional idea", "Read → Think → Discuss. Staff explain the principle, identify the problem it solves and challenge where surface-level copying could fail."],
            ["2", "Turn knowledge into rehearsal", "Think → Practise → Feedback. Staff make a first attempt, compare it with a worked model and improve it."],
            ["3", "Make professional decisions", "Discuss → Decide → Apply. Evidence, scenarios and Phase 4 practice are used to justify context-sensitive decisions."],
            ["4", "Transfer and review", "Apply → Reflect → Review. Staff leave with a usable product, evidence measure and explicit review point."],
          ].map(([n,title,text]) => <div className="stageCard stageSpan3" key={title}><span className="eyebrow">CYCLE {n}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="stageGrid">
        <article className="stageCard stageSpan6"><span className="eyebrow">ACTIVE RHYTHM</span><h2>No long passive runs</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Hard maximum</strong><span>No more than three content/visual slides can appear consecutively.</span></div><span className="stageBadge good">≤ 3</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Automatic intervention</strong><span>If the course risks a fourth passive slide, an active retrieve/connect/non-example checkpoint is inserted automatically.</span></div><span className="stageBadge good">Build-time</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Minimum active share</strong><span>At least 30% of the final course must require a quiz, scenario, activity, checklist or reflection response.</span></div><span className="stageBadge good">≥ 30%</span></div>
        </div></article>
        <article className="stageCard stageSpan6"><span className="eyebrow">STRUCTURED OUTPUTS</span><h2>Three new substantial activities in every course</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Think & discuss</strong><span>Explain the principle, problem and non-example rather than merely reading it.</span></div><span className="stageBadge good">Cycle 1</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Rehearsal & revision</strong><span>Draft a response, compare with the model and improve the second attempt.</span></div><span className="stageBadge good">Cycle 2</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Implementation product</strong><span>Create a usable plan, script, routine, checklist, adaptation or action with evidence and review point.</span></div><span className="stageBadge good">Cycle 4</span></div>
        </div></article>
      </section>

      <section className="stageGrid">
        <article className="stageCard stageSpan5"><span className="eyebrow">QUALITY DISTRIBUTION</span><h2>Existing course quality remains protected</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Excellent</strong><span>90–100%</span></div><span className="stageBadge good">{audit.excellent}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Secure</strong><span>78–89%</span></div><span className="stageBadge good">{audit.secure}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Developing</strong><span>62–77%</span></div><span className="stageBadge warn">{audit.developing}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Priority</strong><span>Below 62%</span></div><span className="stageBadge warn">{audit.priority}</span></div>
        </div></article>
        <article className="stageCard stageSpan7"><span className="eyebrow">LIBRARY SCALE</span><h2>Earlier phases retained</h2><div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 2 depth ready</strong><span>Substantive professional knowledge retained.</span></div><span className="stageBadge good">{depthReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 3 presentation ready</strong><span>Visual presentation layer retained.</span></div><span className="stageBadge good">{presentationReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 4 practice ready</strong><span>Six advanced practice environments retained.</span></div><span className="stageBadge good">{practiceReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 5 mastery ready</strong><span>Diagnostic and mastery gates retained.</span></div><span className="stageBadge good">{assessmentReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 6 follow-through ready</strong><span>7/30/90-day review cycle retained.</span></div><span className="stageBadge good">{followThroughReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Phase 7 facilitator ready</strong><span>Timed routes and presenter packs retained.</span></div><span className="stageBadge good">{facilitatorReady}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 4 decisions</strong><span>Higher-order professional decisions per course.</span></div><span className="stageBadge good">{averageAdvancedDecisions}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 5 bank</strong><span>Unique mastery prompts per course.</span></div><span className="stageBadge good">{averageBank}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Average Phase 6 retrieval bank</strong><span>Questions available for spaced review.</span></div><span className="stageBadge good">{averageFollowThroughBank}</span></div>
        </div></article>
      </section>

      <section className="stageCard"><span className="eyebrow">COURSE-BY-COURSE AUDIT</span><h2>Active learning architecture by course</h2><div className="stageList">
        {audit.reports.map(report => {
          const presentation = coursePresentationAudit.find(row => row.courseId === report.courseId);
          const practice = coursePracticeAudit.find(row => row.courseId === report.courseId);
          const assessment = courseAssessmentAudit.find(row => row.courseId === report.courseId);
          const follow = courseFollowThroughAudit.find(row => row.courseId === report.courseId);
          const facilitator = courseFacilitatorAudit.find(row => row.courseId === report.courseId);
          const overhaul = coursePresentationOverhaulPhase1Audit.find(row => row.courseId === report.courseId);
          return <details className="stageRow" key={report.courseId}><summary className="stageRowMain" style={{cursor:"pointer"}}><strong>{report.title}</strong><span>{report.category} · {report.level} · {report.moduleCount} slides/modules · {report.percent}%</span><small>
            {overhaul ? `${overhaul.cycleAnchors}/4 cycles · ${overhaul.activeShare}% active · longest passive run ${overhaul.longestPassiveRun}` : "Overhaul audit unavailable"}
            {presentation ? ` · ${presentation.visualSlides} visuals` : ""}
            {practice ? ` · ${practice.phase4Modules} Phase 4 practice` : ""}
            {assessment ? ` · ${assessment.phase5Modules} Phase 5 assessment` : ""}
            {follow ? ` · ${follow.retrievalQuestions} Phase 6 retrieval questions` : ""}
            {facilitator ? ` · ${facilitator.routes} Phase 7 routes` : ""}
          </small></summary><div style={{width:"100%",paddingTop:12}}><div className="priorityPills">
            <span className={`stageBadge ${report.passed?"good":"warn"}`}>{statusLabel(report.status)}</span>
            <span className={`stageBadge ${overhaul?.cycleAnchors===4?"good":"warn"}`}>{overhaul?.cycleAnchors||0}/4 cycles</span>
            <span className={`stageBadge ${(overhaul?.activeShare||0)>=30?"good":"warn"}`}>{overhaul?.activeShare||0}% active</span>
            <span className={`stageBadge ${(overhaul?.longestPassiveRun||99)<=3?"good":"warn"}`}>passive run {overhaul?.longestPassiveRun??"—"}</span>
            <span className={`stageBadge ${(overhaul?.cycleActivities||0)>=3?"good":"warn"}`}>{overhaul?.cycleActivities||0} core cycle activities</span>
            <span className={`stageBadge ${assessment?.phase5Modules===5&&assessment.masteryGateReady?"good":"warn"}`}>{assessment?.phase5Modules||0}/5 mastery</span>
          </div><div className="stageList" style={{marginTop:10}}>{report.checks.map(check => <div className="stageRow" key={check.id}><div className="stageRowMain"><strong>{check.label}</strong><span>{check.description}</span><small>{check.evidence}</small></div><span className={`stageBadge ${check.passed?"good":"warn"}`}>{check.score}/{check.maxScore}</span></div>)}</div></div></details>;
        })}
      </div></section>
    </main>
  );
}
