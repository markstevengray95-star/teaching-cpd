"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { commonNavigationTools, isNavigationActive, navigationCategories, navigationCategoryTools, primaryNavigation, searchNavigationTools, visibleNavigationTools, type NavigationAccess, type NavigationCategoryId, type NavigationTool } from "@/lib/appNavigation";

export default function NavigationMenu({ access, pathname, search = "" }: { access: NavigationAccess; pathname: string; search?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<NavigationCategoryId | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const categoryHeading = useRef<HTMLHeadingElement>(null);
  const categoryButtons = useRef(new Map<NavigationCategoryId, HTMLButtonElement>());
  const previousCategory = useRef<NavigationCategoryId | null>(null);
  const primary = primaryNavigation(access);
  const available = useMemo(() => visibleNavigationTools(access), [access]);
  const results = useMemo(() => searchNavigationTools(available, query), [available, query]);
  const collections = useMemo(() => navigationCategories.map(category => navigationCategoryTools(available, category.id)).filter(item => item.members.length), [available]);
  const common = useMemo(() => commonNavigationTools(available), [available]);
  const selected = collections.find(item => item.category.id === categoryId);
  const searching = Boolean(query.trim());
  const current = available.filter(tool => isNavigationActive(pathname, search, tool.href)).sort((a,b) => b.href.length - a.href.length)[0];

  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      dialog.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  useEffect(() => { setOpen(false); }, [pathname, search]);
  useEffect(() => {
    if (open && !searching) {
      if (categoryId) categoryHeading.current?.focus();
      else if (previousCategory.current) categoryButtons.current.get(previousCategory.current)?.focus();
    }
    previousCategory.current = categoryId;
  }, [categoryId, open, searching]);

  function closeMenu() { setOpen(false); menuButton.current?.focus(); }
  function toolLinks(tools: NavigationTool[]) {
    return <div className="toolDirectoryLinks">{tools.map(tool => <a href={tool.href} key={tool.href} aria-current={isNavigationActive(pathname, search, tool.href) ? "page" : undefined}><strong>{tool.label}</strong><small>{tool.description}</small></a>)}</div>;
  }
  return <>
    <header className="appNavigation">
      <a href="/dashboard" className="appNavigationBrand" aria-label="Teaching CPD home"><span>TC</span><strong>Teaching CPD</strong></a>
      <nav className="appPrimaryNavigation" aria-label="Main navigation">
        {primary.map(item => <a key={item.label} href={item.href} aria-current={isNavigationActive(pathname, search, item.href) ? "page" : undefined}>{item.label}</a>)}
      </nav>
      <div className="appNavigationActions">
        <button ref={menuButton} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="app-tools-dialog" onClick={() => { previousCategory.current = null; setQuery(""); setCategoryId(null); setOpen(true); }}><span aria-hidden="true">☰</span> <span className="desktopMenuLabel">Tools</span><span className="mobileMenuLabel">Menu</span></button>
        <a className="appAccountLink" href="/?view=profile" aria-label="My account"><span aria-hidden="true">○</span><span>Account</span></a>
      </div>
    </header>
    {current && <div className="navigationBreadcrumb"><span>{current.group}</span><span aria-hidden="true">/</span><strong>{current.label}</strong></div>}
    <dialog ref={dialog} id="app-tools-dialog" className="toolDirectoryDialog" aria-labelledby="tools-dialog-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();closeMenu();}}} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className="toolDirectoryBody">
        <div className="toolDirectoryHeading"><div><h2 id="tools-dialog-title">What would you like to do?</h2><p>Start with an everyday task, or choose an area.</p></div><button type="button" onClick={closeMenu} aria-label="Close tools menu">✕</button></div>
        <nav className="toolDirectoryQuickLinks" aria-label="Main destinations">{primary.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}</nav>
        <label className="toolDirectorySearch">Find a tool<input type="search" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Try timetable, certificates or reporting…"/></label>
        {searching ? <>
          <div className="toolDirectorySearchStatus"><p className="toolDirectoryCount" role="status">{results.length} matching tools</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>
          {results.length ? toolLinks(results) : <div className="toolDirectoryEmpty"><h3>No matching tools</h3><p>Try a shorter phrase, such as “course”, “policy” or “coaching”.</p></div>}
        </> : selected ? <section className="toolDirectoryCategory" aria-labelledby="tool-category-title">
          <button type="button" className="toolDirectoryBack" onClick={() => setCategoryId(null)}>← All categories</button>
          <h3 ref={categoryHeading} id="tool-category-title" tabIndex={-1}>{selected.category.title}</h3>
          <p>{selected.category.description}</p>
          {selected.featured.length > 0 && <><h4>Start here</h4>{toolLinks(selected.featured)}</>}
          <div className="toolDirectoryGroups">{selected.category.groups.map(group => {
            const additional = selected.additional.filter(tool => tool.group === group);
            return additional.length ? <details key={categoryId + group}><summary>{selected.category.groups.length === 1 ? "More tools in this area" : group}<span>{additional.length}</span></summary>{toolLinks(additional)}</details> : null;
          })}</div>
        </section> : <>
          <section className="toolDirectoryCommon" aria-labelledby="everyday-tools-title"><h3 id="everyday-tools-title">Everyday shortcuts</h3>{toolLinks(common)}</section>
          <section aria-labelledby="tool-categories-title"><h3 id="tool-categories-title">Browse by task</h3><div className="toolCategoryGrid">{collections.map(({category}) => <button type="button" key={category.id} ref={node => { if (node) categoryButtons.current.set(category.id,node); else categoryButtons.current.delete(category.id); }} onClick={() => setCategoryId(category.id)}><strong>{category.title}<span aria-hidden="true"> →</span></strong><small>{category.description}</small></button>)}</div></section>
        </>}
      </div>
    </dialog>
  </>;
}
