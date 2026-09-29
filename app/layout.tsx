import type { Metadata } from "next";
import DevelopmentDock from "./components/DevelopmentDock";
import AppShellEnhancements from "./components/AppShellEnhancements";
import CoursePresentationController from "./components/CoursePresentationController";
import CoursePresenterPhase3Controller from "./components/CoursePresenterPhase3Controller";
import CoursePracticePhase4Controller from "./components/CoursePracticePhase4Controller";
import CourseAssessmentPhase5Controller from "./components/CourseAssessmentPhase5Controller";
import CourseAssessmentPhase5Sync from "./components/CourseAssessmentPhase5Sync";
import CourseFollowThroughPhase6Controller from "./components/CourseFollowThroughPhase6Controller";
import CourseFacilitatorPhase7Controller from "./components/CourseFacilitatorPhase7Controller";
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
import "./school-access.css";
import "./school-hub.css";
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
        <CoursePresenterPhase3Controller />
        <CoursePracticePhase4Controller />
        <CourseAssessmentPhase5Controller />
        <CourseAssessmentPhase5Sync />
        <CourseFollowThroughPhase6Controller />
        <CourseFacilitatorPhase7Controller />
        <CourseDeepLinkController />
        <CourseInteractivityController />
        <div id="main-content">{children}</div>
        <DevelopmentDock />
      </body>
    </html>
  );
}
