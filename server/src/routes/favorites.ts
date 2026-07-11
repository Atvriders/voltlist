import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import type { CarStore } from "../carStore";

const CarIdSchema = z.object({ carId: z.string().min(1) });

async function listFavoriteIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({ where: { userId }, orderBy: { id: "asc" } });
  return rows.map((r) => r.carId);
}

export function favoritesRouter(store: CarStore): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req: AuthedRequest, res) => {
    res.json({ carIds: await listFavoriteIds(req.userId!) });
  });

  router.post("/", async (req: AuthedRequest, res) => {
    const parsed = CarIdSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
      return;
    }
    const { carId } = parsed.data;
    if (!store.byId(carId)) {
      res.status(404).json({ error: `Unknown carId: ${carId}` });
      return;
    }
    const userId = req.userId!;
    await prisma.favorite.upsert({
      where: { userId_carId: { userId, carId } },
      create: { userId, carId },
      update: {},
    });
    res.json({ carIds: await listFavoriteIds(userId) });
  });

  router.delete("/:carId", async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    await prisma.favorite.deleteMany({ where: { userId, carId: req.params.carId } });
    res.json({ carIds: await listFavoriteIds(userId) });
  });

  return router;
}
