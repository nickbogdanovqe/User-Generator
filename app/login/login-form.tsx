"use client";

import { useActionState, useState } from "react";
import { loginAction, type ActionResult } from "@/app/actions";
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon, Spinner } from "@/app/ui/icons";

const initialState: ActionResult<null> | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [visible, setVisible] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="label">App password</span>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-2)]" />
          <input
            type={visible ? "text" : "password"}
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Enter shared password"
            className="field py-3 pl-10 pr-12 text-sm"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {state && !state.ok ? (
        <p className="banner banner-danger" role="alert">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary flex items-center justify-center gap-2 px-4 py-3 text-sm"
      >
        {pending ? <Spinner className="h-4 w-4" /> : null}
        {pending ? "Authenticating…" : "Sign in"}
      </button>
    </form>
  );
}
