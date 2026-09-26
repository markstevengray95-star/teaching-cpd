"use client";

import { useEffect, useState } from "react";
import { applyAccessibilityPreferences, readAccessibilityPreferences } from "@/lib/accessibility";

export default function AppShellEnhancements() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    applyAccessibilityPreferences(readAccessibilityPreferences());
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    {!online && <div className="offlineBanner" role="status" aria-live="polite">You are offline. Live sessions and cloud saves are paused until your connection returns.</div>}
  </>;
}
