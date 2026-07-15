import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-16">
      <div className="panel animate-fade-up w-full max-w-md p-8 md:p-9">
        <div className="mb-8">
          <p className="brand-mark mb-5">User Generator</p>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Secure access
          </h1>
          <p className="text-[var(--muted)] leading-relaxed">
            Shared password gate. Provisioning secrets stay server-side — never
            exposed to the browser.
          </p>
        </div>
        <LoginForm />
        <div className="mt-7 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          <span className="status-dot" />
          Encrypted session · httpOnly cookie
        </div>
      </div>
    </main>
  );
}
