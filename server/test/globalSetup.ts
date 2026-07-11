import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { TEST_DB_PATH, TEST_DATABASE_URL } from "./testDb";

// Create a fresh SQLite schema for the whole test run using `prisma db push`
// (no migration history needed for tests). Runs once before any test file, and
// returns a teardown that removes this run's per-process DB files afterward.
export default function setup(): () => void {
  const dir = dirname(TEST_DB_PATH);
  const suffixes = ["", "-journal", "-wal", "-shm"];
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const suffix of suffixes) {
    rmSync(TEST_DB_PATH + suffix, { force: true });
  }
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
  return () => {
    for (const suffix of suffixes) {
      rmSync(TEST_DB_PATH + suffix, { force: true });
    }
  };
}
