import { courseFinalPresentationPhases7to10Summary, courseMissionSimulationPhases11to12Summary, coursePresentationEngagementPhase6Summary, courses } from "@/lib/catalogue";
import { summariseEscapePhase13 } from "../../lib/courseEscapePhase13";
import { summariseTimedChallengesPhase14 } from "../../lib/courseTimedChallengePhase14";
import { summariseSpotProblemPhase15 } from "../../lib/courseSpotProblemPhase15";
import { summariseBranchingAdventurePhase16Runtime } from "../../lib/courseBranchingAdventurePhase16Qa";
import { summariseMysteryInvestigationPhase17 } from "../../lib/courseMysteryInvestigationPhase17";
import { summariseBeforeAfterPhase18 } from "../../lib/courseBeforeAfterPhase18";

export default function PresentationOverhaulFinalPage(){
  const final=courseFinalPresentationPhases7to10Summary;
  const engagement=coursePresentationEngagementPhase6Summary;
  const mission=courseMissionSimulationPhases11to12Summary;
  const escape=summariseEscapePhase13(courses);
  const timed=summariseTimedChallengesPhase14(courses);
  const spot=summariseSpotProblemPhase15(courses);
  const adventure=summariseBranchingAdventurePhase16Runtime(courses);
  const mystery=summariseMysteryInvestigationPhase17(courses);
  const studio=summariseBeforeAfterPhase18(courses);

  const phaseCards=[
    ["PHASE 18 READY",`${studio.ready}/${studio.courseCount}`,"before/after studios passing QA"],
    ["PHASE 17 READY",`${mystery.ready}/${mystery.courseCount}`,"mystery investigations passing QA"],
    ["PHASE 16 READY",`${adventure.ready}/${adventure.courseCount}`,"branching adventures passing QA"],
    ["PHASE 15 READY",`${spot.ready}/${spot.courseCount}`,"inspection scenes passing QA"],
    ["PHASE 14 READY",`${timed.ready}/${timed.courseCount}`,"timed challenges passing QA"],
    ["PHASE 13 READY",`${escape.ready}/${escape.courseCount}`,"escape challenges passing QA"],
    ["PHASE 11–12 READY",`${mission.ready}/${mission.courseCount}`,"mission and simulation courses ready"],
    ["PHASE 7–10 READY",`${final.ready}/${final.courseCount}`,"visual, adaptive, synthesis and archetype checks ready"],
  ];

  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">PRESENTATION OVERHAUL · FINAL QA</span>
      <h1>Course presentation quality across all eighteen overhaul phases.</h1>
      <p>The catalogue now combines active learning, professional reading, workshop interaction, progressive rehearsal, live facilitation, instructional visuals, adaptive routes, synthesis products, missions, branching simulations, escape challenges, timed practice, spot-the-problem inspections, consequence-led adventures, progressive mystery investigations and before/after improvement studios.</p>
    </section>

    <section className="stageGrid">
      {phaseCards.map(([label,value,detail])=><div className="stageCard stageSpan3" key={label}><span className="eyebrow">{label}</span><h2>{value}</h2><p>{detail}</p></div>)}
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 18 STUDIOS</span><h2>{studio.totalStudios}</h2><p>{studio.totalAnnotations} annotated model improvements</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 17 CASES</span><h2>{mystery.totalMysteries}</h2><p>{mystery.totalEvidenceItems} staged evidence sources</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 16 STATES</span><h2>{adventure.totalStates}</h2><p>{adventure.totalChoices} route-changing decisions</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">ENGAGEMENT</span><h2>{engagement.averageScore}/100</h2><p>core presentation engagement score</p></div>
    </section>

    <section className="stageCard"><span className="eyebrow">PHASE 18 · BEFORE / AFTER STUDIO</span><div className="featureLiveResults">{studio.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.criteria} improvement criteria · {report.annotations} model annotations · {report.weakExampleWords} weak-example words · {report.modelWords} stronger-model words · {report.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 17 · MYSTERY INVESTIGATION</span><div className="featureLiveResults">{mystery.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.evidenceItems} staged evidence items · {report.evidenceKinds} evidence types · {report.judgements} final judgements · {report.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 16 · CONSEQUENCE ADVENTURES</span><div className="featureLiveResults">{adventure.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.states} states · {report.choices} choices · {report.distinctFirstBranches} opening routes · {report.consequenceBranches} consequence branches · {report.endings} endings · {report.score}/100</span></div>)}</div></section>

    <section className="stageGrid">
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 15</span><h2>{spot.averageScore}/100</h2><p>{spot.totalScenes} inspection scenes · {spot.totalHotspots} hotspots</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 14</span><h2>{timed.averageScore}/100</h2><p>{timed.totalChallenges} timed bursts · {timed.totalChoicePoints} decisions</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 13</span><h2>{escape.averageScore}/100</h2><p>{escape.totalLocks} locks · {escape.totalChoiceOptions} decisions</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 11–12</span><h2>{mission.totalSimulations}</h2><p>branching simulations · {mission.totalDecisionOptions} decision options</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">ACTIVE SHARE</span><h2>{final.averageActiveShare}%</h2><p>average active-slide share across the catalogue</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">ARCHETYPES</span><h2>{final.archetypes.length}</h2><p>distinct course presentation modes</p></div>
    </section>
  </main>;
}
