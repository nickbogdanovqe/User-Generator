import { EnvProvider } from "@/app/ui/env-context";
import { AppShell } from "@/app/ui/sidebar";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <EnvProvider>
      <AppShell>{children}</AppShell>
    </EnvProvider>
  );
}
