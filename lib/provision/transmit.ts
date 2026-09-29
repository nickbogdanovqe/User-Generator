import type { TestEnv } from "@/lib/provision/types";

type Env = Record<string, string | undefined>;

export type TransmitUser = {
  user_id: string;
  username?: string;
  external_user_id?: string;
  [key: string]: unknown;
};

export type CreateTransmitUserInput = {
  email: string;
  phone_number: string;
  username?: string;
  external_user_id: string;
  name: { first_name: string; last_name: string };
  custom_app_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/cis\/?$/, "").replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  return JSON.parse(text) as unknown;
}

function getStringField(payload: unknown, field: string): string | undefined {
  if (!isRecord(payload)) return undefined;
  const value = payload[field];
  return typeof value === "string" ? value : undefined;
}

function describeTransmitError(payload: unknown): string {
  const code =
    getStringField(payload, "error") ?? getStringField(payload, "error_code");
  const message =
    getStringField(payload, "error_description") ??
    getStringField(payload, "message");
  return [code, message].filter(Boolean).join(": ");
}

function getResultObject(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload) || !isRecord(payload.result)) {
    throw new Error("Transmit response was missing result object");
  }
  return payload.result;
}

export function isTransmitNotFoundError(error: unknown): boolean {
  return error instanceof Error && /\b404\b/.test(error.message);
}

function isTransmitConflictError(error: unknown): boolean {
  return error instanceof Error && /\b409\b/.test(error.message);
}

function isTransientAvailabilityError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (/\b404\b/.test(error.message) ||
      /\b429\b/.test(error.message) ||
      /\b5\d\d\b/.test(error.message) ||
      /not found/i.test(error.message))
  );
}

function isTstPasswordAuthDisabledError(
  error: unknown,
  testEnv: TestEnv,
): boolean {
  return (
    testEnv === "tst" &&
    error instanceof Error &&
    /\b403\b/.test(error.message) &&
    /Password authentication method is not configured or disabled/i.test(
      error.message,
    )
  );
}

function supportsTransmitPasswordAuth(testEnv: TestEnv): boolean {
  return testEnv !== "tst";
}

const DEV_TRANSMIT_API_BASE_URL = "https://transmit.dev.firsthorizon.com";

function envSuffix(testEnv: TestEnv): "DEV" | "TST" {
  return testEnv === "dev" ? "DEV" : "TST";
}

function readTrimmed(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * DEV and TST each use their own Transmit client. DEV defaults to the
 * First Horizon dev gateway; TST stays unconfigured until its vars are set.
 */
export function resolveTransmitAdminCredentials(
  testEnv: TestEnv,
  env: Env = process.env,
): {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
} {
  const suffix = envSuffix(testEnv);
  const clientId = readTrimmed(env, `TRANSMIT_CLIENT_ID_${suffix}`);
  const clientSecret = readTrimmed(env, `TRANSMIT_CLIENT_SECRET_${suffix}`);

  if (!clientId || !clientSecret) {
    throw new Error(
      `${suffix} Transmit credentials are not configured. Set TRANSMIT_CLIENT_ID_${suffix} and TRANSMIT_CLIENT_SECRET_${suffix}.`,
    );
  }

  const baseUrl =
    readTrimmed(env, `TRANSMIT_API_BASE_URL_${suffix}`) ??
    (testEnv === "dev" ? DEV_TRANSMIT_API_BASE_URL : undefined);

  if (!baseUrl) {
    throw new Error(
      `TRANSMIT_API_BASE_URL_${suffix} is required for ${suffix} Transmit.`,
    );
  }

  return {
    clientId,
    clientSecret,
    baseUrl: normalizeBaseUrl(baseUrl),
  };
}

export type TransmitEnvAvailability = Record<TestEnv, boolean>;

export function getTransmitEnvAvailability(
  env: Env = process.env,
): TransmitEnvAvailability {
  return {
    dev: isTransmitEnvConfigured("dev", env),
    tst: isTransmitEnvConfigured("tst", env),
  };
}

function isTransmitEnvConfigured(testEnv: TestEnv, env: Env): boolean {
  try {
    resolveTransmitAdminCredentials(testEnv, env);
    return true;
  } catch {
    return false;
  }
}

export type TransmitAdminApi = {
  createUser: (user: CreateTransmitUserInput) => Promise<TransmitUser>;
  getUserById: (userId: string) => Promise<TransmitUser>;
  getUserByUsername: (username: string) => Promise<TransmitUser>;
  getUserByExternalUserId: (externalUserId: string) => Promise<TransmitUser>;
  createUserPassword: (
    userId: string,
    password: string,
    username: string,
  ) => Promise<void>;
  updateUserPassword: (userId: string, password: string) => Promise<void>;
  verifyUserPhoneNumber: (
    userId: string,
    phoneNumber: string,
  ) => Promise<void>;
  removeUserFromApp: (userId: string) => Promise<void>;
};

export function createTransmitAdminApi(
  testEnv: TestEnv,
  env: Env = process.env,
): TransmitAdminApi {
  const { clientId, clientSecret, baseUrl } = resolveTransmitAdminCredentials(
    testEnv,
    env,
  );

  let cachedToken: { accessToken: string; expiresAt: number } | undefined;

  async function getClientAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
      return cachedToken.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(`${baseUrl}/oidc/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = await readJson(response);
    if (!response.ok) {
      const detail = describeTransmitError(payload);
      throw new Error(
        `Transmit token request failed with ${response.status}${
          detail ? ` ${detail}` : ""
        }`,
      );
    }
    if (!isRecord(payload) || typeof payload.access_token !== "string") {
      throw new Error("Transmit token response was invalid");
    }
    const expiresIn =
      typeof payload.expires_in === "number" ? payload.expires_in : 3600;
    cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return cachedToken.accessToken;
  }

  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<unknown> {
    const accessToken = await getClientAccessToken();
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(isRecord(init.headers) ? init.headers : {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await readJson(response);
    if (!response.ok) {
      const detail = describeTransmitError(payload);
      throw new Error(
        `Transmit API request failed with ${response.status}${
          detail ? ` ${detail}` : ""
        }`,
      );
    }
    return payload;
  }

  return {
    async createUser(user) {
      const payload = await request("/cis/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      return getResultObject(payload) as TransmitUser;
    },

    async getUserById(userId) {
      const payload = await request(
        `/cis/v1/users/${encodeURIComponent(userId)}`,
      );
      return getResultObject(payload) as TransmitUser;
    },

    async getUserByUsername(username) {
      const payload = await request(
        `/cis/v1/users/username/${encodeURIComponent(username)}`,
      );
      return getResultObject(payload) as TransmitUser;
    },

    async getUserByExternalUserId(externalUserId) {
      const payload = await request(
        `/cis/v1/users/external-user-id/${encodeURIComponent(externalUserId)}`,
      );
      return getResultObject(payload) as TransmitUser;
    },

    async createUserPassword(userId, password, username) {
      await request(`/cis/v1/users/${encodeURIComponent(userId)}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          username,
          force_replace: false,
          enforce_complexity: true,
        }),
      });
    },

    async updateUserPassword(userId, password) {
      await request(`/cis/v1/users/${encodeURIComponent(userId)}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          force_replace: false,
        }),
      });
    },

    async verifyUserPhoneNumber(userId, phoneNumber) {
      await request(
        `/cis/v1/users/${encodeURIComponent(userId)}/phone-numbers/${encodeURIComponent(phoneNumber)}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ change_to_primary: true }),
        },
      );
    },

    async removeUserFromApp(userId) {
      await request(`/cis/v1/users/${encodeURIComponent(userId)}/apps`, {
        method: "DELETE",
      });
    },
  };
}

