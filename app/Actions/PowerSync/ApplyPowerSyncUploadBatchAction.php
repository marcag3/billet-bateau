<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\PowerSyncUploadBatchResultData;
use App\Data\PowerSync\PowerSyncUploadEntryResultData;
use App\PowerSync\PowerSyncUploadRouter;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

final class ApplyPowerSyncUploadBatchAction
{
    use AsAction;

    public function __construct(
        private readonly PowerSyncUploadRouter $router,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(array $payload, string $userId): PowerSyncUploadBatchResultData
    {
        $crud = $payload['crud'] ?? null;

        if (! is_array($crud)) {
            return PowerSyncUploadBatchResultData::fromResults([]);
        }

        $results = [];

        foreach ($crud as $entryPayload) {
            if (! is_array($entryPayload)) {
                $results[] = PowerSyncUploadEntryResultData::rejected(
                    id: '',
                    type: null,
                    op: null,
                    errors: ['crud' => [__('Each upload entry must be an object.')]],
                );

                continue;
            }

            $results[] = $this->applyEntry($entryPayload, $userId);
        }

        return PowerSyncUploadBatchResultData::fromResults($results);
    }

    /**
     * @param  array<string, mixed>  $entryPayload
     */
    private function applyEntry(array $entryPayload, string $userId): PowerSyncUploadEntryResultData
    {
        $rawId = $this->rawString($entryPayload, 'id') ?? '';
        $rawType = $this->rawString($entryPayload, 'type');
        $rawOp = $this->rawString($entryPayload, 'op');

        try {
            $entry = PowerSyncCrudEntryData::validateAndCreate($entryPayload);
        } catch (ValidationException $exception) {
            return PowerSyncUploadEntryResultData::rejected(
                id: $rawId,
                type: $rawType,
                op: $rawOp,
                errors: $exception->errors(),
            );
        }

        try {
            DB::transaction(function () use ($entry, $userId): void {
                $this->router->apply($entry, $userId);
            });
        } catch (ValidationException|AuthorizationException|RuntimeException $exception) {
            return PowerSyncUploadEntryResultData::rejected(
                id: $entry->id,
                type: $entry->type->value,
                op: $entry->op,
                errors: $this->errorsFromException($exception),
            );
        }

        return PowerSyncUploadEntryResultData::applied(
            id: $entry->id,
            type: $entry->type->value,
            op: $entry->op,
        );
    }

    /**
     * @return array<string, list<string>>
     */
    private function errorsFromException(
        ValidationException|AuthorizationException|RuntimeException $exception,
    ): array {
        if ($exception instanceof ValidationException) {
            return $exception->errors();
        }

        if ($exception instanceof AuthorizationException) {
            return [
                'authorization' => [__('This action is unauthorized.')],
            ];
        }

        return [
            'error' => [$exception->getMessage()],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function rawString(array $payload, string $key): ?string
    {
        $value = $payload[$key] ?? null;

        if (! is_string($value)) {
            return null;
        }

        return $value;
    }
}
