<laravel-boost-guidelines>
=== .ai/powersync rules ===

# PowerSync

## Sync streams

`deploy/config/powersync/sync-config.yaml` defines two streams:

- **`user_scope`** (`auto_subscribe: true`): the user's programs. Always subscribed.
- **`program_scope`**: program-scoped data (template days, boats, trips, …). Needs a `program_id`.

`activeProgramIdRef` in `resources/js/powersync/app-powersync.runtime.ts` drives the `program_scope` subscription. The router guard in `resources/js/router/index.ts` sets it on routes with `meta.requiresSelectedProgram`.

**Symptom: no program-scoped data appears, even though PostgreSQL has it.** That means `program_scope` was never subscribed. Check that `activeProgramIdRef` is set and that the `accessible_program_ids` CTE includes the user's programs.

## Uploads

Client mutations are batched to `POST /api/powersync/upload`. `PowerSyncUploadRouter` dispatches each entry `type` to an `App\Actions\PowerSync\Apply{Entity}PowerSyncCrudAction`. To add a synced table, add a router entry and an applier (not a REST controller). Each entry is either applied or rejected on its own, in its own transaction.

## Runtime

- In dev, `deploy/config/powersync` is bind-mounted. After you edit the sync config, run `docker compose restart powersync`.
- In production, PowerSync is embedded in the app image (`Dockerfile`, `powersync_vendor` stage → `/opt/powersync`) and runs as the `powersync` compose service (`start -r unified`). Buckets are compacted daily at 03:00 by `powersync:compact`.

## Where to look

| Concern                    | File                                                     |
| -------------------------- | -------------------------------------------------------- |
| Connector (client upload)  | `resources/js/services/powersync.connector.ts`           |
| Upload controller          | `app/Http/Controllers/Api/PowerSyncUploadController.php` |
| Per-entity CRUD appliers   | `app/Actions/PowerSync/Apply*PowerSyncCrudAction.php`    |
| Collection definitions     | `resources/js/powersync/*.collection.ts`                 |
| Client schema              | `resources/js/powersync/app.powersync-schema.ts`         |
| Compact command            | `app/Console/Commands/PowerSyncCompactCommand.php`       |

=== .ai/project rules ===

# Billet Bateau

Local-first, fully offline PWA for running boat-tour operations (programs, trips, voyages, bookings, check-in) over unstable networks. A Laravel API serves one caller: the Vue 3 + Quasar app in `resources/js`.

## Breaking changes

Prefer clean breaking changes: change the API and its one caller together, without shims, aliases or dual paths.

The exception is **PowerSync upload payloads**. An offline device keeps its queued writes in the old shape across a deploy. When the device reconnects, the server rejects those writes (logged as `PowerSync upload entry rejected.` with the full entry) and the client drops them from its queue. Before you ship a change to an upload payload shape, drain every device's queue.

## Data ownership

Program and fleet data is shared by a program's staff. Authorize through program membership (`Program::userCanManage()`) and policies. A `user_id` column on these tables is audit metadata (who created the row), not a visibility filter, and that holds for Eloquent queries, PowerSync sync streams and Vue alike.

## Frontend

Build from Quasar components and rely on Quasar's default styling. Before writing a component, reuse one from `resources/js/components` (`ui`, `molecules`, `organisms`). Keep new components as small, reusable atoms or molecules.

## Commits

`<gitmoji> [scope] message`: a unicode emoji from gitmoji.dev, an optional scope, and a short "what" (no "why").

=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.5. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

Production runs from `deploy/compose.yaml` (server setup lives in `deploy/.env.example`) and its database is live. To change the schema, add a new migration with `php artisan make:migration`. Migrations that have already run in production stay as they are.

=== tests rules ===

# Test Enforcement

- Add or update tests for behavior and logic changes when a test provides meaningful regression coverage.
- Pure copy, styling, and layout-only changes do not require new or updated tests.
- When test coverage applies, run the affected tests and ensure they pass.
- Test the changed behavior and its important failure modes, but do not add tests beyond them.
- Read the `testing-best-practices` skill before writing tests.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== laravel-octane/core rules ===

# Laravel Octane

This application uses Laravel Octane, a long-running PHP server. The application bootstraps once and handles many requests within the same process.

- Never store request-specific state in singletons or static properties, because it can leak across requests.
- Use `config('octane.server')` to detect the active driver (`swoole`, `roadrunner`, or `frankenphp`).
- Prefer scoped bindings (`$this->app->scoped()`) over singletons for per-request services.

When working on Octane-specific features (concurrency, shared tables, memory, driver configuration, testing), invoke `octane-development` for detailed rules.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This project uses PHPUnit. Create tests with `php artisan make:test --phpunit {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/phpunit` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

</laravel-boost-guidelines>
