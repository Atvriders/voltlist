import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, NavLink } from "react-router-dom";
import { SessionProvider, useSession } from "./state/session";
import { ThemeProvider, useTheme } from "./state/theme";
import { useFavorites } from "./api/favorites";
import { useCart } from "./api/cart";
import { useLogout } from "./api/auth";
import { AppRoutes } from "./router";
import { cx } from "./lib/cx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cx(
    "rounded-control px-2 py-1 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
    isActive ? "text-voltage" : "text-ink-soft hover:text-ink",
  );
}

function CountPill({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-voltage px-1.5 font-mono text-xs tabular-nums text-white">
      {n}
    </span>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-soft transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
          </g>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}

function TopNav() {
  const { isAuthenticated } = useSession();
  const { data: favorites } = useFavorites();
  const { data: cart } = useCart();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
        >
          VOLT<span className="font-mono text-voltage">LIST</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Catalog
          </NavLink>
          <NavLink to="/favorites" className={navLinkClass}>
            {() => (
              <span className="inline-flex items-center">
                Favorites
                <CountPill n={isAuthenticated ? (favorites?.length ?? 0) : 0} />
              </span>
            )}
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            {() => (
              <span className="inline-flex items-center">
                Cart
                <CountPill n={isAuthenticated ? (cart?.length ?? 0) : 0} />
              </span>
            )}
          </NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NavLink to="/account" className={navLinkClass}>
                Account
              </NavLink>
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="rounded-control px-2 py-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Log in
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <SessionProvider>
            <div className="min-h-screen bg-paper text-ink">
              <TopNav />
              <AppRoutes />
            </div>
          </SessionProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
