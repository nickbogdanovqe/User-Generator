import { put, list, del, get } from "@vercel/blob";
import type { StoredUser, TestEnv } from "@/lib/provision/types";

function blobPath(testEnv: TestEnv, username: string): string {
  return `users/${testEnv}/${username}.json`;
}

async function readPrivateJson(pathname: string): Promise<StoredUser | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as StoredUser;
  if (
    !parsed.username ||
    !parsed.password ||
    !parsed.externalUserId ||
    (parsed.testEnv !== "dev" && parsed.testEnv !== "tst")
  ) {
    return null;
  }

  return { ...parsed, pathname };
}

export async function saveStoredUser(user: StoredUser): Promise<StoredUser> {
  const pathname = blobPath(user.testEnv, user.username);
  const blob = await put(pathname, JSON.stringify(user, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return { ...user, pathname: blob.pathname };
}

export async function listStoredUsers(): Promise<StoredUser[]> {
  const users: StoredUser[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: "users/", cursor });
    for (const blob of page.blobs) {
      try {
        const parsed = await readPrivateJson(blob.pathname);
        if (parsed) {
          users.push(parsed);
        }
      } catch {
        // Skip corrupt / unreadable blobs
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return users.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function deleteStoredUser(
  testEnv: TestEnv,
  username: string,
  pathname?: string,
): Promise<void> {
  const target = pathname ?? blobPath(testEnv, username);
  await del(target);
}
