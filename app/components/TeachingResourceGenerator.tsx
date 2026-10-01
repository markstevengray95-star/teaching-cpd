"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import "./TeachingResourceGenerator.css";

type ResourceType =
  | "retrieval-question"
  | "quiz"
  | "exit-ticket"
  | "differentiation"
  | "learning-objective"
  | "worksheet"
  | "vocabulary"
  | "hinge-question"
  | "lesson-starter";

type Source = "ai" | "template" | "edited";

type SavedResource = {
  id: string;
  title: string;
  resource_type: ResourceType;
  subject: string;
  year_group: string;
  topic: string;
  content: string;
  source: Source;
  updated_at: string;
};

const resourceTypes: { id: ResourceType; label: string; helper: string }[] = [
  { id: "retrieval-question", label: "Retrieval questions", helper: "Spaced recall plus answer key" },
  { id: "quiz", label: "Quick quiz", helper: "10 varied low-stakes questions" },
  { id: "exit-ticket", label: "Exit ticket", helper: "Fast end-of-lesson understanding check" },
  { id: "differentiation", label: "Adaptive teaching", helper: "Scaffolds, stretch and barrier planning" },
  { id: "learning-objective", label: "Learning objective", helper: "Objective, success criteria and challenge" },
  { id: "worksheet", label: "Worksheet", helper: "Guided to independent classroom practice" },
  { id: "vocabulary", label: "Vocabulary builder", helper: "Definitions, examples and misconceptions" },
  { id: "hinge-question", label: "Hinge questions", helper: "Diagnostic choices and teacher actions" },
  { id: "lesson-starter", label: "Lesson starter", helper: "8–10 minute purposeful opening" },
];

