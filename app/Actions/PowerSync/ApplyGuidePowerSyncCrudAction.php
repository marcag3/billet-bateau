<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Guides\GuidePatchData;
use App\Data\PowerSync\Guides\GuidePutData;
use App\Models\Guide;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<GuidePutData, GuidePatchData>
 */
final class ApplyGuidePowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'guides';
    }

    protected function putDataClass(): string
    {
        return GuidePutData::class;
    }

    protected function patchDataClass(): string
    {
        return GuidePatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $guide = Guide::query()->whereKey($id)->first();

        if ($guide === null) {
            return;
        }

        $this->assertStaffMember($userId);
        $guide->delete();
    }

    /**
     * @param  GuidePutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
        $this->assertStaffMember($userId);

        $existing = Guide::query()->whereKey($id)->first();
        $name = $dto->name instanceof Optional
            ? ($existing->name ?? null)
            : $dto->name;

        if ($name === null || trim($name) === '') {
            throw ValidationException::withMessages([
                'data.name' => __('Guide name is required.'),
            ]);
        }

        $staffUserId = $dto->staff_user_id instanceof Optional
            ? ($existing->staff_user_id ?? null)
            : $dto->staff_user_id;

        Guide::query()->updateOrCreate(
            ['id' => $id],
            [
                'name' => trim($name),
                'staff_user_id' => $staffUserId,
            ],
        );
    }

    /**
     * @param  GuidePatchData  $dto
     */
    protected function applyPatch(string $id, Data $dto, string $userId): void
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
