import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db";
import { hashPassword, verifyPasswordConstantTime } from "./password";
import { signToken } from "./jwt";
import { requireAuth, setAuthCookie, clearAuthCookie, type AuthedRequest } from "./middleware";

const CredsSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Rate-limit only the mutating credential endpoints (/register, /login).
// Frequent SPA calls to GET /me and /logout are deliberately not limited.
// Generous enough for the test suite, tight enough to blunt credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

export function authRouter(): Router {
  const router = Router();

  router.post("/register", authLimiter, async (req, res) => {
    const parsed = CredsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
      return;
    }
    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const user = await prisma.user.create({ data: { email, password: await hashPassword(password) } });
    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user: { id: user.id, email: user.email } });
  });

  router.post("/login", authLimiter, async (req, res) => {
    const parsed = CredsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
      return;
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always run a bcrypt comparison (dummy hash when the user is missing) so the
    // no-such-user and wrong-password paths take comparable time and return the
    // same generic 401 — no account enumeration via status or timing.
    const passwordOk = await verifyPasswordConstantTime(password, user?.password);
    if (!user || !passwordOk) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    setAuthCookie(res, signToken(user.id));
    res.json({ user: { id: user.id, email: user.email } });
  });

  router.post("/logout", (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    res.json({ user: { id: user.id, email: user.email } });
  });

  return router;
}
