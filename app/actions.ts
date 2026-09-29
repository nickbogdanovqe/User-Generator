"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  isAuthenticated,
  setSessionCookie,
  verifyAppPassword,
} from "@/lib/auth/session";
import { listStoredUsers } from "@/lib/blob/users";
import { createFreshAuroraUser } from "@/lib/provision/create-user";
import { deleteFreshAuroraUser } from "@/lib/provision/delete-user";
import {
  normalizeOptionalFhnId,
  normalizeOptionalUsername,
} from "@/lib/provision/draft";
import { isTestEnv, type StoredUser } from "@/lib/provision/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function assertSameOrigin(): Promise<void> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  if (!origin || !host) {
    // Same-origin navigations / some clients omit Origin; allow when Host present
    // for server actions that also require an authenticated session.
    return;
  }
  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error("Cross-origin request rejected");
  }
}

async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export async function loginAction(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    await assertSameOrigin();
    const password = String(formData.get("password") ?? "");
    if (!verifyAppPassword(password)) {
      return { ok: false, error: "Invalid password" };
    }
    await setSessionCookie();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function listUsersAction(): Promise<ActionResult<StoredUser[]>> {
  try {
    await requireAuth();
    const users = await listStoredUsers();
    return { ok: true, data: users };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to list users",
    };
  }
}

export type CreateUserInput = {
  testEnv: string;
  username?: string;
  ecifId?: string;
  interposeId?: string;
};

export async function createUserAction(
  input: CreateUserInput,
): Promise<ActionResult<StoredUser>> {
  try {
    await assertSameOrigin();
    await requireAuth();
    if (!isTestEnv(input.testEnv)) {
      return { ok: false, error: 'Environment must be "dev" or "tst"' };
    }

    let username: string | undefined;
    let ecifId: string | undefined;
    let interpose: string | undefined;
    try {
      username = normalizeOptionalUsername(input.username);
      ecifId = normalizeOptionalFhnId(input.ecifId);
      interpose = normalizeOptionalFhnId(input.interposeId);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid provision input",
      };
    }

    const user = await createFreshAuroraUser(input.testEnv, {
      username,
      ecifId,
      interpose,
    });
    return { ok: true, data: user };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? sanitizeError(error.message)
          : "Failed to create user",
    };
  }
}

export async function deleteUserAction(
  user: StoredUser,
): Promise<ActionResult<{ warnings: string[] }>> {
  try {
    await assertSameOrigin();
    await requireAuth();
    if (!user.username || !user.externalUserId || !isTestEnv(user.testEnv)) {
      return { ok: false, error: "Invalid user payload" };
    }
    const result = await deleteFreshAuroraUser(user);
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? sanitizeError(error.message)
          : "Failed to delete user",
    };
  }
}

function sanitizeError(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/access_token["']?\s*[:=]\s*["']?[^"'&\s]+/gi, "access_token=[redacted]")
    .replace(/client_secret["']?\s*[:=]\s*["']?[^"'&\s]+/gi, "client_secret=[redacted]")
    .slice(0, 400);
}
