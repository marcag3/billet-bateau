<?php

namespace App\Data\PowerSync\TicketTypes;

use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync ticket_types PATCH (inner {@code data} object).
 */
final class TicketTypePatchData extends Data
{
    /**
     * @param  array<string, int|null>|string|Optional  $trip_inventory_caps
     */
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $title = new Optional,
        public int|Optional|null $price_cents = new Optional,
        public bool|Optional|null $is_pay_what_you_can = new Optional,
        public int|Optional|null $min_per_purchase = new Optional,
        public int|Optional|null $max_per_purchase = new Optional,
        public array|string|Optional $trip_inventory_caps = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid', 'exists:programs,id'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_pay_what_you_can' => ['sometimes', 'nullable', 'boolean'],
            'min_per_purchase' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_per_purchase' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'trip_inventory_caps' => ['sometimes'],
        ];
    }
}
