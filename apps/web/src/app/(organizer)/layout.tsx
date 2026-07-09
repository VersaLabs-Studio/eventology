import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

/**
 * Organizer route-group layout — server-side role enforcement.
 *
 * The Edge middleware (src/middleware.ts) only checks for the presence of a
 * session cookie; the actual role check happens here, on the Node runtime,
 * where the `pg`-backed `auth` instance is safe to use. This is the
 * canonical Next.js 15+ pattern: middleware = coarse auth, layouts =
 * fine-grained authorization.
 *
 * P3 (Extreme Modularization) — auth lives in one place, role policy
 * lives with the route group that owns the role.
 */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== 'organizer' && role !== 'admin')) {
    redirect('/');
  }

  return <DashboardShell variant="org">{children}</DashboardShell>;
}
