"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type IntelligenceMode = "search" | "assistant" | "recommendations";
type SearchItem = {
  id: string;
  type: string;
  title: string;
  text: string;
  category?: string;
  date?: string | null;
  href: string;
  priority?: string | null;
  raw?: any;
};

type AssistantCitation = { index: number; id: string; title: string };

function words(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function score(item: SearchItem, query: string) {
  const tokens = words(query);
  if (!tokens.length) return 0;
  const title = item.title.toLowerCase();
  const body = `${item.text} ${item.category || ""} ${item.type}`.toLowerCase();
  return tokens.reduce((total, token) => total + (title.includes(token) ? 5 : 0) + (body.includes(token) ? 2 : 0), 0);
}

function prettyDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(value?: string | null) {
  if (!value) return 9999;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export default function SchoolIntelligenceHub({ mode }: { mode: IntelligenceMode }) {
  const client = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [organizationId, setOrganizationId] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<AssistantCitation[]>([]);
  const [asking, setAsking] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { setMessage("Sign in to use school search."); setLoading(false); return; }
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);
    setOrganizationId(access.organizationId || "");
    if (!access.organizationId) { setMessage("Select a school organisation first."); setLoading(false); return; }
    const org = access.organizationId;
    const [content, notices, calendar, improvement, requests, directory, notifications] = await Promise.all([
      client.from("school_content_items").select("id,title,description,category,content_type,review_date,status").eq("organization_id", org).limit(150),
      client.from("school_notices").select("id,title,body,category,priority,starts_at,expires_at").eq("organisation_id", org).limit(100),
      client.from("school_calendar_events").select("id,title,description,category,starts_at,location").eq("organization_id", org).limit(150),
      client.from("school_improvement_items").select("id,title,description,strand,status,priority,due_date,progress,scope,department").eq("organization_id", org).limit(150),
      client.from("school_requests").select("id,title,description,request_type,status,due_date,event_date,metadata").eq("organization_id", org).limit(100),
      client.from("staff_directory_entries").select("id,display_name,role,department,job_title,expertise,bio").eq("organization_id", org).limit(200),
      client.from("school_notifications").select("id,title,body,category,priority,starts_at,expires_at,action_url").eq("organization_id", org).limit(100),
    ]);
    const next: SearchItem[] = [];
    for (const row of content.data || []) next.push({ id: row.id, type: row.content_type === "policy" ? "Policy" : "Resource", title: row.title, text: row.description || "", category: row.category || undefined, date: row.review_date, href: row.content_type === "policy" ? "/policies" : "/resource-library", raw: row });
    for (const row of notices.data || []) next.push({ id: row.id, type: "Notice", title: row.title, text: row.body || "", category: row.category || undefined, date: row.starts_at, href: "/notices", priority: row.priority, raw: row });
    for (const row of calendar.data || []) next.push({ id: row.id, type: "Calendar", title: row.title, text: `${row.description || ""} ${row.location || ""}`, category: row.category || undefined, date: row.starts_at, href: "/calendar", raw: row });
    for (const row of improvement.data || []) next.push({ id: row.id, type: row.scope === "school" ? "School Improvement" : "Department Plan", title: row.title, text: `${row.description || ""} ${row.strand || ""} ${row.department || ""}`, category: row.strand || undefined, date: row.due_date, href: row.scope === "school" ? "/school-improvement" : "/department-plans", priority: row.priority, raw: row });
    for (const row of requests.data || []) next.push({ id: row.id, type: row.request_type === "trip" ? "Trip" : "Form", title: row.title, text: `${row.description || ""} ${row.status || ""}`, category: row.metadata?.category || undefined, date: row.event_date || row.due_date, href: row.request_type === "trip" ? "/trips" : "/forms", raw: row });
    for (const row of directory.data || []) next.push({ id: row.id, type: "Staff", title: row.display_name, text: `${row.job_title || ""} ${row.role || ""} ${row.department || ""} ${(row.expertise || []).join(" ")} ${row.bio || ""}`, category: row.department || undefined, href: "/directory", raw: row });
    for (const row of notifications.data || []) next.push({ id: row.id, type: "Notification", title: row.title, text: row.body || "", category: row.category || undefined, date: row.starts_at, href: row.action_url || "/notifications", priority: row.priority, raw: row });
    setItems(next);
    const firstError = [content.error, notices.error, calendar.error, improvement.error, requests.error, directory.error, notifications.error].find(Boolean);
    if (firstError) setMessage(firstError.message);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const results = useMemo(() => {
    if (!query.trim()) return items.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 40);
    return items.map((item) => ({ item, score: score(item, query) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 40).map((entry) => entry.item);
  }, [items, query]);

  const recommendations = useMemo(() => {
    const recs: Array<SearchItem & { reason: string; weight: number }> = [];
    for (const item of items) {
      const raw = item.raw || {};
      if ((item.type === "School Improvement" || item.type === "Department Plan") && !["complete", "paused"].includes(raw.status)) {
        const due = daysUntil(raw.due_date);
        const weight = (raw.priority === "urgent" ? 9 : raw.priority === "high" ? 6 : 3) + (due <= 0 ? 7 : due <= 14 ? 4 : 0) + ((raw.progress || 0) < 40 ? 2 : 0);
        recs.push({ ...item, weight, reason: due <= 0 ? "Improvement action is overdue" : `Improvement action is due in ${due} days` });
      }
      if ((item.type === "Form" || item.type === "Trip") && raw.status === "submitted") recs.push({ ...item, weight: 7, reason: "Submitted request is waiting for a decision" });
      if (item.type === "Policy" && raw.review_date && daysUntil(raw.review_date) <= 30) recs.push({ ...item, weight: 6, reason: "Policy review date is approaching" });
      if (item.type === "Notice" && ["urgent", "high"].includes(String(item.priority || "").toLowerCase())) recs.push({ ...item, weight: item.priority === "urgent" ? 9 : 6, reason: "High-priority school notice" });
      if (item.type === "Calendar" && item.date) {
        const due = daysUntil(item.date);
        if (due >= 0 && due <= 7) recs.push({ ...item, weight: 4, reason: due === 0 ? "Happening today" : `Coming up in ${due} days` });
      }
    }
    return recs.sort((a, b) => b.weight - a.weight).slice(0, 12);
  }, [items]);

  async function ask(event: FormEvent) {
    event.preventDefault();
    const question = query.trim();
    if (question.length < 3) return;
    setAsking(true); setAnswer(""); setCitations([]); setMessage("");
    const sources = items.map((item) => ({ item, score: score(item, question) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(({ item }) => ({ id: `${item.type}:${item.id}`, title: item.title, category: item.category || item.type, summary: item.text, content: item.text }));
    try {
      const response = await fetch("/api/knowledge-base/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, sources }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "The school assistant could not answer that question.");
      setAnswer(data?.text || "No answer returned.");
      setCitations(Array.isArray(data?.citations) ? data.citations : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The school assistant could not answer that question.");
    } finally { setAsking(false); }
  }

  async function explainRecommendations() {
    const question = "Summarise the most important actions from these current school priorities and explain what staff should check first. Do not invent anything beyond the sources.";
    const sources = recommendations.slice(0, 8).map((item) => ({ id: `${item.type}:${item.id}`, title: item.title, category: item.type, summary: `${item.reason}. ${item.text}`, content: `${item.reason}. ${item.text}` }));
    setAsking(true); setAnswer(""); setCitations([]); setMessage("");
    try {
      const response = await fetch("/api/knowledge-base/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, sources }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI summary unavailable.");
      setAnswer(data?.text || "No summary returned.");
      setCitations(Array.isArray(data?.citations) ? data.citations : []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "AI summary unavailable."); }
    finally { setAsking(false); }
  }

  const phase = mode === "search" ? 53 : mode === "assistant" ? 54 : 55;
  const title = mode === "search" ? "Universal Search" : mode === "assistant" ? "School AI Assistant" : "Smart Recommendations";
  const description = mode === "search"
    ? "Search notices, calendar events, policies, resources, staff, improvement plans, forms and trips from one place."
    : mode === "assistant"
      ? "Ask school-specific questions using only the records your signed-in account is allowed to see."
      : "Bring urgent notices, upcoming events, overdue improvement actions, pending requests and policy reviews into one prioritised view.";

  return <main className="rpShell">
    <header className="rpTopbar">
      <Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link>
      <nav><Link href="/search">Search</Link><Link href="/school-assistant">School AI</Link><Link href="/recommendations">Recommendations</Link></nav>
      <span className="rpRole">{STAFF_ROLE_LABELS[role]}</span>
    </header>
    <section className="rpHero"><div><span>PHASE {phase} · SCHOOL INTELLIGENCE</span><h1>{title}</h1><p>{description}</p></div>{mode !== "assistant" && <button onClick={() => void load()}>Refresh data</button>}</section>
    <section className="rpStats">
      <article><strong>{items.length}</strong><span>Searchable records</span></article>
      <article><strong>{items.filter((item) => item.type === "Policy" || item.type === "Resource").length}</strong><span>Resources & policies</span></article>
      <article><strong>{recommendations.length}</strong><span>Priority signals</span></article>
      <article><strong>{organizationId ? "Connected" : "No school"}</strong><span>School data</span></article>
    </section>
    {message && <div className="rpMessage">{message}</div>}

    {mode === "search" && <>
      <section className="rpToolbar"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything in your school workspace…" /><select disabled><option>All sources</option></select><button onClick={() => setQuery("")}>Clear</button></section>
      {loading ? <section className="rpEmpty">Indexing the records you can access…</section> : <section className="rpSearchResults">{results.map((item) => <Link href={item.href} key={`${item.type}-${item.id}`} className="rpSearchResult"><small>{item.type}{item.category ? ` · ${item.category}` : ""}{item.date ? ` · ${prettyDate(item.date)}` : ""}</small><h3>{item.title}</h3><p>{item.text || "Open this record."}</p></Link>)}{!results.length && <section className="rpEmpty">No matching results.</section>}</section>}
    </>}

    {mode === "assistant" && <section className="rpCompactGrid" style={{ gridTemplateColumns: "minmax(0,1.25fr) minmax(280px,.75fr)" }}>
      <article className="rpPanel">
        <form onSubmit={ask}><label><strong>Ask a school question</strong><textarea rows={5} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What is the current behaviour policy guidance? What is happening next week? Who can help with…?" style={{ width:"100%",marginTop:10,padding:12,border:"1px solid #dbe1ec",borderRadius:12,font:"inherit",boxSizing:"border-box" }} /></label><button type="submit" disabled={asking}>{asking ? "Checking school sources…" : "Ask using school data"}</button></form>
        {answer && <div className="rpRow" style={{ marginTop:18 }}><small>Grounded answer</small><p style={{ whiteSpace:"pre-wrap" }}>{answer}</p>{citations.length > 0 && <div className="rpPills">{citations.map((item) => <span key={`${item.index}-${item.id}`}>[{item.index}] {item.title}</span>)}</div>}</div>}
      </article>
      <article className="rpPanel"><h2>How this assistant works</h2><p>It ranks the school records your account can already read and sends only the most relevant excerpts to the existing grounded knowledge assistant. If the records do not answer the question, it should say so rather than inventing a school rule.</p><div className="rpPills"><span>RLS respected</span><span>School sources only</span><span>Source references</span></div></article>
    </section>}

    {mode === "recommendations" && <>
      <section className="rpToolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter recommendations…" /><select disabled><option>Priority order</option></select><button disabled={asking || !recommendations.length} onClick={() => void explainRecommendations()}>{asking ? "Analysing…" : "AI summary"}</button></section>
      <section className="rpSearchResults">{recommendations.filter((item) => !query.trim() || `${item.title} ${item.reason}`.toLowerCase().includes(query.toLowerCase())).map((item) => <Link href={item.href} key={`${item.type}-${item.id}`} className="rpSearchResult"><small>{item.type} · {item.reason}</small><h3>{item.title}</h3><p>{item.text || "Open the linked area to take action."}</p></Link>)}{!recommendations.length && !loading && <section className="rpEmpty"><strong>No urgent recommendations right now.</strong><p>Current school records do not contain overdue or high-priority signals.</p></section>}</section>
      {answer && <section className="rpCompactGrid"><article className="rpPanel" style={{ gridColumn:"1 / -1" }}><h2>AI priority summary</h2><p style={{ whiteSpace:"pre-wrap" }}>{answer}</p>{citations.length > 0 && <div className="rpPills">{citations.map((item) => <span key={`${item.index}-${item.id}`}>[{item.index}] {item.title}</span>)}</div>}</article></section>}
    </>}
  </main>;
}
