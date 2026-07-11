import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button, Input } from "../design/components";
import { useLogin } from "../api/auth";
import { ApiError } from "../api/client";
import { useSession } from "../state/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in datasheet. Email + password with client validation; server errors
 * are surfaced in the interface voice. On success we prime the session cache
 * (via `useLogin`) and return the driver to the Catalog.
 */
export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Already signed in — nothing to do here.
  if (isAuthenticated) return <Navigate to="/" replace />;

  const serverError =
    login.error instanceof ApiError
      ? login.error.message
      : login.isError
        ? "Something went wrong. Try again."
        : null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextEmailError = EMAIL_RE.test(email)
      ? null
      : "Enter a valid email address.";
    const nextPasswordError = password.length > 0 ? null : "Enter your password.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    login.mutate(
      { email, password },
      { onSuccess: () => navigate("/", { replace: true }) },
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">
          Access
        </p>
        <h1 className="mt-1 font-display text-28 font-bold leading-tight text-ink">
          Login
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in to sync your favorites, cart, and comparisons.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mt-5 rounded-control border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block font-mono text-xs uppercase tracking-[0.08em] text-ink-soft"
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(emailError)}
              aria-describedby={emailError ? "login-email-error" : undefined}
            />
            {emailError && (
              <p id="login-email-error" className="text-13 text-warn">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block font-mono text-xs uppercase tracking-[0.08em] text-ink-soft"
            >
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "login-password-error" : undefined
              }
            />
            {passwordError && (
              <p id="login-password-error" className="text-13 text-warn">
                {passwordError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          No account yet?{" "}
          <Link
            to="/register"
            className="font-medium text-voltage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
