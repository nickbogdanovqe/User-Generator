"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult<null> | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium tracking-wide text-[var(--muted)]">
          App password
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Enter shared password"
          className="field px-4 py-3"
        />
      </label>

      {state && !state.ok ? (
        <p className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary px-4 py-3">
        {pending ? "Authenticating…" : "Sign in"}
      </button>
    </form>
  );
}
