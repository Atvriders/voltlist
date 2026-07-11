import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCars } from "./cars";
import { buildCarQueryString } from "./cars";
import { createQueryWrapper } from "../test/utils";

describe("useCars", () => {
  it("returns the catalog items, total, and facets", async () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCars({}), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(3);
    expect(result.current.data?.total).toBe(3);
    expect(result.current.data?.facets.makes).toContain("Hyundai");
  });

  it("passes filters through the querystring to the API", async () => {
    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useCars({ powertrain: ["BEV"] }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.powertrainType).toBe("BEV");
  });
});

describe("buildCarQueryString", () => {
  it("serializes arrays as repeated keys and skips empties", () => {
    const qs = buildCarQueryString({
      powertrain: ["BEV", "PHEV"],
      minPrice: 20000,
      taxCreditOnly: true,
      sort: "price",
      order: "asc",
    });
    expect(qs).toContain("powertrain=BEV");
    expect(qs).toContain("powertrain=PHEV");
    expect(qs).toContain("minPrice=20000");
    expect(qs).toContain("taxCreditOnly=true");
    expect(qs).toContain("sort=price");
    expect(buildCarQueryString({})).toBe("");
  });
});