const subjectOptions = ["Science", "Biology", "Chemistry", "Physics", "Maths", "English", "Geography", "History", "Languages", "Computing", "Art", "PE", "PSHE", "Other"];
const yearOptions = ["KS1", "KS2", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13", "Mixed age"];

function typeLabel(value: ResourceType) {
  return resourceTypes.find((item) => item.id === value)?.label || value;
}

function downloadText(title: string, content: string) {
  const blob = new Blob([`${title}\n${"=".repeat(Math.min(title.length, 60))}\n\n${content}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "teaching-resource"}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TeachingResourceGenerator() {
  const [resourceType, setResourceType] = useState<ResourceType>("retrieval-question");
  const [subject, setSubject] = useState("Science");
  const [yearGroup, setYearGroup] = useState("Year 10");
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState<Source>("edited");
  const [saved, setSaved] = useState<SavedResource[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseBrowserClient();
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!mounted || !auth.user) return;
      setUserId(auth.user.id);
      const [{ data: profile }, { data: rows }] = await Promise.all([
        client.from("staff_development_profiles").select("preferred_organization_id").eq("user_id", auth.user.id).maybeSingle(),
        client.from("staff_development_saved_resources").select("id,title,resource_type,subject,year_group,topic,content,source,updated_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false }).limit(100),
      ]);
      if (!mounted) return;
      setOrganizationId(profile?.preferred_organization_id || null);
      setSaved((rows || []) as SavedResource[]);
    })().catch((error) => {
      console.error("Could not load teaching resource library", error);
      if (mounted) setMessage("Your library could not be loaded yet.");
    });
    return () => { mounted = false; };
  }, []);

  const visibleSaved = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    if (!needle) return saved;
    return saved.filter((item) => `${item.title} ${item.subject} ${item.year_group} ${item.topic} ${typeLabel(item.resource_type)}`.toLowerCase().includes(needle));
  }, [libraryQuery, saved]);

  async function generate() {
    if (!topic.trim()) {
      setMessage("Add a topic first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.assign("/auth?next=/resource-generator");
        return;
      }
      const response = await fetch("/api/resource-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resourceType, subject, yearGroup, topic, details }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The resource could not be generated.");
      setTitle(String(payload.title || `${topic}: ${typeLabel(resourceType)}`));
      setContent(String(payload.content || ""));
      setSource(payload.source === "ai" ? "ai" : "template");
      setEditingId(null);
      setMessage(payload.source === "ai" ? "Resource generated. Review and edit it before using it with pupils." : "A classroom-ready template was created. Review and edit it for your class.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The resource could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  async function saveResource() {
    if (!userId || !title.trim() || !content.trim()) {
      setMessage("Generate or write a resource before saving it.");
      return;
    }
    setSaving(true);
    setMessage("");
    const client = getSupabaseBrowserClient();
    const now = new Date().toISOString();
    try {
      if (editingId) {
        const { data, error } = await client.from("staff_development_saved_resources").update({
          title: title.trim(),
          resource_type: resourceType,
          subject,
          year_group: yearGroup,
          topic: topic.trim(),
          content,
          source: "edited",
          updated_at: now,
        }).eq("id", editingId).eq("user_id", userId).select("id,title,resource_type,subject,year_group,topic,content,source,updated_at").single();
        if (error) throw error;
        const updated = data as SavedResource;
        setSaved((current) => [updated, ...current.filter((item) => item.id !== editingId)]);
        setSource("edited");
        setMessage("Resource updated in your personal library.");
      } else {
        const { data, error } = await client.from("staff_development_saved_resources").insert({
          user_id: userId,
          organization_id: organizationId,
          title: title.trim(),
          resource_type: resourceType,
          subject,
          year_group: yearGroup,
          topic: topic.trim(),
          content,
          source,
          updated_at: now,
        }).select("id,title,resource_type,subject,year_group,topic,content,source,updated_at").single();
        if (error) throw error;
        const created = data as SavedResource;
        setSaved((current) => [created, ...current]);
        setEditingId(created.id);
        setMessage("Saved to your personal resource library.");
      }
    } catch (error) {
      console.error("Resource save failed", error);
      setMessage("The resource could not be saved to the cloud yet.");
    } finally {
      setSaving(false);
    }
  }

  function openSaved(item: SavedResource) {
    setEditingId(item.id);
    setTitle(item.title);
    setResourceType(item.resource_type);
    setSubject(item.subject);
    setYearGroup(item.year_group);
    setTopic(item.topic);
    setContent(item.content);
    setSource(item.source);
    setDetails("");
    setMessage("Saved resource opened for editing.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSaved(item: SavedResource) {
    if (!userId || !window.confirm(`Delete “${item.title}” from your personal library?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("staff_development_saved_resources").delete().eq("id", item.id).eq("user_id", userId);
    if (error) {
      setMessage("That resource could not be deleted.");
      return;
    }
    setSaved((current) => current.filter((resource) => resource.id !== item.id));
    if (editingId === item.id) setEditingId(null);
    setMessage("Resource deleted from your library.");
  }

  function newResource() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setDetails("");
    setSource("edited");
    setMessage("");
  }

  return (
    <main className="rgPage">
      <header className="rgTopbar">
        <Link href="/teaching-learning">← Teaching & Learning</Link>
        <div><span>PHASE 32</span><strong>Teaching Resource Generator</strong></div>
        <button onClick={newResource}>+ New resource</button>
      </header>

      <section className="rgHero">
        <div><span className="rgEyebrow">PLAN FASTER · KEEP CONTROL</span><h1>Create, edit and keep useful classroom resources.</h1><p>Choose the teaching purpose, add the curriculum context, then review the generated resource before saving it to your private library.</p></div>
        <div className="rgHeroCard"><strong>{saved.length}</strong><span>saved resources</span><small>Private to your account</small></div>
      </section>

      <section className="rgWorkspace">
        <aside className="rgBuilder">
          <div className="rgPanelHeading"><div><span>1</span><h2>Choose a resource</h2></div><small>9 classroom formats</small></div>
          <div className="rgTypeGrid">{resourceTypes.map((item) => <button key={item.id} className={resourceType === item.id ? "active" : ""} onClick={() => setResourceType(item.id)}><strong>{item.label}</strong><small>{item.helper}</small></button>)}</div>

          <div className="rgPanelHeading rgStep"><div><span>2</span><h2>Add the context</h2></div></div>
          <div className="rgFormGrid">
            <label><span>Subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjectOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Year / phase</span><select value={yearGroup} onChange={(event) => setYearGroup(event.target.value)}>{yearOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="wide"><span>Topic</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Forces and motion" /></label>
            <label className="wide"><span>Extra requirements <small>optional</small></span><textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="e.g. Include one calculation, focus on common misconceptions, 20-minute task..." /></label>
          </div>
          <button className="rgGenerate" onClick={generate} disabled={busy}>{busy ? "Generating…" : `Generate ${typeLabel(resourceType)}`}</button>
          <p className="rgTeacherNote">Generated resources should be checked for accuracy, suitability and accessibility before classroom use.</p>
        </aside>

        <section className="rgEditor">
          <div className="rgPanelHeading"><div><span>3</span><h2>Review & edit</h2></div>{content && <small>{source === "ai" ? "AI draft" : source === "template" ? "Template draft" : "Edited"}</small>}</div>
          {content ? <>
            <label className="rgTitleEdit"><span>Resource title</span><input value={title} onChange={(event) => { setTitle(event.target.value); setSource("edited"); }} /></label>
            <label className="rgContentEdit"><span>Resource content</span><textarea value={content} onChange={(event) => { setContent(event.target.value); setSource("edited"); }} /></label>
            <div className="rgEditorActions">
              <button className="primary" onClick={saveResource} disabled={saving}>{saving ? "Saving…" : editingId ? "Update saved resource" : "Save to my library"}</button>
              <button onClick={() => navigator.clipboard.writeText(`${title}\n\n${content}`).then(() => setMessage("Copied to clipboard."))}>Copy</button>
              <button onClick={() => downloadText(title, content)}>Download .txt</button>
            </div>
          </> : <div className="rgBlank"><span>✦</span><strong>Your resource will appear here</strong><p>Pick a resource type, add the lesson context and generate a first draft. You can edit every word before saving it.</p></div>}
          {message && <div className="rgMessage" role="status">{message}</div>}
        </section>
      </section>

      <section className="rgLibrary">
        <div className="rgLibraryHeading"><div><span className="rgEyebrow">PERSONAL LIBRARY</span><h2>Your saved teaching resources</h2><p>Open any resource to edit it again, download a copy or remove it.</p></div><input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search your resources…" /></div>
        {visibleSaved.length ? <div className="rgLibraryGrid">{visibleSaved.map((item) => <article key={item.id}>
          <div className="rgResourceMeta"><span>{typeLabel(item.resource_type)}</span><small>{new Date(item.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></div>
          <h3>{item.title}</h3><p>{item.subject} · {item.year_group}{item.topic ? ` · ${item.topic}` : ""}</p>
          <div><button onClick={() => openSaved(item)}>Open & edit</button><button onClick={() => downloadText(item.title, item.content)}>Download</button><button className="danger" onClick={() => deleteSaved(item)}>Delete</button></div>
        </article>)}</div> : <div className="rgLibraryEmpty"><strong>{saved.length ? "No saved resources match that search." : "Your library is empty."}</strong><p>{saved.length ? "Try a different title, subject, year group or topic." : "Generate your first resource above and save it here for later."}</p></div>}
      </section>
    </main>
  );
}
