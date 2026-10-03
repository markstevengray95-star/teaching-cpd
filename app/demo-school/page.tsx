"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";

type State = "loading" | "ready" | "creating" | "created" | "existing" | "denied" | "error";

export default function DemoSchoolPage(){
  const [state,setState]=useState<State>("loading");
  const [message,setMessage]=useState("");

  useEffect(()=>{
    let active=true;
    (async()=>{
      const client=getSupabaseBrowserClient();
      const {data:auth}=await client.auth.getUser();
      if(!auth.user){window.location.replace(`/admin-login`);return;}
      const access=await resolveStaffAccess(client,auth.user);
      if(!active)return;
      const admin=access.platformAdmin||access.role==="super-admin"||access.role==="administrator";
      if(!admin){setState("denied");return;}
      if(access.organizationId){
        setMessage("This administrator is already connected to a school workspace. Your school-level resources are unlocked, so you can use the links below immediately. A second organisation is not created automatically because that could mix real and demo records.");
        setState("existing");return;
      }
      setState("ready");
    })().catch((error)=>{if(active){setMessage(error instanceof Error?error.message:"Unable to prepare the demo school.");setState("error");}});
    return()=>{active=false};
  },[]);

  async function createDemoSchool(){
    setState("creating");setMessage("");
    try{
      const client=getSupabaseBrowserClient();
      const {data:auth}=await client.auth.getUser();
      if(!auth.user)throw new Error("Please sign in as an administrator first.");
      const access=await resolveStaffAccess(client,auth.user);
      if(!(access.platformAdmin||access.role==="super-admin"||access.role==="administrator"))throw new Error("School Admin access is required.");
      if(access.organizationId){setState("existing");setMessage("This account is already connected to a school workspace, so no second organisation was created.");return;}
      const {data,error}=await client.rpc("bootstrap_organisation",{
        p_name:"Oakfield Academy (Demo School)",
        p_slug:"",
        p_academic_year:"2026/27",
        p_site_name:"Main Campus (Demo)",
      });
      if(error)throw error;
      if(!data)throw new Error("The demo school could not be created.");
      setMessage("Oakfield Academy (Demo School) is ready. It uses your own administrator sign-in and a clearly fictional school workspace, so there is no shared demo password to leak or reuse.");
      setState("created");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to create the demo school.");setState("error");}
  }

  const resourceLinks=[
    ["/school","School overview","School operations and whole-school workflows"],
    ["/resources","Resources hub","School knowledge, resources and staff information"],
    ["/resource-library","Resource library","Explore the school resource library"],
    ["/policies","Policy centre","Policies and review workflows"],
    ["/calendar","School calendar","Dates, events and deadlines"],
    ["/directory","Staff directory","Staff and expertise directory"],
    ["/timetable","School timetable","Whole-school timetable tools"],
    ["/students","Student support","Pastoral, regulation and inclusion tools"],
    ["/sen","SEN Hub","SEN/EAL tools with their existing secure access controls"],
    ["/school-reporting","School reporting","CPD and school-level reporting"],
  ];

  if(state==="loading")return <main className="stagePage"><section className="stageCard"><h1>Preparing Demo School…</h1></section></main>;
  if(state==="denied")return <main className="stagePage"><section className="stageCard"><span className="eyebrow">ADMIN ONLY</span><h1>Demo School workspace</h1><p>Sign in with a School Admin account to use this workspace.</p><Link className="primary phaseLinkButton" href="/admin-login">School Admin sign in</Link></section></main>;

  return <main className="stagePage schoolTrialPage">
    <section className="stageHero">
      <span className="eyebrow">FICTIONAL TEST SCHOOL</span>
      <h1>Oakfield Academy Demo School</h1>
      <p>Use a clearly labelled fictional school environment to explore the whole-school platform, resources, timetable, CPD management and administration without entering real pupil information.</p>
      <div className="schoolAuthTrust"><span>✓ Your own secure admin sign-in</span><span>✓ Fictional school identity</span><span>✓ Full school-level tools</span></div>
      {state==="ready"&&<div className="stageHeroActions"><button className="primary phaseLinkButton" onClick={createDemoSchool}>Create Oakfield Academy demo workspace</button><Link className="secondary phaseLinkButton" href="/dashboard">Back to dashboard</Link></div>}
      {state==="creating"&&<div className="phaseNotice">Creating the fictional school workspace…</div>}
      {(state==="created"||state==="existing")&&<div className="stageHeroActions"><Link className="primary phaseLinkButton" href="/dashboard">Open full dashboard</Link><Link className="secondary phaseLinkButton" href="/resources">Open school resources</Link></div>}
    </section>

    {message&&<div className="phaseNotice" role="status">{message}</div>}
    {state==="error"&&<section className="stageCard"><h2>Demo workspace setup</h2><p>The automatic demo-school setup did not complete. Your existing administrator access is unchanged.</p><button className="primary" onClick={createDemoSchool}>Try again</button></section>}

    <section className="stageCard">
      <span className="eyebrow">EXPLORE THE SCHOOL</span>
      <h2>School tools and resources</h2>
      <p>These links use the same school platform areas your staff would use. SEN/EAL pupil records remain protected by their separate secure access rules even for general school administration.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"12px",marginTop:"16px"}}>
        {resourceLinks.map(([href,title,description])=><Link key={href} href={href} style={{display:"block",padding:"16px",border:"1px solid #dfe5ef",borderRadius:"14px",textDecoration:"none",color:"inherit",background:"#fff"}}><strong style={{display:"block",marginBottom:"6px"}}>{title}</strong><span style={{color:"#64748b",lineHeight:1.45}}>{description}</span></Link>)}
      </div>
    </section>

    <section className="stageCard">
      <span className="eyebrow">DEMO BOUNDARIES</span>
      <h2>Safe to explore</h2>
      <p>Oakfield Academy is fictional. Do not enter real pupil or safeguarding information while using it as a demonstration environment. Platform-owner controls remain separate from School Admin access, and secure SEN/EAL records keep their dedicated authorisation checks.</p>
    </section>
  </main>;
}
