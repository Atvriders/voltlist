import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RangeMeter } from "./RangeMeter";

describe("RangeMeter", () => {
  it("BEV shows a solid electric readout", () => {
    render(
      <RangeMeter powertrain="BEV" electricRangeMi={303} totalRangeMi={303} />,
    );
    expect(screen.getByText("303 mi electric")).toBeInTheDocument();
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "303");
    expect(meter).toHaveAttribute("aria-valuemax", "520");
  });

  it("PHEV shows the electric + total split story", () => {
    render(
      <RangeMeter powertrain="PHEV" electricRangeMi={42} totalRangeMi={600} />,
    );
    expect(
      screen.getByText("42 mi electric · 600 mi total"),
    ).toBeInTheDocument();
  });

  it("keeps an over-scale PHEV within valid bounds", async () => {
    // total (600) exceeds the fixed 520mi scale (like the ram-1500-ramcharger).
    render(
      <RangeMeter powertrain="PHEV" electricRangeMi={42} totalRangeMi={600} />,
    );
    const meter = screen.getByRole("meter");

    // aria-valuenow must never exceed aria-valuemax (WAI-ARIA).
    const now = Number(meter.getAttribute("aria-valuenow"));
    const maxVal = Number(meter.getAttribute("aria-valuemax"));
    expect(maxVal).toBe(520);
    expect(now).toBeLessThanOrEqual(maxVal);

    // The two split segments animate to their real widths on mount; once
    // filled they must never sum past 100% (no flex-shrink distortion of the
    // electric:gas proportion).
    const segWidth = (el: HTMLElement): number => {
      const m = /width:\s*([\d.]+)%/.exec(el.getAttribute("style") ?? "");
      return m ? Number(m[1]) : 0;
    };
    await waitFor(() => {
      const segments = Array.from(
        meter.querySelectorAll<HTMLElement>("div[style]"),
      );
      expect(segments).toHaveLength(2);
      const widths = segments.map(segWidth);
      const electricW = widths[0] ?? 0;
      const gasW = widths[1] ?? 0;
      expect(electricW).toBeGreaterThan(0);
      expect(gasW).toBeGreaterThan(0);
      expect(electricW + gasW).toBeLessThanOrEqual(100 + 1e-6);
    });
  });

  it("HEV shows total range", () => {
    render(
      <RangeMeter powertrain="HEV" electricRangeMi={null} totalRangeMi={663} />,
    );
    expect(screen.getByText("663 mi total")).toBeInTheDocument();
  });
});
