import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { cartToCsv } from "../export/csv";
import { cartToPdf } from "../export/pdf";
import type { CarStore } from "../carStore";
import type { Vehicle } from "@voltlist/shared";

const FormatSchema = z.enum(["csv", "pdf"]);

/** Normalize an ?ids= querystring value (string | string[] | undefined) to string[]. */
function idsFromQuery(value: unknown): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.flatMap((x) => String(x).split(",")).map((s) => s.trim()).filter(Boolean);
}

export function exportRouter(store: CarStore): Router {
  const router = Router();

  // PUBLIC (no auth): export exactly the vehicles named in ?ids= — the Compare
  // page's deep-linked selection, independent of any user's cart. Must be
  // registered before requireAuth below.
  router.get("/compare", async (req, res) => {
    const parsed = FormatSchema.safeParse(req.query.format);
    if (!parsed.success) {
      res.status(400).json({ error: "format must be 'csv' or 'pdf'" });
      return;
    }
    const format = parsed.data;

    const ids = idsFromQuery(req.query.ids);
    if (ids.length === 0) {
      res.status(400).json({ error: "ids is required" });
      return;
    }

    const vehicles: Vehicle[] = [];
    for (const id of ids) {
      const v = store.byId(id);
      if (!v) {
        res.status(404).json({ error: `Unknown carId: ${id}` });
        return;
      }
      vehicles.push(v);
    }
    const capped = vehicles.slice(0, 4);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="voltlist-compare.csv"');
      res.send(cartToCsv(capped));
      return;
    }

    const pdf = await cartToPdf(capped);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="voltlist-compare.pdf"');
    res.send(pdf);
  });

  router.use(requireAuth);

  router.get("/cart", async (req: AuthedRequest, res) => {
    const parsed = FormatSchema.safeParse(req.query.format);
    if (!parsed.success) {
      res.status(400).json({ error: "format must be 'csv' or 'pdf'" });
      return;
    }
    const format = parsed.data;

    const rows = await prisma.cartItem.findMany({
      where: { userId: req.userId! },
      orderBy: { addedAt: "asc" },
    });
    const vehicles = rows
      .map((r) => store.byId(r.carId))
      .filter((v): v is Vehicle => v !== undefined);

    if (vehicles.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="voltlist-cart.csv"');
      res.send(cartToCsv(vehicles));
      return;
    }

    const pdf = await cartToPdf(vehicles);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="voltlist-cart.pdf"');
    res.send(pdf);
  });

  return router;
}
