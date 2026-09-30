"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  courses,
  getCourseLivePresenterPhase5Moments,
  getLivePresenterPhase5MomentForModule,
  getNextLivePresenterPhase5Moment,
  phase5LiveMomentActivityType,
  type Module,
  type Phase5LiveMoment,
} from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Session={id:string;title:string;join_code:string;status:string;presenter_id:string};
type Activity={id:string;session_id:string;activity_type:string;title:string;prompt:string;is_open:boolean;response_mode:string;sort_order:number;options?:unknown};
type ResponseRow={activity_id:string;response:{value?:string}};
type PresenterState={session_id:string;presenter_id:string;course_id:string|null;module_id:string|null;slide_index:number;show_results:boolean;audience_questions_open:boolean;word_cloud_open:boolean;presenter_notes_open:boolean;started_at:string|null};
type DeepLink={course:string;module:string;moment:string};

function moduleSummary(module:Module|undefined){
  if(!module)return "Use the course presenter to explain this section.";
  if(module.type==="content")return module.body;
  if(module.type==="quiz")return module.question;
  if(module.type==="scenario")return module.prompt;
  if(module.type==="reflection")return module.prompt;
  if(module.type==="visual")return module.caption||module.items.map(item=>`${item.heading}: ${item.text}`).join(" · ");
  if(module.type==="checklist")return module.prompt;
  return module.prompt;
}

function formatTimer(seconds:number){const safe=Math.max(0,seconds);return `${Math.floor(safe/60)}:${String(safe%60).padStart(2,"0")}`;}

