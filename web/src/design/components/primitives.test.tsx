import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Chip } from "./Chip";
import { Dialog } from "./Dialog";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Table, THead, TBody, Tr, Th, Td } from "./Table";

describe("design primitives", () => {
  it("Button renders and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to shortlist</Button>);
    const btn = screen.getByRole("button", { name: "Add to shortlist" });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Input renders and accepts typing", async () => {
    render(<Input aria-label="email" />);
    const input = screen.getByLabelText("email");
    await userEvent.type(input, "a@b.co");
    expect(input).toHaveValue("a@b.co");
  });

  it("Select renders options", () => {
    render(
      <Select aria-label="sort">
        <option value="price">Price</option>
        <option value="range">Range</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "sort" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Range" })).toBeInTheDocument();
  });

  it("Chip reflects active state via aria-pressed", () => {
    render(
      <Chip active aria-label="AWD">
        AWD
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "AWD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Dialog shows when open and closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Export">
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Export" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("Badge renders its label", () => {
    render(<Badge tone="bev">Electric</Badge>);
    expect(screen.getByText("Electric")).toBeInTheDocument();
  });

  it("Skeleton renders a placeholder", () => {
    const { container } = render(<Skeleton width={80} height={12} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("Table renders header and body cells", () => {
    render(
      <Table>
        <THead>
          <Tr>
            <Th>Spec</Th>
          </Tr>
        </THead>
        <TBody>
          <Tr>
            <Td>303 mi</Td>
          </Tr>
        </TBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Spec" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "303 mi" })).toBeInTheDocument();
  });
});
