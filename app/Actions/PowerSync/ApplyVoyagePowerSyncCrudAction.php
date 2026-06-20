<?php

namespace App\Actions\PowerSync;

use App\Actions\CancelVoyageAction;
use App\Actions\MarkVoyageArrivedAction;
use App\Actions\StartVoyageAction;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Voyages\VoyagePatchData;
use App\Data\PowerSync\Voyages\VoyagePutData;
use App\Data\PowerSync\Voyages\VoyagePutPayloadResolver;
use App\Data\PowerSync\Voyages\VoyageResolvedPutData;
use App\Enums\VoyageStatus;
use App\Models\Trip;
use App\Models\Voyage;
use App\Models\WaterRoute;
use App\Support\Voyages\VoyageProgramResolver;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyVoyagePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $voyage = Voyage::query()->whereKey($id)->first();

            if ($voyage === null) {
                return;
            }

            VoyageProgramResolver::assertProgramManaged($voyage, $userId);

            if ($voyage->status === VoyageStatus::Underway || $voyage->status === VoyageStatus::Completed) {
                throw ValidationException::withMessages([
                    'voyage' => __('This departure cannot be deleted while underway or completed.'),
                ]);
            }

            $voyage->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = VoyagePutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = VoyagePatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for voyages: '.$op);
    }

    private function applyPut(string $id, VoyagePutData $dto, string $userId): void
    {
        $existing = Voyage::query()->whereKey($id)->first();
        $merged = VoyagePutPayloadResolver::resolve($dto, $existing);
        $merged['program_id'] = $this->resolveProgramId(
            $merged['program_id'] ?? null,
            $merged['trip_id'] ?? null,
            (string) ($merged['water_route_id'] ?? ''),
        );
        $resolved = VoyageResolvedPutData::validateAndCreate($merged);

        $this->assertTripAndRouteBelongToProgram(
            $resolved->trip_id,
            $resolved->water_route_id,
            $resolved->program_id,
        );

        VoyageProgramResolver::assertProgramManagedById($resolved->program_id, $userId);

        $status = VoyageStatus::from($resolved->status);

        if ($existing !== null) {
            VoyageProgramResolver::assertProgramManaged($existing, $userId);
            $this->guardImmutableLifecycleFields($existing, $status);
        }

        $persistedStatus = $this->persistedStatusBeforeTransition($status, $existing?->status);

        $voyage = Voyage::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved->program_id,
                'user_id' => $userId,
                'trip_id' => $resolved->trip_id,
                'water_route_id' => $resolved->water_route_id,
                'scheduled_departure_at' => $resolved->scheduled_departure_at,
                'status' => $persistedStatus,
            ],
        );

        if (! ($dto->started_at instanceof Optional)) {
            $voyage->started_at = $this->patchTimestamp($dto->started_at);
        }

        if (! ($dto->arrived_at instanceof Optional)) {
            $voyage->arrived_at = $this->patchTimestamp($dto->arrived_at);
        }

        $this->assertRequiredLifecycleTimestamps($voyage, $status);
        $voyage->save();

        if ($status !== $persistedStatus) {
            $this->applyStatusTransition($voyage->fresh() ?? $voyage, $status, $userId);
        }
    }

    private function applyPatch(string $id, VoyagePatchData $patch, string $userId): void
    {
        $voyage = Voyage::query()->whereKey($id)->first();

        if ($voyage === null) {
            return;
        }

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Completed) {
            throw ValidationException::withMessages([
                'voyage' => __('A completed departure cannot be modified.'),
            ]);
        }

        if (! ($patch->trip_id instanceof Optional)) {
            $voyage->trip_id = $patch->trip_id;
        }

        if (! ($patch->water_route_id instanceof Optional)) {
            $voyage->water_route_id = $patch->water_route_id;
        }

        if (! ($patch->scheduled_departure_at instanceof Optional)) {
            $voyage->scheduled_departure_at = $patch->scheduled_departure_at;
        }

        if (! ($patch->started_at instanceof Optional)) {
            $voyage->started_at = $this->patchTimestamp($patch->started_at);
        }

        if (! ($patch->arrived_at instanceof Optional)) {
            $voyage->arrived_at = $this->patchTimestamp($patch->arrived_at);
        }

        if (
            ! ($patch->trip_id instanceof Optional)
            || ! ($patch->water_route_id instanceof Optional)
            || ! ($patch->program_id instanceof Optional)
        ) {
            $voyage->program_id = $this->resolveProgramId(
                ! ($patch->program_id instanceof Optional) ? $patch->program_id : (string) $voyage->program_id,
                $voyage->trip_id !== null ? (string) $voyage->trip_id : null,
                (string) $voyage->water_route_id,
            );
        }

        $this->assertTripAndRouteBelongToProgram(
            $voyage->trip_id !== null ? (string) $voyage->trip_id : null,
            (string) $voyage->water_route_id,
            (string) $voyage->program_id,
        );

        $targetStatus = $voyage->status;

        if (! ($patch->status instanceof Optional) && $patch->status !== null) {
            $targetStatus = VoyageStatus::from($patch->status);
            $this->guardImmutableLifecycleFields($voyage, $targetStatus);
        }

        $this->assertRequiredLifecycleTimestamps($voyage, $targetStatus);
        $voyage->save();

        if ($targetStatus !== $voyage->status) {
            if ($this->isLifecycleTransitionStatus($targetStatus)) {
                $this->applyStatusTransition($voyage->fresh() ?? $voyage, $targetStatus, $userId);
            } else {
                $voyage->status = $targetStatus;
                $voyage->save();
            }
        }
    }

    private function persistedStatusBeforeTransition(
        VoyageStatus $targetStatus,
        ?VoyageStatus $existingStatus,
    ): VoyageStatus {
        if (! $this->isLifecycleTransitionStatus($targetStatus)) {
            return $targetStatus;
        }

        return $existingStatus ?? VoyageStatus::Draft;
    }

    private function patchTimestamp(?CarbonInterface $value): ?Carbon
    {
        if ($value === null) {
            return null;
        }

        return Carbon::instance($value);
    }

    private function assertRequiredLifecycleTimestamps(Voyage $voyage, VoyageStatus $targetStatus): void
    {
        if ($targetStatus === VoyageStatus::Underway && $voyage->started_at === null) {
            throw ValidationException::withMessages([
                'started_at' => __('A departure start time is required when marking underway.'),
            ]);
        }

        if ($targetStatus === VoyageStatus::Completed && $voyage->arrived_at === null) {
            throw ValidationException::withMessages([
                'arrived_at' => __('An arrival time is required when marking completed.'),
            ]);
        }
    }

    private function isLifecycleTransitionStatus(VoyageStatus $status): bool
    {
        return $status === VoyageStatus::Underway
            || $status === VoyageStatus::Completed
            || $status === VoyageStatus::Cancelled;
    }

    private function applyStatusTransition(Voyage $voyage, VoyageStatus $status, string $userId): void
    {
        if ($status === VoyageStatus::Underway) {
            StartVoyageAction::run($voyage, $userId);

            return;
        }

        if ($status === VoyageStatus::Completed) {
            MarkVoyageArrivedAction::run($voyage, $userId);

            return;
        }

        if ($status === VoyageStatus::Cancelled) {
            CancelVoyageAction::run($voyage, $userId);
        }
    }

    private function guardImmutableLifecycleFields(Voyage $voyage, VoyageStatus $nextStatus): void
    {
        if (
            $voyage->status === VoyageStatus::Completed
            && $nextStatus !== VoyageStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'status' => __('A completed departure cannot change status.'),
            ]);
        }

        if (
            $voyage->status === VoyageStatus::Underway
            && $nextStatus === VoyageStatus::Draft
        ) {
            throw ValidationException::withMessages([
                'status' => __('An underway departure cannot return to draft.'),
            ]);
        }
    }

    private function resolveProgramId(
        ?string $programIdFromClient,
        ?string $tripId,
        string $waterRouteId,
    ): string {
        $derived = $this->programIdForTripAndRoute($tripId, $waterRouteId);

        if ($derived === null) {
            throw ValidationException::withMessages([
                'program_id' => __('Could not resolve the program for this departure.'),
            ]);
        }

        if (
            $programIdFromClient !== null
            && $programIdFromClient !== ''
            && $programIdFromClient !== $derived
        ) {
            throw ValidationException::withMessages([
                'program_id' => __('The program does not match the trip and water route.'),
            ]);
        }

        return $derived;
    }

    private function assertTripAndRouteBelongToProgram(
        ?string $tripId,
        string $waterRouteId,
        string $programId,
    ): void {
        $derived = $this->programIdForTripAndRoute($tripId, $waterRouteId);

        if ($derived === null || $derived !== $programId) {
            throw ValidationException::withMessages([
                'program_id' => __('The program does not match the trip and water route.'),
            ]);
        }
    }

    private function programIdForTripAndRoute(?string $tripId, string $waterRouteId): ?string
    {
        $route = WaterRoute::query()->whereKey($waterRouteId)->first();

        if ($route === null) {
            return null;
        }

        if ($tripId === null) {
            return (string) $route->program_id;
        }

        $trip = Trip::query()->whereKey($tripId)->first();

        if ($trip === null) {
            return null;
        }

        if ((string) $trip->program_id !== (string) $route->program_id) {
            throw ValidationException::withMessages([
                'water_route_id' => __('The water route must belong to the same program as the trip.'),
            ]);
        }

        return (string) $trip->program_id;
    }
}
