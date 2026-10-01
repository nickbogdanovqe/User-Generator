"use client";

import { useCallback, useState, useTransition } from "react";
import { userStateAction } from "@/app/actions";
import { envTagClass, useTestEnv } from "@/app/ui/env-context";
import { AlertIcon, InfoIcon, LockIcon, SearchIcon, Spinner } from "@/app/ui/icons";
import { PageHeader } from "@/app/ui/page-header";
import type { UserStateMutation, UserStateSnapshot } from "@/lib/provision/user-state";

const ACTIONS: { id: UserStateMutation; label: string; danger?: boolean }[] = [
  { id: "recover", label: "Recover / unblock" },
  { id: "lock", label: "Lock", danger: true },
  { id: "aurora", label: "Convert to Aurora" },
  { id: "d3Eligible", label: "Convert to D3 eligible" },
  { id: "d3Ineligible", label: "Convert to D3 ineligible" },
  { id: "d3Failed", label: "Convert to D3 eligible, migration failed" },
];

function flagText(value: string | boolean | undefined): string {
  if (value === undefined || value === "") return "—";
  return String(value);
}

function Flag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-inset)] px-3.5 py-3">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mono mt-1 truncate text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

export function UserStatePanel() {
  const { testEnv } = useTestEnv();
  const [username, setUsername] = useState("");
  const [snapshot, setSnapshot] = useState<UserStateSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ENV = testEnv.toUpperCase();

  const run = useCallback(
    (operation: "lookup" | UserStateMutation) => {
      const login = username.trim();
      if (!login) {
        setError("Username is required");
        return;
      }
      setError(null);
      setPendingOp(operation);
      startTransition(async () => {
        const result = await userStateAction({
          testEnv,
          username: login,
          operation,
        });
        setPendingOp(null);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSnapshot(result.data);
      });
    },
    [testEnv, username],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow="Existing users"
        title="Recover, lock, and convert"
        description="Look up a Digital Banking login and change its lockout or migration state. Dev and TST share the same Digital Banking API. Nothing is written to the registry."
        actions={
          <span className={envTagClass(testEnv)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Scope {ENV}
          </span>
        }
      />

      <section className="panel panel-highlight flex flex-col gap-5 p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              Username
            </h2>
            <span className={envTagClass(testEnv)}>Targeting {ENV}</span>
          </div>
          <p className="hint mt-1.5">
            Any existing login. Letters, digits, period, underscore, or hyphen (3–64).
          </p>
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            run("lookup");
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="label">Login</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="rockyretail1.balboa"
              maxLength={64}
              className="field mono px-3.5 py-2.5 text-sm"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <button
            type="submit"
            disabled={isPending || username.trim().length === 0}
            className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            {isPending && pendingOp === "lookup" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            {isPending && pendingOp === "lookup" ? "Looking up…" : "Look up"}
          </button>
        </form>

        <div className="border-t border-[var(--stroke)] pt-4">
          <p className="label mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((action) => {
              const running = isPending && pendingOp === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={isPending || username.trim().length === 0}
                  onClick={() => run(action.id)}
                  className={`${
                    action.danger ? "btn-danger" : "btn-ghost"
                  } flex items-center gap-2 px-3.5 py-2 text-sm`}
                >
                  {running ? <Spinner className="h-4 w-4" /> : null}
                  {action.id === "lock" && !running ? (
                    <LockIcon className="h-4 w-4" />
                  ) : null}
                  {running ? "Working…" : action.label}
                </button>
              );
            })}
          </div>
          <p className="hint mt-3 flex items-start gap-1.5">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Recover clears a Digital Banking lockout. Conversions patch user flags one at a
            time. The result is labeled with the selected environment.
          </p>
        </div>

        {error ? (
          <div className="banner banner-danger" role="alert">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </section>

      {snapshot ? (
        <section className="panel flex flex-col gap-4 p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              Current state
            </h2>
            <span className={envTagClass(snapshot.testEnv)}>
              Recorded for {snapshot.testEnv.toUpperCase()}
            </span>
          </div>
          {snapshot.operationStatus ? (
            <div
              className="flex items-start gap-2.5 rounded-xl border border-[var(--ok-border)] bg-[var(--ok-soft)] px-3.5 py-3 text-sm text-[var(--ok-text)]"
              role="status"
            >
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Digital Banking{" "}
                {snapshot.operation === "lock" ? "lock" : "recovery"} status:{" "}
                <span className="mono">{snapshot.operationStatus}</span>
              </span>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Flag label="Username" value={snapshot.username} />
            <Flag label="GUID" value={snapshot.guid} />
            <Flag label="auroraUser" value={flagText(snapshot.flags.auroraUser)} />
            <Flag
              label="migrationEligible"
              value={flagText(snapshot.flags.migrationEligible)}
            />
            <Flag
              label="migrationMandatory"
              value={flagText(snapshot.flags.migrationMandatory)}
            />
            <Flag
              label="migrationStatus"
              value={flagText(snapshot.flags.migrationStatus)}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
