<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Trips\TripPatchData;
use App\Data\PowerSync\Trips\TripPutData;
use App\Data\PowerSync\Trips\TripPutPayloadResolver;
use App\Models\Program;
use App\Models\Trip;
use App\Models\WaterRoute;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Trip} rows (trips upload type).
 */
final class ApplyTripPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $trip = Trip::query()->whereKey($id)->first();

            if ($trip === null) {
                return;
            }

            $program = Program::query()->whereKey($trip->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $trip->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = TripPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = TripPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for trips: '.$op);
    }

    private function applyPut(string $id, TripPutData $dto, int $userId): void
    {
        $existing = Trip::query()->whereKey($id)->first();

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

        $resolved = TripPutPayloadResolver::resolve($dto, $existing);

        $this->assertWaterRouteBelongsToProgram($resolved['water_route_id'], $programId);

        Trip::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'boat_type_id' => $resolved['boat_type_id'],
                'water_route_id' => $resolved['water_route_id'],
                'scheduled_departure_at' => $resolved['scheduled_departure_at'],
                'capacity' => $resolved['capacity'],
            ],
        );
    }

    private function applyPatch(string $id, TripPatchData $patch, int $userId): void
    {
        $trip = Trip::query()->whereKey($id)->first();

        if ($trip === null) {
            return;
        }

        $program = Program::query()->whereKey($trip->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if (! ($patch->program_id instanceof Optional)) {
            $incoming = $patch->program_id;
            if ($incoming !== null && $incoming !== (string) $trip->program_id) {
                throw new AuthorizationException;
            }
        }

        if (! ($patch->scheduled_departure_at instanceof Optional)) {
            $trip->scheduled_departure_at = $patch->scheduled_departure_at;
        }

        if (! ($patch->capacity instanceof Optional)) {
            $trip->capacity = $patch->capacity;
        }

        if (! ($patch->boat_type_id instanceof Optional)) {
            $trip->boat_type_id = $patch->boat_type_id;
        }

        if (! ($patch->water_route_id instanceof Optional)) {
            $this->assertWaterRouteBelongsToProgram($patch->water_route_id, (string) $trip->program_id);
            $trip->water_route_id = $patch->water_route_id;
        }

        $trip->save();
    }

    private function assertWaterRouteBelongsToProgram(?string $waterRouteId, string $programId): void
    {
        if ($waterRouteId === null) {
            return;
        }

        $route = WaterRoute::query()->whereKey($waterRouteId)->first();

        if ($route === null || (string) $route->program_id !== $programId) {
            throw ValidationException::withMessages([
                'data.water_route_id' => 'Water route must belong to the same program.',
            ]);
        }
    }
}
