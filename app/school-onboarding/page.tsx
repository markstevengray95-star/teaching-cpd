"use client";
import {useEffect,useState} from "react";
import {getSupabaseBrowserClient} from "@/lib/supabase";
import {schoolAdminProfile,type SchoolAdminProfile} from "@/lib/schoolAdmin";
import {type OnboardingSnapshot,type PilotCheckId} from "@/lib/schoolOnboarding";
import SchoolOnboardingGuide from "@/app/components/SchoolOnboardingGuide";
export default function SchoolOnboardingPage(){
 const [profile,setProfile]=useState<SchoolAdminProfile|null>(null),[snapshot,setSnapshot]=useState<OnboardingSnapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError("");setProfile(null);setSnapshot(null);
 (async()=>{try{
  const client=getSupabaseBrowserClient(),p=await schoolAdminProfile(client,"/school-onboarding");
  if(!active)return;setProfile(p);
  if(p.organisation_id){const {data,error:rpcError}=await client.rpc("school_onboarding_snapshot");if(rpcError)throw rpcError;
   if(!data||data.organisation_id!==p.organisation_id||!Array.isArray(data.checkpoints))throw Error("Invalid school setup response.");
   if(active)setSnapshot(data as OnboardingSnapshot);
  }
 }catch{if(active)setError("Unable to load school setup. Sign in with a School Admin or CPD Lead account and retry.");}
 finally{if(active)setLoading(false);}})();return()=>{active=false;};},[revision]);
 async function save(id:PilotCheckId,completed:boolean){
  if(!profile?.organisation_id||!snapshot)throw Error("Connect a school first.");
  const {data,error:saveError}=await getSupabaseBrowserClient().from("school_setup_checkpoints").upsert({organisation_id:profile.organisation_id,checkpoint_id:id,completed,completed_by:profile.id},{onConflict:"organisation_id,checkpoint_id"}).select("checkpoint_id,completed,updated_at").single();
  if(saveError||!data)throw Error("Save failed.");
  setSnapshot(current=>current?{...current,checkpoints:[...current.checkpoints.filter(c=>c.checkpoint_id!==id),data]}:current);
 }
 if(loading)return <main className="stagePage"><p role="status">Loading school setup…</p></main>;
 if(error||!profile)return <main className="stagePage schoolOperations"><section className="stageCard"><h1>School setup unavailable</h1><p role="alert">{error}</p><button type="button" className="primary" onClick={()=>setRevision(n=>n+1)}>Retry</button><a href="/organisation">Organisation setup</a></section></main>;
 return <SchoolOnboardingGuide key={profile.organisation_id||"no-school"} snapshot={snapshot} onSave={save} onRefresh={()=>setRevision(n=>n+1)}/>;
}
