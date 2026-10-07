/**
 * The theme bootstrap, shared by the pre-paint script and the toggle.
 *
 * It has to be a plain string: it runs before React hydrates, so it cannot come
 * from a component or a module with side effects.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "soroban-lint-theme";

/**
 * Decide the theme and stamp it on <html> before the browser paints.
 *
 * A stored choice wins; otherwise the OS preference applies. Wrapped in
 * try/catch because `localStorage` throws in private modes and sandboxed frames,
 * and a failure there must not take the page down.
 */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var e=document.documentElement;e.dataset.theme=t;e.style.colorScheme=t}catch(e){}})();`;

/**
 * The live theme, read from the `<html>` element the bootstrap script stamped.
 *
 * `<html data-theme>` is the source of truth, not React state: the value is set
 * before first paint and can also change from the OS preference when no stored
 * choice exists. Treating it as an external store is what lets the toggle and the
 * editor read it without a mount effect that sets state (which cascades a second
 * render and trips `react-hooks/set-state-in-effect`).
 */
export function readTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset["theme"] === "dark" ? "dark" : "light";
}

/** Subscribe to changes to the `<html>` theme attribute. */
export function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** Apply a theme to `<html>`; the toggle and the bootstrap script must agree. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset["theme"] = theme;
  document.documentElement.style.colorScheme = theme;
}