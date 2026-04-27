<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\BoatPrograms\BoatProgramPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\BoatProgram;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Lorisleiva\Actions\Concerns\AsAction;

/**
 * Applies PowerSync CRUD for {@see BoatProgram} pivot rows (boat_program upload type).
 */
final class ApplyBoatProgramPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $link = BoatProgram::query()->whereKey($id)->first();

            if ($link === null) {
                return;
            }

            $program = Program::query()->whereKey($link->program_id)->first();

            if ($program === null) {
                return;
            }

            if (! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $link->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = BoatProgramPutData::validateAndCreate($raw);
            $boatId = $dto->boat_id;
            $programId = $dto->program_id;

            $program = Program::query()->whereKey($programId)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            BoatProgram::query()->updateOrCreate(
                ['id' => $id],
                [
                    'boat_id' => $boatId,
                    'program_id' => $programId,
                ],
            );

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boat_program: '.$op);
    }
}
