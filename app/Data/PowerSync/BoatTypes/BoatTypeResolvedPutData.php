<?php

namespace App\Data\PowerSync\BoatTypes;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync boat_types PUT before persistence.
 */
final class BoatTypeResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public string $name,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public static function fromPut(BoatTypePutData $dto): self
    {
        $name = $dto->name;
        $resolvedName = ($name !== null && $name !== '') ? $name : 'Untitled';

        return self::validateAndCreate([
            'program_id' => $dto->program_id,
            'name' => $resolvedName,
        ]);
    }
}
