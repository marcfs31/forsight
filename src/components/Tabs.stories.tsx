import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Tabs } from "./Tabs";

const meta: Meta = {
  title: "Forsight/Data Display/Tabs",
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs.Root defaultValue="overview" className="w-96">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="overview">Project health, deploy status, and recent commits.</Tabs.Panel>
      <Tabs.Panel value="activity">
        A chronological feed of team activity on this project.
      </Tabs.Panel>
      <Tabs.Panel value="settings">Environment variables, domains, and integrations.</Tabs.Panel>
    </Tabs.Root>
  ),
};

export const TwoTabs: Story = {
  render: () => (
    <Tabs.Root defaultValue="monthly" className="w-72">
      <Tabs.List>
        <Tabs.Trigger value="monthly">Monthly</Tabs.Trigger>
        <Tabs.Trigger value="yearly">Yearly (save 20%)</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="monthly">$29/month, billed monthly.</Tabs.Panel>
      <Tabs.Panel value="yearly">$279/year, billed annually.</Tabs.Panel>
    </Tabs.Root>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs.Root defaultValue="build" className="w-96">
      <Tabs.List>
        <Tabs.Trigger value="build">Build logs</Tabs.Trigger>
        <Tabs.Trigger value="runtime">Runtime logs</Tabs.Trigger>
        <Tabs.Trigger value="edge" disabled>
          Edge logs (Pro)
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="build">Output from the last build.</Tabs.Panel>
      <Tabs.Panel value="runtime">Requests and errors from the running deployment.</Tabs.Panel>
      <Tabs.Panel value="edge">Available on the Pro plan.</Tabs.Panel>
    </Tabs.Root>
  ),
};

/**
 * Runs in a real browser via the Storybook test runner — exercises the
 * WAI-ARIA keyboard model end to end (Tab into the active trigger, Arrow to
 * move + activate, disabled-trigger skip + wrap).
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Tabs.Root defaultValue="build" className="w-96">
      <Tabs.List>
        <Tabs.Trigger value="build">Build logs</Tabs.Trigger>
        <Tabs.Trigger value="runtime">Runtime logs</Tabs.Trigger>
        <Tabs.Trigger value="edge" disabled>
          Edge logs
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="build">Build output</Tabs.Panel>
      <Tabs.Panel value="runtime">Runtime output</Tabs.Panel>
      <Tabs.Panel value="edge">Edge output</Tabs.Panel>
    </Tabs.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const build = canvas.getByRole("tab", { name: "Build logs" });
    const runtime = canvas.getByRole("tab", { name: "Runtime logs" });

    await userEvent.tab();
    await expect(build).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect(runtime).toHaveFocus();
    await expect(canvas.getByText("Runtime output")).toBeInTheDocument();

    // skips the disabled "Edge" tab and wraps back to the first
    await userEvent.keyboard("{ArrowRight}");
    await expect(build).toHaveFocus();
  },
};

export const Vertical: Story = {
  render: () => (
    <Tabs.Root defaultValue="general" orientation="vertical" className="w-[28rem]">
      <Tabs.List>
        <Tabs.Trigger value="general">General</Tabs.Trigger>
        <Tabs.Trigger value="members">Members</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="general">Workspace name, slug, and default region.</Tabs.Panel>
      <Tabs.Panel value="members">Invite teammates and manage roles.</Tabs.Panel>
      <Tabs.Panel value="billing">Plan, payment method, and invoices.</Tabs.Panel>
    </Tabs.Root>
  ),
};

export const ManyTabsScroll: Story = {
  name: "Overflow (scrolls on narrow screens)",
  render: () => (
    <Tabs.Root defaultValue="t1" className="w-64">
      <Tabs.List>
        {["Overview", "Deployments", "Analytics", "Logs", "Settings", "Domains", "Storage"].map(
          (label, i) => (
            <Tabs.Trigger key={label} value={`t${i + 1}`}>
              {label}
            </Tabs.Trigger>
          )
        )}
      </Tabs.List>
      <Tabs.Panel value="t1">
        The tab strip scrolls horizontally when it overflows its container.
      </Tabs.Panel>
      {["t2", "t3", "t4", "t5", "t6", "t7"].map((v) => (
        <Tabs.Panel key={v} value={v}>
          Panel {v}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  ),
};
