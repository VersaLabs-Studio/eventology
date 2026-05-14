# Eventology — Admin Tier Pages

> **Prerequisite:** Complete organizer tier pages first.

---

## Tier 3 Layout — `src/app/(admin)/layout.tsx`

Same dashboard shell pattern as organizer but with `AdminSidebar`. Visual distinction: accent-colored top border on the layout (`border-t-2 border-accent`) to clearly indicate admin context.

URL structure:
```
src/app/(admin)/admin/dashboard/page.tsx     → /admin/dashboard
src/app/(admin)/admin/moderation/page.tsx    → /admin/moderation
src/app/(admin)/admin/featured/page.tsx      → /admin/featured
src/app/(admin)/admin/users/page.tsx         → /admin/users
src/app/(admin)/admin/organizers/page.tsx    → /admin/organizers
src/app/(admin)/admin/audit-log/page.tsx     → /admin/audit-log
```

---

## Page X1: Platform Analytics — `src/app/(admin)/admin/dashboard/page.tsx`

**URL:** `/admin/dashboard`

### Stats Row (6 cards, 3x2 grid)
Use `StatCard` components with `platformStats` from mock data:
1. Total Events (156) — Calendar icon
2. Total Registrations (12,847) — Users icon
3. Active Users (8,432) — UserCheck icon
4. Active Organizers (89) — Building2 icon
5. Growth Rate (+23.5%) — TrendingUp icon
6. Conversion Rate (34.2%) — Target icon

### Charts (2x2 grid)
1. **Platform Growth** — Area chart, monthly data (Jan-May 2026), shows user + event growth
2. **Registrations by Category** — Donut chart with category colors
3. **Events by Sub-City** — Horizontal bar chart
4. **Daily Active Users** — Line chart (last 30 days)

### Bottom: Quick Actions
Row of 4 action cards: "Review Pending Events (3)", "Verify Organizers (2)", "Manage Featured", "View Audit Log" — each links to respective page.

---

## Page X2: Moderation Queue — `src/app/(admin)/admin/moderation/page.tsx`

**URL:** `/admin/moderation`

- Page header: "Event Moderation" with pending count badge
- Filter tabs: "Pending (3)" | "Approved" | "Rejected"
- **Pending tab:** List of `ModerationCard` components
  - Each card shows: event banner (medium), title, organizer (with avatar + verified status), submitted date, event date, category, type
  - Expandable description preview (click "Show More")
  - Action buttons: "Approve" (primary with CheckCircle icon), "Reject" (destructive with XCircle icon)
  - Reject opens a dialog with textarea for rejection reason + confirm button
  - On action: card animates out, toast notification, moves to approved/rejected tab
- **Approved tab:** Same cards but with "Approved on {date}" badge, "Revoke" action
- **Rejected tab:** Same cards with rejection reason displayed, "Reconsider" action

---

## Page X3: Featured Events — `src/app/(admin)/admin/featured/page.tsx`

**URL:** `/admin/featured`

- Page header: "Featured Events" with description "Manage homepage featured events"
- **Currently Featured** section:
  - `FeaturedEventManager` component — list of featured events
  - Each row: grip handle icon (visual), event banner thumbnail, title, featured since date, duration dropdown (7/14/30 days), "Unpin" button (destructive outline)
  - Empty state: "No featured events. Add events to promote them on the homepage."
- **Add to Featured** section:
  - Search input to find events by title
  - Results dropdown showing matching approved events
  - Select → opens dialog: confirm event, select duration (7/14/30 days), "Feature Event" button

---

## Page X4: User Management — `src/app/(admin)/admin/users/page.tsx`

**URL:** `/admin/users`

- Page header: "User Management" with total user count
- Stats mini-row: Attendees (count), Organizers (count), Admins (count) — small inline badges
- `UserTable` component (DataTable):
  - Columns: Avatar + Name, Email, Role (color-coded badge), Status (green dot active, red inactive), Joined, Events, Actions
  - Actions dropdown per row: "Change Role" (opens role select dialog), "Deactivate" / "Activate", "View Activity"
  - Search by name or email
  - Filter by role dropdown

---

## Page X5: Organizer Verification — `src/app/(admin)/admin/organizers/page.tsx`

**URL:** `/admin/organizers`

- Page header: "Organizer Verification" with pending count
- Tabs: "Pending (2)" | "Verified" | "Rejected"
- **Pending:** Grid of `OrganizerVerificationCard` components (2 columns)
  - Each card: large avatar, name, email, bio, website link, events count, member since
  - Verification documents section (mock: "Business License" and "ID Document" as file chips)
  - Actions: "Verify" (primary with BadgeCheck icon), "Reject" (destructive)
  - Verify shows confirmation dialog, adds verified badge
- **Verified:** Same cards with verified badge, "Revoke Verification" action
- **Rejected:** Same cards with rejection info

---

## Page X6: Audit Log — `src/app/(admin)/admin/audit-log/page.tsx`

**URL:** `/admin/audit-log`

- Page header: "Audit Log" with description "Every admin action is recorded"
- Filter row: date range inputs (from/to) + action type dropdown (All, Approve, Reject, Feature, User Management, Verification) + "Apply" button
- `AuditLogTable` component:
  - Columns: Timestamp (formatted), Action (with action-type icon), Actor (name with role badge), Target, Details
  - 25+ entries from mock data
  - Alternating row background for readability
  - Pagination at bottom (mock: Page 1 of 3)
- Export button: "Export Log" (downloads nothing, shows toast)
