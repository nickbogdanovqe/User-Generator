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
  fullName: string;
  olbNumber: string;
  guid: string;
  partyId: string;
  taxId: string;
  username: string;
  password: string;
  accounts: ExternalAccount[];
};

export type ExternalPod =
  | "Money Movement"
  | "Account Servicing"
  | "Account Servicing (Comingled login)";

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
