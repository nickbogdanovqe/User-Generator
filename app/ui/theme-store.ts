"use client";

import { useSyncExternalStore } from "react";
import {
  DARK_SCHEME_QUERY,
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  isThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/app/ui/theme-config";

const TRANSITION_ATTR = "data-theme-transition";
const TRANSITION_MS = 260;

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return systemTheme();
  return preference;
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

/* ------------------------------------------------------------------ */
/* External store                                                      */
/* ------------------------------------------------------------------ */
const listeners = new Set<() => void>();
let preference: ThemePreference | null = null;
let transitionTimer: number | undefined;

function getPreference(): ThemePreference {
  if (preference === null) preference = readStoredPreference();
  return preference;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function sync(): void {
  applyResolvedTheme(resolveTheme(getPreference()));
  emit();
}

function startTransition(): void {
  const root = document.documentElement;
  root.setAttribute(TRANSITION_ATTR, "");
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    root.removeAttribute(TRANSITION_ATTR);
  }, TRANSITION_MS);
}

export function setThemePreference(next: ThemePreference): void {
  if (next === getPreference()) return;
  preference = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage may be unavailable (private mode, disabled); the in-memory
    // preference still drives this session.
  }
  startTransition();
  sync();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const media = window.matchMedia(DARK_SCHEME_QUERY);
  const onMediaChange = () => {
    if (getPreference() === "system") {
      startTransition();
      sync();
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    preference = isThemePreference(event.newValue)
      ? event.newValue
      : DEFAULT_THEME_PREFERENCE;
    startTransition();
    sync();
  };

  media.addEventListener("change", onMediaChange);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onMediaChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE;
}

export function useThemePreference(): {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
} {
  const current = useSyncExternalStore(subscribe, getPreference, getServerSnapshot);
  return { preference: current, setPreference: setThemePreference };
}
