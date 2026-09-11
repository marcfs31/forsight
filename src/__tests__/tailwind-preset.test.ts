import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import forsightPreset from "../tailwind-preset";

/**
 * The two Tailwind integrations shipped to consumers — the v3 preset
 * (src/tailwind-preset.ts) and the v4 @theme file (src/styles/tailwind.css)
 * — are hand-maintained mirrors of each other and of tokens.css. This pins
 * the invariants: every token either one references really exists, and both
 * expose the same utility vocabulary, so a consumer on either Tailwind major
 * gets identical class names.
 */
const styles = (file: string) => readFileSync(path.join(__dirname, "../styles", file), "utf8");
const tokensCss = styles("tokens.css");
const tailwindCss = styles("tailwind.css");

const varRefs = (text: string) =>
  [...text.matchAll(/var\((--forsight-[a-z0-9-]+)\)/g)].map((m) => m[1]);
const definedTokens = new Set(
  [...tokensCss.matchAll(/(--forsight-[a-z0-9-]+):/g)].map((m) => m[1])
);

/** Flattens Tailwind's nested color object into utility suffixes: `accent`, `accent-fg`, … */
function flattenColors(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flattenColors(value as Record<string, unknown>, `${prefix}${key}-`)
      : [key === "DEFAULT" ? prefix.slice(0, -1) : `${prefix}${key}`]
  );
}

const extend = forsightPreset.theme?.extend as Record<string, Record<string, unknown>>;

describe("tailwind-preset (v3) and tailwind.css (v4 @theme)", () => {
  it("only reference tokens that tokens.css defines", () => {
    const presetRefs = varRefs(JSON.stringify(extend));
    const cssRefs = varRefs(tailwindCss);
    expect(presetRefs.length).toBeGreaterThan(0);
    expect(cssRefs.length).toBeGreaterThan(0);
    for (const ref of [...presetRefs, ...cssRefs]) expect(definedTokens.has(ref), ref).toBe(true);
  });

  it("expose the same color utilities", () => {
    const presetColors = flattenColors(extend.colors).sort();
    const cssColors = [...tailwindCss.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]).sort();
    expect(cssColors).toEqual(presetColors);
  });

  it.each([
    ["fontFamily", "font"],
    ["borderRadius", "radius"],
    ["boxShadow", "shadow"],
    ["animation", "animate"],
  ])("expose the same %s utilities", (presetKey, cssNamespace) => {
    const presetKeys = Object.keys(extend[presetKey]).sort();
    const cssKeys = [...tailwindCss.matchAll(new RegExp(`--${cssNamespace}-([a-z0-9-]+):`, "g"))]
      .map((m) => m[1])
      .sort();
    expect(cssKeys).toEqual(presetKeys);
  });

  it("exposes duration-fast and duration-base (preset theme + v4 @utility)", () => {
    expect(Object.keys(extend.transitionDuration).sort()).toEqual(["base", "fast"]);
    expect(tailwindCss).toMatch(/@utility duration-fast\s*\{/);
    expect(tailwindCss).toMatch(/@utility duration-base\s*\{/);
  });

  it("ships the animate plugin the overlay motion classes come from", () => {
    expect(forsightPreset.plugins).toHaveLength(1);
  });
});
