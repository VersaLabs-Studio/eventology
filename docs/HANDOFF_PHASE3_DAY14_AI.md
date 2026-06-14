# Handoff → OpenCode — Phase 3 Day 14: Full AI Deployment (large module)

> Source of truth: **`docs/V1_MASTER_PART3_INTEGRATIONS.md` §5 (AI/OpenRouter), Part 2
> (AI features), Part 4 Day 14.** Governed by Architectural DNA (Six Pillars), `premium-ui`,
> `security-patterns`, `performance-patterns`.
>
> **Scope discipline (standing directive):** one large feature module — build all four AI
> surfaces as a single gated unit. Non-blocking defects fold forward into the next handoff;
> only must-fixes (security fail-open where it should fail-closed, data corruption, build-red)
> bounce the branch.
>
> **Branch `feat/phase3-day14-ai` off `dev`; `--no-ff` merge back after the brain gates
> (`tsc --noEmit` + `next build`) and audits the unit.** Do **not** touch `mvp-demo` or
> `apps/mobile`.
>
> **Provider posture (decided):** AI runs behind a **stub seam, same pattern as comms/payments**
> — default `stub`, fully testable today with no key. OpenRouter is built **live-ready, not
> permanently deferred**: Kidus supplies the API key + real model IDs when ready, and cutover is
> `AI_PROVIDER=openrouter` + dropping the IDs into config — **no code edit**. See the LIVE
> CUTOVER CHECKLIST at the bottom.

---

## WHAT ALREADY EXISTS (do not rebuild — wrap + wire)

`packages/ai` is substantial but **stranded** — implemented, typed, and unwired:

- **`packages/ai/src/client.ts`** — `callAI(options)`: direct OpenRouter HTTP client, 8-model
  fallback chain, tier routing (`heavy` 0‑1 / `medium` 2‑4 / `light` 5‑7), 30s timeout, throws if
  `OPENROUTER_API_KEY` is unset. **`MODEL_CHAIN` is 8 hardcoded placeholder IDs** — these get
  moved to config and replaced with Kidus-supplied IDs (AI-001).
- **`packages/ai/src/cache.ts`** — `getCachedResponse / setCachedResponse / hashPrompt /
  setCacheClient` over the `ai_cache` table (migration `018`, RLS service-role-only). **`setCacheClient`
  is never called anywhere** — the cache is dead until wired (AI-001).
- **`packages/ai/src/services/` — all 18 services implemented** and barrel-exported:
  `generateEventDescription, generateEventSummary, generateEventTags, generateMarketingCopy,
  generatePricingSuggestion, generateAnalyticsNarrative, generateAttendeeInsights,
  generatePerformancePrediction, moderateContent, detectFraud, translateContent, chatbotResponse,
  generateReport, recommendEvents, searchWithNLP, generatePlatformHealthSummary, analyzeAuditLog,
  generateEventRecap`. Uniform pattern: cache (where sensible) → `callAI` → `JSON.parse` →
  **`return null` on any failure** (best-effort). `detectFraud`/`chatbotResponse` are intentionally
  uncached; `detectFraud` already documents **fail-open** ("default to allow on failure").
- **`packages/ai/src/types.ts`** — strict input/output types for all 18 (no `any`).
- **`supabase/migrations/018_ai_cache.sql`** — `ai_cache` + `clean_expired_ai_cache()`.
- **`apps/web/.env.example`** — `OPENROUTER_API_KEY=<openrouter-key>` already present.

**Not built yet (= this module):** the provider seam, any API routes, any UI, any persistence of AI
outputs (fraud signals, moderation results, chat sessions), cache wiring, rate limiting.

**"Semantic search" clarification:** the scaffolding is **LLM NLP query-interpretation**
(`searchWithNLP` → structured filters), **not** pgvector embeddings. V1 ships NLP-based search over
the existing event filters. True vector/embedding search is **out of scope (V2)** — do not add
pgvector or embedding columns this phase.

**Verified facts:** RLS (016) is authz source of truth; `createAuthedClient` user-scoped,
`createServiceClient` system/AI ops (justify in a comment); better-auth `session.user.id` = profile
UUID; secrets from `process.env` only. Factory reference to mirror: `lib/payments/index.ts`
`getPaymentProvider()` + loud config guard; `lib/comms/index.ts` `getChannelProvider()`.

---

