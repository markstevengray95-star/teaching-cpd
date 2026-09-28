"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Counts = { completed:number; pathways:number; actions:number; reviews:number; evidence:number; coaching:number };
type Profile = { full_name:string; role:string };

const stages = [
  { step:"1", title:"Diagnose", text:"Identify the precise development need before choosing training.", href:"/needs-audit", action:"Run needs audit" },
  { step:"2", title:"Choose a route", text:"Use a pathway, adaptive pre-check or personalised recommendation.", href:"/pathways", action:"Open pathways" },
  { step:"3", title:"Learn", text:"Complete a full course, subject example or short Micro-CPD unit.", href:"/recommendations", action:"Choose learning" },
  { step:"4", title:"Rehearse", text:"Practise professional decisions before using the strategy in context.", href:"/simulator", action:"Open simulator" },
  { step:"5", title:"Apply", text:"Turn learning into one specific action with an intended outcome and evidence plan.", href:"/actions", action:"Create action plan" },
  { step:"6", title:"Evidence", text:"Capture useful evidence and reflection without storing confidential pupil-identifiable information.", href:"/portfolio", action:"Open portfolio" },
  { step:"7", title:"Coach", text:"Use a focused target, rehearsal and check-in cycle with a colleague or coach.", href:"/coaching", action:"Start coaching" },
  { step:"8", title:"Follow up", text:"Revisit the idea after use instead of treating course completion as the end point.", href:"/reminders", action:"Review follow-ups" },
  { step:"9", title:"Evaluate impact", text:"Record what changed, what evidence you saw and what you will keep, adapt or stop.", href:"/impact", action:"Review impact" },
];

export default function DevelopmentPage() {
  const [profile,setProfile] = useState<Profile | null>(null);
  const [counts,setCounts] = useState<Counts>({completed:0,pathways:0,actions:0,reviews:0,evidence:0,coaching:0});
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    const client=getSupabaseBrowserClient(); let active=true;
    (async()=>{
      const {data:auth}=await client.auth.getUser(); if(!auth.user)return;
      const [p,completed,pathways,actions,reviews,evidence,coaching]=await Promise.all([
        client.from("staff_profiles").select("full_name,role").eq("id",auth.user.id).maybeSingle(),
        client.from("course_progress").select("course_id",{count:"exact",head:true}).eq("user_id",auth.user.id).not("completed_at","is",null),
        client.from("pathway_enrolments").select("pathway_id",{count:"exact",head:true}).eq("user_id",auth.user.id).eq("status","active"),
        client.from("action_plans").select("id",{count:"exact",head:true}).eq("user_id",auth.user.id).in("status",["planned","active"]),
        client.from("cpd_impact_reviews").select("id",{count:"exact",head:true}).eq("user_id",auth.user.id).is("reviewed_at",null),
        client.from("portfolio_entries").select("id",{count:"exact",head:true}).eq("user_id",auth.user.id),
        client.from("coaching_cycles").select("id",{count:"exact",head:true}).eq("user_id",auth.user.id).eq("status","active"),
      ]);
      if(!active)return;
      setProfile((p.data||null) as Profile|null);
      setCounts({completed:completed.count||0,pathways:pathways.count||0,actions:actions.count||0,reviews:reviews.count||0,evidence:evidence.count||0,coaching:coaching.count||0});
      setLoading(false);
    })();
    return()=>{active=false;};
  },[]);

  if(loading)return <main className="stagePage"><div className="stageCard">Loading your development cycle…</div></main>;
  const leader=["Department Lead","CPD Lead","Admin"].includes(profile?.role||"");

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">PROFESSIONAL DEVELOPMENT CYCLE</span><h1>Move from CPD completion to changed practice.</h1><p>{profile?.full_name?`${profile.full_name}, this`:"This"} workspace connects diagnosis, learning, rehearsal, classroom application, evidence, coaching and impact review into one continuous cycle.</p><div className="stageHeroActions"><a className="primary phaseLinkButton" href="/recommendations">What should I do next?</a><a className="secondary phaseLinkButton" href="/standards">View standards map</a><a className="secondary phaseLinkButton" href="/subject-cpd">Subject-specific CPD</a></div></section>

    <section className="stageStatGrid">
      <div className="stageStat"><strong>{counts.completed}</strong><span>courses completed</span></div>
      <div className="stageStat"><strong>{counts.pathways}</strong><span>active pathways</span></div>
      <div className="stageStat"><strong>{counts.actions}</strong><span>active actions</span></div>
      <div className="stageStat"><strong>{counts.reviews}</strong><span>impact reviews due</span></div>
      <div className="stageStat"><strong>{counts.evidence}</strong><span>portfolio entries</span></div>
      <div className="stageStat"><strong>{counts.coaching}</strong><span>coaching cycles</span></div>
    </section>

    <section className="stageGrid">
      {stages.map(stage=><article className="stageCard stageSpan4" key={stage.step}><span className="eyebrow">STAGE {stage.step}</span><h2>{stage.title}</h2><p>{stage.text}</p><a className="secondary phaseLinkButton" href={stage.href}>{stage.action} →</a></article>)}
    </section>

    <section className="stageGrid" style={{marginTop:18}}>
      <article className="stageCard stageSpan4"><span className="eyebrow">ADAPTIVE</span><h2>Already know some of it?</h2><p>Use a course pre-check. Strong prior knowledge can fast-track explanatory slides while required quizzes, scenarios, application tasks and reflection remain in place.</p><a className="secondary phaseLinkButton" href="/adaptive">Start adaptive pre-check →</a></article>
      <article className="stageCard stageSpan4"><span className="eyebrow">SHORT FORM</span><h2>Five-minute development</h2><p>Use Micro-CPD when a full course is unnecessary, then transfer the idea into an action or coaching target.</p><a className="secondary phaseLinkButton" href="/micro-cpd">Open Micro-CPD →</a></article>
      <article className="stageCard stageSpan4"><span className="eyebrow">PRACTISE</span><h2>Decision rehearsal</h2><p>Try realistic professional scenarios, receive immediate coaching feedback and save a useful reflection to your evidence portfolio.</p><a className="secondary phaseLinkButton" href="/simulator">Practise a scenario →</a></article>
    </section>

    {leader&&<section className="stageCard" style={{marginTop:18}}><span className="eyebrow">LEADERSHIP WORKSPACE</span><h2>Turn individual learning into sustained school development.</h2><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/department-cpd">Department plans</a><a className="secondary phaseLinkButton" href="/live">Live CPD</a><a className="secondary phaseLinkButton" href="/policy-training">Policy training</a><a className="secondary phaseLinkButton" href="/builder">Course creator</a><a className="secondary phaseLinkButton" href="/leadership">Whole-school dashboard</a></div></section>}
  </main>;
}
