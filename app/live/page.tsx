"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; full_name: string; role: "Staff" | "Department Lead" | "CPD Lead" | "Admin"; department: string };
type LiveSession = { id: string; join_code: string; exit_code: string; title: string; presenter_id: string; presenter_name: string; location: string; description: string; objectives: string[]; starts_at: string; ends_at: string | null; status: "draft" | "live" | "closed" };
type Participant = { session_id: string; user_id: string; display_name: string; status: string; checked_in_at: string; checked_out_at: string | null };

export default function LiveCPDPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selected, setSelected] = useState<LiveSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/live"; return; }
      const { data: p, error: profileError } = await supabase.from("staff_profiles").select("id,full_name,role,department").eq("id", auth.user.id).single();
      if (profileError) { if (alive) setMessage(profileError.message); setLoading(false); return; }
      if (alive) setProfile(p as Profile);
      const { data, error } = await supabase.from("live_sessions").select("*").eq("presenter_id", auth.user.id).order("starts_at", { ascending: false });
      if (error) { if (alive) setMessage(error.message); }
      else if (alive) setSessions((data || []) as LiveSession[]);
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !selected) { setParticipants([]); return; }
    let mounted = true;
    const refresh = async () => {
      const { data } = await supabase.from("live_participants").select("*").eq("session_id", selected.id).order("checked_in_at", { ascending: true });
      if (mounted) setParticipants((data || []) as Participant[]);
    };
    refresh();
    const channel = supabase.channel(`participants-${selected.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_participants", filter: `session_id=eq.${selected.id}` }, refresh)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [selected]);

  const leader = profile && ["Department Lead", "CPD Lead", "Admin"].includes(profile.role);
  const joinUrl = useMemo(() => selected && typeof window !== "undefined" ? `${window.location.origin}/join/${selected.join_code}` : "", [selected]);

  async function createSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) return;
    const form = new FormData(e.currentTarget);
    const joinCode = makeCode();
    const exitCode = makeCode();
    const starts = String(form.get("starts_at") || "");
    const payload = {
      join_code: joinCode,
      exit_code: exitCode,
      title: String(form.get("title") || "Untitled CPD"),
      presenter_id: profile.id,
      presenter_name: profile.full_name,
      location: String(form.get("location") || ""),
      description: String(form.get("description") || ""),
      objectives: String(form.get("objectives") || "").split("\n").map(s => s.trim()).filter(Boolean),
      starts_at: new Date(starts).toISOString(),
      status: "draft",
    };
    const { data, error } = await supabase.from("live_sessions").insert(payload).select().single();
    if (error) { setMessage(error.message); return; }
    const session = data as LiveSession;
    await supabase.from("live_activities").insert([
      { session_id: session.id, sort_order: 1, activity_type: "rating", title: "Starting confidence", prompt: "How confident do you currently feel about this CPD topic?", options: ["1","2","3","4","5"], required: true },
      { session_id: session.id, sort_order: 2, activity_type: "short_answer", title: "Apply it", prompt: "What is one practical change you could test in your own classroom?", options: [], required: true },
      { session_id: session.id, sort_order: 3, activity_type: "exit_ticket", title: "Exit reflection", prompt: "What will you take away from this session and what will you try next?", options: [], required: true },
    ]);
    setSessions(prev => [session, ...prev]);
    setSelected(session);
    setShowCreate(false);
    setMessage("Session created. Start it when you are ready for staff to join.");
  }

  async function changeStatus(session: LiveSession, status: LiveSession["status"]) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const patch = status === "closed" ? { status, ends_at: new Date().toISOString() } : { status };
    const { data, error } = await supabase.from("live_sessions").update(patch).eq("id", session.id).select().single();
    if (error) { setMessage(error.message); return; }
    const updated = data as LiveSession;
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelected(updated);
  }

  if (loading) return <main className="phasePage"><div className="phaseCard">Loading live CPD…</div></main>;
  if (!getSupabaseBrowserClient()) return <main className="phasePage"><section className="phaseCard"><a className="phaseBack" href="/">← Teaching CPD</a><h1>Live CPD is ready to connect</h1><p>The Phase 2 interface is built, but the new Supabase project still needs to be created and connected before shared sessions can run.</p></section></main>;

  return <main className="phasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">LIVE CPD</span>
      <h1>Interactive staff development sessions</h1>
      <p>Create a session, display the QR code, watch staff join in real time and track participation beyond simple attendance.</p>
      <div className="phaseActions">{leader && <button className="primary" onClick={() => setShowCreate(true)}>Create CPD session</button>}<a className="secondary phaseLinkButton" href="/auth">Account</a></div>
    </section>

    {message && <div className="phaseNotice">{message}</div>}
    {!leader && <div className="phaseNotice">Your account is currently a Staff account. You can join live CPD from a QR code; Department Lead, CPD Lead or Admin permission is required to create sessions.</div>}

    {showCreate && leader && <form className="phaseCard createSessionCard" onSubmit={createSession}>
      <div className="phaseCardHead"><div><span className="eyebrow">NEW SESSION</span><h2>Create live CPD</h2></div><button type="button" className="iconButton" onClick={() => setShowCreate(false)}>×</button></div>
      <div className="phaseFormGrid">
        <label>Session title<input required name="title" placeholder="e.g. Effective Questioning" /></label>
        <label>Location<input name="location" placeholder="e.g. Main Hall" /></label>
        <label>Start time<input required name="starts_at" type="datetime-local" defaultValue={localDateTime()} /></label>
        <label className="span2">Description<textarea name="description" rows={3} placeholder="What is this session about?" /></label>
        <label className="span2">Learning objectives<textarea name="objectives" rows={4} placeholder={"One objective per line\nUnderstand...\nApply..."} /></label>
      </div>
      <button className="primary">Create session</button>
    </form>}

    <section className="liveLayout">
      <div className="phaseCard liveList">
        <div className="phaseCardHead"><div><span className="eyebrow">YOUR SESSIONS</span><h2>{sessions.length} created</h2></div></div>
        {sessions.length === 0 ? <p className="muted">No live CPD sessions yet.</p> : sessions.map(s => <button key={s.id} className={`liveSessionRow ${selected?.id === s.id ? "selected" : ""}`} onClick={() => setSelected(s)}>
          <div><strong>{s.title}</strong><span>{new Date(s.starts_at).toLocaleString("en-GB")} · {s.location || "No location"}</span></div><b className={`statusPill ${s.status}`}>{s.status}</b>
        </button>)}
      </div>

      <div className="phaseCard liveDetail">
        {!selected ? <div className="emptyState"><div>QR</div><strong>Select a session</strong><p>Session controls and live attendance will appear here.</p></div> : <>
          <div className="phaseCardHead"><div><span className="eyebrow">{selected.status.toUpperCase()}</span><h2>{selected.title}</h2><p>{selected.location}</p></div><div className="phaseActions">{selected.status === "draft" && <button className="primary" onClick={() => changeStatus(selected, "live")}>Start session</button>}{selected.status === "live" && <button className="danger" onClick={() => changeStatus(selected, "closed")}>End session</button>}</div></div>
          <div className="sessionControlGrid">
            <div className="qrPanel"><div className="qrWhite">{joinUrl && <QRCode value={joinUrl} size={220} />}</div><strong>Staff join code: {selected.join_code}</strong><span>{selected.status === "live" ? "Scan to join this live session" : selected.status === "draft" ? "Start the session before staff can check in" : "This session is closed"}</span>{joinUrl && <button className="secondary full" onClick={() => navigator.clipboard?.writeText(joinUrl)}>Copy join link</button>}</div>
            <div className="attendancePanel"><div className="attendanceStat"><strong>{participants.length}</strong><span>checked in</span></div><h3>Live attendance</h3>{participants.length === 0 ? <p className="muted">Nobody has joined yet.</p> : <div className="participantList">{participants.map(p => <div key={p.user_id}><span className="participantAvatar">{initials(p.display_name)}</span><div><strong>{p.display_name || "Staff member"}</strong><small>{p.status.replaceAll("_", " ")}</small></div></div>)}</div>}</div>
          </div>
        </>}
      </div>
    </section>
  </main>;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function localDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase() || "?";
}
