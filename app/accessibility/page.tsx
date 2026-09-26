"use client";

import { useEffect, useState } from "react";
import { AccessibilityPreferences, defaultAccessibilityPreferences, readAccessibilityPreferences, saveAccessibilityPreferences } from "@/lib/accessibility";

export default function AccessibilityPage() {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => setPrefs(readAccessibilityPreferences()), []);

  function update<K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveAccessibilityPreferences(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  function reset() {
    setPrefs(defaultAccessibilityPreferences);
    saveAccessibilityPreferences(defaultAccessibilityPreferences);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">STAGE 11 · ACCESSIBILITY & RESILIENCE</span><h1>Adjust the CPD Hub to suit how you work.</h1><p>These settings affect only the interface on this device. They do not store CPD records, reflections or personal development data in the browser.</p></section>
    {saved && <div className="phaseNotice">Accessibility preference saved on this device.</div>}
    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">DISPLAY</span><h2>Interface preferences</h2><div className="accessibilityOptions">
        <label className="accessibilityOption"><div><strong>High contrast</strong><span>Increase separation between text, controls and backgrounds.</span></div><input type="checkbox" checked={prefs.highContrast} onChange={e => update("highContrast", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Larger text</strong><span>Increase the base text size without changing browser zoom.</span></div><input type="checkbox" checked={prefs.largeText} onChange={e => update("largeText", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Reduce motion</strong><span>Disable non-essential transitions and animated effects.</span></div><input type="checkbox" checked={prefs.reduceMotion} onChange={e => update("reduceMotion", e.target.checked)} /></label>
      </div><button className="secondary" onClick={reset}>Reset interface settings</button></div>
      <aside className="stageCard stageSpan5"><span className="eyebrow">BUILT-IN SUPPORT</span><h2>Accessibility defaults</h2><div className="stageList">
        <div className="stageRow"><div className="stageRowMain"><strong>Keyboard navigation</strong><span>Visible focus states and a skip-to-content link are provided across the app.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>System preferences</strong><span>Reduced-motion and increased-contrast operating-system settings are respected automatically.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Offline awareness</strong><span>The app clearly warns when live/cloud features cannot save because the device is offline.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Installable PWA</strong><span>The CPD Hub includes a web-app manifest and service worker for app-style installation and resilient loading.</span></div></div>
      </div></aside>
    </section>
  </main>;
}
