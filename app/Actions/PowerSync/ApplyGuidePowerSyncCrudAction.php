<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Guides\GuidePatchData;
use App\Data\PowerSync\Guides\GuidePutData;
use App\Models\Guide;
use App\Models\Program;
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

        $this->assertProgramManaged((string) $guide->program_id, $userId);
        $guide->delete();
    }

    /**
     * @param  GuidePutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
        $existing = Guide::query()->whereKey($id)->first();
        $incomingProgramId = $dto->program_id instanceof Optional ? null : $dto->program_id;

        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            $this->assertProgramUnchanged($programId, $incomingProgramId);
        } else {
            $programId = $incomingProgramId;
            if ($programId === null) {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }
        }

        $this->assertProgramManaged($programId, $userId);

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

        $this->assertStaffUserBelongsToProgram($staffUserId, $programId);

        Guide::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
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

        $programId = (string) $guide->program_id;
        $this->assertProgramManaged($programId, $userId);

        if (! ($dto->program_id instanceof Optional)) {
            $this->assertProgramUnchanged($programId, $dto->program_id);
        }

        if (! ($dto->name instanceof Optional)) {
            if ($dto->name === null || trim($dto->name) === '') {
                throw ValidationException::withMessages([
                    'data.name' => __('Guide name is required.'),
                ]);
            }
            $guide->name = trim($dto->name);
        }

        if (! ($dto->staff_user_id instanceof Optional)) {
            $this->assertStaffUserBelongsToProgram($dto->staff_user_id, $programId);
            $guide->staff_user_id = $dto->staff_user_id;
        }

        $guide->save();
    }

    private function assertStaffUserBelongsToProgram(?string $staffUserId, string $programId): void
    {
        if ($staffUserId === null) {
            return;
        }

        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($staffUserId)) {
            throw ValidationException::withMessages([
                'data.staff_user_id' => __('The staff member must belong to this program.'),
            ]);
        }
    }
}
