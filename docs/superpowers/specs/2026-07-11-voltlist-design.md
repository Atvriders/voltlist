# VoltList — Complete EV & Hybrid Researcher & Picker

**Date:** 2026-07-11
**Status:** Approved design (pending user spec review)
**Owner:** Atvriders

## 1. Purpose

A full-stack web app that catalogs **every electrified vehicle (BEV / PHEV / HEV) sold new in the USA for model years 2024–2026**, from every brand, with **complete, sourced specifications** per vehicle. The user researches, filters, and picks a car; favorites contenders; adds serious candidates to a cart/shortlist; compares them side-by-side; and exports the shortlist. Favorites and cart are tied to a user **account** and sync across devices.

This is a research-and-decision tool, not a commerce site — "purchase" happens off-site via real manufacturer "Build & Price" / dealer-locator deep-links.

## 2. Scope

**In scope**
- Catalog of BEV, PHEV, and conventional hybrid (HEV) models, MY2024–2026, all brands sold new in the USA.
- Complete spec sheet per vehicle (section 4), each fact carrying a source and as-of date.
- Faceted filtering, sorting, and full-text search ("the picker").
- Car detail view with the full spec sheet.
- Compare view (up to 4 vehicles side-by-side).
- User accounts (email + password) with server-synced favorites and cart.
- Cart = shortlist → compare + export (CSV, PDF) + deep-links out.
- Single Docker image published to GHCR; `docker-compose.yml` that pulls the GHCR image with a persistent volume for the database.
- Full test suite + data-integrity audit + security pass.

**Out of scope (YAGNI)**
- Real purchasing / payment / financing.
- Live third-party spec APIs (dataset is curated & bundled).
- Manufacturer photography (styled spec cards instead — no images).
- Used-car listings, dealer inventory, pricing negotiation.
- Social features, reviews, comments.
- Mobile native apps (responsive web only).
- OAuth / social login (email+password only).

## 3. Brand & model coverage

Target every brand offering an electrified model new in the USA in MY2024–2026, including but not limited to:

Acura, Alfa Romeo, Audi, BMW, Cadillac, Chevrolet, Chrysler, Dodge, Fiat, Ford, Genesis, GMC, Honda, Hyundai, Jaguar, Jeep, Kia, Land Rover, Lexus, Lincoln, Lucid, Maserati, Mazda, Mercedes-Benz, MINI, Mitsubishi, Nissan, Polestar, Porsche, Ram, Rivian, Subaru, Tesla, Toyota, Volkswagen, Volvo, VinFast.

