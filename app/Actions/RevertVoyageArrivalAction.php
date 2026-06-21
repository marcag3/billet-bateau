<?php

namespace App\Actions;

use App\Enums\VoyageStatus;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

final class RevertVoyageArrivalAction
{
    use AsAction;

    public function handle(Voyage $voyage, string $userId): Voyage
    {
        $voyage = Voyage::query()->whereKey($voyage->getKey())->firstOrFail();

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status !== VoyageStatus::Completed) {
            throw ValidationException::withMessages([
                'voyage' => __('Only a completed departure can be reverted to underway.'),
            ]);
        }

        $voyage->status = VoyageStatus::Underway;
        $voyage->arrived_at = null;
        $voyage->user_id ??= $userId;
        $voyage->save();

        return $voyage->fresh() ?? $voyage;
    }
}
