import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";

function ExampleTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>forsight-client-portal</TableCell>
          <TableCell>success</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("renders header and row content", () => {
    render(<ExampleTable />);
    expect(screen.getByRole("columnheader", { name: "Project" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "forsight-client-portal" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ExampleTable />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableHead sorting", () => {
  it("leaves a plain header as non-interactive text when sortDirection is omitted", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole("columnheader")).not.toHaveAttribute("aria-sort");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sets aria-sort and renders a button once sortDirection is given", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortDirection="ascending" onSort={() => {}}>
              Project
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("button", { name: "Project" })).toBeInTheDocument();
  });

  it("calls onSort when the header is activated by click", async () => {
    const onSort = vi.fn();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortDirection="none" onSort={onSort}>
              Project
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    await userEvent.click(screen.getByRole("button", { name: "Project" }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("calls onSort when the header is activated by keyboard", async () => {
    const onSort = vi.fn();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortDirection="descending" onSort={onSort}>
              Project
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    screen.getByRole("button", { name: "Project" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations with a sorted column", async () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortDirection="ascending" onSort={() => {}}>
              Project
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
