<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Support\ObjectStorage\ObjectStorage;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;
use Throwable;

/**
 * Best-effort object storage delete; failures are logged and never thrown.
 */
final class TryDeleteStoredObjectAction
{
    use AsAction;

    public function __construct(
        private readonly ObjectStorage $objectStorage,
    ) {}

    public function handle(?string $objectKey): void
    {
        if ($objectKey === null || $objectKey === '') {
            return;
        }

        try {
            $this->objectStorage->delete($objectKey);
        } catch (Throwable $e) {
            Log::warning('Stored object delete failed.', [
                'object_key' => $objectKey,
                'exception' => $e,
            ]);
        }
    }
}
