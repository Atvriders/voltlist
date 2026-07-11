import { z } from "zod";

// Known weak/default JWT secrets that must never be used in production.
const BAD_JWT_SECRETS = ["change-me", "__CHANGE_ME__", "changeme", "secret"];

// Validated process environment. Parsed once at import; a missing JWT_SECRET is a
// hard failure so the server never boots with an insecure default. In production
// the secret must also be sufficiently strong (>= 32 chars, not a known default).
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URL: z.string().min(1).default("file:./data/voltlist.db"),
    CARS_PATH: z.string().min(1).default("data/cars.json"),
    // Mark the auth cookie `Secure` (HTTPS-only). Default false so the app works
    // when served over plain HTTP on a LAN; set COOKIE_SECURE=true behind TLS.
    COOKIE_SECURE: z
      .string()
      .optional()
      .transform((v) => v === "true"),
    // bcrypt work factor. 12 in prod; tests set a low value (BCRYPT_COST=4) so the
    // suite is fast and doesn't time out under CPU load.
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return;
    if (cfg.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be at least 32 characters in production",
      });
    }
    if (BAD_JWT_SECRETS.includes(cfg.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must not be a known default value in production",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

export const isProd = env.NODE_ENV === "production";
