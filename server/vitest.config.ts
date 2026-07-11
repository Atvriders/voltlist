import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./test/testDb";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Serialize test files: they share one SQLite file, reset per-test.
    fileParallelism: false,
    // Headroom so slow ops (bcrypt, SQLite writes) don't spuriously time out
    // under CPU load — the shared-DB suite was flaky at the default 5s.
    testTimeout: 20000,
    hookTimeout: 20000,
    globalSetup: ["./test/globalSetup.ts"],
    setupFiles: ["./test/setup.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-do-not-use-in-prod",
      DATABASE_URL: TEST_DATABASE_URL,
      // Fast hashing in tests (prod uses the default cost 12).
      BCRYPT_COST: "4",
    },
  },
});
