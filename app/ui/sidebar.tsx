"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { useTestEnv } from "@/app/ui/env-context";
import {
  CloseIcon,
  LibraryIcon,
  LockIcon,
  LogoutIcon,
  MenuIcon,
  ShieldIcon,
  SparkIcon,
} from "@/app/ui/icons";
import { ThemeToggle } from "@/app/ui/theme-toggle";
import type { TestEnv } from "@/lib/provision/types";

const NAV = [
  {
    href: "/",
    label: "Fresh users",
    hint: "Provision & registry",
    Icon: SparkIcon,
  },
  {
    href: "/external-users",
    label: "External users",
    hint: "Reference catalog",
    Icon: LibraryIcon,
  },
  {
    href: "/user-state",
    label: "User state",
    hint: "Recover, lock, convert",
    Icon: LockIcon,
  },
] as const;

const ENVS: { value: TestEnv; label: string; readyHint: string }[] = [
  {
    value: "dev",
    label: "DEV",
    readyHint: "SSO user · login creates Transmit",
  },
  {
    value: "tst",
    label: "TST",
    readyHint: "SSO user · login creates Transmit",
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="brand-glyph" aria-hidden />
      <div className="min-w-0">
        <p className="brand-mark leading-none">User Generator</p>
        <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--muted-2)]">
          Aurora provisioning
        </p>
      </div>
    </div>
  );
}

export function EnvSwitcher({ compact = false }: { compact?: boolean }) {
  const { testEnv, setTestEnv, availability } = useTestEnv();
  const active = ENVS.find((e) => e.value === testEnv) ?? ENVS[0];
  const activeReady = availability[active.value];

  return (
    <div className={compact ? "" : "flex flex-col gap-2"}>
      <div className={`seg ${compact ? "" : "seg-fill"}`} role="group" aria-label="Environment">
        {ENVS.map((env) => {
          const ready = availability[env.value];
          const selected = testEnv === env.value;
          return (
            <button
              key={env.value}
              type="button"
              onClick={() => setTestEnv(env.value)}
              data-active={selected}
              data-unavailable={ready ? undefined : "true"}
              className="seg-btn"
              aria-label={`${env.label} ${ready ? "ready" : "provision only, no Transmit cleanup"}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  !ready
                    ? "dot-off"
                    : selected
                      ? env.value === "dev"
                        ? "dot-dev"
                        : "dot-tst"
                      : "dot-idle"
                }`}
              />
              <span className={compact ? "" : "flex flex-col items-start leading-none"}>
                <span>{env.label}</span>
                {compact ? null : (
                  <span
                    className={`mt-1 ${ready ? "env-status env-status-ok" : "env-status env-status-off"}`}
                  >
                    {ready ? "Ready" : "Provision only"}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {!compact ? (
        <p className="hint px-1">
          <span className="text-[var(--text)]">{active.label}</span>
          {activeReady
            ? ` · ${active.readyHint}.`
            : " · Transmit cleanup credentials are not set. Provisioning still works."}{" "}
          Governs provisioning, the registry, and user state.
        </p>
      ) : null}
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Brand />

      <nav className="relative flex flex-col gap-1" aria-label="Primary">
        <p className="eyebrow mb-1.5 px-1">Workspace</p>
        {NAV.map(({ href, label, hint, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-active={active}
              className="nav-item"
              onClick={onNavigate}
            >
              <span className="nav-icon">
                <Icon className="h-full w-full" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{label}</span>
                <span className="truncate text-[0.68rem] font-normal text-[var(--muted-2)]">
                  {hint}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="divider" />

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <p className="eyebrow">Environment</p>
          <span className="tag tag-neutral">global</span>
        </div>
        <EnvSwitcher />
      </section>

      <section className="flex flex-col gap-2">
        <p className="eyebrow px-1">Appearance</p>
        <ThemeToggle />
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <div className="inset flex items-center gap-2.5 px-3 py-2.5">
          <span className="icon-tile icon-tile-accent h-7 w-7 rounded-lg">
            <ShieldIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-medium text-[var(--text)]">Encrypted session</p>
            <p className="text-[0.68rem] text-[var(--muted-2)]">httpOnly cookie · 12h</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="btn-ghost flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium"
          >
            <LogoutIcon className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close the drawer on route change.
    queueMicrotask(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="app-shell">
      <div className="hidden lg:block">
        <SidebarBody />
      </div>

      <div className="topbar lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-icon"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <span className="brand-glyph h-7 w-7 rounded-lg" aria-hidden />
          <span className="brand-mark text-base">User Generator</span>
        </div>
        <div className="flex items-center gap-2">
          <EnvSwitcher compact />
          <ThemeToggle compact />
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="drawer-backdrop lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="drawer lg:hidden">
            <button
              type="button"
              className="btn-icon absolute right-3 top-3 z-10"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}

      <main className="content flex flex-1 flex-col">{children}</main>
    </div>
  );
}