## AI-001 — Provider seam + config-driven model chain + cache wiring  **[do first]**

**STATUS:** OPEN

Introduce the stub seam at the `callAI` boundary so the 18 services keep working unchanged while
becoming testable without a key.

- **`packages/ai/src/provider.ts`** — `AIProvider` interface:
  `complete(options: AIRequestOptions & { task: AITask }): Promise<AIResponse>`. Add a required
  `task` discriminant to `AIRequestOptions` (a string-literal union of the 18 service names) so the
  stub can return a correctly-shaped payload per service.
- **`StubAIProvider`** (default) — returns **deterministic, valid-JSON** responses keyed on `task`,
  each matching that service's `*Output` type (e.g. `recommend_events` → a small ranked list drawn
  from the input's `available_events`; `detect_fraud` → `{is_suspicious:false, risk_score:0, …,
  recommended_action:'allow'}`; `search_with_nlp` → echo the query into `keywords` + naive filters;
  `chatbot_response` → a canned tier-appropriate reply). No network. Deterministic given the same
  input (stable for tests/demos). Co-locate the per-task stub generators (a `stub-fixtures.ts`
  map) so adding a service = adding one fixture.
- **`OpenRouterProvider`** — moves the existing `client.ts` OpenRouter logic behind the interface
  (the 8-model fallback, timeouts, error handling — unchanged). Reads the model chain from config
  (below), not a hardcoded constant.
- **`getAIProvider()`** factory keyed on `process.env.AI_PROVIDER` (default `'stub'`). If
  `AI_PROVIDER=openrouter`: require `OPENROUTER_API_KEY` **and** a non-empty configured model chain,
  else throw the same **loud config error** as payments/comms. No silent fallback to stub.
- **Refactor `callAI`** to delegate: `callAI(opts) => getAIProvider().complete(opts)`. The 18
  services change only by passing their `task` tag — their cache/parse/`return null` logic stays.
- **Config-driven model chain:** move `MODEL_CHAIN` + the tier start-indices out of `client.ts` into
  `packages/config/src/constants.ts` (or a dedicated `ai.config.ts`), env-overridable
  (`AI_MODEL_CHAIN` comma-separated + tier boundaries). **Leave the 8 placeholder IDs in as
  documented defaults marked `// TODO replace with Kidus-supplied OpenRouter model IDs`.** Nothing
  downstream hardcodes a model id.
- **Wire the cache:** call `setCacheClient(createServiceClient())` once at the AI entry boundary
  (a small `lib/ai/init.ts` in the web app, invoked by the route handlers / a server init module).
  Stub responses **may** still be cached (cheap + consistent), or bypass cache when
  `AI_PROVIDER=stub` — your call, but document it.

### Acceptance
With no env set, every service resolves through `StubAIProvider` and returns a valid, type-correct
output (never throws, never null-due-to-missing-key). `AI_PROVIDER=openrouter` without key/models
throws a clear config error. `tsc` clean. The model chain is sourced from config, not hardcoded in
`client.ts`.

---

## AI-002 — Schema delta (persisted AI outputs)  **[schema-first, before wiring]**

**STATUS:** OPEN

New migration `027_ai.sql` (+ regenerate `packages/schemas` types). Persist the AI outputs that feed
workflows; transient ones (recommendations, NLP search, narratives) stay uncached-or-ai_cache-only.

- **`fraud_signals`** — id, subject_type (`registration|payment|ticket_use|promo_code`), subject_id,
  user_id FK, risk_score NUMERIC, flags TEXT[], recommended_action TEXT, reason TEXT, status
  (`open|reviewed|dismissed|actioned`), reviewed_by, created_at. Feeds the admin review queue.
  **Advisory only** — never auto-blocks (see security guardrail).
- **`content_moderation`** — id, content_type (`event_description|review|message|profile_bio`),
  content_id, is_safe BOOL, severity, flags TEXT[], suggested_action, reason, status, created_at.
  Wired into event submission + review creation.
- **`ai_chat_sessions`** + **`ai_chat_messages`** — per-user chat history (session: id, profile_id,
  tier, context JSONB, created_at; message: id, session_id FK, role, content, created_at). RLS:
  a user sees only their own sessions; admins via role guard.
- RLS policies for all (016 patterns). Indexes on the FK + `status`/`created_at` lookups.
- Extend `notification_type` only if you fire AI-driven notifications (e.g. moderation rejection) —
  reuse the comms `notify()` seam from Day 13, don't fork.

