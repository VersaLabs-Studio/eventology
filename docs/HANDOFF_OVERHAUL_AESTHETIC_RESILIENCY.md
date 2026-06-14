# Handoff → OpenCode Mesh — Aesthetic Overhaul & Resiliency Hardening

> Source of truth: `IMPLEMENTATION_PLAN_OVERHAUL.md` (Apple-Silicon aesthetic +
> resiliency hardening), governed by the **restored 5-part master docs**
> (`docs/V1_MASTER_PART1…PART5`), the Architectural DNA (Six Pillars) and the
> `premium-ui` standard. **This is a web-only polish phase.** Web Phase 2 (Days
> 6–10) is merged into `dev` and auditor-approved (tag `phase3-day10`).
>
> **Sequencing:** Day 9 (mobile real-data) stays **deferred**. The Expo app lives
> on the untouched `mvp-demo` branch — do **not** touch `mvp-demo` or `apps/mobile`.
> Branch from `dev`, build on `feat/overhaul-aesthetic`, merge back to `dev`.

---

## MASTER-DOC ALIGNMENT (read this before the overhaul doc)

The five `V1_MASTER_PART*` docs were lost from the repo and have now been restored
(2026-06-10). This phase is governed by them. Key reconciliations:

1. **Where this sits in the master timeline.** Per Part 4, the master forward track
   after Day 10 is **Day 11 (Chapa payments) → 12 (revenue/payouts/refunds/promo) →
   13 (comms: email/SMS/push) → 14 (full AI deployment) → 15 (messaging/i18n) →
   16–22 (admin + organizer + mobile completion, QA, launch).** This Aesthetic
   Overhaul is **not** a master day — it's an out-of-band **hardening interlude** on
   the Phase-2-complete web app, triggered by the manual walkthrough. When it merges
   to `dev` and re-scores green, **the master Day 11+ track resumes.** Don't pull
   payments/AI/i18n work into this phase.
2. **Platform identity is AI-NATIVE (Part 1 §1, Part 2 §2, Part 3 §5).** This phase is
   purely visual/resiliency, but the AI surfaces are coming (Day 14): a floating
   `ChatWidget`, "Recommended For You" / "Events Like This" sections, AI summary
   toggles. When polishing, **leave room for / don't delete** these mount points, and
   make the glass/motion system reusable enough that the chat widget and AI panels
   inherit it for free later.
3. **Palette = sanctioned upgrade, not a redesign.** Part 5 rule #8: *"Do NOT redesign
   — upgrade."* The demo accent was `#16a34a` (Part 4 Day-0 theme); the overhaul
   **upgrades** it to vibrant emerald `#10B981`/`#059669` + a deep-obsidian dark
   theme. That's allowed — it's an evolution of the same identity. Apply it through
   OKLCH semantic tokens (see READ FIRST below), not scattered hex.
4. **Typography is already chosen.** Plus Jakarta Sans is the typeface in both the
   master mobile theme (Part 4 Day 0) and `IMPLEMENTATION_PLAN_OVERHAUL` §1.2 — mount
   it once on web (OVH-001), no new font decisions.
5. **This handoff is the working design-system spec.** Part 2 §8 ("Design System
   Carry-Forward") and Part 2 §6.2+ were truncated in the recovery backup (see the
   markers in those files). Until they're re-exported from Notion, **OVH-001…005 +
   the `premium-ui` skill are the authority** for tokens, glass, motion, and
   responsiveness. Flag, don't invent, anything those truncated sections would have
   covered.
6. **Branch naming.** Master Part 1 §4.1 calls the integration branch `develop`; the
   live repo uses **`dev`** as its canonical alias. Branch `feat/overhaul-aesthetic`
   off `dev`, `--no-ff` merge back to `dev`.
7. **Constraints inherited from Part 5 §5.** No `any` (§5.3); component/file boundary
   isolation (§5.2 — `components/<tier>/…`, shared in `components/shared/`); standard
   response/`cn()` conventions. The overhaul must respect these, not bypass them.

---

## READ FIRST — non-negotiables that override the overhaul doc's literals

The overhaul doc specifies a palette and font as **raw hex / names** for human
readability. Do **NOT** scatter hex codes through components. Our system is
**semantic OKLCH tokens** (P4 + P6).

1. **Translate the new palette into the existing OKLCH token system** in
   `apps/web/src/app/globals.css` (and any `@theme`/tokens file). Update the
   *values* of the existing semantic tokens (`--primary`, `--background`,
   `--card`, `--border`, `--muted`, `--ring`, etc.) for both light and dark.
   Components keep referencing `bg-primary` / `text-foreground` / `border-border`
   — they must **not** gain hardcoded `#10B981`/`#090A0F`. Convert hex → OKLCH.
   - Emerald accent `#10B981` / `#059669` → `--primary` (+ hover/active).
   - Light surfaces `#FFFFFF` / `#F5F5F7`, text `#1D1D1F`.
   - Dark surfaces `#090A0F` (bg) / `#12131A` (card) / `#1E202B` (border).
   - Ambient glow `0 0 25px rgba(16,185,129,0.15)` → a reusable shadow/utility
     token, not inline per component.
