# Codebase Concerns

**Analysis Date:** 2026-04-30

## Tech Debt

**PowerSync CRUD action duplication:**
- Issue: CRUD handling, authorization checks, and DTO resolution are implemented in many near-identical action classes, which increases drift risk when behavior changes.
- Files: `app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyBoatPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTripPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTicketTypePowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyBookingTicketPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTemplateDayPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTemplateDaySlotPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyTemplateDayDatePowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyBoatTypePowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyBoatProgramPowerSyncCrudAction.php`, `app/Actions/PowerSync/ApplyWaterRoutePowerSyncCrudAction.php`
- Impact: Bug fixes and authorization changes must be repeated manually; one missed class creates inconsistent behavior across entity types.
- Fix approach: Extract a shared CRUD applier pattern (op dispatch + common authorization/error mapping) and keep entity-specific validation/mutation isolated.

**PowerSync runtime monolith in frontend:**
- Issue: Sync lifecycle, subscriptions, outbox state, bootstrap, and error handling are concentrated in one large singleton-style runtime module.
- Files: `resources/js/powersync/app-powersync.runtime.ts`
- Impact: High coupling makes safe changes difficult and increases regression risk in offline/sync behavior.
- Fix approach: Split into focused modules (bootstrap, subscriptions, outbox, collection registry) with a small public facade and dedicated tests.

**Large page-level components with mixed concerns:**
- Issue: Several Vue pages are very large and mix domain logic, UI state, and orchestration.
- Files: `resources/js/pages/AppTicketTypesPage.vue`, `resources/js/pages/AppProgramEditPage.vue`, `resources/js/pages/AppTripEditPage.vue`, `resources/js/pages/AppBoatsPage.vue`
- Impact: High cognitive load and fragile edits; small changes can trigger unrelated UI regressions.
- Fix approach: Extract composables and child components by domain slice (validation, submit orchestration, list/table rendering).

## Known Bugs

**Program create can fail with duplicate slug as server error:**
- Symptoms: Creating a program with an existing slug can bubble to a database unique-constraint failure instead of a validation-level client error.
- Files: `app/Data/Programs/ProgramStoreData.php`, `app/Http/Controllers/Api/ProgramController.php`, `database/migrations/2026_04_23_120002_create_programs_table.php`
- Trigger: `POST /api/programs` with `slug` already present in `programs.slug`.
- Workaround: Pre-check slug availability in the client before submit and retry with a different slug.

## Security Considerations

**Unsafe default JWT secret fallback for PowerSync:**
- Risk: If env configuration is incomplete, the app can issue tokens with a known default secret.
- Files: `config/powersync.php`, `app/Services/PowerSyncTokenIssuer.php`
- Current mitigation: JWTs are only issued for authenticated requests.
- Recommendations: Remove default fallback for `jwt_secret`; fail fast at boot when secret is missing.

**Login endpoint lacks explicit rate limiting:**
- Risk: `/login` is exposed without throttle middleware, increasing brute-force attack surface.
- Files: `routes/web.php`, `app/Http/Controllers/Auth/SessionController.php`
- Current mitigation: Standard Laravel session auth and credential validation.
- Recommendations: Add route-level throttling (for example, `throttle` middleware keyed by IP/email tuple).

**Boat type policy currently allows all authenticated users:**
- Risk: Any authenticated back-office account can mutate any boat type regardless of program context.
- Files: `app/Policies/BoatTypePolicy.php`, `app/Http/Controllers/Api/MediaController.php`
- Current mitigation: Commented as intentional V1 behavior.
- Recommendations: Enforce program-manager checks (aligned with `Program::userCanManage`) if cross-staff global edit is not a permanent product rule.

## Performance Bottlenecks

**Synchronous FIFO PowerSync batch processing inside one transaction:**
- Problem: Entire CRUD batches run serially in a single DB transaction.
- Files: `app/Http/Controllers/Api/PowerSyncUploadController.php`
- Cause: `foreach` over `crud` entries within one `DB::transaction`.
- Improvement path: Enforce batch size limits and consider chunked transactional boundaries for large uploads.

**Per-program authorization loop can trigger N+1 query behavior:**
- Problem: Boat mutation authorization loops related programs and checks each with a relation query.
- Files: `app/Actions/PowerSync/ApplyBoatPowerSyncCrudAction.php`, `app/Models/Program.php`
- Cause: `ensureUserMayMutateBoat` loads programs and calls `Program::userCanManage` repeatedly (`users()->exists()` per program).
- Improvement path: Replace loop with a single authorization query using joins/exists over `boat_program` + `program_user`.

