import type { Config } from "tailwindcss";

/**
 * Colors and fonts are wired to the CSS custom properties defined in
 * src/design/tokens.css, so every utility (bg-voltage, text-ink-soft,
 * border-line, font-mono, ...) is theme-aware in light and dark.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        voltage: {
          DEFAULT: "var(--voltage)",
          ink: "var(--voltage-ink)",
        },
        current: "var(--current)",
        "pt-bev": "var(--pt-bev)",
        "pt-phev": "var(--pt-phev)",
        "pt-hev": "var(--pt-hev)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        paper: "var(--paper)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        line: "var(--line)",
        good: "var(--good)",
        warn: "var(--warn)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Design type scale: 12 / 13 / 14 / 16 / 20 / 28 / 40 / 56.
        "13": ["13px", { lineHeight: "1.4" }],
        "28": ["28px", { lineHeight: "1.1" }],
        "40": ["40px", { lineHeight: "1.05" }],
        "56": ["56px", { lineHeight: "1.05" }],
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
      },
    },
  },
  plugins: [],
} satisfies Config;
