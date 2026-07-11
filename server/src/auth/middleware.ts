import type { Request, Response, NextFunction } from "express";
import type { CookieOptions } from "express";
import { COOKIE_NAME, COOKIE_MAX_AGE_MS, verifyToken } from "./jwt";
import { env } from "../env";

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Guards a route: requires a valid `token` cookie, sets req.userId, else 401. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token: unknown = (req.cookies as Record<string, unknown> | undefined)?.[COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  req.userId = payload.userId;
  next();
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: env.COOKIE_SECURE, path: "/" });
}
