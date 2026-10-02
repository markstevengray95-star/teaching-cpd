"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isNavigationActive, primaryNavigation, searchNavigationTools, visibleNavigationTools, type NavigationAccess } from "@/lib/appNavigation";

export default function NavigationMenu({ access, pathname, search = "" }: { access: NavigationAccess; pathname: string; search?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const primary = primaryNavigation(access);
  const available = useMemo(() => visibleNavigationTools(access), [access]);
  const results = useMemo(() => searchNavigationTools(available, query), [available, query]);
  const groups = [...new Set(results.map(tool => tool.group))];
  const current = available.filter(tool => isNavigationActive(pathname, search, tool.href)).sort((a,b) => b.href.length - a.href.length)[0];

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  useEffect(() => { setOpen(false); }, [pathname, search]);

  function closeMenu() { setOpen(false); menuButton.current?.focus(); }
  return <>
    <header className="appNavigation">
      <a href="/dashboard" className="appNavigationBrand" aria-label="Teaching CPD home"><span>TC</span><strong>Teaching CPD</strong></a>
      <nav className="appPrimaryNavigation" aria-label="Main navigation">
        {primary.map(item => <a key={item.label} href={item.href} aria-current={isNavigationActive(pathname, search, item.href) ? "page" : undefined}>{item.label}</a>)}
      </nav>
      <div className="appNavigationActions">
        <button ref={menuButton} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="app-tools-dialog" onClick={() => { setQuery(""); setOpen(true); }}><span aria-hidden="true">☰</span> <span className="desktopMenuLabel">All tools</span><span className="mobileMenuLabel">Menu</span></button>
        <a className="appAccountLink" href="/?view=profile" aria-label="My account"><span aria-hidden="true">○</span><span>Account</span></a>
      </div>
    </header>
    {current && <div className="navigationBreadcrumb"><span>{current.group}</span><span aria-hidden="true">/</span><strong>{current.label}</strong></div>}
    <dialog ref={dialog} id="app-tools-dialog" className="toolDirectoryDialog" aria-labelledby="tools-dialog-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className="toolDirectoryBody">
        <div className="toolDirectoryHeading"><div><h2 id="tools-dialog-title">Find your next task</h2><p>Every tool in one place. Search or choose a category.</p></div><button type="button" onClick={closeMenu} aria-label="Close tools menu">✕</button></div>
        <nav className="toolDirectoryQuickLinks" aria-label="Main destinations">{primary.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}</nav>
        <label className="toolDirectorySearch">Find a tool<input type="search" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Try certificates, safeguarding or reporting…"/></label>
        <p className="toolDirectoryCount" role="status">{query.trim() ? `${results.length} matching tools` : "Choose a category below"}</p>
        <div className="toolDirectoryGroups">{groups.map(group => <details key={group + Boolean(query.trim())} open={query.trim() ? true : undefined}><summary>{group}<span>{results.filter(tool => tool.group === group).length}</span></summary><div className="toolDirectoryLinks">{results.filter(tool => tool.group === group).map(tool => <a href={tool.href} key={tool.href} aria-current={isNavigationActive(pathname, search, tool.href) ? "page" : undefined}><strong>{tool.label}</strong><small>{tool.description}</small></a>)}</div></details>)}</div>
        {!results.length && <div className="toolDirectoryEmpty"><h3>No matching tools</h3><p>Try a shorter phrase, such as “course”, “policy” or “coaching”.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
      </div>
    </dialog>
  </>;
}
