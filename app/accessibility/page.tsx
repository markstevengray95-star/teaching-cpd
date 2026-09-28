"use client";

import { useEffect, useState } from "react";
import { AccessibilityPreferences, defaultAccessibilityPreferences, readAccessibilityPreferences, saveAccessibilityPreferences } from "@/lib/accessibility";

export default function AccessibilityPage() {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences);
  const [saved, setSaved] = useState(false);
  const [speaking,setSpeaking]=useState(false);

  useEffect(() => setPrefs(readAccessibilityPreferences()), []);
  useEffect(()=>()=>{if(typeof window!=="undefined")window.speechSynthesis?.cancel();},[]);

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

  function readPage(){
    if(!("speechSynthesis" in window))return;
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}
    const main=document.querySelector("main");
    const text=(main?.textContent||"").replace(/\s+/g," ").trim().slice(0,12000);
    const utterance=new SpeechSynthesisUtterance(text); utterance.lang="en-GB"; utterance.rate=.95;
    utterance.onend=()=>setSpeaking(false); utterance.onerror=()=>setSpeaking(false);
    setSpeaking(true); window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  }

  return <main className="stagePage">
    <section className="stageHero"><span className="eyebrow">ACCESSIBILITY & LANGUAGE SUPPORT</span><h1>Adjust the CPD Hub to suit how you read and work.</h1><p>These interface preferences stay on this device. They do not store CPD records, reflections or personal-development data in the browser.</p><div className="stageHeroActions"><button className="primary" onClick={readPage}>{speaking?"Stop reading":"Read this page aloud"}</button><a className="secondary phaseLinkButton" href="/development">Development cycle</a></div></section>
    {saved && <div className="phaseNotice">Accessibility preference saved on this device.</div>}
    <section className="stageGrid">
      <div className="stageCard stageSpan7"><span className="eyebrow">DISPLAY & READING</span><h2>Interface preferences</h2><div className="accessibilityOptions">
        <label className="accessibilityOption"><div><strong>High contrast</strong><span>Increase separation between text, controls and backgrounds.</span></div><input type="checkbox" checked={prefs.highContrast} onChange={e => update("highContrast", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Larger text</strong><span>Increase the base text size without changing browser zoom.</span></div><input type="checkbox" checked={prefs.largeText} onChange={e => update("largeText", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Increase spacing</strong><span>Add more line and letter spacing for easier tracking.</span></div><input type="checkbox" checked={prefs.increasedSpacing} onChange={e => update("increasedSpacing", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Focused reading width</strong><span>Reduce long text lines on learning and information pages.</span></div><input type="checkbox" checked={prefs.readingWidth} onChange={e => update("readingWidth", e.target.checked)} /></label>
        <label className="accessibilityOption"><div><strong>Reduce motion</strong><span>Disable non-essential transitions and animated effects.</span></div><input type="checkbox" checked={prefs.reduceMotion} onChange={e => update("reduceMotion", e.target.checked)} /></label>
      </div><button className="secondary" onClick={reset}>Reset interface settings</button></div>
      <aside className="stageCard stageSpan5"><span className="eyebrow">BUILT-IN SUPPORT</span><h2>Access and language tools</h2><div className="stageList">
        <div className="stageRow"><div className="stageRowMain"><strong>Read aloud</strong><span>Uses the device/browser speech engine so staff can listen to page text as well as read it.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Browser translation friendly</strong><span>Pages use semantic HTML and a declared language so browser or operating-system translation tools can be used consistently. Automatic translation is not presented as an exact substitute for the original wording.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Keyboard navigation</strong><span>Visible focus states and a skip-to-content link are provided across the app.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>System preferences</strong><span>Reduced-motion and increased-contrast operating-system settings are respected automatically.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Offline awareness</strong><span>The app clearly warns when live/cloud features cannot save because the device is offline.</span></div></div>
      </div></aside>
    </section>
  </main>;
}
