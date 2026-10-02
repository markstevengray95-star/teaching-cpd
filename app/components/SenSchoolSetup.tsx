"use client";
import {useEffect,useRef,useState} from "react";
import {getSupabaseBrowserClient} from "@/lib/supabase";
type School={id:string;name:string;enabled:boolean;approved_at:string|null;approved_staff:string[];staff:{id:string;name:string;role:string}[]};
export default function SenSchoolSetup(){
 const [schools,setSchools]=useState<School[]>([]),[schoolId,setSchoolId]=useState(""),[staff,setStaff]=useState<string[]>([]),[checks,setChecks]=useState([false,false,false]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const generation=useRef(0),mounted=useRef(false);
 const school=schools.find(s=>s.id===schoolId);
 function choose(s:School){setSchoolId(s.id);setStaff(s.approved_staff.filter(id=>s.staff.some(p=>p.id===id)));setChecks([false,false,false]);setMessage("");}
 useEffect(()=>{
  mounted.current=true;const client=getSupabaseBrowserClient();
  async function load(){const g=++generation.current;setLoading(true);setBusy(false);setMessage("");setSchools([]);setSchoolId("");setStaff([]);setChecks([false,false,false]);setError("");
   try{const {data:auth,error:authError}=await client.auth.getUser();if(authError||!auth.user)throw Error("Sign in with your school owner or administrator account.");
    const {data,error:rpcError}=await client.rpc("sen_onboarding_status");if(rpcError||!Array.isArray(data))throw Error("Unable to load SEN setup. Retry when connected.");
    if(mounted.current&&g===generation.current){setSchools(data);if(data[0])choose(data[0]);}
   }catch(e){if(mounted.current&&g===generation.current)setError(e instanceof Error?e.message:"Unable to load SEN setup.");}
   finally{if(mounted.current&&g===generation.current)setLoading(false);}
  }
  void load();const {data:{subscription}}=client.auth.onAuthStateChange(()=>{void load();});
  return()=>{mounted.current=false;generation.current++;subscription.unsubscribe();};
 },[]);
 async function save(enable:boolean){
  if(!school||busy)return;const id=school.id,g=generation.current;setBusy(true);setError("");setMessage("");
  try{const client=getSupabaseBrowserClient();const {error:saveError}=await client.rpc("sen_onboarding_save",{org_id:id,enable_storage:enable,staff_ids:enable?staff:[],privacy_approved:enable&&checks.every(Boolean),privacy_version:"sen-privacy-v1"});
   if(saveError)throw Error("Setup was not confirmed. Check school-admin access, selected staff roles and privacy approval, then refresh and retry.");
   const {data,error:refreshError}=await client.rpc("sen_onboarding_status");if(refreshError||!Array.isArray(data))throw Error("The request completed, but its saved status could not be loaded. Refresh before trying again.");
   if(mounted.current&&g===generation.current){setSchools(data);const updated=data.find((s:School)=>s.id===id);if(updated)choose(updated);setMessage(enable?"Pupil storage is active for the selected staff. Other staff cannot access pupil records.":"Pupil storage is paused. Existing records are retained and cannot be accessed until reactivated.");}
  }catch(e){if(mounted.current&&g===generation.current)setError(e instanceof Error?e.message:"Setup could not be confirmed.");}
  finally{if(mounted.current&&g===generation.current)setBusy(false);}
 }
 return <section className="stageCard" aria-labelledby="sen-setup-title"><span className="eyebrow">PUPIL STORAGE ONBOARDING</span><h2 id="sen-setup-title">Activate your school's SEN workspace</h2>
  <p>New schools can activate storage here without a provider code update. Only the school owner or a school administrator can approve it. Approval is a school attestation, not an independent legal or security review.</p>
  {loading?<p role="status">Loading your schools…</p>:!schools.length?<p>Create or join your school in <a href="/organisation">Organisation setup</a>, then ask its owner or administrator to return here. A platform role or CPD Lead role alone does not grant activation rights.</p>:<fieldset disabled={busy}><legend>School and restricted staff access</legend>
   <label>School <select value={schoolId} onChange={e=>{const s=schools.find(s=>s.id===e.target.value);if(s)choose(s);}}>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <p role="status">{school?.enabled?"Active":"Not active"}{school?.approved_at?" · last approved "+school.approved_at:""}</p>
   <p>Select named staff. Only current members with an assigned SEND/EAL or SLT role are listed. Changing a role or removing membership immediately removes record access.</p>
   {!school?.staff.length?<p>No eligible staff yet. Assign the SEND/EAL or SLT role through <a href="/staff-access">People &amp; access</a>, then refresh this page.</p>:school.staff.map(p=><label key={p.id} style={{display:"block",marginBottom:12}}><input type="checkbox" checked={staff.includes(p.id)} onChange={e=>setStaff(ids=>e.target.checked?[...ids,p.id]:ids.filter(id=>id!==p.id))}/> {p.name} · {p.role==="slt"?"SLT":"SEND/EAL"} <small>({p.id.slice(0,8)})</small></label>)}
   <h3>School approval · privacy version 1</h3>
   {["Our school has reviewed its lawful processing basis, privacy information and data-processing arrangements for pupil records.","We have agreed retention, backup/recovery, safeguarding boundaries and approved printing/sharing procedures. This is not a safeguarding casework or full MIS system.","The selected staff are authorised for these records. We will review access when responsibilities change and test saving/reloading with fictional data before adding real pupils."].map((text,i)=><label key={text} style={{display:"block",marginBottom:12}}><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(v=>v.map((value,j)=>i===j?e.target.checked:value))}/> {text}</label>)}
   <div className="schoolOperationLinks"><button type="button" className="primary" disabled={!checks.every(Boolean)||staff.length===0} onClick={()=>void save(true)}>{busy?"Saving…":school?.enabled?"Update approved access":"Approve and activate pupil storage"}</button>{school?.enabled?<button type="button" className="secondary" onClick={()=>void save(false)}>Pause pupil storage</button>:null}<a href="/sen">Open SEN workspace</a></div>
  </fieldset>}
  {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
 </section>;
}
