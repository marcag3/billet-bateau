<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Guides\GuidePatchData;
use App\Data\PowerSync\Guides\GuidePutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Guide;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyGuidePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $guide = Guide::query()->whereKey($id)->first();

            if ($guide === null) {
                return;
            }

            $this->assertStaffMember($userId);
            $guide->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = GuidePutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = GuidePatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for guides: '.$op);
    }

    private function applyPut(string $id, GuidePutData $dto, string $userId): void
    {
        $this->assertStaffMember($userId);

        $existing = Guide::query()->whereKey($id)->first();
        $name = $dto->name instanceof Optional
            ? ($existing?->name ?? null)
            : $dto->name;

        if ($name === null || trim($name) === '') {
            throw ValidationException::withMessages([
                'data.name' => __('Guide name is required.'),
            ]);
        }

        $staffUserId = $dto->staff_user_id instanceof Optional
            ? ($existing?->staff_user_id ?? null)
            : $dto->staff_user_id;

        Guide::query()->updateOrCreate(
            ['id' => $id],
            [
                'name' => trim($name),
                'staff_user_id' => $staffUserId,
            ],
        );
    }

    private function applyPatch(string $id, GuidePatchData $dto, string $userId): void
    {
        $guide = Guide::query()->whereKey($id)->first();

        if ($guide === null) {
            return;
        }

        $this->assertStaffMember($userId);

        if (! ($dto->name instanceof Optional)) {
            if ($dto->name === null || trim($dto->name) === '') {
                throw ValidationException::withMessages([
                    'data.name' => __('Guide name is required.'),
                ]);
            }
            $guide->name = trim($dto->name);
        }

        if (! ($dto->staff_user_id instanceof Optional)) {
            $guide->staff_user_id = $dto->staff_user_id;
        }

        $guide->save();
    }

    private function assertStaffMember(string $userId): void
    {
        $managesAnyProgram = Program::query()
            ->whereHas('users', fn ($query) => $query->whereKey($userId))
            ->exists();

        if (! $managesAnyProgram) {
            throw new AuthorizationException;
        }
    }
}
