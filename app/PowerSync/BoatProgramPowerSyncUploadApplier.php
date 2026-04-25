<?php

namespace App\PowerSync;

use App\Models\Boat;
use App\Models\BoatProgram;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;

final class BoatProgramPowerSyncUploadApplier
{
    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(array $entry, int $userId): void
    {
        $id = $entry['id'];
        $op = $entry['op'];
        /** @var array<string, mixed> $data */
        $data = $entry['data'] ?? [];

        if ($op === 'DELETE') {
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

        if ($op === 'PUT') {
            $boatId = $this->readUuid($data['boat_id'] ?? null);
            $programId = $this->readUuid($data['program_id'] ?? null);

            if ($boatId === null || $programId === null) {
                return;
            }

            $program = Program::query()->whereKey($programId)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            if (! Boat::query()->whereKey($boatId)->exists()) {
                return;
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

    private function readUuid(mixed $value): ?string
    {
        if (! is_string($value) || ! Str::isUuid($value)) {
            return null;
        }

        return $value;
    }
}
