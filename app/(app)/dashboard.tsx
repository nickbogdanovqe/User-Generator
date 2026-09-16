"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { createUserAction, deleteUserAction } from "@/app/actions";
import { CredentialRow } from "@/app/ui/credentials";
import { envTagClass, useTestEnv } from "@/app/ui/env-context";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  InfoIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  Spinner,
  TrashIcon,
  UsersIcon,
} from "@/app/ui/icons";
import { PageHeader } from "@/app/ui/page-header";
import type { StoredUser } from "@/lib/provision/types";
import { SEED_IDS } from "@/lib/provision/draft";

type Props = {
  initialUsers: StoredUser[];
  listError: string | null;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
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
      className="group/btn mono inline-flex max-w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]"
      title="Click to copy username"
      aria-label={`Copy username ${username}`}
    >
      <span className="truncate">{username}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 font-sans text-[0.62rem] font-medium uppercase tracking-wider transition ${
          copied
            ? "bg-[var(--ok-soft)] text-[#6ee7b7]"
            : "bg-[var(--bg-inset)] text-[var(--muted)] opacity-0 group-hover/btn:opacity-100"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
  tone: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      data-active={active ? "true" : undefined}
      className={`metric-card text-left ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className={`icon-tile ${tone}`}>{icon}</span>
      </div>
      <p className="metric-value mt-3">{value}</p>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>
    </Tag>
  );
}

export function Dashboard({ initialUsers, listError }: Props) {
  const { testEnv, setTestEnv } = useTestEnv();
  const [username, setUsername] = useState("");
  const [ecifId, setEcifId] = useState("");
  const [interposeId, setInterposeId] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [latest, setLatest] = useState<StoredUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);

  const devCount = useMemo(() => users.filter((u) => u.testEnv === "dev").length, [users]);
  const tstCount = useMemo(() => users.filter((u) => u.testEnv === "tst").length, [users]);
  const lastCreated = useMemo(
    () =>
      users
        .filter((u) => u.testEnv === testEnv)
        .reduce<StoredUser | null>(
          (acc, u) =>
            !acc || new Date(u.createdAt) > new Date(acc.createdAt) ? u : acc,
          null,
        ),
    [users, testEnv],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((user) => user.testEnv === testEnv)
      .filter(
        (user) =>
          !q ||
          user.username.toLowerCase().includes(q) ||
          user.externalUserId.toLowerCase().includes(q),
      );
  }, [users, testEnv, query]);

  const onCreate = useCallback(() => {
    setError(null);
    setWarnings([]);
    startTransition(async () => {
      const result = await createUserAction({
        testEnv,
        username: username.trim() || undefined,
        ecifId: ecifId.trim() || undefined,
        interposeId: interposeId.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLatest(result.data);
      setUsername("");
      setUsers((prev) => [
        result.data,
        ...prev.filter((u) => u.username !== result.data.username),
      ]);
    });
  }, [testEnv, username, ecifId, interposeId]);

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
      if (result.data.warnings.length > 0) setWarnings(result.data.warnings);
      setUsers((prev) => prev.filter((u) => u.username !== user.username));
      setLatest((current) => (current?.username === user.username ? null : current));
    });
  }, []);

  const ENV = testEnv.toUpperCase();
  const creating = isPending && !deletingUsername;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow="Fresh Aurora users"
        title="Provision & manage test users"
        description="Create Digital Banking + Transmit users with Aurora migration flags, then keep credentials in a private registry. Secrets never leave the server."
        actions={
          <>
            <span className={envTagClass(testEnv)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Scope {ENV}
            </span>
            <button
              type="button"
              onClick={onCreate}
              disabled={isPending}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              {creating ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {creating ? `Provisioning in ${ENV}…` : `Provision user in ${ENV}`}
            </button>
          </>
        }
      />

      {listError ? (
        <div className="banner banner-warn animate-fade-up">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Blob list unavailable ({listError}). You can still create users once
            <span className="mono"> BLOB_READ_WRITE_TOKEN</span> is configured.
          </span>
        </div>
      ) : null}

      <section
        className="animate-fade-up grid gap-3 sm:grid-cols-3"
        style={{ animationDelay: "60ms" }}
      >
        <Metric
          label="Stored in DEV"
          value={devCount}
          hint="Transmit username + password auth"
          icon={<UsersIcon className="h-4 w-4" />}
          tone="icon-tile-ok"
          active={testEnv === "dev"}
          onClick={() => setTestEnv("dev")}
        />
        <Metric
          label="Stored in TST"
          value={tstCount}
          hint="Username omitted on Transmit create"
          icon={<LayersIcon className="h-4 w-4" />}
          tone="icon-tile-signal"
          active={testEnv === "tst"}
          onClick={() => setTestEnv("tst")}
        />
        <Metric
          label={`Last provisioned · ${ENV}`}
          value={lastCreated ? relativeTime(lastCreated.createdAt) : "—"}
          hint={lastCreated ? lastCreated.username : "Nothing provisioned yet"}
          icon={<ClockIcon className="h-4 w-4" />}
          tone="icon-tile-accent"
        />
      </section>

      <section
        className="animate-fade-up grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        style={{ animationDelay: "110ms" }}
      >
        <div className="panel panel-highlight flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="status-dot" />
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                  Provision
                </h2>
                <span className={envTagClass(testEnv)}>Targeting {ENV}</span>
              </div>
              <p className="hint mt-1.5">
                Username defaults to{" "}
                <code className="mono rounded-md bg-[var(--bg-inset)] px-1.5 py-0.5 text-[0.72rem] font-semibold text-[var(--accent-strong)]">
                  mobileaurora_&lt;16 digits&gt;
                </code>{" "}
                (epoch ms + 3 random) unless you set one.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="label">
                Username <span className="font-normal normal-case tracking-normal">(optional)</span>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mobileaurora_<16 digits>"
                maxLength={64}
                className="field mono px-3.5 py-2.5 text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="hint">
                Letters, digits, period, underscore, hyphen (3–64). Empty = auto-generate.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  ECIF ID <span className="font-normal normal-case tracking-normal">(optional)</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ecifId}
                  onChange={(e) => setEcifId(e.target.value)}
                  placeholder={SEED_IDS.ecifId}
                  className="field mono px-3.5 py-2.5 text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="hint">Seed default if empty. Often not persisted by Digital Banking.</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  Interpose ID <span className="font-normal normal-case tracking-normal">(optional)</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={interposeId}
                  onChange={(e) => setInterposeId(e.target.value)}
                  placeholder={SEED_IDS.interpose}
                  className="field mono px-3.5 py-2.5 text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="hint">Must be a real customer interpose; it drives login lookup.</span>
              </label>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--stroke)] pt-4">
            <p className="hint flex items-center gap-1.5">
              <InfoIcon className="h-3.5 w-3.5" />
              Password is fixed: <span className="mono text-[var(--text)]">Bank1234567!</span>
            </p>
            <button
              type="button"
              onClick={onCreate}
              disabled={isPending}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              {creating ? <Spinner className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              {creating ? "Provisioning…" : `Provision in ${ENV}`}
            </button>
          </div>

          {error ? (
            <div className="banner banner-danger" role="alert">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div className="banner banner-warn" role="status">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Deleted with warnings: {warnings.join("; ")}</span>
            </div>
          ) : null}
        </div>

        <div className={`panel flex flex-col p-6 ${latest ? "panel-glow" : ""}`}>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--stroke)] pb-4">
            <div className="flex items-center gap-2">
              {latest ? (
                <span className="icon-tile icon-tile-ok h-7 w-7 rounded-lg">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="icon-tile h-7 w-7 rounded-lg">
                  <UsersIcon className="h-3.5 w-3.5" />
                </span>
              )}
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                {latest ? "Latest credentials" : "Credentials"}
              </h2>
            </div>
            {latest ? (
              <span className="mono text-[0.7rem] text-[var(--muted)]">
                {new Date(latest.createdAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          {latest ? (
            <div className="mt-4 grid gap-2.5">
              <CredentialRow label="Username" value={latest.username} hint="Digital Banking login" />
              <CredentialRow label="Password" value={latest.password} />
              <CredentialRow label="External user ID" value={latest.externalUserId} />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <CredentialRow label="Environment" value={latest.testEnv.toUpperCase()} />
                {latest.interposeId ? (
                  <CredentialRow label="Interpose ID" value={latest.interposeId} />
                ) : null}
              </div>
              {latest.ecifId ? (
                <CredentialRow label="ECIF ID (requested)" value={latest.ecifId} />
              ) : null}
            </div>
          ) : (
            <div className="empty mt-4 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="icon-tile icon-tile-accent mb-3 h-11 w-11 rounded-2xl">
                <PlusIcon className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-[var(--text)]">No credentials yet</p>
              <p className="hint mt-1 max-w-[16rem]">
                Provision a user in {ENV} and the login, password, and IDs will land here, ready to copy.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className="panel animate-fade-up p-6"
        style={{ animationDelay: "160ms" }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--stroke)] pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              Registry
            </h2>
            <span className={envTagClass(testEnv)}>{ENV}</span>
            <span className="tag tag-neutral">
              {filtered.length} {filtered.length === 1 ? "user" : "users"}
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-2)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by username or GUID…"
              className="field py-2 pl-9 pr-3 text-sm"
              aria-label="Filter registry"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty flex flex-col items-center px-4 py-12 text-center">
            <span className="icon-tile mb-3 h-11 w-11 rounded-2xl">
              <UsersIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-[var(--text)]">
              {query ? "No matches" : `No users stored for ${ENV} yet`}
            </p>
            <p className="hint mt-1">
              {query
                ? "Try a different username or GUID fragment."
                : `Use “Provision user in ${ENV}” to create the first one.`}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((user) => (
              <li
                key={`${user.testEnv}-${user.username}`}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`avatar-badge !h-9 !w-9 !rounded-xl text-[0.65rem] ${
                      user.testEnv === "dev" ? "tag-retail" : "env-tag-tst"
                    }`}
                  >
                    {user.testEnv.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <CopyableUsername username={user.username} />
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted)]">
                      <span>
                        {new Date(user.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="kbd">GUID {user.externalUserId.slice(0, 8)}…</span>
                      {user.interposeId ? (
                        <span className="kbd">Interpose …{user.interposeId.slice(-6)}</span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(user)}
                  disabled={isPending}
                  className="btn-danger flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                  aria-label={`Delete user ${user.username}`}
                >
                  {deletingUsername === user.username ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <TrashIcon className="h-3.5 w-3.5" />
                  )}
                  {deletingUsername === user.username ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
