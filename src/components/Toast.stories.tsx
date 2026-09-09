import type { Meta, StoryObj } from "@storybook/react";
import {
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./Toast";

const meta: Meta = {
  title: "Forsight/Overlays/Toast",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastRoot open>
        <div className="flex-1">
          <ToastTitle>Deployed</ToastTitle>
          <ToastDescription>forsight-client-portal is live at v14.</ToastDescription>
        </div>
        <ToastClose />
      </ToastRoot>
      <ToastViewport className="static w-96 p-0" />
    </ToastProvider>
  ),
};

export const Danger: Story = {
  render: () => (
    <ToastProvider>
      <ToastRoot open variant="danger">
        <div className="flex-1">
          <ToastTitle>Deploy failed</ToastTitle>
          <ToastDescription>Build exited with code 1.</ToastDescription>
        </div>
        <ToastClose />
      </ToastRoot>
      <ToastViewport className="static w-96 p-0" />
    </ToastProvider>
  ),
};

export const Success: Story = {
  render: () => (
    <ToastProvider>
      <ToastRoot open variant="success">
        <div className="flex-1">
          <ToastTitle>Invite sent</ToastTitle>
          <ToastDescription>marc@forsight.dev was invited to the team.</ToastDescription>
        </div>
        <ToastClose />
      </ToastRoot>
      <ToastViewport className="static w-96 p-0" />
    </ToastProvider>
  ),
};
