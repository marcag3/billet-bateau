<?php

namespace App\Data\PowerSync;

use Spatie\LaravelData\Data;

final class PowerSyncUploadEntryResultData extends Data
{
    /**
     * @param  ?array<string, list<string>>  $errors
     */
    public function __construct(
        public string $id,
        public ?string $type,
        public ?string $op,
        public PowerSyncUploadEntryStatus $status,
        public ?array $errors = null,
    ) {}

    public static function applied(
        string $id,
        ?string $type,
        ?string $op,
    ): self {
        return new self(
            id: $id,
            type: $type,
            op: $op,
            status: PowerSyncUploadEntryStatus::Applied,
        );
    }

    /**
     * @param  array<string, list<string>>  $errors
     */
    public static function rejected(
        string $id,
        ?string $type,
        ?string $op,
        array $errors,
    ): self {
        return new self(
            id: $id,
            type: $type,
            op: $op,
            status: PowerSyncUploadEntryStatus::Rejected,
            errors: $errors,
        );
    }
}
