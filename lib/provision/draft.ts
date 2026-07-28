import { randomInt, randomUUID } from "node:crypto";
import { FIXED_PASSWORD, type UserDraft } from "@/lib/provision/types";

export const SEED_IDS = {
  ecifId: "102175008",
  interpose: "00004451009944740791",
} as const;

const SEED = {
  firstName: "DOROTHY",
  lastName: "BUSHING",
  ...SEED_IDS,
} as const;

/** Digits-only FHN ids; reject empty / literal "undefined" from bad API mapping. */
export function normalizeOptionalFhnId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^undefined$/i.test(trimmed)) {
    throw new Error('FHN id must not be the literal string "undefined"');
  }
  if (!/^\d{5,32}$/.test(trimmed)) {
    throw new Error(
      "ECIF and Interpose IDs must be 5–32 digits when provided",
    );
  }
  return trimmed;
}

function buildUniquePhoneNumber(uniqueId: string): string {
  const areaCodes = ["202", "212", "213", "305", "312", "404", "415", "646"];
  let hash = 0;
  for (const character of `${uniqueId}1`) {
    hash = (hash * 31 + character.charCodeAt(0)) % 10_000_000;
  }
  const areaCode = areaCodes[hash % areaCodes.length];
  const lineNumber = (1_000 + (hash % 3_000)).toString().padStart(4, "0");
  return `+1${areaCode}555${lineNumber}`;
}

export type DraftOverrides = {
  ecifId?: string;
  interpose?: string;
};

export function createFreshAuroraUserDraft(
  overrides: DraftOverrides = {},
): UserDraft {
  const username = `mobileaurora_${randomInt(100_000_000, 999_999_999)}`;
  const uniqueId = `${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 8)}`;

  return {
    username,
    password: FIXED_PASSWORD,
    email: `${username}@firsthorizon.com`,
    firstName: `Auth${uniqueId.slice(0, 12)}`,
    lastName: SEED.lastName,
    primaryPhoneNumber: buildUniquePhoneNumber(uniqueId),
    ecifId: normalizeOptionalFhnId(overrides.ecifId) ?? SEED.ecifId,
    interpose: normalizeOptionalFhnId(overrides.interpose) ?? SEED.interpose,
  };
}
