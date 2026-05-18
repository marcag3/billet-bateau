<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

#[MergeValidationRules]
final class ProgramStoreData extends Data
{
    public function __construct(
        public ?string $id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public bool $is_active,
        public ?bool $is_archived,
        public string $slug,
        public string $start_date,
        public string $end_date,
        public ?AddressUpsertData $address = null,
        /** @var list<string> */
        public array $booking_questions = [],
    ) {}

    /**
     * @return array<string, list<string>>
     */
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'id' => ['nullable', 'ulid'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'theme_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_active' => ['required', 'boolean'],
            'is_archived' => ['sometimes', 'boolean'],
            'slug' => ['required', 'string', 'max:255', 'lowercase', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/u'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'booking_questions' => ['sometimes', 'array', 'max:20'],
            'booking_questions.*' => ['string', 'min:1', 'max:255'],
            'address' => ['nullable', 'array'],
            'address.line_1' => ['nullable', 'string', 'max:255'],
            'address.line_2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:120'],
            'address.postal_code' => ['nullable', 'string', 'max:32'],
            'address.country' => ['nullable', 'string', 'max:120'],
        ];
    }
}
