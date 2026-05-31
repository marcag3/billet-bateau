<?php

namespace App\Actions;

use App\Enums\VoyageStatus;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

final class StartVoyageAction
{
    use AsAction;

    public function handle(Voyage $voyage, string $userId): Voyage
    {
        $voyage = Voyage::query()
            ->whereKey($voyage->getKey())
            ->withCount('boats')
            ->firstOrFail();

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if (
            $voyage->status === VoyageStatus::Underway
            || $voyage->status === VoyageStatus::Completed
        ) {
            return $voyage;
        }

        if ($voyage->boats_count < 1) {
            throw ValidationException::withMessages([
                'voyage' => __('At least one boat must be assigned before departure.'),
            ]);
        }

        $voyage->status = VoyageStatus::Underway;
        $voyage->user_id ??= $userId;
        $voyage->save();

        return $voyage->fresh() ?? $voyage;
    }
}
