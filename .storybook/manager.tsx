import React from "react";
import { addons, types, useGlobals, useStorybookApi } from "storybook/internal/manager-api";
import { IconButton } from "storybook/internal/components";
import { ArrowLeftIcon, ArrowRightIcon, MoonIcon, SunIcon } from "@storybook/icons";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { forsightDark, forsightLight } from "./theme";

/**
 * One `theme` global drives everything: the stories (data-theme, set in
 * preview.ts), the Docs pages (DocsContainer.tsx), and — here — Storybook's
 * own manager UI (sidebar + toolbar). This manager addon replaces the stock
 * toolbar dropdowns with single toggle buttons (theme, text direction) and
 * re-themes the manager whenever the theme global changes, from any source
 * (the button, the URL's `globals=theme:light`, or a story's own globals).
 */
const ADDON_ID = "forsight/theme";

function themeFor(globals: Record<string, unknown>) {
  return globals.theme === "light" ? forsightLight : forsightDark;
}

function ThemeToggle() {
  const api = useStorybookApi();
  const [globals, updateGlobals] = useGlobals();
  const isDark = globals.theme !== "light";
  const next = isDark ? "light" : "dark";
  const toggle = () => {
    // Re-theme the manager now rather than after the preview round-trips the
    // new global back (GLOBALS_UPDATED) — otherwise the sidebar visibly lags
    // the canvas. The listener below still covers every other source.
    api.setOptions({ theme: themeFor({ theme: next }) });
    updateGlobals({ theme: next });
  };
  return (
    <IconButton
      key={ADDON_ID}
      title={`Switch to ${next} theme`}
      aria-label={`Switch to ${next} theme`}
      aria-pressed={!isDark}
      onClick={toggle}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}

function DirectionToggle() {
  const [globals, updateGlobals] = useGlobals();
  const isRtl = globals.dir === "rtl";
  const next = isRtl ? "ltr" : "rtl";
  return (
    <IconButton
      key={`${ADDON_ID}/dir`}
      title={`Switch to ${next.toUpperCase()} text direction`}
      aria-label={`Switch to ${next.toUpperCase()} text direction`}
      aria-pressed={isRtl}
      onClick={() => updateGlobals({ dir: next })}
    >
      {isRtl ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      {isRtl ? "RTL" : "LTR"}
    </IconButton>
  );
}

const inCanvasOrDocs = ({ viewMode, tabId }: { viewMode?: string; tabId?: string }) =>
  !tabId && !!viewMode?.match(/^(story|docs)$/);

addons.register(ADDON_ID, (api) => {
  const apply = ({ globals }: { globals: Record<string, unknown> }) =>
    api.setOptions({ theme: themeFor(globals) });
  api.on(SET_GLOBALS, apply); // preview booted (initial globals, incl. from the URL)
  api.on(GLOBALS_UPDATED, apply); // any later change

  addons.add(`${ADDON_ID}/toggle`, {
    type: types.TOOL,
    title: "Theme",
    match: inCanvasOrDocs,
    render: ThemeToggle,
  });
  addons.add(`${ADDON_ID}/dir`, {
    type: types.TOOL,
    title: "Text direction",
    match: inCanvasOrDocs,
    render: DirectionToggle,
  });
});

// Before the preview reports its globals, paint the brand default.
addons.setConfig({ theme: forsightDark });