### Acceptance
Migration applies clean; types regenerated; RLS enforced (user-scoped chat/sessions, service-role
for fraud/moderation writes); `tsc` sees the new tables.

---

## AI-003 — Discovery surface (recommendations + NLP search)

**STATUS:** OPEN

- **Recommendations:** `GET /api/protected/recommendations` — loads the user's prefs + past
  attendance + available events (service-role read), calls `recommendEvents`, returns ranked list.
  UI: a "Recommended for you" rail on the home/discovery page (premium-ui, skeleton while loading,
  graceful empty state when the service returns null/stub-empty).
- **NLP search:** wire `searchWithNLP` into the existing search flow — a `POST
  /api/public/search/interpret` (or fold into the current search endpoint) that turns a natural
  query into the structured filters the existing search already consumes. Must **degrade
  gracefully**: if AI returns null, fall back to the current keyword search unchanged.

### Acceptance
Home shows a recommendations rail (stub yields a deterministic list); typing a natural-language query
("free tech meetups next weekend") produces sensible filters via stub, and an AI outage falls back to
plain search with no error surfaced to the user.

---

## AI-004 — Organizer assist surface (content + analytics generation)

**STATUS:** OPEN

Wire the organizer-facing generators into the event create/edit + dashboards (all best-effort,
behind explicit user action — a button, never auto-firing on load):

- **Create/edit:** `generateEventDescription`, `generateEventTags`, `generateMarketingCopy`,
  `generatePricingSuggestion` — "✨ Generate" affordances that fill fields the organizer can edit
  before saving. Never overwrite without confirmation.
- **Dashboards:** `generateAnalyticsNarrative`, `generateAttendeeInsights`,
  `generatePerformancePrediction` on the event analytics page; `generateReport` +
  `generateEventRecap` as on-demand exports.
- Endpoints under `/api/protected/ai/*`, organizer/admin role-guarded (caller must own the event or
  be admin — mirror the refund-route guard). Rate-limited (AI-007).

### Acceptance
An organizer can generate a description/tags/marketing/pricing on create (stub returns deterministic
copy), and view a narrative/insights/prediction on analytics. All outputs are editable, none auto-
persist without the organizer saving. Role guard blocks non-owners (403).

---

## AI-005 — Attendee chat assistant (tiered)

**STATUS:** OPEN

- **`POST /api/protected/ai/chat`** (+ a public-tier variant if anonymous chat is in scope) — calls
  `chatbotResponse` with the conversation history + server-resolved context. Persists to
  `ai_chat_sessions`/`ai_chat_messages` (AI-002).
- **Tier is SERVER-ENFORCED, never trusted from the client** — derive `tier` from the session's role
  (`public|organizer|admin|support`). A public user must never receive an admin-tier system prompt or
  admin data in context. This is a security guardrail, not a preference.
- UI: a premium chat widget (bell-style entry or floating launcher), streaming-optional (stub returns
  instantly), `escalate_to_human` surfaced as a "talk to support" affordance.
- Rate-limited per user (AI-007); uncached (conversations are unique — matches the service).

### Acceptance
Chat works end-to-end on stub (deterministic reply), history persists per-user (RLS-scoped), tier is
derived server-side (verified: a public session cannot obtain organizer/admin context), and an AI
outage shows a friendly "assistant unavailable" state — never a crash.

---

## AI-006 — Trust & safety surface (moderation + fraud + admin intelligence)

**STATUS:** OPEN

- **Moderation:** call `moderateContent` on event submission and review creation. On
  `suggested_action='reject'`/high severity → write a `content_moderation` row and route to the admin
  queue (and optionally notify via Day 13 `notify()`). **Fail-open:** if AI is unavailable, allow the
  content through but queue it for manual review — never hard-block a user on an AI hiccup.
- **Fraud:** call `detectFraud` (best-effort) on registration / payment / promo paths. Write a
  `fraud_signals` row when suspicious. **ADVISORY ONLY in V1 — never auto-block a registration or
  payment.** `recommended_action:'block'` raises the signal's priority for human review; it does not
  deny the user. (This preserves the established fail-open posture and avoids false-positive revenue
  loss.) Wire so the AI call cannot delay/break the financial path (fire-and-forget or post-commit).
