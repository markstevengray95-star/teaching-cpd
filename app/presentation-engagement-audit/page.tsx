import { coursePresentationEngagementPhase6Summary } from "@/lib/catalogue";

export default function PresentationEngagementAuditPage() {
  const audit = coursePresentationEngagementPhase6Summary;
  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">PRESENTATION OVERHAUL · PHASE 6</span>
      <h1>Whole-library engagement audit</h1>
      <p>This final presentation-overhaul gate checks whether every course genuinely combines reading, thinking, workshop interaction, progressive rehearsal and live facilitation. Weak engagement rhythm is repaired automatically before the build is allowed to pass.</p>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/course-audit">Open full course audit</a><a className="secondary phaseLinkButton" href="/live-presenter">Open Presenter 2.0</a><a className="secondary phaseLinkButton" href="/">Open course library</a></div>
    </section>

    <section className="stageStatGrid">
      <div className="stageStat"><strong>{audit.ready}/{audit.courseCount}</strong><span>courses engagement-ready</span></div>
      <div className="stageStat"><strong>{audit.averageScore}%</strong><span>average engagement score</span></div>
      <div className="stageStat"><strong>{audit.averageActiveShare}%</strong><span>average active-slide share</span></div>
      <div className="stageStat"><strong>{audit.longestPassiveRun}</strong><span>longest passive run anywhere</span></div>
    </section>

    <section className="stageGrid">
      <article className="stageCard stageSpan6">
        <span className="eyebrow">FINAL QUALITY STANDARD</span>
        <h2>What Phase 6 enforces</h2>
        <div className="stageList">
          {[
            ["Active rhythm", "At least 35% of the final course is active/interactive and no more than three passive slides can appear in a row."],
            ["Professional reading", "Three substantial readings, at least 900 Core Reading words, processing prompts and a usable glossary."],
            ["Workshop variety", "All eight Phase 3 interaction families with at least 30 meaningful choice points."],
            ["Progressive rehearsal", "Two complete seven-step cases with changing evidence, model responses and required second attempts."],
            ["Live facilitation", "Eight course-aware Presenter 2.0 moments covering confidence, polls, word clouds, discussion and anonymous questions."],
          ].map(([title, detail]) => <div className="stageRow" key={title}><div className="stageRowMain"><strong>{title}</strong><span>{detail}</span></div><span className="stageBadge good">Enforced</span></div>)}
        </div>
      </article>
      <article className="stageCard stageSpan6">
        <span className="eyebrow">LIBRARY SCALE</span>
        <h2>What the final overhaul contains</h2>
        <div className="stageList">
          <div className="stageRow"><div className="stageRowMain"><strong>Professional reading</strong><span>Total Core Reading words across the catalogue.</span></div><span className="stageBadge good">{audit.totalCoreReadingWords.toLocaleString("en-GB")}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Professional decision points</strong><span>Workshop and progressive-case choices across the catalogue.</span></div><span className="stageBadge good">{audit.totalChoicePoints.toLocaleString("en-GB")}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Live audience moments</strong><span>Built-in Presenter 2.0 moments across all courses.</span></div><span className="stageBadge good">{audit.totalLiveMoments.toLocaleString("en-GB")}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Automatic repairs</strong><span>Extra active checkpoints inserted only where the final engagement rhythm needed strengthening.</span></div><span className="stageBadge">{audit.autoRepairs}</span></div>
          <div className="stageRow"><div className="stageRowMain"><strong>Minimum active share</strong><span>The least interactive course in the final library after repair.</span></div><span className="stageBadge good">{audit.minimumActiveShare}%</span></div>
        </div>
      </article>
    </section>

    <section className="stageCard">
      <span className="eyebrow">COURSE-BY-COURSE</span>
      <h2>Final engagement quality</h2>
      <div className="stageList">{audit.reports.map(report => <details className="stageRow" key={report.courseId}>
        <summary className="stageRowMain" style={{cursor:"pointer"}}><strong>{report.title}</strong><span>{report.score}% · {report.activeShare}% active · {report.choicePoints} decision points · {report.liveMoments} live moments</span></summary>
        <span className={`stageBadge ${report.ready?"good":"warn"}`}>{report.ready?"Ready":"Review"}</span>
        <div style={{width:"100%",paddingTop:12}} className="stageList">
          {report.checks.map(check => <div className="stageRow" key={check.id}><div className="stageRowMain"><strong>{check.label}</strong><span>{check.detail}</span></div><span className={`stageBadge ${check.passed?"good":"warn"}`}>{check.score}/{check.maxScore}</span></div>)}
          <div className="stageRow"><div className="stageRowMain"><strong>Automatic engagement repairs</strong><span>Extra checkpoints inserted by Phase 6 only where needed.</span></div><span className="stageBadge">{report.autoRepairs}</span></div>
        </div>
      </details>)}</div>
    </section>
  </main>;
}
