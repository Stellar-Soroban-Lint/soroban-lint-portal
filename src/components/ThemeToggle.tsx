"use client";

import { useSyncExternalStore } from "react";

import { applyTheme, readTheme, subscribeTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Light/dark toggle.
 *
 * The theme is already applied before first paint by `src/app/theme-script.tsx`;
 * this component reads it back as an external store rather than copying it into
 * state in a mount effect. The server snapshot is `light`, so the markup matches
 * on first render and settles to the real theme immediately afterwards.
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" satisfies Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      aria-pressed={theme === "dark"}
      onClick={() => {
        applyTheme(next);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // Blocked storage costs persistence, not function.
        }
      }}
      className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-raised"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
