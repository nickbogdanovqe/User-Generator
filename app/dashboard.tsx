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
      className="rounded-lg border border-[var(--stroke)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--stroke)] bg-black/20 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <p
          className="truncate font-medium"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="mb-1 text-sm uppercase tracking-[0.22em] text-[var(--accent)]"
            style={{ fontFamily: "var(--font-brand), serif" }}
          >
            User Generator
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Fresh Aurora users
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Create and clean up Digital Banking + Transmit test users. Secrets
            stay on the server; credentials appear only after you authenticate.
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl border border-[var(--stroke)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="animate-fade-up rounded-3xl border border-[var(--stroke)] bg-[var(--bg-panel)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md [animation-delay:80ms]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Create user</h2>
            <p className="text-sm text-[var(--muted)]">
              Username pattern{" "}
              <code
                className="text-[var(--accent)]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                mobileaurora_*********
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex rounded-xl border border-[var(--stroke)] bg-black/20 p-1"
              role="group"
              aria-label="Environment"
            >
              {(["dev", "tst"] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setTestEnv(env)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    testEnv === env
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onCreate}
              disabled={isPending}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-[#1a1508] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {isPending && !deletingUsername ? (
                <span className="animate-pulse-soft">Creating…</span>
              ) : (
                "Create user"
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        {warnings.length > 0 ? (
          <p className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
            Deleted with warnings: {warnings.join("; ")}
          </p>
        ) : null}

        {latest ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <CredentialRow label="Username" value={latest.username} />
            <CredentialRow label="Password" value={latest.password} />
            <CredentialRow label="External user ID" value={latest.externalUserId} />
            <CredentialRow label="Environment" value={latest.testEnv} />
          </div>
        ) : null}
      </section>

      <section className="animate-fade-up rounded-3xl border border-[var(--stroke)] bg-[var(--bg-panel)] p-6 [animation-delay:140ms]">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Saved users ({testEnv})</h2>
          <p className="text-sm text-[var(--muted)]">
            {filtered.length} stored
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--stroke)] px-4 py-10 text-center text-[var(--muted)]">
            No users saved for {testEnv} yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--stroke)]">
            {filtered.map((user) => (
              <li
                key={`${user.testEnv}-${user.username}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p
                    className="truncate font-medium"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                  >
                    {user.username}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(user.createdAt).toLocaleString()} ·{" "}
                    <span style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {user.externalUserId.slice(0, 8)}…
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton value={user.username} label="username" />
                  <CopyButton value={user.password} label="password" />
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    disabled={isPending}
                    className="rounded-xl border border-[var(--danger)]/40 px-3 py-1.5 text-sm text-[var(--danger)] transition hover:bg-[var(--danger)]/10 disabled:opacity-60"
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
