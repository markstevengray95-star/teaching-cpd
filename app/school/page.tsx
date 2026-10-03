import Link from "next/link";
import WholeSchoolHub from "../components/WholeSchoolHub";

export default function SchoolPage(){
  return <>
    <section style={{maxWidth:"1500px",margin:"20px auto 0",padding:"0 clamp(18px,4vw,54px)"}} aria-label="School timetable shortcut">
      <Link href="/timetable" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"18px",padding:"18px 20px",border:"1px solid #cfe1db",borderRadius:"16px",background:"linear-gradient(135deg,#eef8f5,#ffffff)",textDecoration:"none",color:"inherit",boxShadow:"0 8px 24px rgba(28,63,54,.05)"}}>
        <span style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <span aria-hidden="true" style={{width:"46px",height:"46px",borderRadius:"13px",display:"grid",placeItems:"center",background:"#173c35",color:"white",fontSize:"1.2rem"}}>▦</span>
          <span><strong style={{display:"block",fontSize:"1.08rem",marginBottom:"4px"}}>School Timetable Builder</strong><small style={{display:"block",color:"#60736e",lineHeight:1.45}}>Build, review, publish and sync the whole-school timetable. Includes the 26-staff demo and part-time availability rules.</small></span>
        </span>
        <strong style={{whiteSpace:"nowrap",color:"#245e51"}}>Open timetable →</strong>
      </Link>
    </section>
    <WholeSchoolHub area="school"/>
  </>;
}
