# VoltList

**A complete, sourced catalog of every EV, PHEV, and hybrid (BEV / PHEV / HEV) sold new in the USA for model years 2024–2026** — filter and search the whole field, open a full spec sheet per vehicle, favorite contenders, add finalists to a shortlist ("cart"), compare up to four side-by-side, and export the shortlist to CSV or PDF. Favorites and cart are tied to an account and sync across devices.

VoltList is a research-and-decision tool, **not** a store. There is no checkout — "purchase" happens off-site through each maker's real "Build & Price" / dealer deep-links.

Ships as a single Docker image (`ghcr.io/atvriders/voltlist`) that serves the API and the built SPA from one process.

---

## Quickstart (Docker Compose)

Requirements: Docker with Compose v2.

```bash
# Everything is inline in docker-compose.yml — no .env needed.
docker compose up -d

# Open the app
open http://localhost:3021
```

> **JWT_SECRET.** `docker-compose.yml` ships a generated default so this runs out of
> the box. Because this repo is public, that secret is readable by anyone — fine on a
> trusted LAN, but if VoltList is reachable from the internet, replace the `JWT_SECRET`
> value in `docker-compose.yml` (or set a `JWT_SECRET` environment variable) with your
> own: `openssl rand -hex 32`. The server refuses to boot in production with a missing,
> short (<32), or default secret.

The SQLite database is persisted in the named volume `voltlist-data` (mounted at `/data`); pending Prisma migrations are applied automatically on every start (by the server process itself). Health is reported at `GET /api/health`.

To build the image locally instead of pulling from GHCR, comment out `image:` and uncomment `build: .` in `docker-compose.yml`, then `docker compose up --build`.

---

## Local development

Requirements: Node 20+.

```bash
npm install
npx prisma generate --schema=server/prisma/schema.prisma   # generate the Prisma client
npm run dev                                                 # server :8080 + web :5173 (Vite proxies /api)
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the Express server on `:8080`, mirroring the single-origin production setup.

Other useful scripts (run from the repo root):

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript strict check across `shared`, `server`, `web` |
| `npm test` | Vitest suites (server + web) |
| `npm run validate-data` | Data-integrity audit of `data/cars.json` (schema, ranges, brand coverage) |
| `npm run build` | Production build of `server` (tsup) and `web` (Vite) |

---

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `JWT_SECRET` | **yes** | — | Secret used to sign the auth JWT cookie. In production set a strong random value of ≥32 chars (`openssl rand -hex 32`); never the `__CHANGE_ME__` placeholder. The server will not start if it is unset. |
| `DATABASE_URL` | no | `file:./data/voltlist.db` (dev) / `file:/data/voltlist.db` (container) | SQLite connection string for the User/Favorite/CartItem tables. |
| `CARS_PATH` | no | `data/cars.json` | Path to the curated vehicle dataset loaded into the in-memory car store at boot. |
| `PORT` | no | `8080` | Port the server listens on. |
| `NODE_ENV` | no | `development` | In `production`, the server also serves the built SPA (`web/dist`) with SPA fallback. |
| `COOKIE_SECURE` | no | `false` | Marks the auth cookie `Secure` (HTTPS-only). Keep `false` for plain-HTTP LAN access; set `true` only when serving behind HTTPS — otherwise browsers drop the login cookie over HTTP and sign-in silently fails. |

Copy `.env.example` to `.env` and adjust. `.env` is git-ignored; Docker Compose auto-loads it.

---

## How it works

- **`shared`** — the frozen Zod `Vehicle` schema, filter/query types, and enums consumed by both server and web.
- **`server`** — Express + TypeScript. Cars are served from an in-memory store loaded from the validated `data/cars.json`; SQLite (via Prisma) holds only accounts, favorites, and cart items. Auth is email + password (bcrypt) with a JWT in an httpOnly, SameSite=Lax, Secure-in-prod cookie. Helmet, CSP, and rate-limited auth are on.
- **`web`** — React 18 + Vite + Tailwind SPA (React Query for server state). Styled spec cards (brand wordmark, body-style silhouette, powertrain accent) — no remote images.
- **Packaging** — one multi-stage image builds the SPA + server and runs `prisma migrate deploy` on start; GitHub Actions verifies (typecheck + data audit + tests + build) on every push/PR and publishes a multi-arch (amd64 + arm64) image to GHCR on `master`.

---

## Data provenance

The vehicle specifications in `data/cars.json` are **curated snapshots compiled on 2026-07-11**. Every field carries a source (`sources[]`) and an as-of date, and each record has a `dataAsOf` compile date. Specs — especially MSRP, federal tax-credit eligibility, EPA range/MPGe, and trim availability — change frequently and can vary by trim, options, and region.

**Always verify current pricing, incentives, and specifications with the manufacturer's official "Build & Price" page and your dealer before making a purchase decision.** VoltList links out to those official sources on every vehicle. This project is not affiliated with any manufacturer.
