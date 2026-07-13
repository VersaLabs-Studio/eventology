// ============================================================================
// notification-link — maps a web `action_url` (as stored on notification
// rows / carried in push payload data) to a route the mobile app can open.
// Shared by the in-app inbox tap handler and the OS push tap handler so
// both land in the same place.
// ============================================================================

export function mapActionUrlToRoute(actionUrl: string | null | undefined): string {
  if (!actionUrl) return '/';
  try {
    // action_url values are web paths (e.g. /my-tickets?reg=…); parse with a
    // dummy origin so relative and absolute forms both work.
    const u = new URL(actionUrl, 'http://x');
    const path = u.pathname;

    if (path.startsWith('/my-tickets')) return '/tickets?registered=1';
    if (path.startsWith('/ticket/')) return path; // mobile has /ticket/[id]
    if (path.startsWith('/my-events')) return '/my-events';
    if (path.startsWith('/events/')) {
      const slug = path.split('/').filter(Boolean).pop();
      return slug ? `/event/${slug}` : '/';
    }
    if (path.startsWith('/notifications') || path.startsWith('/settings/notifications')) {
      return '/notifications';
    }
    return '/';
  } catch {
    return '/';
  }
}
