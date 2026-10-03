import Link from "next/link";
import WholeSiteDemo from "../components/WholeSiteDemo";
import "../components/WholeSiteDemoPlus.css";

export const metadata = {
  title: "Teaching CPD Demo | Explore the whole-school platform",
  description: "Explore CPD, teacher planning, pupil tracking, timetabling, school tools and leadership reporting in a fictional school demo.",
};

export default function DemoPage() {
  return <>
    <div style={{position:"fixed",right:18,bottom:18,zIndex:80,display:"grid",gap:7,padding:12,border:"1px solid #cbded7",borderRadius:14,background:"rgba(255,255,255,.97)",boxShadow:"0 14px 36px rgba(31,73,61,.16)",maxWidth:260}}>
      <strong style={{fontSize:13,color:"#214f43"}}>Full timetable demos</strong>
      <span style={{fontSize:11,color:"#6c7e78",lineHeight:1.4}}>Use the real timetable interfaces with fictional data.</span>
      <Link style={{fontSize:12,fontWeight:850,color:"#285f51"}} href="/demo/staff-timetable">Staff timetable & lesson planner →</Link>
      <Link style={{fontSize:12,fontWeight:850,color:"#285f51"}} href="/demo/timetable-builder">Full Time Maker builder →</Link>
    </div>
    <WholeSiteDemo />
  </>;
}
