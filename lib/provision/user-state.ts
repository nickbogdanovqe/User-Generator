import {
  createDigitalBankingUsersApi,
  isNotFoundError,
  markUserAuroraMigrationComplete,
  type DigitalBankingUserFlags,
  type DigitalBankingUsersApi,
} from "@/lib/provision/digital-banking";
import type { TestEnv } from "@/lib/provision/types";

export const USER_STATE_OPERATIONS = [
  "lookup",
  "recover",
  "lock",
  "aurora",
  "d3Eligible",
  "d3Ineligible",
  "d3Failed",
] as const;

export type UserStateOperation = (typeof USER_STATE_OPERATIONS)[number];

export type UserStateMutation = Exclude<UserStateOperation, "lookup">;

export function isUserStateOperation(value: string): value is UserStateOperation {
  return (USER_STATE_OPERATIONS as readonly string[]).includes(value);
}

export type UserStateFlags = {
  auroraUser?: string | boolean;
  migrationEligible?: string | boolean;
  migrationMandatory?: string | boolean;
  migrationStatus?: string;
};

export type UserStateSnapshot = {
  username: string;
  guid: string;
  testEnv: TestEnv;
  flags: UserStateFlags;
  operation: UserStateOperation;
  /** Present after lock or recover. Profile GET does not include a lock flag. */
  operationStatus?: string;
};

const D3_ELIGIBLE_PATCHES: DigitalBankingUserFlags[] = [
  { migrationStatus: "RESET" },
  { auroraUser: false },
  { migrationEligible: true },
  { migrationMandatory: false },
];

const D3_INELIGIBLE_PATCHES: DigitalBankingUserFlags[] = [
  { auroraUser: false },
  { migrationEligible: false },
  { migrationStatus: "RESET" },
  { migrationMandatory: false },
];

const D3_FAILED_PATCHES: DigitalBankingUserFlags[] = [
  { auroraUser: false },
  { migrationEligible: true },
  { migrationStatus: "FAILED" },
];

function userNotFound(username: string): Error {
  return new Error(`Digital Banking user "${username}" was not found`);
}

async function resolveGuid(
  api: DigitalBankingUsersApi,
  username: string,
): Promise<string> {
  try {
    return await api.findUserGuidByLogin(username);
  } catch (error) {
    if (
      isNotFoundError(error) ||
      (error instanceof Error && /was not found/i.test(error.message))
    ) {
      throw userNotFound(username);
    }
    throw error;
  }
}

async function readFlags(
  api: DigitalBankingUsersApi,
  guid: string,
): Promise<UserStateFlags> {
  const profile = await api.getUser(guid);
  const status = profile.userStatus;
  return {
    auroraUser: status?.auroraUser,
    migrationEligible: status?.migrationEligible,
    migrationMandatory: status?.migrationMandatory,
    migrationStatus: status?.migrationStatus,
  };
}

async function patchFlags(
  api: DigitalBankingUsersApi,
  guid: string,
  patches: DigitalBankingUserFlags[],
): Promise<void> {
  for (const patch of patches) {
    await api.patchUserFlags(guid, patch);
  }
}

function snapshot(
  username: string,
  guid: string,
  testEnv: TestEnv,
  flags: UserStateFlags,
  operation: UserStateOperation,
  operationStatus?: string,
): UserStateSnapshot {
  return {
    username,
    guid,
    testEnv,
    flags,
    operation,
    ...(operationStatus ? { operationStatus } : {}),
  };
}

export async function lookupUserState(
  testEnv: TestEnv,
  username: string,
): Promise<UserStateSnapshot> {
  const api = createDigitalBankingUsersApi();
  const guid = await resolveGuid(api, username);
  const flags = await readFlags(api, guid);
  return snapshot(username, guid, testEnv, flags, "lookup");
}

export async function applyUserOperation(
  testEnv: TestEnv,
  username: string,
  operation: UserStateMutation,
): Promise<UserStateSnapshot> {
  const api = createDigitalBankingUsersApi();
  const guid = await resolveGuid(api, username);
  let operationStatus: string | undefined;

  switch (operation) {
    case "recover":
      operationStatus = (await api.recoverUser(guid)).status;
      break;
    case "lock":
      operationStatus = (await api.lockUser(guid)).status;
      break;
    case "aurora":
      await markUserAuroraMigrationComplete(api, guid);
      break;
    case "d3Eligible":
      await patchFlags(api, guid, D3_ELIGIBLE_PATCHES);
      break;
    case "d3Ineligible":
      await patchFlags(api, guid, D3_INELIGIBLE_PATCHES);
      break;
    case "d3Failed":
      await patchFlags(api, guid, D3_FAILED_PATCHES);
      break;
    default: {
      const unreachable: never = operation;
      throw new Error(`Unsupported user state operation: ${String(unreachable)}`);
    }
  }

  const flags = await readFlags(api, guid);
  return snapshot(username, guid, testEnv, flags, operation, operationStatus);
}
