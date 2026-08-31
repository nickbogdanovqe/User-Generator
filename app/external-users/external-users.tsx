"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { CopyableField } from "@/app/ui/credentials";
import {
  countExternalProfiles,
  EXTERNAL_PODS,
  EXTERNAL_SEGMENTS,
  type ExternalProfile,
  type ExternalUserGroup,
} from "@/lib/external-users/catalog";
import type { TestEnv } from "@/lib/provision/types";

type Props = {
  groups: ExternalUserGroup[];
};

const ALL = "all";
const TEST_ENVS: TestEnv[] = ["dev", "tst"];

function matchesQuery(profile: ExternalProfile, query: string): boolean {
  const haystack = [
    profile.fullName,
    profile.username,
    profile.olbNumber,
    profile.guid,
    profile.partyId,
    profile.taxId,
    ...profile.accounts.flatMap((account) => [account.label, account.number]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function ProfileRow({ profile }: { profile: ExternalProfile }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
          {profile.fullName}
        </h3>
        <span className="mono text-xs text-[var(--muted)]">
          {profile.accounts.length} accounts
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-1 sm:grid-cols-4">
        <CopyableField label="Username" value={profile.username} />
        <CopyableField label="Password" value={profile.password} />
        <CopyableField label="OLB number" value={profile.olbNumber} />
        <CopyableField label="PartyId" value={profile.partyId} />
        <CopyableField label="Taxid/SSN" value={profile.taxId} />
        <div className="col-span-2 sm:col-span-3">
          <CopyableField label="GUID" value={profile.guid} />
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-1 sm:grid-cols-4">
        {profile.accounts.map((account) => (
          <CopyableField
            key={`${account.label}-${account.number}`}
            label={account.label}
            value={account.number}
            hint={account.note}
          />
        ))}
      </div>
    </div>
  );
}

export function ExternalUsers({ groups }: Props) {
  const [testEnv, setTestEnv] = useState<TestEnv>("tst");
  const [query, setQuery] = useState("");
  const [pod, setPod] = useState<string>(ALL);
  const [segment, setSegment] = useState<string>(ALL);

  const envGroups = useMemo(
    () => groups.filter((group) => group.testEnvs.includes(testEnv)),
    [groups, testEnv],
  );

  const visibleGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return envGroups
      .filter((group) => pod === ALL || group.pod === pod)
      .filter((group) => segment === ALL || group.segment === segment)
      .map((group) => ({
        ...group,
        profiles: normalized
          ? group.profiles.filter((profile) =>
              matchesQuery(profile, normalized),
            )
          : group.profiles,
      }));
  }, [envGroups, query, pod, segment]);

  const visibleProfileCount = countExternalProfiles(visibleGroups);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-10">
      <header className="animate-fade-up flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="brand-mark mb-3">User Generator</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] md:text-[2.15rem]">
            External users
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
            Pre-created test profiles provisioned outside this app, grouped by
            pod configuration. Reference only — nothing here is created or
            deleted by User Generator.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link href="/" className="btn-ghost px-4 py-2 text-sm">
            Fresh users
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost px-4 py-2 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section
        className="panel animate-fade-up p-5"
        style={{ animationDelay: "70ms" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="seg" role="group" aria-label="Environment">
            {TEST_ENVS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTestEnv(value)}
                data-active={testEnv === value}
                className="seg-btn"
              >
                {value}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, username, OLB, GUID, PartyId, account…"
            className="field min-w-[15rem] flex-1 px-3 py-2 text-sm"
            aria-label="Search external users"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="flex flex-col">
            <select
              value={pod}
              onChange={(event) => setPod(event.target.value)}
              className="field px-3 py-2 text-sm"
              aria-label="Pod"
            >
              <option value={ALL}>All pods</option>
              {EXTERNAL_PODS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <select
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              className="field px-3 py-2 text-sm"
              aria-label="Segment"
            >
              <option value={ALL}>All segments</option>
              {EXTERNAL_SEGMENTS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <p className="mono py-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            {visibleProfileCount} shown
          </p>
        </div>
      </section>

      {envGroups.length === 0 ? (
        <p className="panel animate-fade-up px-4 py-12 text-center text-[var(--muted)]">
          No external users recorded for {testEnv}.
        </p>
      ) : visibleGroups.length === 0 ? (
        <p className="panel animate-fade-up px-4 py-12 text-center text-[var(--muted)]">
          No configurations match the selected filters.
        </p>
      ) : (
        visibleGroups.map((group, index) => (
          <section
            key={group.id}
            className="panel animate-fade-up p-5"
            style={{ animationDelay: `${130 + index * 40}ms` }}
          >
            <div className="mb-3 border-b border-[var(--stroke)] pb-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="status-dot" />
                <h2 className="text-base font-semibold tracking-tight">
                  {group.userProfile}
                </h2>
                <span className="mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {group.testEnvs.join(" / ")} · {group.pod} · {group.segment} ·{" "}
                  {group.qty}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {group.accountTypes} · Balance {group.requiredBalance} ·{" "}
                {group.purpose}
              </p>
            </div>

            {group.profiles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--stroke-strong)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                No profiles in this configuration match the search.
              </p>
            ) : (
              <div className="divide-y divide-[var(--stroke)]">
                {group.profiles.map((profile) => (
                  <ProfileRow key={profile.username} profile={profile} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
