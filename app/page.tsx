import { listStoredUsers } from "@/lib/blob/users";
import { Dashboard } from "./dashboard";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialUsers: Awaited<ReturnType<typeof listStoredUsers>> = [];
  let listError: string | null = null;

  try {
    initialUsers = await listStoredUsers();
  } catch (error) {
    listError =
      error instanceof Error
        ? error.message
        : "Could not load saved users from Blob storage";
  }

  return (
    <main className="flex flex-1 flex-col">
      {listError ? (
        <div className="mx-auto w-full max-w-5xl px-6 pt-8">
          <p className="rounded-xl border border-[var(--warn)]/25 bg-[var(--warn-soft)] px-3 py-2.5 text-sm text-[var(--warn)]">
            Blob list unavailable ({listError}). You can still create users once
            BLOB_READ_WRITE_TOKEN is configured.
          </p>
        </div>
      ) : null}
      <Dashboard initialUsers={initialUsers} />
    </main>
  );
}
