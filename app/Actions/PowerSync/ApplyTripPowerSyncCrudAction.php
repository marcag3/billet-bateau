<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Trips\TripPatchData;
use App\Data\PowerSync\Trips\TripPutData;
use App\Data\PowerSync\Trips\TripPutPayloadResolver;
use App\Data\PowerSync\Trips\TripResolvedPutData;
use App\Models\Product;
use App\Models\Program;
use App\Models\Trip;
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

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
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

            if ($trip->bookings()->exists()) {
                throw ValidationException::withMessages([
                    'trip' => 'This trip has bookings and cannot be deleted.',
                ]);
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

    private function applyPut(string $id, TripPutData $dto, string $userId): void
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

        $merged = TripPutPayloadResolver::resolve($dto, $existing);
        $resolved = TripResolvedPutData::validateAndCreate($merged);

        $this->assertProductBelongsToProgram($resolved->product_id, $programId);

        Trip::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'product_id' => $resolved->product_id,
                'scheduled_departure_at' => $resolved->scheduled_departure_at,
            ],
        );
    }

    private function applyPatch(string $id, TripPatchData $patch, string $userId): void
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

        if (! ($patch->product_id instanceof Optional)) {
            $this->assertProductBelongsToProgram($patch->product_id, (string) $trip->program_id);
            $trip->product_id = $patch->product_id;
        }

        $trip->save();
    }

    private function assertProductBelongsToProgram(string $productId, string $programId): void
    {
        $product = Product::query()->whereKey($productId)->first();

        if ($product === null || (string) $product->program_id !== $programId) {
            throw ValidationException::withMessages([
                'data.product_id' => 'Product must belong to the same program.',
            ]);
        }
    }
}
