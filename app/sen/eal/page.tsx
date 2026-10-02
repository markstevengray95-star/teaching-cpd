import Link from "next/link";
import EalWorkspace from "../../components/EalWorkspace";

export default function EalPage() {
  return <>
    <section style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"18px",margin:"18px 28px 0",padding:"16px 18px",border:"1px solid #d9e4f2",borderRadius:"16px",background:"#ffffff",flexWrap:"wrap"}}>
      <div>
        <strong style={{display:"block",fontSize:"15px",color:"#172033"}}>Advanced EAL progress tools</strong>
        <span style={{display:"block",marginTop:"4px",color:"#64748b",fontSize:"13px"}}>Eight-domain proficiency, reading-age comparison, interventions, observations, timelines, passports, data quality, CSV import and school integrations.</span>
      </div>
      <Link href="/sen/eal/advanced" style={{display:"inline-flex",padding:"10px 13px",borderRadius:"11px",background:"#172033",color:"#fff",textDecoration:"none",fontWeight:800}}>Open advanced tools →</Link>
    </section>
    <EalWorkspace />
  </>;
}
