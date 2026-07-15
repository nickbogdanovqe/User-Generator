import { z } from "zod";

type Env = Record<string, string | undefined>;

export type DigitalBankingUserFlags = {
  auroraUser?: boolean;
  migrationStatus?: "COMPLETE" | "FAILED" | "IN-PROGRESS" | "RESET";
  migrationEligible?: boolean;
  migrationMandatory?: boolean;
};

export type CreateDigitalBankingUserInput = {
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumbers: string[];
  fhnIds: Array<{ fhnIdType: string; fhnIdValue: string }>;
};

const TokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
});

const CreateUserResponseSchema = z.object({
  result: z.object({
    status: z.string(),
    guid: z.string(),
  }),
});

const UserOperationResponseSchema = z.object({
  result: z.object({
    status: z.string(),
    guid: z.string().optional(),
  }),
});

function requireEnv(env: Env, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required for Digital Banking API calls`);
  }
  return value;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function encodeUserFlags(flags: DigitalBankingUserFlags): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(flags)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  return search;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  return JSON.parse(text) as unknown;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && /\b404\b/.test(error.message);
}

export type DigitalBankingUsersApi = {
  createUser: (
    user: CreateDigitalBankingUserInput,
  ) => Promise<{ guid: string; status: string }>;
  recoverUser: (guid: string) => Promise<{ status: string; guid?: string }>;
  patchUserFlags: (
    userId: string,
    flags: DigitalBankingUserFlags,
  ) => Promise<unknown>;
  deleteUser: (guid: string) => Promise<void>;
};

export function createDigitalBankingUsersApi(
  env: Env = process.env,
): DigitalBankingUsersApi {
  const baseUrl = normalizeBaseUrl(
    env.AUTH_DIGITAL_BANKING_API_BASE_URL ?? "https://qa-api.firsthorizon.com",
  );
  const clientId = requireEnv(env, "client_id");
  const clientSecret = requireEnv(env, "client_secret");
  const grantType = env.grant_type ?? "client_credentials";
  const apiKey = requireEnv(env, "x-api-key");

  async function getAccessToken(): Promise<string> {
    const tokenUrl = new URL("/v0/oauth/accesstoken", baseUrl);
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
    });

    const response = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Digital Banking token request failed with status ${response.status}`,
      );
    }

    return TokenResponseSchema.parse(await readJson(response)).access_token;
  }

  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const accessToken = await getAccessToken();
    const url = new URL(path, baseUrl);
    const response = await fetch(url.toString(), {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Digital Banking API ${init.method ?? "GET"} ${path} failed with status ${response.status}${
          body ? `: ${body.slice(0, 200)}` : ""
        }`,
      );
    }

    return response;
  }

  return {
    async createUser(user) {
      const response = await request("/v2/users/digital-banking/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "",
          userStatus: {
            termsAndConditionsVerificationFlag: true,
            enrollmentFlag: true,
          },
          profile: {
            login: user.login,
            firstName: user.firstName,
            lastName: user.lastName,
            emails: [{ emailAddress: user.email }],
            userType: "RETAIL",
            organization: "FHN",
            fhnIds: user.fhnIds,
            phoneNumbers: user.phoneNumbers.map((phoneNumber, index) => ({
              phoneNumber: stripNonDigits(phoneNumber),
              phoneNumberType: index === 0 ? "Mobile" : "Home",
            })),
            addresses: [
              {
                addressType: "Home",
                streetLine1: "123 Court",
                streetLine2: "Avenue",
                cityName: "Memphis",
                stateCode: "TN",
                postalCode: "38128",
                countryCode: "US",
              },
            ],
          },
          credentials: {
            password: user.password,
            forceChangePassword: false,
          },
        }),
      });
      return CreateUserResponseSchema.parse(await readJson(response)).result;
    },

    async recoverUser(guid) {
      const response = await request(
        `/v2/users/digital-banking/${encodeURIComponent(guid)}/recovery`,
        { method: "PUT" },
      );
      return UserOperationResponseSchema.parse(await readJson(response)).result;
    },

    async patchUserFlags(userId, flags) {
      const query = encodeUserFlags(flags);
      const path = `/v0/sso/users/${encodeURIComponent(userId)}/user-flags${
        query.size > 0 ? `?${query.toString()}` : ""
      }`;
      const response = await request(path, { method: "PATCH" });
      return readJson(response);
    },

    async deleteUser(guid) {
      await request(`/v2/users/digital-banking/${encodeURIComponent(guid)}`, {
        method: "DELETE",
      });
    },
  };
}

export async function markUserAuroraMigrationComplete(
  api: DigitalBankingUsersApi,
  userId: string,
): Promise<void> {
  await api.patchUserFlags(userId, { auroraUser: true });
  await api.patchUserFlags(userId, { migrationEligible: true });
  await api.patchUserFlags(userId, { migrationMandatory: true });
  await api.patchUserFlags(userId, { migrationStatus: "COMPLETE" });
}
