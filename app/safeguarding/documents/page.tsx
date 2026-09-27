"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile={id:string;full_name:string;role:string;organisation_id:string|null};
type Org={id:string;name:string;brand_name:string|null};
type Policy={id:string;title:string;category:string;version:string;summary:string;document_url:string|null;effective_date:string|null;review_date:string|null;mandatory:boolean;active:boolean};
type Ack={policy_id:string;user_id:string;policy_version:string;acknowledged_at:string};

type OfficialDoc={title:string;publisher:string;status:string;updated:string;url:string;summary:string;staffAction:string;priority:"Required"|"Core"|"Role-specific"};

const officialDocs:OfficialDoc[]=[
  {title:"Keeping children safe in education 2026",publisher:"Department for Education",status:"Statutory guidance",updated:"1 September 2026",url:"https://www.gov.uk/government/publications/keeping-children-safe-in-education--2",summary:"The main statutory safeguarding and safer-recruitment guidance for schools and colleges in England.",staffAction:"All staff must read KCSIE 2026 Part One in full and follow their school's safeguarding procedures.",priority:"Required"},
  {title:"KCSIE 2026 Part One – overview for all staff",publisher:"Department for Education",status:"Statutory guidance overview",updated:"1 September 2026",url:"https://www.gov.uk/government/publications/keeping-children-safe-in-education--2/part-one-overview-for-all-staff",summary:"A quick-reference overview of Part One. It complements but does not replace the full Part One reading requirement.",staffAction:"Use for refresh/reference after reading Part One in full.",priority:"Core"},
  {title:"Working together to safeguard children 2026",publisher:"Department for Education",status:"Statutory guidance",updated:"18 March 2026",url:"https://www.gov.uk/government/publications/working-together-to-safeguard-children--2",summary:"Multi-agency statutory guidance on helping, supporting and protecting children, including education providers.",staffAction:"Important context for DSLs, leaders and staff working with external safeguarding partners.",priority:"Core"},
  {title:"Information sharing to safeguard children and young people",publisher:"Department for Education",status:"Statutory guidance",updated:"10 September 2026",url:"https://www.gov.uk/government/publications/information-sharing-to-safeguard-children-and-young-people",summary:"Current statutory information-sharing guidance for safeguarding and welfare services, including education.",staffAction:"Use alongside school procedures when deciding how safeguarding information should be shared.",priority:"Core"},
  {title:"Prevent duty: practical guidance for designated safeguarding leads",publisher:"Department for Education",status:"Guidance",updated:"24 September 2026",url:"https://www.gov.uk/government/publications/the-prevent-duty-safeguarding-learners-susceptible-to-radicalisation/the-prevent-duty-practical-guidance-for-designated-safeguarding-leads",summary:"Current practical Prevent guidance for DSLs and others with safeguarding responsibilities.",staffAction:"DSL/Prevent leads should use this with local Prevent procedures and role-specific training.",priority:"Role-specific"},
  {title:"Filtering and monitoring: core standard",publisher:"Department for Education",status:"Digital and technology standard",updated:"16 September 2026",url:"https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/filtering-and-monitoring-core-standard",summary:"DfE's recommended approach to appropriate filtering and monitoring systems for schools and colleges.",staffAction:"Leaders, DSLs and IT safeguarding roles should review responsibilities and school controls.",priority:"Role-specific"},
  {title:"Working together to improve school attendance",publisher:"Department for Education",status:"Statutory guidance",updated:"9 July 2026",url:"https://www.gov.uk/government/publications/working-together-to-improve-school-attendance",summary:"Statutory guidance on attendance responsibilities, persistent/severe absence and support for pupils and families.",staffAction:"Use alongside safeguarding processes where absence patterns raise welfare or safeguarding concerns.",priority:"Core"}
];

const recommendedSchoolDocs=[
  {key:"safeguarding",label:"Safeguarding / child-protection policy",terms:["safeguarding","child protection"]},
  {key:"conduct",label:"Staff code of conduct / safer working practice",terms:["code of conduct","safer working","staff conduct"]},
  {key:"adults",label:"Concerns about adults / low-level concerns procedure",terms:["low-level","low level","allegation","adult"]},
  {key:"online",label:"Online safety / acceptable use policy",terms:["online safety","e-safety","acceptable use","digital safety"]},
  {key:"whistle",label:"Whistleblowing policy",terms:["whistleblowing","whistle blowing"]},
  {key:"behaviour",label:"Behaviour / child-on-child safeguarding policy",terms:["behaviour","child-on-child","peer-on-peer","peer on peer"]},
  {key:"attendance",label:"Attendance / children missing education procedure",terms:["attendance","missing education","cme"]},
  {key:"filtering",label:"Filtering and monitoring arrangements",terms:["filtering","monitoring"]}
];

function norm(s:string){return s.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}

