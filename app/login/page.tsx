import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";
import { LayersIcon, ShieldIcon, SparkIcon } from "@/app/ui/icons";
import { ThemeToggle } from "@/app/ui/theme-toggle";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    Icon: ShieldIcon,
    title: "Secrets stay server-side",
    body: "Digital Banking and Transmit credentials never reach the browser. Sessions are signed, httpOnly, 12h.",
  },
  {
    Icon: SparkIcon,
    title: "Fresh Aurora users in one click",
    body: "Provisions a Digital Banking user and Aurora flags. Login creates the Transmit user.",
  },
  {
    Icon: LayersIcon,
    title: "Private registry + reference catalog",
    body: "Created users persist in private Vercel Blob; external Retail and SMB profiles are one search away.",
  },
] as const;

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-14">
      <div className="absolute right-5 top-5 animate-fade-up">
        <ThemeToggle compact />
      </div>
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,26rem)]">
        <section className="animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="brand-glyph" aria-hidden />
            <div>
              <p className="brand-mark leading-none">User Generator</p>
              <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--muted-2)]">
                Aurora provisioning console
              </p>
            </div>
          </div>

          <h1 className="display mt-8 text-[2.6rem] font-bold leading-[1.02] md:text-[3.4rem]">
            Test users,
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-strong)] via-[var(--accent)] to-[var(--signal)] bg-clip-text text-transparent">
              provisioned properly.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-[var(--muted)]">
            A secure console for creating, verifying, and retiring fresh Aurora
            accounts. Provisioning writes the Digital Banking user. Login
            creates the Transmit user. Transmit admin credentials are only
            needed to delete that user later.
          </p>

          <ul className="mt-9 grid gap-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="icon-tile icon-tile-accent mt-0.5 h-9 w-9 rounded-xl">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-strong)]">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="panel panel-highlight panel-glow animate-fade-up p-7 md:p-8"
          style={{ animationDelay: "90ms" }}
        >
          <p className="eyebrow mb-2">Secure access</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
            Sign in
          </h2>
          <p className="mt-1.5 mb-7 text-sm leading-relaxed text-[var(--muted)]">
            Enter the shared app password to open the console.
          </p>
          <LoginForm />
          <div className="mt-7 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted-2)]">
            <span className="status-dot" />
            Encrypted session · httpOnly cookie
          </div>
        </section>
      </div>
    </main>
  );
}
