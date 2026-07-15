import { randomInt, randomUUID } from "node:crypto";
import { FIXED_PASSWORD, type UserDraft } from "@/lib/provision/types";

const SEED = {
  firstName: "DOROTHY",
  lastName: "BUSHING",
  ecifId: "102175008",
  interpose: "00004451009944740791",
} as const;

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

export function createFreshAuroraUserDraft(): UserDraft {
  const username = `mobileaurora_${randomInt(100_000_000, 999_999_999)}`;
  const uniqueId = `${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 8)}`;

  return {
    username,
    password: FIXED_PASSWORD,
    email: `${username}@firsthorizon.com`,
    firstName: `Auth${uniqueId.slice(0, 12)}`,
    lastName: SEED.lastName,
    primaryPhoneNumber: buildUniquePhoneNumber(uniqueId),
    ecifId: SEED.ecifId,
    interpose: SEED.interpose,
  };
}
