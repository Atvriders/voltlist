/**
 * Unit + value formatting for spec readouts.
 *
 * Rules (per design-direction.md):
 *  - money as whole USD with thousands separators: `$46,550`
 *  - distances in miles: `303 mi`
 *  - energy in kWh / power in kW; units always shown
 *  - null / undefined / NaN render as an em dash: `—`
 *  - numbers group with en-US separators and are meant to render in a
 *    `font-variant-numeric: tabular-nums` context (the `.tnum` utility / mono).
 */

/** The canonical "no data" placeholder. */
export const DASH = "—";

function isBlank(v: number | null | undefined): v is null | undefined {
  return v == null || Number.isNaN(v);
}

/** Grouped number with up to `maxFractionDigits` decimals (default 0). */
export function formatNumber(
  v: number | null | undefined,
  maxFractionDigits = 0,
): string {
  if (isBlank(v)) return DASH;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** `$46,550` — whole dollars, no cents. */
export function formatMoney(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

/** `303 mi` */
export function formatMiles(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(Math.round(v))} mi`;
}

/** `77 kWh` (keeps one decimal when present, e.g. `77.4 kWh`). */
export function formatKwh(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} kWh`;
}

/** `250 kW` */
export function formatKw(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} kW`;
}

/** `120 MPGe` */
export function formatMpge(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} MPGe`;
}

/** `52 mpg` */
export function formatMpg(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} mpg`;
}

/** `3.5 mi/kWh` */
export function formatMiPerKwh(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} mi/kWh`;
}

/** `320 hp` */
export function formatHp(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} hp`;
}

/** `400 lb-ft` */
export function formatTorque(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} lb-ft`;
}

/** `4.5 s` (0–60 etc). */
export function formatSeconds(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} s`;
}

/** `155 mph` */
export function formatMph(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} mph`;
}

/** `182.5 in` */
export function formatInches(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} in`;
}

/** `4,850 lb` */
export function formatWeight(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} lb`;
}

/** `28 cu ft` */
export function formatCuFt(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} cu ft`;
}

/** `13.2 gal` */
export function formatGal(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v, 1)} gal`;
}

/** `5,600 lb` towing. */
export function formatTowing(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return `${formatNumber(v)} lb`;
}

/** Bare seat count, `5`. */
export function formatSeats(v: number | null | undefined): string {
  if (isBlank(v)) return DASH;
  return formatNumber(v);
}

/** Human-friendly powertrain label. */
export function formatPowertrain(pt: "BEV" | "PHEV" | "HEV"): string {
  switch (pt) {
    case "BEV":
      return "Electric";
    case "PHEV":
      return "Plug-in Hybrid";
    case "HEV":
      return "Hybrid";
  }
}
