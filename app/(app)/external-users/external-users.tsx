"use client";

import { useMemo, useState } from "react";
import { envTagClass, useTestEnv } from "@/app/ui/env-context";
import {
  BuildingIcon,
  CardIcon,
  CheckIcon,
  CopyIcon,
  LayersIcon,
  PersonIcon,
  SearchIcon,
  UsersIcon,
} from "@/app/ui/icons";
import { PageHeader } from "@/app/ui/page-header";
import {
  countExternalProfiles,
  EXTERNAL_PODS,
  type ExternalAccount,
  type ExternalProfile,
  type ExternalUserGroup,
} from "@/lib/external-users/catalog";

type Props = {
  groups: ExternalUserGroup[];
};

type SegmentFilter = "all" | "retail" | "smb" | "comingled";
type Category = Exclude<SegmentFilter, "all">;

const ALL = "all";

const CATEGORY_META: Record<
  Category,
  { label: string; tag: string; tile: string; dot: string }
> = {
  retail: {
    label: "Retail",
    tag: "tag-retail",
    tile: "icon-tile-ok",
    dot: "bg-[#34d399]",
  },
  smb: {
    label: "SMB Business",
    tag: "tag-smb",
    tile: "icon-tile-smb",
    dot: "bg-[#818cf8]",
  },
  comingled: {
    label: "Comingled",
    tag: "tag-comingled",
    tile: "icon-tile-comingled",
    dot: "bg-[#c084fc]",
  },
};

