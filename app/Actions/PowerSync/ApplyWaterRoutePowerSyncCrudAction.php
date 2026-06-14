<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\WaterRoutes\WaterRoutePatchData;
use App\Data\PowerSync\WaterRoutes\WaterRoutePutData;
use App\Data\PowerSync\WaterRoutes\WaterRoutePutPayloadResolver;
use App\Data\PowerSync\WaterRoutes\WaterRouteResolvedPutData;
use App\Models\Program;
use App\Models\WaterRoute;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see WaterRoute} rows (water_routes upload type).
 */
final class ApplyWaterRoutePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $this->applyDelete($id, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = WaterRoutePutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = WaterRoutePatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for water_routes: '.$op);
    }

    private function applyDelete(string $id, string $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $program = Program::query()->whereKey($route->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if ($route->voyages()->exists()) {
            throw ValidationException::withMessages([
                'id' => 'Cannot delete a water route that is still used by a voyage.',
            ]);
        }

        $route->delete();
    }

    private function applyPut(string $id, WaterRoutePutData $dto, string $userId): void
    {
        $existing = WaterRoute::query()->whereKey($id)->first();

        $programIdFromData = $dto->program_id instanceof Optional
            ? null
            : $dto->program_id;

        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if ($programIdFromData !== null && $programIdFromData !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            $programId = $programIdFromData;
            if ($programId === null) {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }
        }

        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        $merged = WaterRoutePutPayloadResolver::resolve($dto, $existing);
        $resolved = WaterRouteResolvedPutData::validateAndCreate($merged);

        WaterRoute::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'name' => $resolved->name,
                'duration_minutes' => $resolved->duration_minutes,
                'trace' => $resolved->trace,
            ],
        );
    }

    private function applyPatch(string $id, WaterRoutePatchData $patch, string $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $program = Program::query()->whereKey($route->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if (! ($patch->program_id instanceof Optional)) {
            $incoming = $patch->program_id;
            if ($incoming !== null && $incoming !== (string) $route->program_id) {
                throw new AuthorizationException;
            }
        }

        if (! ($patch->name instanceof Optional)) {
            if ($patch->name === null) {
                // Explicit null: keep existing name.
            } else {
                $route->name = $patch->name !== '' ? $patch->name : (string) $route->name;
            }
        }

        if (! ($patch->duration_minutes instanceof Optional)) {
            $route->duration_minutes = $patch->duration_minutes;
        }

        if (! ($patch->trace instanceof Optional)) {
            $route->trace = $patch->trace;
        }

        $route->save();
    }
}
