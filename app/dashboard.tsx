"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  createUserAction,
  deleteUserAction,
  logoutAction,
} from "@/app/actions";
import type { StoredUser, TestEnv } from "@/lib/provision/types";

type Props = {
  initialUsers: StoredUser[];
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="btn-ghost mono px-2.5 py-1 text-xs"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CopyableUsername({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(username);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="mono block max-w-full truncate text-left font-medium text-[var(--text)] transition hover:text-[var(--accent-strong)]"
      title="Click to copy username"
      aria-label={`Copy username ${username}`}
    >
      {copied ? "Copied!" : username}
    </button>
  );
}

function CredentialRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="cred">
      <div className="min-w-0">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          {label}
        </p>
        <p className="mono truncate text-sm font-medium text-[var(--text)]">
          {value}
        </p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

export function Dashboard({ initialUsers }: Props) {
  const [testEnv, setTestEnv] = useState<TestEnv>("dev");
  const [users, setUsers] = useState(initialUsers);
  const [latest, setLatest] = useState<StoredUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);

  const filtered = useMemo(
    () => users.filter((user) => user.testEnv === testEnv),
    [users, testEnv],
  );

  const onCreate = useCallback(() => {
    setError(null);
    setWarnings([]);
    startTransition(async () => {
      const result = await createUserAction(testEnv);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLatest(result.data);
      setUsers((prev) => [
        result.data,
        ...prev.filter((u) => u.username !== result.data.username),
      ]);
    });
  }, [testEnv]);

  const onDelete = useCallback((user: StoredUser) => {
    setError(null);
    setWarnings([]);
    setDeletingUsername(user.username);
    startTransition(async () => {
      const result = await deleteUserAction(user);
      setDeletingUsername(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.warnings.length > 0) {
        setWarnings(result.data.warnings);
      }
      setUsers((prev) => prev.filter((u) => u.username !== user.username));
      setLatest((current) =>
        current?.username === user.username ? null : current,
      );
    });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-6 py-10">
      <header className="animate-fade-up flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="brand-mark mb-3">User Generator</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] md:text-[2.15rem]">
            Fresh Aurora users
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
            Provision Digital Banking + Transmit test users. Secrets stay on the
            server; credentials surface only after you authenticate.
          </p>
        </div>
        <form action={logoutAction} className="pt-1">
          <button type="submit" className="btn-ghost px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </header>

      <section
        className="panel animate-fade-up p-6 md:p-7"
        style={{ animationDelay: "70ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="status-dot" />
              <h2 className="text-lg font-semibold tracking-tight">
                Create user
              </h2>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Pattern{" "}
              <code className="mono text-[var(--accent-strong)]">
                mobileaurora_*********
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="seg" role="group" aria-label="Environment">
              {(["dev", "tst"] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setTestEnv(env)}
                  data-active={testEnv === env}
                  className="seg-btn"
                >
                  {env}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onCreate}
              disabled={isPending}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              {isPending && !deletingUsername ? (
                <span className="animate-pulse-soft">Provisioning…</span>
              ) : (
                "Create user"
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        {warnings.length > 0 ? (
          <p className="mt-5 rounded-xl border border-[var(--warn)]/25 bg-[var(--warn-soft)] px-3 py-2.5 text-sm text-[var(--warn)]">
            Deleted with warnings: {warnings.join("; ")}
          </p>
        ) : null}

        {latest ? (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <CredentialRow label="Username" value={latest.username} />
            <CredentialRow label="Password" value={latest.password} />
            <CredentialRow
              label="External user ID"
              value={latest.externalUserId}
            />
            <CredentialRow label="Environment" value={latest.testEnv} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--bg-inset)]/60 px-4 py-8 text-center text-sm text-[var(--muted)]">
            Credentials will appear here after a successful create.
          </div>
        )}
      </section>

      <section
        className="panel animate-fade-up p-6 md:p-7"
        style={{ animationDelay: "130ms" }}
      >
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Registry · {testEnv}
          </h2>
          <p className="mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            {filtered.length} stored
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--stroke-strong)] px-4 py-12 text-center text-[var(--muted)]">
            No users stored for {testEnv} yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--stroke)]">
            {filtered.map((user) => (
              <li
                key={`${user.testEnv}-${user.username}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1 last:pb-1"
              >
                <div className="min-w-0">
                  <CopyableUsername username={user.username} />
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {new Date(user.createdAt).toLocaleString()} ·{" "}
                    <span className="mono">
                      {user.externalUserId.slice(0, 8)}…
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    disabled={isPending}
                    className="btn-danger px-3 py-1.5 text-sm"
                  >
                    {deletingUsername === user.username
                      ? "Deleting…"
                      : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
