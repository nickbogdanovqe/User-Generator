import {
  createDigitalBankingUsersApi,
  markUserAuroraMigrationComplete,
  type DigitalBankingUserProfile,
} from "@/lib/provision/digital-banking";
import {
  createFreshAuroraUserDraft,
  type DraftOverrides,
} from "@/lib/provision/draft";
import {
  createTransmitAdminApi,
  getTransmitEnvAvailability,
  removeUserFromAppByExternalUserIdIfExists,
} from "@/lib/provision/transmit";
import type { StoredUser, TestEnv } from "@/lib/provision/types";
import { saveStoredUser } from "@/lib/blob/users";

function flagIsTrue(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

function fhnValue(
  profile: DigitalBankingUserProfile,
  fhnIdType: string,
): string | undefined {
  return profile.fhnIds?.find((id) => id.fhnIdType === fhnIdType)?.fhnIdValue;
}

function assertProvisionedProfile(
  profile: DigitalBankingUserProfile,
  expected: { interpose: string; ecifId: string },
): void {
  const interpose = fhnValue(profile, "interpose");

  if (!interpose || interpose === "undefined") {
    throw new Error(
      "Digital Banking user is missing a usable interpose fhnId after create. " +
        "Login will fail with a generic Transmit error. Check the Interpose ID override.",
    );
  }

  if (interpose !== expected.interpose) {
    throw new Error(
      `Digital Banking persisted interpose "${interpose}" but expected "${expected.interpose}"`,
    );
  }

  // Login uses the `ecif` entry as the party id whenever it is present, including
  // the literal "undefined" create used to persist. GET canonicalizes the
  // write-only `ecifId` update back to `ecif`.
  const ecif = fhnValue(profile, "ecif");
  if (!ecif || ecif === "undefined" || ecif !== expected.ecifId) {
    throw new Error(
      `Digital Banking persisted ecif "${ecif ?? ""}" but expected "${expected.ecifId}". ` +
        "Login uses this value as the party id.",
    );
  }

  const status = profile.userStatus;
  if (
    !flagIsTrue(status?.auroraUser) ||
    !flagIsTrue(status?.migrationEligible) ||
    status?.migrationStatus !== "COMPLETE"
  ) {
    throw new Error(
      `Aurora migration flags incomplete after create (auroraUser=${String(
        status?.auroraUser,
      )}, eligible=${String(status?.migrationEligible)}, status=${String(
        status?.migrationStatus,
      )})`,
    );
  }
}

async function removeLoginCreatedTransmitUser(
  testEnv: TestEnv,
  externalUserId: string,
): Promise<void> {
  if (!getTransmitEnvAvailability()[testEnv]) return;
  const transmit = createTransmitAdminApi(testEnv);
  await removeUserFromAppByExternalUserIdIfExists(transmit, externalUserId);
}

export async function createFreshAuroraUser(
  testEnv: TestEnv,
  overrides: DraftOverrides = {},
): Promise<StoredUser> {
  // TEST_ENV still tags the request shape (username on dev, omitted on tst).
  // Login authenticates this password against Digital Banking and creates the
  // Transmit app user itself.
  process.env.TEST_ENV = testEnv;

  const draft = createFreshAuroraUserDraft(overrides);
  const digitalBanking = createDigitalBankingUsersApi();

  let externalUserId: string | undefined;

  try {
    const created = await digitalBanking.createUser({
      login: draft.username,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      password: draft.password,
      phoneNumbers: [draft.primaryPhoneNumber],
      fhnIds: [{ fhnIdType: "interpose", fhnIdValue: draft.interpose }],
    });
    externalUserId = created.guid;

    await digitalBanking.recoverUser(externalUserId);
    await digitalBanking.bindEcifId(externalUserId, {
      interposeId: draft.interpose,
      ecifId: draft.ecifId,
    });
    await markUserAuroraMigrationComplete(digitalBanking, externalUserId);

    const profile = await digitalBanking.getUser(externalUserId);
    assertProvisionedProfile(profile, {
      interpose: draft.interpose,
      ecifId: draft.ecifId,
    });

    const stored: StoredUser = {
      username: draft.username,
      password: draft.password,
      externalUserId,
      testEnv,
      ecifId: draft.ecifId,
      interposeId: draft.interpose,
      createdAt: new Date().toISOString(),
    };

    return saveStoredUser(stored);
  } catch (error) {
    if (externalUserId) {
      try {
        await removeLoginCreatedTransmitUser(testEnv, externalUserId);
      } catch {
        // best-effort cleanup
      }
      try {
        await digitalBanking.deleteUser(externalUserId);
      } catch {
        // best-effort cleanup
      }
    }
    throw error;
  }
}
