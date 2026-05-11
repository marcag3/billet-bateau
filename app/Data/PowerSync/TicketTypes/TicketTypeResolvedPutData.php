<?php

namespace App\Data\PowerSync\TicketTypes;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync ticket_types PUT before persistence.
 */
final class TicketTypeResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public string $title,
        public ?int $price_cents,
        public bool $is_pay_what_you_can,
        public int $min_per_purchase,
        public ?int $max_per_purchase,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'title' => ['required', 'string', 'max:255'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'is_pay_what_you_can' => ['required', 'boolean'],
            'min_per_purchase' => ['required', 'integer', 'min:0'],
            'max_per_purchase' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public static function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $data = $validator->getData();
            $max = $data['max_per_purchase'] ?? null;
            $min = (int) ($data['min_per_purchase'] ?? 0);
            if ($max !== null && (int) $max < $min) {
                $validator->errors()->add(
                    'max_per_purchase',
                    'Max per purchase must be greater than or equal to min per purchase.',
                );
            }
        });
    }
}
