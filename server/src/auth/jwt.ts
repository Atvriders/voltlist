import jwt from "jsonwebtoken";
import { env } from "../env";

export const COOKIE_NAME = "token";
export const TOKEN_TTL = "7d";
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof decoded === "object" && decoded !== null && typeof (decoded as { userId?: unknown }).userId === "string") {
      return { userId: (decoded as { userId: string }).userId };
    }
    return null;
  } catch {
    return null;
  }
}
