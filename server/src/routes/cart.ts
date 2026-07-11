import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import type { CarStore } from "../carStore";

const CarIdSchema = z.object({ carId: z.string().min(1) });

async function listCartIds(userId: string): Promise<string[]> {
  const rows = await prisma.cartItem.findMany({ where: { userId }, orderBy: { addedAt: "asc" } });
  return rows.map((r) => r.carId);
}

export function cartRouter(store: CarStore): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req: AuthedRequest, res) => {
    res.json({ carIds: await listCartIds(req.userId!) });
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
    await prisma.cartItem.upsert({
      where: { userId_carId: { userId, carId } },
      create: { userId, carId },
      update: {},
    });
    res.json({ carIds: await listCartIds(userId) });
  });

  router.delete("/:carId", async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    await prisma.cartItem.deleteMany({ where: { userId, carId: req.params.carId } });
    res.json({ carIds: await listCartIds(userId) });
  });

  return router;
}
