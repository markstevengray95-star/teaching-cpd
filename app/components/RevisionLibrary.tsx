"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { literatureBooks, scienceBooks, type LiteratureBook } from "../../lib/revisionLibrary";
import { parseRevisionBook, type RevisionTextSection } from "../../lib/revisionText";

type Section = RevisionTextSection;
type ReaderView = "text" | "characters" | "themes" | "quotes" | "exam" | "quiz" | "sources";

function storageKey(bookId: string, kind: string) {
  return `revision-library:${bookId}:${kind}`;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

function highlightedText(text: string, terms: string[]) {
  const cleaned = terms.map(term => term.trim()).filter(term => term.length > 1).slice(0, 20);
  if (!cleaned.length) return text;
  const pattern = new RegExp(`(${cleaned.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const lowered = new Set(cleaned.map(term => term.toLocaleLowerCase()));
  return text.split(pattern).map((part, index) => lowered.has(part.toLocaleLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : part);
}

function ScienceLibrary() {
  const [subject, setSubject] = useState("All");
  const visible = subject === "All" ? scienceBooks : scienceBooks.filter(book => book.subject === subject);
  return <div className="revisionScience">
    <div className="revisionSectionHead">
      <div><span className="revisionKicker">OPEN SCIENCE SHELF</span><h2>Full textbooks, mapped for UK revision</h2><p>These modern books are openly licensed rather than public-domain. They stay on the official OpenStax site so licence updates, corrections and accessibility formats remain authoritative.</p></div>
      <div className="revisionPills">{["All", "Biology", "Chemistry", "Physics"].map(item => <button className={subject === item ? "active" : ""} key={item} onClick={() => setSubject(item)}>{item}</button>)}</div>
    </div>
    <aside className="revisionNotice"><strong>Why not an old public-domain science book?</strong><span>Science changes. A genuinely public-domain textbook is normally too old for safe modern GCSE or A-level study. These complete, professionally reviewed OpenStax books are the responsible alternative, with the exact licence shown before students open them.</span></aside>
    <div className="scienceBookGrid">{visible.map(book => <article className="scienceBook" key={book.id}>
      <header><span>{book.subject}</span><small>{book.level}</small></header>
      <h3>{book.title}</h3><p>{book.description}</p>
      <div className="scienceActions"><a className="revisionPrimary" href={book.bookUrl} target="_blank" rel="noreferrer">Open full textbook ↗</a><a href={book.prefaceUrl} target="_blank" rel="noreferrer">Licence &amp; preface</a></div>
      <div className="scienceMap"><strong>GCSE → A-level exam map</strong>{book.maps.map(map => <a href={map.url} target="_blank" rel="noreferrer" key={map.gcse}><span>{map.gcse}</span><b>{map.aLevel}</b><small>{map.chapters} ↗</small></a>)}</div>
      <footer><strong>{book.licence}</strong><span>{book.licenceNote}</span></footer>
    </article>)}</div>
  </div>;
}

function LibraryHome({ onOpen }: { onOpen: (book: LiteratureBook) => void }) {
  return <div className="revisionHome">
    <section className="revisionHero">
      <div><span className="revisionKicker">STUDENT REVISION LIBRARY</span><h1>Read the text. Build the argument. Test what sticks.</h1><p>Complete lawful texts, exam-focused study maps and private study tools that remain on this device.</p><div className="revisionHeroStats"><span><b>3</b> complete public-domain texts</span><span><b>4</b> literature study guides</span><span><b>3</b> open science textbooks</span></div></div>
      <div className="revisionHeroCard"><span>Start here</span><strong>Macbeth: Act 1, Scene 3</strong><p>Track the prophecy through ambition, equivocation and choice.</p><button onClick={() => onOpen(literatureBooks[0])}>Open connected reader →</button></div>
    </section>
    <section className="revisionShelf"><div className="revisionSectionHead"><div><span className="revisionKicker">ENGLISH LITERATURE</span><h2>Texts and study companions</h2><p>Search every bundled line, move by act or stave, and connect evidence to interpretation.</p></div></div>
      <div className="literatureGrid">{literatureBooks.map(book => <button className="literatureCard" style={{ "--book": book.accent } as React.CSSProperties} onClick={() => onOpen(book)} key={book.id}>
        <span>{book.textPath ? "COMPLETE TEXT" : "COPYRIGHT-SAFE GUIDE"}</span><h3>{book.title}</h3><p>{book.author}</p><small>{book.description}</small><b>{book.textPath ? "Read and revise →" : "Open study guide →"}</b>
      </button>)}</div>
    </section>
    <ScienceLibrary />
  </div>;
}

function Quiz({ book }: { book: LiteratureBook }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = Object.entries(answers).filter(([key, value]) => book.quiz[Number(key)]?.answer === value).length;
  return <div className="revisionQuiz"><div className="quizScore"><span>Retrieval check</span><strong>{Object.keys(answers).length === book.quiz.length ? `${score}/${book.quiz.length}` : `${Object.keys(answers).length}/${book.quiz.length} answered`}</strong><button onClick={() => setAnswers({})}>Reset</button></div>
    {book.quiz.map((item, index) => <article key={item.question}><span>Question {index + 1}</span><h3>{item.question}</h3><div>{item.options.map((option, optionIndex) => <button className={answers[index] === optionIndex ? optionIndex === item.answer ? "correct" : "incorrect" : ""} onClick={() => setAnswers(current => ({ ...current, [index]: optionIndex }))} key={option}>{option}</button>)}</div>{answers[index] !== undefined && <p>{answers[index] === item.answer ? "Correct. " : "Not quite. "}{item.explanation}</p>}</article>)}
  </div>;
}

function StudyPanel({ book, view }: { book: LiteratureBook; view: ReaderView }) {
  if (view === "characters") return <div className="profileGrid">{book.characters.map(character => <article key={character.name}><span>{character.role}</span><h3>{character.name}</h3><p>{character.arc}</p><div className="evidenceList">{character.evidence.map(item => <q key={item}>{item}</q>)}</div><footer>{character.links.map(link => <b key={link}>{link}</b>)}</footer></article>)}</div>;
  if (view === "themes") return <div className="themeGrid">{book.themes.map(theme => <article key={theme.name}><span>THEME</span><h3>{theme.name}</h3><p>{theme.summary}</p><ul>{theme.moments.map(moment => <li key={moment}>{moment}</li>)}</ul></article>)}</div>;
  if (view === "quotes") return <div className="quoteGrid">{book.quotations.map(quote => <article key={quote.text}><q>{quote.text}</q><div><strong>{quote.speaker}</strong><span>{quote.location}</span></div><p>{quote.analysis}</p></article>)}</div>;
  if (view === "exam") return <div className="examPanel"><div><span className="revisionKicker">EXAM PRACTICE</span><h2>Plan from argument, not a quotation list</h2><p>For each question: write a one-sentence thesis, choose three moments from across the text, then connect method, meaning and the whole-text arc.</p></div>{book.examQuestions.map((question, index) => <article key={question}><span>0{index + 1}</span><p>{question}</p><textarea aria-label={`Plan for question ${index + 1}`} placeholder="Thesis → three moments → method → whole-text link…" /></article>)}</div>;
  if (view === "sources") return <div className="sourcePanel"><article><span>TEXT SOURCE</span><h3>{book.sourceUrl.includes("gutenberg") ? "Project Gutenberg" : "Copyright-safe study guide"}</h3><p>{book.rights}</p><a href={book.sourceUrl} target="_blank" rel="noreferrer">Open authoritative source ↗</a></article><article><span>CITATION MODEL</span><h3>{book.author}, <em>{book.title}</em></h3><p>When using evidence, cite the act and scene or stave shown beside the text. Project Gutenberg source details are retained in the bundled files.</p></article></div>;
  return <Quiz book={book} />;
}

function Reader({ book, onBack }: { book: LiteratureBook; onBack: () => void }) {
  const [view, setView] = useState<ReaderView>(book.textPath ? "text" : "characters");
  const [sections, setSections] = useState<Section[]>(() => book.studySections?.map((section, index) => ({ id: `${book.id}-act-${index + 1}`, group: `Act ${index + 1}`, title: section.title, content: `${section.summary}\n\nKey moments\n${section.keyMoments.map(item => `• ${item}`).join("\n")}` })) || []);
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(Boolean(book.textPath));
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState("");
  const [notice, setNotice] = useState("");
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBookmarks(safeRead(storageKey(book.id, "bookmarks"), []));
    setHighlights(safeRead(storageKey(book.id, "highlights"), []));
    setNotes(safeRead(storageKey(book.id, "notes"), {}));
    if (!book.textPath) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(book.textPath, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error(`Text could not be loaded (${response.status}).`);
      return response.text();
    }).then(raw => {
      const parsed = parseRevisionBook(raw, book.id);
      setSections(parsed);
      setActiveId(parsed[0]?.id || "");
      setError("");
    }).catch(reason => {
      if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [book.id, book.textPath]);

  const active = sections.find(section => section.id === activeId) || sections[0];
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return sections;
    return sections.filter(section => `${section.group} ${section.title} ${section.content}`.toLocaleLowerCase().includes(needle));
  }, [query, sections]);

  function persistBookmarks(next: string[]) { setBookmarks(next); window.localStorage.setItem(storageKey(book.id, "bookmarks"), JSON.stringify(next)); }
  function persistHighlights(next: string[]) { setHighlights(next); window.localStorage.setItem(storageKey(book.id, "highlights"), JSON.stringify(next)); }
  function saveNote(value: string) { const next = { ...notes, [active?.id || "general"]: value }; setNotes(next); window.localStorage.setItem(storageKey(book.id, "notes"), JSON.stringify(next)); }
  function addHighlight() {
    if (!selection || highlights.includes(selection)) return;
    persistHighlights([...highlights, selection]);
    setNotice("Highlight saved on this device.");
  }
  function copyCitation() {
    if (!active) return;
    const location = `${active.group}, ${active.title}`;
    navigator.clipboard.writeText(`${book.author}. ${book.title}. ${location}. Source: ${book.sourceUrl}`).then(() => setNotice("Citation copied."));
  }
  const groups = [...new Set(matches.map(section => section.group))];
  const paragraphs = active?.content.split(/\n{2,}/).map(item => item.trim()).filter(Boolean) || [];
  const navItems: { id: ReaderView; label: string }[] = [
    ...(book.textPath || book.studySections ? [{ id: "text" as ReaderView, label: book.textPath ? "Full text" : "Act guide" }] : []),
    { id: "characters", label: "Characters" }, { id: "themes", label: "Themes" }, { id: "quotes", label: "Key quotations" }, { id: "exam", label: "Exam practice" }, { id: "quiz", label: "Quiz" }, { id: "sources", label: "Sources" },
  ];

  return <div className="revisionReader" style={{ "--book": book.accent } as React.CSSProperties}>
    <header className="readerHeader"><button className="readerBack" onClick={onBack}>← Library</button><div><span>{book.level}</span><h1>{book.title}</h1><p>{book.author}</p></div><div className="readerRights">{book.textPath ? "✓ Complete public-domain text" : "Study guide only — full text protected"}</div></header>
    <nav className="readerTabs" aria-label="Study views">{navItems.map(item => <button className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} key={item.id}>{item.label}</button>)}</nav>
    {view === "text" ? <div className="readerLayout">
      <aside className="chapterRail"><label><span>Search this book</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Character, quotation, idea…" /></label><div className="matchCount">{query ? `${matches.length} sections found` : book.structureLabel}</div>
        <div className="chapterList">{groups.map(group => <section key={group}><h3>{group}</h3>{matches.filter(section => section.group === group).map(section => <button className={`${active?.id === section.id ? "active" : ""} ${bookmarks.includes(section.id) ? "bookmarked" : ""}`} onClick={() => { setActiveId(section.id); setQuery(""); }} key={section.id}><span>{section.title}</span>{bookmarks.includes(section.id) && <b>★</b>}</button>)}</section>)}</div>
      </aside>
      <main className="textWorkspace">
        {loading ? <div className="readerState">Loading the complete text…</div> : error ? <div className="readerState error">{error}</div> : active ? <>
          <div className="textToolbar"><div><span>{active.group}</span><h2>{active.title}</h2></div><div><button onClick={() => persistBookmarks(bookmarks.includes(active.id) ? bookmarks.filter(id => id !== active.id) : [...bookmarks, active.id])}>{bookmarks.includes(active.id) ? "★ Bookmarked" : "☆ Bookmark"}</button><button onClick={copyCitation}>Cite section</button></div></div>
          <div className="readingPane" ref={readerRef} onMouseUp={() => { const selected = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || ""; setSelection(selected.length >= 2 && selected.length <= 240 ? selected : ""); }}>{paragraphs.map((paragraph, index) => <p className={/^\[.*\]$/.test(paragraph) ? "stageDirection" : ""} key={index}>{highlightedText(paragraph, [...highlights, ...(query ? [query] : [])])}</p>)}</div>
          {selection && <div className="selectionBar"><span>“{selection.slice(0, 90)}{selection.length > 90 ? "…" : "”"}</span><button onClick={addHighlight}>Highlight selection</button><button onClick={() => setSelection("")}>Dismiss</button></div>}
          <div className="studyDesk"><div><span>MY NOTES · {active.group}</span><textarea value={notes[active.id] || ""} onChange={event => saveNote(event.target.value)} placeholder="Track a pattern, draft a thesis, connect this moment to elsewhere…" /></div><div><span>SAVED HIGHLIGHTS</span>{highlights.length ? highlights.map(item => <button title="Remove highlight" onClick={() => persistHighlights(highlights.filter(saved => saved !== item))} key={item}>“{item}” <b>×</b></button>) : <p>Select words in the text, then choose “Highlight selection”.</p>}</div></div>
        </> : <div className="readerState">No section selected.</div>}
      </main>
    </div> : <div className="studyWorkspace"><StudyPanel book={book} view={view} /></div>}
    {notice && <button className="revisionToast" onClick={() => setNotice("")}>{notice} ×</button>}
  </div>;
}

export default function RevisionLibrary() {
  const [book, setBook] = useState<LiteratureBook | null>(null);
  return <main className="revisionApp">{book ? <Reader key={book.id} book={book} onBack={() => setBook(null)} /> : <LibraryHome onOpen={setBook} />}</main>;
}
