#!/bin/sh
# VoltList container entrypoint.
# 1. Ensure the SQLite data directory exists (named volume mounts at /data).
# 2. Hand off (exec) to the server so it becomes PID 1 and receives signals.
#
# NOTE: Pending Prisma migrations are applied by the server process itself on
# startup (runMigrations() in server/src/index.ts). We deliberately do NOT run
# `prisma migrate deploy` here — doing so would apply migrations twice per boot.
set -e

mkdir -p /data

echo "[voltlist] Starting server on port ${PORT:-8080}..."
exec node server/dist/index.js
