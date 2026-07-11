import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

/** A trigger + Dialog wired together the way the mobile Filters panel is. */
function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open filters
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Filters">
        <button type="button">First inside</button>
        <button type="button">Second inside</button>
      </Dialog>
    </div>
  );
}

describe("Dialog focus management", () => {
  it("labels itself by its visible heading", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    // Accessible name resolves through aria-labelledby → the <h2>.
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("moves focus into the dialog on open and back to the trigger on Escape", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);

    await screen.findByRole("dialog", { name: "Filters" });
    // Focus moved into the dialog (its first focusable child).
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "First inside" }),
      ).toHaveFocus(),
    );

    // Escape closes the dialog and restores focus to the trigger.
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("traps Tab within the dialog's focusable elements", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const first = screen.getByRole("button", { name: "First inside" });
    const second = screen.getByRole("button", { name: "Second inside" });
    await waitFor(() => expect(first).toHaveFocus());

    // Shift+Tab from the first element wraps to the last.
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(second).toHaveFocus();

    // Tab from the last element wraps back to the first.
    await user.keyboard("{Tab}");
    expect(first).toHaveFocus();
  });
});
