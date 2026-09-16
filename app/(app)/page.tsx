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

  return <Dashboard initialUsers={initialUsers} listError={listError} />;
}
