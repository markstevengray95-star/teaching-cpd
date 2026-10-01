"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { schoolAdminProfile } from "@/lib/schoolAdmin";
import type { ReportingSnapshot } from "@/lib/schoolReporting";
import SchoolReportDashboard from "../components/SchoolReportDashboard";
export default function SchoolReportingPage() {
  const [snapshot,setSnapshot]=useState<ReportingSnapshot|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
  useEffect(()=>{let active=true;setLoading(true);setError("");setSnapshot(null);
    (async()=>{const client=getSupabaseBrowserClient(), profile=await schoolAdminProfile(client,"/school-reporting");
      if(!profile.organisation_id) throw new Error("Connect your school through the setup guide before opening reports.");
      const {data,error:failure}=await client.rpc("school_reporting_snapshot");if(failure) throw new Error("School reporting could not load. "+failure.message);
      if(!data?.organisation || !Array.isArray(data.staff) || data.organisation.id!==profile.organisation_id) throw new Error("The reporting response did not match your school.");
      if(active) setSnapshot(data as ReportingSnapshot);
    })().catch(e=>{if(active)setError(e instanceof Error?e.message:"Reporting failed.");}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[revision]);
  if(loading)return <main className="stagePage"><p role="status">Loading your school's reporting snapshot…</p></main>;
  if(error||!snapshot)return <main className="stagePage schoolOperations"><h1>School reporting</h1><p role="alert">{error||"No snapshot is available."}</p><button type="button" className="secondary" onClick={()=>setRevision(n=>n+1)}>Retry</button> <a href="/school-onboarding">Open school setup & tutorial</a></main>;
  return <SchoolReportDashboard snapshot={snapshot} onRefresh={()=>setRevision(n=>n+1)}/>;
}
