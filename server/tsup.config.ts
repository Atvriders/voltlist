import { defineConfig } from "tsup";

// Bundle the server to a single CJS file. @voltlist/shared is a workspace package
// whose "main" points at raw .ts source, so it MUST be bundled (noExternal) rather
// than left as a runtime require. Everything else in node_modules stays external.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  dts: false,
  noExternal: ["@voltlist/shared"],
});
