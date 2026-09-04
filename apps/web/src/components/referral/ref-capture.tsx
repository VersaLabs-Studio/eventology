'use client';

// ============================================================================
// RefCapture — captures ?ref=CODE into a cookie on landing (HO-E)
// ============================================================================
// Mounted on the home page. Writes `eventology_ref` (30 days, Lax) which the
// better-auth signup databaseHook reads to attribute the invitee. The value
// is a bare alphanumeric code — validated before the cookie is written so
// arbitrary junk can't land in the cookie.
// ============================================================================

import * as React from "react";
import { useSearchParams } from "next/navigation";

const REF_COOKIE = "eventology_ref";
const CODE_RE = /^[A-Za-z0-9]{4,16}$/;

export function RefCapture() {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref || !CODE_RE.test(ref)) return;

    // Don't churn the cookie if it's already this code.
    if (document.cookie.includes(`${REF_COOKIE}=${ref}`)) return;

    document.cookie = `${REF_COOKIE}=${ref}; max-age=${30 * 86400}; path=/; SameSite=Lax`;
  }, [searchParams]);

  return null;
}
