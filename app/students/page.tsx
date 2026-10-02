import Link from "next/link";
import WholeSchoolHub from "../components/WholeSchoolHub";

export default function StudentsPage(){
  return <>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:"14px",margin:"18px 28px 0"}}>
      <article style={{padding:"20px",border:"2px solid #9fc2ee",borderRadius:"18px",background:"linear-gradient(135deg,#ffffff,#edf5ff)",boxShadow:"0 10px 28px rgba(20,30,52,.08)"}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:900,letterSpacing:".13em",color:"#496888"}}>PHASE 2 · STUDENT SUPPORT</span>
        <h2 style={{margin:"6px 0 5px",fontSize:"23px",color:"#172033"}}>Unified Student Profile</h2>
        <p style={{margin:"0 0 15px",color:"#5f6b7d",lineHeight:1.55}}>Open one connected view of a student’s support, interventions and regulation history, with restricted SEN, EAL and reading information only when your account is authorised to see it.</p>
        <Link href="/students/profile" style={{display:"inline-flex",padding:"11px 15px",borderRadius:"12px",background:"#172033",color:"#fff",textDecoration:"none",fontWeight:850}}>Open student profiles →</Link>
      </article>
      <article style={{padding:"20px",border:"1px solid #dfe5ef",borderRadius:"18px",background:"#ffffff",boxShadow:"0 8px 24px rgba(20,30,52,.06)"}}>
        <span style={{display:"block",fontSize:"11px",fontWeight:850,letterSpacing:".12em",color:"#64748b"}}>SEN &amp; INCLUSION</span>
        <h2 style={{margin:"5px 0 4px",fontSize:"22px",lineHeight:1.15,color:"#172033"}}>SEN department</h2>
        <p style={{margin:"0 0 15px",color:"#5f6b7d",lineHeight:1.5}}>Open the connected SEN workspace for support plans, pupil passports, provision reviews, EAL assessment and regulation tools.</p>
        <Link href="/sen" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 15px",borderRadius:"12px",background:"#eef4fb",border:"1px solid #cbd9e8",color:"#172033",fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>Open SEN department →</Link>
      </article>
    </section>
    <WholeSchoolHub area="students"/>
  </>;
}
