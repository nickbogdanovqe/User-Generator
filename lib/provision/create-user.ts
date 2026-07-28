import {
  createDigitalBankingUsersApi,
  markUserAuroraMigrationComplete,
} from "@/lib/provision/digital-banking";
import {
  createFreshAuroraUserDraft,
  type DraftOverrides,
} from "@/lib/provision/draft";
import {
  createTransmitAdminApi,
  createTransmitOtpUser,
  removeUserFromAppByExternalUserIdIfExists,
} from "@/lib/provision/transmit";
import type { StoredUser, TestEnv } from "@/lib/provision/types";
import { saveStoredUser } from "@/lib/blob/users";

export async function createFreshAuroraUser(
  testEnv: TestEnv,
  overrides: DraftOverrides = {},
): Promise<StoredUser> {
  // Mirror Maestro linkTransmitAdminCredentialsFromTestEnv — shared DB +
  // Transmit *_TST creds; TEST_ENV drives Transmit username/password-auth shape.
  process.env.TEST_ENV = testEnv;

  const draft = createFreshAuroraUserDraft(overrides);
  const digitalBanking = createDigitalBankingUsersApi();
  const transmit = createTransmitAdminApi();

  let externalUserId: string | undefined;

  try {
    const created = await digitalBanking.createUser({
      login: draft.username,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      password: draft.password,
      phoneNumbers: [draft.primaryPhoneNumber],
      fhnIds: [
        { fhnIdType: "ecif", fhnIdValue: draft.ecifId },
        { fhnIdType: "interpose", fhnIdValue: draft.interpose },
      ],
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
    await markUserAuroraMigrationComplete(digitalBanking, externalUserId);

    const stored: StoredUser = {
      username: draft.username,
      password: draft.password,
      externalUserId,
      testEnv,
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