- **Admin intelligence:** `analyzeAuditLog` + `generatePlatformHealthSummary` on the admin dashboard;
  a fraud/moderation review queue surfacing the new tables.

### Acceptance
Submitting borderline content creates a moderation row + admin-queue entry (stub deterministic); a
flagged registration creates a `fraud_signals` row **without blocking** the registration or payment;
admin dashboard renders health + audit narratives. Crucially: **an AI failure never blocks a
registration, payment, or content submission** (verify by forcing the provider to throw).

---

## AI-007 — Cross-cutting: rate limiting, best-effort, i18n + GATE

**STATUS:** OPEN

- **Rate limiting:** AI endpoints are cost/DoS vectors even on free tier. Add per-user rate limits on
  every `/api/**/ai/*` route (reuse any existing limiter; else a simple per-user token bucket in the
  DB/edge). Document the limits.
- **Best-effort everywhere:** no AI call may block or fail a core flow (registration, payment,
  content save, search). Every call is `try/catch → null → graceful fallback`. The services already do
  this — preserve it at the route layer.
- **i18n:** user-facing AI **chrome** (buttons, empty/error states, "assistant unavailable") goes
  through `packages/locales` (en + am). AI-**generated** body text is model output, not a static
  string — exempt, but the surrounding UI is not.
- **No `any`** — provider, task union, stub fixtures, route payloads all typed.
- **GATE:** `npx tsc --noEmit` → 0; `npx next build` → success; `ui-auditor` pass on the new UI.
  Runtime-verify **all four surfaces on stub**: a recommendation rail, an NLP search, an organizer
  generate, a chat round-trip, a moderation+fraud write. Force the provider to throw and confirm **no
  core flow breaks** (the fail-open/advisory contract).

### Acceptance
Both builds green; all four surfaces work on stub; rate limits enforced; AI failure degrades
gracefully on every surface; migration applied + types regenerated. Then kimi review → brain
re-score → `--no-ff` merge to `dev` → tag `phase3-day14`.

---

## OUT OF SCOPE (later master days)
True vector/embedding semantic search (pgvector — V2); live OpenRouter calls until Kidus provides the
key + model IDs; mobile AI surfaces (`apps/mobile` untouched); messaging/i18n full pass (**Day 15**);
admin/organizer polish (**Day 16+**). Don't auto-block any user action on AI output in V1.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **Migration `027` before wiring.** Regenerate types after applying.
- **Stub seam is the default** — `getAIProvider()` mirrors `getPaymentProvider()`/`getChannelProvider()`:
  default `stub`, loud config error when `openrouter` is selected without key + model chain. No silent
  fallback. The whole module is fully exercisable with zero keys.
- **Model chain lives in config, env-overridable** — never hardcode a model id downstream. Placeholder
  IDs stay marked for replacement.
- **AI is advisory + fail-open** — moderation/fraud **never auto-block** a user in V1; they flag for
  human review. An AI outage must never break registration, payment, content save, or search.
- **Chat tier is server-enforced** from the session role — never trust a client-supplied tier; no
  cross-tier data leakage.
- **Rate-limit every AI endpoint.** Cost + abuse control.
- **No `any`.** Secrets from `process.env`; `createAuthedClient` user-scoped, `createServiceClient` for
  AI/system writes (justify in a comment).
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only.
- Branch `feat/phase3-day14-ai` off `dev`; `--no-ff` merge after the brain verifies `tsc --noEmit`
  + `next build` green and audits the unit. Conventional Commits + `Co-Authored-By: Claude Opus 4.8`.
- **Build gate is independent** — the brain re-runs both builds and won't merge red. Report done only
  when both are green locally, after building the **entire** module.

---

## 🔌 LIVE CUTOVER CHECKLIST (when Kidus provides key + model IDs)
A checklist, not a code hunt — AI-001 must make all of these config-only:
1. Set `OPENROUTER_API_KEY` in env.
2. Replace the placeholder IDs in the AI model-chain config with Kidus-supplied OpenRouter model IDs
   (and confirm the `heavy/medium/light` tier boundaries).
3. Set `AI_PROVIDER=openrouter`.
4. Confirm `getAIProvider()` resolves to `OpenRouterProvider` and the config guard passes.
5. Smoke-test one service per tier (heavy: `detectFraud`; medium: `recommendEvents`; light:
   `translateContent`) against the live chain; confirm cache writes land in `ai_cache`.
No application-code change should be required for any of the above.
