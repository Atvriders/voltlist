# VoltList — Visual Design Direction

**Concept:** "Instrument Cluster / Datasheet." A precise engineering-readout aesthetic — the feel of a modern EV instrument panel crossed with a technical spec sheet. Deliberately avoids the three AI defaults: NOT neon-green-on-black (the lazy EV cliché), NOT cream+serif+terracotta, NOT broadsheet hairlines. Light-first with a real dark mode.

## Tokens (implement in `web/src/design/tokens.css` as CSS custom properties)

### Color
```
--ink:        #14181B   /* graphite text */
--ink-soft:   #566068   /* secondary text */
--paper:      #F6F8F9   /* app background (cool near-white, faint graphite tint) */
--surface:    #FFFFFF   /* cards */
--surface-2:  #EEF2F3   /* insets, meter tracks */
--line:       #E981E8?  -> #E3E8EA  /* hairline dividers */
--voltage:    #2B34FF   /* PRIMARY accent — electric cobalt-indigo (CTAs, links, focus) */
--voltage-ink:#1B22C9   /* pressed */
--current:    #FFB020   /* SECONDARY accent — amber "live current" (energy fills, highlights) */
/* powertrain-semantic (encode real data everywhere: cards, chips, meters) */
--pt-bev:     #2B34FF   /* BEV = voltage cobalt */
--pt-phev:    #7B3FE4   /* PHEV = violet */
--pt-hev:     #0E9E8E   /* HEV = teal */
--good:       #0E9E8E   /* best-in-row / positive */
--warn:       #C9451B
```
Dark mode (`:root[data-theme="dark"]` / `prefers-color-scheme: dark`):
```
--ink:#E9EEF0  --ink-soft:#9AA6AC  --paper:#0C1013  --surface:#131A1E
--surface-2:#1B242A  --line:#26313A  --voltage:#5A63FF  --current:#FFC24B
--pt-bev:#5A63FF --pt-phev:#9D6BFF --pt-hev:#25C2AF
```

### Type (self-host via @fontsource — no external font CDNs)
- **Display:** Space Grotesk (600/700) — headings, page titles, big numbers. Engineered, characterful.
- **Body:** IBM Plex Sans (400/500/600) — prose, labels, buttons.
- **Data/Mono:** IBM Plex Mono (400/500) — ALL spec values, units (kWh, kW, mi, hp), tables, meter labels. This is the memorable type move: specs read like instrument readouts. Use `font-variant-numeric: tabular-nums`.
- Scale: 12 / 13 / 14 / 16 / 20 / 28 / 40 / 56. Tight leading on display (1.05), comfortable on body (1.5). Uppercase micro-labels/eyebrows in Plex Mono with +0.08em tracking.

### Layout
- App shell: slim top nav (wordmark "VOLTLIST" in Space Grotesk + mono, nav links, favorites/cart counts, auth). 
- Catalog: left **control panel** rail of filters (feels like tuning an instrument) + main results grid of spec cards. Rail collapses to a drawer on mobile.
- Detail: a **datasheet** — grouped readout blocks (Powertrain · Charging · Drivetrain & Performance · Driver Assist · Dimensions · Ownership), each a labeled grid of mono values. Sources listed at the bottom.
- Compare: a spec **matrix** — cars as columns, specs as rows, range meters aligned, best-in-row cell marked with a --good underline + tiny caret.
- Radius: 10px cards, 8px controls. Elevation: subtle (1px line + soft shadow), not glassy. Density: comfortable-but-informative; never cramped.

### Signature element — the Range Meter
A horizontal charge-bar rendered consistently on every card, the detail hero, and each compare column:
- BEV: solid `--pt-bev` fill = electric range, track `--surface-2`, scale to a fixed max (say 520 mi) so bars are comparable across cars.
- PHEV: **split fill** — `--pt-phev` segment for electric-only miles, then a lighter `--current`/hatched segment for gas range → visually shows the electric-vs-total story.
- HEV: `--pt-hev` fill = total range on the same scale.
- Numeric value in Plex Mono above/beside it (e.g. `303 mi` electric). This meter IS the brand — keep it crisp; put the design's boldness here and keep surrounding UI quiet.

### Motion (restrained)
- Card hover: 120ms lift (translateY -2px + shadow). Meter fill animates once on mount (width 0→value, 500ms ease-out), respect `prefers-reduced-motion`.
- No parallax, no ambient loops — this is a tool, precision over spectacle.

### Quality floor
Responsive to 360px; visible keyboard focus (2px `--voltage` ring); `prefers-reduced-motion` respected; WCAG AA contrast (verify cobalt/amber on chosen surfaces); empty/error states written in the interface's voice ("No cars match these filters. Loosen a filter to see more.").

### Copy voice
Plain, active, specific. Buttons name the outcome ("Add to shortlist", "Compare 3", "Export CSV"). Favorites heart labeled for screen readers ("Save Ioniq 5 to favorites"). Units always shown. Never "Submit".
