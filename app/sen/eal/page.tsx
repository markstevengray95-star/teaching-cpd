import Link from "next/link";
import EalWorkspace from "../../components/EalWorkspace";

const cardStyle = {display:"flex",alignItems:"center",justifyContent:"space-between",gap:"18px",margin:"18px 28px 0",padding:"16px 18px",border:"1px solid #d9e4f2",borderRadius:"16px",background:"#ffffff",flexWrap:"wrap" as const};
const linkStyle = {display:"inline-flex",padding:"10px 13px",borderRadius:"11px",background:"#172033",color:"#fff",textDecoration:"none",fontWeight:800,whiteSpace:"nowrap" as const};

export default function EalPage() {
  return <>
    <section style={{...cardStyle,borderColor:"#bcd5f5",background:"linear-gradient(135deg,#ffffff,#f1f7ff)"}}>
      <div style={{minWidth:0}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:850,letterSpacing:".12em",color:"#526987"}}>FULL EAL TEST CENTRE</span>
        <strong style={{display:"block",marginTop:"5px",fontSize:"19px",color:"#172033"}}>Original EAL tests + automatic reading-age estimate</strong>
        <span style={{display:"block",marginTop:"4px",maxWidth:"830px",color:"#64748b",fontSize:"13px",lineHeight:1.5}}>Use all three original task packs, the complete 20-criterion listening, speaking, reading/viewing and writing assessment, KS3–KS5 routes, six-digit pupil test codes and the new automatic indicative reading-age detector.</span>
      </div>
      <Link href="/sen/eal/full-tests" style={linkStyle}>Open full EAL tests →</Link>
    </section>
    <section style={cardStyle}>
      <div>
        <strong style={{display:"block",fontSize:"15px",color:"#172033"}}>Advanced EAL progress tools</strong>
        <span style={{display:"block",marginTop:"4px",color:"#64748b",fontSize:"13px"}}>Eight-domain proficiency, formal reading-age comparison, interventions, observations, timelines, passports, data quality, CSV import and school integrations.</span>
      </div>
      <Link href="/sen/eal/advanced" style={linkStyle}>Open advanced tools →</Link>
    </section>
    <EalWorkspace />
  </>;
}
