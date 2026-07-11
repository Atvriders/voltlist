import { useNavigate } from "react-router-dom";
import { Button } from "../design/components";
import { useLogout } from "../api/auth";
import { useSession } from "../state/session";

/**
 * Account datasheet. Protected route, so `user` is present; shows the signed-in
 * email as an instrument readout and lets the driver log out (which clears the
 * session cache and returns them to the Catalog).
 */
export default function Account() {
  const navigate = useNavigate();
  const { user } = useSession();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/", { replace: true }),
    });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">
          Account
        </p>
        <h1 className="mt-1 font-display text-28 font-bold leading-tight text-ink">
          Your account
        </h1>

        <dl className="mt-6 rounded-control border border-line bg-surface-2 px-4 py-3">
          <dt className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">
            Signed in as
          </dt>
          <dd className="mt-1 break-all font-mono text-base text-ink">
            {user?.email ?? "—"}
          </dd>
        </dl>

        <div className="mt-6">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </div>
    </main>
  );
}
