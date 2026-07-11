import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Single source of truth for the ephemeral test database location, shared by
// vitest.config.ts (env), globalSetup (schema push), and setup (per-test reset).
// The filename is unique per process so concurrent `npm test` invocations never
// share one SQLite file and clobber each other's rows (a prior flakiness source).
const here = dirname(fileURLToPath(import.meta.url));
export const TEST_DB_PATH = resolve(here, "..", "prisma", `test-${process.pid}.db`);
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;
