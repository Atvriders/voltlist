import { useQuery } from "@tanstack/react-query";
import type { CarQuery, CarListResult, Vehicle } from "@voltlist/shared";
import { api } from "./client";

export const carKeys = {
  all: ["cars"] as const,
  list: (query: CarQuery) => ["cars", "list", query] as const,
  detail: (id: string) => ["cars", "detail", id] as const,
  compare: (ids: string[]) => ["cars", "compare", ids] as const,
};

/**
 * Serialize a CarQuery to a querystring. Array facets become repeated keys
 * (`powertrain=BEV&powertrain=PHEV`), which Express parses back into arrays.
 */
export function buildCarQueryString(query: CarQuery): string {
  const p = new URLSearchParams();
  const add = (k: string, v: string | number | boolean) => p.append(k, String(v));

  if (query.q) add("q", query.q);
  query.powertrain?.forEach((v) => add("powertrain", v));
  query.make?.forEach((v) => add("make", v));
  query.bodyStyle?.forEach((v) => add("bodyStyle", v));
  query.drivetrain?.forEach((v) => add("drivetrain", v));
  query.chargePort?.forEach((v) => add("chargePort", v));
  if (query.minPrice != null) add("minPrice", query.minPrice);
  if (query.maxPrice != null) add("maxPrice", query.maxPrice);
  if (query.minElectricRange != null) add("minElectricRange", query.minElectricRange);
  if (query.minSeating != null) add("minSeating", query.minSeating);
  if (query.taxCreditOnly) add("taxCreditOnly", true);
  if (query.needsAdaptiveCruise) add("needsAdaptiveCruise", true);
  if (query.needsLaneAssist) add("needsLaneAssist", true);
  if (query.needsHandsFree) add("needsHandsFree", true);
  if (query.sort) add("sort", query.sort);
  if (query.order) add("order", query.order);
  if (query.page != null) add("page", query.page);
  if (query.pageSize != null) add("pageSize", query.pageSize);

  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** GET /api/cars — filtered/sorted/paginated catalog. */
export function useCars(query: CarQuery) {
  return useQuery({
    queryKey: carKeys.list(query),
    queryFn: () => api<CarListResult>(`/api/cars${buildCarQueryString(query)}`),
  });
}

/** GET /api/cars/:id — full spec sheet (disabled until an id is present). */
export function useCar(id: string | undefined) {
  return useQuery({
    queryKey: carKeys.detail(id ?? ""),
    queryFn: () => api<Vehicle>(`/api/cars/${encodeURIComponent(id!)}`),
    enabled: Boolean(id),
  });
}

/** GET /api/compare?ids=a,b,c — up to 4 vehicles for the compare matrix. */
export function useCompare(ids: string[]) {
  return useQuery({
    queryKey: carKeys.compare(ids),
    queryFn: () =>
      api<{ items: Vehicle[] }>(
        `/api/compare?ids=${ids.map(encodeURIComponent).join(",")}`,
      ),
    enabled: ids.length > 0,
  });
}