async function retryTransient<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 20;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientAvailabilityError(error)) {
        throw error;
      }
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(3_000, 500 * attempt)),
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Transmit user was not available after creation");
}

export async function removeUserFromAppByUsernameIfExists(
  api: TransmitAdminApi,
  username: string,
): Promise<void> {
  try {
    const user = await api.getUserByUsername(username);
    await api.removeUserFromApp(user.user_id);
  } catch (error) {
    if (isTransmitNotFoundError(error)) return;
    throw error;
  }
}

export async function removeUserFromAppByExternalUserIdIfExists(
  api: TransmitAdminApi,
  externalUserId: string,
): Promise<void> {
  try {
    const user = await api.getUserByExternalUserId(externalUserId);
    await api.removeUserFromApp(user.user_id);
  } catch (error) {
    if (isTransmitNotFoundError(error)) return;
    throw error;
  }
}

export async function makeUserFreshForLoginByUsernameIfExists(
  api: TransmitAdminApi,
  username: string,
): Promise<void> {
  let user: TransmitUser | null = null;
  try {
    user = await api.getUserByUsername(username);
  } catch (error) {
    if (isTransmitNotFoundError(error)) return;
    throw error;
  }

  await api.removeUserFromApp(user.user_id);

  try {
    await api.getUserByUsername(username);
    throw new Error(
      `Transmit user ${username} still exists after removing it from the app`,
    );
  } catch (error) {
    if (isTransmitNotFoundError(error)) return;
    throw error;
  }
}

export async function createTransmitOtpUser(
  api: TransmitAdminApi,
  input: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    primaryPhoneNumber: string;
    externalUserId: string;
    testEnv: TestEnv;
  },
): Promise<TransmitUser> {
  const userInput: CreateTransmitUserInput = {
    email: input.email,
    phone_number: input.primaryPhoneNumber,
    ...(supportsTransmitPasswordAuth(input.testEnv)
      ? { username: input.username }
      : {}),
    external_user_id: input.externalUserId,
    name: {
      first_name: input.firstName,
      last_name: input.lastName,
    },
    custom_app_data: {
      phone_numbers: [input.primaryPhoneNumber],
      preferred_phone_number: input.primaryPhoneNumber,
    },
    custom_data: {
      source: "user-generator",
    },
  };

  await removeUserFromAppByUsernameIfExists(api, input.username);

  const user = await api.createUser(userInput);
  await retryTransient(() => api.getUserById(user.user_id));

  try {
    await retryTransient(() =>
      api.createUserPassword(user.user_id, input.password, input.username),
    );
  } catch (error) {
    if (isTstPasswordAuthDisabledError(error, input.testEnv)) {
      // tst may disable password auth on Transmit — continue
    } else if (isTransmitConflictError(error)) {
      await api.updateUserPassword(user.user_id, input.password);
    } else {
      throw error;
    }
  }

  await retryTransient(() =>
    api.verifyUserPhoneNumber(user.user_id, input.primaryPhoneNumber),
  );

  return user;
}
