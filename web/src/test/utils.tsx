import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../state/theme";
import { SessionProvider } from "../state/session";

/** Query client tuned for tests: no retries, no background refetch. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Wrapper factory for renderHook / pure react-query hook tests. */
export function createQueryWrapper(client = createTestQueryClient()) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

export interface ProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  client?: QueryClient;
}

/**
 * Render a component inside all app providers (React Query + Theme + Router +
 * Session). Session defaults to logged-out (MSW `/api/auth/me` → 401).
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", client = createTestQueryClient(), ...options }: ProvidersOptions = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          <SessionProvider>{children}</SessionProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
  return {
    user: userEvent.setup(),
    client,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
