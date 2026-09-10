import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // `@storybook/addon-essentials` was dissolved in v9: controls, actions,
  // viewport, backgrounds, toolbars and measure/outline moved into the
  // `storybook` core package, while docs went back to being its own addon.
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
