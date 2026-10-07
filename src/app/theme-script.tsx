import { THEME_BOOTSTRAP } from "@/lib/theme";

/**
 * Sets `data-theme` before first paint.
 *
 * Inlined into the document head rather than run from an effect: an effect fires
 * after the browser has already painted, which means a dark-mode reader gets a
 * flash of the wrong theme on every load. It has to be a blocking inline script,
 * and it has to be dependency-free, which is why the source lives in
 * `src/lib/theme.ts` as a plain string.
 */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}