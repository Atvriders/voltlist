import type { CSSProperties } from "react";
import type { Vehicle } from "@voltlist/shared";

/** Body-style union derived from the frozen schema (never re-declared). */
export type BodyStyle = Vehicle["bodyStyle"];

/**
 * Detailed inline side-profile car illustrations, one per BodyStyle. No
 * external images (CSP forbids remote origins) — every shape is hand-authored
 * SVG on a shared `0 0 112 44` grid (ground line at y=40, wheel centres at
 * y=34). Sheet metal, greenhouse glass, pillar/door lines and a small charge
 * bolt are all drawn in `currentColor`, so a parent can tint the whole icon
 * with the powertrain accent (e.g. `text-pt-bev` / `text-pt-phev` /
 * `text-pt-hev`) and it works in light and dark. Icons are fully static, so
 * `prefers-reduced-motion` is respected by construction.
 */
interface Shape {
  /** Outer sheet-metal outline (fill + stroke). */
  body: string;
  /** Greenhouse glass area (subtler fill). */
  glass: string;
  /** Pillar / door / beltline detail strokes. */
  lines?: string[];
  /** Wheel centres (x). Both sit on y=34, r=6. */
  wheels: { fr: number; rr: number };
  /** Charge-bolt accent centre [x, y]. Defaults to just behind the front wheel. */
  bolt?: [number, number];
}

const BODIES: Record<BodyStyle, Shape> = {
  Sedan: {
    wheels: { fr: 30, rr: 82 },
    body:
      "M7,31 L7,25.5 Q7.5,23.6 11,23.2 L40,22.2 L50.5,11.8 Q52,10.2 55,10.2 L63,10.2 Q66,10.2 67.5,11.8 L77,20.6 L98,21.6 Q104.5,22 105,25.6 L105,31 " +
      "L89.5,31 A7.5,7.5 0 0,0 74.5,31 L37.5,31 A7.5,7.5 0 0,0 22.5,31 Z",
    glass:
      "M43,21.8 L51.8,12.6 Q53,11.6 55,11.6 L63,11.6 Q65,11.6 66,12.8 L74.6,20.6 Z",
    lines: ["M58.5,12 L58.5,21.6", "M43,26 L74,26"],
  },
  Coupe: {
    wheels: { fr: 31, rr: 83 },
    body:
      "M7,31 L7,25.6 Q8,23.4 12,23 L41,22 L52,11.5 Q54,9.8 58,9.8 L62,9.8 Q66,9.8 69,12.5 L83,21.5 L100,22.2 Q105,22.6 105,25.8 L105,31 " +
      "L90.5,31 A7.5,7.5 0 0,0 75.5,31 L38.5,31 A7.5,7.5 0 0,0 23.5,31 Z",
    glass:
      "M44,21.8 L53.4,12.2 Q55,11 58,11 L62,11 Q64.5,11 66.5,12.9 L79,21 Z",
    lines: ["M44,26 L79,26"],
  },
  Hatchback: {
    wheels: { fr: 29, rr: 80 },
    body:
      "M7,31 L7,25.4 Q7.5,23.4 11,23 L38,22 L48,11.4 Q49.5,9.8 52.5,9.8 L72,9.8 Q75,9.8 76,11.6 L84,21.6 Q85.6,23 86.5,25.4 L86.5,31 " +
      "L87.5,31 A7.5,7.5 0 0,0 72.5,31 L36.5,31 A7.5,7.5 0 0,0 21.5,31 Z",
    glass:
      "M41,21.8 L49.6,12.2 Q51,11.2 53,11.2 L71.5,11.2 Q73.5,11.2 74.4,12.8 L81.4,21.6 Z",
    lines: ["M60,11.2 L60,21.8", "M41,26 L81,26"],
  },
  Wagon: {
    wheels: { fr: 30, rr: 82 },
    body:
      "M7,31 L7,25.5 Q7.5,23.5 11,23.1 L40,22.1 L50,11.6 Q51.5,10 54.5,10 L94,10 Q98,10 99,12 L101.5,20 L103,22 Q105,22.6 105,25.5 L105,31 " +
      "L89.5,31 A7.5,7.5 0 0,0 74.5,31 L37.5,31 A7.5,7.5 0 0,0 22.5,31 Z",
    glass:
      "M43,21.8 L51.5,12.4 Q53,11.4 55,11.4 L93.5,11.4 Q95.5,11.4 96.3,13 L98.6,20 Z",
    lines: ["M60,11.4 L60,21.8", "M78,11.4 L78,21.8", "M43,26 L98,26"],
  },
  SUV: {
    wheels: { fr: 30, rr: 83 },
    body:
      "M6,31 L6,23 Q6,20.8 9.5,20.4 L36,19.6 L44,7.4 Q45.4,6 48.6,6 L99,6 Q102.6,6 103.4,8 L105.2,19 Q106,20 106,22.6 L106,31 " +
      "L90.5,31 A7.8,7.8 0 0,0 75.4,31 L37.6,31 A7.8,7.8 0 0,0 22.5,31 Z",
    glass: "M38,19.4 L45.6,7.8 Q47,6.9 49,6.9 L99,6.9 L101.6,19.4 Z",
    lines: ["M49,5.2 L98,5.2", "M62,6.9 L62,19.4", "M82,6.9 L82,19.4", "M38,24 L101,24"],
  },
  Crossover: {
    wheels: { fr: 30, rr: 82 },
    body:
      "M6.5,31 L6.5,24.8 Q6.5,22.7 10,22.3 L38,21.3 L47,10.6 Q48.5,8.8 51.5,8.8 L92,8.8 Q96.5,8.8 98,11 L102,20 Q105,20.6 105,23.8 L105,31 " +
      "L90,31 A7.6,7.6 0 0,0 75,31 L37.4,31 A7.6,7.6 0 0,0 22.4,31 Z",
    glass:
      "M41,20.9 L48.6,10.2 Q50,9.2 52,9.2 L91.5,9.2 Q93.6,9.2 94.6,11 L98.2,20 Z",
    lines: ["M60,9.2 L60,20.9", "M79,9.2 L79,20.9", "M41,25 L99,25"],
  },
  Minivan: {
    wheels: { fr: 29, rr: 84 },
    body:
      "M6,31 L6,24 Q6,22 9,21.6 L30,20.6 L44,8 Q45.5,6.6 49,6.6 L99,6.6 Q103,6.6 104,9 L106,20 Q107,20.6 107,23.6 L107,31 " +
      "L91.5,31 A7.7,7.7 0 0,0 76.5,31 L36.5,31 A7.7,7.7 0 0,0 21.5,31 Z",
    glass:
      "M33,20.4 L45.4,8.4 Q47,7.6 50,7.6 L98.5,7.6 Q100.6,7.6 101.4,9.6 L103.4,20 Z",
    lines: ["M58,8 L58,20.4", "M80,8 L80,20.4", "M33,24.5 L103,24.5"],
  },
  Van: {
    wheels: { fr: 27, rr: 86 },
    body:
      "M5,31 L5,9.5 Q5,6.6 9,6.6 L20,6.6 L25,5 Q26.4,4.6 100,4.6 Q106,4.6 107,7.8 L107,31 " +
      "L93.5,31 A7.7,7.7 0 0,0 78.5,31 L34.5,31 A7.7,7.7 0 0,0 19.5,31 Z",
    glass: "M9.5,15 L9.5,9.4 Q9.5,8.6 10.4,8.6 L23,8.6 L27,6.8 L41,6.8 L41,15 Z",
    lines: ["M41,6.8 L41,31", "M27,6.8 L27,15", "M5,20 L107,20"],
  },
  Truck: {
    wheels: { fr: 29, rr: 85 },
    body:
      "M6,31 L6,24.6 Q6,22.6 9.5,22.2 L34,21.2 L40,11 Q41.2,9.4 44,9.4 L57,9.4 Q60,9.4 60.5,12 L60.5,22 L102,22 Q106,22 106,24.6 L106,31 " +
      "L93.5,31 A7.6,7.6 0 0,0 78.5,31 L36.5,31 A7.6,7.6 0 0,0 21.5,31 Z",
    glass:
      "M37,21 L41.4,11.8 Q42.4,10.8 44.4,10.8 L57,10.8 Q58.8,10.8 58.8,12.4 L58.8,21 Z",
    lines: ["M60.5,22 L60.5,31", "M63,24.5 L101,24.5", "M101,22 L101,31"],
  },
};

