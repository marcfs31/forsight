import React, { useEffect, useState } from "react";
import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import { addons } from "storybook/internal/preview-api";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { forsightDark, forsightLight } from "./theme";

/**
 * Docs pages follow the Theme toolbar. Storybook's stock DocsContainer takes
 * a fixed `theme`; this one reads the `theme` global for its initial value
 * and re-renders when the toolbar changes it, so the page around the story
 * blocks switches with the components inside them.
 */
function readThemeGlobal(context: DocsContainerProps["context"]): string | undefined {
  try {
    return context.getStoryContext(context.storyById()).globals.theme as string | undefined;
  } catch {
    return undefined; // docs entry with no attached story (none today)
  }
}

export function ForsDocsContainer({ context, children }: DocsContainerProps) {
  const [theme, setTheme] = useState(() => readThemeGlobal(context) ?? "dark");

  useEffect(() => {
    const channel = addons.getChannel();
    const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => {
      if (typeof globals.theme === "string") setTheme(globals.theme);
    };
    channel.on(GLOBALS_UPDATED, onGlobals);
    return () => channel.off(GLOBALS_UPDATED, onGlobals);
  }, []);

  return (
    <DocsContainer context={context} theme={theme === "light" ? forsightLight : forsightDark}>
      {children}
    </DocsContainer>
  );
}