2. **One font swap, centralized.** Mount **Plus Jakarta Sans** via `next/font`
   in `apps/web/src/app/layout.tsx` and bind it to the existing font CSS var
   (e.g. `--font-sans`). Do not import fonts per-component.
3. **Don't regress Days 6–10.** Reviews/registration/calendar/search/maps and
   their factory hooks, RLS paths, and field-stripping must keep working. This is
   a visual/resiliency pass, not a behavior change.
4. **No `any`.** Type every new component's props.
5. **Build gate.** The brain will run `npx tsc --noEmit` **and** `npx next build`
   before merge and will not merge a red build. Don't report done until both are
   green locally. (Two prior reports claimed "build-clean" while `tsc` was red —
   this will be verified independently.)

---

## OVH-001 — Global theme & typography  **[do first]**

**STATUS:** OPEN
- Rewrite the OKLCH token values in `globals.css` for the emerald/obsidian
  palette above, light + dark. Keep token **names** stable.
- Mount Plus Jakarta Sans (variable subset) in `layout.tsx` → `--font-sans`.
- Verify contrast (WCAG AA on text/background pairs) in both themes.

### Acceptance
- Toggling theme shows the new palette everywhere via tokens; **grep finds no new
  hardcoded hex** in `apps/web/src/components` or `app` (OG-image routes are the
  only allowed exception — Satori can't read CSS vars). Type the OG routes' hex as
  local consts with a comment.

---

## OVH-002 — Resilient image pipeline + official logo

**STATUS:** OPEN
- **`apps/web/src/components/shared/fallback-image.tsx`** — a three-tier image:
  1. original `src`; 2. on `onError`, swap to a category/static backup under
  `public/`; 3. final fallback = an internal premium CSS-gradient box so layout
  never collapses. Wrap `next/image` where sizing allows; props fully typed.
- **`apps/web/src/components/shared/logo.tsx`** — render `/logo.svg` (from
  `public/`) with `size="sm" | "default" | "lg"` auto-scaling height. Replace
  inline SVG placeholders at call sites (nav, footer, auth).

### Acceptance
- Killing a remote image URL falls through to tier 2, then tier 3 — never a
  broken-image icon or collapsed box. Logo renders crisp at all three sizes.

---

## OVH-003 — Component-by-component premium polish

**STATUS:** OPEN
**Spec:** `EXECUTION_BLUEPRINT.md`, `BLUEPRINT_PAGES_PUBLIC.md`, `premium-ui`.
- Integrate `FallbackImage` into `EventCard`, the horizontal card variant, and
  event detail galleries.
- Apply glassmorphism (frosted translucent surfaces), the ambient emerald glow
  token on interactive boundaries, and Framer Motion micro-interactions with the
  standard easing `[0.25, 0.1, 0.25, 1]`.
- Cover loading / empty / error states for the polished surfaces.

### Acceptance
- Public discovery + event detail + dashboard surfaces read as premium/consistent;
  no generic ad-hoc utilities left on these paths.

---

## OVH-004 — Mobile responsiveness pass

**STATUS:** OPEN
- Fluid grids: replace hardcoded grids with
  `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
- Touch targets: every CTA/link area `min-h-[44px]`.
- Navigation: a Framer-Motion slide-out drawer for `< 768px`.

### Acceptance
- At 375px / 768px / 1280px the public routes and dashboard reflow cleanly; nav
  drawer works on small screens; no horizontal overflow; all CTAs ≥ 44px.

---

## OVH-005 — QA + UI audit  **[gate]**

**STATUS:** OPEN
- `npx tsc --noEmit` → 0 errors; `npx next build` → success.
- Pass a **`ui-auditor`** review.
- Visual audit at desktop + simulated mobile viewports (light + dark).

### Acceptance
- Build green, `ui-auditor` clean, screenshots/notes for desktop + mobile both
  themes. Then back to the brain for re-score → merge to `dev`.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **OKLCH semantic tokens, not hex.** Palette lives in `globals.css`; components
  reference tokens only.
- One centralized font mount; one reusable glow/shadow token.
- Don't regress Days 6–10 behavior; this is visual + resiliency only.
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only.
- **Don't regress AI mount points.** Preserve the `ChatWidget` / recommendation /
  AI-summary surfaces the master Day-14 AI work will fill; polish them, don't remove.
- **Stay in scope.** No payments/AI/i18n/messaging work — those are master Days 11–15
  and resume after this interlude merges to `dev`.
- Branch `feat/overhaul-aesthetic` off `dev`; `--no-ff` merge back to `dev` after
  the brain verifies the build is green and re-scores. Conventional Commits +
  `Co-Authored-By: Claude Opus 4.8` trailer.
- **Verify at runtime, not just `tsc`.** Then kimi review → Opus auditor → merge.
