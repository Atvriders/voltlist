import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useSession } from "./state/session";
import Catalog from "./pages/Catalog";
import CarDetail from "./pages/CarDetail";
import Compare from "./pages/Compare";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";

/** Redirects to /login when the visitor is not authenticated. */
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useSession();
  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 text-ink-soft">Loading…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/car/:id" element={<CarDetail />} />
      <Route path="/compare" element={<Compare />} />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
