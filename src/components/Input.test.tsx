import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { Input } from "./Input";

describe("Input", () => {
  it("accepts typed text", async () => {
    render(<Input placeholder="Email" />);
    const input = screen.getByPlaceholderText("Email");
    await userEvent.type(input, "marc@forsight.dev");
    expect(input).toHaveValue("marc@forsight.dev");
  });

  it("marks itself invalid and shows the hint", () => {
    render(<Input placeholder="Email" invalid hint="Enter a valid email." readOnly />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email.")).toBeInTheDocument();
  });

  it("links hint text to input via aria-describedby", () => {
    render(<Input placeholder="Email" hint="Enter a valid email." />);
    const input = screen.getByPlaceholderText("Email");
    const hintText = screen.getByText("Enter a valid email.");
    const hintId = hintText.id;
    expect(hintId).toBeTruthy();
    expect(input).toHaveAttribute("aria-describedby", hintId);
  });

  it("does not set aria-describedby when hint is absent", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Input placeholder="Email" aria-label="Email" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
