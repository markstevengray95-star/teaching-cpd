"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { STAFF_ROLE_LABELS, resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./SchoolCalendarHub.css";

type CalendarAudience = "all_staff" | "teaching" | "tutors" | "leadership" | "support" | "department" | "personal";
type CalendarCategory = "meeting" | "deadline" | "cpd" | "trip" | "assessment" | "school-event" | "pastoral" | "department" | "duty" | "personal" | "event";

type CalendarEvent = {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: CalendarCategory;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string;
  audience: CalendarAudience;
  target_department: string;
  external_url: string;
  created_by: string;
};

type EventForm = {
  title: string;
  description: string;
  category: CalendarCategory;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  audience: CalendarAudience;
  department: string;
  externalUrl: string;
};

const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  cpd: "CPD",
  trip: "Trip / visit",
  assessment: "Assessment",
  "school-event": "School event",
  pastoral: "Pastoral",
  department: "Department",
  duty: "Duty",
  personal: "Personal",
  event: "Event",
};

const AUDIENCE_LABELS: Record<CalendarAudience, string> = {
  all_staff: "All staff",
  teaching: "Teaching staff",
  tutors: "Tutors",
  leadership: "Leadership",
  support: "Support staff",
  department: "Department",
  personal: "Only me",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as CalendarCategory[];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTimeInput(value: string) {
  const date = new Date(value);
  return {
    date: localDateKey(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

function makeIso(date: string, time: string, allDay: boolean, end = false) {
  const value = allDay ? `${date}T${end ? "23:59" : "00:00"}:00` : `${date}T${time || "09:00"}:00`;
  return new Date(value).toISOString();
}

function prettyDate(value: string, withYear = false) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function prettyTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function monthGrid(date: Date) {
  const start = monthStart(date);
  const firstMondayOffset = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstMondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function icsStamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function downloadIcs(event: CalendarEvent) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Staff Development//School Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@staff-development`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(event.starts_at)}`,
    `DTEND:${icsStamp(event.ends_at)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "event"}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function defaultForm(department = ""): EventForm {
  const today = localDateKey();
  return {
    title: "",
    description: "",
    category: "event",
    date: today,
    startTime: "09:00",
    endDate: today,
    endTime: "10:00",
    allDay: false,
    location: "",
    audience: "personal",
    department,
    externalUrl: "",
  };
}

export default function SchoolCalendarHub() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole>("teacher");
  const [department, setDepartment] = useState("");
  const [cursor, setCursor] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => localDateKey());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [categoryFilter, setCategoryFilter] = useState<CalendarCategory | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<CalendarAudience | "all">("all");
  const [form, setForm] = useState<EventForm>(() => defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const canPublishSchool = ["pastoral", "send-eal", "slt", "administrator", "super-admin"].includes(role);
  const canPublishDepartment = canPublishSchool || role === "hod";

  const availableAudiences = useMemo<CalendarAudience[]>(() => {
    if (canPublishSchool) return ["all_staff", "teaching", "tutors", "leadership", "support", "department", "personal"];
    if (canPublishDepartment) return ["department", "personal"];
    return ["personal"];
  }, [canPublishDepartment, canPublishSchool]);

  async function loadEvents(orgId: string, month = cursor) {
    const client = getSupabaseBrowserClient();
    const rangeStart = new Date(monthStart(month));
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(monthEnd(month));
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    const { data, error } = await client
      .from("school_calendar_events")
      .select("id,organization_id,title,description,category,starts_at,ends_at,all_day,location,audience,target_department,external_url,created_by")
      .eq("organization_id", orgId)
      .lte("starts_at", rangeEnd.toISOString())
      .gte("ends_at", rangeStart.toISOString())
      .order("starts_at", { ascending: true });
    if (error) throw error;
    setEvents((data || []) as CalendarEvent[]);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.assign("/auth?next=/calendar");
        return;
      }
      const access = await resolveStaffAccess(client, auth.user);
      if (!mounted) return;
      setUserId(auth.user.id);
      setOrganizationId(access.organizationId);
      setRole(access.role);
      const { data: profile } = await client.from("staff_profiles").select("department").eq("id", auth.user.id).maybeSingle();
      const staffDepartment = String(profile?.department || "");
      if (!mounted) return;
      setDepartment(staffDepartment);
      setForm(defaultForm(staffDepartment));
      if (access.organizationId) await loadEvents(access.organizationId, cursor);
      else setMessage("Your account is not attached to a school organisation yet.");
      if (mounted) setLoading(false);
    })().catch((error) => {
      console.error("Calendar failed to load", error);
      if (mounted) {
        setMessage("The calendar could not be loaded yet.");
        setLoading(false);
      }
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!organizationId || loading) return;
    void loadEvents(organizationId, cursor).catch((error) => {
      console.error("Calendar month failed to load", error);
      setMessage("This calendar month could not be refreshed.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, organizationId]);

  const filteredEvents = useMemo(() => events.filter((event) => {
    if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
    if (audienceFilter !== "all" && event.audience !== audienceFilter) return false;
    return true;
  }), [audienceFilter, categoryFilter, events]);

  const eventByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const start = new Date(event.starts_at);
      const end = new Date(event.ends_at);
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (day <= last) {
        const key = localDateKey(day);
        map.set(key, [...(map.get(key) || []), event]);
        day.setDate(day.getDate() + 1);
      }
    });
    return map;
  }, [filteredEvents]);

  const grid = useMemo(() => monthGrid(cursor), [cursor]);
  const selectedDayEvents = eventByDay.get(selectedDate) || [];
  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;
  const now = new Date();
  const upcoming = filteredEvents.filter((event) => new Date(event.ends_at) >= now).slice(0, 12);

  function changeMonth(delta: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedEventId(null);
  }

  function openNew(date = selectedDate) {
    const next = defaultForm(department);
    next.date = date;
    next.endDate = date;
    next.audience = canPublishDepartment && !canPublishSchool && role === "hod" ? "department" : "personal";
    setForm(next);
    setEditingId(null);
    setComposerOpen(true);
    setMessage("");
  }

  function openEdit(event: CalendarEvent) {
    const start = localDateTimeInput(event.starts_at);
    const end = localDateTimeInput(event.ends_at);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
      allDay: event.all_day,
      location: event.location,
      audience: event.audience,
      department: event.target_department || department,
      externalUrl: event.external_url,
    });
    setEditingId(event.id);
    setComposerOpen(true);
    setSelectedEventId(event.id);
    setMessage("");
  }

  function canEdit(event: CalendarEvent) {
    if (event.created_by === userId && event.audience === "personal") return true;
    if (canPublishSchool) return true;
    return role === "hod" && event.audience === "department" && event.target_department.trim().toLowerCase() === department.trim().toLowerCase();
  }

  async function saveEvent(submit: FormEvent) {
    submit.preventDefault();
    if (!organizationId || !userId || !form.title.trim()) return;
    if (!availableAudiences.includes(form.audience)) {
      setMessage("Your role cannot publish to that audience.");
      return;
    }
    if (form.audience === "department" && !form.department.trim()) {
      setMessage("Choose a department for a department event.");
      return;
    }
    const startsAt = makeIso(form.date, form.startTime, form.allDay, false);
    const endsAt = makeIso(form.endDate || form.date, form.endTime, form.allDay, true);
    if (new Date(endsAt) < new Date(startsAt)) {
      setMessage("The end of the event must be after the start.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      const payload = {
        organization_id: organizationId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        starts_at: startsAt,
        ends_at: endsAt,
        all_day: form.allDay,
        location: form.location.trim(),
        audience: form.audience,
        target_department: form.audience === "department" ? form.department.trim() : "",
        external_url: safeExternalUrl(form.externalUrl) || "",
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await client.from("school_calendar_events").update(payload).eq("id", editingId);
        if (error) throw error;
        setMessage("Calendar event updated.");
      } else {
        const { error } = await client.from("school_calendar_events").insert({ ...payload, created_by: userId });
        if (error) throw error;
        setMessage(form.audience === "personal" ? "Personal calendar item added." : "School calendar event published.");
      }
      setComposerOpen(false);
      setEditingId(null);
      await loadEvents(organizationId, cursor);
    } catch (error) {
      console.error("Calendar save failed", error);
      setMessage(error instanceof Error ? error.message : "The calendar event could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event: CalendarEvent) {
    if (!organizationId || !canEdit(event) || !window.confirm(`Delete “${event.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("school_calendar_events").delete().eq("id", event.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSelectedEventId(null);
    setComposerOpen(false);
    setMessage("Calendar event deleted.");
    await loadEvents(organizationId, cursor);
  }

  if (loading) return <main className="calLoading">Opening the school calendar…</main>;

  return (
    <main className="calPage">
      <header className="calTopbar">
        <Link href="/school">← School</Link>
        <div><span>PHASE 44</span><strong>School Calendar</strong></div>
        <button onClick={() => openNew()}>+ Add calendar item</button>
      </header>

      <section className="calHero">
        <div>
          <span className="calEyebrow">ONE SHARED STAFF CALENDAR</span>
          <h1>Meetings, deadlines, CPD and school activity in one place.</h1>
          <p>See the calendar items relevant to your role, department and school, while keeping personal reminders private to your own account.</p>
        </div>
        <div className="calHeroCard">
          <strong>{upcoming.length}</strong><span>upcoming items loaded</span>
          <small>{STAFF_ROLE_LABELS[role]}{department ? ` · ${department}` : ""}</small>
        </div>
      </section>

      {message && <div className="calMessage" role="status">{message}</div>}

      <section className="calToolbar">
        <div className="calMonthNav">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">←</button>
          <button onClick={() => setCursor(monthStart(new Date()))}>Today</button>
          <h2>{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <button onClick={() => changeMonth(1)} aria-label="Next month">→</button>
        </div>
        <div className="calViewToggle">
          <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => setView("agenda")}>Agenda</button>
        </div>
        <div className="calFilters">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CalendarCategory | "all")}>
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
          </select>
          <select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value as CalendarAudience | "all")}>
            <option value="all">All visible audiences</option>
            {(Object.keys(AUDIENCE_LABELS) as CalendarAudience[]).map((audience) => <option key={audience} value={audience}>{AUDIENCE_LABELS[audience]}</option>)}
          </select>
        </div>
      </section>

      {view === "month" ? (
        <section className="calMonthLayout">
          <div className="calMonthCard">
            <div className="calWeekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calGrid">
              {grid.map((day) => {
                const key = localDateKey(day);
                const dayEvents = eventByDay.get(key) || [];
                const outside = day.getMonth() !== cursor.getMonth();
                const isToday = key === localDateKey();
                const selected = key === selectedDate;
                return <button key={key} className={`calDay ${outside ? "outside" : ""} ${isToday ? "today" : ""} ${selected ? "selected" : ""}`} onClick={() => { setSelectedDate(key); setSelectedEventId(null); }}>
                  <span className="calDayNumber">{day.getDate()}</span>
                  <span className="calDayEvents">{dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`calMiniEvent category-${event.category}`}><b>{event.all_day ? "All day" : prettyTime(event.starts_at)}</b>{event.title}</span>)}{dayEvents.length > 3 && <small>+{dayEvents.length - 3} more</small>}</span>
                </button>;
              })}
            </div>
          </div>

          <aside className="calDayPanel">
            <div className="calDayPanelHeading"><div><span>SELECTED DAY</span><h3>{prettyDate(`${selectedDate}T12:00:00`, true)}</h3></div><button onClick={() => openNew(selectedDate)}>+ Add</button></div>
            {selectedDayEvents.length ? <div className="calDayList">{selectedDayEvents.map((event) => <button key={event.id} onClick={() => setSelectedEventId(event.id)} className={selectedEventId === event.id ? "active" : ""}><span className={`calDot category-${event.category}`} /><div><strong>{event.title}</strong><small>{event.all_day ? "All day" : `${prettyTime(event.starts_at)}–${prettyTime(event.ends_at)}`} · {CATEGORY_LABELS[event.category]}</small></div></button>)}</div> : <div className="calEmpty"><strong>No calendar items</strong><p>Add a personal reminder or, if your role allows it, publish a school event.</p></div>}
          </aside>
        </section>
      ) : (
        <section className="calAgenda">
          {upcoming.length ? upcoming.map((event) => <article key={event.id} onClick={() => setSelectedEventId(event.id)}>
            <time><strong>{new Date(event.starts_at).getDate()}</strong><span>{new Date(event.starts_at).toLocaleDateString("en-GB", { month: "short" })}</span></time>
            <div><span className={`calTag category-${event.category}`}>{CATEGORY_LABELS[event.category]}</span><h3>{event.title}</h3><p>{event.all_day ? "All day" : `${prettyTime(event.starts_at)}–${prettyTime(event.ends_at)}`}{event.location ? ` · ${event.location}` : ""}</p><small>{AUDIENCE_LABELS[event.audience]}{event.target_department ? ` · ${event.target_department}` : ""}</small></div>
          </article>) : <div className="calEmpty"><strong>No upcoming calendar items</strong><p>Use “Add calendar item” to add your first reminder or school event.</p></div>}
        </section>
      )}

      {selectedEvent && <section className="calDetail">
        <div className="calDetailMain"><span className={`calTag category-${selectedEvent.category}`}>{CATEGORY_LABELS[selectedEvent.category]}</span><h2>{selectedEvent.title}</h2><p>{selectedEvent.description || "No additional notes."}</p><div className="calDetailMeta"><span>◷ {selectedEvent.all_day ? `${prettyDate(selectedEvent.starts_at, true)} · All day` : `${prettyDate(selectedEvent.starts_at, true)} · ${prettyTime(selectedEvent.starts_at)}–${prettyTime(selectedEvent.ends_at)}`}</span>{selectedEvent.location && <span>⌖ {selectedEvent.location}</span>}<span>◎ {AUDIENCE_LABELS[selectedEvent.audience]}{selectedEvent.target_department ? ` · ${selectedEvent.target_department}` : ""}</span></div></div>
        <div className="calDetailActions"><button onClick={() => downloadIcs(selectedEvent)}>Download .ics</button>{safeExternalUrl(selectedEvent.external_url) && <a href={safeExternalUrl(selectedEvent.external_url)!} target="_blank" rel="noreferrer">Open link</a>}{canEdit(selectedEvent) && <button onClick={() => openEdit(selectedEvent)}>Edit</button>}{canEdit(selectedEvent) && <button className="danger" onClick={() => deleteEvent(selectedEvent)}>Delete</button>}</div>
      </section>}

      {composerOpen && <div className="calModalBackdrop" onMouseDown={() => setComposerOpen(false)}>
        <section className="calModal" onMouseDown={(event) => event.stopPropagation()}>
          <div className="calModalHeading"><div><span>{editingId ? "EDIT CALENDAR ITEM" : "NEW CALENDAR ITEM"}</span><h2>{editingId ? "Update event" : "Add to calendar"}</h2></div><button onClick={() => setComposerOpen(false)}>×</button></div>
          <form onSubmit={saveEvent} className="calForm">
            <label className="wide"><span>Title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="e.g. Whole-school staff meeting" /></label>
            <label><span>Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as CalendarCategory })}>{CATEGORY_ORDER.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
            <label><span>Audience</span><select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as CalendarAudience })}>{availableAudiences.map((audience) => <option key={audience} value={audience}>{AUDIENCE_LABELS[audience]}</option>)}</select></label>
            {form.audience === "department" && <label className="wide"><span>Department</span><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required /></label>}
            <label><span>Start date</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value, endDate: form.endDate < event.target.value ? event.target.value : form.endDate })} required /></label>
            <label><span>End date</span><input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required /></label>
            {!form.allDay && <><label><span>Start time</span><input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required /></label><label><span>End time</span><input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required /></label></>}
            <label className="wide calCheck"><input type="checkbox" checked={form.allDay} onChange={(event) => setForm({ ...form, allDay: event.target.checked })} /><span>All-day event</span></label>
            <label className="wide"><span>Location <small>optional</small></span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Staff Room" /></label>
            <label className="wide"><span>Description <small>optional</small></span><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Agenda, reminders or useful context…" /></label>
            <label className="wide"><span>Useful link <small>optional, http/https only</small></span><input value={form.externalUrl} onChange={(event) => setForm({ ...form, externalUrl: event.target.value })} placeholder="https://…" /></label>
            <div className="calFormActions wide"><button type="button" onClick={() => setComposerOpen(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add to calendar"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
