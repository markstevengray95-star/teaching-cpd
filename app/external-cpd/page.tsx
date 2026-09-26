"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ExternalRecord = { id:string; title:string; provider:string; occurred_on:string; cpd_hours:number; category:string; notes:string; evidence_path:string|null; source:"manual"|"csv_import"; verification_status:"self_recorded"|"verified"; created_at:string };
type CalendarEvent = { id:string; title:string; description:string; starts_at:string; ends_at:string|null; location:string; audience:string; event_type:string };
type CsvRecord = { title:string; provider:string; occurred_on:string; cpd_hours:number; category:string; notes:string };

export default function ExternalCpdPage(){
  const [userId,setUserId]=useState("");
  const [records,setRecords]=useState<ExternalRecord[]>([]);
  const [events,setEvents]=useState<CalendarEvent[]>([]);
  const [csvRows,setCsvRows]=useState<CsvRecord[]>([]);
  const [csvName,setCsvName]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();let alive=true;
    (async()=>{
      const {data:auth}=await supabase.auth.getUser();if(!auth.user){window.location.href="/auth?next=/external-cpd";return;}
      if(!alive)return;setUserId(auth.user.id);
      const [r,e]=await Promise.all([
        supabase.from("external_cpd_records").select("id,title,provider,occurred_on,cpd_hours,category,notes,evidence_path,source,verification_status,created_at").eq("user_id",auth.user.id).order("occurred_on",{ascending:false}),
        supabase.from("cpd_calendar_events").select("id,title,description,starts_at,ends_at,location,audience,event_type").order("starts_at",{ascending:true}),
      ]);
      if(!alive)return;if(r.error||e.error)setMessage([r.error?.message,e.error?.message].filter(Boolean).join(" · "));setRecords((r.data||[]) as ExternalRecord[]);setEvents((e.data||[]) as CalendarEvent[]);setLoading(false);
    })();return()=>{alive=false;};
  },[]);

  const totalHours=useMemo(()=>records.reduce((sum,r)=>sum+Number(r.cpd_hours||0),0),[records]);
  const upcoming=useMemo(()=>events.filter(e=>new Date(e.starts_at).getTime()>=Date.now()),[events]);

  async function addRecord(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!userId)return;const formEl=e.currentTarget;const form=new FormData(formEl);const file=form.get("evidence") as File|null;const supabase=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const payload={user_id:userId,title:String(form.get("title")||"").trim(),provider:String(form.get("provider")||"").trim(),occurred_on:String(form.get("occurred_on")||new Date().toISOString().slice(0,10)),cpd_hours:Number(form.get("cpd_hours")||0),category:String(form.get("category")||"External CPD"),notes:String(form.get("notes")||""),source:"manual" as const};
    const {data,error}=await supabase.from("external_cpd_records").insert(payload).select("id,title,provider,occurred_on,cpd_hours,category,notes,evidence_path,source,verification_status,created_at").single();
    if(error){setBusy(false);setMessage(error.message);return;}
    let record=data as ExternalRecord;
    if(file&&file.size>0){
      if(file.size>10*1024*1024){setBusy(false);setMessage("The record was saved, but the evidence file is over the 10 MB upload limit.");setRecords(prev=>[record,...prev]);return;}
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`${userId}/${record.id}/${Date.now()}-${safe}`;
      const {error:uploadError}=await supabase.storage.from("cpd-evidence").upload(path,file,{upsert:false});
      if(uploadError){setMessage(`Record saved, but evidence upload failed: ${uploadError.message}`);}else{
        const {data:updated,error:updateError}=await supabase.from("external_cpd_records").update({evidence_path:path,updated_at:new Date().toISOString()}).eq("id",record.id).select("id,title,provider,occurred_on,cpd_hours,category,notes,evidence_path,source,verification_status,created_at").single();
        if(!updateError&&updated)record=updated as ExternalRecord;
      }
    }
    await supabase.from("portfolio_entries").insert({user_id:userId,title:record.title,description:[record.provider,record.notes].filter(Boolean).join(" · "),evidence_type:"external_cpd",cpd_hours:record.cpd_hours,occurred_on:record.occurred_on});
    setRecords(prev=>[record,...prev]);formEl.reset();setBusy(false);setMessage("External CPD saved and added to your professional portfolio.");
  }

  async function chooseCsv(file:File|null){
    if(!file){setCsvRows([]);setCsvName("");return;}setCsvName(file.name);const text=await file.text();
    try{const parsed=parseCpdCsv(text);setCsvRows(parsed);setMessage(parsed.length?`Prepared ${parsed.length} valid CPD rows for import.`:"No valid rows were found. Use the template columns shown below.");}catch(err){setCsvRows([]);setMessage(err instanceof Error?err.message:"Could not read that CSV file.");}
  }

  async function importCsv(){
    if(!userId||!csvRows.length)return;setBusy(true);const supabase=getSupabaseBrowserClient();
    const payload=csvRows.map(r=>({...r,user_id:userId,source:"csv_import" as const}));
    const {data,error}=await supabase.from("external_cpd_records").insert(payload).select("id,title,provider,occurred_on,cpd_hours,category,notes,evidence_path,source,verification_status,created_at");
    if(error){setBusy(false);setMessage(error.message);return;}
    const imported=(data||[]) as ExternalRecord[];
    if(imported.length)await supabase.from("portfolio_entries").insert(imported.map(r=>({user_id:userId,title:r.title,description:[r.provider,r.notes].filter(Boolean).join(" · "),evidence_type:"external_cpd",cpd_hours:r.cpd_hours,occurred_on:r.occurred_on})));
    setRecords(prev=>[...imported,...prev].sort((a,b)=>b.occurred_on.localeCompare(a.occurred_on)));setCsvRows([]);setCsvName("");setBusy(false);setMessage(`Imported ${imported.length} external CPD records and added them to your portfolio.`);
  }

  async function openEvidence(record:ExternalRecord){
    if(!record.evidence_path)return;const {data,error}=await getSupabaseBrowserClient().storage.from("cpd-evidence").createSignedUrl(record.evidence_path,300);if(error||!data?.signedUrl){setMessage(error?.message||"Unable to open evidence.");return;}window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  function exportCsv(){
    const rows=[["title","provider","date","hours","category","notes"],...records.map(r=>[r.title,r.provider,r.occurred_on,String(r.cpd_hours),r.category,r.notes])];downloadText("my-cpd-records.csv",rows.map(row=>row.map(csvCell).join(",")).join("\n"),"text/csv;charset=utf-8");
  }

  function downloadTemplate(){downloadText("cpd-import-template.csv","title,provider,date,hours,category,notes\nExample CPD,Provider name,2026-09-26,1.5,External CPD,Optional notes","text/csv;charset=utf-8");}
  function exportCalendar(){downloadText("school-cpd-calendar.ics",buildIcs(events),"text/calendar;charset=utf-8");}

  if(loading)return <main className="stagePage"><div className="stageCard">Loading external CPD and integrations…</div></main>;
  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 12 · INTEGRATIONS & EXTERNAL CPD</span><h1>Bring external professional development into one record.</h1><p>Log external training, upload private supporting evidence, bulk-import historic CPD from CSV and export the school CPD calendar to calendar apps using the standard iCalendar format.</p><div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/portfolio">Open portfolio</a><a className="secondary phaseLinkButton" href="/accessibility">App & accessibility</a></div></section>
    {message&&<div className="phaseNotice">{message}</div>}
    <section className="stageStatGrid"><div className="stageStat"><strong>{records.length}</strong><span>external CPD records</span></div><div className="stageStat"><strong>{totalHours.toFixed(1)}</strong><span>external CPD hours</span></div><div className="stageStat"><strong>{records.filter(r=>r.evidence_path).length}</strong><span>evidence files</span></div><div className="stageStat"><strong>{upcoming.length}</strong><span>upcoming school CPD events</span></div></section>

    <section className="integrationGrid">
      <div className="stageCard integrationCard"><span className="eyebrow">MANUAL RECORD</span><h2>Add external CPD</h2><form className="stageForm" onSubmit={addRecord}><div className="stageFormGrid"><label className="full">CPD title<input required name="title"/></label><label>Provider<input name="provider" placeholder="Organisation or facilitator"/></label><label>Date<input required name="occurred_on" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label><label>CPD hours<input required name="cpd_hours" type="number" min="0" max="999.99" step="0.25" defaultValue="1"/></label><label>Category<select name="category" defaultValue="External CPD"><option>External CPD</option><option>Conference</option><option>Webinar</option><option>Qualification</option><option>Professional reading</option><option>Coaching</option><option>Other</option></select></label><label className="full">Notes<textarea name="notes" rows={3}/></label><label className="full">Evidence (optional)<input className="fileInput" name="evidence" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"/><span className="csvHint">Private PDF/image, maximum 10 MB. Stored in your user-only evidence folder.</span></label></div><button className="primary" disabled={busy}>{busy?"Saving…":"Save external CPD"}</button></form></div>

      <div className="stageCard integrationCard"><span className="eyebrow">BULK IMPORT</span><h2>Import historic CPD from CSV</h2><p>Use columns: <strong>title, provider, date, hours, category, notes</strong>. Extra columns are ignored.</p><div className="calendarActions"><button className="secondary" onClick={downloadTemplate}>Download CSV template</button><label className="secondary phaseLinkButton" style={{cursor:"pointer"}}>Choose CSV<input type="file" accept=".csv,text/csv" style={{display:"none"}} onChange={e=>chooseCsv(e.target.files?.[0]||null)}/></label></div>{csvName&&<p className="csvHint">{csvName}</p>}{csvRows.length>0&&<><div className="importSummary"><span className="stageBadge good">{csvRows.length} valid rows</span><span>{csvRows.reduce((s,r)=>s+r.cpd_hours,0).toFixed(1)} hours</span></div><div className="stageList">{csvRows.slice(0,5).map((r,i)=><div className="stageRow" key={`${r.title}-${i}`}><div className="stageRowMain"><strong>{r.title}</strong><span>{r.provider||"No provider"} · {r.occurred_on} · {r.cpd_hours}h</span></div></div>)}{csvRows.length>5&&<div className="emptyCompact">+ {csvRows.length-5} more rows</div>}</div><button className="primary" disabled={busy} onClick={importCsv}>{busy?"Importing…":"Import records"}</button></>}</div>

      <div className="stageCard integrationCard"><span className="eyebrow">CALENDAR</span><h2>School CPD calendar integration</h2><p>Export the current CPD calendar as an <strong>.ics</strong> file for Google Calendar, Outlook, Apple Calendar or other compatible calendar apps.</p><div className="calendarActions"><button className="primary" disabled={!events.length} onClick={exportCalendar}>Download CPD calendar (.ics)</button></div><div className="stageList">{upcoming.slice(0,6).map(event=><div className="stageRow" key={event.id}><div className="stageRowMain"><strong>{event.title}</strong><span>{new Date(event.starts_at).toLocaleString("en-GB")} · {event.location||"Location TBC"}</span><small>{event.audience} · {event.event_type}</small></div></div>)}{!upcoming.length&&<div className="emptyCompact">No upcoming CPD calendar items.</div>}</div></div>

      <div className="stageCard integrationCard"><span className="eyebrow">EXPORT</span><h2>Your portable CPD record</h2><p>Keep a human-readable copy of your external CPD history for appraisal, professional registration or transfer between systems.</p><div className="calendarActions"><button className="secondary" disabled={!records.length} onClick={exportCsv}>Export my CPD as CSV</button></div><p className="csvHint">Evidence files remain private in Supabase Storage and are not bundled into the CSV export.</p></div>
    </section>

    <section className="stageCard" style={{marginTop:18}}><div className="phaseCardHead"><div><span className="eyebrow">YOUR EXTERNAL CPD</span><h2>Evidence and history</h2></div></div><div className="stageList">{records.map(record=><div className="stageRow" key={record.id}><div className="stageRowMain"><strong>{record.title}</strong><span>{record.provider||"No provider"} · {new Date(record.occurred_on).toLocaleDateString("en-GB")} · {Number(record.cpd_hours).toFixed(1)}h</span><small>{record.category} · {record.source.replaceAll("_"," ")} · {record.verification_status.replaceAll("_"," ")}{record.notes?` · ${record.notes}`:""}</small></div><div className="externalRecordActions">{record.evidence_path&&<button className="smallButton" onClick={()=>openEvidence(record)}>Open evidence</button>}<span className={`stageBadge ${record.evidence_path?"good":""}`}>{record.evidence_path?"evidence saved":"record only"}</span></div></div>)}{!records.length&&<div className="emptyCompact">No external CPD has been recorded yet.</div>}</div></section>
  </main>;
}

