#!/usr/bin/env node
/**
 * Verifies the actual compiled artifact in dist/ — not src/ — imports
 * cleanly and exposes the expected public API. Unit tests import from src
 * via Vite/Vitest's own transform pipeline, which can't catch a build-only
 * regression (a broken tsup config, an export that got tree-shaken away, a
 * malformed exports map, a styles.css that never got the Tailwind pass).
 * Run after `npm run build`, before anything gets published.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const distIndex = path.join(root, "dist/index.js");
const distCjs = path.join(root, "dist/index.cjs");
const distTypes = path.join(root, "dist/index.d.ts");
const distCts = path.join(root, "dist/index.d.cts");
const distTheme = path.join(root, "dist/theme.js");
const distThemeCjs = path.join(root, "dist/theme.cjs");
const distStyles = path.join(root, "dist/styles.css");
const distFonts = path.join(root, "dist/fonts.css");
const distTailwindCss = path.join(root, "dist/tailwind.css");
const distPreset = path.join(root, "dist/tailwind-preset.js");

let failures = 0;
function check(label, fn) {
  try {
    const result = fn();
    if (result === false) throw new Error("assertion returned false");
    console.log(`  ✓ ${label}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${label}\n    ${err.message}`);
  }
}

console.log("Smoke-testing dist/ artifact...\n");

check("dist/index.js exists (ESM)", () => existsSync(distIndex));
check("dist/index.cjs exists (CJS)", () => existsSync(distCjs));
check("dist/index.d.ts exists", () => existsSync(distTypes));
check("dist/index.d.cts exists", () => existsSync(distCts));
check("dist/theme.js exists (server-safe entry)", () => existsSync(distTheme));
check("dist/theme.cjs exists", () => existsSync(distThemeCjs));
check("dist/theme.d.ts exists", () => existsSync(path.join(root, "dist/theme.d.ts")));
check("dist/styles.css exists", () => existsSync(distStyles));
check("dist/fonts.css exists", () => existsSync(distFonts));
check("dist/tailwind.css exists (Tailwind v4 @theme entry)", () => existsSync(distTailwindCss));
check("dist/tailwind-preset.js exists (Tailwind v3 preset entry)", () => existsSync(distPreset));
check("dist/tailwind-preset.cjs exists", () =>
  existsSync(path.join(root, "dist/tailwind-preset.cjs"))
);
check("dist/tailwind-preset.d.ts exists", () =>
  existsSync(path.join(root, "dist/tailwind-preset.d.ts"))
);

const mod = await import(path.resolve(distIndex));
const cjs = require(path.resolve(distCjs));
const theme = await import(path.resolve(distTheme));

check("CJS build exposes the same exports as ESM", () => {
  const esmKeys = Object.keys(mod).sort();
  const cjsKeys = Object.keys(cjs).sort();
  const missing = esmKeys.filter((k) => !cjsKeys.includes(k));
  if (missing.length) throw new Error(`CJS missing: ${missing.join(", ")}`);
  return true;
});

check('components entry is a "use client" module', () => {
  const head = readFileSync(distIndex, "utf8").slice(0, 200);
  if (!/^\s*["']use client["'];/.test(head))
    throw new Error("missing leading 'use client' directive");
  return true;
});
check('theme entry has NO "use client" directive', () => {
  const head = readFileSync(distTheme, "utf8").slice(0, 200);
  return !head.includes("use client");
});
check("theme entry exports the server-safe utilities", () => {
  return (
    typeof theme.applyForsTheme === "function" &&
    typeof theme.forsAntiFlashScript === "function" &&
    Array.isArray(theme.FORS_THEMES) &&
    typeof theme.FORS_PALETTES === "object" &&
    typeof theme.cn === "function"
  );
});
check("theme entry is NOT re-exported from the components entry", () => {
  return mod.applyForsTheme === undefined && mod.FORS_PALETTES === undefined;
});
check("forsAntiFlashScript() returns a non-empty string", () => {
  return typeof theme.forsAntiFlashScript() === "string" && theme.forsAntiFlashScript().length > 0;
});
check("FORS_THEMES contains dark and light", () => {
  return theme.FORS_THEMES.includes("dark") && theme.FORS_THEMES.includes("light");
});

const EXPECTED_COMPONENT_EXPORTS = [
  "Button",
  "Badge",
  "Input",
  "Textarea",
  "Card",
  "Alert",
  "Avatar",
  "AvatarGroup",
  "Tabs",
  "Heading",
  "Text",
  "Checkbox",
  "RadioGroup",
  "RadioGroupItem",
  "Switch",
  "ToggleGroup",
  "ToggleGroupItem",
  "Select",
  "Combobox",
  "Dialog",
  "AlertDialog",
  "Drawer",
  "DropdownMenu",
  "Tooltip",
  "Toaster",
  "Spinner",
  "Table",
  "Progress",
  "Popover",
  "Accordion",
  "Slider",
  "Skeleton",
  "Breadcrumb",
  "Pagination",
  "Separator",
  "Label",
  "Kbd",
  "EmptyState",
  "Collapsible",
  "Command",
  "CommandDialog",
  "Calendar",
  "DatePicker",
  "SidebarProvider",
  "Sidebar",
  "SidebarTrigger",
  "AppShell",
  "AppShellMain",
  // Data visualization
  "ChartFrame",
  "ChartLegend",
  "ChartTooltip",
  "LineChart",
  "BarChart",
  "BarList",
  "Sparkline",
  "DonutChart",
  "Heatmap",
  "Gauge",
  // Observability
  "StatCard",
  "Delta",
  "StatusDot",
  "UptimeBar",
  "LogStream",
  "Timeline",
  "TraceWaterfall",
  "TimeRange",
];

for (const name of EXPECTED_COMPONENT_EXPORTS) {
  check(`exports "${name}"`, () => mod[name] !== undefined);
}

check("exports cn helper", () => {
  const skip = false;
  return typeof mod.cn === "function" && mod.cn("a", skip && "b", "c") === "a c";
});

const css = readFileSync(distStyles, "utf8");
check(
  "styles.css was actually processed by Tailwind (no literal @tailwind directives left)",
  () => !css.includes("@tailwind")
);
check("styles.css contains compiled component styles", () => css.includes("--fors-accent"));
check("styles.css makes no network calls (no webfont @import)", () => !css.includes("@import"));
check("styles.css is non-trivial in size", () => statSync(distStyles).size > 1000);

const fontsCss = readFileSync(distFonts, "utf8");
check("fonts.css loads the brand faces from Google Fonts", () =>
  /@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=Inter/.test(fontsCss)
);

// The two Tailwind integration surfaces must expose the same token names —
// a color added to one and not the other would silently diverge per consumer.
const tailwindCss = readFileSync(distTailwindCss, "utf8");
const preset = (await import(path.resolve(distPreset))).default;
check("tailwind.css is a Tailwind v4 @theme block", () => /@theme inline\s*\{/.test(tailwindCss));
check("tailwind-preset default-exports a preset with theme.extend + plugins", () => {
  return typeof preset.theme?.extend?.colors === "object" && preset.plugins?.length === 1;
});
check("tailwind.css and tailwind-preset expose the same color utilities", () => {
  const flatten = (obj, prefix = "") =>
    Object.entries(obj).flatMap(([k, v]) =>
      typeof v === "object"
        ? flatten(v, `${prefix}${k}-`)
        : [k === "DEFAULT" ? prefix.slice(0, -1) : `${prefix}${k}`]
    );
  const presetColors = flatten(preset.theme.extend.colors).sort();
  const cssColors = [...tailwindCss.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]).sort();
  if (presetColors.join() !== cssColors.join())
    throw new Error(`preset: ${presetColors.join(",")}\n    css: ${cssColors.join(",")}`);
  return true;
});

console.log("");
if (failures > 0) {
  console.error(`${failures} smoke-test check(s) failed.`);
  process.exit(1);
}
console.log("All smoke-test checks passed.");
