import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Silhouette } from "./silhouette";
import type { BodyStyle } from "./silhouette";

const styles: BodyStyle[] = [
  "SUV",
  "Sedan",
  "Truck",
  "Hatchback",
  "Minivan",
  "Coupe",
  "Wagon",
  "Crossover",
  "Van",
];

describe("Silhouette", () => {
  it.each(styles)("renders an accessible, labelled svg for %s", (style) => {
    const { unmount } = render(<Silhouette bodyStyle={style} />);
    const img = screen.getByRole("img", { name: `${style} silhouette` });
    expect(img).toBeInTheDocument();
    // stable hooks the rest of the UI relies on
    expect(img).toHaveAttribute("data-testid", `silhouette-${style}`);
    // a <title> element backs the accessible name
    expect(img.querySelector("title")?.textContent).toBe(`${style} silhouette`);
    // two wheels are always drawn
    expect(img.querySelectorAll("circle").length).toBe(4);
    unmount();
  });

  it("uses an explicit title as the accessible label", () => {
    render(<Silhouette bodyStyle="SUV" title="Rivian R1S (SUV)" />);
    expect(
      screen.getByRole("img", { name: "Rivian R1S (SUV)" }),
    ).toBeInTheDocument();
  });

  it("draws a visually distinct body path for every body style", () => {
    const bodyPaths = styles.map((style) => {
      const { container, unmount } = render(<Silhouette bodyStyle={style} />);
      const svg = container.querySelector<SVGSVGElement>(
        `[data-testid="silhouette-${style}"]`,
      );
      // first <path> is the sheet-metal outline
      const d = svg?.querySelector("path")?.getAttribute("d") ?? "";
      unmount();
      expect(d.length).toBeGreaterThan(0);
      return d;
    });
    // all nine outlines are unique — no two body styles share a silhouette
    expect(new Set(bodyPaths).size).toBe(styles.length);
  });

  it("applies an optional accent colour without breaking currentColor default", () => {
    const { container, rerender } = render(<Silhouette bodyStyle="Sedan" />);
    const uncolored = container.querySelector<SVGSVGElement>(
      '[data-testid="silhouette-Sedan"]',
    );
    expect(uncolored?.getAttribute("style")).toBeNull();

    rerender(<Silhouette bodyStyle="Sedan" accent="rgb(43, 52, 255)" />);
    const colored = container.querySelector<SVGSVGElement>(
      '[data-testid="silhouette-Sedan"]',
    );
    expect(colored?.getAttribute("style")).toContain("rgb(43, 52, 255)");
  });
});
