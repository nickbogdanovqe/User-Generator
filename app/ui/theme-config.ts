// Framework-agnostic theme constants shared by the server root layout
// (inline bootstrap script) and the client theme store. Keep free of React
// and browser-only imports so it can be evaluated in a Server Component.

export const THEME_STORAGE_KEY = "user-generator.theme";

export const THEME_PREFERENCES = ["light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = ThemePreference;

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

/**
 * Inline bootstrap executed from `<head>` before first paint so the persisted
 * theme is applied without a flash. Mirrors the resolution logic in
 * `theme-store.ts`; must stay ES5-safe and self-contained because it is
 * serialized into the HTML. A stored "system" value falls back to dark.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(p!=="light"&&p!=="dark")p=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};var h=document.documentElement;h.setAttribute("data-theme",p);h.style.colorScheme=p}catch(e){}})();`;
