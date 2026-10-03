import Link from "next/link";
import "./timetable-builder-demo.css";

export const metadata = {
  title: "Full Time Maker Demo | Teaching CPD",
  description: "Try the full fictional whole-school timetable builder without connecting to live school data.",
};

export default function DemoTimetableBuilderPage() {
  return <main className="dtbShell">
    <header className="dtbTopbar">
      <Link href="/demo" className="dtbBrand"><span>TCPD</span><div><strong>Teaching CPD</strong><small>Full Time Maker demo</small></div></Link>
      <div className="dtbFlag">FICTIONAL / BROWSER-ONLY DEMO DATA</div>
      <nav><Link href="/demo/staff-timetable">Staff timetable demo</Link><Link href="/demo/setup">Setup guide</Link><a className="primary" href="https://time-maker-psi.vercel.app" target="_blank" rel="noreferrer">Open full screen ↗</a></nav>
    </header>
    <section className="dtbIntro"><div><span>WHOLE-SCHOOL TIMETABLING</span><h1>Use the full timetable builder</h1><p>This is the real Time Maker interface running as a public sandbox on its own demo origin. Choose <strong>Try a demo school</strong> inside the builder to load 18, 40, 75 or 120 fictional staff, then change contracts, curriculum needs, rooms and constraints, generate options and review workload.</p></div><aside><strong>Nothing here is connected to a school account.</strong><p>The iframe uses the separate public Time Maker demo domain, so its browser storage is isolated from Teaching CPD live school data.</p></aside></section>
    <div className="dtbFrameWrap">
      <div className="dtbFrameBar"><span>Interactive sandbox</span><div><Link href="/demo/staff-timetable">Try staff planner →</Link></div></div>
      <iframe
        title="Full fictional Time Maker demo"
        src="https://time-maker-psi.vercel.app"
        className="dtbFrame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups"
        referrerPolicy="no-referrer"
      />
    </div>
    <footer className="dtbFooter"><div><strong>Want to see how publishing reaches teachers?</strong><p>Open the staff timetable demo and click individual lessons to see the planning workspace.</p></div><Link href="/demo/staff-timetable">Open staff timetable demo</Link></footer>
  </main>;
}
