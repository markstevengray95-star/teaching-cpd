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
import { summariseLiveTeamQuizPhase23 } from "../../lib/courseLiveTeamQuizPhase23";
import { summariseExpertChallengesPhase24 } from "../../lib/courseExpertChallengesPhase24";
import { summariseInteractiveModelsPhase25 } from "../../lib/courseInteractiveModelsPhase25";
import { summariseVideoDecisionPointsPhase26 } from "../../lib/courseVideoDecisionPointsPhase26";
import { summariseAudioProfessionalScenariosPhase27 } from "../../lib/courseAudioProfessionalScenariosPhase27";
import { summarisePersonalisedEntryPhase28 } from "../../lib/coursePersonalisedEntryPhase28";
import { summariseProfessionalToolkitPhase29 } from "../../lib/courseProfessionalToolkitPhase29";
import { summariseImplementationChallengePhase30 } from "../../lib/courseImplementationChallengePhase30";

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
  const liveQuiz=summariseLiveTeamQuizPhase23(courses);
  const expert=summariseExpertChallengesPhase24(courses);
  const models=summariseInteractiveModelsPhase25(courses);
  const video=summariseVideoDecisionPointsPhase26(courses);
  const audio=summariseAudioProfessionalScenariosPhase27(courses);
  const entry=summarisePersonalisedEntryPhase28(courses);
  const toolkit=summariseProfessionalToolkitPhase29(courses);
  const implementation=summariseImplementationChallengePhase30(courses);

  const phaseCards=[
    ["PHASE 30 READY",`${implementation.ready}/${implementation.courseCount}`,"final implementation challenges passing QA"],
    ["PHASE 29 READY",`${toolkit.ready}/${toolkit.courseCount}`,"professional toolkit packs passing QA"],
    ["PHASE 28 READY",`${entry.ready}/${entry.courseCount}`,"personalised entry routes passing QA"],
    ["PHASE 27 READY",`${audio.ready}/${audio.courseCount}`,"audio professional scenarios passing QA"],
    ["PHASE 26 READY",`${video.ready}/${video.courseCount}`,"video decision-point scenarios passing QA"],
    ["PHASE 25 READY",`${models.ready}/${models.courseCount}`,"interactive diagrams and models passing QA"],
    ["PHASE 24 READY",`${expert.ready}/${expert.courseCount}`,"mastery-gated expert challenges passing QA"],
    ["PHASE 23 READY",`${liveQuiz.ready}/${liveQuiz.courseCount}`,"live team quiz packs passing QA"],
  ];

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">PRESENTATION OVERHAUL · FINAL QA</span><h1>Course presentation quality across all thirty overhaul phases.</h1><p>The catalogue now combines active learning, professional reading, workshop interaction, live facilitation, adaptive routes, simulations, professional challenges, consequence adventures, investigations, improvement studios, Staff vs AI critique, meaningful XP, sustainable milestones, collaborative team challenges, live quizzes, expert tasks, interactive models, video decisions, audio professional conversations, personalised entry routes, reusable professional toolkits and a final implementation challenge linked to 7/30/90-day follow-through.</p></section>

    <section className="stageGrid">{phaseCards.map(([label,value,detail])=><div className="stageCard stageSpan3" key={label}><span className="eyebrow">{label}</span><h2>{value}</h2><p>{detail}</p></div>)}</section>

    <section className="stageGrid">
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 30</span><h2>{implementation.totalFields}</h2><p>implementation fields across the catalogue · 7/30/90 follow-through on {implementation.followThroughReady}/{implementation.courseCount} courses</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 29</span><h2>{toolkit.totalTools}</h2><p>reusable professional tools · {toolkit.kinds} toolkit types</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 28</span><h2>{entry.totalRoutes}</h2><p>personalised routes · {entry.routesPerCourse} entry choices per course</p></div>
    </section>

    <section className="stageCard"><span className="eyebrow">PHASE 30 · FINAL IMPLEMENTATION CHALLENGE</span><div className="featureLiveResults">{implementation.reports.map(r=><div key={r.courseId} style={{alignItems:"flex-start"}}><strong>{r.ready?"✓":"!"}</strong><span><b>{r.title}</b><br/>{r.fields} substantial fields · {r.reviewWindows} review windows · follow-through {r.followThrough?"ready":"missing"} · {r.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 29 · PERSONAL PROFESSIONAL TOOLKIT</span><div className="featureLiveResults">{toolkit.reports.map(r=><div key={r.courseId} style={{alignItems:"flex-start"}}><strong>{r.ready?"✓":"!"}</strong><span><b>{r.title}</b><br/>{r.tools} reusable tools · {r.kinds} tool types · reusable {r.reusable?"yes":"no"} · {r.score}/100</span></div>)}</div></section>

    <section className="stageCard"><span className="eyebrow">PHASE 28 · PERSONALISED COURSE ENTRY</span><div className="featureLiveResults">{entry.reports.map(r=><div key={r.courseId} style={{alignItems:"flex-start"}}><strong>{r.ready?"✓":"!"}</strong><span><b>{r.title}</b><br/>{r.routes} routes · {r.distinctChallenges} challenge levels · category-specific {r.categorySpecific?"yes":"no"} · {r.score}/100</span></div>)}</div></section>

    <section className="stageGrid">
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 27</span><h2>{audio.totalTurns}</h2><p>professional dialogue turns · {audio.totalAnalysisQuestions} analysis questions</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 26</span><h2>{video.totalDecisionPoints}</h2><p>video-style decision pauses · transcripts on {video.transcriptReady}/{video.courseCount} courses</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 25</span><h2>{models.totalStages}</h2><p>interactive model stages · {models.totalDecisions} mini decisions</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 24</span><h2>{expert.averageScore}/100</h2><p>{expert.totalChallenges} expert challenges</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 23</span><h2>{liveQuiz.averageScore}/100</h2><p>{liveQuiz.totalRounds} team quiz rounds</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 22</span><h2>{teams.averageScore}/100</h2><p>{teams.totalChallenges} team challenges</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 21</span><h2>{milestones.averageScore}/100</h2><p>{milestones.milestones} sustainable milestones</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 20</span><h2>{xp.averageScore}/100</h2><p>{xp.achievementsPerCourse} meaningful achievements</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 19</span><h2>{ai.averageScore}/100</h2><p>{ai.totalChallenges} Staff vs AI challenges</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 18</span><h2>{studio.averageScore}/100</h2><p>{studio.totalStudios} improvement studios</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 17</span><h2>{mystery.averageScore}/100</h2><p>{mystery.totalMysteries} mystery cases</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 16</span><h2>{adventure.averageScore}/100</h2><p>{adventure.totalChoices} consequence decisions</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 15</span><h2>{spot.averageScore}/100</h2><p>{spot.totalHotspots} inspection hotspots</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 14</span><h2>{timed.averageScore}/100</h2><p>{timed.totalChallenges} timed bursts</p></div>
      <div className="stageCard stageSpan3"><span className="eyebrow">PHASE 13</span><h2>{escape.averageScore}/100</h2><p>{escape.totalLocks} escape locks</p></div>
    </section>

    <section className="stageGrid">
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASE 11–12</span><h2>{mission.totalSimulations}</h2><p>{mission.totalDecisionOptions} decision options</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">ENGAGEMENT</span><h2>{engagement.averageScore}/100</h2><p>{final.averageActiveShare}% average active share</p></div>
      <div className="stageCard stageSpan4"><span className="eyebrow">PHASES COMPLETE</span><h2>30</h2><p>presentation-overhaul phases integrated</p></div>
    </section>
  </main>;
}
