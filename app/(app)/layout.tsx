import { EnvProvider } from "@/app/ui/env-context";
import { AppShell } from "@/app/ui/sidebar";
import { getTransmitEnvAvailability } from "@/lib/provision/transmit";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <EnvProvider availability={getTransmitEnvAvailability()}>
      <AppShell>{children}</AppShell>
    </EnvProvider>
  );
}
