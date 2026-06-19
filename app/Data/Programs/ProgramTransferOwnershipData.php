<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

#[MergeValidationRules]
final class ProgramTransferOwnershipData extends Data
{
    public function __construct(
        public string $user_id,
    ) {}

    /**
     * @return array<string, list<string>>
     */
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'user_id' => ['required', 'ulid'],
        ];
    }
}
