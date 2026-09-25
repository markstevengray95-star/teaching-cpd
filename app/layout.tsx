import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./phase2.css";

export const metadata: Metadata = {
  title: "Teaching CPD Hub",
  description: "Interactive professional development for school staff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
