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
  createTransmitOtpUser,
  removeUserFromAppByExternalUserIdIfExists,
  type TransmitAdminApi,
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

async function assertTransmitLoginReady(
  transmit: TransmitAdminApi,
  input: { username: string; externalUserId: string; testEnv: TestEnv },
): Promise<void> {
  const byExternal = await transmit.getUserByExternalUserId(
    input.externalUserId,
  );
  if (!byExternal.user_id) {
    throw new Error("Transmit user missing after create");
  }

  if (input.testEnv === "dev") {
    const byUsername = await transmit.getUserByUsername(input.username);
    if (byUsername.user_id !== byExternal.user_id) {
      throw new Error(
        "Transmit username lookup did not match external_user_id after create",
      );
    }
  }
}

export async function createFreshAuroraUser(
  testEnv: TestEnv,
  overrides: DraftOverrides = {},
): Promise<StoredUser> {
  // TEST_ENV still tags the request shape (username on dev, omitted on tst).
  // Transmit client id, secret, and base URL come from the matching env.
  process.env.TEST_ENV = testEnv;

  const draft = createFreshAuroraUserDraft(overrides);
  const digitalBanking = createDigitalBankingUsersApi();
  const transmit = createTransmitAdminApi(testEnv);

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

    await createTransmitOtpUser(transmit, {
      username: draft.username,
      password: draft.password,
      email: draft.email,
      firstName: draft.firstName,
      lastName: draft.lastName,
      primaryPhoneNumber: draft.primaryPhoneNumber,
      externalUserId,
      testEnv,
    });

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
    await assertTransmitLoginReady(transmit, {
      username: draft.username,
      externalUserId,
      testEnv,
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
        await removeUserFromAppByExternalUserIdIfExists(
          transmit,
          externalUserId,
        );
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