export default function SafeguardingDocumentsPage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [org,setOrg]=useState<Org|null>(null);
  const [policies,setPolicies]=useState<Policy[]>([]);
  const [acks,setAcks]=useState<Ack[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const admin=Boolean(profile&&["CPD Lead","Admin"].includes(profile.role));

  useEffect(()=>{let alive=true;(async()=>{
    const c=getSupabaseBrowserClient();
    const {data:auth}=await c.auth.getUser();
    if(!auth.user){window.location.href="/auth?next=/safeguarding/documents";return;}
    const {data:p,error:pErr}=await c.from("staff_profiles").select("id,full_name,role,organisation_id").eq("id",auth.user.id).single();
    if(!alive)return;
    if(pErr||!p){setMessage(pErr?.message||"Unable to load profile.");setLoading(false);return;}
    setProfile(p as Profile);
    if(!p.organisation_id){setLoading(false);return;}
    const [o,ps,as]=await Promise.all([
      c.from("organisations").select("id,name,brand_name").eq("id",p.organisation_id).single(),
      c.from("school_policies").select("id,title,category,version,summary,document_url,effective_date,review_date,mandatory,active").eq("organisation_id",p.organisation_id).eq("active",true).order("category").order("title"),
      c.from("policy_acknowledgements").select("policy_id,user_id,policy_version,acknowledged_at").eq("user_id",p.id)
    ]);
    if(!alive)return;
    if(o.data)setOrg(o.data as Org);setPolicies((ps.data||[]) as Policy[]);setAcks((as.data||[]) as Ack[]);
    const errs=[o.error,ps.error,as.error].map(e=>e?.message).filter(Boolean);if(errs.length)setMessage(errs.join(" · "));
    setLoading(false);
  })();return()=>{alive=false};},[]);

  const safeguardingPolicies=useMemo(()=>policies.filter(p=>{const hay=norm(`${p.title} ${p.category}`);return ["safeguard","child protection","online","conduct","whistle","behaviour","attendance","filter","monitor","allegation","low level"].some(x=>hay.includes(x));}),[policies]);
  const uploadedMap=useMemo(()=>recommendedSchoolDocs.map(item=>({item,match:policies.find(p=>{const hay=norm(`${p.title} ${p.category}`);return item.terms.some(t=>hay.includes(norm(t)));})})),[policies]);
  const readyCount=uploadedMap.filter(x=>x.match).length;

  async function acknowledge(policy:Policy){if(!profile)return;setBusy(true);const c=getSupabaseBrowserClient();const {data,error}=await c.from("policy_acknowledgements").upsert({policy_id:policy.id,user_id:profile.id,policy_version:policy.version,acknowledged_at:new Date().toISOString()},{onConflict:"policy_id,user_id"}).select("policy_id,user_id,policy_version,acknowledged_at").single();setBusy(false);if(error){setMessage(error.message);return;}setAcks(prev=>[...prev.filter(a=>a.policy_id!==policy.id),data as Ack]);setMessage(`${policy.title} acknowledgement recorded for version ${policy.version}.`);}

  async function addPolicy(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!profile?.organisation_id||!admin)return;const f=e.currentTarget,fd=new FormData(f),c=getSupabaseBrowserClient();setBusy(true);const {data,error}=await c.from("school_policies").insert({organisation_id:profile.organisation_id,title:String(fd.get("title")||"").trim(),category:String(fd.get("category")||"Safeguarding"),version:String(fd.get("version")||"1.0").trim(),summary:String(fd.get("summary")||"").trim(),document_url:String(fd.get("document_url")||"").trim()||null,effective_date:String(fd.get("effective_date")||"")||null,review_date:String(fd.get("review_date")||"")||null,mandatory:fd.get("mandatory")==="on",created_by:profile.id}).select("id,title,category,version,summary,document_url,effective_date,review_date,mandatory,active").single();setBusy(false);if(error){setMessage(error.message);return;}setPolicies(prev=>[...prev,data as Policy]);f.reset();setMessage("School safeguarding document published to staff.");}

  if(loading)return <main className="stagePage"><div className="stageCard">Loading safeguarding documents…</div></main>;
  if(!profile?.organisation_id)return <main className="stagePage"><section className="stageHero safeguardingHero"><span className="eyebrow">SAFEGUARDING DOCUMENTS</span><h1>Connect to a school organisation first.</h1></section></main>;

  return <main className="stagePage safeguardingDocsPage">
    <section className="stageHero safeguardingHero"><span className="eyebrow">KCSIE 2026 · SCHOOL INTEGRATION</span><h1>Safeguarding documents & policy centre</h1><p>Keep official national guidance beside your school's live policies so staff can move from CPD to the exact local procedure they must follow.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/safeguarding">Compliance centre</a><a className="secondary phaseLinkButton" href="/">Open safeguarding course</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}

    <section className="stageStatGrid"><div className="stageStat"><strong>{officialDocs.length}</strong><span>official guidance sources</span></div><div className="stageStat"><strong>{safeguardingPolicies.length}</strong><span>school safeguarding documents</span></div><div className="stageStat"><strong>{readyCount}/{recommendedSchoolDocs.length}</strong><span>school document areas covered</span></div><div className="stageStat"><strong>{org?.brand_name||org?.name||"School"}</strong><span>current organisation</span></div></section>

    <section className="stageCard safeguardingDocsNotice"><strong>Important</strong><p>KCSIE 2026 Part One must be read in full by all staff. The DfE overview is a quick reference only. Your school's current safeguarding policy, DSL arrangements and reporting procedure remain the operational instructions staff should follow.</p></section>

    <section className="stageCard"><span className="eyebrow">OFFICIAL DOCUMENT LIBRARY</span><h2>Current England safeguarding guidance</h2><p>These links point to the official publisher rather than a copied version, reducing the risk of staff opening an outdated local download.</p><div className="officialSafeguardingGrid">{officialDocs.map(doc=><article key={doc.title} className="officialSafeguardingCard"><div className="docCardTop"><span className={`docPriority ${doc.priority.replace(/[^a-z]/gi,"").toLowerCase()}`}>{doc.priority}</span><span>{doc.status}</span></div><h3>{doc.title}</h3><p>{doc.summary}</p><div className="docAction"><strong>Staff action</strong><span>{doc.staffAction}</span></div><small>{doc.publisher} · updated {doc.updated}</small><a className="secondary phaseLinkButton" href={doc.url} target="_blank" rel="noreferrer">Open official document ↗</a></article>)}</div></section>

    <section className="stageGrid">
      <section className="stageCard stageSpan7"><span className="eyebrow">YOUR SCHOOL DOCUMENTS</span><h2>{org?.brand_name||org?.name}: live policies</h2><p>Mandatory policy acknowledgement is version-aware. If a school publishes a new version, staff should acknowledge the current version rather than relying on an older acknowledgement.</p><div className="schoolSafeguardingPolicies">{safeguardingPolicies.length?safeguardingPolicies.map(p=>{const ack=acks.find(a=>a.policy_id===p.id&&a.policy_version===p.version);return <article key={p.id}><div><span className="requirementKind">{p.category}</span><h3>{p.title}</h3><p>{p.summary||"School safeguarding document"}</p><small>Version {p.version}{p.review_date?` · review ${new Date(`${p.review_date}T12:00:00`).toLocaleDateString("en-GB")}`:""}{p.mandatory?" · mandatory acknowledgement":""}</small></div><div className="schoolPolicyActions">{p.document_url?<a className="secondary phaseLinkButton" href={p.document_url} target="_blank" rel="noreferrer">Open document</a>:<span className="missingDoc">Document link needed</span>}{p.mandatory&&(ack?<span className="policyAck current">✓ Acknowledged {new Date(ack.acknowledged_at).toLocaleDateString("en-GB")}</span>:<button className="primary" disabled={busy} onClick={()=>acknowledge(p)}>Acknowledge v{p.version}</button>)}</div></article>}):<div className="emptyState"><strong>No safeguarding school documents published yet</strong><p>An Admin or CPD Lead can add the live safeguarding policy and supporting procedures below.</p></div>}</div></section>
      <section className="stageCard stageSpan5"><span className="eyebrow">DOCUMENT READINESS</span><h2>School safeguarding document check</h2><p>This is a practical completeness check, not a claim that every school must use these exact document titles.</p><div className="documentReadinessList">{uploadedMap.map(({item,match})=><div key={item.key} className={match?"ready":"missing"}><span>{match?"✓":"!"}</span><div><strong>{item.label}</strong><small>{match?`Matched: ${match.title} · v${match.version}`:"Not matched in the published policy library"}</small></div></div>)}</div>{admin&&<a className="secondary phaseLinkButton full" href="/school-hub">Open full School Hub policies</a>}</section>
    </section>

    {admin&&<section className="stageCard"><span className="eyebrow">ADMIN / CPD LEAD</span><h2>Publish a safeguarding document</h2><p>Add a link to the school's approved live document (for example SharePoint, Google Drive or the school website). Do not upload confidential safeguarding case information here.</p><form className="safeguardingDocForm" onSubmit={addPolicy}><label>Document title<input name="title" required placeholder="Safeguarding and Child Protection Policy"/></label><label>Category<select name="category"><option>Safeguarding</option><option>Child protection</option><option>Online safety</option><option>Staff conduct</option><option>Whistleblowing</option><option>Behaviour</option><option>Attendance</option><option>Filtering and monitoring</option></select></label><label>Version<input name="version" required defaultValue="1.0"/></label><label>Live document URL<input name="document_url" type="url" required placeholder="https://…"/></label><label>Effective date<input name="effective_date" type="date"/></label><label>Review date<input name="review_date" type="date"/></label><label className="stageSpan12">Summary<textarea name="summary" rows={3} placeholder="What staff need to know about this document…"/></label><label className="checkLabel"><input name="mandatory" type="checkbox" defaultChecked/> Require staff acknowledgement</label><button className="primary" disabled={busy}>{busy?"Publishing…":"Publish school document"}</button></form></section>}
  </main>;
}