export default function LivePresenterPage(){
  const [userId,setUserId]=useState("");
  const [sessions,setSessions]=useState<Session[]>([]);
  const [sessionId,setSessionId]=useState("");
  const [courseId,setCourseId]=useState(courses[0]?.id||"");
  const [activities,setActivities]=useState<Activity[]>([]);
  const [responses,setResponses]=useState<ResponseRow[]>([]);
  const [state,setState]=useState<PresenterState|null>(null);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [deepLink,setDeepLink]=useState<DeepLink>({course:"",module:"",moment:""});
  const [timerSeconds,setTimerSeconds]=useState(0);

  const course=useMemo(()=>courses.find(c=>c.id===courseId)||courses[0],[courseId]);
  const session=sessions.find(s=>s.id===sessionId)||null;
  const joinUrl=typeof window!=="undefined"&&session?`${window.location.origin}/join/${session.join_code}`:"";
  const activeModule=course?.modules[state?.slide_index||0];
  const liveMoments=course?getCourseLivePresenterPhase5Moments(course):[];
  const currentMoment=course?getLivePresenterPhase5MomentForModule(course,activeModule):null;
  const nextMoment=course?getNextLivePresenterPhase5Moment(course,activeModule):null;

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const requestedCourse=params.get("course")||"";
    const requestedModule=params.get("module")||"";
    const requestedMoment=params.get("moment")||"";
    if(requestedCourse&&courses.some(course=>course.id===requestedCourse))setCourseId(requestedCourse);
    setDeepLink({course:requestedCourse,module:requestedModule,moment:requestedMoment});

    const supabase=getSupabaseBrowserClient();
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();
      if(!auth.user){window.location.href="/auth?next=/live-presenter";return;}
      setUserId(auth.user.id);
      const {data,error}=await supabase.from("live_sessions").select("id,title,join_code,status,presenter_id").eq("presenter_id",auth.user.id).order("starts_at",{ascending:false}).limit(30);
      if(error)setMessage(error.message);
      const rows=(data||[]) as Session[];
      setSessions(rows);
      setSessionId(rows[0]?.id||"");
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    if(!sessionId||!userId)return;
    const supabase=getSupabaseBrowserClient();let alive=true;
    const refresh=async()=>{
      const [a,r,s]=await Promise.all([
        supabase.from("live_activities").select("id,session_id,activity_type,title,prompt,is_open,response_mode,sort_order,options").eq("session_id",sessionId).order("sort_order"),
        supabase.from("live_responses").select("activity_id,response").eq("session_id",sessionId),
        supabase.from("live_presenter_state").select("session_id,presenter_id,course_id,module_id,slide_index,show_results,audience_questions_open,word_cloud_open,presenter_notes_open,started_at").eq("session_id",sessionId).maybeSingle(),
      ]);
      if(!alive)return;
      if(a.error)setMessage(a.error.message);if(r.error)setMessage(r.error.message);
      setActivities((a.data||[]) as Activity[]);setResponses((r.data||[]) as ResponseRow[]);
      if(s.data){
        const ps=s.data as PresenterState;setState(ps);
        if(ps.course_id&&!deepLink.course)setCourseId(ps.course_id);
      }else{
        const init={session_id:sessionId,presenter_id:userId,course_id:courseId,module_id:course?.modules[0]?.id||null,slide_index:0,show_results:false,audience_questions_open:false,word_cloud_open:false,presenter_notes_open:false,started_at:new Date().toISOString()};
        const {data}=await supabase.from("live_presenter_state").upsert(init,{onConflict:"session_id"}).select().single();if(data)setState(data as PresenterState);
      }
    };
    refresh();
    const channel=supabase.channel(`presenter2-${sessionId}`).on("postgres_changes",{event:"*",schema:"public",table:"live_responses",filter:`session_id=eq.${sessionId}`},refresh).on("postgres_changes",{event:"*",schema:"public",table:"live_activities",filter:`session_id=eq.${sessionId}`},refresh).subscribe();
    return()=>{alive=false;supabase.removeChannel(channel);};
  },[sessionId,userId,deepLink.course]);

  useEffect(()=>{
    if(timerSeconds<=0)return;
    const timer=window.setInterval(()=>setTimerSeconds(value=>Math.max(0,value-1)),1000);
    return()=>window.clearInterval(timer);
  },[timerSeconds>0]);

  useEffect(()=>{
    if(!deepLink.module||!course||!state||!sessionId)return;
    const index=course.modules.findIndex(module=>module.id===deepLink.module);
    if(index<0)return;
    chooseSlide(index).then(()=>setDeepLink(current=>({...current,module:""})));
  },[deepLink.module,course?.id,state?.session_id,sessionId]);

  async function patchState(patch:Partial<PresenterState>){
    if(!sessionId||!userId)return;
    const supabase=getSupabaseBrowserClient();
    const payload={session_id:sessionId,presenter_id:userId,course_id:courseId,...patch,updated_at:new Date().toISOString()};
    const {data,error}=await supabase.from("live_presenter_state").upsert(payload,{onConflict:"session_id"}).select().single();
    if(error){setMessage(error.message);return;}setState(data as PresenterState);
  }

  async function chooseSlide(index:number){
    if(!course)return;
    const safe=Math.max(0,Math.min(course.modules.length-1,index));
    await patchState({slide_index:safe,module_id:course.modules[safe]?.id||null,course_id:course.id});
  }

  async function closeAudience(){
    if(!sessionId)return;
    const supabase=getSupabaseBrowserClient();
    await supabase.from("live_activities").update({is_open:false}).eq("session_id",sessionId);
    setActivities(prev=>prev.map(a=>({...a,is_open:false})));
    await patchState({word_cloud_open:false,audience_questions_open:false});
  }

  async function launchMoment(moment:Phase5LiveMoment){
    if(!sessionId){setMessage("Choose a live session before launching the course interaction.");return;}
    const supabase=getSupabaseBrowserClient();
    const sort=Math.max(0,...activities.map(a=>a.sort_order))+1;
    await supabase.from("live_activities").update({is_open:false}).eq("session_id",sessionId);
    const payload={
      session_id:sessionId,
      sort_order:sort,
      activity_type:phase5LiveMomentActivityType(moment),
      title:moment.title,
      prompt:moment.prompt,
      options:moment.options||[],
      required:false,
      is_open:true,
      response_mode:moment.responseMode,
      confidence_phase:moment.confidencePhase||"none",
    };
    const {data,error}=await supabase.from("live_activities").insert(payload).select("id,session_id,activity_type,title,prompt,is_open,response_mode,sort_order,options").single();
    if(error){setMessage(error.message);return;}
    setActivities(prev=>[...prev.map(a=>({...a,is_open:false})),data as Activity]);
    await patchState({show_results:false,word_cloud_open:moment.kind==="word_cloud",audience_questions_open:moment.kind==="questions"});
    if(moment.kind==="discussion")setTimerSeconds((moment.durationMinutes||3)*60);
    setMessage(`${moment.title} opened to the audience.`);
  }

  async function createAudienceActivity(type:"poll"|"word_cloud"|"questions"|"confidence"){
    if(!sessionId)return;
    const supabase=getSupabaseBrowserClient();
    const sort=Math.max(0,...activities.map(a=>a.sort_order))+1;
    const config={
      poll:{activity_type:"poll",title:"Live poll",prompt:"Which option best matches your current view?",options:["A","B","C","D"]},
      word_cloud:{activity_type:"word_cloud",title:"Word cloud",prompt:"Add one word or short phrase that captures your thinking.",options:[]},
      questions:{activity_type:"questions",title:"Anonymous questions",prompt:"What question would you like the facilitator to address?",options:[]},
      confidence:{activity_type:"rating",title:"Confidence pulse",prompt:"How confident do you feel about this idea right now?",options:["1","2","3","4","5"]},
    }[type];
    await supabase.from("live_activities").update({is_open:false}).eq("session_id",sessionId);
    const {data,error}=await supabase.from("live_activities").insert({session_id:sessionId,sort_order:sort,...config,required:false,is_open:true,response_mode:"anonymous",confidence_phase:type==="confidence"?"post":"none"}).select("id,session_id,activity_type,title,prompt,is_open,response_mode,sort_order,options").single();
    if(error){setMessage(error.message);return;}
    setActivities(prev=>[...prev.map(a=>({...a,is_open:false})),data as Activity]);
    await patchState(type==="word_cloud"?{word_cloud_open:true,audience_questions_open:false}:type==="questions"?{audience_questions_open:true,word_cloud_open:false}:{word_cloud_open:false,audience_questions_open:false});
    setMessage(`${config.title} opened to the audience.`);
  }

  const active=activities.find(a=>a.is_open);
  const activeResponses=active?responses.filter(r=>r.activity_id===active.id).map(r=>String(r.response?.value||"")).filter(Boolean):[];
  const counts=activeResponses.reduce<Record<string,number>>((acc,v)=>{acc[v]=(acc[v]||0)+1;return acc;},{});
  if(loading)return <main className="stagePage"><div className="stageCard">Loading Presenter 2.0…</div></main>;

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">LIVE CPD PRESENTER MODE 2.0 · PHASE 5</span><h1>The course now knows when the room should interact.</h1><p>Each course contains built-in live moments. Presenter 2.0 automatically cues confidence checks, polls, word clouds, table discussions and anonymous questions at the relevant slide while leaving the facilitator in control of when anything is opened.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/live">Manage live sessions</a><a className="secondary phaseLinkButton" href="/facilitator">Facilitator packs</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}

    <section className="stageGrid">
      <aside className="stageCard stageSpan4"><span className="eyebrow">SESSION</span><label>Live session<select value={sessionId} onChange={e=>setSessionId(e.target.value)}><option value="">Choose session</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.title} · {s.status}</option>)}</select></label><label>Course<select value={courseId} onChange={e=>{setCourseId(e.target.value);const c=courses.find(x=>x.id===e.target.value);patchState({course_id:e.target.value,module_id:c?.modules[0]?.id||null,slide_index:0});}}>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>{session&&joinUrl&&<div className="featureQr"><QRCode value={joinUrl} size={140}/><strong>{session.join_code}</strong><span>Audience join code</span></div>}<div className="phaseActions"><button className="secondary" onClick={()=>patchState({show_results:!state?.show_results})}>{state?.show_results?"Hide results":"Show results"}</button><button className="secondary" onClick={()=>patchState({presenter_notes_open:!state?.presenter_notes_open})}>{state?.presenter_notes_open?"Hide notes":"Presenter notes"}</button></div>
        <div className="featureLiveSequence"><span className="eyebrow">COURSE LIVE MOMENTS · {liveMoments.length}</span>{liveMoments.map((moment,index)=>{const moduleIndex=course?.modules.findIndex(module=>module.id===moment.moduleId)??-1;return <button key={moment.id} className={moment.id===currentMoment?.id?"active":""} onClick={()=>moduleIndex>=0&&chooseSlide(moduleIndex)}><span>{index+1}</span><strong>{moment.title}</strong><em>{moment.kind.replaceAll("_"," ")}</em></button>;})}</div>
      </aside>

      <div className="stageCard stageSpan8"><span className="eyebrow">COURSE CONTROL</span><div className="featurePresenterTop"><div><h2>{activeModule?.title||course?.title}</h2><p>{course?.summary}</p></div><span className="stageBadge">Slide {(state?.slide_index||0)+1}/{course?.modules.length||0}</span></div><div className="featurePresenterSlide"><p>{moduleSummary(activeModule)}</p></div>
        {currentMoment?<div className="featureLiveMomentCard current"><div className="featureLiveMomentCardHead"><div><span>RECOMMENDED LIVE MOMENT</span><strong>{currentMoment.title}</strong></div><b>{currentMoment.kind.replaceAll("_"," ").toUpperCase()}</b></div><p>{currentMoment.prompt}</p><div className="featureLiveMomentMeta"><span>{currentMoment.durationMinutes||2} min</span><span>{currentMoment.responseMode}</span><span>{currentMoment.purpose}</span></div><p><strong>Facilitator:</strong> {currentMoment.facilitatorPrompt}</p><div className="featureLiveMomentActions"><button className="primary" onClick={()=>launchMoment(currentMoment)}>Launch to audience</button><button className="secondary" onClick={closeAudience}>Close current activity</button>{nextMoment&&nextMoment.id!==currentMoment.id&&<button className="secondary" onClick={()=>{const nextIndex=course?.modules.findIndex(module=>module.id===nextMoment.moduleId)??-1;if(nextIndex>=0)chooseSlide(nextIndex);}}>Next live moment →</button>}</div>{currentMoment.kind==="discussion"&&<div className="featureDiscussionTimer"><strong>{formatTimer(timerSeconds||((currentMoment.durationMinutes||3)*60))}</strong><button className="secondary" onClick={()=>setTimerSeconds((currentMoment.durationMinutes||3)*60)}>Start / reset discussion timer</button></div>}</div>:nextMoment?<div className="featureLiveMomentCard"><div className="featureLiveMomentCardHead"><div><span>NEXT LIVE MOMENT</span><strong>{nextMoment.title}</strong></div><b>{nextMoment.kind.replaceAll("_"," ").toUpperCase()}</b></div><p>{nextMoment.prompt}</p><div className="featureLiveMomentActions"><button className="secondary" onClick={()=>{const nextIndex=course?.modules.findIndex(module=>module.id===nextMoment.moduleId)??-1;if(nextIndex>=0)chooseSlide(nextIndex);}}>Jump to cue →</button></div></div>:null}
        <div className="phaseActions"><button className="secondary" onClick={()=>chooseSlide((state?.slide_index||0)-1)}>← Previous</button><button className="primary" onClick={()=>chooseSlide((state?.slide_index||0)+1)}>Next →</button></div><div className="featurePresenterStrip">{course?.modules.map((m,i)=>{const live=getLivePresenterPhase5MomentForModule(course,m);return <button key={m.id} className={`${i===(state?.slide_index||0)?"active":""}${live?" hasLiveMoment":""}`} onClick={()=>chooseSlide(i)} title={live?`${m.title} · ${live.title}`:m.title}>{i+1}</button>;})}</div>
      </div>
    </section>

    <section className="stageGrid"><div className="stageCard stageSpan6"><span className="eyebrow">MANUAL AUDIENCE TOOLS</span><h2>Launch an extra interaction</h2><p>The course cues are the recommended sequence, but the facilitator can still open an additional interaction whenever the room needs it.</p><div className="featureAudienceTools"><button onClick={()=>createAudienceActivity("poll")}>Live poll</button><button onClick={()=>createAudienceActivity("confidence")}>Confidence pulse</button><button onClick={()=>createAudienceActivity("word_cloud")}>Word cloud</button><button onClick={()=>createAudienceActivity("questions")}>Anonymous questions</button><button onClick={closeAudience}>Pause activities</button></div></div><div className="stageCard stageSpan6"><span className="eyebrow">LIVE RESULTS</span><h2>{active?.title||"No activity open"}</h2>{active?<><p>{active.prompt}</p><div className="featureLiveResults">{Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([value,count])=><div key={value}><strong>{count}</strong><span>{value}</span></div>)}{!activeResponses.length&&<div className="emptyCompact">Waiting for audience responses…</div>}</div></>:<div className="emptyCompact">Launch the recommended course moment or an extra audience tool when you want staff to respond.</div>}</div></section>
  </main>;
}
