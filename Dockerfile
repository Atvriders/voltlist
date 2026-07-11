# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# VoltList — single multi-stage image: build the SPA + server, then ship a
# node:20-bookworm-slim runtime (Debian: glibc + OpenSSL 3.0) that serves the
# API and the built SPA from one process on port 8080. SQLite lives on a
# mounted volume at /data.
#
# Debian (not Alpine) is used deliberately: Prisma's engine + OpenSSL detection
# is reliable on glibc/OpenSSL-3, whereas Alpine/musl mis-detects OpenSSL and
# then fails to fetch a matching engine as the non-root user at runtime.
# ---------------------------------------------------------------------------

# ---- Stage 1: builder -----------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# openssl + ca-certificates so the Prisma postinstall can fetch engines over
# HTTPS and `prisma generate` can detect the OpenSSL version correctly.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install workspace manifests first so `npm ci` is cached across source edits.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY web/package.json ./web/

# Full install (incl. dev deps: tsup, vite, prisma CLI) for the build.
RUN npm ci

# Copy the rest of the source (node_modules/dist excluded via .dockerignore).
COPY . .

# Generate the Prisma client (server imports @prisma/client at build + runtime),
# then build the shared-consumers: server (tsup -> dist CJS) and web (vite -> dist).
# Finally, prune dev dependencies (tsup/vite/vitest/typescript/@types/prettier)
# so the runtime stage inherits a production-only node_modules. This runs AFTER
# generate + builds because tsup/vite are dev deps. The generated Prisma client
# survives the prune: @prisma/client and prisma are PRODUCTION deps of the server,
# and node_modules/.prisma (generate output) is a hidden dir npm prune keeps.
RUN npx prisma generate --schema=server/prisma/schema.prisma \
 && npm run build -w server \
 && npm run build -w web \
 && npm prune --omit=dev

# ---- Stage 2: runtime -----------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL=file:/data/voltlist.db \
    CARS_PATH=/app/data/cars.json

# openssl -> Prisma engine detection at runtime (migrate + query engines);
# ca-certificates -> TLS; curl -> HEALTHCHECK. /data holds the SQLite volume.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /data

# The production-only node_modules (dev deps pruned in the builder) carries the
# generated Prisma client, @prisma/client, and the Prisma CLI (invoked by the
# server's runMigrations() at boot) with the correct debian-openssl-3.0.x engines.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/data/cars.json ./data/cars.json
COPY --from=builder /app/package.json ./package.json

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Own the app tree and the data dir as the non-root user BEFORE declaring the
# volume, so (a) the named volume is initialized with node ownership and (b) any
# Prisma runtime write (e.g. engine cache) succeeds without root.
RUN chown -R node:node /app /data

USER node
EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Entrypoint ensures /data exists then execs the server, which applies pending
# Prisma migrations itself on startup (see server/src/index.ts runMigrations()).
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
