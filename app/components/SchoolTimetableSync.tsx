"use client";
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';import {getSupabaseBrowserClient} from '@/lib/supabase';import type {SchoolTimetableFeed} from '@/lib/timetableSync';import './SchoolTimetableBuilder.css';
export default function SchoolTimetableSync({organizationId,userId,onSync}:{organizationId:string;userId:string;onSync:(feed:SchoolTimetableFeed)=>void}){
 const [message,setMessage]=useState('Checking your school timetable…'),[error,setError]=useState(''),[busy,setBusy]=useState(false);const callback=useRef(onSync),last=useRef('');callback.current=onSync;
 const refresh=useRef<(force?:boolean)=>Promise<void>>(async()=>{});
 useEffect(()=>{
  let active=true,inFlight=false;last.current='';
  async function load(force=false){
   if(!active||inFlight||(!force&&document.visibilityState==='hidden'))return;
   inFlight=true;setBusy(true);
   try{const {data,error}=await getSupabaseBrowserClient().rpc('school_timetable_personal',{org_id:organizationId});
    if(!active)return;if(error)throw error;const feed=data as SchoolTimetableFeed;
    const key=JSON.stringify([feed.publicationId,feed.syncRevision,feed.date,feed.linked]);
    if(force||key!==last.current){callback.current(feed);last.current=key;}
    setMessage(feed.linked?'School timetable synced. Lesson plans, resources and homework stay in your planner.':'No published timetable is linked to your CPD account yet. You can continue using your personal planner.');setError('');
   }catch(e){if(active)setError(e instanceof Error?e.message:'Could not refresh your school timetable.');}
   finally{inFlight=false;if(active)setBusy(false);}
  }
  refresh.current=load;void load();const automatic=()=>{void load();};
  const timer=setInterval(automatic,45000);window.addEventListener('focus',automatic);document.addEventListener('visibilitychange',automatic);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',automatic);document.removeEventListener('visibilitychange',automatic);};
 },[organizationId,userId]);
 return <section className="ttSchoolSync" aria-label="School timetable sync"><p role="status">{message}</p><button disabled={busy} onClick={()=>void refresh.current(true)}>{busy?'Refreshing…':'Refresh school timetable'}</button><Link href="/timetable">School timetable</Link>{error&&<p role="alert">{error}</p>}</section>;
}
