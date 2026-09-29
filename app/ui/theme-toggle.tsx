"use client";

import type { ReactNode } from "react";
import { MoonIcon, SunIcon } from "@/app/ui/icons";
import { THEME_PREFERENCES, type ThemePreference } from "@/app/ui/theme-config";
import { useThemePreference } from "@/app/ui/theme-store";

const OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon className="h-3.5 w-3.5" /> },
  { value: "dark", label: "Dark", icon: <MoonIcon className="h-3.5 w-3.5" /> },
];

function nextPreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
}

/**
 * Appearance switcher. Full variant is a labelled segmented control; the
 * compact variant is a single icon button that switches between Light and Dark.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useThemePreference();
  const active = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[1];

  if (compact) {
    const next = OPTIONS.find((o) => o.value === nextPreference(preference)) ?? OPTIONS[0];
    return (
      <button
        type="button"
        className="btn-icon"
        onClick={() => setPreference(next.value)}
        aria-label={`Appearance: ${active.label}. Switch to ${next.label}`}
        title={`Appearance: ${active.label}`}
      >
        {active.icon}
      </button>
    );
  }

  return (
    <div className="seg seg-fill" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected}
            className="seg-btn"
            onClick={() => setPreference(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
