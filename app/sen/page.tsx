import Link from "next/link";
import SenWorkspace from "../components/SenWorkspace";

export default function SenPage() {
  return <>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"14px",margin:"18px 28px 0"}}>
      <article style={{padding:"20px",border:"2px solid #9fc2ee",borderRadius:"18px",background:"linear-gradient(135deg,#ffffff,#edf5ff)",boxShadow:"0 10px 28px rgba(20,30,52,.08)"}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:900,letterSpacing:".13em",color:"#496888"}}>TRY IT NOW</span>
        <h2 style={{margin:"6px 0 5px",fontSize:"23px",color:"#172033"}}>Try the EAL Tests</h2>
        <p style={{margin:"0 0 15px",color:"#5f6b7d",lineHeight:1.55}}>Run through Task A, B or C yourself in practice mode. Test listening, speaking, reading and writing, then check the automatic indicative reading-age estimator.</p>
        <Link href="/sen/eal/try" style={{display:"inline-flex",padding:"11px 15px",borderRadius:"12px",background:"#172033",color:"#fff",textDecoration:"none",fontWeight:850}}>Try an EAL test →</Link>
      </article>

      <article style={{padding:"20px",border:"1px solid #cfe0f4",borderRadius:"18px",background:"#ffffff",boxShadow:"0 8px 24px rgba(20,30,52,.05)"}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:850,letterSpacing:".12em",color:"#526987"}}>EAL PROGRESS HUB</span>
        <h2 style={{margin:"6px 0 5px",fontSize:"21px",color:"#172033"}}>Assessment, pupil tests and reporting</h2>
        <p style={{margin:"0 0 15px",color:"#5f6b7d",lineHeight:1.55}}>Open pupil profiles, the full 20-criterion assessment, six-digit student tests, reading-age tracking, support plans, reviews, parent reports and analytics.</p>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <Link href="/sen/eal" style={{display:"inline-flex",padding:"10px 13px",borderRadius:"11px",background:"#172033",color:"#ffffff",fontWeight:800,textDecoration:"none"}}>Open EAL Hub →</Link>
          <Link href="/sen/eal/full-tests" style={{display:"inline-flex",padding:"10px 13px",borderRadius:"11px",background:"#eef4fb",color:"#172033",border:"1px solid #cfdbeb",fontWeight:800,textDecoration:"none"}}>Teacher test centre</Link>
        </div>
      </article>
    </section>
    <SenWorkspace />
  </>;
}
