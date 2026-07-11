import bcrypt from "bcryptjs";
import { env } from "../env";

const COST = env.BCRYPT_COST;

// A fixed hash compared against when the target user does not exist, so the
// not-found and wrong-password login paths spend comparable CPU time and don't
// leak (via timing) whether an email is registered.
const DUMMY_HASH = bcrypt.hashSync("voltlist-dummy-password", COST);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Verify a password against a stored hash that may be absent. When `hash` is
 * null/undefined (user not found) a bcrypt comparison is still performed
 * against a dummy hash so timing matches the wrong-password path; the result is
 * always false in that case.
 */
export async function verifyPasswordConstantTime(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (hash == null) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
