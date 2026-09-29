"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
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

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference;
}

function readAppliedTheme(): string | null {
  return document.documentElement.getAttribute("data-theme");
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== resolved) {
    root.setAttribute("data-theme", resolved);
  }
  if (root.style.colorScheme !== resolved) {
    root.style.colorScheme = resolved;
  }
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
  const changed = next !== getPreference();
  const domOutOfSync = readAppliedTheme() !== resolveTheme(next);
  // Always re-apply to the DOM: if something (a client re-render of the root,
  // an extension, a skipped bootstrap) reset the attribute, re-selecting the
  // already-active option must still bring the page back in line.
  if (!changed && !domOutOfSync) return;

  preference = next;
  if (changed) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode, disabled); the in-memory
      // preference still drives this session.
    }
  }
  startTransition();
  sync();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    preference = isThemePreference(event.newValue)
      ? event.newValue
      : DEFAULT_THEME_PREFERENCE;
    startTransition();
    sync();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
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

  // Keep the document attribute aligned with whatever the selector displays.
  // Runs after hydration (server snapshot -> stored preference) and after
  // every preference change, so the two can never drift apart.
  useEffect(() => {
    applyResolvedTheme(resolveTheme(current));
  }, [current]);

  return { preference: current, setPreference: setThemePreference };
}
