import type { Metadata } from "next";
import DevelopmentDock from "./components/DevelopmentDock";
import AppShellEnhancements from "./components/AppShellEnhancements";
import CoursePresentationController from "./components/CoursePresentationController";
import AdminSlideUnlockController from "./components/AdminSlideUnlockController";
import CoursePresenterPhase3Controller from "./components/CoursePresenterPhase3Controller";
import CoursePracticePhase4Controller from "./components/CoursePracticePhase4Controller";
import CourseAssessmentPhase5Controller from "./components/CourseAssessmentPhase5Controller";
import CourseAssessmentPhase5Sync from "./components/CourseAssessmentPhase5Sync";
import CourseFollowThroughPhase6Controller from "./components/CourseFollowThroughPhase6Controller";
import CourseFacilitatorPhase7Controller from "./components/CourseFacilitatorPhase7Controller";
import CourseReadingPhase2Controller from "./components/CourseReadingPhase2Controller";
import CourseWorkshopPhase3Controller from "./components/CourseWorkshopPhase3Controller";
import CourseProgressiveCasePhase4Controller from "./components/CourseProgressiveCasePhase4Controller";
import CourseLivePresenterPhase5Controller from "./components/CourseLivePresenterPhase5Controller";
import CourseAdaptivePathPhase8Controller from "./components/CourseAdaptivePathPhase8Controller";
import CourseMissionSimulationPhase11to12Controller from "./components/CourseMissionSimulationPhase11to12Controller";
import CourseEscapePhase13Controller from "./components/CourseEscapePhase13Controller";
import CourseTimedChallengePhase14Controller from "./components/CourseTimedChallengePhase14Controller";
import CourseSpotProblemPhase15Controller from "./components/CourseSpotProblemPhase15Controller";
import CourseBranchingAdventurePhase16Controller from "./components/CourseBranchingAdventurePhase16Controller";
import CourseMysteryInvestigationPhase17Controller from "./components/CourseMysteryInvestigationPhase17Controller";
import CourseBeforeAfterPhase18Controller from "./components/CourseBeforeAfterPhase18Controller";
import CourseStaffVsAiPhase19Controller from "./components/CourseStaffVsAiPhase19Controller";
import CourseMeaningfulXpPhase20Controller from "./components/CourseMeaningfulXpPhase20Controller";
import CourseProfessionalMilestonesPhase21Controller from "./components/CourseProfessionalMilestonesPhase21Controller";
import CourseTeamChallengesPhase22Controller from "./components/CourseTeamChallengesPhase22Controller";
import CourseLiveTeamQuizPhase23Controller from "./components/CourseLiveTeamQuizPhase23Controller";
import CourseExpertChallengesPhase24Controller from "./components/CourseExpertChallengesPhase24Controller";
import CourseInteractiveModelsPhase25Controller from "./components/CourseInteractiveModelsPhase25Controller";
import CourseVideoDecisionPointsPhase26Controller from "./components/CourseVideoDecisionPointsPhase26Controller";
import CourseAudioProfessionalScenariosPhase27Controller from "./components/CourseAudioProfessionalScenariosPhase27Controller";
import CoursePersonalisedEntryPhase28Controller from "./components/CoursePersonalisedEntryPhase28Controller";
import CourseProfessionalToolkitPhase29Controller from "./components/CourseProfessionalToolkitPhase29Controller";
import CourseImplementationChallengePhase30Controller from "./components/CourseImplementationChallengePhase30Controller";
import CourseCertificationExamPhase31Controller from "./components/CourseCertificationExamPhase31Controller";
import CourseDeepLinkController from "./components/CourseDeepLinkController";
import CourseInteractivityController from "./components/CourseInteractivityController";
import "./globals.css";
import "./mobile.css";
import "./phase2.css";
import "./phase2-live.css";
import "./phase4.css";
import "./phase56.css";
import "./phase789.css";
import "./stage1012.css";
import "./phase1314.css";
import "./course-enhancements.css";
import "./course-visuals-plus.css";
import "./course-interactive-visuals.css";
import "./course-motion-plus.css";
import "./course-lab.css";
import "./course-engagement.css";
import "./course-navigation.css";
import "./course-module-navigation.css";
import "./course-fun-engagement.css";
import "./course-presentation-player.css";
import "./development-dock.css";
import "./course-studio.css";
import "./course-packs.css";
import "./course-reading.css";
import "./course-reading-phase2.css";
import "./course-workshop-phase3.css";
import "./course-progressive-case-phase4.css";
import "./course-live-presenter-phase5.css";
import "./course-finish-phase7-10.css";
import "./course-mission-simulation-phase11-12.css";
import "./course-escape-phase13.css";
import "./course-timed-phase14.css";
import "./course-spot-problem-phase15.css";
import "./course-branching-phase16.css";
import "./course-mystery-phase17.css";
import "./course-before-after-phase18.css";
import "./course-staff-vs-ai-phase19.css";
import "./course-meaningful-xp-phase20.css";
import "./course-professional-milestones-phase21.css";
import "./course-team-challenges-phase22.css";
import "./course-live-team-quiz-phase23.css";
import "./course-expert-challenges-phase24.css";
import "./course-interactive-models-phase25.css";
import "./course-video-decision-phase26.css";
import "./course-audio-scenarios-phase27.css";
import "./course-personalised-entry-phase28.css";
import "./course-professional-toolkit-phase29.css";
import "./course-implementation-challenge-phase30.css";
import "./course-certification-exam-phase31.css";
import "./school-access.css";
import "./school-hub.css";
import "./school-workflows.css";
import "./platform.css";
import "./owner-portal.css";
import "./staff-sync.css";
import "./staff-access.css";
import "./admin-login.css";
import "./safeguarding.css";
import "./safeguarding-documents.css";
import "./digital-certificates.css";
import "./certificate-verification.css";
import "./reminders.css";
import "./help.css";
import "./launch-readiness.css";
import "./recommendations.css";
import "./micro-cpd.css";
import "./cpd-refreshers.css";
import "./impact.css";
import "./department-cpd.css";
import "./course-slide-formatting.css";
import "./phase3-presentation.css";
import "./course-practice-phase4.css";
import "./phase5-assessment.css";
import "./course-followthrough-phase6.css";
import "./phase7-facilitator.css";
import "./five-feature-suite.css";
import "./ai-platform.css";

