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
