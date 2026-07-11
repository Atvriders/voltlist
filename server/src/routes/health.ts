import { Router } from "express";
import type { CarStore } from "../carStore";

export function healthRouter(store: CarStore): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({ ok: true, cars: store.count });
  });
  return router;
}
