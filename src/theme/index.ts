/**
 * Theme-switching primitives. This package ships tokens for both themes but
 * does not own the consumer's <html> element and has no ThemeProvider —
 * each app decides its own persistence (localStorage, cookie, account
 * setting) and switcher UI, then calls these two functions.
 */

export const FORSIGHT_THEMES = ["dark", "light"] as const;
export type ForsightTheme = (typeof FORSIGHT_THEMES)[number];

/** Sets the `data-theme` attribute that every Forsight token resolves against. */
export function applyForsightTheme(
  theme: ForsightTheme,
  target: HTMLElement = document.documentElement
): void {
  target.setAttribute("data-theme", theme);
}

export interface ForsightAntiFlashOptions {
  /** localStorage key the consuming app stores its chosen theme under. */
  storageKey?: string;
  /** Valid theme values to accept from storage — defaults to both Forsight themes. */
  themes?: readonly string[];
}

/**
 * Returns an inline-script string to embed in the consumer's own root
 * layout `<head>`/`<html>` (e.g. a Next.js root layout), so the stored theme
 * applies before first paint and there's no flash of the wrong theme.
 * Mirrors the standard anti-flash-script pattern, exported here as a
 * parameterized utility instead of something every app hand-copies.
 */
export function forsightAntiFlashScript(opts: ForsightAntiFlashOptions = {}): string {
  const storageKey = opts.storageKey ?? "forsight-theme";
  const themes = opts.themes ?? FORSIGHT_THEMES;
  return `(function(){try{var t=localStorage.getItem(${scriptLiteral(storageKey)});var themes=${scriptLiteral(
    themes
  )};if(t&&themes.indexOf(t)!==-1){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
}

/**
 * Serializes a value as a JS literal that is safe to inline inside a
 * `<script>` element. `JSON.stringify` alone is not: a `<` in the value
 * could form `</script>` and end the element early, and U+2028/U+2029 are
 * line terminators in older JS engines. Escaping them keeps the literal
 * valid JSON *and* inert HTML.
 */
function scriptLiteral(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
