import Link from "next/link";
import WholeSchoolHub from "../components/WholeSchoolHub";

export default function StudentsPage(){
  return <>
    <section style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"18px",margin:"18px 28px 0",padding:"18px 20px",border:"1px solid #dfe5ef",borderRadius:"18px",background:"#ffffff",boxShadow:"0 8px 24px rgba(20,30,52,.06)",flexWrap:"wrap"}}>
      <div style={{minWidth:0}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:850,letterSpacing:".12em",color:"#64748b"}}>SEN &amp; INCLUSION</span>
        <h2 style={{margin:"5px 0 4px",fontSize:"22px",lineHeight:1.15,color:"#172033"}}>SEN department</h2>
        <p style={{margin:0,maxWidth:"720px",color:"#5f6b7d",lineHeight:1.5}}>Open the new connected SEN workspace for support plans, pupil passports, provision reviews, EAL assessment and regulation tools.</p>
      </div>
      <Link href="/sen" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 15px",borderRadius:"12px",background:"#172033",color:"#ffffff",fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>Open SEN department →</Link>
    </section>
    <WholeSchoolHub area="students"/>
  </>;
}
