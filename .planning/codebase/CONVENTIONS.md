# Coding Conventions

**Analysis Date:** 2026-04-30

## Naming Patterns

**Files:**
- Vue SFC files use `PascalCase.vue` for pages, layouts, and UI components (`resources/js/pages/AppBoatsPage.vue`, `resources/js/layouts/AppEntityIndexPageLayout.vue`, `resources/js/components/ui/AppPageHeader.vue`).
- Frontend domain modules use suffix-based dot naming: `*.model.ts`, `*.api.ts`, `*.queries.ts`, `*.relations.ts`, `*.runtime.ts` (`resources/js/models/programs/programs.model.ts`, `resources/js/models/entity.api.ts`, `resources/js/models/entity.queries.ts`, `resources/js/powersync/app-powersync.runtime.ts`).
- PHP backend follows Laravel defaults: `*Controller.php`, `*Policy.php`, `*Factory.php`, `*Data.php`, `*Action.php` in domain folders (`app/Http/Controllers/Api/ProgramController.php`, `app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`, `app/Data/Programs/ProgramStoreData.php`).

**Functions:**
- TypeScript functions and composables use `camelCase`, with composables prefixed by `use` (`resources/js/composables/useNotifyErrorFromCatch.ts`, `resources/js/services/http.client.ts`, `resources/js/models/programs/programs.model.ts`).
- PHP methods use `camelCase` and explicit visibility/return types (`app/Http/Controllers/Api/ProgramController.php`, `app/Models/Program.php`).
- PHPUnit tests use `test_` prefixed snake-case-like method names describing behavior (`tests/Feature/PowerSyncUploadProgramTest.php`, `tests/Feature/AuthSessionControllerTest.php`).

**Variables:**
- Frontend uses `camelCase` for constants/locals and uppercase snake case for module constants (`resources/js/services/http.client.ts`, `resources/js/pages/AppBoatsPage.vue`).
- Backend commonly uses descriptive short locals (`$program`, `$user`, `$response`) with explicit cast/normalization when needed (`app/Http/Controllers/Api/ProgramController.php`, `app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`).

**Types:**
- TypeScript uses inline `type` aliases near usage and JSDoc typedefs for JS-typed modules (`resources/js/models/entity.api.ts`, `resources/js/models/model.definition.ts`).
- PHP relies on constructor property promotion, scalar/object type hints, and PHPDoc array-shape/generic hints (`app/Data/Programs/ProgramStoreData.php`, `app/Models/Program.php`, `database/factories/ProgramFactory.php`).

## Code Style

**Formatting:**
- `.editorconfig` enforces UTF-8, LF, final newline, and 4-space indentation globally; YAML files use 2 spaces except compose files (`.editorconfig`).
- PHP formatting is enforced by Laravel Pint in CI (`.github/workflows/test.yml`).

**Linting:**
- ESLint flat config targets `resources/js/**/*.{ts,vue}` with `@eslint/js`, `typescript-eslint`, and `eslint-plugin-vue` essential rules (`eslint.config.js`).
- CI includes syntax check (`phplint`), style (`pint --test`), and static analysis (`phpstan analyse`) in addition to tests (`.github/workflows/test.yml`).

## Import Organization

**Order:**
1. Framework/vendor imports first (`vue`, `quasar`, `ulid` in `resources/js/models/programs/programs.model.ts`).
2. Same-layer local modules next (`../entity.relations`, `../model.definition` in `resources/js/models/programs/programs.model.ts`).
3. Cross-layer feature imports last (for example `../../powersync/...` and `../../utilities/...` in `resources/js/models/programs/programs.model.ts`).

**Path Aliases:**
- No TypeScript path alias mapping is defined; frontend imports are relative-path based (`tsconfig.json`, `tsconfig.typecheck.json`, files under `resources/js/`).
- Generated Wayfinder route clients also use deep relative paths (`resources/js/routes/api/public/programs/index.ts`, `resources/js/actions/App/Http/Controllers/Api/ProgramController.ts`).

## Error Handling

**Patterns:**
- Backend APIs rely on DTO validation (`validateAndCreate`) and return HTTP status assertions in tests for unauthorized/forbidden/unprocessable cases (`app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`, `tests/Feature/PowerSyncUploadBatchTest.php`).
- Frontend service layer throws normalized `Error` objects from response payloads and retries CSRF 419 once (`resources/js/services/http.client.ts`).
- UI-level catch handlers map unknown errors to user-safe notification messages (`resources/js/composables/useNotifyErrorFromCatch.ts`).

## Logging

**Framework:** console / browser events

**Patterns:**
- No dedicated frontend logging framework is configured; domain modules focus on throwing errors and dispatching app-level events (`resources/js/services/http.client.ts`).
- Backend observability tooling exists through Laravel ecosystem dependencies/workflow but no custom logging wrapper pattern is established in sampled app code (`composer.json`, `.github/workflows/test.yml`).

## Comments

**When to Comment:**
- Comments are used sparingly for non-obvious constraints and integration caveats (PowerSync WASM/dependency notes in `vite.config.ts`, membership rationale in `app/Http/Controllers/Api/ProgramController.php`).
- Business logic in PHP and TypeScript primarily relies on descriptive naming instead of inline comments.

**JSDoc/TSDoc:**
- Frontend utility/model modules use JSDoc heavily to type parameters/returns in JS-authored files (`resources/js/models/model.definition.ts`, `resources/js/models/programs/programs.model.ts`, `resources/js/services/http.client.ts`).
- Backend uses PHPDoc for generic relation hints and typed arrays (`app/Models/Program.php`, `database/factories/ProgramFactory.php`).

## Function Design

**Size:** Keep controller endpoints thin and push domain mutation logic into dedicated actions/services (`app/Http/Controllers/Api/ProgramController.php`, `app/Actions/PowerSync/ApplyProgramPowerSyncCrudAction.php`).

**Parameters:** Prefer strongly typed DTOs and primitives over untyped arrays in backend entrypoints (`app/Http/Controllers/Api/ProgramController.php`, `app/Data/Programs/ProgramStoreData.php`), while frontend helpers accept explicit options objects (`resources/js/models/entity.api.ts`, `resources/js/services/http.client.ts`).

**Return Values:** Functions return concrete primitives/records or explicit HTTP JSON responses, and throw on failure instead of returning mixed sentinel values (`app/Http/Controllers/Api/ProgramController.php`, `resources/js/services/http.client.ts`, `resources/js/models/programs/programs.model.ts`).

## Module Design

**Exports:** Prefer named exports for reusable units (`createEntityApi`, `requestJson`, `usePrograms`) with occasional default export in generated route/action modules (`resources/js/models/entity.api.ts`, `resources/js/services/http.client.ts`, `resources/js/routes/api/public/programs/index.ts`).

**Barrel Files:** Barrel usage is minimal and explicit; some folders expose an `index.ts` for route/action aggregation (`resources/js/actions/App/Http/Controllers/Api/index.ts`, `resources/js/routes/storage/index.ts`).

---

*Convention analysis: 2026-04-30*
