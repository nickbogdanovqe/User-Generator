import {
  createDigitalBankingUsersApi,
  isNotFoundError,
} from "@/lib/provision/digital-banking";
import {
  createTransmitAdminApi,
  makeUserFreshForLoginByUsernameIfExists,
  removeUserFromAppByExternalUserIdIfExists,
} from "@/lib/provision/transmit";
import type { StoredUser } from "@/lib/provision/types";
import { deleteStoredUser } from "@/lib/blob/users";

export async function deleteFreshAuroraUser(user: StoredUser): Promise<{
  warnings: string[];
}> {
  // Mirror Maestro — tag process env for any helpers that read TEST_ENV.
  process.env.TEST_ENV = user.testEnv;

  const digitalBanking = createDigitalBankingUsersApi();
  const transmit = createTransmitAdminApi();
  const warnings: string[] = [];

  try {
    await removeUserFromAppByExternalUserIdIfExists(
      transmit,
      user.externalUserId,
    );
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : "Transmit cleanup by id failed",
    );
  }

  try {
    await makeUserFreshForLoginByUsernameIfExists(transmit, user.username);
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? error.message
        : "Transmit cleanup by username failed",
    );
  }

  try {
    await digitalBanking.deleteUser(user.externalUserId);
  } catch (error) {
    if (!isNotFoundError(error)) {
      warnings.push(
        error instanceof Error
          ? error.message
          : "Digital Banking delete failed",
      );
    }
  }

  try {
    await deleteStoredUser(user.testEnv, user.username, user.pathname);
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : "Blob delete failed",
    );
  }

  return { warnings };
}
