import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button, Input } from "../design/components";
import { useRegister } from "../api/auth";
import { ApiError } from "../api/client";
import { useSession } from "../state/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/**
 * New-account datasheet. Mirrors Login but enforces the server's minimum
 * password length client-side (8 chars) and surfaces the duplicate-email 409
 * in the interface voice. On success we sign in and return to the Catalog.
 */
export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const register = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const serverError =
    register.error instanceof ApiError
      ? register.error.message
      : register.isError
        ? "Something went wrong. Try again."
        : null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextEmailError = EMAIL_RE.test(email)
      ? null
      : "Enter a valid email address.";
    const nextPasswordError =
      password.length >= MIN_PASSWORD
        ? null
        : `Use at least ${MIN_PASSWORD} characters.`;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    register.mutate(
      { email, password },
      { onSuccess: () => navigate("/", { replace: true }) },
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">
          New account
        </p>
        <h1 className="mt-1 font-display text-28 font-bold leading-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Save vehicles across devices and build a shortlist to compare.
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
              htmlFor="register-email"
              className="block font-mono text-xs uppercase tracking-[0.08em] text-ink-soft"
            >
              Email
            </label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(emailError)}
              aria-describedby={
                emailError ? "register-email-error" : undefined
              }
            />
            {emailError && (
              <p id="register-email-error" className="text-13 text-warn">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="register-password"
              className="block font-mono text-xs uppercase tracking-[0.08em] text-ink-soft"
            >
              Password
            </label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError
                  ? "register-password-error"
                  : "register-password-hint"
              }
            />
            {passwordError ? (
              <p id="register-password-error" className="text-13 text-warn">
                {passwordError}
              </p>
            ) : (
              <p id="register-password-hint" className="text-13 text-ink-soft">
                At least {MIN_PASSWORD} characters.
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-voltage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
