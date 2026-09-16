import { EXTERNAL_USER_GROUPS } from "@/lib/external-users/catalog";
import { ExternalUsers } from "./external-users";

export const metadata = {
  title: "External users · User Generator",
};

export default function ExternalUsersPage() {
  return <ExternalUsers groups={EXTERNAL_USER_GROUPS} />;
}
