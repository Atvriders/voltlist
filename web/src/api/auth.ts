import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./client";

export interface SessionUser {
  id: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * GET /api/auth/me — resolves to the signed-in user or `null` when the
 * session cookie is missing/expired (401 is treated as "logged out", not an error).
 */
export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const res = await api<{ user: SessionUser }>("/api/auth/me");
        return res.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

/** POST /api/auth/login — sets the session cookie and primes the me cache. */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: Credentials) =>
      api<{ user: SessionUser }>("/api/auth/login", { method: "POST", json: creds }),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data.user);
      void qc.invalidateQueries();
    },
  });
}

/** POST /api/auth/register — creates the account and signs in. */
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: Credentials) =>
      api<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        json: creds,
      }),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.me, data.user);
      void qc.invalidateQueries();
    },
  });
}

/** POST /api/auth/logout — clears the cookie and resets user-scoped caches. */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null);
      void qc.invalidateQueries();
    },
  });
}