**Excluded after data-accuracy verification (2026-07-11):** Buick and INFINITI — neither sells any BEV/PHEV/HEV new in the US for MY2024–2026 (Buick's Electra EVs are China-only; the INFINITI QXe is a concept, first US EV ~2028). Final coverage: **37 brands, 407 vehicles.**

Expected volume: ~200–250 model/year rows (actual: 407). Each row is a **model + model-year + notable trim spread**; where trims differ materially in the headline specs (range, drivetrain, price), the differences are captured as trim variants within the vehicle record rather than as separate cars.

## 4. Data model (the "complete specs")

Each vehicle is validated against a strict Zod schema. A build-failing test asserts every vehicle has all required fields and passes sanity ranges.

```
Vehicle {
  id: string                      // slug, e.g. "hyundai-ioniq-5-2026"
  make: string
  model: string
  year: number                    // 2024..2026
  trimsSummary: string            // human summary of trim spread
  bodyStyle: enum                 // SUV | Sedan | Truck | Hatchback | Minivan | Coupe | Wagon | Crossover | Van
  powertrainType: enum            // BEV | PHEV | HEV
  segment: string                 // e.g. "Compact SUV"

  // Powertrain & efficiency
  electricRangeMi: number | null  // EPA all-electric range (BEV & PHEV)
  totalRangeMi: number | null     // combined range where published
  mpge: number | null             // combined MPGe (BEV/PHEV)
  mpgCombined: number | null      // combined MPG (PHEV gas / HEV)
  efficiencyMiPerKwh: number | null

  // Energy storage
  batteryKwhUsable: number | null
  batteryKwhTotal: number | null
  fuelTankGal: number | null      // HEV / PHEV

  // Charging (BEV/PHEV)
  dcFastMaxKw: number | null
  dcFast10to80Min: number | null
  acOnboardKw: number | null
  chargePort: enum | null         // NACS | CCS | J1772 | CHAdeMO

  // Drivetrain & performance
  drivetrain: enum                // FWD | RWD | AWD
  motorLayout: string | null      // e.g. "Dual motor", "Single rear"
  horsepower: number | null
  torqueLbFt: number | null
  zeroToSixtySec: number | null
  topSpeedMph: number | null
  towingCapacityLb: number | null

  // ADAS / self-driving (first-class, filterable)
  adas: {
    systemName: string | null            // "BlueCruise", "Super Cruise", "Autopilot", "Highway Driving Assist"...
    adaptiveCruiseControl: enum          // Standard | Optional | NotAvailable
    laneKeepAssist: enum                 // Standard | Optional | NotAvailable
    laneCentering: enum                  // Standard | Optional | NotAvailable
    handsFreeHighway: enum               // Standard | Optional | NotAvailable
    automaticEmergencyBraking: enum      // Standard | Optional | NotAvailable
    blindSpotMonitoring: enum            // Standard | Optional | NotAvailable
    selfParking: enum                    // Standard | Optional | NotAvailable
    autonomyLevel: string                // "SAE L2", "SAE L2+", "L3 (limited)"
  }

  // Dimensions & practicality
  lengthIn / widthIn / heightIn / wheelbaseIn: number | null
  groundClearanceIn: number | null
  cargoCuFt: number | null
  frunkCuFt: number | null
  seatingCapacity: number | null
  curbWeightLb: number | null

  // Ownership
  msrpBaseUsd: number | null
  msrpTopUsd: number | null
  federalTaxCreditEligible: boolean | null   // IRA 30D eligibility (as-of dated)
  federalTaxCreditNote: string | null
  warrantyBasic: string | null              // "3 yr / 36,000 mi"
  warrantyPowertrain: string | null
  warrantyBattery: string | null            // "8 yr / 100,000 mi"

  // Links & provenance
  buildAndPriceUrl: string | null
  manufacturerUrl: string | null
  sources: Source[]                         // { field?, url, asOf }
  dataAsOf: string                          // ISO date the record was compiled
}
```

Nullable fields are allowed where a spec genuinely does not apply (e.g. `batteryKwhUsable` for an HEV, `fuelTankGal` for a BEV), but the schema enforces powertrain-appropriate presence (a BEV must have battery + range; an HEV must have a fuel tank + MPG).

## 5. Architecture

### Frontend — React 18 + Vite + TypeScript + Tailwind
- **Pages:** Catalog (faceted filters + results grid), Car Detail (full spec sheet), Compare (side-by-side ≤4), Favorites, Cart, Login, Register, Account.
- **Server state:** React Query (cars, favorites, cart, auth session).
- **UI:** Tailwind + a small in-house component set (buttons, inputs, chips, dialog, table) — no heavy component library. Styled spec cards (brand wordmark, body-style silhouette, powertrain accent color) — no external images.
- **Design:** per frontend-design skill — distinctive, intentional visual direction (documented in the plan phase).

### Backend — Node + Express + TypeScript
- **DB:** SQLite via Prisma (zero-config, single-file, persisted to a Docker volume).
- **Auth:** email + password; bcrypt password hashing; JWT in an httpOnly, SameSite=Lax, Secure cookie; auth middleware guards user routes.
- **Data:** `data/cars.json` (built by curation agents) is validated and seeded into SQLite on first boot (idempotent seed). Cars are served from the DB with server-side filtering/sorting/search.
- **Endpoints:**
  - `GET  /api/cars` — filter, sort, search, paginate
  - `GET  /api/cars/:id`
  - `GET  /api/compare?ids=a,b,c`
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET/POST/DELETE /api/favorites` (auth)
  - `GET/POST/DELETE /api/cart` (auth)
  - `GET /api/export/cart?format=csv|pdf` (auth)
  - `GET /api/health`
- **Static:** in production the server serves the built SPA and the API from one process/port.

### Data curation pipeline
- ~15 parallel research agents, brands partitioned across them, each returning validated vehicle records (schema-conformant JSON).
- A merge + validation step assembles `data/cars.json`; a Vitest data-integrity test fails the build on any schema violation or out-of-range value.
- Every field is sourced and as-of dated.

### Packaging & deploy
- **Single multi-stage Docker image:** stage 1 builds the web bundle, stage 2 builds the server, runtime `node:20-bookworm-slim` (Debian — reliable Prisma/OpenSSL) serves API + static SPA. Published to `ghcr.io/atvriders/voltlist` (public).

> **As-built deltas (2026-07-11):** runtime is Debian bookworm-slim, not Alpine (Alpine/musl broke Prisma's OpenSSL engine resolution). Compose maps host **`3021:8080`**. New env `COOKIE_SECURE` (default `false`) marks the auth cookie `Secure` only behind TLS, so login works over plain HTTP on a LAN. Helmet's CSP drops `upgrade-insecure-requests` for the same reason. `BCRYPT_COST` is env-tunable (12 prod / 4 tests). Final coverage: 37 brands / 407 vehicles.
- **`docker-compose.yml`:** pulls the GHCR image, maps a port, mounts a named volume for the SQLite database, sets `JWT_SECRET` via env.
- **CI:** GitHub Actions builds & pushes the image on push to `master`; package public. (Push only on explicit user request per user workflow.)

## 6. Filtering & sorting (the picker)

- **Facets:** powertrain type · brand · body style · **drivetrain (FWD/RWD/AWD)** · price range · **min electric range** · **ADAS** (hands-free highway / adaptive cruise / lane assist available) · seating capacity · charge port · federal-tax-credit eligible.
- **Sort:** price (base) · electric range · 0–60 · efficiency (MPGe / mi-per-kWh) · horsepower.
- **Search:** live text over make/model/segment.
- Filtering is executed server-side against SQLite; the client reflects active facets in the URL for shareable/deep-linkable filtered views.

## 7. Favorites & Cart

- **Favorites:** a per-user set of vehicle ids; heart toggle across all views; Favorites page lists them.
- **Cart (shortlist):** per-user ordered list of serious contenders. Cart page offers:
  - **Compare table** — side-by-side full-spec comparison of cart items (up to 4 highlighted at once).
  - **Export** — CSV and PDF of the compared specs.
  - **Deep-links** — each item links to its real "Build & Price" / manufacturer page.
- Both persist server-side (SQLite), keyed to the authenticated user; UI uses React Query with optimistic updates.

## 8. Quality: `/debug fully and audit`

- **Data-integrity audit:** every vehicle validates against the Zod schema; sanity ranges (e.g., electricRange 10–520, msrp 15k–250k, 0–60 1.5–15s); powertrain-appropriate field presence; no duplicate ids; all brands present.
- **Backend tests (Vitest + Supertest):** auth flows (register/login/logout/me, bad-password, duplicate-email), favorites & cart CRUD + auth-guard, cars filter/sort/search/pagination, export endpoints, health.
- **Frontend tests (Vitest + React Testing Library):** filter interactions, favorite/cart toggles, compare rendering, auth forms, empty/error states.
- **Security pass:** bcrypt cost, cookie flags (httpOnly/SameSite/Secure), input validation on all endpoints (Zod), Prisma parameterization (no injection), no secrets in the image, rate-limit on auth, helmet headers, CSP.
- **Gate before the single final commit:** typecheck + web build + server build + full test suite green, plus a manual smoke of the running app.

## 9. Build approach

1. frontend-design skill → visual direction.
2. writing-plans skill → detailed implementation plan (this doc's successor).
3. A **Workflow** orchestrating parallel agents:
   - Fleet A: dataset curation (brands partitioned) → merge → validate.
   - Fleet B (concurrent): scaffold, Prisma schema + migrations, backend endpoints + tests, frontend pages + components + tests, Dockerfile + compose + CI.
   - Debug/audit phase: run all gates, fix failures, security pass.
4. **One commit at the end**, after full verification (per user workflow). Push only on explicit request.

## 10. Success criteria

- App builds, boots from the GHCR image via `docker-compose up`, and serves the catalog.
- Every listed brand has ≥1 electrified MY2024–2026 model; all vehicles pass the data-integrity audit.
- User can register/login, filter/search/sort, view a full spec sheet, favorite, add to cart, compare side-by-side, export CSV/PDF, and follow deep-links out.
- All required specs (range, battery/tank, drivetrain, ADAS incl. lane assist & adaptive cruise) are present and visible per car.
- Full test suite + data audit + security pass green.
