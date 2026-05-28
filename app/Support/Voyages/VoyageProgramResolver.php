<?php

namespace App\Support\Voyages;

use App\Models\Program;
use App\Models\Voyage;
use Illuminate\Auth\Access\AuthorizationException;

final class VoyageProgramResolver
{
    public static function assertProgramManaged(Voyage $voyage, string $userId): void
    {
        self::assertProgramManagedById((string) $voyage->program_id, $userId);
    }

    public static function assertProgramManagedById(string $programId, string $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }
}
