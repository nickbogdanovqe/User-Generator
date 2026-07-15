"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult<null> | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm tracking-wide text-[var(--muted)]">
          App password
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Enter shared password"
          className="rounded-xl border border-[var(--stroke)] bg-black/25 px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
      </label>

      {state && !state.ok ? (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-[#1a1508] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
