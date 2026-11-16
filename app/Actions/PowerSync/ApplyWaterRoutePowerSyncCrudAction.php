<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\WaterRoutes\WaterRoutePatchData;
use App\Data\PowerSync\WaterRoutes\WaterRoutePutData;
use App\Data\PowerSync\WaterRoutes\WaterRoutePutPayloadResolver;
use App\Data\PowerSync\WaterRoutes\WaterRouteResolvedPutData;
use App\Models\WaterRoute;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see WaterRoute} rows (water_routes upload type).
 *
 * @extends PowerSyncCrudAction<WaterRoutePutData, WaterRoutePatchData>
 */
final class ApplyWaterRoutePowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'water_routes';
    }

    protected function putDataClass(): string
    {
        return WaterRoutePutData::class;
    }

    protected function patchDataClass(): string
    {
        return WaterRoutePatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $this->assertProgramManaged($route->program_id, $userId);

        if ($route->voyages()->exists()) {
            throw ValidationException::withMessages([
                'id' => 'Cannot delete a water route that is still used by a voyage.',
            ]);
        }

        $route->delete();
    }

    /**
     * @param  WaterRoutePutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
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

        $this->assertProgramManaged($programId, $userId);

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

    /**
     * @param  WaterRoutePatchData  $patch
     */
    protected function applyPatch(string $id, Data $patch, string $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $this->assertProgramManaged($route->program_id, $userId);

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
