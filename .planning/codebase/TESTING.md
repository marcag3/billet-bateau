# Testing Patterns

**Analysis Date:** 2026-04-30

## Test Framework

**Runner:**
- PHPUnit 12 for backend Unit/Feature suites (`composer.json`, `phpunit.xml`).
- Vitest 4 for frontend TypeScript/unit tests (`package.json`, `vite.config.ts`).
- Config: `phpunit.xml` (backend), `vite.config.ts` test block + `tsconfig.json` vitest globals.

**Assertion Library:**
- Backend: PHPUnit + Laravel HTTP/database assertions (`tests/Feature/*.php`).
- Frontend: Vitest `expect` assertions (`resources/js/tests/**/*.test.ts`).

**Run Commands:**
```bash
php artisan test --compact          # Run all Laravel tests
vendor/bin/phpunit --testsuite Unit,Feature   # Run backend suites directly (CI pattern)
npm test                            # Run Vitest frontend tests
```

## Test File Organization

**Location:**
- Backend tests are separated under `tests/Feature` and `tests/Unit` (`phpunit.xml`, `tests/Feature/*.php`, `tests/Unit/*.php`).
- Frontend tests live in dedicated `resources/js/tests/` folders and import source modules relatively (`resources/js/tests/models/model.definition.test.ts`, `resources/js/tests/services/sync.queue.test.ts`).

**Naming:**
- Backend: `*Test.php` class files with behavior-oriented `test_*` methods (`tests/Feature/PowerSyncUploadProgramTest.php`).
- Frontend: `*.test.ts` files with `test('...', ...)` cases (`resources/js/tests/models/model.definition.test.ts`).

**Structure:**
```
tests/
  Feature/*Test.php
  Unit/*Test.php
resources/js/tests/
  models/*.test.ts
  services/*.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
// resources/js/tests/services/sync.queue.test.ts
import { expect, test } from 'vitest';
import { createSingleFlightQueueFlusher } from '../../services/sync.queue';

test('createSingleFlightQueueFlusher keeps recoverable failures queued', async () => {
    // arrange dependencies and inputs
    // act
    // assert
});
```

```php
// tests/Feature/PowerSyncUploadProgramTest.php
class PowerSyncUploadProgramTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_program_for_current_user(): void
    {
        // arrange model state
        // act with HTTP request
        // assert response + database state
    }
}
```

**Patterns:**
- Setup pattern: create entities with factories and authenticate with `actingAs(...)` before API calls (`tests/Feature/ProgramControllerTest.php`, `tests/Feature/PowerSyncUploadProgramTest.php`).
- Teardown pattern: rely on `RefreshDatabase` trait transaction/migration reset, no custom teardown blocks in sampled tests (`tests/Feature/*.php`).
- Assertion pattern: combine status assertions (`assertOk`, `assertUnauthorized`, `assertUnprocessable`) with persistence checks (`assertDatabaseHas`, `assertDatabaseMissing`) and JSON path assertions (`assertJsonPath`) (`tests/Feature/*.php`).

## Mocking

**Framework:** Laravel fakes + inline stubs

**Patterns:**
```php
// tests/Feature/ProgramControllerTest.php
Storage::fake('public');
$this->actingAs($user)
    ->post('/api/media/program/'.$program->getKey(), ['images' => [$image]])
    ->assertOk();
```

```php
// tests/Feature/PublicProgramApiTest.php
return UploadedFile::fake()->createWithContent('b.png', $binary);
```

```typescript
// resources/js/tests/services/sync.queue.test.ts
const flush = createSingleFlightQueueFlusher({
    readQueue: async () => [{ id: '1' }, { id: '2' }],
    writeQueue: async (queue) => { writes.push(queue.map((item) => item.id)); },
    runItem: async (item) => { /* throw selectively */ },
    isRecoverableError: () => true,
});
```

**What to Mock:**
- External file/storage side effects via `Storage::fake('public')` and fake uploaded files (`tests/Feature/ProgramControllerTest.php`, `tests/Feature/BoatTypeMediaControllerTest.php`).
- Frontend service boundaries via inline function stubs passed to pure functions (queue readers/writers/runners) (`resources/js/tests/services/sync.queue.test.ts`).

**What NOT to Mock:**
- Core API request/response flow and authorization; feature tests hit real Laravel routes and middleware (`tests/Feature/AuthSessionControllerTest.php`, `tests/Feature/PowerSyncUploadBatchTest.php`).
- Database behavior; tests validate persisted records directly with real database assertions (`tests/Feature/PowerSyncUploadProgramTest.php`, `tests/Feature/PowerSyncUploadTicketTypeBookingTicketTest.php`).

## Fixtures and Factories

**Test Data:**
```php
// tests/Feature/PowerSyncUploadProgramTest.php
$user = User::factory()->create();
$program = Program::factory()->for($user)->create();
```

```php
// database/factories/ProgramFactory.php
return [
    'id' => (string) Str::ulid(),
    'user_id' => User::factory(),
    'name' => fake()->words(3, true),
    'theme_color' => '#'.strtoupper(fake()->regexify('[0-9A-F]{6}')),
];
```

**Location:**
- Backend factories are centralized in `database/factories/*.php`.
- Frontend tests use inline lightweight fixtures within each test file (`resources/js/tests/**/*.test.ts`).

## Coverage

**Requirements:** No numeric coverage threshold detected in PHPUnit or npm scripts (`phpunit.xml`, `package.json`).

**View Coverage:**
```bash
vendor/bin/phpunit --coverage-text    # Backend coverage report (manual run)
npx vitest --coverage                 # Frontend coverage report (manual run if coverage provider added)
```

## Test Types

**Unit Tests:**
- Limited explicit unit suite currently (`tests/Unit/ExampleTest.php`).
- Frontend unit tests focus on pure function contracts and error paths (`resources/js/tests/models/model.definition.test.ts`, `resources/js/tests/services/sync.queue.test.ts`).

**Integration Tests:**
- Backend feature tests dominate and cover route auth, validation, persistence, policy-like behavior, and domain invariants (`tests/Feature/PowerSyncUpload*Test.php`, `tests/Feature/PublicProgramApiTest.php`, `tests/Feature/ProgramControllerTest.php`).

**E2E Tests:**
- Browser-level E2E framework not detected; test strategy is backend feature tests + frontend unit tests.

## Common Patterns

**Async Testing:**
```typescript
await flush();
await expect(flush).rejects.toThrow(/validation failed/);
```

```php
$this->actingAs($user)->postJson('/api/powersync/upload', [...])->assertOk();
```

**Error Testing:**
```php
$this->actingAs($user)->postJson('/api/powersync/upload', [...])->assertUnprocessable();
$this->assertDatabaseMissing('programs', ['id' => $programId]);
```

```typescript
expect(() => defineModel({ name: '', collectionId: 'widgets', persistenceSchemaVersion: 1 }))
    .toThrow(/requires a non-empty "name"/);
```

---

*Testing analysis: 2026-04-30*
