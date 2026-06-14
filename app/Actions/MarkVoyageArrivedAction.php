<?php

namespace App\Actions;

use App\Enums\VoyageStatus;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

final class MarkVoyageArrivedAction
{
    use AsAction;

    public function handle(Voyage $voyage, string $userId): Voyage
    {
        $voyage = Voyage::query()->whereKey($voyage->getKey())->firstOrFail();

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Completed) {
            return $voyage;
        }

        if ($voyage->status !== VoyageStatus::Underway) {
            throw ValidationException::withMessages([
                'voyage' => __('Only an underway departure can be marked as arrived.'),
            ]);
        }

        $voyage->status = VoyageStatus::Completed;
        $voyage->save();

        return $voyage->fresh() ?? $voyage;
    }
}
