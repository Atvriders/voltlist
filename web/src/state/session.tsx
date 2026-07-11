import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useMe } from "../api/auth";
import type { SessionUser } from "../api/auth";

export interface SessionValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

/**
 * Exposes the current auth session (backed by the `useMe` query cache) to the
 * app shell, protected routes, and any component that needs it.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMe();
  const value = useMemo<SessionValue>(
    () => ({
      user: data ?? null,
      isLoading,
      isAuthenticated: Boolean(data),
    }),
    [data, isLoading],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a <SessionProvider>");
  }
  return ctx;
}
