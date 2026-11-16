<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Data;

/**
 * Base for per-table PowerSync CRUD appliers.
 *
 * Owns the DELETE / PUT / PATCH dispatch and payload validation; subclasses
 * implement the table-specific delete, put and patch logic.
 *
 * @template TPut of Data
 * @template TPatch of Data
 */
abstract class PowerSyncCrudAction
{
    use AsAction;

    final public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $this->applyDelete($id, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $this->applyPut($id, $this->putDataClass()::validateAndCreate($raw), $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patchDataClass = $this->patchDataClass();

            if ($patchDataClass === null) {
                throw new \RuntimeException('PATCH is not supported for '.$this->tableName().'.');
            }

            $this->applyPatch($id, $patchDataClass::validateAndCreate($raw), $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for '.$this->tableName().': '.$op);
    }

    /**
     * Upload table name, used in error messages.
     */
    abstract protected function tableName(): string;

    /**
     * @return class-string<TPut>
     */
    abstract protected function putDataClass(): string;

    /**
     * Null when the table does not accept PATCH.
     *
     * @return class-string<TPatch>|null
     */
    abstract protected function patchDataClass(): ?string;

    abstract protected function applyDelete(string $id, string $userId): void;

    /**
     * @param  TPut  $data
     */
    abstract protected function applyPut(string $id, Data $data, string $userId): void;

    /**
     * @param  TPatch  $data
     */
    protected function applyPatch(string $id, Data $data, string $userId): void
    {
        throw new \LogicException(static::class.' declares a patch data class but does not apply patches.');
    }

    /**
     * Authorization hook shared by appliers: the user must manage the given program.
     *
     * @throws AuthorizationException
     */
    protected function assertProgramManaged(?string $programId, string $userId): void
    {
        $program = $programId === null ? null : Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }
}
