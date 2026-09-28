"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Policy={id:string;title:string;category:string;version:string;summary:string;document_url:string|null;effective_date:string|null;review_date:string|null;mandatory:boolean};
type Profile={id:string;role:string;organisation_id:string|null};

function slugify(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,55);}

export default function PolicyTrainingPage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [policies,setPolicies]=useState<Policy[]>([]);
  const [acks,setAcks]=useState<Set<string>>(new Set());
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState("");

  useEffect(()=>{const client=getSupabaseBrowserClient();let active=true;(async()=>{const {data:auth}=await client.auth.getUser();if(!auth.user)return;const [p,pol,a]=await Promise.all([
    client.from("staff_profiles").select("id,role,organisation_id").eq("id",auth.user.id).single(),
    client.from("school_policies").select("id,title,category,version,summary,document_url,effective_date,review_date,mandatory").eq("active",true).order("title"),
    client.from("policy_acknowledgements").select("policy_id,policy_version").eq("user_id",auth.user.id),
  ]);if(!active)return;if(p.error)setMessage(p.error.message);if(pol.error)setMessage(pol.error.message);setProfile((p.data||null) as Profile|null);setPolicies((pol.data||[]) as Policy[]);setAcks(new Set((a.data||[]).map(row=>`${row.policy_id}:${row.policy_version}`)));setLoading(false);})();return()=>{active=false;};},[]);

  async function acknowledge(policy:Policy){if(!profile)return;const client=getSupabaseBrowserClient();const {error}=await client.from("policy_acknowledgements").upsert({policy_id:policy.id,user_id:profile.id,policy_version:policy.version,acknowledged_at:new Date().toISOString()},{onConflict:"policy_id,user_id"});if(error){setMessage(error.message);return;}setAcks(prev=>new Set([...prev,`${policy.id}:${policy.version}`]));setMessage(`${policy.title} version ${policy.version} acknowledged.`);}

  async function createTraining(policy:Policy){
    if(!profile||!["CPD Lead","Admin"].includes(profile.role))return;
    const client=getSupabaseBrowserClient();setCreating(policy.id);setMessage("");
    const title=`${policy.title}: staff training`;
    const base={title,summary:`Guided staff training based on ${policy.title} version ${policy.version}. ${policy.summary}`.trim(),duration_minutes:25,level:"Foundation",objectives:["Identify the policy's key staff responsibilities","Apply the policy to realistic professional decisions","Know where to find the current policy and when to seek further guidance"],recommended_for:["All relevant staff"]};
    const slug=`${slugify(policy.title)}-policy-${policy.id.slice(0,6)}`;
    const {data:course,error}=await client.from("custom_courses").insert({slug,category:policy.category||"School policy",...base,created_by:profile.id}).select("id,slug").single();
    if(error||!course){setCreating("");setMessage(error?.message||"Could not create policy course.");return;}
    const {data:version,error:versionError}=await client.from("custom_course_versions").insert({course_id:course.id,version_number:1,...base,created_by:profile.id}).select("id").single();
    if(versionError||!version){setCreating("");setMessage(versionError?.message||"Could not create policy course version.");return;}
    const blocks=[
      {block_type:"text",title:"Start with the current policy",content:{body:`This training supports ${policy.title} version ${policy.version}. It does not replace reading the current school policy, local procedures or role-specific guidance. ${policy.summary}`},required:true},
      {block_type:"scenario",title:"Apply the policy",content:{prompt:"A situation arises that is covered by this policy, but you are unsure about one detail. What is the strongest professional response?",options:[{label:"Rely on memory and continue",feedback:"Where a policy governs the response, check the current version rather than relying on memory alone."},{label:"Check the current policy, stay within your role and use the specified school route or named lead where needed",feedback:"This connects professional judgement to the school's current agreed procedure."},{label:"Create a different informal process",feedback:"An informal alternative can introduce inconsistency where the school has an agreed procedure."}]},required:true},
      {block_type:"quiz",title:"Knowledge check",content:{question:"If this training summary differs from the current approved school policy, which should staff follow?",options:["The training summary","The current approved school policy and relevant named school guidance","Whichever version is shorter","Personal preference"],answer:1,feedback:"Current approved policy and relevant school procedures take precedence over generated or summarised training content."},required:true},
      {block_type:"reflection",title:"Role-specific reflection",content:{prompt:"What is the most important responsibility from this policy for your role, and where would you check the current procedure if you were unsure?"},required:true},
      {block_type:"action_plan",title:"Put the policy into practice",content:{prompt:"Identify one practical action that will help you apply this policy consistently in your role.",outcomePrompt:"What evidence would show that the action is embedded appropriately?"},required:true},
    ].map((block,index)=>({version_id:version.id,sort_order:index,...block}));
    const {error:blockError}=await client.from("custom_course_blocks").insert(blocks);
    setCreating("");
    if(blockError){setMessage(blockError.message);return;}
    setMessage(`Draft training created for ${policy.title}. Open Course Creator to review, edit and publish it.`);
  }

  if(loading)return <main className="stagePage"><div className="stageCard">Loading school policies…</div></main>;
  const leader=["CPD Lead","Admin"].includes(profile?.role||"");
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">SCHOOL POLICY TRAINING</span><h1>Turn approved school policy into guided staff learning.</h1><p>Staff can read and acknowledge the current version. CPD leads can generate a reviewable draft course with an application scenario, knowledge check, reflection and action plan.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/development">Development cycle</a>{leader&&<a className="secondary phaseLinkButton" href="/builder">Course Creator</a>}</div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <div className="privacyNote">Policy training supplements the approved policy; it does not replace the current document, statutory guidance or named school procedures.</div>
    <section className="stageGrid" style={{marginTop:18}}>{policies.map(policy=>{const acknowledged=acks.has(`${policy.id}:${policy.version}`);return <article className="stageCard stageSpan6" key={policy.id}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><span className="eyebrow">{policy.category.toUpperCase()}</span>{policy.mandatory&&<span className="stageBadge">mandatory</span>}</div><h2>{policy.title}</h2><p>{policy.summary||"No summary has been added."}</p><div className="entryMeta"><span>Version {policy.version}</span>{policy.effective_date&&<span>Effective {new Date(`${policy.effective_date}T12:00:00`).toLocaleDateString("en-GB")}</span>}</div><div className="stageHeroActions" style={{marginTop:14}}>{policy.document_url&&<a className="secondary phaseLinkButton" href={policy.document_url} target="_blank" rel="noreferrer">Open policy ↗</a>}<button className={acknowledged?"secondary":"primary"} onClick={()=>acknowledge(policy)}>{acknowledged?"✓ Acknowledged":"Acknowledge current version"}</button>{leader&&<button className="secondary" disabled={creating===policy.id} onClick={()=>createTraining(policy)}>{creating===policy.id?"Creating…":"Create training draft"}</button>}</div></article>;})}</section>
    {!policies.length&&<section className="stageCard"><h2>No active school policies found</h2><p>Add approved policies through the school administration area, then use this workspace to build training and acknowledgements around them.</p><a className="secondary phaseLinkButton" href="/school-hub">Open school hub</a></section>}
  </main>;
}
