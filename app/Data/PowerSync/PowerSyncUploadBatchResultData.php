<?php

namespace App\Data\PowerSync;

use Spatie\LaravelData\Data;

final class PowerSyncUploadBatchResultData extends Data
{
    /**
     * @param  list<PowerSyncUploadEntryResultData>  $results
     */
    public function __construct(
        public bool $ok,
        public array $results,
    ) {}

    /**
     * @param  list<PowerSyncUploadEntryResultData>  $results
     */
    public static function fromResults(array $results): self
    {
        return new self(
            ok: true,
            results: $results,
        );
    }
}
