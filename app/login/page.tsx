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
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-[var(--bg-panel)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <p
          className="mb-2 text-sm uppercase tracking-[0.22em] text-[var(--accent)]"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          User Generator
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Secure access
        </h1>
        <p className="mb-8 text-[var(--muted)]">
          Enter the shared app password. API secrets never leave the server.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