**Client-side blocking wait on upload queue drain:**
- Problem: Program/boat creation waits for outbox drain with 75ms polling up to 45s.
- Files: `resources/js/powersync/app-powersync.runtime.ts`, `resources/js/models/programs/programs.model.ts`, `resources/js/models/boats/boats.model.ts`
- Cause: `waitForUploadQueueDrained` polling loop is called on write flows.
- Improvement path: Use optimistic UI completion and background sync confirmation instead of blocking foreground UX.

## Fragile Areas

**Global mutable sync state and lifecycle subscriptions:**
- Files: `resources/js/powersync/app-powersync.runtime.ts`
- Why fragile: Multiple module-level refs/subscriptions (`powerSyncStatusUnsubscribe`, scope subscriptions, collection refs) make initialization/cleanup ordering critical.
- Safe modification: Preserve init/teardown invariants and add tests around reconnect, logout, scope changes, and bootstrap failure recovery.
- Test coverage: Gaps in frontend tests for runtime lifecycle and subscription transitions.

**Large all-in-one PowerSync integration tests:**
- Files: `tests/Feature/PowerSyncUploadTicketTypeBookingTicketTest.php`
- Why fragile: Very large scenario file (1000+ lines) is difficult to reason about and can hide unrelated regressions.
- Safe modification: Split by entity and behavior (ticket types vs booking tickets; auth vs validation vs mutation).
- Test coverage: Good breadth for this domain but maintainability is low due to test size.

## Scaling Limits

**No upper bound on PowerSync upload batch size:**
- Current capacity: Validation requires `crud` to be an array with minimum one item.
- Limit: Large batches can create long transactions, request timeouts, and lock contention.
- Scaling path: Add a server-side maximum item count and reject oversize payloads early.

**Public programs endpoint is unpaginated full fetch:**
- Current capacity: Returns all active, non-archived programs in one query/response.
- Limit: Response size and media lookup overhead grow linearly with program count.
- Scaling path: Add pagination/cursoring and client-side incremental loading.

## Dependencies at Risk

**Unpinned Telescope major versions:**
- Risk: `laravel/telescope` is declared as `*`, allowing unexpected major-version upgrades.
- Impact: Surprise framework/tooling incompatibilities in dependency updates.
- Migration plan: Pin to an explicit compatible semver range in `composer.json`.

**Multiple pre-1.0 frontend data/sync dependencies:**
- Risk: Core sync/model stack relies on `0.x` packages with potentially unstable APIs.
- Impact: Update churn and breakage risk in offline data layer.
- Migration plan: Lock tighter version ranges and maintain upgrade playbooks with focused integration tests.

## Missing Critical Features

**Server-side slug conflict handling at validation layer:**
- Problem: No explicit uniqueness rule for `ProgramStoreData.slug`.
- Blocks: Reliable client UX for deterministic program creation errors.

**Coverage gates for frontend and backend quality metrics:**
- Problem: Test runners exist, but no enforced coverage thresholds are defined in project test config.
- Blocks: Early detection of silent coverage erosion in critical sync/auth flows.

## Test Coverage Gaps

**Program slug collision path:**
- What's not tested: Conflict behavior when creating a program with duplicate slug.
- Files: `app/Http/Controllers/Api/ProgramController.php`, `app/Data/Programs/ProgramStoreData.php`, `tests/Feature/ProgramControllerTest.php`
- Risk: Production 500s instead of predictable 4xx validation errors.
- Priority: High

**PowerSync batch boundary behavior:**
- What's not tested: Oversized upload batch handling and timeout/transaction boundary behavior.
- Files: `app/Data/PowerSync/PowerSyncUploadBatchData.php`, `app/Http/Controllers/Api/PowerSyncUploadController.php`
- Risk: Large client outboxes can degrade API responsiveness or fail unpredictably.
- Priority: High

**Frontend sync/auth critical paths:**
- What's not tested: Runtime bootstrap/reconnect logic, route guard flows, and CSRF retry/auth-expiry behavior.
- Files: `resources/js/powersync/app-powersync.runtime.ts`, `resources/js/router/index.ts`, `resources/js/services/http.client.ts`, `resources/js/store/auth.store.ts`, `resources/js/tests/services/sync.queue.test.ts`, `resources/js/tests/models/model.definition.test.ts`
- Risk: Regressions in offline-first behavior and auth session recovery can ship undetected.
- Priority: High

---

*Concerns audit: 2026-04-30*
