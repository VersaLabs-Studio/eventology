import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NotificationPreferencesPanel } from "@/components/comms/notification-preferences-panel";

/**
 * Notification preferences — server-side auth check, then render the
 * client panel. Public tier so any authenticated user can reach it.
 */
export default async function NotificationPreferencesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/login?redirect=/settings/notifications");
  }

  return <NotificationPreferencesPanel />;
}