export const metadata: Metadata = {
  title: "Teaching CPD Hub",
  description: "Interactive professional development for school staff",
  applicationName: "Teaching CPD Hub",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShellEnhancements />
        <CoursePresentationController />
        <AdminSlideUnlockController />
        <CoursePresenterPhase3Controller />
        <CoursePracticePhase4Controller />
        <CourseAssessmentPhase5Controller />
        <CourseAssessmentPhase5Sync />
        <CourseFollowThroughPhase6Controller />
        <CourseFacilitatorPhase7Controller />
        <CourseReadingPhase2Controller />
        <CourseWorkshopPhase3Controller />
        <CourseProgressiveCasePhase4Controller />
        <CourseLivePresenterPhase5Controller />
        <CourseAdaptivePathPhase8Controller />
        <CourseMissionSimulationPhase11to12Controller />
        <CourseEscapePhase13Controller />
        <CourseTimedChallengePhase14Controller />
        <CourseSpotProblemPhase15Controller />
        <CourseBranchingAdventurePhase16Controller />
        <CourseMysteryInvestigationPhase17Controller />
        <CourseBeforeAfterPhase18Controller />
        <CourseStaffVsAiPhase19Controller />
        <CourseMeaningfulXpPhase20Controller />
        <CourseProfessionalMilestonesPhase21Controller />
        <CourseTeamChallengesPhase22Controller />
        <CourseLiveTeamQuizPhase23Controller />
        <CourseExpertChallengesPhase24Controller />
        <CourseInteractiveModelsPhase25Controller />
        <CourseVideoDecisionPointsPhase26Controller />
        <CourseAudioProfessionalScenariosPhase27Controller />
        <CoursePersonalisedEntryPhase28Controller />
        <CourseProfessionalToolkitPhase29Controller />
        <CourseImplementationChallengePhase30Controller />
        <CourseCertificationExamPhase31Controller />
        <CourseDeepLinkController />
        <CourseInteractivityController />
        <div id="main-content">{children}</div>
        <DevelopmentDock />
      </body>
    </html>
  );
}
