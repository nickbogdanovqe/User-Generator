/**
 * Test profiles provisioned outside this app. Static reference data only —
 * never written to, and unrelated to the Blob-backed users the app creates.
 */

import type { TestEnv } from "@/lib/provision/types";

export type ExternalAccount = {
  label: string;
  number: string;
  note?: string;
};

export type ExternalProfile = {
  /** Absent for reference logins that only have a username. */
  fullName?: string;
  olbNumber?: string;
  guid?: string;
  partyId?: string;
  cif?: string;
  taxId?: string;
  username: string;
  password: string;
  interposeId?: string;
  email?: string;
  phone?: string;
  accounts: ExternalAccount[];
};

export type ExternalPod =
  | "Money Movement"
  | "Account Servicing"
  | "Account Servicing (Comingled login)"
  | "Retail reference";

export type ExternalUserGroup = {
  id: string;
  /** Envs these credentials are known to work in. */
  testEnvs: TestEnv[];
  pod: ExternalPod;
  userProfile: string;
  segment: string;
  accountTypes: string;
  qty: string;
  requiredBalance: string;
  purpose: string;
  profiles: ExternalProfile[];
};

const SHARED_PASSWORD = "Bank12345678!";

export const EXTERNAL_USER_GROUPS: ExternalUserGroup[] = [
  {
    id: "rockyretail1-balboa",
    testEnvs: ["dev", "tst"],
    pod: "Money Movement",
    userProfile: "RockyRetail1_Balboa",
    segment: "Retail",
    accountTypes: "Checking (FC, 49), Savings (65), Checking overdraft (AC)",
    qty: "4 profile / 4 DDA accounts",
    requiredBalance: "$500,000 (checking/savings); -$500 (AC)",
    purpose:
      "Full Pay & Transfer hub — internal + external transfers, Zelle, bill pay",
    profiles: [
      {
        fullName: "RockyRetail1 Balboa",
        olbNumber: "4607330000011440",
        guid: "9a869e63-5d28-3928-b564-593b22e9a4e4",
        partyId: "998187647",
        taxId: "202608182",
        username: "rockyretail1.balboa",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking FC", number: "181918522" },
          { label: "49", number: "181918529", note: "change type to 49" },
          { label: "Savings (65)", number: "181918515" },
          { label: "Checking overdraft (AC)", number: "181918543" },
        ],
      },
      {
        fullName: "RockyRetail3 Balboa",
        olbNumber: "4607330000011467",
        guid: "80730b5a-187a-3849-b766-bae2c31ade6f",
        partyId: "998187983",
        taxId: "202608251",
        username: "rockyretail3.balboa",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking FC", number: "181925823" },
          { label: "49", number: "181925858", note: "change type to 49" },
          { label: "Savings (65)", number: "181925809" },
          { label: "Checking overdraft (AC)", number: "181925837" },
        ],
      },
      {
        fullName: "RockyRetail4 Balboa",
        olbNumber: "4607330000011469",
        guid: "ef5db44d-7ccc-3c72-94d2-54c59c0d5518",
        partyId: "998187984",
        taxId: "202608252",
        username: "rockyretail4.balboa",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking FC", number: "181925886" },
          { label: "49", number: "181925893", note: "change type to 49" },
          { label: "Savings (65)", number: "181925879" },
          { label: "Checking overdraft (AC)", number: "181925851" },
        ],
      },
      {
        fullName: "RockyRetail5 Balboa",
        olbNumber: "4607330000011470",
        guid: "ae47f331-60be-392b-9deb-52a5cc2365ea",
        partyId: "998187985",
        taxId: "202608253",
        username: "rockyretail5.balboa",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking FC", number: "181925949" },
          { label: "49", number: "181925963", note: "change type to 49" },
          { label: "Savings (65)", number: "181925942" },
          { label: "Checking overdraft (AC)", number: "181925914" },
        ],
      },
    ],
  },
  {
    id: "johnsmb1-rambo",
    testEnvs: ["dev", "tst"],
    pod: "Money Movement",
    userProfile: "JohnSMB1_Rambo",
    segment: "SMB",
    accountTypes: "Checking (07, IC, 15, BC), Savings (66)",
    qty: "4 profile / 5 DDA accounts",
    requiredBalance: "$500,000 (checking/savings); -$250 / -$750 (overdrawn)",
    purpose:
      "Full SMB Pay & Transfer hub — internal transfers, Zelle, Direct Pay (PPD/CCD)",
    profiles: [
      {
        fullName: "JohnSMB1 Rambo",
        olbNumber: "4607330000011441",
        guid: "3d6fc112-e523-3dcf-9f5f-d44a087e2935",
        partyId: "1538059",
        taxId: "202608183",
        username: "johnsmb1.rambo",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking (07)", number: "181918585" },
          { label: "IC", number: "181918606", note: "change type to IC" },
          { label: "15", number: "181918613", note: "change type to 15" },
          { label: "BC", number: "181918599" },
          { label: "Savings 66", number: "181918571" },
        ],
      },
      {
        fullName: "JohnSMB3 Rambo",
        olbNumber: "4607330000011472",
        guid: "64ef9b95-c909-3772-9098-7e51c81d926e",
        partyId: "1538370",
        taxId: "202608254",
        username: "johnsmb3.rambo",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking (07)", number: "181925998" },
          { label: "IC", number: "181926005", note: "change type to IC" },
          { label: "15", number: "181926012", note: "change type to 15" },
          { label: "BC", number: "181926019" },
          { label: "Savings 66", number: "181926033" },
        ],
      },
      {
        fullName: "JohnSMB4 Rambo",
        olbNumber: "4607330000011473",
        guid: "d53c608d-6dbd-3b03-82e3-108b086b1424",
        partyId: "1538372",
        taxId: "202608255",
        username: "johnsmb4.rambo",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking (07)", number: "181926040" },
          { label: "IC", number: "181926047", note: "change type to IC" },
          { label: "15", number: "181926054", note: "change type to 15" },
          { label: "BC", number: "181926061" },
          { label: "Savings 66", number: "181926068" },
        ],
      },
      {
        fullName: "JohnSMB5 Rambo",
        olbNumber: "4607330000011474",
        guid: "034322f8-0f7d-32ab-b93a-6977ff1e9853",
        partyId: "1538373",
        taxId: "202608256",
        username: "johnsmb5.rambo",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking (07)", number: "181926103" },
          { label: "IC", number: "181926110", note: "change type to IC" },
          { label: "15", number: "181926117", note: "change type to 15" },
          { label: "BC", number: "181926131" },
          { label: "Savings 66", number: "181926124" },
        ],
      },
    ],
  },
  {
    id: "rockyretail2-balboa",
    testEnvs: ["dev", "tst"],
    pod: "Account Servicing",
    userProfile: "RockyRetail2_Balboa",
    segment: "Retail (Mass Market)",
    accountTypes: "Checking (FC) + debit card, Savings (65, optional)",
    qty: "1 profile / 2 accounts",
    requiredBalance: "$500,000",
    purpose: "Debit card, check image retrieval, stop check payment",
    profiles: [
      {
        fullName: "RockyRetail6 Balboa",
        olbNumber: "4607330000011471",
        guid: "29d1bf4d-6806-3d1f-9e49-08713a557179",
        partyId: "998187995",
        taxId: "202608258",
        username: "rockyretail6.balboa",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "FC", number: "181925984" },
          { label: "Savings 65", number: "181925991" },
          { label: "Debit card", number: "4451009993442695" },
        ],
      },
    ],
  },
  {
    id: "johnsmb2-rambo",
    testEnvs: ["dev", "tst"],
    pod: "Account Servicing",
    userProfile: "JohnSMB2_Rambo",
    segment: "SMB",
    accountTypes: "Checking (07) + debit card, Savings (66, optional)",
    qty: "1 profile / 2 accounts",
    requiredBalance: "$500,000",
    purpose: "SMB debit card, check image retrieval, stop check payment",
    profiles: [
      {
        fullName: "JohnSMB2 Rambo",
        olbNumber: "4607330000011442",
        guid: "3167dbe0-8b4d-34b0-a713-74423f62b3a3",
        partyId: "1538060",
        taxId: "202608185",
        username: "johnsmb2.rambo",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Checking 07", number: "181918592" },
          { label: "Debit card", number: "4607300011968396" },
          { label: "Savings 66", number: "181918578" },
        ],
      },
    ],
  },
  {
    id: "jamesco1-bond",
    testEnvs: ["dev", "tst"],
    pod: "Account Servicing (Comingled login)",
    userProfile: "JamesCO1_Bond",
    segment: "Retail + SMB",
    accountTypes: "Entitled to AS-1 + AS-2 accounts",
    qty: "1 login / 0 new accounts",
    requiredBalance: "n/a",
    purpose: "Comingled retail + business coverage for zero extra accounts",
    profiles: [
      {
        fullName: "DAVID WELCH NOBLIT",
        olbNumber: "4451150819122499",
        guid: "8ee62962-7659-3888-babe-e9b9b3b8934c",
        partyId: "100784484",
        taxId: "408782167",
        username: "noblitdw",
        password: SHARED_PASSWORD,
        accounts: [
          { label: "Business checking", number: "100489967" },
          { label: "Checking", number: "220007411502" },
        ],
      },
    ],
  },
  {
    id: "retail-reference",
    testEnvs: ["dev", "tst"],
    pod: "Retail reference",
    userProfile: "Retail reference",
    segment: "Retail",
    accountTypes: "Checking, line of credit",
    qty: "3 profiles",
    requiredBalance: "n/a",
    purpose: "Additional retail logins with interpose, CIF, email, and phone",
    profiles: [
      {
        username: "kgbooher824",
        password: SHARED_PASSWORD,
        interposeId: "00001234562000217831",
        guid: "e99c49b4-3666-3b41-b9e5-3a19fe475801",
        taxId: "410177770",
        cif: "100911401",
        email: "kgbooher824@ftb.com",
        phone: "(932) 424-2423",
        accounts: [{ label: "Checking", number: "100041036" }],
      },
      {
        username: "ednichols",
        password: SHARED_PASSWORD,
        interposeId: "00004451150818751082",
        guid: "fa88d7b1-a6fa-3360-9f94-89cfafc56b41",
        taxId: "428044227",
        cif: "101562712",
        email: "ednichols@ftb.com",
        phone: "(901) 442-3234",
        accounts: [
          { label: "Checking", number: "2785517" },
          { label: "Checking", number: "186530611" },
          { label: "Checking", number: "100049749" },
          { label: "Checking", number: "183262556" },
        ],
      },
      {
        username: "lamarjp",
        password: SHARED_PASSWORD,
        interposeId: "00001234578003601557",
        guid: "4d2728d9-0bba-346b-bdf1-968fe7c86d6b",
        taxId: "413843093",
        cif: "101271600",
        email: "lamarjp@ftb.com",
        phone: "(901) 442-3432",
        accounts: [
          { label: "Checking", number: "188927978" },
          { label: "Checking", number: "942292" },
          { label: "Checking", number: "942276" },
          { label: "Line of credit", number: "21000000801326" },
          { label: "Checking", number: "100050893" },
          { label: "Checking", number: "180048618" },
          { label: "Checking", number: "184873543" },
        ],
      },
    ],
  },
  {
    id: "mmretail",
    testEnvs: ["dev", "tst"],
    pod: "Money Movement",
    userProfile: "MM Retail",
    segment: "Retail",
    accountTypes: "Plaid-linked external account",
    qty: "2 profiles",
    requiredBalance: "n/a",
    purpose: "Retail logins used for external-transfer review in DEV and TST.",
    profiles: [
      {
        username: "mmretail_01",
        password: SHARED_PASSWORD,
        guid: "3238ab37-dd7d-3a62-a96a-388fd2dffe06",
        partyId: "998189583",
        interposeId: "00001234578000089509",
        accounts: [],
      },
      {
        username: "mmretail_02",
        password: SHARED_PASSWORD,
        guid: "a58d7234-da03-3dc1-8647-262fd71cfbdc",
        partyId: "998189584",
        interposeId: "00001234578000089525",
        accounts: [],
      },
    ],
  },
];

export const EXTERNAL_PODS: ExternalPod[] = Array.from(
  new Set(EXTERNAL_USER_GROUPS.map((group) => group.pod)),
);

export const EXTERNAL_SEGMENTS: string[] = Array.from(
  new Set(EXTERNAL_USER_GROUPS.map((group) => group.segment)),
);

export function countExternalProfiles(groups: ExternalUserGroup[]): number {
  return groups.reduce((total, group) => total + group.profiles.length, 0);
}
