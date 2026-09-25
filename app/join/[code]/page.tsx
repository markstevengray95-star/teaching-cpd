"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Session = { id: string; join_code: string; exit_code: string; title: string; presenter_name: string; location: string; description: string; objectives: string[]; status: "draft" | "live" | "closed" };
type Activity = { id: string; session_id: string; sort_order: number; activity_type: string; title: string; prompt: string; options: unknown; required: boolean; is_open: boolean };
type Profile = { id: string; full_name: string; department: string };

type AnswerMap = Record<string, string>;

export default function JoinSessionPage() {
  const params = useParams<{ code: string }>();
  const code = String(params?.code || "").toUpperCase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [exitReflection, setExitReflection] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = `/auth?next=${encodeURIComponent(`/join/${code}`)}`;
        return;
      }
      const { data: p } = await supabase.from("staff_profiles").select("id,full_name,department").eq("id", auth.user.id).single();
      if (mounted) setProfile(p as Profile);
      const { data: s, error } = await supabase.from("live_sessions").select("id,join_code,exit_code,title,presenter_name,location,description,objectives,status").or(`join_code.eq.${code},exit_code.eq.${code}`).limit(1).maybeSingle();
      if (error || !s) {
        if (mounted) { setMessage(error?.message || "This CPD code is not currently active."); setLoading(false); }
        return;
      }
      if (mounted) setSession(s as Session);
      const { data: a } = await supabase.from("live_activities").select("*").eq("session_id", s.id).order("sort_order", { ascending: true });
      if (mounted) setActivities((a || []) as Activity[]);
      const { data: participant } = await supabase.from("live_participants").select("session_id").eq("session_id", s.id).eq("user_id", auth.user.id).maybeSingle();
      if (mounted) setJoined(Boolean(participant));
      const { data: existing } = await supabase.from("live_responses").select("activity_id,response").eq("session_id", s.id).eq("user_id", auth.user.id);
      if (mounted && existing) {
        const map: AnswerMap = {};
        existing.forEach((r: { activity_id: string; response: { value?: string } }) => { map[r.activity_id] = String(r.response?.value ?? ""); });
        setAnswers(map);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [code]);

  async function join() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !session || !profile) return;
    const { error } = await supabase.from("live_participants").upsert({
      session_id: session.id,
      user_id: profile.id,
      display_name: profile.full_name,
      status: "checked_in",
    }, { onConflict: "session_id,user_id" });
    if (error) { setMessage(error.message); return; }
    setJoined(true);
    setMessage("You are checked in. Complete the activities below during the session.");
  }

  async function saveAnswer(activity: Activity, value: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !session || !profile) return;
    setAnswers(prev => ({ ...prev, [activity.id]: value }));
    const { error } = await supabase.from("live_responses").upsert({
      session_id: session.id,
      activity_id: activity.id,
      user_id: profile.id,
      response: { value },
    }, { onConflict: "activity_id,user_id" });
    if (error) { setMessage(error.message); return; }
    const completedCount = Object.keys({ ...answers, [activity.id]: value }).filter(id => activities.some(a => a.id === id)).length;
    await supabase.from("live_participants").update({ status: completedCount >= activities.length ? "activities_complete" : "participated" }).eq("session_id", session.id).eq("user_id", profile.id);
  }

  async function completeExit() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !session || !profile || exitReflection.trim().length < 10) {
      setMessage("Add a short reflection before completing the session.");
      return;
    }
    const { error } = await supabase.from("live_participants").update({
      final_reflection: exitReflection.trim(),
      checked_out_at: new Date().toISOString(),
      status: "completed",
    }).eq("session_id", session.id).eq("user_id", profile.id);
    if (error) { setMessage(error.message); return; }
    setMessage("CPD completed. Your participation and reflection have been recorded.");
  }

  if (loading) return <main className="joinPage"><div className="joinCard">Loading CPD session…</div></main>;
  if (!getSupabaseBrowserClient()) return <main className="joinPage"><div className="joinCard"><h1>Live CPD connection pending</h1><p>The QR participation flow is built but the new Supabase project still needs to be connected.</p><a className="secondary phaseLinkButton" href="/">Back to CPD Hub</a></div></main>;
  if (!session) return <main className="joinPage"><div className="joinCard"><span className="eyebrow">LIVE CPD</span><h1>Session unavailable</h1><p>{message || "This code is not active."}</p><a className="secondary phaseLinkButton" href="/">Back to CPD Hub</a></div></main>;

  const exitMode = session.exit_code === code;
  return <main className="joinPage">
    <section className="joinCard joinHeaderCard">
      <span className="eyebrow">{exitMode ? "EXIT REFLECTION" : "LIVE CPD SESSION"}</span>
      <h1>{session.title}</h1>
      <p>{session.description}</p>
      <div className="joinMeta"><span>Presenter: {session.presenter_name || "CPD Lead"}</span><span>{session.location || "School CPD"}</span></div>
      {message && <div className="feedback">{message}</div>}
      {!joined && !exitMode && <button className="primary full bigAction" disabled={session.status !== "live"} onClick={join}>{session.status === "live" ? "Join CPD Session" : "Session has not started"}</button>}
    </section>

    {joined && !exitMode && <section className="joinActivities">
      {activities.map((activity, index) => <ActivityCard key={activity.id} activity={activity} index={index} value={answers[activity.id] || ""} onSave={value => saveAnswer(activity, value)} />)}
      {activities.length === 0 && <div className="joinCard"><p>No activities have been added to this session yet.</p></div>}
    </section>}

    {exitMode && <section className="joinCard">
      <span className="eyebrow">FINAL STEP</span><h2>Reflect and complete</h2>
      <p>What will you take away from this CPD, and what will you try in your own practice?</p>
      <textarea className="reflectionBox" rows={7} value={exitReflection} onChange={e => setExitReflection(e.target.value)} placeholder="Record a useful professional reflection…" />
      <button className="primary full bigAction" onClick={completeExit}>Complete CPD</button>
    </section>}
  </main>;
}

function ActivityCard({ activity, index, value, onSave }: { activity: Activity; index: number; value: string; onSave: (value: string) => void }) {
  const options = Array.isArray(activity.options) ? activity.options.map(String) : [];
  const choice = ["poll","multiple_choice","rating","scenario"].includes(activity.activity_type) && options.length > 0;
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <article className="joinCard activityCard">
    <div className="activityNumber">{index + 1}</div>
    <div className="activityBody"><span className="eyebrow">{activity.activity_type.replaceAll("_", " ")}</span><h2>{activity.title}</h2><p>{activity.prompt}</p>
      {choice ? <div className="joinOptions">{options.map(opt => <button key={opt} className={value === opt ? "option selected" : "option"} onClick={() => onSave(opt)}>{opt}</button>)}</div> : <><textarea className="reflectionBox" rows={4} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type your response…" /><button className="primary" disabled={!draft.trim()} onClick={() => onSave(draft.trim())}>{value ? "Update response" : "Submit response"}</button></>}
      {value && <div className="savedResponse">✓ Response saved</div>}
    </div>
  </article>;
}
