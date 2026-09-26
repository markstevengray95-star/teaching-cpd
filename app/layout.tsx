import type { Metadata } from "next";
import DevelopmentDock from "./components/DevelopmentDock";
import AppShellEnhancements from "./components/AppShellEnhancements";
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
import "./course-lab.css";
import "./course-engagement.css";
import "./course-studio.css";
import "./school-access.css";

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
        <div id="main-content">{children}</div>
        <DevelopmentDock />
      </body>
    </html>
  );
}
