"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      data-copied={copied}
      className="btn-ghost mono shrink-0 px-2.5 py-1 text-xs"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CredentialRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
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
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{hint}</p>
        ) : null}
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

/** Dense label + value pair; the whole thing is the copy target. */
export function CopyableField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      title={hint ? `${value} — ${hint}` : value}
      aria-label={`Copy ${label} ${value}`}
      className="group min-w-0 rounded-lg px-2 py-1 text-left transition hover:bg-[var(--accent-soft)]"
    >
      <span className="block truncate text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
        {hint ? (
          <span className="normal-case tracking-normal"> · {hint}</span>
        ) : null}
      </span>
      <span className="mono block truncate text-[0.8rem] font-medium text-[var(--text)] group-hover:text-[var(--accent-strong)]">
        {copied ? "Copied" : value}
      </span>
    </button>
  );
}
