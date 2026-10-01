"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type FileRow={id:string;title:string;description:string|null;category:string|null;link_url:string|null;storage_path:string|null;created_at:string};
const leaders:StaffRole[]=["hod","pastoral","send-eal","slt","administrator","super-admin"];

export default function FileStorageHub(){
  const client=getSupabaseBrowserClient();
  const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [role,setRole]=useState<StaffRole>("teacher");
  const [organizationId,setOrganizationId]=useState("");const [userId,setUserId]=useState("");const [files,setFiles]=useState<FileRow[]>([]);const [uploading,setUploading]=useState(false);
  const canUpload=leaders.includes(role);

  async function load(){setLoading(true);setMessage("");const {data:auth}=await client.auth.getUser();if(!auth.user){setMessage("Sign in to view school files.");setLoading(false);return;}setUserId(auth.user.id);const access=await resolveStaffAccess(client,auth.user);setRole(access.role);setOrganizationId(access.organizationId||"");if(!access.organizationId){setMessage("Select a school organisation first.");setLoading(false);return;}const {data,error}=await client.from("school_content_items").select("id,title,description,category,link_url,storage_path,created_at").eq("organization_id",access.organizationId).eq("content_type","resource").order("created_at",{ascending:false});if(error)setMessage(error.message);setFiles((data||[]).filter((row:any)=>String(row.link_url||row.storage_path||"").startsWith("storage:")) as FileRow[]);setLoading(false);}
  useEffect(()=>{void load();},[]);

  async function upload(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file||!canUpload||!organizationId||!userId)return;setUploading(true);setMessage("");const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");const path=`${organizationId}/${userId}/${crypto.randomUUID()}-${safe}`;const result=await client.storage.from("school-knowledge").upload(path,file,{upsert:false});if(result.error){setMessage(result.error.message);setUploading(false);return;}const {error}=await client.from("school_content_items").insert({organization_id:organizationId,content_type:"resource",title:file.name,description:"School file",category:"Files",audience:"all-staff",link_url:`storage:${path}`,storage_path:path,status:"published",created_by:userId});if(error)setMessage(error.message);event.target.value="";setUploading(false);await load();}

  async function open(row:FileRow){const value=String(row.storage_path||row.link_url||"").replace(/^storage:/,"");if(!value)return;const {data,error}=await client.storage.from("school-knowledge").createSignedUrl(value,300);if(error)setMessage(error.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}

  return <main className="rpShell"><header className="rpTopbar"><Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link><nav><Link href="/files">Files</Link><Link href="/resource-library">Resources</Link><Link href="/policies">Policies</Link></nav><span className="rpRole">{STAFF_ROLE_LABELS[role]}</span></header><section className="rpHero"><div><span>PHASE 63 · FILE STORAGE</span><h1>School File Centre</h1><p>Store private school files in Supabase Storage and expose them to staff through signed, time-limited links.</p></div>{canUpload&&<label style={{cursor:"pointer"}}><input type="file" hidden onChange={(event)=>void upload(event)}/><span style={{display:"inline-block",background:"#1f2a44",color:"#fff",padding:"11px 16px",borderRadius:11,fontWeight:800}}>{uploading?"Uploading…":"Upload file"}</span></label>}</section>{message&&<div className="rpMessage">{message}</div>}{loading?<section className="rpEmpty">Loading school files…</section>:<><section className="rpStats"><article><strong>{files.length}</strong><span>Stored school files</span></article><article><strong>Private</strong><span>Storage bucket</span></article><article><strong>5 min</strong><span>Signed link lifetime</span></article><article><strong>{canUpload?"Upload":"Read"}</strong><span>Your access</span></article></section><section className="rpSearchResults">{files.map((row)=><button key={row.id} onClick={()=>void open(row)} className="rpSearchResult" style={{textAlign:"left",cursor:"pointer"}}><small>{row.category||"File"}</small><h3>{row.title}</h3><p>{row.description||"Open secure file"}</p></button>)}{!files.length&&<section className="rpEmpty"><strong>No stored files yet.</strong><p>Leadership can upload files here, or add Drive links through the Resource Library.</p></section>}</section></>}</main>;
}
