<?php

namespace App\Data\PowerSync;

use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;

#[MergeValidationRules]
final class PowerSyncUploadBatchData extends Data
{
    /**
     * @param  array<int, array<string, mixed>>  $crud
     */
    public function __construct(
        public array $crud,
    ) {}

    /**
     * @return array<string, list<string|\Illuminate\Contracts\Validation\ValidationRule|\Illuminate\Validation\Rules\In>>
     */
    public static function rules(): array
    {
        return array_merge(
            [
                'crud' => ['required', 'array', 'min:1'],
            ],
            PowerSyncCrudEntryData::prefixedRules('crud.*'),
        );
    }
}
