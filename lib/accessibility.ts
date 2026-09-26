export type AccessibilityPreferences = {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
};

export const accessibilityPreferenceKey = "teaching-cpd-ui-preferences";
export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
};

export function applyAccessibilityPreferences(prefs: AccessibilityPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.cpdContrast = prefs.highContrast ? "high" : "standard";
  root.dataset.cpdText = prefs.largeText ? "large" : "standard";
  root.dataset.cpdMotion = prefs.reduceMotion ? "reduce" : "standard";
}

export function readAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") return defaultAccessibilityPreferences;
  try {
    const raw = window.localStorage.getItem(accessibilityPreferenceKey);
    return raw ? { ...defaultAccessibilityPreferences, ...JSON.parse(raw) } : defaultAccessibilityPreferences;
  } catch {
    return defaultAccessibilityPreferences;
  }
}

export function saveAccessibilityPreferences(prefs: AccessibilityPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(accessibilityPreferenceKey, JSON.stringify(prefs));
  applyAccessibilityPreferences(prefs);
}