function parseCpdCsv(text:string):CsvRecord[]{
  const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim());if(lines.length<2)return[];
  const headers=parseCsvLine(lines[0]).map(x=>x.trim().toLowerCase());
  const find=(...names:string[])=>names.map(n=>headers.indexOf(n)).find(i=>i!==-1)??-1;
  const titleI=find("title","cpd title","course");const providerI=find("provider","organisation","organization");const dateI=find("date","occurred_on","occurred on");const hoursI=find("hours","cpd_hours","cpd hours");const categoryI=find("category");const notesI=find("notes","description");
  if(titleI<0||dateI<0||hoursI<0)throw new Error("CSV must include title, date and hours columns.");
  return lines.slice(1).map(line=>parseCsvLine(line)).map(cells=>({title:(cells[titleI]||"").trim(),provider:providerI>=0?(cells[providerI]||"").trim():"",occurred_on:normaliseDate(cells[dateI]||""),cpd_hours:Number(cells[hoursI]||0),category:categoryI>=0?(cells[categoryI]||"External CPD").trim()||"External CPD":"External CPD",notes:notesI>=0?(cells[notesI]||"").trim():""})).filter(r=>r.title&&/^\d{4}-\d{2}-\d{2}$/.test(r.occurred_on)&&Number.isFinite(r.cpd_hours)&&r.cpd_hours>=0&&r.cpd_hours<=999.99);
}
function parseCsvLine(line:string){const out:string[]=[];let current="";let quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){out.push(current);current="";}else current+=ch;}out.push(current);return out;}
function normaliseDate(value:string){const v=value.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10);}
function csvCell(value:string){const v=String(value??"");return /[",\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v;}
function downloadText(filename:string,content:string,type:string){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function icsText(value:string){return String(value||"").replaceAll("\\","\\\\").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;");}
function icsDate(value:string){return new Date(value).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");}
function buildIcs(events:CalendarEvent[]){const body=events.map(e=>["BEGIN:VEVENT",`UID:${e.id}@teaching-cpd`,`DTSTAMP:${icsDate(new Date().toISOString())}`,`DTSTART:${icsDate(e.starts_at)}`,e.ends_at?`DTEND:${icsDate(e.ends_at)}`:"",`SUMMARY:${icsText(e.title)}`,`DESCRIPTION:${icsText(e.description)}`,`LOCATION:${icsText(e.location)}`,"END:VEVENT"].filter(Boolean).join("\r\n")).join("\r\n");return["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Teaching CPD Hub//EN","CALSCALE:GREGORIAN",body,"END:VCALENDAR"].join("\r\n");}