function getCategory(segment: string): Category {
  const s = segment.toLowerCase();
  if (s.includes("+") || s.includes("comingled")) return "comingled";
  if (s.includes("retail")) return "retail";
  return "smb";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function matchesQuery(profile: ExternalProfile, group: ExternalUserGroup, query: string): boolean {
  const haystack = [
    profile.fullName,
    profile.username,
    profile.olbNumber,
    profile.guid,
    profile.partyId,
    profile.taxId,
    group.pod,
    group.segment,
    group.purpose,
    ...profile.accounts.flatMap((a) => [a.label, a.number, a.note ?? ""]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function useCopy(): [boolean, (value: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return [copied, copy];
}

function CopyTile({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      data-copied={copied}
      className="copy-tile group"
      title={`Copy ${label}: ${value}`}
      aria-label={`Copy ${label} ${value}`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="label">{label}</span>
        <span
          className={`text-[0.62rem] font-medium transition ${
            copied ? "text-[#6ee7b7]" : "text-[var(--muted-2)] opacity-0 group-hover:opacity-100"
          }`}
        >
          {copied ? "Copied" : "Copy"}
        </span>
      </span>
      <span
        className={`mono text-[0.8rem] font-semibold text-[var(--text)] transition group-hover:text-[var(--accent-strong)] ${
          truncate ? "max-w-full truncate" : "break-all"
        }`}
      >
        {value}
      </span>
    </button>
  );
}

function AccountTile({ account }: { account: ExternalAccount }) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(account.number)}
      data-copied={copied}
      className="copy-tile group !flex-row !items-center !justify-between"
      title={`Copy account number ${account.number}`}
      aria-label={`Copy account ${account.label} ${account.number}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="icon-tile h-7 w-7 rounded-lg">
          <CardIcon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs font-medium text-[var(--text)]">{account.label}</span>
            {account.note ? <span className="tag tag-note">{account.note}</span> : null}
          </span>
          <span className="mono block text-xs font-semibold text-[var(--accent-strong)]">
            {account.number}
          </span>
        </span>
      </span>
      <span
        className={`shrink-0 text-[0.62rem] font-medium transition ${
          copied ? "text-[#6ee7b7]" : "text-[var(--muted-2)] opacity-0 group-hover:opacity-100"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function ProfileCard({ profile, group }: { profile: ExternalProfile; group: ExternalUserGroup }) {
  const [copiedAll, copy] = useCopy();
  const category = getCategory(group.segment);
  const meta = CATEGORY_META[category];

  const onCopyAll = () =>
    copy(
      [
        `Name: ${profile.fullName}`,
        `Segment: ${group.segment} · Pod: ${group.pod}`,
        `Username: ${profile.username}`,
        `Password: ${profile.password}`,
        `OLB Number: ${profile.olbNumber}`,
        `Party ID: ${profile.partyId}`,
        `Tax ID: ${profile.taxId}`,
        `GUID: ${profile.guid}`,
        `Accounts (${profile.accounts.length}):`,
        ...profile.accounts.map(
          (a) => `  - ${a.label}: ${a.number}${a.note ? ` (${a.note})` : ""}`,
        ),
      ].join("\n"),
    );

  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--stroke)] pb-4">
        <div className="flex items-start gap-3.5">
          <div className={`avatar-badge ${meta.tag}`}>{getInitials(profile.fullName)}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-[var(--text-strong)]">
                {profile.fullName}
              </h3>
              <span className={`tag ${meta.tag}`}>{group.segment}</span>
              <span className="tag tag-neutral">{group.pod}</span>
            </div>
            <p className="hint mt-1 max-w-xl">{group.purpose}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopyAll}
          className="btn-ghost flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          aria-label={`Copy complete profile for ${profile.fullName}`}
        >
          {copiedAll ? (
            <CheckIcon className="h-3.5 w-3.5 text-[#6ee7b7]" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
          {copiedAll ? "Copied all" : "Copy all"}
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <CopyTile label="Username" value={profile.username} />
        <CopyTile label="Password" value={profile.password} />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <CopyTile label="OLB number" value={profile.olbNumber} />
        <CopyTile label="Party ID" value={profile.partyId} />
        <CopyTile label="Tax ID / SSN" value={profile.taxId} />
        <CopyTile label="GUID" value={profile.guid} truncate />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label">
            Linked accounts &amp; cards ({profile.accounts.length})
          </span>
          <span className="hint">Required balance: {group.requiredBalance}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {profile.accounts.map((account) => (
            <AccountTile key={`${account.label}-${account.number}`} account={account} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function ExternalUsers({ groups }: Props) {
  const { testEnv } = useTestEnv();
  const [segmentTab, setSegmentTab] = useState<SegmentFilter>("all");
  const [query, setQuery] = useState("");
  const [pod, setPod] = useState<string>(ALL);

  const envGroups = useMemo(
    () => groups.filter((g) => g.testEnvs.includes(testEnv)),
    [groups, testEnv],
  );

  const metrics = useMemo(() => {
    const m = { total: 0, retail: 0, smb: 0, comingled: 0, accounts: 0 };
    for (const g of envGroups) {
      const n = g.profiles.length;
      m.total += n;
      m[getCategory(g.segment)] += n;
      for (const p of g.profiles) m.accounts += p.accounts.length;
    }
    return m;
  }, [envGroups]);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return envGroups
      .filter((g) => segmentTab === "all" || getCategory(g.segment) === segmentTab)
      .filter((g) => pod === ALL || g.pod === pod)
      .map((g) => ({
        ...g,
        profiles: q ? g.profiles.filter((p) => matchesQuery(p, g, q)) : g.profiles,
      }))
      .filter((g) => g.profiles.length > 0);
  }, [envGroups, segmentTab, pod, query]);

  const visibleCount = countExternalProfiles(visibleGroups);
  const isFiltered = query.trim() !== "" || pod !== ALL || segmentTab !== "all";
  const reset = () => {
    setQuery("");
    setPod(ALL);
    setSegmentTab("all");
  };

  const TABS: { id: SegmentFilter; label: string; count: number; dot?: string }[] = [
    { id: "all", label: "All", count: metrics.total },
    { id: "retail", label: "Retail", count: metrics.retail, dot: CATEGORY_META.retail.dot },
    { id: "smb", label: "SMB", count: metrics.smb, dot: CATEGORY_META.smb.dot },
    {
      id: "comingled",
      label: "Comingled",
      count: metrics.comingled,
      dot: CATEGORY_META.comingled.dot,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow="External test profiles"
        title="Reference catalog"
        description="Pre-provisioned Retail and SMB profiles with linked accounts and pod capabilities. Read-only: nothing here is created or deleted by User Generator."
        actions={
          <span className={envTagClass(testEnv)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Scope {testEnv.toUpperCase()} · {metrics.total} profiles
          </span>
        }
      />

      <section
        className="animate-fade-up grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        style={{ animationDelay: "60ms" }}
      >
        <button
          type="button"
          onClick={() => setSegmentTab("all")}
          data-active={segmentTab === "all"}
          className="metric-card cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <span className="label">All profiles</span>
            <span className="icon-tile icon-tile-accent">
              <UsersIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="metric-value mt-3">{metrics.total}</p>
          <p className="mt-1.5 text-xs text-[var(--muted)]">Across {envGroups.length} pod configs</p>
        </button>

        <button
          type="button"
          onClick={() => setSegmentTab("retail")}
          data-active={segmentTab === "retail"}
          className="metric-card cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <span className="label text-[#6ee7b7]">Retail</span>
            <span className="icon-tile icon-tile-ok">
              <PersonIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="metric-value mt-3">{metrics.retail}</p>
          <p className="mt-1.5 text-xs text-[var(--muted)]">Personal &amp; Mass Market</p>
        </button>

        <button
          type="button"
          onClick={() => setSegmentTab("smb")}
          data-active={segmentTab === "smb"}
          className="metric-card cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <span className="label text-[#a5b4fc]">SMB Business</span>
            <span className="icon-tile icon-tile-smb">
              <BuildingIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="metric-value mt-3">{metrics.smb}</p>
          <p className="mt-1.5 text-xs text-[var(--muted)]">Commercial DDA, Zelle, Direct Pay</p>
        </button>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="label">Linked accounts</span>
            <span className="icon-tile icon-tile-signal">
              <LayersIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="metric-value mt-3">{metrics.accounts}</p>
          <p className="mt-1.5 text-xs text-[var(--muted)]">DDA, savings &amp; debit cards</p>
        </div>
      </section>

      <section
        className="panel sticky-toolbar animate-fade-up flex flex-col gap-3 p-3.5"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="seg" role="tablist" aria-label="Segment filter">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={segmentTab === tab.id}
                onClick={() => setSegmentTab(tab.id)}
                data-active={segmentTab === tab.id}
                className="seg-btn"
              >
                {tab.dot ? <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} /> : null}
                {tab.label}
                <span className="mono rounded-full bg-[rgba(255,255,255,0.06)] px-1.5 text-[0.65rem] text-[var(--muted)]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-2)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, username, OLB, GUID, account…"
                className="field py-2 pl-9 pr-3 text-sm"
                aria-label="Search external users"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <select
              value={pod}
              onChange={(e) => setPod(e.target.value)}
              className="field w-auto py-2 pl-3 text-sm"
              aria-label="Pod filter"
            >
              <option value={ALL}>All pods</option>
              {EXTERNAL_PODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="mono hidden text-xs text-[var(--muted)] md:inline">
              {visibleCount}/{metrics.total}
            </span>
            {isFiltered ? (
              <button type="button" onClick={reset} className="btn-ghost px-3 py-2 text-xs font-medium">
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {visibleGroups.length === 0 ? (
        <div className="panel empty animate-fade-up flex flex-col items-center px-4 py-16 text-center">
          <span className="icon-tile mb-3 h-12 w-12 rounded-2xl">
            <SearchIcon className="h-5 w-5" />
          </span>
          <h3 className="text-base font-semibold text-[var(--text-strong)]">No profiles match</h3>
          <p className="hint mt-1 max-w-sm">
            Adjust the search, segment, or pod filters — or reset to see everything available in{" "}
            {testEnv.toUpperCase()}.
          </p>
          <button type="button" onClick={reset} className="btn-primary mt-5 px-4 py-2 text-xs">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {visibleGroups.map((group, i) => {
            const meta = CATEGORY_META[getCategory(group.segment)];
            return (
              <section
                key={group.id}
                className="animate-fade-up flex flex-col gap-3"
                style={{ animationDelay: `${140 + i * 40}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2.5 px-1">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold tracking-tight text-[var(--text-strong)]">
                    {group.userProfile}
                  </h2>
                  <span className="tag tag-neutral">{group.pod}</span>
                  <span className="hint">
                    {group.qty} · {group.accountTypes}
                  </span>
                  <span className="mono ml-auto text-xs text-[var(--muted)]">
                    {group.profiles.length} {group.profiles.length === 1 ? "profile" : "profiles"}
                  </span>
                </div>
                <div className="grid gap-4">
                  {group.profiles.map((profile) => (
                    <ProfileCard key={profile.username} profile={profile} group={group} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
