import Link from "next/link";
import SenWorkspace from "../components/SenWorkspace";

export default function SenPage() {
  return <>
    <section style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"18px",margin:"18px 28px 0",padding:"18px 20px",border:"1px solid #cfe0f4",borderRadius:"18px",background:"linear-gradient(135deg,#ffffff,#f2f7ff)",boxShadow:"0 8px 24px rgba(20,30,52,.06)",flexWrap:"wrap"}}>
      <div style={{minWidth:0}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:850,letterSpacing:".12em",color:"#526987"}}>EAL PROGRESS HUB</span>
        <h2 style={{margin:"5px 0 4px",fontSize:"22px",lineHeight:1.15,color:"#172033"}}>Assessment, reading age, student tests and reporting</h2>
        <p style={{margin:0,maxWidth:"760px",color:"#5f6b7d",lineHeight:1.5}}>Open the expanded EAL workspace for pupil profiles, four-strand assessments, six-digit student tests, reading-age tracking, support plans, reviews, parent reports, analytics, imports, audit history and integrations.</p>
      </div>
      <Link href="/sen/eal" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 15px",borderRadius:"12px",background:"#172033",color:"#ffffff",fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>Open EAL Progress Hub →</Link>
    </section>
    <SenWorkspace />
  </>;
}
