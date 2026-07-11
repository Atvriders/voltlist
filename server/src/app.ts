import path from "node:path";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { isProd } from "./env";
import type { CarStore } from "./carStore";
import { healthRouter } from "./routes/health";
import { carsRouter, compareRouter } from "./routes/cars";
import { authRouter } from "./auth/routes";
import { favoritesRouter } from "./routes/favorites";
import { cartRouter } from "./routes/cart";
import { exportRouter } from "./routes/export";

export interface CreateAppOptions {
  /** Serve the built SPA + SPA fallback. Defaults to NODE_ENV === "production". */
  serveStatic?: boolean;
  /** Path to the built web assets (web/dist). */
  webDistPath?: string;
}

export function createApp(store: CarStore, opts: CreateAppOptions = {}): Express {
  const serveStatic = opts.serveStatic ?? isProd;
  const webDistPath = opts.webDistPath ?? path.resolve(process.cwd(), "web", "dist");

  const app = express();
  app.disable("x-powered-by");
  // Keep helmet's protections, but drop `upgrade-insecure-requests`: VoltList is
  // typically served over plain HTTP on a LAN (e.g. http://host:3021), and that
  // directive would make the browser force every asset request to HTTPS — which
  // has no listener — leaving a blank page. Behind a TLS proxy this is still safe.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "upgrade-insecure-requests": null,
        },
      },
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // API
  app.use("/api/health", healthRouter(store));
  app.use("/api/cars", carsRouter(store));
  app.use("/api/compare", compareRouter(store));
  app.use("/api/auth", authRouter());
  app.use("/api/favorites", favoritesRouter(store));
  app.use("/api/cart", cartRouter(store));
  app.use("/api/export", exportRouter(store));

  // Any unmatched /api route → JSON 404 (never fall through to the SPA).
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  if (serveStatic) {
    app.use(express.static(webDistPath));
    // SPA fallback: any non-/api GET returns index.html.
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  // JSON error handler (last).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // Malformed JSON body from express.json surfaces here.
    if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
