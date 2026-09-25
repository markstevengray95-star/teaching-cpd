import type { Metadata } from "next";
import DevelopmentDock from "./components/DevelopmentDock";
import "./globals.css";
import "./mobile.css";
import "./phase2.css";
import "./phase2-live.css";
import "./phase4.css";
import "./phase56.css";

export const metadata: Metadata = {
  title: "Teaching CPD Hub",
  description: "Interactive professional development for school staff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<DevelopmentDock /></body>
    </html>
  );
}
