import { courseFinalPresentationPhases7to10Summary, courseMissionSimulationPhases11to12Summary, coursePresentationEngagementPhase6Summary, courses } from "@/lib/catalogue";
import { summariseEscapePhase13 } from "../../lib/courseEscapePhase13";
import { summariseTimedChallengesPhase14 } from "../../lib/courseTimedChallengePhase14";
import { summariseSpotProblemPhase15 } from "../../lib/courseSpotProblemPhase15";
import { summariseBranchingAdventurePhase16Runtime } from "../../lib/courseBranchingAdventurePhase16Qa";
import { summariseMysteryInvestigationPhase17 } from "../../lib/courseMysteryInvestigationPhase17";
import { summariseBeforeAfterPhase18 } from "../../lib/courseBeforeAfterPhase18";
import { summariseStaffVsAiPhase19 } from "../../lib/courseStaffVsAiPhase19";
import { summariseMeaningfulXpPhase20 } from "../../lib/courseMeaningfulXpPhase20";
import { summariseProfessionalMilestonesPhase21 } from "../../lib/courseProfessionalMilestonesPhase21";
import { summariseTeamChallengesPhase22 } from "../../lib/courseTeamChallengesPhase22";

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
  const ai=summariseStaffVsAiPhase19(courses);
  const xp=summariseMeaningfulXpPhase20(courses);
  const milestones=summariseProfessionalMilestonesPhase21(courses);
  const teams=summariseTeamChallengesPhase22(courses);

  const phaseCards=[
    ["PHASE 22 READY",`${teams.ready}/${teams.courseCount}`,"department/team challenge packs passing QA"],
    ["PHASE 21 READY",`${milestones.ready}/${milestones.courseCount}`,"professional-learning milestones passing QA"],
    ["PHASE 20 READY",`${xp.ready}/${xp.courseCount}`,"meaningful XP model passing QA"],
    ["PHASE 19 READY",`${ai.ready}/${ai.courseCount}`,"Staff vs AI challenges passing QA"],
    ["PHASE 18 READY",`${studio.ready}/${studio.courseCount}`,"before/after studios passing QA"],
    ["PHASE 17 READY",`${mystery.ready}/${mystery.courseCount}`,"mystery investigations passing QA"],
    ["PHASE 16 READY",`${adventure.ready}/${adventure.courseCount}`,"branching adventures passing QA"],
    ["PHASE 15 READY",`${spot.ready}/${spot.courseCount}`,"inspection scenes passing QA"],
  ];

  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">PRESENTATION OVERHAUL · FINAL QA</span>
      <h1>Course presentation quality across all twenty-two overhaul phases.</h1>
      <p>The catalogue now combines active learning, professional reading, workshop interaction, progressive rehearsal, live facilitation, instructional visuals, adaptive routes, synthesis products, missions, branching simulations, escape challenges, timed practice, spot-the-problem inspections, consequence-led adventures, mystery investigations, before/after improvement studios, Staff vs AI critical-thinking challenges, meaningful evidence-based XP, sustainable professional-learning milestones and collaborative department/team challenges.</p>
    </section>

    <section className="stageGrid">
      {phaseCards.map(([label,value,detail])=><div className="stageCard stageSpan3" key={label}><span className="eyebrow">{label}</span><h2>{value}</h2><p>{detail}</p></div>)}
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 22</span><h2>{teams.totalChallenges}</h2><p>collaborative challenges · {teams.rolesPerChallenge} shared roles · {teams.individualLeaderboards} individual leaderboards</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 21</span><h2>{milestones.milestones}</h2><p>{milestones.halfTermMilestones} half-term + {milestones.termMilestones} term milestones · {milestones.dailyStreaks} daily streaks</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 20</span><h2>{xp.achievementsPerCourse}</h2><p>meaningful achievements · {xp.totalAvailableXpPerCourse} XP available per course</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 19</span><h2>{ai.totalChallenges}</h2><p>Staff vs AI challenges · {ai.totalTrueIssues} genuine critique points</p></div>
    </section>

    <section className="stageCard"><span className="eyebrow">PHASE 22 · DEPARTMENT / TEAM CHALLENGES</span><div className="featureLiveResults">{teams.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.challenges} team challenges · {report.challengeKinds} challenge types · {report.roles} collaborative roles · {report.successChecks} success checks · {report.individualLeaderboards} individual leaderboards · {report.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 21 · PROFESSIONAL-LEARNING MILESTONES</span><div className="featureLiveResults">{milestones.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.milestones} milestones · {report.halfTermMilestones} half-term · {report.termMilestones} term · {report.dailyStreaks} daily streaks · {report.leaderboards} leaderboards · {report.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 20 · MEANINGFUL XP</span><div className="featureLiveResults">{xp.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.achievements} achievements · {report.totalAvailableXp} XP · {report.evidenceTypes} evidence types · {report.clickAwards} superficial awards · {report.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 19 · STAFF VS AI</span><div className="featureLiveResults">{ai.reports.map(report=><div key={report.courseId} style={{alignItems:"flex-start"}}><strong>{report.ready?"✓":"!"}</strong><span><b>{report.title}</b><br/>{report.challenges} challenge · {report.issueOptions} critique options · {report.trueIssues} genuine weaknesses · {report.issueKinds} required weakness types · {report.score}/100</span></div>)}</div></section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 18</span><h2>{studio.averageScore}/100</h2><p>{studio.totalStudios} studios · {studio.totalAnnotations} annotations</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 17</span><h2>{mystery.averageScore}/100</h2><p>{mystery.totalMysteries} mystery cases · {mystery.totalEvidenceItems} evidence sources</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 16</span><h2>{adventure.averageScore}/100</h2><p>{adventure.totalStates} states · {adventure.totalChoices} consequence decisions</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 15</span><h2>{spot.averageScore}/100</h2><p>{spot.totalScenes} inspection scenes · {spot.totalHotspots} hotspots</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 14</span><h2>{timed.averageScore}/100</h2><p>{timed.totalChallenges} timed bursts · {timed.totalChoicePoints} decisions</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 13</span><h2>{escape.averageScore}/100</h2><p>{escape.totalLocks} locks · {escape.totalChoiceOptions} decisions</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 11–12</span><h2>{mission.totalSimulations}</h2><p>simulations · {mission.totalDecisionOptions} decision options</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">ENGAGEMENT</span><h2>{engagement.averageScore}/100</h2><p>{final.averageActiveShare}% average active share · {final.archetypes.length} archetypes</p></div>
    </section>
  </main>;
}
