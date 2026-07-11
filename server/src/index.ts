import path from "node:path";
import { execFileSync } from "node:child_process";
import { env } from "./env";
import { loadCars, CarStore } from "./carStore";
import { createApp } from "./app";

function runMigrations(): void {
  // Apply committed migrations to the (possibly empty) SQLite volume. The prisma
  // schema lives at server/prisma/schema.prisma; the runtime cwd is the repo/app
  // root (see Dockerfile + docker-entrypoint.sh), so pass the schema explicitly
  // rather than relying on prisma's default ./prisma/schema.prisma discovery.
  const schemaPath = path.resolve(process.cwd(), "server", "prisma", "schema.prisma");
  try {
    execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", schemaPath], {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (err) {
    console.error("prisma migrate deploy failed:", err);
    process.exit(1);
  }
}

function main(): void {
  runMigrations();

  const carsPath = path.resolve(process.cwd(), env.CARS_PATH);
  const store = new CarStore(loadCars(carsPath));
  console.log(`Loaded ${store.count} vehicles from ${carsPath}`);

  const app = createApp(store);
  app.listen(env.PORT, () => {
    console.log(`VoltList server listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

main();
