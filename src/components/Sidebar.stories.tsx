import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarNav,
  SidebarNavItem,
  AppShell,
  AppShellMain,
} from "./Sidebar";
import { Text } from "./Text";

const meta: Meta = {
  title: "Forsight/Navigation/Sidebar",
  parameters: {
    layout: "fullscreen",
    a11y: { options: { rules: { region: { enabled: true } } } },
  },
};
export default meta;
type Story = StoryObj;

const HOME_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 7L8 2l6 5v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const SETTINGS_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

function DemoNav() {
  return (
    <>
      <SidebarHeader>
        <Text weight="semibold">Forsight</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav>
          <SidebarNavItem href="#overview" icon={HOME_ICON} active>
            Overview
          </SidebarNavItem>
          <SidebarNavItem href="#settings" icon={SETTINGS_ICON}>
            Settings
          </SidebarNavItem>
        </SidebarNav>
      </SidebarContent>
      <SidebarFooter>
        <Text size="sm" tone="muted">
          v1.0
        </Text>
      </SidebarFooter>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <AppShell>
        <Sidebar label="Main navigation">
          <DemoNav />
        </Sidebar>
        <AppShellMain className="p-6">
          <SidebarTrigger />
          <Text className="mt-4">Page content goes here.</Text>
        </AppShellMain>
      </AppShell>
    </SidebarProvider>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <SidebarProvider defaultCollapsed>
      <AppShell>
        <Sidebar label="Main navigation">
          <DemoNav />
        </Sidebar>
        <AppShellMain className="p-6">
          <SidebarTrigger />
          <Text className="mt-4">Page content goes here.</Text>
        </AppShellMain>
      </AppShell>
    </SidebarProvider>
  ),
  play: async () => {
    // The collapsed rail keeps each nav item's full label as its accessible
    // name (sr-only, not display:none) — verified here since it's the one
    // risk a visual screenshot alone wouldn't catch.
    await expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
  },
};

/**
 * Real-browser interaction: the desktop `SidebarTrigger` toggles the
 * collapsed rail width.
 */
export const ToggleCollapse: Story = {
  render: () => (
    <SidebarProvider>
      <AppShell>
        <Sidebar label="Main navigation">
          <DemoNav />
        </Sidebar>
        <AppShellMain className="p-6">
          <SidebarTrigger />
        </AppShellMain>
      </AppShell>
    </SidebarProvider>
  ),
  play: async () => {
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toHaveClass("w-64");
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    await expect(nav).toHaveClass("w-16");
  },
};

/**
 * Real-browser interaction: the mobile `SidebarTrigger` opens the drawer,
 * which traps focus and closes on Escape, returning focus to the trigger.
 */
export const MobileDrawer: Story = {
  // The mobile trigger is `md:hidden` — real at a narrow viewport, correctly
  // absent from the accessibility tree at the default desktop size. Storybook's
  // viewport parameter resizes the real browser page before `play` runs, and
  // is reset for the next story automatically.
  parameters: {
    viewport: {
      options: { mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } } },
      defaultViewport: "mobile",
    },
  },
  render: () => (
    <SidebarProvider>
      <AppShell>
        <Sidebar label="Main navigation">
          <DemoNav />
        </Sidebar>
        <AppShellMain className="p-6">
          <SidebarTrigger />
        </AppShellMain>
      </AppShell>
    </SidebarProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open navigation" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Main navigation" });
    await expect(dialog).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

/** Full composition: a real page shell with a collapsible desktop sidebar and a mobile drawer. */
export const AppShellExample: Story = {
  render: () => (
    <SidebarProvider>
      <AppShell>
        <Sidebar label="Main navigation">
          <DemoNav />
        </Sidebar>
        <AppShellMain className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Text weight="semibold" size="lg">
              Dashboard
            </Text>
          </div>
          <Text tone="secondary">
            The sidebar collapses to an icon rail on desktop and becomes a slide-in drawer below the
            md breakpoint.
          </Text>
        </AppShellMain>
      </AppShell>
    </SidebarProvider>
  ),
};
