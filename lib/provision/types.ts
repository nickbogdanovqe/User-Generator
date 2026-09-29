export type TestEnv = "dev" | "tst";

export type StoredUser = {
  username: string;
  password: string;
  externalUserId: string;
  testEnv: TestEnv;
  createdAt: string;
  /** Party id stored via the post-create `ecifId` update. */
  ecifId?: string;
  interposeId?: string;
  pathname?: string;
};

export type UserDraft = {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryPhoneNumber: string;
  ecifId: string;
  interpose: string;
};

export const FIXED_PASSWORD = "Bank1234567!";

export function isTestEnv(value: string): value is TestEnv {
  return value === "dev" || value === "tst";
}
