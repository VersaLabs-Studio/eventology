import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProfilePanel } from "./_components/profile-panel";

/**
 * Profile page — server-side auth check, then render the client panel.
 * Accessible to any authenticated user (not route-group gated).
 */
export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/login?redirect=/profile");
  }

  return <ProfilePanel />;
}