/** A small lightning bolt (~5px tall) as a tasteful "energy" cue. */
function boltPath(cx: number, cy: number): string {
  return (
    `M${cx + 0.7},${cy - 2.6} L${cx - 1.9},${cy + 0.6} L${cx - 0.2},${cy + 0.6} ` +
    `L${cx - 0.8},${cy + 2.6} L${cx + 1.9},${cy - 0.7} L${cx + 0.1},${cy - 0.7} Z`
  );
}

function Wheel({ cx }: { cx: number }) {
  return (
    <>
      <circle cx={cx} cy={34} r={6} fill="var(--surface)" stroke="currentColor" strokeWidth={1.6} />
      <circle cx={cx} cy={34} r={2.2} fill="none" stroke="currentColor" strokeWidth={1.4} />
    </>
  );
}

export interface SilhouetteProps {
  bodyStyle: BodyStyle;
  className?: string;
  title?: string;
  /**
   * Optional explicit accent colour for the whole illustration. When omitted
   * the icon inherits `currentColor` from its parent (the established pattern —
   * e.g. a `text-pt-bev` wrapper), so existing call sites are unaffected.
   */
  accent?: string;
}

export function Silhouette({ bodyStyle, className, title, accent }: SilhouetteProps) {
  const label = title ?? `${bodyStyle} silhouette`;
  const shape = BODIES[bodyStyle];
  const [bx, by] = shape.bolt ?? [shape.wheels.fr + 9, 27.8];
  const style: CSSProperties | undefined = accent ? { color: accent } : undefined;

  return (
    <svg
      viewBox="0 0 112 44"
      className={className}
      role="img"
      aria-label={label}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      data-testid={`silhouette-${bodyStyle}`}
      style={style}
    >
      <title>{label}</title>
      {/* sheet metal */}
      <path
        d={shape.body}
        fill="currentColor"
        fillOpacity={0.1}
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      {/* greenhouse glass */}
      <path d={shape.glass} fill="currentColor" fillOpacity={0.22} />
      {/* pillar / door / beltline detail */}
      {shape.lines?.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}
      {/* charge / energy accent */}
      <path d={boltPath(bx, by)} fill="currentColor" fillOpacity={0.7} />
      <Wheel cx={shape.wheels.fr} />
      <Wheel cx={shape.wheels.rr} />
    </svg>
  );
}
